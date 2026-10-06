import { z } from "zod";

export const ItineraryDaySchema = z.object({
  id: z.string().optional(),
  dayNumber: z.number().min(1),
  titleFr: z.string().min(2, "Le titre FR est requis"),
  titleAr: z.string().min(2, "Le titre AR est requis"),
  titleEn: z.string().optional().nullable(),
  timeSlot: z.string().optional().nullable(),
  locationName: z.string().optional().nullable(),
  location: z.string().min(2, "La localisation est requise"),
  featuredImage: z.string().min(1, "L'image du jour est requise"),
  meals: z.array(z.string()).default([]),
  descriptionFr: z.string().min(10, "La description FR doit contenir au moins 10 caractères"),
  descriptionAr: z.string().min(10, "La description AR doit contenir au moins 10 caractères"),
  descriptionEn: z.string().optional().nullable(),
  activityTags: z.array(z.string()).default([]),
  addons: z.array(
    z.object({
      id: z.string().optional(),
      titleFr: z.string().min(2),
      titleAr: z.string().min(2),
      price: z.number().min(0),
      isOptional: z.boolean().default(true),
    })
  ).default([]),
});

export const DepartureDateAdminSchema = z.object({
  id: z.string().optional(),
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().min(1, "Date de fin requise"),
  totalSeats: z.number().min(1).default(18),
  bookedSeats: z.number().min(0).default(0),
  status: z.enum([
    "OPEN",
    "OPEN_FOR_BOOKING",
    "GUARANTEED",
    "ALMOST_FULL",
    "SOLD_OUT",
    "DRAFT",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
  ]).default("OPEN"),
  specificPrice: z.number().optional().nullable(),
  tourLeaderName: z.string().optional().nullable(),
});

export const PickupPointAdminSchema = z.object({
  id: z.string().optional(),
  cityName: z.string().min(2, "La ville est requise"),
  city: z.string().optional(),
  locationName: z.string().min(2, "Le lieu précis de ramassage est requis"),
  departureTime: z.string().min(1, "L'heure de rassemblement est requise"),
  meetingTime: z.string().optional(),
  googleMapsUrl: z.string().optional().nullable(),
  orderIndex: z.number().optional().default(0),
});

export const TripFormSchema = z.object({
  id: z.string().optional(),
  titleFr: z.string().min(3, "Le titre en français est requis (min 3 caractères)"),
  titleAr: z.string().min(3, "Le titre en arabe est requis"),
  titleEn: z.string().optional(),
  slug: z.string().min(3, "Le slug est requis").regex(/^[a-z0-9-]+$/, "Format slug invalide (ex: magie-desert-merzouga)"),
  tripType: z.enum(["WEEKEND_BREAK", "MULTI_DAY_TOUR", "DAY_TRIP", "TREKKING_HIKING", "SAHARA_SPECIAL"]).default("WEEKEND_BREAK"),
  destinationRegion: z.string().min(2, "Région de destination requise"),
  departureCity: z.string().min(2, "Ville de départ requise"),
  durationDays: z.number().min(1, "Au moins 1 jour"),
  durationNights: z.number().min(0),
  basePrice: z.number().min(50, "Le prix de base doit être supérieur à 50 DH"),
  depositPerPerson: z.number().min(100, "L'acompte minimum est de 100 DH").default(500),
  singleSupplement: z.number().min(0).default(350),
  coverImageUrl: z.string().min(1, "L'image de couverture est requise"),
  shortDescriptionFr: z.string().min(10, "Description courte requise"),
  shortDescriptionAr: z.string().min(10, "Description courte en arabe requise"),
  shortDescriptionEn: z.string().optional().nullable(),
  longDescriptionFr: z.string().optional().nullable().default(""),
  longDescriptionAr: z.string().optional().nullable().default(""),
  longDescriptionEn: z.string().optional().nullable().default(""),
  overviewFr: z.string().optional().nullable(),
  overviewAr: z.string().optional().nullable(),
  overviewEn: z.string().optional().nullable(),
  showOverview: z.boolean().default(true),
  isGuaranteed: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isScheduledThisWeek: z.boolean().default(false),
  featuredWeekMessage: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
  scope: z.enum(["NATIONAL", "INTERNATIONAL"]).default("NATIONAL"),
  collectionId: z.string().optional().nullable(),
  pickupPoints: z.array(PickupPointAdminSchema).default([]),
  itineraryDays: z.array(ItineraryDaySchema).default([]),
  departures: z.array(DepartureDateAdminSchema).default([]),
  includedServicesFr: z.array(z.string()).default([]),
  includedServicesAr: z.array(z.string()).default([]),
  includedServicesEn: z.array(z.string()).default([]),
  excludedServicesFr: z.array(z.string()).default([]),
  excludedServicesAr: z.array(z.string()).default([]),
  excludedServicesEn: z.array(z.string()).default([]),
  checklistItemsFr: z.array(z.string()).default([]),
  checklistItemsAr: z.array(z.string()).default([]),
  checklistItemsEn: z.array(z.string()).default([]),
  includedFr: z.array(z.string()).default([]),
  includedAr: z.array(z.string()).default([]),
  includedEn: z.array(z.string()).default([]),
  excludedFr: z.array(z.string()).default([]),
  excludedAr: z.array(z.string()).default([]),
  excludedEn: z.array(z.string()).default([]),
  equipmentFr: z.array(z.string()).default([]),
  equipmentAr: z.array(z.string()).default([]),
  equipmentEn: z.array(z.string()).default([]),
  includedServices: z.array(z.string()).default([]),
  excludedServices: z.array(z.string()).default([]),
  whatToBring: z.array(z.string()).default([]),
});

export const TripCollectionSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .regex(/^[a-z0-9-]+$/, "Format de slug invalide (ex: sahara-bivouac)"),
  scope: z.enum(["NATIONAL", "INTERNATIONAL"]).default("NATIONAL"),
  nameFr: z.string().min(2, "Le nom français est requis"),
  nameAr: z.string().optional().nullable(),
  nameEn: z.string().optional().nullable(),
  descriptionFr: z.string().optional().nullable(),
  descriptionAr: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type TripCollectionFormData = z.infer<typeof TripCollectionSchema>;
export type TripFormData = z.infer<typeof TripFormSchema>;
export type ItineraryDayData = z.infer<typeof ItineraryDaySchema>;
export type DepartureDateAdminData = z.infer<typeof DepartureDateAdminSchema>;
export type PickupPointAdminData = z.infer<typeof PickupPointAdminSchema>;

