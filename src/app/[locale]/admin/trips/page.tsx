import React from "react";
import { getAdminTripsAction } from "@/actions/trip.actions";
import { AdminTripList } from "@/components/admin/trips/AdminTripList";
import { requireAdminSession } from "@/lib/adminAuth";

export default async function AdminTripsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdminSession("ADMIN_TRIPS_PAGE", locale);

  const result = await getAdminTripsAction();
  const trips = result.trips || [];

  return <AdminTripList initialTrips={trips} />;
}
