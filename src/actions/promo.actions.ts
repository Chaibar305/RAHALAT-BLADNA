"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DiscountType } from "@/types";

export type { DiscountType };

// 1. Validation du code promo lors de la réservation par le voyageur
export async function validatePromoCode(input: {
  code: string;
  tripId: string;
  subtotal: number;
}) {
  try {
    const formattedCode = input.code.trim().toUpperCase();

    const db = prisma as any;
    const promo = await db.promoCode.findUnique({
      where: { code: formattedCode },
    });

    if (!promo) {
      return { valid: false, error: "Code promo invalide ou inexistant." };
    }

    if (!promo.isActive) {
      return { valid: false, error: "Ce code promo est actuellement désactivé." };
    }

    const now = new Date();
    if (promo.expiresAt && now > new Date(promo.expiresAt)) {
      return { valid: false, error: "Ce code promo a expiré." };
    }

    if (promo.startDate && now < new Date(promo.startDate)) {
      return { valid: false, error: "Ce code promo n'est pas encore actif." };
    }

    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
      return { valid: false, error: "La limite d'utilisation de ce code a été atteinte." };
    }

    if (promo.targetTripId && promo.targetTripId !== input.tripId) {
      return { valid: false, error: "Ce code promo n'est pas applicable sur ce circuit." };
    }

    if (promo.minBookingAmount && input.subtotal < promo.minBookingAmount) {
      return {
        valid: false,
        error: `Ce code nécessite un panier minimum de ${promo.minBookingAmount} MAD.`,
      };
    }

    // Calcul précis du montant de la réduction
    let discount = 0;
    if (promo.discountType === DiscountType.PERCENTAGE) {
      discount = (input.subtotal * promo.discountValue) / 100;
      if (promo.maxDiscountLimit && discount > promo.maxDiscountLimit) {
        discount = promo.maxDiscountLimit;
      }
    } else {
      discount = promo.discountValue;
    }

    // La réduction ne peut pas excéder le montant total
    discount = Math.min(discount, input.subtotal);
    const newTotal = Math.max(0, input.subtotal - discount);

    return {
      valid: true,
      promoId: promo.id,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount: Math.round(discount),
      newTotal: Math.round(newTotal),
    };
  } catch (error: any) {
    console.error("Erreur validation code promo:", error);
    return { valid: false, error: "Erreur lors de la vérification du coupon." };
  }
}

// 2. Récupération de tous les codes promo pour l'espace Admin
export async function getPromoCodes() {
  try {
    const db = prisma as any;
    const promos = await db.promoCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        targetTrip: {
          select: {
            id: true,
            titleFr: true,
            titleAr: true,
            slug: true,
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    return {
      success: true,
      promos: promos.map((p: any) => ({
        ...p,
        discountValue: Number(p.discountValue),
        minBookingAmount: p.minBookingAmount ? Number(p.minBookingAmount) : null,
        maxDiscountLimit: p.maxDiscountLimit ? Number(p.maxDiscountLimit) : null,
        startDate: p.startDate ? new Date(p.startDate).toISOString() : null,
        expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString() : null,
        createdAt: new Date(p.createdAt).toISOString(),
        updatedAt: new Date(p.updatedAt).toISOString(),
      })),
    };
  } catch (err: any) {
    console.error("Erreur récupération codes promo:", err);
    return { success: false, error: err.message || "Erreur serveur.", promos: [] };
  }
}

// 3. Circuits disponibles pour le ciblage sélectif
export async function getTripsForPromoSelect() {
  try {
    const trips = await prisma.trip.findMany({
      where: { publishStatus: "PUBLISHED" },
      select: {
        id: true,
        titleFr: true,
        titleAr: true,
        slug: true,
      },
      orderBy: { titleFr: "asc" },
    });
    return trips;
  } catch (err) {
    console.error("Erreur getTripsForPromoSelect:", err);
    return [];
  }
}

// 4. Création ou modification d'un code promo par l'administrateur
export async function savePromoCode(data: {
  id?: string;
  code: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number | string;
  minBookingAmount?: number | string | null;
  maxDiscountLimit?: number | string | null;
  maxUses?: number | string | null;
  expiresAt?: string | null;
  isActive?: boolean;
  targetTripId?: string | null;
}) {
  try {
    const code = data.code.trim().toUpperCase();
    if (!code) {
      return { success: false, error: "Le code est obligatoire." };
    }

    const discountVal = parseFloat(String(data.discountValue));
    if (isNaN(discountVal) || discountVal <= 0) {
      return { success: false, error: "La valeur de réduction doit être positive." };
    }

    if (data.discountType === DiscountType.PERCENTAGE && discountVal > 100) {
      return { success: false, error: "Un pourcentage ne peut excéder 100%." };
    }

    const payload: any = {
      code,
      description: data.description ? data.description.trim() : null,
      discountType: data.discountType,
      discountValue: discountVal,
      minBookingAmount: data.minBookingAmount ? parseFloat(String(data.minBookingAmount)) : null,
      maxDiscountLimit: data.maxDiscountLimit ? parseFloat(String(data.maxDiscountLimit)) : null,
      maxUses: data.maxUses ? parseInt(String(data.maxUses), 10) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: data.isActive ?? true,
      targetTripId: data.targetTripId && data.targetTripId !== "ALL" ? data.targetTripId : null,
    };

    const db = prisma as any;

    if (data.id) {
      await db.promoCode.update({
        where: { id: data.id },
        data: payload,
      });
    } else {
      // Vérifier unicité du code
      const existing = await db.promoCode.findUnique({ where: { code } });
      if (existing) {
        return { success: false, error: `Le code "${code}" existe déjà.` };
      }
      await db.promoCode.create({ data: payload });
    }

    revalidatePath("/[locale]/admin/promos", "page");
    return { success: true };
  } catch (err: any) {
    console.error("Erreur enregistrement code promo:", err);
    return { success: false, error: err.message || "Erreur lors de l'enregistrement." };
  }
}

// 5. Basculer l'activation On/Off en 1 clic
export async function togglePromoStatus(id: string, isActive: boolean) {
  try {
    const db = prisma as any;
    await db.promoCode.update({
      where: { id },
      data: { isActive },
    });
    revalidatePath("/[locale]/admin/promos", "page");
    return { success: true };
  } catch (err: any) {
    console.error("Erreur toggle status:", err);
    return { success: false, error: err.message };
  }
}

// 6. Suppression d'un code promo
export async function deletePromoCode(id: string) {
  try {
    const db = prisma as any;
    await db.promoCode.delete({
      where: { id },
    });
    revalidatePath("/[locale]/admin/promos", "page");
    return { success: true };
  } catch (err: any) {
    console.error("Erreur suppression code promo:", err);
    return { success: false, error: err.message || "Impossible de supprimer ce code." };
  }
}
