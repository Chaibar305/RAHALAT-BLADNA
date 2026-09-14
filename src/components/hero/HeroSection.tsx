"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Star, Users, ShieldCheck, Sparkles } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";

export function HeroSection() {
  const locale = useLocale();
  const t = useTranslations("home");
  const brand = useTranslations("brand");
  const isAr = locale === "ar";

  return (
    <section className="relative min-h-[640px] lg:min-h-[760px] flex items-center justify-center bg-[#080d1a] text-white overflow-hidden py-16 sm:py-24 lg:py-32">
      {/* 1. Cinematic Hero Background Cover Photo (Atlas & Sahara Dunes) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <motion.img
          initial={{ scale: 1.06 }}
          animate={{ scale: 1.0 }}
          transition={{ duration: 8, ease: "easeOut" }}
          src="/images/hero/hero-atlas-dunes.jpg"
          alt="Montagnes de l'Atlas et Dunes du Sahara — Rahalat Bladna"
          className="w-full h-full object-cover object-[center_38%]"
        />

        {/* Ambient Dark Overlays & Seamless Edge Blending Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080d1a]/85 via-[#080d1a]/25 to-[#080d1a]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080d1a]/75 via-transparent to-[#080d1a]/75" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(8,13,26,0.85)_100%)]" />
      </div>

      {/* Moroccan Subtle Geometry Accent Layer */}
      <div className="absolute inset-0 bg-moroccan-pattern-dark opacity-10 pointer-events-none z-1" />

      {/* 2. Hero Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7 sm:space-y-8">
        {/* Eyebrow Floating Pill with Live Pulsing Cyan Dot */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 font-extrabold text-xs tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            {isAr
              ? "رحلات وأسفار بالمغرب"
              : "VOYAGES & CIRCUITS AU MAROC"}
          </span>
        </motion.div>

        {/* Headline H1 with Animated Shimmer Gradient */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          className="space-y-3"
        >
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] drop-shadow-2xl">
            {isAr ? "اكتشف روعة المغرب بطريقة فريدة." : "Explorez le Maroc autrement."}{" "}
            <span className="block mt-1 sm:mt-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-sky-400 animate-gradient-x">
              {isAr ? "عِش روعة المغامرة الأصيلة." : "Vivez l'aventure marocaine."}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium pt-1">
            {isAr
              ? "رحلات نهاية الأسبوع، مخيمات صحراوية ساحرة بمرزوكة، مغامرات جبال الأطلس الكبير وبرامج سياحية استثنائية."
              : "Escapades du week-end, bivouacs féeriques au Sahara, randonnées dans le Haut Atlas et circuits organisés d'exception."}
          </p>
        </motion.div>

        {/* Social Proof Badges (3 Horizontal Glass Pills) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-1"
        >
          {/* Badge 1 : Google Rating */}
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 text-white shadow-lg text-xs font-bold transition hover:bg-white/15">
            <span className="text-amber-400 flex items-center text-sm">⭐</span>
            <span>{isAr ? "4.9/5 على Google" : "4.9/5 sur Google"}</span>
          </div>

          {/* Badge 2 : Travelers */}
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 text-white shadow-lg text-xs font-bold transition hover:bg-white/15">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>{isAr ? "+15 000 مسافر تمت مرافقتهم" : "+15 000 Voyageurs accompagnés"}</span>
          </div>

          {/* Badge 3 : Official Accreditation */}
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 text-white shadow-lg text-xs font-bold transition hover:bg-white/15">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {isAr
                ? "100% معتمد (نقل سياحي TIST & مرشدون)"
                : "100% Agréé (Transport Touristique TIST & Guides)"}
            </span>
          </div>
        </motion.div>

        {/* 3. Fast Search Floating Glass Container */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: "easeOut" }}
          className="pt-2 sm:pt-4"
        >
          <SearchBar />
        </motion.div>
      </div>
    </section>
  );
}
