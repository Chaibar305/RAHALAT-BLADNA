"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/adminAuth";
import { 
  generateClientsListExcel, 
  generateAllPassengersRegistryExcel,
  ClientExportItem,
  PassengerRegistryExportItem 
} from "@/lib/excel/excelService";
import { TravelerCategory, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { updateClientByAdmin as updateClientByAdminImpl } from "./admin-clients";

/**
 * Met à jour les informations nominatives d'un passager (correction CIN, nom, etc.)
 */
export async function updatePassengerAction(
  passengerId: string,
  data: {
    fullName: string;
    cinPassport: string;
    phone?: string;
    pickupCity?: string;
    roomType?: string;
    category?: string;
  }
) {
  await requireAdminSession("UPDATE_PASSENGER");

  try {
    if (!passengerId) {
      return { success: false, error: "Identifiant de passager invalide." };
    }
    if (!data.fullName || data.fullName.trim().length < 2) {
      return { success: false, error: "Le nom complet est obligatoire (min 2 caractères)." };
    }
    if (!data.cinPassport || data.cinPassport.trim().length < 2) {
      return { success: false, error: "Le numéro de CIN ou Passeport est obligatoire." };
    }

    const updated = await prisma.traveler.update({
      where: { id: passengerId },
      data: {
        fullName: data.fullName.trim(),
        cinPassport: data.cinPassport.trim().toUpperCase(),
        phone: data.phone?.trim() || null,
        pickupCity: data.pickupCity?.trim() || null,
        roomType: data.roomType?.trim() || null,
        category: (data.category as TravelerCategory) || TravelerCategory.ADULTE,
      },
      include: {
        booking: {
          include: {
            trip: true,
            user: true,
          },
        },
      },
    });

    revalidatePath("/admin/clients");
    revalidatePath(`/admin/trips/${updated.booking.tripId}/voyageurs`);

    return {
      success: true,
      message: "Passager mis à jour avec succès.",
      passenger: {
        id: updated.id,
        fullName: updated.fullName,
        cinPassport: updated.cinPassport,
        phone: updated.phone || "",
        pickupCity: updated.pickupCity || "",
        roomType: updated.roomType || "",
        category: updated.category,
      },
    };
  } catch (error: any) {
    console.error("[updatePassengerAction] Error:", error);
    return { success: false, error: error.message || "Erreur lors de la mise à jour du passager." };
  }
}

/**
 * Bascule le statut de présence à bord (pointage d'embarquement)
 */
export async function togglePassengerCheckInAction(passengerId: string) {
  await requireAdminSession("TOGGLE_PASSENGER_CHECKIN");

  try {
    const existing = await prisma.traveler.findUnique({
      where: { id: passengerId },
      select: { id: true, isCheckedIn: true, booking: { select: { tripId: true } } },
    });

    if (!existing) {
      return { success: false, error: "Passager introuvable." };
    }

    const newStatus = !existing.isCheckedIn;

    await prisma.traveler.update({
      where: { id: passengerId },
      data: { isCheckedIn: newStatus },
    });

    revalidatePath("/admin/clients");
    if (existing.booking?.tripId) {
      revalidatePath(`/admin/trips/${existing.booking.tripId}/voyageurs`);
    }

    return { success: true, isCheckedIn: newStatus };
  } catch (error: any) {
    console.error("[togglePassengerCheckInAction] Error:", error);
    return { success: false, error: error.message || "Impossible de mettre à jour le pointage." };
  }
}

/**
 * Exporte la liste complète des clients (CRM & Fidélité) en Excel
 */
export async function exportClientsExcelAction() {
  await requireAdminSession("EXPORT_CLIENTS_EXCEL");

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { role: "CLIENT" },
          { bookings: { some: {} } },
        ],
      },
      include: {
        bookings: {
          select: {
            id: true,
            totalAmount: true,
            amountPaid: true,
            status: true,
            paymentStatus: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const exportData: ClientExportItem[] = users.map((u) => {
      const validBookings = u.bookings.filter((b) => b.status !== "ANNULEE");
      const totalSpent = validBookings.reduce((sum, b) => sum + Number(b.amountPaid || 0), 0);

      return {
        id: u.id,
        fullName: u.fullName || u.name || "Client Sans Nom",
        email: u.email,
        phone: u.phone || "—",
        city: u.city || "Casablanca",
        bookingsCount: validBookings.length,
        totalSpentMAD: Math.round(totalSpent),
        registeredAt: new Date(u.createdAt).toLocaleDateString("fr-FR"),
      };
    });

    const buffer = generateClientsListExcel(exportData);
    const base64 = buffer.toString("base64");
    const dateStr = new Date().toISOString().split("T")[0];

    return {
      success: true,
      base64,
      filename: `clients_crm_rahalat_bladna_${dateStr}.xlsx`,
    };
  } catch (error: any) {
    console.error("[exportClientsExcelAction] Error:", error);
    return { success: false, error: error.message || "Erreur lors de l'exportation des clients." };
  }
}

/**
 * Exporte le registre nominatif des passagers en Excel (conforme TIST & Gendarmerie)
 */
export async function exportAllPassengersExcelAction(filters?: {
  tripId?: string;
  pickupCity?: string;
  paymentStatus?: string;
  search?: string;
}) {
  await requireAdminSession("EXPORT_PASSENGERS_EXCEL");

  try {
    const whereClause: any = {};

    if (filters?.tripId && filters.tripId !== "ALL") {
      whereClause.booking = { ...whereClause.booking, tripId: filters.tripId };
    }

    if (filters?.paymentStatus && filters.paymentStatus !== "ALL") {
      whereClause.booking = { ...whereClause.booking, paymentStatus: filters.paymentStatus };
    }

    if (filters?.pickupCity && filters.pickupCity !== "ALL") {
      whereClause.pickupCity = { contains: filters.pickupCity, mode: "insensitive" };
    }

    const travelers = await prisma.traveler.findMany({
      where: whereClause,
      include: {
        booking: {
          include: {
            trip: true,
            user: true,
            departureDate: true,
          },
        },
      },
      orderBy: { fullName: "asc" },
    });

    const exportData: PassengerRegistryExportItem[] = travelers.map((t) => {
      const departureDate = t.booking?.departureDate?.startDate
        ? new Date(t.booking.departureDate.startDate).toLocaleDateString("fr-FR")
        : "—";

      let paymentLabel = "Non Payé";
      if (t.booking?.paymentStatus === "PAYE_INTEGRALEMENT") paymentLabel = "Payé 100%";
      else if (t.booking?.paymentStatus === "ACOMPTE_VERSE") paymentLabel = "Acompte Versé";
      else if (t.booking?.paymentStatus === "SOLDE_VERSE") paymentLabel = "Solde Versé";

      return {
        id: t.id,
        fullName: t.fullName,
        cinOrPassport: t.cinPassport,
        phone: t.phone || t.booking?.user?.phone || "—",
        tripTitle: t.booking?.trip?.titleFr || "Circuit",
        departureDate,
        pickupCity: t.pickupCity || t.booking?.user?.city || "Casablanca",
        bookingReference: t.booking?.reference || "—",
        roomType: t.roomType || "Double Twin",
        paymentStatus: paymentLabel,
        isCheckedIn: !!t.isCheckedIn,
      };
    });

    const buffer = generateAllPassengersRegistryExcel(exportData);
    const base64 = buffer.toString("base64");
    const dateStr = new Date().toISOString().split("T")[0];

    return {
      success: true,
      base64,
      filename: `registre_voyageurs_tist_${dateStr}.xlsx`,
    };
  } catch (error: any) {
    console.error("[exportAllPassengersExcelAction] Error:", error);
    return { success: false, error: error.message || "Erreur lors de l'exportation du registre." };
  }
}

/**
 * Admin Action : Met à jour les informations d'un compte client
 */
export async function updateClientAdminAction(
  clientId: string,
  data: {
    fullName: string;
    email: string;
    phone?: string;
    cinOrPassport?: string;
    city?: string;
    role?: UserRole;
    newPassword?: string;
  }
) {
  await requireAdminSession("UPDATE_CLIENT_ADMIN");

  try {
    if (!clientId) {
      return { success: false, error: "Identifiant client manquant." };
    }
    if (!data.fullName || data.fullName.trim().length < 2) {
      return { success: false, error: "Le nom complet est obligatoire (min 2 caractères)." };
    }
    if (!data.email || !data.email.includes("@")) {
      return { success: false, error: "Adresse email invalide." };
    }

    // Vérifier si un autre utilisateur utilise déjà cet email
    const emailConflict = await prisma.user.findFirst({
      where: {
        email: { equals: data.email.trim(), mode: "insensitive" },
        id: { not: clientId },
      },
    });

    if (emailConflict) {
      return { success: false, error: "Cette adresse email est déjà utilisée par un autre compte." };
    }

    // Vérifier conflit éventuel sur le numéro de téléphone si renseigné
    if (data.phone && data.phone.trim()) {
      const phoneConflict = await prisma.user.findFirst({
        where: {
          phone: data.phone.trim(),
          id: { not: clientId },
        },
      });
      if (phoneConflict) {
        return { success: false, error: "Ce numéro de téléphone est déjà associé à un autre compte." };
      }
    }

    const updateData: any = {
      name: data.fullName.trim(),
      fullName: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      cinOrPassport: data.cinOrPassport?.trim().toUpperCase() || null,
      city: data.city?.trim() || null,
      role: data.role || undefined,
      isProfileComplete: true,
    };

    // Si un nouveau mot de passe est renseigné, le hacher avec bcrypt
    if (data.newPassword && data.newPassword.trim().length >= 6) {
      updateData.passwordHash = await bcrypt.hash(data.newPassword.trim(), 12);
    }

    const updated = await prisma.user.update({
      where: { id: clientId },
      data: updateData,
      include: {
        accounts: { select: { provider: true } },
      },
    });

    revalidatePath("/admin/clients");
    revalidatePath("/admin/bookings");
    revalidatePath("/mon-compte/profil");

    return {
      success: true,
      message: data.newPassword
        ? "Coordonnées et nouveau mot de passe enregistrés !"
        : "Coordonnées du client mises à jour avec succès.",
      client: {
        id: updated.id,
        fullName: updated.fullName || updated.name || "Client",
        email: updated.email,
        phone: updated.phone || "—",
        cinOrPassport: updated.cinOrPassport || "",
        city: updated.city || "Casablanca",
        role: updated.role,
        isBlocked: updated.isBlocked,
        blockedReason: updated.blockedReason,
        hasPassword: !!updated.passwordHash,
        isGoogleAuth: !updated.passwordHash || updated.accounts.some((a) => a.provider === "google"),
      },
    };
  } catch (error: any) {
    console.error("[updateClientAdminAction] Error:", error);
    return { success: false, error: error.message || "Erreur lors de la mise à jour du client." };
  }
}

export async function updateClientByAdmin(
  userId: string,
  data: {
    name: string;
    phone: string;
    cin?: string;
    city?: string;
    email: string;
    newPassword?: string;
    role?: UserRole;
  }
) {
  return updateClientByAdminImpl(userId, data);
}

/**
 * Admin Action : Bloque ou Débloque l'accès d'un compte client
 */
export async function toggleBlockUserAction(
  userId: string,
  isBlocked: boolean,
  blockedReason?: string
) {
  const { user: currentAdmin } = await requireAdminSession("TOGGLE_BLOCK_USER");

  try {
    if (!userId) {
      return { success: false, error: "Identifiant utilisateur manquant." };
    }

    // Protection essentielle : un administrateur ne peut pas se bloquer lui-même
    if (userId === currentAdmin.id) {
      return { success: false, error: "Action interdite : vous ne pouvez pas bloquer votre propre compte administrateur." };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return { success: false, error: "Utilisateur introuvable." };
    }

    // Empêcher le blocage d'un SUPER_ADMIN par un autre rôle sauf super admin
    if (targetUser.role === "SUPER_ADMIN" && currentAdmin.role !== "SUPER_ADMIN") {
      return { success: false, error: "Privilèges insuffisants pour modifier un compte Super-Administrateur." };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isBlocked,
        blockedReason: isBlocked ? (blockedReason?.trim() || "Compte suspendu par l'administration") : null,
      },
    });

    // Invalider les sessions actives si blocage
    if (isBlocked) {
      await prisma.session.deleteMany({
        where: { userId },
      });
    }

    revalidatePath("/admin/clients");
    revalidatePath("/admin/bookings");

    return {
      success: true,
      message: isBlocked
        ? `Le compte de ${updated.fullName || updated.name || updated.email} a été suspendu.`
        : `L'accès pour ${updated.fullName || updated.name || updated.email} a été débloqué.`,
      isBlocked: updated.isBlocked,
      blockedReason: updated.blockedReason,
    };
  } catch (error: any) {
    console.error("[toggleBlockUserAction] Error:", error);
    return { success: false, error: error.message || "Erreur lors de la modification de l'accès." };
  }
}

