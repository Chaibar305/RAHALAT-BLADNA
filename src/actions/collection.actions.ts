"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/adminAuth";
import { TripCollectionSchema, TripCollectionFormData } from "@/lib/validations/trip.schema";

const db = prisma as any;

export interface SerializedCollection {
  id: string;
  slug: string;
  scope: "NATIONAL" | "INTERNATIONAL";
  nameFr: string;
  nameAr: string | null;
  nameEn: string | null;
  descriptionFr: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  coverImage: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    trips: number;
  };
  trips?: {
    id: string;
    titleFr: string;
    titleAr: string;
    slug: string;
    coverImageUrl: string;
    scope: "NATIONAL" | "INTERNATIONAL";
  }[];
}

/**
 * Récupère toutes les collections avec le comptage des circuits associés
 */
export async function getCollectionsAction(scope?: "NATIONAL" | "INTERNATIONAL") {
  try {
    const whereClause: any = {};
    if (scope) {
      whereClause.scope = scope;
    }

    const collections = await db.tripCollection.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { trips: true },
        },
        trips: {
          select: {
            id: true,
            titleFr: true,
            titleAr: true,
            slug: true,
            coverImageUrl: true,
            scope: true,
          },
        },
      },
      orderBy: [
        { displayOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return {
      success: true,
      collections: JSON.parse(JSON.stringify(collections)) as SerializedCollection[],
    };
  } catch (error: any) {
    console.error("Erreur getCollectionsAction:", error);
    return {
      success: false,
      collections: [] as SerializedCollection[],
      error: error.message || "Erreur de récupération des collections",
    };
  }
}

/**
 * Récupère une collection spécifique par ID ou par slug
 */
export async function getCollectionByIdAction(idOrSlug: string) {
  try {
    const collection = await db.tripCollection.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        _count: {
          select: { trips: true },
        },
        trips: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!collection) {
      return { success: false, error: "Collection introuvable" };
    }

    return {
      success: true,
      collection: JSON.parse(JSON.stringify(collection)) as SerializedCollection,
    };
  } catch (error: any) {
    console.error("Erreur getCollectionByIdAction:", error);
    return { success: false, error: error.message || "Erreur serveur" };
  }
}

/**
 * Crée une nouvelle collection de circuits
 */
export async function createCollectionAction(data: TripCollectionFormData) {
  await requireAdminSession("CREATE_TRIP_COLLECTION");

  const parsed = TripCollectionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.format() };
  }

  const valid = parsed.data;

  try {
    // Vérifier l'unicité du slug
    const existing = await db.tripCollection.findUnique({
      where: { slug: valid.slug },
    });

    if (existing) {
      return { success: false, error: "Une collection avec ce slug existe déjà." };
    }

    const created = await db.tripCollection.create({
      data: {
        slug: valid.slug,
        scope: valid.scope as any,
        nameFr: valid.nameFr,
        nameAr: valid.nameAr || null,
        nameEn: valid.nameEn || null,
        descriptionFr: valid.descriptionFr || null,
        descriptionAr: valid.descriptionAr || null,
        descriptionEn: valid.descriptionEn || null,
        coverImage: valid.coverImage || null,
        displayOrder: valid.displayOrder || 0,
        isActive: valid.isActive ?? true,
      },
      include: {
        _count: { select: { trips: true } },
      },
    });

    revalidatePath("/admin/trips");
    revalidatePath("/[locale]/admin/trips", "page");

    return {
      success: true,
      collection: JSON.parse(JSON.stringify(created)) as SerializedCollection,
    };
  } catch (error: any) {
    console.error("Erreur createCollectionAction:", error);
    return { success: false, error: error.message || "Erreur de création de collection" };
  }
}

/**
 * Met à jour une collection existante
 */
