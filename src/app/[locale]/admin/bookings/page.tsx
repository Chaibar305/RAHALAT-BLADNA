import React from "react";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { BookingsManager } from "@/components/admin/bookings/BookingsManager";
import { BookingAdminItem } from "@/components/admin/bookings/ReceiptVerificationModal";

export default async function AdminBookingsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdminSession("ADMIN_BOOKINGS_PAGE", locale);
  const isAr = locale === "ar";

  // 1. Récupération de tous les dossiers de réservation & prospects
  const dbBookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      trip: true,
      departureDate: true,
      travelers: true,
      confirmedByMember: true,
      payments: {
        orderBy: { createdAt: "desc" },
      },
      invoice: true,
    },
  });

  // 2. Récupération des circuits pour les filtres
  const allTrips = await prisma.trip.findMany({
    where: { isActive: true },
    select: { id: true, titleFr: true, titleAr: true },
    orderBy: { createdAt: "desc" },
  });

  // 3. Récupération des agents de confirmation pour l'assignation
  const teamMembers = await prisma.teamMember.findMany({
    where: { isActive: true },
    select: { id: true, fullName: true, role: true },
    orderBy: { fullName: "asc" },
  });

  // 4. Formatage des données
  const bookings: BookingAdminItem[] = dbBookings.map((b) => {
    const depDate = b.departureDate?.startDate
      ? new Date(b.departureDate.startDate).toLocaleDateString("fr-FR")
      : "À définir";

    const proofPayment = b.payments.find((p) => p.proofUrl);

    return {
      id: b.id,
      reference: b.reference,
      clientName: b.user?.fullName || b.user?.name || "Client Sans Nom",
      clientEmail: b.user?.email || "",
      clientPhone: b.user?.phone || "—",
      clientCity: b.user?.city || "Casablanca",
      tripId: b.tripId,
      tripTitle: isAr && b.trip?.titleAr ? b.trip.titleAr : b.trip?.titleFr || "Circuit",
      departureDate: depDate,
      passengersCount: b.travelers.length || 1,
      totalAmount: Number(b.totalAmount),
      depositAmount: Number(b.depositAmount),
      amountPaid: Number(b.amountPaid),
      status: b.status,
      paymentStatus: b.paymentStatus,
      callStatus: b.callStatus || "PENDING_CALL",
      callAttemptsCount: b.callAttemptsCount || 0,
      lastCallDate: b.lastCallDate ? new Date(b.lastCallDate).toISOString() : null,
      nextCallbackDate: b.nextCallbackDate ? new Date(b.nextCallbackDate).toISOString() : null,
      callNotes: b.callNotes || null,
      confirmedByMemberId: b.confirmedByMemberId || null,
      confirmedByMemberName: b.confirmedByMember?.fullName || null,
      pickupCity: b.pickupCity || b.travelers[0]?.pickupCity || "Casablanca",
      pickupPoint: b.pickupPoint || null,
      roomPreference: b.roomPreference || b.travelers[0]?.roomType || "DOUBLE_TWIN",
      source: b.source || "WEB_FORM",
      utmSource: b.utmSource || null,
      utmCampaign: b.utmCampaign || null,
      proofUrl: proofPayment?.proofUrl || null,
      paymentMethod: proofPayment?.method || "VIREMENT",
      notes: b.notes,
      qrCodeToken: b.qrCodeToken || b.reference,
      travelers: b.travelers.map((t) => ({
        id: t.id,
        fullName: t.fullName,
        cinPassport: t.cinPassport,
        category: t.category,
        pickupCity: t.pickupCity || "Casablanca",
        roomType: t.roomType || "DOUBLE_TWIN",
      })),
      createdAt: new Date(b.createdAt).toLocaleDateString("fr-FR"),
    };
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <BookingsManager
        initialBookings={bookings}
        allTrips={allTrips}
        teamMembers={teamMembers}
        locale={locale}
      />
    </div>
  );
}
