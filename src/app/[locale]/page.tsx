import React from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { 
  Sparkles, Star, ShieldCheck, Users, 
  MapPin, Calendar, ArrowRight, CheckCircle2, PhoneCall 
} from "lucide-react";
import { HeroSection } from "@/components/hero/HeroSection";
import { WeekendCarousel } from "@/components/shared/WeekendCarousel";
import { TripFilterTabs } from "@/components/shared/TripFilterTabs";
import { TailorMadeSection } from "@/components/shared/TailorMadeSection";
import { B2BSection } from "@/components/shared/B2BSection";
import { WhyChooseUsSection } from "@/components/shared/WhyChooseUsSection";
import { GoogleReviewsSection } from "@/components/shared/GoogleReviewsSection";
import { SocialCommunitySection } from "@/components/shared/SocialCommunitySection";
import { BlogInspirationSection } from "@/components/shared/BlogInspirationSection";
import { FaqSection } from "@/components/shared/FaqSection";
import { TripCardProps } from "@/components/shared/TripCard";
import { prisma } from "@/lib/prisma";

/**
 * Mappe un circuit Prisma vers les props du composant TripCard
 */
function mapTripToCardProps(trip: any, locale: string): TripCardProps {
  const isAr = locale === "ar";

  // Prochain départ à venir
  const now = new Date();
  const upcomingDeparture = trip.departureDates
    ?.filter((d: any) => new Date(d.startDate) >= now)
    ?.sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())?.[0];

  let nextDate: string | undefined;
  if (upcomingDeparture) {
    nextDate = new Date(upcomingDeparture.startDate).toLocaleDateString(
      isAr ? "ar-MA" : "fr-FR",
      { day: "numeric", month: "long", year: "numeric" }
    );
  }

  // Déterminer le tag en fonction du statut
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
    tagType = "popular";
  }

  // Catégorie basée sur le type de voyage
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
  };
}

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "home" });
  const brand = await getTranslations({ locale, namespace: "brand" });

  // Récupération des circuits RÉELS depuis Supabase PostgreSQL
  let weekendTrips: TripCardProps[] = [];
  let catalogTrips: TripCardProps[] = [];

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

    // Séparer les circuits par type : Weekend (court) vs Catalogue (tous)
    const weekendTypes = ["WEEKEND_BREAK", "DAY_TRIP"];

    weekendTrips = dbTrips
      .filter((t) => t.isScheduledThisWeek || weekendTypes.includes(t.tripType) || t.durationDays <= 2)
      .map((t) => mapTripToCardProps(t, locale));

    catalogTrips = dbTrips.map((t) => mapTripToCardProps(t, locale));

    // Si pas de weekend trips dédiés, prendre les 4 premiers circuits
    if (weekendTrips.length === 0 && catalogTrips.length > 0) {
      weekendTrips = catalogTrips.slice(0, 4);
    }
  } catch (error) {
    console.error("Erreur récupération circuits pour Homepage:", error);
  }

  return (
    <div className="space-y-0">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION — CINEMATIC SLOW-MOTION EXPERIENCE */}
      {/* ========================================================================= */}
      <HeroSection />

      {/* ========================================================================= */}
      {/* 2. WEEKEND TRIPS EXPRESS CAROUSEL */}
      {/* ========================================================================= */}
      <WeekendCarousel trips={weekendTrips} />

      {/* ========================================================================= */}
      {/* 3. SIGNATURE TOURS CATALOG WITH THEMATIC TABS */}
      {/* ========================================================================= */}
      <TripFilterTabs trips={catalogTrips} />

      {/* ========================================================================= */}
      {/* 4. TAILOR-MADE & PRIVATE GROUPS */}
      {/* ========================================================================= */}
      <TailorMadeSection />

      {/* ========================================================================= */}
      {/* 5. B2B & TEAM BUILDING CORPORATE (MIDNIGHT DARK THEME) */}
      {/* ========================================================================= */}
      <B2BSection />

      {/* ========================================================================= */}
      {/* 6. WHY CHOOSE RAHALAT BLADNA (REASSURANCE) */}
      {/* ========================================================================= */}
      <WhyChooseUsSection />

      {/* ========================================================================= */}
      {/* 7. VERIFIED GOOGLE REVIEWS */}
      {/* ========================================================================= */}
      <GoogleReviewsSection />

      {/* ========================================================================= */}
      {/* 8. INSTAGRAM & FACEBOOK SOCIAL HUB (COMMUNITY) */}
      {/* ========================================================================= */}
      <SocialCommunitySection />

      {/* ========================================================================= */}
      {/* 9. TRAVEL GUIDES & INSPIRATION (BLOG) */}
      {/* ========================================================================= */}
      <BlogInspirationSection />

      {/* ========================================================================= */}
      {/* 10. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      {/* ========================================================================= */}
      <FaqSection />
    </div>
  );
}
