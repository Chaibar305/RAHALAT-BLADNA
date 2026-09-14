import React from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { 
  MapPin, Calendar, Users, ArrowRight, 
  Sparkles, Filter, ShieldCheck, Compass 
} from "lucide-react";
import { TripCard, TripCardProps } from "@/components/shared/TripCard";
import { HeroSearch } from "@/components/shared/HeroSearch";
import { prisma } from "@/lib/prisma";

export default async function TripsCatalogPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const t = await getTranslations({ locale, namespace: "home" });
  const isAr = locale === "ar";

  // Récupération des circuits RÉELS depuis Supabase PostgreSQL
  let allTrips: TripCardProps[] = [];

  try {
    const dbTrips = await prisma.trip.findMany({
      where: {
        isActive: true,
        publishStatus: "PUBLISHED",
      },
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

    const now = new Date();

    allTrips = dbTrips.map((trip) => {
      const upcomingDeparture = trip.departureDates
        ?.filter((d) => new Date(d.startDate) >= now)
        ?.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())?.[0];

      let nextDate: string | undefined;
      if (upcomingDeparture) {
        nextDate = new Date(upcomingDeparture.startDate).toLocaleDateString(
          isAr ? "ar-MA" : "fr-FR",
          { day: "numeric", month: "long", year: "numeric" }
        );
      }

      let tag = isAr ? "مفتوح للحجز" : "Ouvert à la réservation";
      let tagType: TripCardProps["tagType"] = "popular";

      if (upcomingDeparture) {
        if (upcomingDeparture.status === "GUARANTEED") {
          tag = isAr ? "مؤكد الانطلاق" : "Départ Garanti";
          tagType = "guaranteed";
        } else if (upcomingDeparture.status === "ALMOST_FULL") {
          tag = isAr ? "آخر المقاعد" : "Dernières places";
          tagType = "warning";
        } else if (upcomingDeparture.status === "SOLD_OUT") {
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
    <div className="bg-tp-ivory min-h-screen pb-24">
      {/* Header Banner */}
      <div className="bg-tp-midnight text-white py-14 border-b border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-moroccan-pattern-dark opacity-30 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-pill bg-white/10 text-tp-cyan-soft text-xs font-black uppercase tracking-widest">
            <Compass className="w-3.5 h-3.5" />
            <span>Catalogue Officiel Rahalat Bladna</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
            {locale === "ar" ? "جميع رحلاتنا وبرامجنا السياحية بالمغرب" : "Tous nos circuits organisés au Maroc"}
          </h1>

          <p className="text-xs sm:text-sm text-tp-ivory/75 max-w-2xl mx-auto">
            {locale === "ar"
              ? "استكشف أحدث البرامج السياحية المنظمة برعاية نقل سياحي معتمد TIST ومرشدين معتمدين."
              : "Circuits guidés, escapades du week-end et expéditions désert avec transport touristique grand confort agréé TIST."}
          </p>

          <div className="pt-4 max-w-3xl mx-auto">
            <HeroSearch />
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-tp-muted">
            <Filter className="w-4 h-4 text-tp-cyan-hover" />
            <span>
              {allTrips.length} {locale === "ar" ? "رحلات متوفرة للحجز" : "voyages disponibles"}
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-tp-ok-fg bg-tp-ok-bg px-3 py-1 rounded-pill">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% Départs Garantis
          </span>
        </div>

        {allTrips.length === 0 ? (
          <div className="col-span-full text-center py-16 space-y-4">
            <Compass className="w-12 h-12 text-tp-muted/40 mx-auto" />
            <h3 className="text-lg font-black text-tp-midnight">
              {isAr ? "لا توجد رحلات متاحة حالياً" : "Aucun voyage disponible pour le moment"}
            </h3>
            <p className="text-xs text-tp-muted max-w-md mx-auto">
              {isAr
                ? "نعمل على إعداد برامج سياحية جديدة. تابعونا قريباً!"
                : "Nous préparons de nouveaux circuits passionnants. Revenez bientôt !"}
            </p>
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
