"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { ShieldCheck, Users, CreditCard, Headphones, Sparkles } from "lucide-react";

export function WhyChooseUsSection() {
  const locale = useLocale();
  const t = useTranslations("home");

  const features = [
    {
      icon: <ShieldCheck className="w-8 h-8 text-tp-cyan-hover" />,
      title: t("why1Title"),
      desc: t("why1Desc"),
    },
    {
      icon: <Users className="w-8 h-8 text-tp-cyan-hover" />,
      title: t("why2Title"),
      desc: t("why2Desc"),
    },
    {
      icon: <CreditCard className="w-8 h-8 text-tp-cyan-hover" />,
      title: t("why3Title"),
      desc: t("why3Desc"),
    },
    {
      icon: <Headphones className="w-8 h-8 text-tp-cyan-hover" />,
      title: t("why4Title"),
      desc: t("why4Desc"),
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-tp-cream/50 border-y border-tp-line/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-center">
        {/* Section Header */}
        <div className="space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 text-tp-terracotta">
            <span className="w-5 h-[2px] bg-tp-terracotta rounded-full" />
            <span className="text-xs font-black uppercase tracking-widest">
              {t("whyKicker")}
            </span>
            <span className="w-5 h-[2px] bg-tp-terracotta rounded-full" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-tp-midnight tracking-tight">
            {t("whyTitle")}
          </h2>
          <p className="text-xs sm:text-sm text-tp-muted leading-relaxed">
            {t("whySubtitle")}
          </p>
        </div>

        {/* 4 Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-tp-line flex flex-col items-center text-center space-y-4 shadow-tp-sm hover:shadow-tp-lift transition-all duration-300 tp-lift"
            >
              {/* Circular Icon with double ring border style from Triplan */}
              <div className="w-20 h-20 rounded-full bg-tp-cyan-tint/60 border-4 border-[#F2EEE8] flex items-center justify-center shadow-inner">
                {feat.icon}
              </div>

              <h3 className="font-extrabold text-base text-tp-midnight">
                {feat.title}
              </h3>

              <p className="text-xs text-tp-muted leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
