"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { MapPin, Calendar, Compass, Search, Sparkles } from "lucide-react";

export function SearchBar() {
  const t = useTranslations("home");
  const locale = useLocale();
  const router = useRouter();
  const isAr = locale === "ar";

  const [destination, setDestination] = useState("");
  const [city, setCity] = useState("");
  const [month, setMonth] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set("q", destination.trim());
    if (city) params.set("city", city);
    if (month) params.set("month", month);

    router.push(`/${locale}/trips?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="w-full max-w-5xl mx-auto bg-white/95 dark:bg-[#111827]/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-3 sm:p-4 border border-white/20 text-slate-900 dark:text-white grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 items-center transition-all text-start"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* 1. Destination */}
      <div className="md:col-span-4 flex items-center gap-3 px-4 py-3 min-h-[56px] rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 focus-within:bg-white dark:focus-within:bg-[#111827] transition-all shadow-inner">
        <MapPin className="w-5 h-5 text-cyan-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            {isAr ? "الوجهة السياحية" : (t("searchDestination") || "Destination")}
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={
              isAr
                ? "إلى أين تريد السفر؟ (مرزوكة، أطلس، فاس...)"
                : (t("searchDestinationPlaceholder") || "Où souhaitez-vous partir ? (Merzouga, Dakhla...)")
            }
            className="w-full text-xs sm:text-sm font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 truncate"
          />
        </div>
      </div>

      {/* 2. Departure City */}
      <div className="md:col-span-3 flex items-center gap-3 px-4 py-3 min-h-[56px] rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 focus-within:bg-white dark:focus-within:bg-[#111827] transition-all shadow-inner">
        <Compass className="w-5 h-5 text-amber-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            {isAr ? "مدينة الانطلاق" : (t("searchDeparture") || "Ville de départ")}
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full text-xs sm:text-sm font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              {isAr ? "جميع المدن" : (t("allCities") || "Toutes les villes")}
            </option>
            <option value="casablanca" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              Casablanca (الدار البيضاء)
            </option>
            <option value="rabat" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              Rabat (الرباط)
            </option>
            <option value="marrakech" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              Marrakech (مراكش)
            </option>
            <option value="tanger" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              Tanger (طنجة)
            </option>
            <option value="fes" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              Fès / Meknès (فاس / مكناس)
            </option>
            <option value="agadir" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              Agadir (أكادير)
            </option>
          </select>
        </div>
      </div>

      {/* 3. Date / Month */}
      <div className="md:col-span-3 flex items-center gap-3 px-4 py-3 min-h-[56px] rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 focus-within:bg-white dark:focus-within:bg-[#111827] transition-all shadow-inner">
        <Calendar className="w-5 h-5 text-cyan-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            {isAr ? "تاريخ / شهر الرحلة" : (t("searchMonth") || "Date / Période")}
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full text-xs sm:text-sm font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              {isAr ? "جميع الأشهر" : (t("allMonths") || "Tous les mois")}
            </option>
            <option value="septembre" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              {isAr ? "شتنبر 2026" : "Septembre 2026"}
            </option>
            <option value="octobre" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              {isAr ? "أكتوبر 2026" : "Octobre 2026"}
            </option>
            <option value="novembre" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              {isAr ? "نونبر 2026" : "Novembre 2026"}
            </option>
            <option value="decembre" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              {isAr ? "دجنبر 2026" : "Décembre 2026"}
            </option>
          </select>
        </div>
      </div>

      {/* 4. Action Button with Cyan Gradient */}
      <div className="md:col-span-2">
        <button
          type="submit"
          className="w-full h-full min-h-[56px] bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm px-5 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 active:scale-95 cursor-pointer"
        >
          <Search className="w-4 h-4 shrink-0 stroke-[2.5]" />
          <span className="truncate">
            {isAr ? "بحث عن رحلة" : (t("searchBtn") || "Trouver mon voyage")}
          </span>
        </button>
      </div>
    </form>
  );
}
