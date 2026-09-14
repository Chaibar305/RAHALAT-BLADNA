import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/adminAuth";
import { TripForm } from "@/components/admin/trips/TripForm";

export default async function EditTripPage({
  params: { id },
}: {
  params: { id: string };
}) {
  await requireAdminSession("VIEW_ADMIN_TRIPS");

  const trip = await prisma.trip.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
    include: {
      itineraryDays: {
        orderBy: { dayNumber: "asc" },
      },
      departureDates: {
        orderBy: { startDate: "asc" },
      },
      pickupPoints: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!trip) {
    notFound();
  }

  const formattedData: any = {
    id: trip.id,
    titleFr: trip.titleFr,
    titleAr: trip.titleAr,
    titleEn: trip.titleEn || "",
    slug: trip.slug,
    tripType: trip.tripType,
    destinationRegion: trip.destinationRegion,
    departureCity: trip.departureCity,
    durationDays: trip.durationDays,
    durationNights: trip.durationNights,
    basePrice: Number(trip.basePrice || 0),
    depositPerPerson: Number(trip.depositPerPerson || 500),
    singleSupplement: Number(trip.singleSupplement || 350),
    coverImageUrl: trip.coverImageUrl,
    shortDescriptionFr: trip.shortDescriptionFr,
    shortDescriptionAr: trip.shortDescriptionAr,
    longDescriptionFr: trip.longDescriptionFr,
    longDescriptionAr: trip.longDescriptionAr,
    overviewFr: (trip as any).overviewFr?.trim()
      ? (trip as any).overviewFr
      : (trip.longDescriptionFr || trip.shortDescriptionFr || ""),
    overviewAr: (trip as any).overviewAr?.trim()
      ? (trip as any).overviewAr
      : (trip.longDescriptionAr || trip.shortDescriptionAr || ""),
    showOverview: (trip as any).showOverview ?? true,
    isGuaranteed: trip.isFeatured,
    isBestSeller: trip.isFeatured,
    isScheduledThisWeek: (trip as any).isScheduledThisWeek ?? false,
    featuredWeekMessage: (trip as any).featuredWeekMessage || "",
    isPublished: trip.isActive,
    pickupPoints: trip.pickupPoints?.map((p: any) => ({
      id: p.id,
      cityName: p.cityName || p.city || "",
      city: p.city || p.cityName || "",
      locationName: p.locationName || p.locationNameFr || p.locationNameAr || "",
      departureTime: p.departureTime || p.meetingTime || "",
      meetingTime: p.meetingTime || p.departureTime || "",
      googleMapsUrl: p.googleMapsUrl || "",
      orderIndex: p.orderIndex ?? 0,
    })) || [],
    itineraryDays: trip.itineraryDays?.map((d: any) => ({
      id: d.id,
      dayNumber: d.dayNumber,
      titleFr: d.titleFr,
      titleAr: d.titleAr,
      timeSlot: d.timeSlot || "",
      locationName: d.locationName || d.location || "",
      location: d.location,
      featuredImage: d.featuredImage,
      meals: d.meals || [],
      descriptionFr: d.descriptionFr,
      descriptionAr: d.descriptionAr,
      activityTags: d.activityTags || [],
      addons: [],
    })) || [],
    departures: trip.departureDates?.map((d: any) => ({
      id: d.id,
      startDate: d.startDate ? new Date(d.startDate).toISOString().split("T")[0] : "",
      endDate: d.endDate ? new Date(d.endDate).toISOString().split("T")[0] : "",
      totalSeats: d.totalCapacity || 18,
      bookedSeats: (d.totalCapacity || 18) - (d.availableSeats ?? d.totalCapacity ?? 18),
      status: d.status === "GUARANTEED" ? "GUARANTEED" : "OPEN",
      specificPrice: Number(trip.basePrice || 0),
      tourLeaderName: "",
    })) || [],
    includedServicesFr: (trip as any).includedServicesFr || (trip as any).includedServices || [],
    includedServicesAr: (trip as any).includedServicesAr || [],
    excludedServicesFr: (trip as any).excludedServicesFr || (trip as any).excludedServices || [],
    excludedServicesAr: (trip as any).excludedServicesAr || [],
    checklistItemsFr: (trip as any).checklistItemsFr || (trip as any).whatToBring || [],
    checklistItemsAr: (trip as any).checklistItemsAr || [],
    includedServices: (trip as any).includedServices || (trip as any).includedServicesFr || [],
    excludedServices: (trip as any).excludedServices || (trip as any).excludedServicesFr || [],
    whatToBring: (trip as any).whatToBring || (trip as any).checklistItemsFr || [],
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      <TripForm initialData={formattedData} isEditing={true} />
    </div>
  );
}
