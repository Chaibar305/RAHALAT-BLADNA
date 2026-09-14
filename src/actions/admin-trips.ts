'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

/**
 * Toggle indépendant d'un circuit planifié cette semaine (support de multi-sélection simultanée)
 */
export async function toggleScheduledThisWeekAction(tripId: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Non autorisé' };

  try {
    const trip = await (prisma.trip as any).findUnique({
      where: { id: tripId },
      select: { isScheduledThisWeek: true, slug: true },
    });

    if (!trip) return { success: false, error: 'Circuit introuvable' };

    const currentScheduled = Boolean(trip.isScheduledThisWeek);

    const updatedTrip = await (prisma.trip as any).update({
      where: { id: tripId },
      data: {
        isScheduledThisWeek: !currentScheduled,
      },
    });

    revalidatePath('/admin/trips');
    revalidatePath('/trips');
    if (trip.slug) {
      revalidatePath(`/trips/${trip.slug}`);
    }
    revalidatePath('/');
    return { success: true, isScheduled: Boolean(updatedTrip.isScheduledThisWeek) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Active / Désactive un circuit comme « Circuit Planifié cette Semaine » avec message personnalisé optionnel
 * Sans désactiver les autres circuits (multi-sélection autorisée)
 */
export async function setTripScheduledThisWeekAction(
  tripId: string,
  isScheduled: boolean,
  featuredMessage?: string | null
) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Non autorisé' };

  try {
    const updated = await (prisma.trip as any).update({
      where: { id: tripId },
      data: {
        isScheduledThisWeek: isScheduled,
        featuredWeekMessage: isScheduled ? (featuredMessage || null) : null,
      },
      select: {
        id: true,
        titleFr: true,
        titleAr: true,
        slug: true,
        isScheduledThisWeek: true,
        featuredWeekMessage: true,
      },
    });

    revalidatePath('/admin/trips');
    revalidatePath('/trips');
    revalidatePath(`/trips/${updated.slug}`);
    revalidatePath('/');

    return { success: true, trip: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Erreur mise à jour circuit vedette" };
  }
}
