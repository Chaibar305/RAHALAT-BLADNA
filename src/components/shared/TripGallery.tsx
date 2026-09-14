"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { Camera, MapPin, Sparkles, ChevronLeft, ChevronRight, Eye } from "lucide-react";

export interface GalleryItem {
  id: string;
  title: string;
  titleAr: string;
  location: string;
  locationAr: string;
  description: string;
  descriptionAr: string;
  imageUrl: string;
  tag: string;
  tagAr: string;
}

export function TripGallery({
  title,
  subtitle,
  items,
}: {
  title?: string;
  subtitle?: string;
  items: GalleryItem[];
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [selectedIndex, setSelectedIndex] = useState(0);

  const currentItem = items[selectedIndex] || items[0];

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-tp-line shadow-tp-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-tp-cyan-hover">
            <Camera className="w-4 h-4" />
            <span>{isAr ? "معالم ووجهات الجولة بالصور" : "Sites Touristiques Incontournables"}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-tp-midnight">
            {title || (isAr ? "استكشف سحر مرزوكة بالصور" : "Découvrez les Trésors de Merzouga")}
          </h3>
        </div>

        {/* Prev / Next controls */}
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

      {/* Main Feature Viewport */}
      <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-tp-midnight shadow-lg group">
        <img
          src={currentItem.imageUrl}
          alt={isAr ? currentItem.titleAr : currentItem.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-tp-midnight/90 via-tp-midnight/30 to-transparent pointer-events-none" />

        {/* Top Tag */}
        <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4">
          <span className="px-3 py-1 rounded-pill bg-white/90 backdrop-blur-md text-tp-midnight text-xs font-black uppercase tracking-wider shadow-sm">
            {isAr ? currentItem.tagAr : currentItem.tag}
          </span>
        </div>

        {/* Bottom Details Overlay */}
        <div className="absolute bottom-4 inset-x-4 sm:bottom-6 sm:inset-x-6 text-white space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-tp-cyan-soft font-bold">
            <MapPin className="w-3.5 h-3.5" />
            <span>{isAr ? currentItem.locationAr : currentItem.location}</span>
          </div>

          <h4 className="text-lg sm:text-2xl font-black text-white leading-snug">
            {isAr ? currentItem.titleAr : currentItem.title}
          </h4>

          <p className="text-xs sm:text-sm text-tp-ivory/85 max-w-2xl leading-relaxed hidden sm:block">
            {isAr ? currentItem.descriptionAr : currentItem.description}
          </p>
        </div>
      </div>

      {/* Thumbnails Navigation Row */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {items.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => setSelectedIndex(idx)}
            className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all active:scale-95 ${
              selectedIndex === idx
                ? "border-tp-cyan ring-2 ring-tp-cyan/30 scale-[1.02] shadow-md"
                : "border-tp-line opacity-70 hover:opacity-100"
            }`}
          >
            <img
              src={item.imageUrl}
              alt={isAr ? item.titleAr : item.title}
              className="w-full h-full object-cover"
            />
            {selectedIndex === idx && (
              <div className="absolute inset-0 bg-tp-cyan/15 pointer-events-none" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
