"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { 
  Flame, Sparkles, ArrowRight, X, Calendar, 
  MapPin, Clock, AlertCircle, CheckCircle2 
} from "lucide-react";
import { formatMAD } from "@/lib/utils";

export interface ScheduledTripInfo {
  id: string;
  titleFr: string;
  titleAr?: string | null;
  slug: string;
  coverImageUrl?: string | null;
  basePrice: number | string;
  durationDays: number;
  durationNights: number;
  destinationRegion: string;
  featuredWeekMessage?: string | null;
  departureDates?: Array<{
    id: string;
    startDate: string | Date;
    status: string;
  }>;
}

interface ScheduledWeekBannerProps {
  currentTripSlug: string;
  isCurrentTripScheduled?: boolean;
  currentTripFeaturedMessage?: string | null;
  scheduledTrip?: ScheduledTripInfo | null;
  scheduledTrips?: ScheduledTripInfo[] | null;
}

export function ScheduledWeekBanner({
  currentTripSlug,
  isCurrentTripScheduled = false,
  currentTripFeaturedMessage,
  scheduledTrip,
  scheduledTrips,
}: ScheduledWeekBannerProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [isDismissed, setIsDismissed] = useState(false);

  // Liste de tous les circuits planifiés cette semaine
  const allScheduledTrips: ScheduledTripInfo[] = scheduledTrips && scheduledTrips.length > 0
    ? scheduledTrips
    : (scheduledTrip ? [scheduledTrip] : []);

  // Filtrer les circuits programmés qui ne sont pas le circuit courant
  const otherScheduledTrips = allScheduledTrips.filter((t) => t.slug !== currentTripSlug);

  useEffect(() => {
    // Vérifier si l'utilisateur a masqué la bannière d'alerte pour cette session
    if (typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem("dismissed_scheduled_week_banner");
      if (dismissed === "all_scheduled" || (otherScheduledTrips.length === 1 && dismissed === otherScheduledTrips[0]?.slug)) {
        setIsDismissed(true);
      }
    }
  }, [otherScheduledTrips.length]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("dismissed_scheduled_week_banner", "all_scheduled");
    }
  };

  const scrollToBooking = () => {
    const el = document.getElementById("booking-card-section") || document.querySelector(".lg\\:col-span-4");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // CAS 1 : Le visiteur est sur la fiche D'UN CIRCUIT VEDETTE DE LA SEMAINE
  if (isCurrentTripScheduled) {
    const defaultMsg = isAr
      ? "هذه الرحلة مبرمجة ومؤكدة الانطلاق لعطلة نهاية هذا الأسبوع! بادر بحجز مقعدك قبل اكتمال العدد."
      : "Ce circuit est notre grand départ officiel garanti pour ce week-end ! Réservez vite votre place avant fermeture des inscriptions.";

    const displayMsg = currentTripFeaturedMessage || defaultMsg;

    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl shadow-amber-500/15 border border-amber-400/40 p-4 sm:p-5 mb-8 animate-in fade-in slide-in-from-top-3 duration-500">
        {/* Decorative ambient background glows */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-orange-950/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white text-amber-600 flex items-center justify-center shrink-0 shadow-md shadow-black/10">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-black/20 backdrop-blur-md text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>{isAr ? "الرحلة الرسمية لعطلة نهاية هذا الأسبوع" : "Circuit Vedette du Week-end"}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10.5px] font-black uppercase tracking-wider">
                  {isAr ? "انطلاق مضمون 100%" : "Départ Garanti"}
                </span>
              </div>

              <p className="text-sm sm:text-base font-bold text-white/95 leading-snug">
                {displayMsg}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={scrollToBooking}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-white hover:bg-amber-50 active:scale-95 text-amber-600 hover:text-amber-700 font-black text-xs sm:text-sm shadow-lg shadow-black/10 transition-all cursor-pointer"
            >
              <span>{isAr ? "احجز مقعدك الآن" : "Réserver ce Départ"}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CAS 2 : Le visiteur est sur UN AUTRE circuit et il existe 1 OU PLUSIEURS circuits planifiés cette semaine
  if (otherScheduledTrips.length > 0 && !isDismissed) {
    // Sous-cas A : Exactement 1 circuit vedette actif
    if (otherScheduledTrips.length === 1) {
      const singleTrip = otherScheduledTrips[0];
      const defaultMsg = isAr
        ? `هل تخطط للسفر في عطلة نهاية هذا الأسبوع؟ انطلاقنا المؤكد والرسمي هو ${singleTrip.titleAr || singleTrip.titleFr} !`
        : `Vous prévoyez de partir ce week-end ? Notre départ garanti officiel de la semaine est ${singleTrip.titleFr} !`;

      const displayMsg = singleTrip.featuredWeekMessage || defaultMsg;

      return (
        <aside 
          aria-label="Notification de départ vedette de la semaine"
          className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-950/20 border border-amber-500/40 p-4 sm:p-5 mb-8 animate-in fade-in slide-in-from-top-4 duration-500"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 mt-0.5">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10.5px] font-black uppercase tracking-wider border border-amber-500/30 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>{isAr ? "انطلاق هذا الأسبوع" : "Départ cette Semaine"}</span>
                  </span>
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                    {isAr ? "وجهة الويكند المؤكدة" : "Le voyage vedette au départ ce week-end"}
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  <span className="font-extrabold text-amber-400 mr-1.5">
                    {isAr ? singleTrip.titleAr || singleTrip.titleFr : singleTrip.titleFr}
                  </span>
                  — {displayMsg}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={`/${locale}/trips/${singleTrip.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                <span>{isAr ? "اكتشف رحلة الويكند" : "Voir le Départ ce Week-end"}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>

              <button
                onClick={handleDismiss}
                title={isAr ? "إغلاق التنبيه" : "Masquer cette notification"}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Fermer la notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      );
    }

    // Sous-cas B : Plusieurs circuits vedettes programmés simultanément ce week-end
    return (
      <aside 
        aria-label="Notification de départs vedettes multiples de la semaine"
        className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-950/20 border border-amber-500/40 p-4 sm:p-5 mb-8 animate-in fade-in slide-in-from-top-4 duration-500"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500" />

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10.5px] font-black uppercase tracking-wider border border-amber-500/30">
                    {isAr ? "رحلات مؤكدة الانطلاق هذا الأسبوع" : `${otherScheduledTrips.length} Départs Confirmés ce Week-end`}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
                    {isAr ? "انطلاق مضمون" : "Départ Garanti"}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 font-medium">
                  {isAr
                    ? "هل ترغب في السفر نهاية هذا الأسبوع؟ اختر من بين برامجنا المبرمجة رسمياً :"
                    : "Envie de vous évader ce week-end ? Choisissez parmi nos circuits confirmés au départ :"}
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              title={isAr ? "إغلاق التنبيه" : "Masquer cette notification"}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
              aria-label="Fermer la notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Grille des circuits vedettes de la semaine */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {otherScheduledTrips.map((st) => (
              <Link
                key={st.id}
                href={`/${locale}/trips/${st.slug}`}
                className="group flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-amber-500/20 hover:border-amber-500/60 transition-all shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-amber-400 truncate group-hover:text-amber-300 transition">
                    {isAr ? st.titleAr || st.titleFr : st.titleFr}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{st.durationDays}J / {st.durationNights}N</span>
                    <span>•</span>
                    <span className="font-bold text-white">{formatMAD(Number(st.basePrice || 0))}</span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-amber-500/10 group-hover:bg-amber-500 text-amber-400 group-hover:text-white flex items-center justify-center shrink-0 transition">
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return null;
}
