"use client";

import React, { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { ArrowRight, Calendar, Sparkles } from "lucide-react";
import { formatMAD } from "@/lib/utils";

interface MobileFloatingBookingBarProps {
  basePrice: number | string;
  depositAmount?: number | string;
  targetId?: string; // id de la section vers laquelle scroller
}

export function MobileFloatingBookingBar({
  basePrice,
  depositAmount,
  targetId = "booking-card-section",
}: MobileFloatingBookingBarProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Afficher la barre dès que l'utilisateur a scrollé après le haut de page
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const targetEl = document.getElementById(targetId) || document.getElementById("booking-widget");

      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        // Masquer si le widget de réservation est actuellement pleinement visible à l'écran
        const isBookingCardVisible = rect.top < window.innerHeight && rect.bottom > 120;
        setIsVisible(scrollY > 250 && !isBookingCardVisible);
      } else {
        setIsVisible(scrollY > 250);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [targetId]);

  const scrollToBooking = () => {
    const el = document.getElementById(targetId) || document.getElementById("booking-widget");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Barre d'action de réservation mobile"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] px-4 py-3 pb-safe animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Informations de Prix & Acompte */}
        <div className="flex flex-col min-w-0">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isAr ? "ابتداءً من" : "À partir de"}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-950 dark:text-white leading-none">
              {formatMAD(Number(basePrice || 0))}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {isAr ? "/ فرد" : "/ pers"}
            </span>
          </div>
          {depositAmount && (
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
              {isAr
                ? `تسبيق: ${formatMAD(Number(depositAmount))}`
                : `Acompte : ${formatMAD(Number(depositAmount))}`}
            </span>
          )}
        </div>

        {/* Bouton CTA Principal */}
        <button
          type="button"
          onClick={scrollToBooking}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white text-xs sm:text-sm font-black shadow-lg shadow-amber-500/25 transition-all shrink-0 cursor-pointer"
        >
          <span>{isAr ? "احجز مقعدك الآن" : "Réserver ma place"}</span>
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
        </button>
      </div>
    </aside>
  );
}

export default MobileFloatingBookingBar;
