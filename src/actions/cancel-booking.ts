"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { BookingStatus, InvoiceStatus, NotificationType, PaymentStatus } from "@prisma/client";

export interface CancelBookingResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Server Action : Annulation d'une réservation par le voyageur
 * Accessible depuis /mon-compte/reservations
 */
export async function cancelBookingAction(
  bookingId: string,
  reason?: string,
  details?: string
): Promise<CancelBookingResult> {
  try {
    // 1. Contrôle d'accès et authentification
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return {
        success: false,
        error: "Vous devez être connecté pour effectuer cette action.",
      };
    }

    const sessionUserId = (session.user as any)?.id;
    const sessionEmail = session.user.email;

    // 2. Recherche et vérification de la réservation
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        trip: true,
        departureDate: true,
        travelers: true,
        invoice: true,
      },
    });

    if (!booking) {
      return {
        success: false,
        error: "Dossier de réservation introuvable.",
      };
    }

    // Vérification de propriété : seul le client propriétaire (ou un SUPER_ADMIN) peut annuler
    const isOwner =
      booking.userId === sessionUserId ||
      booking.user?.email?.toLowerCase() === sessionEmail.toLowerCase();
    const isAdmin = (session.user as any)?.role === "SUPER_ADMIN" || (session.user as any)?.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: "Accès refusé. Vous ne pouvez annuler que vos propres réservations.",
      };
    }

    // Vérification de l'état actuel : déjà annulé ?
    if (
      booking.status === BookingStatus.CANCELLED_BY_CLIENT ||
      booking.status === BookingStatus.CANCELLED_BY_ADMIN ||
      booking.status === BookingStatus.CANCELLED ||
      (booking.status as any) === "ANNULEE"
    ) {
      return {
        success: false,
        error: "Cette réservation est déjà annulée.",
      };
    }

    // Motif formaté
    const formattedReason = [
      reason || "Non précisé",
      details ? `Précisions : ${details.trim()}` : null,
    ]
      .filter(Boolean)
      .join(" - ");

    const clientName = booking.user?.fullName || booking.user?.name || "Client";
    const tripTitle = booking.trip?.titleFr || "Circuit";
    const passengerCount = booking.travelers.length || 1;

    // 3. Transaction atomique Prisma
    await prisma.$transaction(async (tx) => {
      // A. Mettre à jour le statut du booking en CANCELLED_BY_CLIENT, date d'annulation et motif
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED_BY_CLIENT,
          cancelledAt: new Date(),
          cancellationReason: formattedReason,
          paymentStatus: PaymentStatus.REJECTED,
          notes: `${booking.notes ? booking.notes + "\n" : ""}[ANNULATION VOYAGEUR ${new Date().toLocaleDateString("fr-FR")}]: ${formattedReason}`,
        },
      });

      // B. Rejeter les paiements en attente
      await tx.payment.updateMany({
        where: {
          bookingId,
          status: { in: [PaymentStatus.PENDING, "EN_ATTENTE" as any] },
        },
        data: {
          status: PaymentStatus.REJECTED,
          verifiedAt: new Date(),
          verifiedBy: clientName,
        },
      });

      // C. Annuler la facture rattachée si existante
      if (booking.invoice) {
        await tx.invoice.update({
          where: { id: booking.invoice.id },
          data: { status: InvoiceStatus.ANNULEE },
        });
      }

      // D. Libération des Quotas sur la date de départ
      if (booking.departureDateId) {
        const dep = await tx.departureDate.findUnique({
          where: { id: booking.departureDateId },
        });

        if (dep) {
          const newOccupied = Math.max(0, (dep.occupiedSeats || 0) - passengerCount);

          // Si le voyage était complet, le réouvrir
          let newStatus = dep.status;
          if (dep.status === "SOLD_OUT") {
            newStatus =
              newOccupied >= dep.minSeatsForGuaranteed
                ? "GUARANTEED"
                : "OPEN_FOR_BOOKING";
          }

          await tx.departureDate.update({
            where: { id: booking.departureDateId },
            data: {
              occupiedSeats: newOccupied,
              status: newStatus,
            },
          });
        }
      }

      // D. Création d'une Notification pour le Super Admin
      const adminRecipient = await tx.user.findFirst({
        where: {
          OR: [{ role: "SUPER_ADMIN" }, { role: "AGENCY_ADMIN" }],
        },
        orderBy: { createdAt: "asc" },
      });

      if (adminRecipient) {
        await tx.notification.create({
          data: {
            userId: adminRecipient.id,
            title: `Annulation Dossier [${booking.reference}]`,
            message: `Annulation Dossier [${booking.reference}] par ${clientName} pour le circuit [${tripTitle}] (Motif: ${formattedReason})`,
            type: NotificationType.ADMIN_ALERT,
            linkUrl: `/fr/admin/bookings`,
            isRead: false,
          },
        });
      }
    });

    // 4. Revalidation des caches Next.js
    revalidatePath("/mon-compte/reservations");
    revalidatePath("/fr/mon-compte/reservations");
    revalidatePath("/ar/mon-compte/reservations");
    revalidatePath("/admin/bookings");
    revalidatePath("/fr/admin/bookings");
    revalidatePath("/ar/admin/bookings");
    revalidatePath(`/trips/${booking.trip.slug}`);

    return {
      success: true,
      message: "Votre réservation a été annulée avec succès. Les places ont été libérées.",
    };
  } catch (error: any) {
    console.error("❌ [cancelBookingAction] Erreur :", error);
    return {
      success: false,
      error: error.message || "Une erreur est survenue lors de l'annulation.",
    };
  }
}
