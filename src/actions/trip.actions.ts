"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/adminAuth";
import { TripFormSchema, TripFormData } from "@/lib/validations/trip.schema";

/**
 * Récupère tous les circuits réels pour le tableau d'administration
 */
export async function getAdminTripsAction() {
  await requireAdminSession("VIEW_ADMIN_TRIPS");

  try {
    const dbTrips = await prisma.trip.findMany({
      include: {
        pickupPoints: { orderBy: { orderIndex: "asc" } },
        departureDates: { orderBy: { startDate: "asc" } },
        itineraryDays: { orderBy: { dayNumber: "asc" } },
        addons: true,
        staffAssignments: { include: { teamMember: true } as any },
        partnerAssignments: { include: { partner: true } },
        fixedCosts: true,
        variableCosts: true,
        bookings: { include: { travelers: true, payments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, trips: JSON.parse(JSON.stringify(dbTrips)) };
  } catch (error) {
    console.error("Erreur Prisma lors de la récupération des circuits:", error);
    return { success: false, trips: [], error: "Erreur de connexion à la base de données" };
  }
}

/**
 * Récupère un circuit spécifique par son identifiant ou son slug
 */
export async function getTripByIdAction(id: string) {
  await requireAdminSession("GET_TRIP_BY_ID");

  try {
    const dbTrip = await prisma.trip.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        pickupPoints: { orderBy: { orderIndex: "asc" } },
        departureDates: { orderBy: { startDate: "asc" } },
        itineraryDays: { orderBy: { dayNumber: "asc" } },
        addons: true,
        staffAssignments: { include: { teamMember: true } as any },
        partnerAssignments: { include: { partner: true } },
        fixedCosts: true,
        variableCosts: true,
        bookings: {
          include: {
            travelers: true,
            payments: true,
            invoice: true,
            quote: true,
            user: true,
          },
        },
      },
    });

    if (dbTrip) {
      return { success: true, trip: JSON.parse(JSON.stringify(dbTrip)) };
    }
    return { success: false, error: "Circuit introuvable" };
  } catch (error) {
    console.error("Erreur Prisma getTripByIdAction:", error);
    return { success: false, error: "Erreur lors de la récupération du circuit" };
  }
}

/**
 * Crée un nouveau voyage complet dans Supabase PostgreSQL
 */
export async function createTripAction(data: TripFormData) {
  await requireAdminSession("CREATE_TRIP");

  const parsed = TripFormSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.format() };
  }

  const validData = parsed.data;

  try {
    let agency = await prisma.agency.findFirst();
    if (!agency) {
      agency = await prisma.agency.create({
        data: {
          name: "Atlas & Sahara Voyages SARL",
          slug: "atlas-sahara-voyages",
          phone: "+212 681-024758",
          email: "machaibare@gmail.com",
        },
      });
    }

    const createdTrip = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.create({
        data: {
          agencyId: agency.id,
          titleFr: validData.titleFr,
          titleAr: validData.titleAr,
          titleEn: validData.titleEn || null,
          slug: validData.slug,
          tripType: (validData.tripType as any) || "MULTI_DAY_TOUR",
          publishStatus: validData.isPublished ? "PUBLISHED" : "DRAFT",
          destinationRegion: validData.destinationRegion,
          departureCity: validData.departureCity,
          durationDays: validData.durationDays,
          durationNights: validData.durationNights,
          basePrice: validData.basePrice || 1450,
          depositPerPerson: validData.depositPerPerson || 500,
          singleSupplement: validData.singleSupplement || 350,
          shortDescriptionFr: validData.shortDescriptionFr,
          shortDescriptionAr: validData.shortDescriptionAr,
          longDescriptionFr: validData.longDescriptionFr,
          longDescriptionAr: validData.longDescriptionAr,
          coverImageUrl: validData.coverImageUrl || "/images/merzouga/cover-merzouga.jpg",
          isFeatured: validData.isBestSeller || validData.isGuaranteed,
          isScheduledThisWeek: validData.isScheduledThisWeek || false,
          featuredWeekMessage: validData.featuredWeekMessage || null,
          includedServicesFr: validData.includedServicesFr || [],
          includedServicesAr: validData.includedServicesAr || [],
          excludedServicesFr: validData.excludedServicesFr || [],
          excludedServicesAr: validData.excludedServicesAr || [],
          checklistItemsFr: validData.checklistItemsFr || [],
          checklistItemsAr: validData.checklistItemsAr || [],
          includedServices: validData.includedServices && validData.includedServices.length > 0
            ? validData.includedServices
            : (validData.includedServicesFr || []),
          excludedServices: validData.excludedServices && validData.excludedServices.length > 0
            ? validData.excludedServices
            : (validData.excludedServicesFr || []),
          whatToBring: validData.whatToBring && validData.whatToBring.length > 0
            ? validData.whatToBring
            : (validData.checklistItemsFr || []),
          galleryImages: validData.itineraryDays?.map((d) => d.featuredImage).filter(Boolean) || [],
        } as any,
      });

      // Synchronisation des étapes journalières (ItineraryDays)
      if (validData.itineraryDays && validData.itineraryDays.length > 0) {
        for (let idx = 0; idx < validData.itineraryDays.length; idx++) {
          const day = validData.itineraryDays[idx];
          await tx.itineraryDay.create({
            data: {
              tripId: trip.id,
              dayNumber: day.dayNumber || idx + 1,
              titleFr: day.titleFr,
              titleAr: day.titleAr || day.titleFr,
              timeSlot: day.timeSlot || null,
              locationName: day.locationName || day.location || null,
              location: day.location,
              featuredImage: day.featuredImage || trip.coverImageUrl,
              meals: day.meals || [],
              descriptionFr: day.descriptionFr,
              descriptionAr: day.descriptionAr || day.descriptionFr,
              activityTags: day.activityTags || [],
            } as any,
          });
        }
      }

      // Synchronisation des dates de départs
      if (validData.departures && validData.departures.length > 0) {
        for (const dep of validData.departures) {
          await tx.departureDate.create({
            data: {
              tripId: trip.id,
              startDate: new Date(dep.startDate),
              endDate: new Date(dep.endDate),
              totalCapacity: dep.totalSeats || 18,
              minSeatsForGuaranteed: 10,
              basePriceDouble: validData.basePrice,
              singleRoomSupplement: validData.singleSupplement || 350,
              depositAmount: validData.depositPerPerson || 500,
              status: dep.status === "GUARANTEED" ? "GUARANTEED" : "OPEN_FOR_BOOKING",
            },
          });
        }
      }

      // Synchronisation des points de ramassage
      if (validData.pickupPoints && validData.pickupPoints.length > 0) {
        for (let idx = 0; idx < validData.pickupPoints.length; idx++) {
          const pt = validData.pickupPoints[idx];
          await tx.tripPickupPoint.create({
            data: {
              tripId: trip.id,
              cityName: pt.cityName,
              city: pt.city || pt.cityName,
              locationNameFr: pt.locationName,
              locationNameAr: pt.locationName,
              locationName: pt.locationName,
              departureTime: pt.departureTime,
              meetingTime: pt.meetingTime || pt.departureTime,
              googleMapsUrl: pt.googleMapsUrl || null,
              orderIndex: pt.orderIndex !== undefined ? pt.orderIndex : idx,
            } as any,
          });
        }
      }

      return trip;
    });

    revalidatePath("/admin/trips");
    revalidatePath(`/admin/trips/${createdTrip.id}`);
    revalidatePath(`/admin/trips/${createdTrip.slug}`);
    revalidatePath("/trips");
    revalidatePath("/");

    return { success: true, tripId: createdTrip.id, slug: createdTrip.slug };
  } catch (error: any) {
    console.error("Erreur lors de la création du circuit:", error);
    return { success: false, error: error.message || "Erreur base de données lors de la création" };
  }
}

