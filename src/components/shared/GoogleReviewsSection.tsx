"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Star, CheckCircle, Quote } from "lucide-react";

export function GoogleReviewsSection() {
  const locale = useLocale();
  const t = useTranslations("home");

  const reviews = [
    {
      id: 1,
      name: "Yassine Berrada",
      trip: "Magie du Désert : Dunes de Merzouga (3J/2N)",
      date: "Il y a 2 semaines",
      rating: 5,
      comment:
        locale === "ar"
          ? "من أفضل التجارب السياحية التي خضتها في المغرب! التنظيم كان في قمة الاحترافية، الحافلة مريحة جداً والمخيم في قلب الكثبان الذهبية كان خيالياً. شكراً للمرشد ولطاقم رحلات بلادنا."
          : "Une expérience absolument magique de bout en bout ! L'organisation était millimétrée, l'autocar grand confort et le bivouac à Merzouga tout simplement somptueux. Bravo à l'équipe et au guide pour leur bienveillance.",
      avatar: "YB",
    },
    {
      id: 2,
      name: "Sara El Amrani",
      trip: "Perle Bleue : Chefchaouen & Akchour (2J/1N)",
      date: "Il y a 1 mois",
      rating: 5,
      comment:
        locale === "ar"
          ? "رحلة ممتازة جداً وممتعة، المشي في شلالات أقشور والسباحة كان رائعاً، والجو في شفشاون لا يوصف. فندق نظيف ومعاملة راقية جداً."
          : "Superbe week-end entre amies à Akchour et Chefchaouen ! Randonnée magnifique aux cascades et ambiance conviviale incroyable. Réservation ultra simple avec l'acompte. Je recommande les yeux fermés !",
      avatar: "SA",
    },
    {
      id: 3,
      name: "Mehdi Tazi",
      trip: "Dakhla : Lagune & Dune Blanche (4J/3N)",
      date: "Il y a 3 semaines",
      rating: 5,
      comment:
        locale === "ar"
          ? "سفرية لا تُنسى في الداخلة! كل شيء منظم بعناية من تذاكر الطيران إلى جولات الكثبان البيضاء والمطاعم. رحلات بلادنا تستحق كل التقدير."
          : "Séjour de rêve à Dakhla ! Vol direct, hôtel avec vue sur la lagune et excursion Dune Blanche inoubliable. L'assistance WhatsApp était disponible à chaque étape.",
      avatar: "MT",
    },
  ];

  return (
    <section id="avis" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header with Google Score Badge */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-tp-terracotta">
              <span className="w-5 h-[2px] bg-tp-terracotta rounded-full" />
              <span className="text-xs font-black uppercase tracking-widest">
                {t("reviewsKicker")}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-tp-midnight tracking-tight">
              {t("reviewsTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-tp-muted max-w-xl">
              {t("reviewsSubtitle")}
            </p>
          </div>

          {/* Google badge */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-tp-ivory border border-tp-line shadow-tp-sm self-start md:self-auto">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-sm font-black text-lg text-tp-midnight border border-tp-line">
              G
            </div>
            <div>
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
                <span className="text-xs font-black text-tp-midnight ml-1">
                  4.9 / 5
                </span>
              </div>
              <span className="text-[11px] font-bold text-tp-muted block">
                +1 850 avis clients vérifiés
              </span>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-6 sm:p-7 rounded-2xl bg-tp-surface-2 border border-tp-line flex flex-col justify-between space-y-4 tp-lift"
            >
              <div className="space-y-3">
                {/* Rating stars & Quote icon */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-5 h-5 text-tp-cyan/40" />
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-[13px] text-tp-slate font-medium italic leading-relaxed">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>

              {/* Author & Trip info */}
              <div className="pt-4 border-t border-tp-line flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-tp-cyan to-tp-cyan-hover text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  {rev.avatar}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-tp-midnight truncate">
                      {rev.name}
                    </span>
                    <CheckCircle className="w-3 h-3 text-tp-ok-fg shrink-0" />
                  </div>
                  <span className="text-[10.5px] text-tp-muted truncate block">
                    {rev.trip}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
