"use server";

import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";

/**
 * Retourne les compteurs dynamiques pour la sidebar admin.
 * Appelé côté client via useEffect pour éviter le rendu SSR bloquant.
 */
export async function getAdminSidebarCountsAction() {
  try {
    const [bookingsCount, pendingPaymentsCount, newApplicationsCount] = await Promise.all([
      prisma.booking.count(),
      prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
      (prisma as any).jobApplication.count({ where: { status: "NOUVELLE" } }),
    ]);

    return { 
      success: true, 
      bookingsCount, 
      pendingPaymentsCount,
      newApplicationsCount 
    };
  } catch (error) {
    console.error("Erreur getAdminSidebarCountsAction:", error);
    return { success: false, bookingsCount: 0, pendingPaymentsCount: 0, newApplicationsCount: 0 };
  }
}
