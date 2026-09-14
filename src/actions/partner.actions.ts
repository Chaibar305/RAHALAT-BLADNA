"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/adminAuth";
import { PartnerType, PartnerStatus } from "@prisma/client";

/**
 * Récupère tous les partenaires (Hôtels & Transporteurs)
 */
export async function getPartnersAction(type?: PartnerType) {
  await requireAdminSession("VIEW_PARTNERS");

  try {
    const where = type ? { type } : {};
    const partners = await prisma.partner.findMany({
      where,
      orderBy: { companyName: "asc" },
      include: {
        tripPartners: {
          include: { trip: true },
        },
      },
    });

    return { success: true, partners };
  } catch (error: any) {
    console.error("Erreur getPartnersAction:", error);
    return { success: false, partners: [], error: error.message };
  }
}

/**
 * Crée un nouveau partenaire
 */
export async function createPartnerAction(data: {
  type: PartnerType;
  companyName: string;
  contactName: string;
  phone: string;
  city: string;
  email?: string;
  notes?: string;
  rateDetails?: string;
  capacity?: number;
  vehicleType?: string;
  plateNumber?: string;
  activityType?: string;
}) {
  try {
    await requireAdminSession("CREATE_PARTNER");
  } catch {
    return { success: false, error: "Session expirée. Veuillez vous reconnecter." };
  }

  try {
    const partner = await prisma.partner.create({
      data: {
        type: data.type,
        companyName: data.companyName.trim(),
        contactName: data.contactName.trim(),
        phone: data.phone.trim(),
        city: data.city.trim(),
        rateDetails: data.rateDetails?.trim() || null,
        capacity: data.capacity && data.capacity > 0 ? data.capacity : null,
        vehicleType: data.vehicleType?.trim() || null,
        plateNumber: data.plateNumber?.trim() || null,
        activityType: data.activityType?.trim() || null,
        email: data.email?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    });

    revalidatePath("/admin/partners");
    revalidatePath("/admin/trips");

    return { success: true, partner };
  } catch (error: any) {
    console.error("Erreur createPartnerAction:", error);
    return { success: false, error: error.message || "Erreur lors de la création du partenaire" };
  }
}

/**
 * Met à jour un partenaire existant
 */
export async function updatePartnerAction(
  id: string,
  data: {
    type: PartnerType;
    companyName: string;
    contactName: string;
    phone: string;
    city: string;
    email?: string;
    notes?: string;
    rateDetails?: string;
    capacity?: number;
    vehicleType?: string;
    plateNumber?: string;
    activityType?: string;
  }
) {
  try {
    await requireAdminSession("UPDATE_PARTNER");
  } catch {
    return { success: false, error: "Session expirée. Veuillez vous reconnecter." };
  }

  try {
    const partner = await prisma.partner.update({
      where: { id },
      data: {
        type: data.type,
        companyName: data.companyName.trim(),
        contactName: data.contactName.trim(),
        phone: data.phone.trim(),
        city: data.city.trim(),
        rateDetails: data.rateDetails?.trim() || null,
        capacity: data.capacity && data.capacity > 0 ? data.capacity : null,
        vehicleType: data.vehicleType?.trim() || null,
        plateNumber: data.plateNumber?.trim() || null,
        activityType: data.activityType?.trim() || null,
        email: data.email?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    });

    revalidatePath("/admin/partners");
    revalidatePath("/admin/trips");

    return { success: true, partner };
  } catch (error: any) {
    console.error("Erreur updatePartnerAction:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Supprime un partenaire
 */
export async function deletePartnerAction(id: string) {
  try {
    await prisma.tripPartner.deleteMany({ where: { partnerId: id } });
    await prisma.partner.delete({ where: { id } });

    revalidatePath("/admin/partners");
    revalidatePath("/fr/admin/partners");
    revalidatePath("/ar/admin/partners");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur deletePartnerAction:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Récupère les partenaires assignés à un circuit
 */
export async function getTripPartnerAssignmentsAction(tripId: string) {
  await requireAdminSession("VIEW_TRIP_PARTNERS");

  try {
    const assignments = await prisma.tripPartner.findMany({
      where: { tripId },
      include: { partner: true },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, assignments };
  } catch (error: any) {
    console.error("Erreur getTripPartnerAssignmentsAction:", error);
    return { success: false, assignments: [], error: error.message };
  }
}

/**
 * Assigne un partenaire à un circuit
 */
export async function assignPartnerToTripAction(data: {
  tripId: string;
  partnerId: string;
  status?: PartnerStatus;
  negotiatedCost?: number;
  driverAssigned?: string;
  notes?: string;
}) {
  try {
    // Vérification anti-doublons
    const existing = await prisma.tripPartner.findFirst({
      where: {
        tripId: data.tripId,
        partnerId: data.partnerId,
      },
    });

    if (existing) {
      return { success: false, error: "Ce prestataire est déjà associé à ce circuit." };
    }

    const assignment = await prisma.tripPartner.create({
      data: {
        tripId: data.tripId,
        partnerId: data.partnerId,
        status: data.status || "EN_ATTENTE",
        negotiatedCost: data.negotiatedCost !== undefined ? data.negotiatedCost : null,
        driverAssigned: data.driverAssigned || null,
        notes: data.notes || null,
        confirmedAt: data.status === "ACCEPTE" ? new Date() : null,
      },
    });

    revalidatePath(`/admin/trips/${data.tripId}/partenaires`);
    revalidatePath(`/fr/admin/trips/${data.tripId}/partenaires`);
    revalidatePath(`/ar/admin/trips/${data.tripId}/partenaires`);
    revalidatePath(`/admin/trips/${data.tripId}/rentabilite`);
    revalidatePath(`/admin/manifests`);

    return { success: true, assignment };
  } catch (error: any) {
    console.error("Erreur assignPartnerToTripAction:", error);
    return { success: false, error: error.message || "Erreur d'association du partenaire" };
  }
}

/**
 * Met à jour le statut d'un partenaire sur un circuit
 */
export async function updateTripPartnerStatusAction(
  tripPartnerId: string,
  status: PartnerStatus,
  tripId: string
) {
  try {
    const updated = await prisma.tripPartner.update({
      where: { id: tripPartnerId },
      data: {
        status,
        confirmedAt: status === "ACCEPTE" ? new Date() : null,
      },
    });

    revalidatePath(`/admin/trips/${tripId}/partenaires`);
    revalidatePath(`/fr/admin/trips/${tripId}/partenaires`);
    revalidatePath(`/ar/admin/trips/${tripId}/partenaires`);
    revalidatePath(`/admin/trips/${tripId}/rentabilite`);
    revalidatePath(`/admin/manifests`);

    return { success: true, assignment: updated };
  } catch (error: any) {
    console.error("Erreur updateTripPartnerStatusAction:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Retire un partenaire d'un circuit
 */
export async function removePartnerFromTrip(tripPartnerId: string, tripId: string) {
  try {
    await prisma.tripPartner.delete({
      where: { id: tripPartnerId },
    });

    revalidatePath(`/admin/trips/${tripId}/partenaires`);
    revalidatePath(`/fr/admin/trips/${tripId}/partenaires`);
    revalidatePath(`/ar/admin/trips/${tripId}/partenaires`);
    revalidatePath(`/admin/trips/${tripId}/rentabilite`);
    revalidatePath(`/admin/manifests`);

    return { success: true };
  } catch (error: any) {
    console.error("Erreur suppression liaison partenaire :", error);
    return { success: false, error: error.message };
  }
}

export const removePartnerFromTripAction = removePartnerFromTrip;

/**
 * Règle métier obligatoire : un circuit ne peut pas passer au statut "publié"
 * si aucun hôtel ni aucun transporteur n'a le statut ACCEPTE.
 */
export async function canPublishTripAction(tripId: string) {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { durationDays: true },
    });

    const isMultiDay = (trip?.durationDays || 1) >= 2;

    const assignments = await prisma.tripPartner.findMany({
      where: { tripId, status: "ACCEPTE" },
      include: { partner: true },
    });

    const hasAcceptedHotel = assignments.some(
      (a) => a.partner.type === "HOTEL_AUBERGE" || a.partner.type === "HOTEL_BIVOUAC"
    );
    const hasAcceptedTransport = assignments.some(
      (a) => a.partner.type === "TRANSPORT_TOURISTIQUE" || a.partner.type === "TRANSPORTER_TIST"
    );

    const canPublish = isMultiDay
      ? hasAcceptedHotel && hasAcceptedTransport
      : hasAcceptedTransport;

    let reason: string | null = null;
    if (!hasAcceptedTransport && isMultiDay && !hasAcceptedHotel) {
      reason = "Un transporteur TIST et un hébergement au statut ACCEPTE sont obligatoires pour publier ce circuit.";
    } else if (!hasAcceptedTransport) {
      reason = "Au moins un transporteur TIST au statut ACCEPTE est requis pour valider le circuit.";
    } else if (isMultiDay && !hasAcceptedHotel) {
      reason = "Au moins un hébergement (Hôtel ou Bivouac) au statut ACCEPTE est requis pour les circuits de 2 jours ou plus.";
    }

    return {
      canPublish,
      hasAcceptedHotel,
      hasAcceptedTransport,
      isMultiDay,
      reason,
    };
  } catch (error: any) {
    console.error("Erreur canPublishTripAction:", error);
    return { canPublish: false, error: error.message };
  }
}

/**
 * Import massif de partenaires depuis un fichier Excel
 */
export async function bulkImportPartnersAction(records: {
  type: PartnerType;
  companyName: string;
  contactName: string;
  phone: string;
  city: string;
  email?: string;
  notes?: string;
  rateDetails?: string;
  capacity?: number;
  vehicleType?: string;
  plateNumber?: string;
  activityType?: string;
}[]) {
  await requireAdminSession("CREATE_PARTNER");

  if (!records || records.length === 0) {
    return { success: false, error: "Aucun partenaire à importer." };
  }

  try {
    let importedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      try {
        const created = await prisma.partner.create({
          data: {
            type: rec.type,
            companyName: rec.companyName,
            contactName: rec.contactName || rec.companyName,
            phone: rec.phone,
            city: rec.city || "Maroc",
            rateDetails: rec.rateDetails || null,
            capacity: rec.capacity !== undefined ? rec.capacity : null,
            vehicleType: rec.vehicleType || null,
            plateNumber: rec.plateNumber || null,
            activityType: rec.activityType || null,
          },
        });

        if (rec.email || rec.notes) {
          await prisma.$executeRawUnsafe(
            'UPDATE "Partner" SET "email" = $1, "notes" = $2 WHERE id = $3',
            rec.email || null,
            rec.notes || null,
            created.id
          );
        }
        importedCount++;
      } catch (err: any) {
        errors.push(`Erreur sur "${rec.companyName}": ${err.message}`);
      }
    }

    revalidatePath("/admin/partners");
    revalidatePath("/admin/trips");

    return {
      success: true,
      count: importedCount,
      errors,
    };
  } catch (error: any) {
    console.error("Erreur bulkImportPartnersAction:", error);
    return { success: false, error: error.message || "Erreur lors de l'import massif des partenaires." };
  }
}
