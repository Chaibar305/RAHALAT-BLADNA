"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logSecurityAudit } from "@/lib/adminAuth";
import { getCurrentTeamMemberPermissions } from "@/lib/teamPermissions";

/**
 * Extraction et normalisation de la référence de réservation depuis un QR Code ou un texte
 */
function extractBookingReference(qrRaw: string): string {
  if (!qrRaw) return "";
  let cleaned = qrRaw.trim();

  // Si c'est une URL (ex: https://rahalatbladna.ma/verify/RB-2026-342873)
  try {
    if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
      const url = new URL(cleaned);
      const segments = url.pathname.split("/").filter(Boolean);
      cleaned = segments[segments.length - 1] || cleaned;
    }
  } catch {
    // Si parsing URL échoue, extraction regex
  }

  // Regex pour attraper le pattern RB-2026-XXXXXX ou similaire
  const rbMatch = cleaned.match(/RB-\d{4}-\w+/i);
  if (rbMatch) {
    return rbMatch[0].toUpperCase();
  }

  return cleaned.toUpperCase();
}

/**
 * 1. Récupère la liste des circuits pour le sélecteur du scanner
 * Sécurisé : restreint aux circuits assignés pour les guides/chauffeurs/tour leaders
 */
export async function getTripsForScannerAction() {
  const permissions = await getCurrentTeamMemberPermissions();

  if (!permissions || !permissions.isActive) {
    logSecurityAudit({
      type: "UNAUTHORIZED_ACCESS_ATTEMPT",
      action: "SCANNER_TRIPS_LIST_DENIED",
      resource: "SCANNER",
    });
    return { success: false, error: "Accès refusé : Profil d'équipe inactif ou suspendu.", trips: [] };
  }

  if (!permissions.canScanTickets) {
    logSecurityAudit({
      type: "PRIVILEGE_ESCALATION_BLOCKED",
      email: permissions.email,
      role: permissions.role,
      action: "SCANNER_TRIPS_LIST_NO_SCAN_PERM",
      resource: "SCANNER",
    });
    return { success: false, error: "Vous ne possédez pas la permission de scanner des billets.", trips: [] };
  }

  try {
    // Filtrage si membre restreint à ses circuits assignés
    const isUnrestricted = permissions.isSuperAdmin || permissions.role === "ORGANIZER";
    const tripFilter: any = {
      publishStatus: { in: ["PUBLISHED", "DRAFT"] },
    };

    if (!isUnrestricted && permissions.assignedTripIds.length > 0) {
      tripFilter.id = { in: permissions.assignedTripIds };
    }

    const trips = await prisma.trip.findMany({
      where: tripFilter,
      include: {
        departureDates: {
          orderBy: { startDate: "asc" },
        },
        pickupPoints: {
          orderBy: { orderIndex: "asc" },
        },
        bookings: {
          where: {
            status: { not: "CANCELLED" },
          },
          include: {
            travelers: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = trips.map((trip) => {
      let totalPassengers = 0;
      let checkedInCount = 0;

      trip.bookings.forEach((b) => {
        b.travelers.forEach((tr) => {
          totalPassengers += 1;
          if (tr.isCheckedIn) {
            checkedInCount += 1;
          }
        });
      });

      const firstDep = trip.departureDates[0];
      const depDateStr = firstDep
        ? new Date(firstDep.startDate).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Date à venir";

      return {
        id: trip.id,
        slug: trip.slug,
        titleFr: trip.titleFr,
        titleAr: trip.titleAr,
        departureDateStr: depDateStr,
        totalSeats: trip.totalSeats || 48,
        totalPassengers,
        checkedInCount,
        hasPassengers: totalPassengers > 0,
      };
    });

    return {
      success: true,
      trips: result,
      operator: {
        fullName: permissions.fullName,
        role: permissions.role,
        canCollectCash: permissions.canCollectCash,
        canViewManifest: permissions.canViewManifest,
      },
    };
  } catch (error: any) {
    console.error("getTripsForScannerAction error:", error);
    return { success: false, error: error.message || "Erreur chargement circuits", trips: [] };
  }
}

/**
 * 2. Récupère les détails et la liste des voyageurs d'un circuit spécifique
 */
export async function getTripScannerDetailsAction(tripIdentifier: string) {
  const permissions = await getCurrentTeamMemberPermissions();

  if (!permissions || !permissions.isActive) {
    return { success: false, error: "Accès refusé : profil inactif" };
  }

  if (!permissions.canScanTickets && !permissions.canViewManifest) {
    return { success: false, error: "Vous n'avez pas l'autorisation d'accéder à ce circuit" };
  }

  try {
    const trip = await prisma.trip.findFirst({
      where: {
        OR: [{ id: tripIdentifier }, { slug: tripIdentifier }],
      },
      include: {
        departureDates: { orderBy: { startDate: "asc" } },
        pickupPoints: { orderBy: { orderIndex: "asc" } },
        bookings: {
          where: { status: { not: "CANCELLED" } },
          include: {
            travelers: true,
            user: true,
            payments: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!trip) {
      return { success: false, error: "Circuit introuvable" };
    }

    // Vérifier si le membre est assigné au circuit si restreint
    const isUnrestricted = permissions.isSuperAdmin || permissions.role === "ORGANIZER";
    if (!isUnrestricted && permissions.assignedTripIds.length > 0 && !permissions.assignedTripIds.includes(trip.id)) {
      return { success: false, error: "Vous n'êtes pas affecté à ce circuit." };
    }

    const travelersList: Array<{
      id: string;
      bookingId: string;
      bookingReference: string;
      fullName: string;
      cinPassport: string;
      phone: string;
      category: string;
      pickupCity: string;
      roomType: string;
      isCheckedIn: boolean;
      checkedInAt: string | null;
      checkedInBy: string | null;
      paymentStatus: string;
      totalAmount: number;
      amountPaid: number;
      balanceDue: number;
      clientName: string;
    }> = [];

    let checkedInCount = 0;

    trip.bookings.forEach((b) => {
      const total = Number(b.totalAmount);
      const paid = Number(b.amountPaid);
      const balance = Math.max(0, total - paid);

      b.travelers.forEach((tr) => {
        if (tr.isCheckedIn) checkedInCount += 1;

        travelersList.push({
          id: tr.id,
          bookingId: b.id,
          bookingReference: b.reference,
          fullName: tr.fullName,
          cinPassport: tr.cinPassport,
          phone: tr.phone || b.user?.phone || "—",
          category: tr.category,
          pickupCity: tr.pickupCity || "Casablanca",
          roomType: tr.roomType || "DOUBLE_TWIN",
          isCheckedIn: tr.isCheckedIn,
          checkedInAt: tr.checkedInAt ? new Date(tr.checkedInAt).toISOString() : null,
          checkedInBy: tr.checkedInBy || null,
          paymentStatus: b.paymentStatus,
          totalAmount: total,
          amountPaid: paid,
          balanceDue: balance,
          clientName: b.user?.fullName || b.user?.name || "Client",
        });
      });
    });

    const firstDep = trip.departureDates[0];
    const depDateStr = firstDep
      ? new Date(firstDep.startDate).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Date à venir";

    return {
      success: true,
      trip: {
        id: trip.id,
        slug: trip.slug,
        titleFr: trip.titleFr,
        titleAr: trip.titleAr,
        totalSeats: trip.totalSeats || 48,
        departureDateStr: depDateStr,
        pickupPoints: trip.pickupPoints.map((p) => ({
          cityName: p.cityName,
          locationFr: p.locationNameFr,
          locationAr: p.locationNameAr,
          time: p.departureTime,
        })),
      },
      operatorPermissions: {
        fullName: permissions.fullName,
        role: permissions.role,
        canScanTickets: permissions.canScanTickets,
        canViewManifest: permissions.canViewManifest,
        canCollectCash: permissions.canCollectCash,
        isSuperAdmin: permissions.isSuperAdmin,
      },
      stats: {
        totalPassengers: travelersList.length,
        checkedInCount,
        pendingCount: Math.max(0, travelersList.length - checkedInCount),
      },
      travelers: travelersList,
    };
  } catch (error: any) {
    console.error("getTripScannerDetailsAction error:", error);
    return { success: false, error: error.message || "Erreur chargement détails" };
  }
}

/**
 * 3. Pointage d'embarquement d'un QR code
 * Contrôle strict des permissions de scan et audit logging du pointeur
 */
export async function checkInPassengerAction(
  rawQrOrRef: string,
  targetTripId?: string
) {
  const permissions = await getCurrentTeamMemberPermissions();

  if (!permissions || !permissions.isActive) {
    logSecurityAudit({
      type: "UNAUTHORIZED_ACCESS_ATTEMPT",
      action: "CHECKIN_PASSENGER_INACTIVE_PROFILE",
      resource: "SCANNER",
    });
    return {
      success: false,
      status: "ERROR" as const,
      error: "Accès refusé : Votre compte d'équipe est inactif ou suspendu.",
    };
  }

  if (!permissions.canScanTickets) {
    logSecurityAudit({
      type: "PRIVILEGE_ESCALATION_BLOCKED",
      email: permissions.email,
      role: permissions.role,
      action: "CHECKIN_PASSENGER_NO_SCAN_PERMISSION",
      resource: "SCANNER",
    });
    return {
      success: false,
      status: "ERROR" as const,
      error: "Autorisation refusée : Vous n'avez pas la permission de pointer les billets.",
    };
  }

  try {
    const bookingRef = extractBookingReference(rawQrOrRef);

    if (!bookingRef) {
      return {
        success: false,
        status: "NOT_FOUND" as const,
        error: "QR Code ou référence vide.",
      };
    }

    console.log("🔍 [checkInPassengerAction] Recherche dossier :", { bookingRef, targetTripId, operator: permissions.fullName });

    // Recherche de la réservation par reference ou qrCodeToken ou id
    let booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { reference: { equals: bookingRef, mode: "insensitive" } },
          { qrCodeToken: bookingRef },
          { id: bookingRef },
        ],
      },
      include: {
        trip: true,
        travelers: true,
        user: true,
      },
    });

    // Fallback : recherche par CIN d'un passager si l'agent tape la CIN
    if (!booking) {
      const travelerMatch = await prisma.traveler.findFirst({
        where: {
          cinPassport: { equals: bookingRef, mode: "insensitive" },
        },
        include: {
          booking: {
            include: {
              trip: true,
              travelers: true,
              user: true,
            },
          },
        },
      });

      if (travelerMatch) {
        booking = travelerMatch.booking;
      }
    }

    // Cas 3.A : Dossier introuvable
    if (!booking) {
      return {
        success: false,
        status: "NOT_FOUND" as const,
        error: `QR Code non reconnu : Aucune réservation trouvée pour "${bookingRef}".`,
      };
    }

    // Cas 3.B : Mauvais voyage sélectionné
    if (targetTripId && booking.tripId !== targetTripId && booking.trip.slug !== targetTripId) {
      return {
        success: false,
        status: "WRONG_TRIP" as const,
        error: `QR Code valide mais voyage différent ! Ce passager est inscrit sur : "${booking.trip.titleFr || booking.trip.titleAr}".`,
        bookingRef: booking.reference,
        tripTitle: booking.trip.titleFr || booking.trip.titleAr,
        clientName: booking.user?.fullName || booking.user?.name || "Client",
      };
    }

    // Cas 3.C : Réservation annulée
    if (booking.status === "CANCELLED") {
      return {
        success: false,
        status: "CANCELLED" as const,
        error: `Attention ! Le dossier ${booking.reference} a été ANNULÉ.`,
        bookingRef: booking.reference,
        clientName: booking.user?.fullName || booking.user?.name || "Client",
      };
    }

    const total = Number(booking.totalAmount);
    const paid = Number(booking.amountPaid);
    const balanceDue = Math.max(0, total - paid);

    // Vérifier si TOUS les passagers de ce dossier sont déjà pointés
    const allCheckedIn = booking.travelers.length > 0 && booking.travelers.every((t) => t.isCheckedIn);

    if (allCheckedIn) {
      const firstCheckIn = booking.travelers.find((t) => t.checkedInAt)?.checkedInAt;
      const timeStr = firstCheckIn
        ? new Date(firstCheckIn).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : "plus tôt";

      return {
        success: false,
        status: "ALREADY_CHECKED_IN" as const,
        error: `Attention ! Passager(s) déjà monté(s) à bord à ${timeStr}.`,
        message: `Passager déjà pointé à ${timeStr}`,
        checkedInAtTime: timeStr,
        booking: {
          id: booking.id,
          reference: booking.reference,
          clientName: booking.user?.fullName || booking.user?.name || "Client",
          phone: booking.user?.phone || booking.travelers[0]?.phone || "—",
          pickupCity: booking.travelers[0]?.pickupCity || "Casablanca",
          totalAmount: total,
          amountPaid: paid,
          balanceDue,
          isFullyPaid: balanceDue <= 0,
        },
        travelers: booking.travelers.map((t) => ({
          id: t.id,
          fullName: t.fullName,
          cinPassport: t.cinPassport,
          phone: t.phone || "—",
          category: t.category,
          pickupCity: t.pickupCity || "Casablanca",
          isCheckedIn: t.isCheckedIn,
          checkedInAt: t.checkedInAt ? new Date(t.checkedInAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : null,
        })),
      };
    }

    // Cas 1 : Validation avec succès (Pointage des passagers non encore montés)
    const now = new Date();
    const checkerIdentifier = `${permissions.fullName} (${permissions.role})`;

    // Marquer tous les voyageurs de ce billet comme pointés
    await prisma.traveler.updateMany({
      where: {
        bookingId: booking.id,
        isCheckedIn: false,
      },
      data: {
        isCheckedIn: true,
        checkedInAt: now,
        checkedInBy: checkerIdentifier,
      },
    });

    // Recharger les voyageurs mis à jour
    const updatedTravelers = await prisma.traveler.findMany({
      where: { bookingId: booking.id },
    });

    // Revalider les routes
    revalidatePath(`/admin/trips/${booking.tripId}/voyageurs`);
    revalidatePath(`/admin/scanner`);

    return {
      success: true,
      status: "SUCCESS" as const,
      message: "Passager pointé et admis à bord !",
      checkedInAtTime: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      operatorName: permissions.fullName,
      booking: {
        id: booking.id,
        reference: booking.reference,
        clientName: booking.user?.fullName || booking.user?.name || "Client",
        phone: booking.user?.phone || updatedTravelers[0]?.phone || "—",
        pickupCity: updatedTravelers[0]?.pickupCity || "Casablanca",
        totalAmount: total,
        amountPaid: paid,
        balanceDue,
        isFullyPaid: balanceDue <= 0,
      },
      travelers: updatedTravelers.map((t) => ({
        id: t.id,
        fullName: t.fullName,
        cinPassport: t.cinPassport,
        phone: t.phone || "—",
        category: t.category,
        pickupCity: t.pickupCity || "Casablanca",
        isCheckedIn: t.isCheckedIn,
        checkedInAt: t.checkedInAt ? new Date(t.checkedInAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : null,
      })),
    };
  } catch (error: any) {
    console.error("checkInPassengerAction error:", error);
    return {
      success: false,
      status: "ERROR" as const,
      error: error.message || "Erreur technique lors du pointage.",
    };
  }
}

/**
 * 4. Encaissement du solde restant en espèces sur le quai d'embarquement
 * Contrôle strict : vérifie que l'opérateur possède la permission canCollectCash
 */
export async function collectCashBalanceAction(bookingId: string, cashAmount: number) {
  const permissions = await getCurrentTeamMemberPermissions();

  if (!permissions || !permissions.isActive) {
    return { success: false, error: "Accès refusé : profil inactif" };
  }

  if (!permissions.canCollectCash) {
    logSecurityAudit({
      type: "PRIVILEGE_ESCALATION_BLOCKED",
      email: permissions.email,
      role: permissions.role,
      action: "CASH_COLLECTION_PERMISSION_DENIED",
      resource: "COLLECT_CASH",
    });
    return {
      success: false,
      error: "Opération refusée : Vous ne disposez pas de l'habilitation nécessaire pour encaisser des paiements en espèces au départ.",
    };
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true },
    });

    if (!booking) {
      return { success: false, error: "Dossier introuvable." };
    }

    const currentPaid = Number(booking.amountPaid);
    const newPaid = currentPaid + cashAmount;
    const total = Number(booking.totalAmount);
    const newBalance = Math.max(0, total - newPaid);

    // 1. Créer le paiement en espèces avec traçabilité de l'agent
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: cashAmount,
        type: "SOLDE",
        method: "ESPECES",
        status: "VALIDE",
      },
    });

    // 2. Mettre à jour la réservation
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        amountPaid: newPaid,
        paymentStatus: newBalance <= 0 ? "PAYE_INTEGRALEMENT" : "ACOMPTE_VERSE",
        status: newBalance <= 0 ? "FULLY_PAID" : booking.status,
      },
    });

    // Revalidation
    revalidatePath(`/admin/trips/${booking.tripId}/voyageurs`);
    revalidatePath(`/admin/scanner`);
    revalidatePath(`/admin/bookings`);

    return {
      success: true,
      message: `Encaissement de ${cashAmount.toLocaleString("fr-FR")} MAD en espèces validé par ${permissions.fullName} !`,
      amountPaid: Number(updated.amountPaid),
      balanceDue: newBalance,
      isFullyPaid: newBalance <= 0,
    };
  } catch (error: any) {
    console.error("collectCashBalanceAction error:", error);
    return { success: false, error: error.message || "Erreur lors de l'encaissement." };
  }
}