/**
 * Met à jour un voyage existant
 */
export async function updateTripAction(id: string, data: TripFormData) {
  await requireAdminSession("UPDATE_TRIP");

  const parsed = TripFormSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.format() };
  }

  const validData = parsed.data;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.update({
        where: { id },
        data: {
          titleFr: validData.titleFr,
          titleAr: validData.titleAr,
          titleEn: validData.titleEn || null,
          slug: validData.slug,
          tripType: (validData.tripType as any) || "MULTI_DAY_TOUR",
          publishStatus: validData.isPublished ? "PUBLISHED" : "DRAFT",
          destinationRegion: validData.destinationRegion,
          departureCity: validData.departureCity,
          durationDays: validData.durationDays,
          durationNights: validData.durationNights,
          basePrice: validData.basePrice,
          depositPerPerson: validData.depositPerPerson,
          singleSupplement: validData.singleSupplement,
          shortDescriptionFr: validData.shortDescriptionFr,
          shortDescriptionAr: validData.shortDescriptionAr,
          longDescriptionFr: validData.longDescriptionFr,
          longDescriptionAr: validData.longDescriptionAr,
          coverImageUrl: validData.coverImageUrl,
          isScheduledThisWeek: validData.isScheduledThisWeek || false,
          featuredWeekMessage: validData.featuredWeekMessage || null,
          isActive: validData.isPublished,
          includedServicesFr: validData.includedServicesFr || [],
          includedServicesAr: validData.includedServicesAr || [],
          excludedServicesFr: validData.excludedServicesFr || [],
          excludedServicesAr: validData.excludedServicesAr || [],
          checklistItemsFr: validData.checklistItemsFr || [],
          checklistItemsAr: validData.checklistItemsAr || [],
          includedServices: validData.includedServices && validData.includedServices.length > 0
            ? validData.includedServices
            : (validData.includedServicesFr || []),
          excludedServices: validData.excludedServices && validData.excludedServices.length > 0
            ? validData.excludedServices
            : (validData.excludedServicesFr || []),
          whatToBring: validData.whatToBring && validData.whatToBring.length > 0
            ? validData.whatToBring
            : (validData.checklistItemsFr || []),
        } as any,
      });

      // Synchronisation des étapes journalières (ItineraryDays)
      if (validData.itineraryDays) {
        await tx.itineraryDay.deleteMany({ where: { tripId: id } });
        for (let idx = 0; idx < validData.itineraryDays.length; idx++) {
          const day = validData.itineraryDays[idx];
          await tx.itineraryDay.create({
            data: {
              tripId: id,
              dayNumber: day.dayNumber || idx + 1,
              titleFr: day.titleFr,
              titleAr: day.titleAr || day.titleFr,
              timeSlot: day.timeSlot || null,
              locationName: day.locationName || day.location || null,
              location: day.location,
              featuredImage: day.featuredImage || trip.coverImageUrl,
              meals: day.meals || [],
              descriptionFr: day.descriptionFr,
              descriptionAr: day.descriptionAr || day.descriptionFr,
              activityTags: day.activityTags || [],
            } as any,
          });
        }
      }

      // Synchronisation des dates de départs
      if (validData.departures && validData.departures.length > 0) {
        await tx.departureDate.deleteMany({ where: { tripId: id } });
        for (const dep of validData.departures) {
          await tx.departureDate.create({
            data: {
              tripId: id,
              startDate: new Date(dep.startDate),
              endDate: new Date(dep.endDate),
              totalCapacity: dep.totalSeats || 18,
              minSeatsForGuaranteed: 10,
              basePriceDouble: validData.basePrice,
              singleRoomSupplement: validData.singleSupplement || 350,
              depositAmount: validData.depositPerPerson || 500,
              status: dep.status === "GUARANTEED" ? "GUARANTEED" : "OPEN_FOR_BOOKING",
            },
          });
        }
      }

      // Synchronisation des points de ramassage
      if (validData.pickupPoints) {
        await tx.tripPickupPoint.deleteMany({ where: { tripId: id } });
        for (let idx = 0; idx < validData.pickupPoints.length; idx++) {
          const pt = validData.pickupPoints[idx];
          await tx.tripPickupPoint.create({
            data: {
              tripId: id,
              cityName: pt.cityName,
              city: pt.city || pt.cityName,
              locationNameFr: pt.locationName,
              locationNameAr: pt.locationName,
              locationName: pt.locationName,
              departureTime: pt.departureTime,
              meetingTime: pt.meetingTime || pt.departureTime,
              googleMapsUrl: pt.googleMapsUrl || null,
              orderIndex: pt.orderIndex !== undefined ? pt.orderIndex : idx,
            } as any,
          });
        }
      }

      return trip;
    });

    revalidatePath("/admin/trips");
    revalidatePath(`/admin/trips/${updated.id}`);
    revalidatePath(`/admin/trips/${updated.slug}`);
    revalidatePath("/trips");
    revalidatePath(`/trips/${updated.slug}`);
    revalidatePath("/");

    return { success: true, tripId: updated.id, slug: updated.slug };
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du circuit:", error);
    return { success: false, error: error.message || "Erreur de mise à jour" };
  }
}

