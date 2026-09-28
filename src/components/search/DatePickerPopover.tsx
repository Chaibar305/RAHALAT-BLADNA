"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { 
  Calendar as CalendarIcon, X, Check, Search, 
  RotateCcw, Compass, ChevronDown, Sparkles, Loader2 
} from "lucide-react";
import { useLocale } from "next-intl";
import { 
  getAvailableDepartureDates, 
  DepartureDateItem 
} from "@/actions/departures.actions";

interface DatePickerPopoverProps {
  value?: string; // Format "YYYY-MM-DD" ou ""
  onChange: (dateKey: string) => void;
  onApply?: (dateKey: string) => void;
  initialDates?: Record<string, DepartureDateItem[]>;
  placeholder?: string;
  className?: string;
}

export function DatePickerPopover({
  value = "",
  onChange,
  onApply,
  initialDates,
  placeholder,
  className = "",
}: DatePickerPopoverProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const [isOpen, setIsOpen] = useState(false);
  const [groupedDates, setGroupedDates] = useState<Record<string, DepartureDateItem[]>>(initialDates || {});
  const [isLoading, setIsLoading] = useState(!initialDates || Object.keys(initialDates).length === 0);
  const [tempSelectedDate, setTempSelectedDate] = useState<string>(value);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  // Synchronisation avec la valeur externe
  useEffect(() => {
    setTempSelectedDate(value);
  }, [value]);

  // Chargement asynchrone des dates de départ actives si non injectées
  useEffect(() => {
    if (!initialDates || Object.keys(initialDates).length === 0) {
      let isMounted = true;
      setIsLoading(true);
      getAvailableDepartureDates()
        .then((data) => {
          if (isMounted) {
            setGroupedDates(data);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.error("Erreur de chargement des départs :", err);
          if (isMounted) setIsLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [initialDates]);

  // Fermeture au clic extérieur et touche Échap
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Recherche du libellé de la date sélectionnée (ex: "25 Sep" ou "25 شتنبر")
  const findSelectedItem = (): DepartureDateItem | null => {
    if (!value) return null;
    for (const monthGroup of Object.values(groupedDates)) {
      const match = monthGroup.find((item) => item.dateKey === value);
      if (match) return match;
    }
    return null;
  };

  const selectedItem = findSelectedItem();

  const getDisplayLabel = () => {
    if (selectedItem) {
      if (isAr) {
        return `${selectedItem.dayNum} ${selectedItem.monthShortAr || selectedItem.monthShort}`;
      }
      return `${selectedItem.dayNum} ${selectedItem.monthShort}`;
    }

    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const d = new Date(`${value}T00:00:00.000Z`);
      return d.toLocaleDateString(isAr ? "ar-MA" : "fr-FR", {
        day: "2-digit",
        month: "short",
        timeZone: "UTC",
      });
    }

    return placeholder || (isAr ? "جميع التواريخ" : "Tous les départs");
  };

  // Sélection d'une carte de date
  const handleSelectDateCard = (dateKey: string) => {
    // Si on clique sur la même date, on la désélectionne (toggle)
    const nextVal = tempSelectedDate === dateKey ? "" : dateKey;
    setTempSelectedDate(nextVal);
    onChange(nextVal);
  };

  // Bouton "Tout effacer"
  const handleClear = () => {
    setTempSelectedDate("");
    onChange("");
    if (onApply) onApply("");
    setIsOpen(false);
  };

  // Bouton "Rechercher" / "Appliquer"
  const handleApply = () => {
    onChange(tempSelectedDate);
    if (onApply) onApply(tempSelectedDate);
    setIsOpen(false);
  };

  const totalAvailableDates = Object.values(groupedDates).reduce(
    (acc, list) => acc + list.length,
    0
  );

  return (
    <div className={`relative ${className}`} ref={containerRef} dir={isAr ? "rtl" : "ltr"}>
      {/* 1. BOUTON DÉCLENCHEUR DANS LA SEARCH BAR */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center gap-3 px-4 py-3 min-h-[56px] rounded-2xl transition-all shadow-inner text-start cursor-pointer select-none ${
          isOpen
            ? "bg-white dark:bg-[#111827] border-cyan-500 ring-2 ring-cyan-500/20"
            : value
            ? "bg-cyan-50/60 dark:bg-cyan-950/30 border-cyan-500/60 text-cyan-950 dark:text-cyan-100"
            : "bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
        }`}
      >
        <CalendarIcon className={`w-5 h-5 shrink-0 ${value ? "text-cyan-500" : "text-cyan-500"}`} />
        
        <div className="flex-1 min-w-0">
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 cursor-pointer">
            {isAr ? "متى ؟" : "Quand ?"}
          </label>
          <div className="flex items-center gap-1.5 truncate">
            <span className={`text-xs sm:text-sm font-black truncate ${
              value ? "text-cyan-600 dark:text-cyan-400" : "text-slate-900 dark:text-white"
            }`}>
              {getDisplayLabel()}
            </span>
          </div>
        </div>

        {/* Bouton rapide d'effacement si une date est sélectionnée */}
        {value ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                handleClear();
              }
            }}
            className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] transition shrink-0 cursor-pointer"
            title={isAr ? "إلغاء التحديد" : "Effacer la date"}
          >
            ✕
          </span>
        ) : (
          <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-cyan-500" : ""}`} />
        )}
      </button>

      {/* 2. POPOVER / MODALE FLOTTANTE (MODÈLE TRIPLAN) */}
      {isOpen && (
        <>
          {/* Overlay avec flou d'arrière-plan sur Mobile ET Desktop */}
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-40 transition-opacity cursor-pointer"
            onClick={() => setIsOpen(false)}
          />

          <div
            className={`fixed md:absolute z-50 transition-all duration-200 ${
              // Positionnement Mobile : centré à l'écran
              "inset-x-3 top-1/2 -translate-y-1/2 max-h-[85vh] " +
              // Positionnement Desktop : flottant sous le bouton
              "md:inset-auto md:top-full md:mt-2 md:translate-y-0 md:w-[480px] md:max-h-[500px] " +
              (isAr ? "md:start-0" : "md:end-0")
            } bg-white dark:bg-[#0E1726] border border-slate-200/90 dark:border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-white`}
          >
            {/* A. EN-TÊTE TRIPLAN */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                    {isAr ? "متى ترغب في السفر ؟" : "Quand partez-vous ?"}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {isAr
                      ? `${totalAvailableDates} تاريخ انطلاق مؤكد ومتاح للحجز`
                      : `${totalAvailableDates} départs garantis et disponibles`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 dark:text-slate-300 flex items-center justify-center transition active:scale-90 cursor-pointer"
                title={isAr ? "إغلاق" : "Fermer"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* B. CORPS DÉFILANT : GROUPEMENT CHRONOLOGIQUE PAR MOIS */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 max-h-[360px] sm:max-h-[380px] custom-scrollbar">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                  <span className="text-xs text-slate-400 font-medium">
                    {isAr ? "جاري تحميل مواعيد الانطلاق..." : "Synchronisation des départs en temps réel..."}
                  </span>
                </div>
              ) : Object.keys(groupedDates).length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Compass className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {isAr ? "لا توجد رحلات مبرمجة حالياً." : "Aucun départ futur programmé pour le moment."}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isAr
                      ? "تابعنا باستمرار للاطلاع على البرامج الجديدة."
                      : "De nouveaux départs sont ajoutés chaque semaine par notre équipe."}
                  </p>
                </div>
              ) : (
                Object.entries(groupedDates).map(([monthGroup, dates]) => {
                  const displayMonthGroup = isAr 
                    ? (dates[0]?.monthYearGroupAr || monthGroup) 
                    : monthGroup;

                  return (
                    <div key={monthGroup} className="space-y-3">
                      {/* Titre du Mois */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 capitalize">
                          {displayMonthGroup}
                        </span>
                        <div className="h-px flex-1 bg-slate-100 dark:bg-white/10" />
                      </div>

                      {/* Grille 2 Colonnes de Cartes de Dates */}
                      <div className="grid grid-cols-2 gap-2.5">
                        {dates.map((item) => {
                          const isSelected = tempSelectedDate === item.dateKey;
                          const displayDayName = isAr
                            ? (item.dayOfWeekAr || item.dayOfWeek)
                            : item.dayOfWeek;
                          const displayMonthShort = isAr
                            ? (item.monthShortAr || item.monthShort)
                            : item.monthShort;

                          return (
                            <button
                              key={item.dateKey}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              onClick={() => handleSelectDateCard(item.dateKey)}
                              className={`p-3 rounded-2xl border text-start transition-all cursor-pointer relative flex flex-col justify-between gap-2 select-none group ${
                                isSelected
                                  ? "border-cyan-500 bg-cyan-500/10 dark:bg-cyan-500/15 ring-2 ring-cyan-500/25 text-cyan-950 dark:text-cyan-100 shadow-sm"
                                  : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-cyan-400/80 hover:bg-slate-50/80 dark:hover:bg-white/[0.06] text-slate-800 dark:text-slate-200"
                              }`}
                            >
                              {/* Ligne 1 : Date en gras + Puce ronde Radio */}
                              <div className="flex items-center justify-between w-full">
                                <span className={`text-xs sm:text-sm font-black tracking-tight ${
                                  isSelected ? "text-cyan-600 dark:text-cyan-400" : "text-slate-900 dark:text-white"
                                }`}>
                                  {item.dayNum} {displayMonthShort}
                                </span>

                                {/* Puce radio style Triplan */}
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                    isSelected
                                      ? "border-cyan-500 bg-cyan-500"
                                      : "border-slate-300 dark:border-slate-600 group-hover:border-cyan-400"
                                  }`}
                                >
                                  {isSelected && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                                  )}
                                </div>
                              </div>

                              {/* Ligne 2 : Jour de la semaine */}
                              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 capitalize">
                                {displayDayName}
                              </span>

                              {/* Ligne 3 : Compteur de circuits programmés */}
                              <div className="pt-1 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                  <Compass className={`w-3 h-3 ${isSelected ? "text-cyan-500" : "text-slate-400"}`} />
                                  <span>
                                    {isAr
                                      ? `${item.destinationsCount} ${item.destinationsCount === 1 ? "وجهة" : "وجهات"}`
                                      : `${item.destinationsCount} ${item.destinationsCount === 1 ? "destination" : "destinations"}`}
                                  </span>
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* C. PIED DE MODALE TRIPLAN : TOUT EFFACER + RECHERCHER */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-extrabold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isAr ? "إلغاء التحديد" : "Tout effacer"}</span>
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl shadow-md shadow-cyan-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isAr ? "تطبيق والبحث" : "Rechercher"}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
