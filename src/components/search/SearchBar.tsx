"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { MapPin, Compass, Search } from "lucide-react";
import { DatePickerPopover } from "@/components/search/DatePickerPopover";

function SearchBarInner() {
  const t = useTranslations("home");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAr = locale === "ar";

  const initialDestination = searchParams?.get("q") || "";
  const initialCity = searchParams?.get("city") || "";
  const initialDate = searchParams?.get("date") || "";

  const [destination, setDestination] = useState(initialDestination);
  const [city, setCity] = useState(initialCity);
  const [date, setDate] = useState(initialDate);

  // Synchronisation si les paramètres URL changent
  useEffect(() => {
    setDestination(searchParams?.get("q") || "");
    setCity(searchParams?.get("city") || "");
    setDate(searchParams?.get("date") || "");
  }, [searchParams]);

  const executeSearch = (overrides?: { newDate?: string; newCity?: string; newDest?: string }) => {
    const activeDate = overrides?.newDate !== undefined ? overrides.newDate : date;
    const activeCity = overrides?.newCity !== undefined ? overrides.newCity : city;
    const activeDest = overrides?.newDest !== undefined ? overrides.newDest : destination;

    const params = new URLSearchParams();
    const cleanDest = activeDest.trim();
    if (cleanDest && cleanDest !== "all" && cleanDest !== "undefined") {
      params.set("q", cleanDest);
    }

    const isCityValid = Boolean(
      activeCity &&
      activeCity !== "all" &&
      activeCity !== "undefined" &&
      !activeCity.toLowerCase().includes("toutes") &&
      !activeCity.toLowerCase().includes("جميع")
    );
    if (isCityValid) {
      params.set("city", activeCity);
    }

    if (activeDate && activeDate !== "all" && /^\d{4}-\d{2}-\d{2}$/.test(activeDate)) {
      params.set("date", activeDate);
    }

    const queryString = params.toString();
    const targetUrl = `/${locale}/trips${queryString ? `?${queryString}` : ""}`;

    if (pathname?.includes("/trips")) {
      router.push(targetUrl, { scroll: false });
    } else {
      router.push(targetUrl);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
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
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 cursor-pointer">
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
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 cursor-pointer">
            {isAr ? "مدينة الانطلاق" : (t("searchDeparture") || "Ville de départ")}
          </label>
          <select
            value={city}
            onChange={(e) => {
              const newCity = e.target.value;
              setCity(newCity);
              if (pathname?.includes("/trips")) {
                executeSearch({ newCity });
              }
            }}
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

      {/* 3. Popover Calendrier Triplan (Quand ?) */}
      <div className="md:col-span-3">
        <DatePickerPopover
          value={date}
          onChange={(newDate) => {
            setDate(newDate);
          }}
          onApply={(appliedDate) => {
            setDate(appliedDate);
            executeSearch({ newDate: appliedDate });
          }}
        />
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

export function SearchBar() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-5xl mx-auto h-[76px] bg-white/95 dark:bg-[#111827]/95 rounded-3xl animate-pulse" />
      }
    >
      <SearchBarInner />
    </Suspense>
  );
}