/**
 * 5. Pointage manuel individuel (Toggle) pour un voyageur spécifique
 */
export async function toggleTravelerBoardingAction(travelerId: string, tripId?: string) {
  const permissions = await getCurrentTeamMemberPermissions();

  if (!permissions || !permissions.isActive || !permissions.canScanTickets) {
    return { success: false, error: "Accès refusé : permission de pointage manquante." };
  }

  try {
    const traveler = await prisma.traveler.findUnique({
      where: { id: travelerId },
      include: { booking: true },
    });

    if (!traveler) {
      return { success: false, error: "Voyageur introuvable." };
    }

    const newCheckedInState = !traveler.isCheckedIn;
    const checkerIdentifier = `${permissions.fullName} (${permissions.role})`;

    const updated = await prisma.traveler.update({
      where: { id: travelerId },
      data: {
        isCheckedIn: newCheckedInState,
        checkedInAt: newCheckedInState ? new Date() : null,
        checkedInBy: newCheckedInState ? checkerIdentifier : null,
      },
    });

    const activeTripId = tripId || traveler.booking.tripId;
    revalidatePath(`/admin/trips/${activeTripId}/voyageurs`);
    revalidatePath(`/admin/scanner`);

    return {
      success: true,
      isCheckedIn: updated.isCheckedIn,
      checkedInAt: updated.checkedInAt ? new Date(updated.checkedInAt).toISOString() : null,
      checkedInBy: updated.checkedInBy,
      message: updated.isCheckedIn
        ? `${traveler.fullName} marqué comme embarqué !`
        : `Pointage annulé pour ${traveler.fullName}.`,
    };
  } catch (error: any) {
    console.error("toggleTravelerBoardingAction error:", error);
    return { success: false, error: error.message || "Erreur lors de la modification." };
  }
}