/**
 * Duplique un voyage
 */
export async function duplicateTripAction(id: string) {
  await requireAdminSession("DUPLICATE_TRIP");

  try {
    const source = await prisma.trip.findUnique({
      where: { id },
      include: {
        pickupPoints: true,
        itineraryDays: { orderBy: { dayNumber: "asc" } },
        addons: true,
        fixedCosts: true,
        variableCosts: true,
      },
    });

    if (!source) return { success: false, error: "Circuit source introuvable" };

    const newSlug = `${source.slug}-copie-${Date.now().toString().slice(-4)}`;

    const duplicated = await prisma.trip.create({
      data: {
        agencyId: source.agencyId,
        titleFr: `${source.titleFr} (Copie)`,
        titleAr: `${source.titleAr} (نسخة)`,
        titleEn: source.titleEn ? `${source.titleEn} (Copy)` : null,
        slug: newSlug,
        tripType: source.tripType,
        publishStatus: "DRAFT",
        durationDays: source.durationDays,
        durationNights: source.durationNights,
        destinationRegion: source.destinationRegion,
        departureCity: source.departureCity,
        basePrice: source.basePrice,
        depositPerPerson: source.depositPerPerson,
        singleSupplement: source.singleSupplement,
        totalSeats: source.totalSeats,
        minSeatsRequired: source.minSeatsRequired,
        shortDescriptionFr: source.shortDescriptionFr,
        shortDescriptionAr: source.shortDescriptionAr,
        longDescriptionFr: source.longDescriptionFr,
        longDescriptionAr: source.longDescriptionAr,
        includedServicesFr: source.includedServicesFr,
        includedServicesAr: source.includedServicesAr,
        excludedServicesFr: source.excludedServicesFr,
        excludedServicesAr: source.excludedServicesAr,
        checklistItemsFr: source.checklistItemsFr,
        includedServices: (source as any).includedServices || (source as any).includedServicesFr || [],
        excludedServices: (source as any).excludedServices || (source as any).excludedServicesFr || [],
        whatToBring: (source as any).whatToBring || (source as any).checklistItemsFr || [],
        coverImageUrl: source.coverImageUrl,
        galleryImages: source.galleryImages,
        isFeatured: false,
        isActive: false,
      } as any,
    });

    if (source.itineraryDays && source.itineraryDays.length > 0) {
      for (const day of source.itineraryDays) {
        await prisma.itineraryDay.create({
          data: {
            tripId: duplicated.id,
            dayNumber: day.dayNumber,
            titleFr: day.titleFr,
            titleAr: day.titleAr,
            location: day.location,
            featuredImage: day.featuredImage,
            meals: day.meals,
            descriptionFr: day.descriptionFr,
            descriptionAr: day.descriptionAr,
            activityTags: day.activityTags,
          },
        });
      }
    }

    revalidatePath("/admin/trips");
    return { success: true, newId: duplicated.id };
  } catch (error: any) {
    console.error("Erreur lors de la duplication:", error);
    return { success: false, error: error.message || "Erreur de duplication" };
  }
}

