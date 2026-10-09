import { z } from "zod";

const stringOrEmpty = z.preprocess((val) => (val === null || val === undefined ? "" : String(val)), z.string()).default("");
const stringOrNull = z.preprocess((val) => (val === null || val === undefined || String(val).trim() === "" ? null : String(val).trim()), z.string().nullable().optional());

export const ItineraryDaySchema = z.object({
  id: z.string().optional().nullable(),
  dayNumber: z.coerce.number().min(1),
  titleFr: z.string().min(1, "Le titre FR est requis"),
  titleAr: stringOrEmpty,
  titleEn: stringOrNull,
  timeSlot: stringOrNull,
  locationName: stringOrNull,
  location: stringOrEmpty,
  featuredImage: stringOrEmpty,
  meals: z.array(z.string()).default([]),
  descriptionFr: stringOrEmpty,
  descriptionAr: stringOrEmpty,
  descriptionEn: stringOrNull,
  activityTags: z.array(z.string()).default([]),
  addons: z.array(
    z.object({
      id: z.string().optional().nullable(),
      titleFr: stringOrEmpty,
      titleAr: stringOrEmpty,
      price: z.coerce.number().min(0).default(0),
      isOptional: z.boolean().default(true),
    })
  ).default([]),
});

export const DepartureDateAdminSchema = z.object({
  id: z.string().optional().nullable(),
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().min(1, "Date de fin requise"),
  totalSeats: z.coerce.number().min(1).default(18),
  bookedSeats: z.coerce.number().min(0).default(0),
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
  specificPrice: z.coerce.number().optional().nullable(),
  tourLeaderName: stringOrNull,
});

export const PickupPointAdminSchema = z.object({
  id: z.string().optional().nullable(),
  cityName: z.string().min(1, "La ville est requise"),
  city: stringOrNull,
  locationName: stringOrEmpty,
  departureTime: z.preprocess((val) => (val === null || val === undefined || String(val).trim() === "" ? "07:00" : String(val)), z.string()).default("07:00"),
  meetingTime: stringOrNull,
  googleMapsUrl: stringOrNull,
  orderIndex: z.coerce.number().optional().default(0),
});

export const TripExtraOptionSchema = z.object({
  id: z.string().optional().nullable(),
  nameFr: z.string().min(1, "Le nom de l'option est requis"),
  nameAr: stringOrNull,
  nameEn: stringOrNull,
  price: z.coerce.number().min(0, "Le prix unitaire doit être supérieur ou égal à 0"),
  isPerPerson: z.boolean().default(true),
  maxQuantity: z.coerce.number().optional().nullable(),
  descriptionFr: stringOrNull,
  descriptionAr: stringOrNull,
  descriptionEn: stringOrNull,
});

export const TripFormSchema = z.object({
  id: z.string().optional().nullable(),
  titleFr: z.string().min(1, "Le titre en français est requis"),
  titleAr: stringOrEmpty,
  titleEn: stringOrNull,
  slug: z.string().min(1, "Le slug est requis").regex(/^[a-z0-9-]+$/, "Format slug invalide (ex: magie-desert-merzouga)"),
  tripType: z.enum(["WEEKEND_BREAK", "MULTI_DAY_TOUR", "DAY_TRIP", "TREKKING_HIKING", "SAHARA_SPECIAL"]).default("WEEKEND_BREAK"),
  destinationRegion: z.preprocess((val) => (val === null || val === undefined || String(val).trim() === "" ? "Maroc" : String(val)), z.string()).default("Maroc"),
  departureCity: z.preprocess((val) => (val === null || val === undefined || String(val).trim() === "" ? "Casablanca" : String(val)), z.string()).default("Casablanca"),
  durationDays: z.coerce.number().min(1, "Au moins 1 jour"),
  durationNights: z.coerce.number().min(0).default(0),
  basePrice: z.coerce.number().min(0, "Le prix de base est requis"),
  depositPerPerson: z.coerce.number().min(0).default(500),
  singleSupplement: z.coerce.number().min(0).default(350),
  coverImageUrl: stringOrEmpty,
  shortDescriptionFr: stringOrEmpty,
  shortDescriptionAr: stringOrEmpty,
  shortDescriptionEn: stringOrNull,
  longDescriptionFr: stringOrEmpty,
  longDescriptionAr: stringOrEmpty,
  longDescriptionEn: stringOrNull,
  overviewFr: stringOrNull,
  overviewAr: stringOrNull,
  overviewEn: stringOrNull,
  showOverview: z.boolean().default(true),
  isGuaranteed: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isScheduledThisWeek: z.boolean().default(false),
  featuredWeekMessage: stringOrNull,
  isPublished: z.boolean().default(true),
  scope: z.enum(["NATIONAL", "INTERNATIONAL"]).default("NATIONAL"),
  collectionId: stringOrNull,
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
  notIncludedFr: z.array(z.string()).default([]),
  whatToBring: z.array(z.string()).default([]),
  extraOptions: z.array(TripExtraOptionSchema).default([]),
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
export type TripExtraOptionData = z.infer<typeof TripExtraOptionSchema>;
