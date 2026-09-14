import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/adminAuth";
import { TripAdminTabs } from "@/components/admin/trips/TripAdminTabs";
import { TripProfitabilityView } from "@/components/admin/trips/TripProfitabilityView";
import { calculateTripProfitability } from "@/actions/profitability.actions";

export default async function TripProfitabilityPage({
  params: { id, locale },
}: {
  params: { id: string; locale: string };
}) {
  await requireAdminSession("VIEW_TRIP_PROFITABILITY", locale);
  const isAr = locale === "ar";

  const trip = await prisma.trip.findFirst({
    where: { OR: [{ id }, { slug: id }] },
  });

  if (!trip) {
    notFound();
  }

  const result = await calculateTripProfitability(trip.id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <TripAdminTabs
        tripId={trip.id}
        tripSlug={trip.slug}
        tripTitle={isAr ? trip.titleAr : trip.titleFr}
      />

      <TripProfitabilityView
        tripId={trip.id}
        tripTitle={isAr ? trip.titleAr : trip.titleFr}
        initialData={result.data}
      />
    </div>
  );
}