/**
 * Supprime un voyage
 */
export async function deleteTripAction(id: string) {
  await requireAdminSession("DELETE_TRIP");

  try {
    await prisma.trip.delete({ where: { id } });

    revalidatePath("/admin/trips");
    revalidatePath("/trips");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("Erreur suppression circuit:", error);
    return { success: false, error: error.message || "Erreur lors de la suppression" };
  }
}

/**
 * Active / Désactive la publication d'un voyage
 */
export async function toggleTripPublishAction(id: string, isPublished: boolean) {
  await requireAdminSession("TOGGLE_TRIP_PUBLISH");

  try {
    const updated = await prisma.trip.update({
      where: { id },
      data: {
        isActive: isPublished,
        publishStatus: isPublished ? "PUBLISHED" : "DRAFT",
      },
    });

    revalidatePath("/admin/trips");
    revalidatePath("/trips");
    revalidatePath("/");

    return { success: true, isPublished: updated.isActive };
  } catch (error: any) {
    console.error("Erreur toggle publish:", error);
    return { success: false, error: error.message || "Erreur mise à jour statut" };
  }
}

/**
 * Active / Désactive un circuit comme « Circuit Planifié cette Semaine » (Départ Vedette du Week-end)
 * Supporte la multi-sélection simultanée (plusieurs circuits au départ le même week-end)
 */