/**
 * Admin Action : Supprime définitivement un compte client et son historique
 */
export async function deleteClientAdminAction(clientId: string) {
  const { user: currentAdmin } = await requireAdminSession("DELETE_CLIENT_ADMIN");

  try {
    if (!clientId) {
      return { success: false, error: "Identifiant client manquant." };
    }

    // Protection : interdiction de supprimer son propre compte
    if (clientId === currentAdmin.id) {
      return { success: false, error: "Action interdite : vous ne pouvez pas supprimer votre propre compte." };
    }

    const client = await prisma.user.findUnique({
      where: { id: clientId },
      include: {
        bookings: {
          include: {
            departureDate: true,
          },
        },
      },
    });

    if (!client) {
      return { success: false, error: "Compte client introuvable." };
    }

    // Ne pas autoriser la suppression d'un Super Admin sans être Super Admin
    if (client.role === "SUPER_ADMIN" && currentAdmin.role !== "SUPER_ADMIN") {
      return { success: false, error: "Action interdite sur un compte Super-Administrateur." };
    }

    // Restaurer les places occupées pour les départs futurs actifs si le client a des réservations non annulées
    for (const booking of client.bookings) {
      if (booking.status !== "CANCELLED" && booking.departureDateId && booking.departureDate) {
        const paxCount = await prisma.traveler.count({ where: { bookingId: booking.id } });
        await prisma.departureDate.update({
          where: { id: booking.departureDateId },
          data: {
            occupiedSeats: {
              decrement: paxCount || 1,
            },
          },
        });
      }
    }

    // Supprimer l'utilisateur (le schéma gère la suppression en cascade des réservations, paiements, sessions, etc.)
    await prisma.user.delete({
      where: { id: clientId },
    });

    revalidatePath("/admin/clients");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin");

    return {
      success: true,
      message: `Le compte client ${client.fullName || client.name || client.email} et son historique ont été supprimés.`,
    };
  } catch (error: any) {
    console.error("[deleteClientAdminAction] Error:", error);
    return { success: false, error: error.message || "Erreur lors de la suppression du compte client." };
  }
}

