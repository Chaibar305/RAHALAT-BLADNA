"use client";

import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { 
  Sparkles, Calendar, ShieldCheck, HeartHandshake, 
  Car, Map, Hotel, ArrowRight, CheckCircle2, MessageCircle 
} from "lucide-react";

export function TailorMadeSection() {
  const locale = useLocale();
  const t = useTranslations("home");
  const [showModal, setShowModal] = useState(false);

  const perks = [
    {
      icon: <Map className="w-5 h-5 text-tp-cyan-hover" />,
      title: t("tailorFeat1Title"),
      desc: t("tailorFeat1Desc"),
    },
    {
      icon: <Car className="w-5 h-5 text-tp-cyan-hover" />,
      title: t("tailorFeat2Title"),
      desc: t("tailorFeat2Desc"),
    },
    {
      icon: <Hotel className="w-5 h-5 text-tp-cyan-hover" />,
      title: t("tailorFeat3Title"),
      desc: t("tailorFeat3Desc"),
    },
  ];

  return (
    <section id="sur-mesure" className="py-16 sm:py-24 bg-white border-y border-tp-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Text & Perks */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-tp-terracotta">
                <span className="w-5 h-[2px] bg-tp-terracotta rounded-full" />
                <span className="text-xs font-black uppercase tracking-widest">
                  {t("tailorKicker")}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-tp-midnight tracking-tight">
                {t("tailorTitle")}
              </h2>
              <p className="text-xs sm:text-sm text-tp-muted leading-relaxed max-w-xl">
                {t("tailorSubtitle")}
              </p>
            </div>

            {/* Perks Cards List */}
            <div className="grid gap-4">
              {perks.map((perk, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-tp-ivory/60 border border-tp-line hover:border-tp-cyan-soft hover:bg-tp-cyan-tint/20 transition-all tp-lift"
                >
                  <div className="w-11 h-11 rounded-xl bg-tp-cyan-tint flex items-center justify-center shrink-0">
                    {perk.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm sm:text-base text-tp-midnight">
                      {perk.title}
                    </h3>
                    <p className="text-xs text-tp-muted leading-relaxed">
                      {perk.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Direct CTA */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="https://wa.me/212681024758?text=Bonjour%20Rahalat%20Bladna,%20je%20souhaite%20un%20devis%20pour%20un%20voyage%20sur%20mesure."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-tp-cyan hover:bg-tp-cyan-hover text-white font-black text-xs sm:text-sm px-6 py-3.5 rounded-control shadow-tp-cyan hover:shadow-lg transition-all active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{t("tailorBtn")}</span>
              </a>

              <span className="text-xs font-bold text-tp-muted flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-tp-ok-fg" />
                {locale === "ar" ? "استجابة سريعة خلال ساعتين" : "Réponse garantie sous 2h"}
              </span>
            </div>
          </div>

          {/* Right Column: Visual Photo Collage */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-tp-midnight aspect-[4/5]">
              <img
                src="https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1000&q=80"
                alt="Voyage sur mesure Maroc"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-tp-midnight/90 via-tp-midnight/20 to-transparent" />

              {/* Floating Reassurance Badge */}
              <div className="absolute bottom-6 inset-x-6 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-white/40 shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-tp-midnight flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-tp-terracotta" />
                    {locale === "ar" ? "خدمة VIP مخصصة" : "Service VIP Clé en main"}
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-tp-cyan-tint text-tp-cyan-hover">
                    100% Personnalisé
                  </span>
                </div>
                <p className="text-[11px] text-tp-muted leading-tight">
                  {locale === "ar"
                    ? "اختر وجهتك المفضلة، وسنتكفل بكافة تفاصيل النقل، الإقامة والأنشطة."
                    : "Du choix des hébergements aux expériences locales exclusives, vivez le Maroc comme vous en rêviez."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
