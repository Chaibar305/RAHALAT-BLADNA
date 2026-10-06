"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { 
  Sparkles, Compass, MapPin, ArrowRight, ArrowLeft, 
  Layers, Globe, CheckCircle2 
} from "lucide-react";
import { HomeCollectionItem } from "@/actions/trip-collection.actions";

interface HomeCollectionsSectionProps {
  collections: HomeCollectionItem[];
}

export function HomeCollectionsSection({ collections }: HomeCollectionsSectionProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [selectedScope, setSelectedScope] = useState<"ALL" | "NATIONAL" | "INTERNATIONAL">("ALL");

  if (!collections || collections.length === 0) {
    return null;
  }

  const nationalCount = collections.filter((c) => c.scope === "NATIONAL").length;
  const internationalCount = collections.filter((c) => c.scope === "INTERNATIONAL").length;

  const filteredCollections = collections.filter((c) => {
    if (selectedScope === "ALL") return true;
    return c.scope === selectedScope;
  });

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-y border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-tp-cyan/10 border border-tp-cyan/20 text-tp-cyan-hover dark:text-tp-cyan text-xs font-black uppercase tracking-wider mb-3">
              <Compass className="w-3.5 h-3.5 animate-spin-slow" />
              <span>
                {isAr ? "مجموعات وتصنيفات الرحلات" : "Collections & Thématiques"}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {isAr
                ? "استكشف المغرب والعالم عبر مجموعاتنا السياحية"
                : "Explorez le Maroc & le Monde par Collections"}
            </h2>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
              {isAr
                ? "من سحر الكثبان الرملية والمبيت في الصحراء إلى أجمل الجولات والرحلات الدولية، اختر التجربة التي تلبي تطلعاتك."
                : "Du silence envoûtant du Sahara aux escapades internationales, trouvez l'expérience taillée pour vos envies."}
            </p>
          </div>

          {/* Quick Scope Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl w-fit self-start md:self-end border border-slate-300/60 dark:border-slate-700/60 shadow-inner">
            <button
              onClick={() => setSelectedScope("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedScope === "ALL"
                  ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>{isAr ? "جميع وجهاتنا" : "Toutes nos escapades"}</span>
              <span className="ms-1.5 text-[10px] opacity-70 font-mono">
                ({collections.length})
              </span>
            </button>

            <button
              onClick={() => setSelectedScope("NATIONAL")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedScope === "NATIONAL"
                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25"
                  : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
              }`}
            >
              <span>🇲🇦</span>
              <span>{isAr ? "المغرب (وطني)" : "Maroc (National)"}</span>
              <span className="text-[10px] opacity-80 font-mono">
                ({nationalCount})
              </span>
            </button>

            <button
              onClick={() => setSelectedScope("INTERNATIONAL")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedScope === "INTERNATIONAL"
                  ? "bg-sky-500 text-white shadow-sm shadow-sky-500/25"
                  : "text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400"
              }`}
            >
              <span>✈️</span>
              <span>{isAr ? "العالم (دولي)" : "Monde (International)"}</span>
              <span className="text-[10px] opacity-80 font-mono">
                ({internationalCount})
              </span>
            </button>
          </div>
        </div>

        {/* Collections Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredCollections.map((col) => {
            const isNational = col.scope === "NATIONAL";
            const tripCount = col._count?.trips || 0;

            // Translated title
            const title = isAr
              ? col.nameAr || col.nameFr
              : locale === "en" && col.nameEn
              ? col.nameEn
              : col.nameFr;

            // Translated description
            const description = isAr
              ? col.descriptionAr || col.descriptionFr
              : locale === "en" && col.descriptionEn
              ? col.descriptionEn
              : col.descriptionFr;

            const targetUrl = `/${locale}/trips?collection=${encodeURIComponent(col.slug)}`;

            return (
              <Link
                key={col.id}
                href={targetUrl}
                className="group relative flex flex-col rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-xl hover:border-tp-cyan/50 dark:hover:border-tp-cyan/50 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Visual Cover Header */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={col.coverImage || "/images/merzouga/cover-merzouga.jpg"}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                  {/* Floating Badges */}
                  <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between pointer-events-none">
                    {/* Scope Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm ${
                        isNational
                          ? "bg-emerald-500/90 text-white"
                          : "bg-sky-500/90 text-white"
                      }`}
                    >
                      <span>{isNational ? "🇲🇦" : "✈️"}</span>
                      <span>{isNational ? (isAr ? "وطني" : "National") : (isAr ? "دولي" : "International")}</span>
                    </span>

                    {/* Trip Count Pill */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/60 backdrop-blur-md text-white border border-white/20 text-[11px] font-bold">
                      <Layers className="w-3 h-3 text-tp-cyan" />
                      <span>
                        {tripCount}{" "}
                        {isAr
                          ? tripCount > 1 ? "رحلات" : "رحلة"
                          : tripCount > 1 ? "circuits" : "circuit"}
                      </span>
                    </span>
                  </div>

                  {/* Title overlay on bottom of image for punchy contrast */}
                  <div className="absolute bottom-3.5 inset-x-3.5">
                    <h3 className="text-lg sm:text-xl font-black text-white drop-shadow-md group-hover:text-tp-cyan transition-colors">
                      {title}
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {description || (isAr ? "استكشف هذه المجموعة المتميزة مع راحة تامة وبرامج مدروسة." : "Découvrez cette collection exclusive sélectionnée avec soin par nos experts.")}
                  </p>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-black text-tp-cyan-hover dark:text-tp-cyan group-hover:underline">
                    <span>{isAr ? "استكشف جميع البرامج" : "Explorer la collection"}</span>
                    <ArrowIcon className="w-4 h-4 transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom Callout to explore all trips */}
        <div className="mt-12 text-center">
          <Link
            href={`/${locale}/trips`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:text-tp-cyan dark:hover:text-tp-cyan hover:border-tp-cyan text-xs sm:text-sm font-bold shadow-sm hover:shadow transition-all"
          >
            <span>{isAr ? "عرض الكتالوج الكامل لجميع الرحلات" : "Voir tout le catalogue de voyages"}</span>
            <ArrowIcon className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
