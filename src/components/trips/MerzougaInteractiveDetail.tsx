"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { 
  Camera, MapPin, Calendar, Clock, Sparkles, ChevronLeft, 
  ChevronRight, CheckCircle2, Flame, Tent, Compass, Mountain, Check, X, Luggage,
  Bus, Navigation, ExternalLink
} from "lucide-react";
import { GalleryItem } from "@/components/shared/TripGallery";
import { PickupPointDto } from "@/types";

export interface ProgramStep {
  id: string;
  dayLabel: string;
  dayLabelAr: string;
  title: string;
  titleAr: string;
  timing: string;
  timingAr: string;
  desc: string;
  descAr: string;
  siteId: string; // Linked gallery image ID
  highlights: string[];
  highlightsAr: string[];
  iconType: "dunes" | "bivouac" | "gorges" | "khamlia" | "quad";
}

interface MerzougaInteractiveDetailProps {
  galleryItems: GalleryItem[];
  programSteps: ProgramStep[];
  pickupPoints?: PickupPointDto[];
  included: string[];
  excluded: string[];
  checklist: string[];
}

export function MerzougaInteractiveDetail({
  galleryItems,
  programSteps,
  pickupPoints,
  included,
  excluded,
  checklist,
}: MerzougaInteractiveDetailProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const [activeSiteIndex, setActiveSiteIndex] = useState(0);

  const currentSite = galleryItems[activeSiteIndex] || galleryItems[0];

  // Find the corresponding program step for the currently active site
  const activeProgramStep =
    programSteps.find((step) => step.siteId === currentSite.id) || programSteps[0];

  const handlePrev = () => {
    setActiveSiteIndex((prev) => (prev === 0 ? galleryItems.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveSiteIndex((prev) => (prev === galleryItems.length - 1 ? 0 : prev + 1));
  };

  const selectSiteById = (siteId: string) => {
    const idx = galleryItems.findIndex((item) => item.id === siteId);
    if (idx !== -1) {
      setActiveSiteIndex(idx);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. INTERACTIVE IMAGE GALLERY SYNCHRONIZED WITH THE PROGRAM */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-tp-line shadow-tp-sm space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-tp-cyan-hover">
              <Camera className="w-4 h-4" />
              <span>{isAr ? "معالم ووجهات الجولة بالصور" : "Sites Touristiques Incontournables"}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-tp-midnight">
              {isAr ? "استكشف معالم الوجهة وتفاصيل البرنامج" : "Découvrez les Trésors & le Programme"}
            </h3>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="w-9 h-9 rounded-xl border border-tp-line flex items-center justify-center text-tp-midnight hover:bg-tp-cyan hover:text-white hover:border-tp-cyan transition shadow-sm active:scale-95"
              aria-label="Image précédente"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            <button
              onClick={handleNext}
              className="w-9 h-9 rounded-xl border border-tp-line flex items-center justify-center text-tp-midnight hover:bg-tp-cyan hover:text-white hover:border-tp-cyan transition shadow-sm active:scale-95"
              aria-label="Image suivante"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>

        {/* Main Viewport */}
        <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-tp-midnight shadow-lg group">
          <img
            src={currentSite.imageUrl}
            alt={isAr ? currentSite.titleAr : currentSite.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-tp-midnight/95 via-tp-midnight/35 to-transparent pointer-events-none" />

          {/* Tag & Linked Program Step Badge */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none">
            <span className="px-3 py-1 rounded-pill bg-white/90 backdrop-blur-md text-tp-midnight text-xs font-black uppercase tracking-wider shadow-sm">
              {isAr ? currentSite.tagAr : currentSite.tag}
            </span>

            <span className="px-3 py-1 rounded-pill bg-tp-cyan/90 backdrop-blur-md text-white text-xs font-black shadow-sm flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{isAr ? activeProgramStep.dayLabelAr : activeProgramStep.dayLabel}</span>
            </span>
          </div>

          {/* Bottom Details Overlay */}
          <div className="absolute bottom-4 inset-x-4 sm:bottom-6 sm:inset-x-6 text-white space-y-1.5 pointer-events-none">
            <div className="flex items-center gap-1.5 text-xs text-tp-cyan-soft font-bold">
              <MapPin className="w-3.5 h-3.5" />
              <span>{isAr ? currentSite.locationAr : currentSite.location}</span>
            </div>

            <h4 className="text-lg sm:text-2xl font-black text-white leading-snug">
              {isAr ? currentSite.titleAr : currentSite.title}
            </h4>

            <p className="text-xs sm:text-sm text-tp-ivory/85 max-w-2xl leading-relaxed hidden sm:block">
              {isAr ? currentSite.descriptionAr : currentSite.description}
            </p>
          </div>
        </div>

        {/* Thumbnails Navigation Row */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {galleryItems.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setActiveSiteIndex(idx)}
              className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all active:scale-95 ${
                activeSiteIndex === idx
                  ? "border-tp-cyan ring-2 ring-tp-cyan/30 scale-[1.03] shadow-md"
                  : "border-tp-line opacity-65 hover:opacity-100"
              }`}
            >
              <img
                src={item.imageUrl}
                alt={isAr ? item.titleAr : item.title}
                className="w-full h-full object-cover"
              />
              {activeSiteIndex === idx && (
                <div className="absolute inset-0 bg-tp-cyan/20 pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. DYNAMICALLY ADAPTED PROGRAM CARD (FOCUSED ON CURRENT SELECTION) */}
      <div className="bg-gradient-to-br from-white to-tp-surface-2 p-6 sm:p-7 rounded-3xl border-2 border-tp-cyan/40 shadow-tp-sm space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-tp-cyan text-white flex items-center justify-center font-black text-xs shadow-sm">
              ★
            </span>
            <div>
              <span className="text-[11px] font-black uppercase text-tp-cyan-hover block">
                {isAr ? "البرنامج المرتبط بالصورة المحددة" : "Programme lié à l'image sélectionnée"}
              </span>
              <h3 className="font-extrabold text-base sm:text-lg text-tp-midnight">
                {isAr ? activeProgramStep.titleAr : activeProgramStep.title}
              </h3>
            </div>
          </div>

          <span className="text-xs font-black bg-tp-ok-bg text-tp-ok-fg px-3 py-1 rounded-full shadow-sm shrink-0">
            {isAr ? activeProgramStep.timingAr : activeProgramStep.timing}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-tp-slate leading-relaxed">
          {isAr ? activeProgramStep.descAr : activeProgramStep.desc}
        </p>

        {/* Highlight Bullets */}
        <div className="pt-2 border-t border-tp-line grid sm:grid-cols-2 gap-2">
          {(isAr ? activeProgramStep.highlightsAr : activeProgramStep.highlights).map(
            (hl, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-semibold text-tp-midnight">
                <CheckCircle2 className="w-3.5 h-3.5 text-tp-cyan-hover shrink-0" />
                <span>{hl}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* 3. COMPLETE TIMELINE ITINERARY (CLICKING ANY DAY UPDATES THE IMAGE) */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-tp-line shadow-tp-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-tp-midnight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-tp-cyan" />
            <span>{isAr ? "برنامج الرحلة الكامل (انقر لتغيير الصورة)" : "Itinéraire Complet (Cliquez pour afficher)"}</span>
          </h2>
          <span className="text-[11px] text-tp-muted hidden sm:inline font-semibold">
            {isAr ? "تفاعل مباشر مع الصور" : "Synchronisé avec les photos"}
          </span>
        </div>

        <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 rtl:before:left-auto rtl:before:right-3.5 before:w-0.5 before:bg-tp-line">
          {programSteps.map((step, idx) => {
            const isStepActive = currentSite.id === step.siteId;
            return (
              <div
                key={step.id}
                onClick={() => selectSiteById(step.siteId)}
                className={`relative flex items-start gap-4 p-3.5 rounded-2xl cursor-pointer transition-all ${
                  isStepActive
                    ? "bg-tp-cyan-tint/40 border border-tp-cyan/40 shadow-sm"
                    : "hover:bg-tp-surface-2"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center shrink-0 z-10 shadow-sm transition-colors ${
                    isStepActive ? "bg-tp-cyan" : "bg-tp-midnight"
                  }`}
                >
                  {idx + 1}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black uppercase text-tp-cyan-hover">
                      {isAr ? step.dayLabelAr : step.dayLabel}
                    </span>
                    <span className="text-[10px] font-bold text-tp-muted">
                      {isAr ? step.timingAr : step.timing}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-tp-midnight">
                    {isAr ? step.titleAr : step.title}
                  </h3>

                  <p className="text-xs text-tp-muted leading-relaxed line-clamp-2">
                    {isAr ? step.descAr : step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3.5. POINTS DE RAMASSAGE & HORAIRES DE DÉPART */}
      {pickupPoints && pickupPoints.length > 0 && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-tp-line shadow-tp-sm space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-tp-midnight flex items-center gap-2">
                <Bus className="w-5 h-5 text-tp-cyan" />
                <span>{isAr ? "نقاط التجمع ومواعيد الانطلاق المحددة" : "Points de Ramassage & Horaires de Rassemblement"}</span>
              </h2>
              <p className="text-xs text-tp-muted mt-1">
                {isAr
                  ? "أماكن اللقاء الدقيقة ومواعيد الانطلاق المبرمجة مع المرافقة والتأطير."
                  : "Lieux de rendez-vous précis et horaires de départ garantis pour votre confort."}
              </p>
            </div>
            <span className="text-xs font-black bg-tp-cyan-tint text-tp-midnight px-3 py-1 rounded-full border border-tp-cyan/30 shrink-0">
              {pickupPoints.length} {isAr ? "محطات" : (pickupPoints.length > 1 ? "villes étapes" : "ville étape")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {pickupPoints.map((pt, idx) => (
              <div
                key={pt.id || idx}
                className="bg-tp-surface-2 rounded-2xl p-4 border border-tp-line hover:border-tp-cyan/50 hover:shadow-xs transition space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-tp-midnight text-white text-[11px] font-black flex items-center justify-center shadow-2xs">
                      {idx + 1}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-tp-cyan text-white shadow-2xs">
                      <Clock className="w-3 h-3" />
                      <span>{pt.departureTime}</span>
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-tp-midnight">
                    {pt.cityName}
                  </h4>

                  <p className="text-xs text-tp-slate font-medium leading-relaxed">
                    {pt.locationName}
                  </p>
                </div>

                {pt.googleMapsUrl && (
                  <a
                    href={pt.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-tp-cyan-hover hover:underline pt-1 border-t border-tp-line/60"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{isAr ? "موقع النقطة على الخريطة" : "Voir sur Google Maps"}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Included / Excluded Services */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-tp-line shadow-tp-sm space-y-6">
        <div>
          <h3 className="font-black text-tp-midnight flex items-center gap-2 text-base">
            <Check className="w-5 h-5 text-tp-ok-fg" />
            <span>{isAr ? "الخدمات المشمولة في السعر" : "Services Inclus"}</span>
          </h3>
          <ul className="mt-3 space-y-2 text-xs text-tp-slate">
            {included.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-tp-ok-fg mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-tp-line pt-4">
          <h3 className="font-black text-tp-midnight flex items-center gap-2 text-base">
            <X className="w-5 h-5 text-rose-500" />
            <span>{isAr ? "غير مشمول" : "Non Inclus"}</span>
          </h3>
          <ul className="mt-3 space-y-2 text-xs text-tp-slate">
            {excluded.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 5. Checklist to Bring */}
      <div className="bg-tp-cream/60 p-6 sm:p-7 rounded-3xl border border-tp-line shadow-tp-sm space-y-4">
        <h3 className="font-black text-tp-midnight flex items-center gap-2 text-base">
          <Luggage className="w-5 h-5 text-tp-terracotta" />
          <span>{isAr ? "لائحة الأمتعة الموصى بها" : "Que faut-il apporter avec vous ?"}</span>
        </h3>
        <ul className="space-y-2 text-xs text-tp-slate font-medium">
          {checklist.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-tp-terracotta/20 text-tp-terracotta font-bold text-[10px] flex items-center justify-center shrink-0">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
