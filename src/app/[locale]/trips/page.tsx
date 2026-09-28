import React from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { 
  MapPin, Calendar, Users, ArrowRight, 
  Sparkles, Filter, ShieldCheck, Compass, X, RotateCcw, Search 
} from "lucide-react";
import { TripCard, TripCardProps } from "@/components/shared/TripCard";
import { HeroSearch } from "@/components/shared/HeroSearch";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export default async function TripsCatalogPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const t = await getTranslations({ locale, namespace: "home" });
  const isAr = locale === "ar";

  const rawQuery = typeof searchParams?.q === "string" ? searchParams.q.trim() : undefined;
  const rawCity = typeof searchParams?.city === "string" ? searchParams.city.trim() : undefined;
  const rawDate = typeof searchParams?.date === "string" ? searchParams.date.trim() : undefined;

  // 1. Assainissement des paramètres de requête (Sanitization)
  const isQueryValid = Boolean(
    rawQuery && 
    rawQuery.length > 0 && 
    rawQuery !== "all" && 
    rawQuery !== "undefined"
  );
  const query = isQueryValid ? (rawQuery as string) : undefined;

  const isCityValid = Boolean(
    rawCity &&
    rawCity.length > 0 &&
    rawCity !== "all" &&
    rawCity !== "undefined" &&
    !rawCity.toLowerCase().includes("toutes") &&
    !rawCity.toLowerCase().includes("جميع")
  );
  const city = isCityValid ? (rawCity as string) : undefined;

  const isDateValid = Boolean(
    rawDate && 
    rawDate !== "all" && 
    rawDate !== "undefined" && 
    /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
  );
  const date = isDateValid ? (rawDate as string) : undefined;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Condition de base : circuits actifs et publiés uniquement
  const whereConditions: Prisma.TripWhereInput[] = [
    { isActive: true },
    { publishStatus: "PUBLISHED" },
  ];

  // 1. RECHERCHE TEXTUELLE MULTI-CHAMPS INSENSIBLE À LA CASSE (Postgres mode: 'insensitive')
  if (query) {
    whereConditions.push({
      OR: [
        { titleFr: { contains: query, mode: "insensitive" } },
        { titleAr: { contains: query, mode: "insensitive" } },
        { slug: { contains: query.toLowerCase(), mode: "insensitive" } },
        { destinationRegion: { contains: query, mode: "insensitive" } },
        { departureCity: { contains: query, mode: "insensitive" } },
        { shortDescriptionFr: { contains: query, mode: "insensitive" } },
        { shortDescriptionAr: { contains: query, mode: "insensitive" } },
        { overviewFr: { contains: query, mode: "insensitive" } },
        { overviewAr: { contains: query, mode: "insensitive" } },
      ],
    });
  }

  // 2. FILTRE VILLE DE DÉPART (Assaini)
  if (city) {
    whereConditions.push({
      departureCity: { contains: city, mode: "insensitive" },
    });
  }

  // 3. FILTRE DATE DE DÉPART (Bornes précises 00:00:00.000Z -> J+1 00:00:00.000Z pour éviter tout décalage horaire)
  let formattedFilterDate: string | null = null;
  if (date) {
    const [year, month, day] = date.split("-").map(Number);
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0));

    whereConditions.push({
      departureDates: {
        some: {
          status: { in: ["OPEN_FOR_BOOKING", "GUARANTEED", "ALMOST_FULL"] },
          startDate: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      },
    });

    formattedFilterDate = startOfDay.toLocaleDateString(isAr ? "ar-MA" : "fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  const whereClause: Prisma.TripWhereInput = {
    AND: whereConditions,
  };

  const hasActiveFilters = Boolean(date || query || city);

  // Helper pour générer les liens de suppression individuelle de filtre
  const createFilterUrl = (excludeKey: "date" | "city" | "q") => {
    const params = new URLSearchParams();
    if (excludeKey !== "q" && query) params.set("q", query);
    if (excludeKey !== "city" && city) params.set("city", city);
    if (excludeKey !== "date" && date) params.set("date", date);
    const qs = params.toString();
    return `/${locale}/trips${qs ? `?${qs}` : ""}`;
  };

  // Récupération des circuits RÉELS depuis Supabase PostgreSQL
  let allTrips: TripCardProps[] = [];

  try {
    const dbTrips = await prisma.trip.findMany({
      where: whereClause,
      include: {
        departureDates: {
          orderBy: { startDate: "asc" },
        },
      },
      orderBy: [
        { isScheduledThisWeek: "desc" },
        { isFeatured: "desc" },
        { createdAt: "desc" },
      ],
    });

    allTrips = dbTrips.map((trip) => {
      // Si une date spécifique est demandée, on privilégie le départ de cette date
      let matchingDeparture = null;
      if (date) {
        matchingDeparture = trip.departureDates?.find((d) => {
          const dStr = new Date(d.startDate).toISOString().split("T")[0];
          return dStr === date;
        });
      }

      const departureToDisplay = matchingDeparture || trip.departureDates
        ?.filter((d) => new Date(d.startDate) >= now)
        ?.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())?.[0];

      let nextDate: string | undefined;
      if (departureToDisplay) {
        nextDate = new Date(departureToDisplay.startDate).toLocaleDateString(
          isAr ? "ar-MA" : "fr-FR",
          { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }
        );
      }

      let tag = isAr ? "مفتوح للحجز" : "Ouvert à la réservation";
      let tagType: TripCardProps["tagType"] = "popular";

      if (departureToDisplay) {
        if (departureToDisplay.status === "GUARANTEED") {
          tag = isAr ? "مؤكد الانطلاق" : "Départ Garanti";
          tagType = "guaranteed";
        } else if (departureToDisplay.status === "ALMOST_FULL") {
          tag = isAr ? "آخر المقاعد" : "Dernières places";
          tagType = "warning";
        } else if (departureToDisplay.status === "SOLD_OUT") {
          tag = isAr ? "ممتلئ" : "Complet";
          tagType = "special";
        }
      }

      if (trip.isScheduledThisWeek) {
        tag = trip.featuredWeekMessage || (isAr ? "🔥 رحلة هذا الأسبوع" : "🔥 Départ ce Week-end");
        tagType = "warning";
      } else if (trip.isFeatured && tagType === "popular") {
        tag = isAr ? "الأكثر طلباً" : "Coup de Cœur";
      }

      const categoryMap: Record<string, string> = {
        WEEKEND_BREAK: isAr ? "نهاية الأسبوع" : "Week-end",
        DAY_TRIP: isAr ? "رحلة يومية" : "Excursion",
        MULTI_DAY_TOUR: isAr ? "جولة اكتشاف" : "Grand Tour",
        TREKKING_HIKING: isAr ? "مغامرة وتسلق" : "Atlas & Randonnées",
        SAHARA_SPECIAL: isAr ? "صحراء وكثبان" : "Désert & Sahara",
      };

      return {
        id: trip.id,
        slug: trip.slug,
        title: isAr ? trip.titleAr : trip.titleFr,
        region: trip.destinationRegion,
        duration: `${trip.durationDays}J / ${trip.durationNights}N`,
        departureCity: trip.departureCity,
        price: Number(trip.basePrice),
        deposit: Number(trip.depositPerPerson),
        image: trip.coverImageUrl || "/images/merzouga/cover-merzouga.jpg",
        tag,
        tagType,
        nextDate,
        category: categoryMap[trip.tripType] || (isAr ? "رحلة منظمة" : "Circuit"),
      } as TripCardProps;
    });
  } catch (error) {
    console.error("Erreur récupération circuits catalogue:", error);
  }

  return (
    <div className="bg-tp-ivory min-h-screen pb-24" dir={isAr ? "rtl" : "ltr"}>
      {/* Header Banner */}
      <div className="bg-tp-midnight text-white py-14 border-b border-white/10 relative z-40">
        <div className="absolute inset-0 bg-moroccan-pattern-dark opacity-30 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-pill bg-white/10 text-tp-cyan-soft text-xs font-black uppercase tracking-widest">
            <Compass className="w-3.5 h-3.5" />
            <span>{isAr ? "دليل رحلات بلادنا الرسمي" : "Catalogue Officiel Rahalat Bladna"}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
            {isAr ? "جميع رحلاتنا وبرامجنا السياحية بالمغرب" : "Tous nos circuits organisés au Maroc"}
          </h1>

          <p className="text-xs sm:text-sm text-tp-ivory/75 max-w-2xl mx-auto">
            {isAr
              ? "استكشف أحدث البرامج السياحية المنظمة برعاية نقل سياحي معتمد TIST ومرشدين معتمدين."
              : "Circuits guidés, escapades du week-end et expéditions désert avec transport touristique grand confort agréé TIST."}
          </p>

          <div className="pt-4 max-w-3xl mx-auto">
            <HeroSearch />
          </div>
        </div>
      </div>

      {/* Catalog Grid & Active Filter Pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-6">
        {/* Barre des filtres actifs */}
        {hasActiveFilters && (
          <div className="bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isAr ? "التصفيات الحالية :" : "Filtres actifs :"}
              </span>

              {/* Date active */}
              {date && formattedFilterDate && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 text-xs font-bold">
                  <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span className="capitalize">{formattedFilterDate}</span>
                  <Link
                    href={createFilterUrl("date")}
                    className="w-4 h-4 rounded-full bg-cyan-500/20 hover:bg-rose-500 hover:text-white flex items-center justify-center transition ml-1"
                    title={isAr ? "إزالة هذا التاريخ" : "Supprimer ce filtre de date"}
                  >
                    <X className="w-2.5 h-2.5" />
                  </Link>
                </div>
              )}

              {/* Ville active */}
              {city && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-bold">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="capitalize">{city}</span>
                  <Link
                    href={createFilterUrl("city")}
                    className="w-4 h-4 rounded-full bg-amber-500/20 hover:bg-rose-500 hover:text-white flex items-center justify-center transition ml-1"
                    title={isAr ? "إزالة المدينة" : "Supprimer la ville"}
                  >
                    <X className="w-2.5 h-2.5" />
                  </Link>
                </div>
              )}

              {/* Recherche par mot-clé active */}
              {query && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 text-xs font-bold">
                  <Search className="w-3.5 h-3.5 text-slate-500" />
                  <span>« {query} »</span>
                  <Link
                    href={createFilterUrl("q")}
                    className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-rose-500 hover:text-white flex items-center justify-center transition ml-1"
                    title={isAr ? "إزالة البحث" : "Supprimer la recherche"}
                  >
                    <X className="w-2.5 h-2.5" />
                  </Link>
                </div>
              )}
            </div>

            <Link
              href={`/${locale}/trips`}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-500 hover:text-rose-600 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isAr ? "إعادة تعيين الكل" : "Tout réinitialiser"}</span>
            </Link>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-tp-muted">
            <Filter className="w-4 h-4 text-tp-cyan-hover" />
            <span>
              {allTrips.length}{" "}
              {isAr
                ? `${allTrips.length <= 1 ? "رحلة متوفرة" : "رحلات متوفرة"} للحجز`
                : `${allTrips.length <= 1 ? "voyage disponible" : "voyages disponibles"}`}
              {date && formattedFilterDate ? ` pour le ${formattedFilterDate}` : ""}
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-tp-ok-fg bg-tp-ok-bg px-3 py-1 rounded-pill">
            <ShieldCheck className="w-3.5 h-3.5" />
            {isAr ? "100% انطلاقات مؤكدة" : "100% Départs Garantis"}
          </span>
        </div>

        {allTrips.length === 0 ? (
          <div className="col-span-full text-center py-20 px-4 bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-500 mx-auto flex items-center justify-center shadow-inner">
              <Calendar className="w-8 h-8" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {date
                  ? (isAr ? `لا توجد رحلات مبرمجة في ${formattedFilterDate || date}` : `Aucun départ trouvé pour le ${formattedFilterDate || date}`)
                  : (isAr ? "لا توجد رحلات مطابقة لمعايير البحث" : "Aucun voyage ne correspond à votre recherche")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? "جرّب تغيير تاريخ المغادرة أو تصفح كل التواريخ المتاحة لحجز عطلتك القادمة."
                  : "Essayez de choisir une autre date de départ ou découvrez l'ensemble de nos programmes ouverts à la réservation."}
              </p>
            </div>

            <div className="pt-2">
              <Link
                href={`/${locale}/trips`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition active:scale-95"
              >
                <Compass className="w-4 h-4" />
                <span>{isAr ? "عرض جميع الرحلات والتواريخ" : "Voir tous les départs disponibles"}</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {allTrips.map((trip) => (
              <TripCard key={trip.id} {...trip} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

