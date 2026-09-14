"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Compass, Filter } from "lucide-react";
import { TripCard, TripCardProps } from "./TripCard";

export function TripFilterTabs({ trips }: { trips: TripCardProps[] }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const locale = useLocale();
  const t = useTranslations("home");

  const categories = [
    { id: "all", label: t("tabAll") },
    { id: "sahara", label: t("tabSahara") },
    { id: "nord", label: t("tabNorth") },
    { id: "atlas", label: t("tabAtlas") },
    { id: "sud", label: t("tabSouth") },
    { id: "dakhla", label: t("tabDakhla") },
  ];

  const filteredTrips = activeCategory === "all"
    ? trips
    : trips.filter((trip) => {
        const cat = (trip.category || "").toLowerCase();
        const reg = (trip.region || "").toLowerCase();
        if (activeCategory === "sahara") return cat.includes("sahara") || reg.includes("merzouga") || reg.includes("zagora");
        if (activeCategory === "nord") return cat.includes("nord") || reg.includes("chefchaouen") || reg.includes("tanger") || reg.includes("akchour");
        if (activeCategory === "atlas") return cat.includes("atlas") || reg.includes("atlas") || reg.includes("toubkal");
        if (activeCategory === "sud") return cat.includes("sud") || reg.includes("ouarzazate") || reg.includes("tinghir");
        if (activeCategory === "dakhla") return cat.includes("dakhla") || reg.includes("dakhla");
        return true;
      });

  return (
    <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-tp-cyan-hover">
            <span className="w-5 h-[2px] bg-tp-cyan-hover rounded-full" />
            <span className="text-xs font-black uppercase tracking-widest">
              {t("catalogKicker")}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-tp-midnight tracking-tight">
            {t("catalogTitle")}
          </h2>
          <p className="text-xs sm:text-sm text-tp-muted max-w-xl">
            {t("catalogSubtitle")}
          </p>
        </div>

        <Link
          href={`/${locale}/trips`}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-tp-cyan-hover hover:text-tp-midnight transition self-start md:self-auto"
        >
          <span>{t("viewAllCatalog")}</span>
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
        </Link>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2.5 rounded-pill text-xs font-black transition-all shrink-0 active:scale-95 ${
              activeCategory === cat.id
                ? "bg-tp-midnight text-white shadow-md shadow-tp-midnight/20"
                : "bg-white text-tp-slate border border-tp-line hover:border-tp-cyan/50 hover:bg-tp-cream/50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid of Trips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filteredTrips.map((trip) => (
          <TripCard key={trip.id} {...trip} />
        ))}
      </div>
    </section>
  );
}
