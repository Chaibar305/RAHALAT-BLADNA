"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Détache un prestataire d'un circuit
 */
export async function removePartnerFromTrip(tripPartnerId: string, tripId: string) {
  try {
    await prisma.tripPartner.delete({
      where: { id: tripPartnerId },
    });

    try {
      revalidatePath(`/admin/trips/${tripId}/partenaires`);
      revalidatePath(`/fr/admin/trips/${tripId}/partenaires`);
      revalidatePath(`/ar/admin/trips/${tripId}/partenaires`);
      revalidatePath(`/admin/trips/${tripId}/rentabilite`);
      revalidatePath(`/fr/admin/trips/${tripId}/rentabilite`);
      revalidatePath(`/ar/admin/trips/${tripId}/rentabilite`);
      revalidatePath(`/admin/manifests`);
    } catch (revalErr) {
      console.warn("revalidatePath notice:", revalErr);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Erreur suppression liaison partenaire :", error);
    return { success: false, error: error.message || "Erreur de suppression" };
  }
}

export const removePartnerFromTripAction = removePartnerFromTrip;
