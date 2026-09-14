"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { 
  Briefcase, Users, Trophy, Award, 
  ArrowRight, CheckCircle, Sparkles, Building2 
} from "lucide-react";

export function B2BSection() {
  const locale = useLocale();
  const t = useTranslations("home");

  const clients = [
    "Maroc Telecom",
    "Attijariwafa Bank",
    "OCP Group",
    "CIH Bank",
    "Inwi",
    "Orange Maroc",
    "CDG",
    "BMCE Bank of Africa",
  ];

  return (
    <section
      id="b2b"
      className="relative py-20 sm:py-28 bg-tp-midnight text-white overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(120% 90% at 85% 12%, #16344F 0%, #0B2239 62%)",
      }}
    >
      {/* Background glow circle */}
      <div className="absolute top-1/2 -left-20 w-96 h-96 bg-tp-cyan/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-tp-cyan-soft">
              <span className="w-5 h-[2px] bg-tp-cyan-soft rounded-full" />
              <span className="text-xs font-black uppercase tracking-widest">
                {t("b2bKicker")}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white">
              {t("b2bTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-tp-ivory/75 leading-relaxed">
              {t("b2bSubtitle")}
            </p>
          </div>

          <a
            href="https://wa.me/212681024758?text=Bonjour%20Rahalat%20Bladna,%20nous%20souhaitons%20organiser%20un%20Team%20Building%20/%20S%C3%A9minaire%20pour%20notre%20entreprise."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-tp-cyan hover:bg-tp-cyan-hover text-white font-black text-xs sm:text-sm px-6 py-3.5 rounded-control shadow-tp-cyan transition-all active:scale-95 self-start md:self-auto shrink-0"
          >
            <Briefcase className="w-4 h-4" />
            <span>{t("b2bBtn")}</span>
          </a>
        </div>

        {/* Stats Grid in Midnight Glass Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white/[0.06] border border-white/10 space-y-2 tp-lift-dark">
            <div className="text-3xl sm:text-4xl font-black text-tp-cyan-soft">
              {t("b2bStat1")}
            </div>
            <div className="text-xs sm:text-sm text-tp-ivory/80 font-bold">
              {t("b2bStat1Label")}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.06] border border-white/10 space-y-2 tp-lift-dark">
            <div className="text-3xl sm:text-4xl font-black text-tp-cyan-soft">
              {t("b2bStat2")}
            </div>
            <div className="text-xs sm:text-sm text-tp-ivory/80 font-bold">
              {t("b2bStat2Label")}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.06] border border-white/10 space-y-2 tp-lift-dark">
            <div className="text-3xl sm:text-4xl font-black text-tp-cyan-soft">
              {t("b2bStat3")}
            </div>
            <div className="text-xs sm:text-sm text-tp-ivory/80 font-bold">
              {t("b2bStat3Label")}
            </div>
          </div>
        </div>

        {/* Corporate Trust Marquee Panel */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-tp-midnight uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-tp-cyan-hover" />
              {locale === "ar" ? "شركات وثقت بنا" : "Ils nous font confiance"}
            </span>
            <span className="text-[11px] font-bold text-tp-muted">
              Séminaires • Incentives • Team Building
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {clients.map((client, idx) => (
              <div
                key={idx}
                className="flex items-center justify-center p-4 rounded-xl bg-tp-cream/40 border border-tp-line text-xs font-black text-tp-midnight hover:border-tp-cyan transition text-center"
              >
                {client}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