export async function updateCollectionAction(id: string, data: TripCollectionFormData) {
  await requireAdminSession("UPDATE_TRIP_COLLECTION");

  const parsed = TripCollectionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.format() };
  }

  const valid = parsed.data;

  try {
    // Vérifier l'unicité du slug si modifié
    const existing = await db.tripCollection.findFirst({
      where: {
        slug: valid.slug,
        NOT: { id },
      },
    });

    if (existing) {
      return { success: false, error: "Une autre collection avec ce slug existe déjà." };
    }

    const updated = await db.tripCollection.update({
      where: { id },
      data: {
        slug: valid.slug,
        scope: valid.scope as any,
        nameFr: valid.nameFr,
        nameAr: valid.nameAr || null,
        nameEn: valid.nameEn || null,
        descriptionFr: valid.descriptionFr || null,
        descriptionAr: valid.descriptionAr || null,
        descriptionEn: valid.descriptionEn || null,
        coverImage: valid.coverImage || null,
        displayOrder: valid.displayOrder || 0,
        isActive: valid.isActive ?? true,
      },
      include: {
        _count: { select: { trips: true } },
      },
    });

    revalidatePath("/admin/trips");
    revalidatePath("/[locale]/admin/trips", "page");

    return {
      success: true,
      collection: JSON.parse(JSON.stringify(updated)) as SerializedCollection,
    };
  } catch (error: any) {
    console.error("Erreur updateCollectionAction:", error);
    return { success: false, error: error.message || "Erreur de mise à jour de la collection" };
  }
}

/**
 * Supprime une collection (les circuits rattachés passent à collectionId = null via onDelete: SetNull)
 */
export async function deleteCollectionAction(id: string) {
  await requireAdminSession("DELETE_TRIP_COLLECTION");

  try {
    await db.tripCollection.delete({
      where: { id },
    });

    revalidatePath("/admin/trips");
    revalidatePath("/[locale]/admin/trips", "page");

    return { success: true };
  } catch (error: any) {
    console.error("Erreur deleteCollectionAction:", error);
    return { success: false, error: error.message || "Erreur lors de la suppression de la collection" };
  }
}

/**
 * Active ou désactive rapidement une collection
 */
export async function toggleCollectionActiveAction(id: string, isActive: boolean) {
  await requireAdminSession("TOGGLE_TRIP_COLLECTION");

  try {
    const updated = await db.tripCollection.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath("/admin/trips");
    revalidatePath("/[locale]/admin/trips", "page");

    return { success: true, isActive: updated.isActive };
  } catch (error: any) {
    console.error("Erreur toggleCollectionActiveAction:", error);
    return { success: false, error: error.message || "Erreur de modification du statut" };
  }
}

/**
 * Associe des circuits à une collection en masse
 */
export async function assignTripsToCollectionAction(collectionId: string | null, tripIds: string[]) {
  await requireAdminSession("ASSIGN_TRIPS_COLLECTION");

  try {
    if (!tripIds || tripIds.length === 0) {
      return { success: true, count: 0 };
    }

    const res = await db.trip.updateMany({
      where: {
        id: { in: tripIds },
      },
      data: {
        collectionId: collectionId || null,
      },
    });

    revalidatePath("/admin/trips");
    revalidatePath("/[locale]/admin/trips", "page");

    return { success: true, count: res.count };
  } catch (error: any) {
    console.error("Erreur assignTripsToCollectionAction:", error);
    return { success: false, error: error.message || "Erreur d'assignation" };
  }
}

/**
 * Initialise des collections par défaut si la table est vide
 */
