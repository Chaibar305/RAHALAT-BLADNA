"use server";

import { prisma } from "@/lib/prisma";

/**
 * Retourne les compteurs dynamiques pour la sidebar admin.
 * Appelé côté client via useEffect pour éviter le rendu SSR bloquant.
 */
export async function getAdminSidebarCountsAction() {
  try {
    const [bookingsCount, pendingPaymentsCount] = await Promise.all([
      prisma.booking.count(),
      prisma.payment.count({ where: { status: "EN_ATTENTE" } }),
    ]);

    return { success: true, bookingsCount, pendingPaymentsCount };
  } catch (error) {
    console.error("Erreur getAdminSidebarCountsAction:", error);
    return { success: false, bookingsCount: 0, pendingPaymentsCount: 0 };
  }
}
