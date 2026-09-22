import React from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPublicJobPostingsAction } from "@/actions/recruitment.actions";
import { CareerListingsClient } from "@/components/recruitment/CareerListingsClient";
import { Briefcase, Sparkles, Compass } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isAr = locale === "ar";
  const title = isAr
    ? "انضم إلى فريق رحلات بلادنا | وظائف وفرص عمل في السياحة والمغامرة"
    : "Carrières & Recrutement | Rejoignez l'Aventure Rahalat Bladna";
  const description = isAr
    ? "اكتشف فرص العمل المتاحة لدى رحلات بلادنا: مرشدون، منشطون، سائقون ومسؤولون ميدانيون. قدّم سيرتك الذاتية بسهولة."
    : "Rejoignez l'équipe Rahalat Bladna : guides, accompagnateurs, chauffeurs et métiers du voyage. Postulez en ligne avec votre CV.";

  const baseUrl = "https://www.rahalatbladna.ma";

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}/carrieres`,
      languages: {
        "fr-MA": `${baseUrl}/fr/carrieres`,
        "ar-MA": `${baseUrl}/ar/carrieres`,
        "en-US": `${baseUrl}/en/carrieres`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/carrieres`,
      siteName: "Rahalat Bladna",
      images: [
        {
          url: `${baseUrl}/images/hero-banner.jpg`,
          width: 1200,
          height: 630,
          alt: "Carrières Rahalat Bladna",
        },
      ],
      locale: isAr ? "ar_MA" : "fr_MA",
      type: "website",
    },
  };
}

export default async function CareersPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "recruitment" });
  const isAr = locale === "ar";

  const { jobs, filterOptions } = await getPublicJobPostingsAction();

  return (
    <div className="bg-tp-ivory min-h-screen pb-24">
      {/* BANNIÈRE HÉROS HAUT DE PAGE */}
      <section className="relative bg-tp-midnight text-white overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-20">
        {/* Cercles d'ambiance en fond */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-tp-cyan/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-tp-cyan text-xs font-black uppercase tracking-wider border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? "فرص التوظيف المفتوحة" : "Espace Talents & Recrutement"}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
            {t("title")}
          </h1>

          <p className="text-sm sm:text-base text-tp-ivory/80 max-w-2xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* CONTENU PRINCIPAL & CATALOGUE D'OFFRES */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <CareerListingsClient initialJobs={jobs} filterOptions={filterOptions} />
      </main>
    </div>
  );
}