export async function toggleTripScheduledThisWeekAction(
  id: string,
  isScheduled: boolean,
  featuredMessage?: string | null
) {
  await requireAdminSession("TOGGLE_TRIP_SCHEDULED_WEEK");

  try {
    const updated = await (prisma.trip as any).update({
      where: { id },
      data: {
        isScheduledThisWeek: isScheduled,
        featuredWeekMessage: isScheduled ? (featuredMessage || null) : null,
      },
      select: {
        id: true,
        titleFr: true,
        titleAr: true,
        slug: true,
        isScheduledThisWeek: true,
        featuredWeekMessage: true,
      },
    });

    revalidatePath("/admin/trips");
    revalidatePath("/trips");
    revalidatePath(`/trips/${updated.slug}`);
    revalidatePath("/");

    return { success: true, trip: updated };
  } catch (error: any) {
    console.error("Erreur toggleTripScheduledThisWeekAction:", error);
    return { success: false, error: error.message || "Erreur mise à jour départ vedette" };
  }
}

/**
 * Toggle rapide indépendant d'un circuit planifié cette semaine (multi-sélection autorisée)
 */
export async function toggleScheduledThisWeekAction(tripId: string) {
  await requireAdminSession("TOGGLE_SCHEDULED_WEEK");

  try {
    const trip = await (prisma.trip as any).findUnique({
      where: { id: tripId },
      select: { isScheduledThisWeek: true, slug: true },
    });

    if (!trip) return { success: false, error: "Circuit introuvable" };

    const currentScheduled = Boolean(trip.isScheduledThisWeek);

    const updatedTrip = await (prisma.trip as any).update({
      where: { id: tripId },
      data: {
        isScheduledThisWeek: !currentScheduled,
      },
    });

    revalidatePath("/admin/trips");
    revalidatePath("/trips");
    if (trip.slug) {
      revalidatePath(`/trips/${trip.slug}`);
    }
    revalidatePath("/");
    return { success: true, isScheduled: Boolean(updatedTrip.isScheduledThisWeek) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Récupère tous les circuits planifiés cette semaine pour les bannières informatives et sélections
 */
export async function getScheduledThisWeekTripsAction() {
  try {
    const trips = await (prisma.trip as any).findMany({
      where: {
        isScheduledThisWeek: true,
        isActive: true,
      },
      select: {
        id: true,
        titleFr: true,
        titleAr: true,
        slug: true,
        coverImageUrl: true,
        basePrice: true,
        durationDays: true,
        durationNights: true,
        destinationRegion: true,
        featuredWeekMessage: true,
        departureDates: {
          where: {
            startDate: { gte: new Date() },
          },
          orderBy: { startDate: "asc" },
          take: 1,
          select: {
            id: true,
            startDate: true,
            status: true,
            totalCapacity: true,
            occupiedSeats: true,
          },
        },
      },
    });

    const serializedTrips = (trips as any[]).map((trip: any) => ({
      ...trip,
      basePrice: Number(trip.basePrice),
      departureDates: (trip.departureDates || []).map((d: any) => ({
        ...d,
        startDate: d.startDate ? new Date(d.startDate).toISOString() : "",
      })),
    }));

    return { success: true, trips: serializedTrips };
  } catch (error) {
    console.error("Erreur getScheduledThisWeekTripsAction:", error);
    return { success: false, trips: [] };
  }
}

/**
 * Récupère le premier circuit planifié cette semaine (compatibilité descendante)
 */
export async function getScheduledThisWeekTripAction() {
  try {
    const res = await getScheduledThisWeekTripsAction();
    return { success: res.success, trip: res.trips && res.trips.length > 0 ? res.trips[0] : null };
  } catch (error) {
    console.error("Erreur getScheduledThisWeekTripAction:", error);
    return { success: false, trip: null };
  }
}
