"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { TripCard, TripCardProps } from "./TripCard";

export function WeekendCarousel({ trips }: { trips: TripCardProps[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const t = useTranslations("home");

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 340;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section id="weekends" className="py-14 sm:py-20 bg-tp-cream/40 border-y border-tp-line/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            {/* Kicker bar */}
            <div className="inline-flex items-center gap-2 text-tp-terracotta">
              <span className="w-5 h-[2px] bg-tp-terracotta rounded-full" />
              <span className="text-xs font-black uppercase tracking-widest">
                {t("weekendKicker")}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-tp-midnight tracking-tight">
              {t("weekendTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-tp-muted max-w-xl">
              {t("weekendSubtitle")}
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/trips`}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-extrabold text-tp-cyan-hover hover:text-tp-midnight transition"
            >
              <span>{t("viewAllWeekend")}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                className="w-10 h-10 rounded-xl bg-white border border-tp-line flex items-center justify-center text-tp-midnight hover:bg-tp-cyan hover:text-white hover:border-tp-cyan transition-colors shadow-sm active:scale-95"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="w-10 h-10 rounded-xl bg-white border border-tp-line flex items-center justify-center text-tp-midnight hover:bg-tp-cyan hover:text-white hover:border-tp-cyan transition-colors shadow-sm active:scale-95"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Viewport */}
        <div
          ref={scrollRef}
          className="flex gap-5 sm:gap-6 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory"
        >
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="flex-none w-[calc(100vw-48px)] max-w-[320px] sm:w-[320px] snap-start"
            >
              <TripCard {...trip} />
            </div>
          ))}
        </div>

        {/* Mobile View All Link */}
        <div className="sm:hidden pt-2 text-center">
          <Link
            href={`/${locale}/trips`}
            className="inline-flex items-center gap-1.5 text-xs font-black text-tp-cyan-hover"
          >
            <span>{t("viewAllWeekend")}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </section>
  );
}