export async function seedInitialCollectionsAction() {
  await requireAdminSession("SEED_COLLECTIONS");

  try {
    const count = await db.tripCollection.count();
    if (count > 0) {
      return { success: false, message: "Les collections existent déjà." };
    }

    const defaultCollections = [
      {
        slug: "sahara-bivouac",
        scope: "NATIONAL" as const,
        nameFr: "Sahara & Bivouac",
        nameAr: "الصحراء والمبيت في المخيمات",
        nameEn: "Sahara & Desert Bivouac",
        descriptionFr: "Circuits d'immersion totale au cœur des dunes dorées de Merzouga et Zagora sous les étoiles.",
        descriptionAr: "رحلات استكشافية متكاملة لرمال مرزوكة وزاكورة والمبيت تحت النجوم الصحراوية.",
        descriptionEn: "Total immersion tours in the golden dunes of Merzouga and Zagora under starry skies.",
        coverImage: "/images/merzouga/cover-merzouga.jpg",
        displayOrder: 1,
        isActive: true,
      },
      {
        slug: "montagnes-trekking",
        scope: "NATIONAL" as const,
        nameFr: "Montagnes & Trekking",
        nameAr: "الجبال والمغامرات الطبيعية",
        nameEn: "Mountains & Trekking",
        descriptionFr: "Randonnées, sommets du Toubkal, cascades d'Ouzoud et vallées préservées de l'Atlas.",
        descriptionAr: "تسلق القمم، شلالات أوزود ووديان الأطلس الخلابة لعشاق الطبيعة والمغامرة.",
        descriptionEn: "Hiking, Toubkal peak ascents, Ouzoud falls and pristine Atlas valleys.",
        coverImage: "/images/merzouga/cover-merzouga.jpg",
        displayOrder: 2,
        isActive: true,
      },
      {
        slug: "week-ends-express",
        scope: "NATIONAL" as const,
        nameFr: "Week-ends Express",
        nameAr: "عطلات نهاية الأسبوع السريعة",
        nameEn: "Weekend Getaways",
        descriptionFr: "Escapades de 2 à 3 jours au départ de Casablanca et Rabat pour déconnecter rapidement.",
        descriptionAr: "رحلات سريعة من يومين إلى 3 أيام انطلاقاً من الدار البيضاء والرباط لتجديد الطاقة.",
        descriptionEn: "Short 2 to 3 days breaks departing from Casablanca and Rabat to recharge.",
        coverImage: "/images/merzouga/cover-merzouga.jpg",
        displayOrder: 3,
        isActive: true,
      },
      {
        slug: "turquie-omra",
        scope: "INTERNATIONAL" as const,
        nameFr: "Turquie & Omra",
        nameAr: "تركيا والعمرة المباركة",
        nameEn: "Turkey & Umrah",
        descriptionFr: "Séjours spirituels vers les Lieux Saints et circuits magiques à Istanbul et Cappadoce.",
        descriptionAr: "رحلات العمرة إلى الديار المقدسة وجولات سياحية ساحرة في إسطنبول وكبادوكيا.",
        descriptionEn: "Spiritual journeys to the Holy Sites and magical tours in Istanbul and Cappadocia.",
        coverImage: "/images/merzouga/cover-merzouga.jpg",
        displayOrder: 4,
        isActive: true,
      },
      {
        slug: "europe-mediterranee",
        scope: "INTERNATIONAL" as const,
        nameFr: "Europe & Méditerranée",
        nameAr: "أوروبا وحوض البحر الأبيض المتوسط",
        nameEn: "Europe & Mediterranean",
        descriptionFr: "Séjours organisés en Andalousie, Lisbonne, Italie et escapades méditerranéennes.",
        descriptionAr: "رحلات منظمة إلى الأندلس، لشبونة، إيطاليا وأجمل الوجهات المتوسطية.",
        descriptionEn: "Organized stays in Andalusia, Lisbon, Italy and Mediterranean getaways.",
        coverImage: "/images/merzouga/cover-merzouga.jpg",
        displayOrder: 5,
        isActive: true,
      },
    ];

    for (const col of defaultCollections) {
      await db.tripCollection.create({
        data: col as any,
      });
    }

    revalidatePath("/admin/trips");
    return { success: true, count: defaultCollections.length };
  } catch (error: any) {
    console.error("Erreur seedInitialCollectionsAction:", error);
    return { success: false, error: error.message };
  }
}
