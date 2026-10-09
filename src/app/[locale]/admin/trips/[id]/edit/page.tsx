import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/adminAuth";
import { TripForm } from "@/components/admin/trips/TripForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
      addons: true,
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
    shortDescriptionEn: (trip as any).shortDescriptionEn || "",
    longDescriptionFr: trip.longDescriptionFr,
    longDescriptionAr: trip.longDescriptionAr,
    longDescriptionEn: (trip as any).longDescriptionEn || "",
    overviewFr: (trip as any).overviewFr?.trim()
      ? (trip as any).overviewFr
      : (trip.longDescriptionFr || trip.shortDescriptionFr || ""),
    overviewAr: (trip as any).overviewAr?.trim()
      ? (trip as any).overviewAr
      : (trip.longDescriptionAr || trip.shortDescriptionAr || ""),
    overviewEn: (trip as any).overviewEn?.trim()
      ? (trip as any).overviewEn
      : ((trip as any).longDescriptionEn || (trip as any).shortDescriptionEn || ""),
    showOverview: (trip as any).showOverview ?? true,
    isGuaranteed: trip.isFeatured,
    isBestSeller: trip.isFeatured,
    isScheduledThisWeek: (trip as any).isScheduledThisWeek ?? false,
    featuredWeekMessage: (trip as any).featuredWeekMessage || "",
    isPublished: trip.isActive,
    scope: (trip as any).scope || "NATIONAL",
    collectionId: (trip as any).collectionId || null,
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
      titleEn: d.titleEn || "",
      timeSlot: d.timeSlot || "",
      locationName: d.locationName || d.location || "",
      location: d.location,
      featuredImage: d.featuredImage,
      meals: d.meals || [],
      descriptionFr: d.descriptionFr,
      descriptionAr: d.descriptionAr,
      descriptionEn: d.descriptionEn || "",
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
    includedServicesFr: (trip as any).includedServicesFr || (trip as any).includedFr || (trip as any).includedServices || [],
    includedServicesAr: (trip as any).includedServicesAr || (trip as any).includedAr || [],
    includedServicesEn: (trip as any).includedServicesEn || (trip as any).includedEn || [],
    excludedServicesFr: (trip as any).excludedServicesFr || (trip as any).excludedFr || (trip as any).excludedServices || [],
    excludedServicesAr: (trip as any).excludedServicesAr || (trip as any).excludedAr || [],
    excludedServicesEn: (trip as any).excludedServicesEn || (trip as any).excludedEn || [],
    checklistItemsFr: (trip as any).checklistItemsFr || (trip as any).equipmentFr || (trip as any).whatToBring || [],
    checklistItemsAr: (trip as any).checklistItemsAr || (trip as any).equipmentAr || [],
    checklistItemsEn: (trip as any).checklistItemsEn || (trip as any).equipmentEn || [],
    includedFr: (trip as any).includedFr || (trip as any).includedServicesFr || (trip as any).includedServices || [],
    includedAr: (trip as any).includedAr || (trip as any).includedServicesAr || [],
    includedEn: (trip as any).includedEn || (trip as any).includedServicesEn || [],
    excludedFr: (trip as any).excludedFr || (trip as any).excludedServicesFr || (trip as any).excludedServices || [],
    excludedAr: (trip as any).excludedAr || (trip as any).excludedServicesAr || [],
    excludedEn: (trip as any).excludedEn || (trip as any).excludedServicesEn || [],
    equipmentFr: (trip as any).equipmentFr || (trip as any).checklistItemsFr || (trip as any).whatToBring || [],
    equipmentAr: (trip as any).equipmentAr || (trip as any).checklistItemsAr || [],
    equipmentEn: (trip as any).equipmentEn || (trip as any).checklistItemsEn || [],
    includedServices: (trip as any).includedServices || (trip as any).includedServicesFr || [],
    excludedServices: (trip as any).excludedServices || (trip as any).excludedServicesFr || [],
    notIncludedFr: (trip as any).notIncludedFr || (trip as any).excludedServicesFr || (trip as any).excludedFr || [],
    whatToBring: (trip as any).whatToBring || (trip as any).checklistItemsFr || [],
    extraOptions: Array.isArray((trip as any).extraOptions) && (trip as any).extraOptions.length > 0
      ? (trip as any).extraOptions.map((opt: any) => ({
          ...opt,
          nameEn: opt.nameEn || "",
          descriptionEn: opt.descriptionEn || "",
        }))
      : (trip as any).addons?.map((a: any) => ({
          id: a.id,
          nameFr: a.nameFr,
          nameAr: a.nameAr || "",
          nameEn: a.nameEn || "",
          price: Number(a.price),
          isPerPerson: a.isPerPerson ?? true,
          descriptionFr: a.descriptionFr || "",
          descriptionAr: a.descriptionAr || "",
          descriptionEn: a.descriptionEn || "",
        })) || [],
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      <TripForm initialData={formattedData} isEditing={true} />
    </div>
  );
}
