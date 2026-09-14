"use client";

import React from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, BookOpen, Clock } from "lucide-react";

export function BlogInspirationSection() {
  const locale = useLocale();
  const t = useTranslations("home");

  const articles = [
    {
      id: 1,
      tag: "Guide Sahara",
      title:
        locale === "ar"
          ? "كيف تستعد لقضاء ليلة ساحرة في مخيمات صحراء مرزوكة ؟"
          : "Bivouac à Merzouga : Le guide complet pour une nuit magique sous les étoiles",
      image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
      readTime: "4 min",
      date: "Août 2026",
    },
    {
      id: 2,
      tag: "Inspiration Nord",
      title:
        locale === "ar"
          ? "أفضل 5 أماكن سرية لا تفوت زيارتها في شفشاون وأقشور"
          : "Les 5 plus beaux spots secrets à découvrir entre Chefchaouen et Akchour",
      image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
      readTime: "5 min",
      date: "Août 2026",
    },
    {
      id: 3,
      tag: "Aventure Dakhla",
      title:
        locale === "ar"
          ? "الداخلة بين الرياضات البحرية وهدوء الكثبان البيضاء"
          : "Dakhla autrement : Entre sports de glisse, Dune Blanche et dégustation d'huîtres",
      image: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=800&q=80",
      readTime: "6 min",
      date: "Juillet 2026",
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-tp-cream/40 border-y border-tp-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-tp-cyan-hover">
              <span className="w-5 h-[2px] bg-tp-cyan-hover rounded-full" />
              <span className="text-xs font-black uppercase tracking-widest">
                {t("blogKicker")}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-tp-midnight tracking-tight">
              {t("blogTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-tp-muted max-w-xl">
              {t("blogSubtitle")}
            </p>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {articles.map((art) => (
            <article
              key={art.id}
              className="bg-white rounded-card overflow-hidden border border-tp-line shadow-tp-sm flex flex-col justify-between tp-lift group"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-tp-midnight">
                <img
                  src={art.image}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 rtl:left-auto rtl:right-3 px-2.5 py-1 rounded-pill bg-white/95 text-tp-midnight text-[10.5px] font-black uppercase tracking-wider shadow-sm">
                  {art.tag}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] text-tp-muted font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{art.readTime}</span>
                    <span>•</span>
                    <span>{art.date}</span>
                  </div>

                  <h3 className="font-extrabold text-base text-tp-midnight line-clamp-2 leading-snug group-hover:text-tp-cyan-hover transition-colors">
                    {art.title}
                  </h3>
                </div>

                <div className="pt-3 border-t border-tp-line flex items-center justify-between text-xs font-black text-tp-cyan-hover group-hover:text-tp-midnight transition">
                  <span>{t("readArticle")}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
