"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import {
  MapPin,
  Calendar,
  Heart,
  ArrowRight,
  Clock,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { formatMAD } from "@/lib/utils";

export interface CircuitCardProps {
  id: string;
  slug: string;
  title: string;
  region: string;
  duration: string;
  departureCity: string;
  price: number;
  deposit: number;
  image: string;
  tag?: string;
  tagType?: "guaranteed" | "warning" | "popular" | "special";
  nextDate?: string;
  category?: string;
}

export type TripCardProps = CircuitCardProps;

export function CircuitCard({
  id,
  slug,
  title,
  region,
  duration,
  departureCity,
  price,
  deposit,
  image,
  tag = "Départ Garanti",
  tagType = "guaranteed",
  nextDate,
  category = "Circuit",
}: CircuitCardProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const displayNextDate = nextDate || (isAr ? "قريباً" : "Date à venir");
  const [isFavorite, setIsFavorite] = useState(false);

  const getTagClasses = () => {
    switch (tagType) {
      case "warning":
        return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
      case "popular":
        return "bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30";
      case "special":
        return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
      case "guaranteed":
      default:
        return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30";
    }
  };

  const tripUrl = `/${locale}/trips/${slug}`;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group flex flex-col bg-white dark:bg-[#101827] rounded-[22px] overflow-hidden border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-xl hover:shadow-cyan-500/10 transition-shadow duration-300 relative text-start"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* 1. Image Container with Hover Scale & Overlays */}
      <div className="relative aspect-[4/3] sm:aspect-[4/3] w-full overflow-hidden bg-slate-900">
        <img
          src={image || "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80"}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out select-none"
          loading="lazy"
        />

        {/* Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-black/30 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
          {/* Category Pill */}
          <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-wider shadow-sm border border-white/20">
            {category}
          </span>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
            className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-center text-slate-800 dark:text-slate-200 hover:text-red-500 transition-colors shadow-sm active:scale-90 cursor-pointer"
            aria-label="Ajouter aux favoris"
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                isFavorite ? "fill-red-500 text-red-500 scale-110" : ""
              }`}
            />
          </button>
        </div>

        {/* Bottom Image Overlay Badges */}
        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
          {/* Status Badge */}
          {tag && (
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md shadow-sm ${getTagClasses()}`}
            >
              {tag}
            </span>
          )}

          {/* Duration Pill */}
          <span className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm border border-white/10">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>{duration}</span>
          </span>
        </div>
      </div>

      {/* 2. Card Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Region & Departure */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">{region}</span>
          </div>

          {/* Title */}
          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
            <Link href={tripUrl}>{title}</Link>
          </h3>

          {/* Departure Info */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11.5px] text-slate-600 dark:text-slate-400 font-medium">
            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{displayNextDate}</span>
            </span>
            <span className="text-slate-400 truncate max-w-[170px]">
              {departureCity}
            </span>
          </div>
        </div>

        {/* 3. Footer: Price & Action */}
        <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {isAr ? "ابتداءً من" : "À partir de"}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-black text-xl text-slate-950 dark:text-white">
                {formatMAD(price, locale)}
              </span>
            </div>
            {deposit > 0 && (
              <span className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400 block">
                {isAr ? `تسبيق : ${deposit} د.م` : `Acompte : ${deposit} DH`}
              </span>
            )}
          </div>

          <Link
            href={tripUrl}
            className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:shadow-cyan-500/20 transition-all active:scale-95 shrink-0"
          >
            <span>{isAr ? "التفاصيل" : "Détails"}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 stroke-[2.5]" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export { CircuitCard as TripCard };
