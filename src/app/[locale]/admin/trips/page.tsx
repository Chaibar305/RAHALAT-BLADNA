import React from "react";
import { getAdminTripsAction } from "@/actions/trip.actions";
import { getCollectionsAction } from "@/actions/collection.actions";
import { AdminTripList } from "@/components/admin/trips/AdminTripList";
import { requireAdminSession } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminTripsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdminSession("ADMIN_TRIPS_PAGE", locale);

  const [tripsResult, collectionsResult] = await Promise.all([
    getAdminTripsAction(),
    getCollectionsAction(),
  ]);

  const trips = tripsResult.trips || [];
  const collections = collectionsResult.collections || [];

  return <AdminTripList initialTrips={trips} initialCollections={collections} />;
}

