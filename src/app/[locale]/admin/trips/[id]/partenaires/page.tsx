import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/adminAuth";
import { TripAdminTabs } from "@/components/admin/trips/TripAdminTabs";
import { TripPartnerManager } from "@/components/admin/trips/TripPartnerManager";
import { canPublishTripAction } from "@/actions/partner.actions";

export default async function TripPartnersPage({
  params: { id, locale },
}: {
  params: { id: string; locale: string };
}) {
  await requireAdminSession("VIEW_TRIP_PARTNERS", locale);
  const isAr = locale === "ar";

  const trip = await prisma.trip.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      partnerAssignments: {
        include: { partner: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!trip) {
    notFound();
  }

  const allPartners = await prisma.partner.findMany({
    orderBy: { companyName: "asc" },
  });

  const publishCheck = await canPublishTripAction(trip.id);

  const formattedAssignments = trip.partnerAssignments.map((a) => ({
    id: a.id,
    tripId: a.tripId,
    partnerId: a.partnerId,
    status: a.status,
    negotiatedCost: a.negotiatedCost ? Number(a.negotiatedCost) : null,
    driverAssigned: a.driverAssigned,
    notes: a.notes,
    confirmedAt: a.confirmedAt ? a.confirmedAt.toISOString() : null,
    partner: {
      id: a.partner.id,
      type: a.partner.type,
      companyName: a.partner.companyName,
      contactName: a.partner.contactName,
      phone: a.partner.phone,
      city: a.partner.city,
      capacity: a.partner.capacity,
      vehicleType: a.partner.vehicleType,
      plateNumber: a.partner.plateNumber,
    },
  }));

  return (
    <div className="space-y-6">
      <TripAdminTabs
        tripId={trip.id}
        tripSlug={trip.slug}
        tripTitle={isAr ? trip.titleAr : trip.titleFr}
      />

      <TripPartnerManager
        tripId={trip.id}
        tripTitle={isAr ? trip.titleAr : trip.titleFr}
        durationDays={trip.durationDays}
        initialAssignments={formattedAssignments}
        availablePartners={allPartners}
        canPublish={publishCheck.canPublish}
        publishBlockReason={publishCheck.reason || null}
      />
    </div>
  );
}
