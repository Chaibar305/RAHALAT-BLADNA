import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPublicJobPostingBySlugAction } from "@/actions/recruitment.actions";
import { JobApplicationForm } from "@/components/recruitment/JobApplicationForm";
import { JobShareButtons } from "@/components/recruitment/JobShareButtons";
import { 
  Briefcase, MapPin, Calendar, Clock, ChevronRight, 
  Coins, CheckCircle2, ArrowRight, ArrowLeft, Users, ShieldAlert, Sparkles 
} from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const isAr = locale === "ar";
  const { job } = await getPublicJobPostingBySlugAction(slug);

  if (!job) {
    return {
      title: isAr ? "عرض العمل غير موجود | رحلات بلادنا" : "Offre Introuvable | Rahalat Bladna",
    };
  }

  const title = isAr
    ? `${job.title} | وظائف رحلات بلادنا`
    : `${job.title} - Recrutement à ${job.location} | Rahalat Bladna`;

  const description = isAr
    ? (job.descriptionAr || job.descriptionFr).slice(0, 160)
    : job.descriptionFr.slice(0, 160);

  const baseUrl = "https://www.rahalatbladna.ma";

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}/carrieres/${job.slug}`,
      languages: {
        "fr-MA": `${baseUrl}/fr/carrieres/${job.slug}`,
        "ar-MA": `${baseUrl}/ar/carrieres/${job.slug}`,
        "en-US": `${baseUrl}/en/carrieres/${job.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/carrieres/${job.slug}`,
      siteName: "Rahalat Bladna",
      images: [
        {
          url: `${baseUrl}/images/hero-banner.jpg`,
          width: 1200,
          height: 630,
          alt: job.title,
        },
      ],
      locale: isAr ? "ar_MA" : "fr_MA",
      type: "website",
    },
  };
}

export default async function JobDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const t = await getTranslations({ locale, namespace: "recruitment" });
  const isAr = locale === "ar";

  const { job, similarJobs } = await getPublicJobPostingBySlugAction(slug);

  if (!job) {
    notFound();
  }

  const contractLabel = (t as any)(`contracts.${job.employmentType}`) || job.employmentType;
  const descriptionText = isAr
    ? (job.descriptionAr || job.descriptionFr)
    : (locale === "en" ? (job.descriptionEn || job.descriptionFr) : job.descriptionFr);

  // Formatage de la rémunération
  let salaryDisplay = t("salaryToDiscuss");
  if (job.salaryMin && job.salaryMax) {
    salaryDisplay = `${job.salaryMin} - ${job.salaryMax} MAD`;
  } else if (job.salaryMin) {
    salaryDisplay = `À partir de ${job.salaryMin} MAD`;
  }

  if (job.salaryType && job.salaryType !== "A_DISCUTER") {
    const typeLabel = (t as any)(`salaryTypes.${job.salaryType}`) || "";
    if (typeLabel) {
      salaryDisplay = `${salaryDisplay} (${typeLabel})`;
    }
  }

  return (
    <div className="bg-tp-ivory min-h-screen pb-28">
      {/* EN-TÊTE IMMERSIF */}
      <section className="bg-tp-midnight text-white pt-24 pb-12 sm:pt-28 sm:pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-1/3 w-80 h-80 bg-tp-cyan/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs font-bold text-tp-ivory/70">
            <Link href={`/${locale}`} className="hover:text-white transition">
              {isAr ? "الرئيسية" : "Accueil"}
            </Link>
            <ChevronRight className="w-3 h-3 rtl:rotate-180" />
            <Link href={`/${locale}/carrieres`} className="hover:text-white transition">
              {isAr ? "وظائف وانضم إلينا" : "Carrières"}
            </Link>
            <ChevronRight className="w-3 h-3 rtl:rotate-180" />
            <span className="text-tp-cyan truncate max-w-xs">{job.title}</span>
          </nav>

          {/* Titre & Badges */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3.5 py-1 rounded-full bg-tp-cyan/20 text-tp-cyan text-xs font-extrabold tracking-wide border border-tp-cyan/30">
                {contractLabel}
              </span>
              {job.department && (
                <span className="px-3.5 py-1 rounded-full bg-white/10 text-white text-xs font-bold border border-white/10">
                  {job.department}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              {job.title}
            </h1>

            {/* Métadonnées rapides */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-tp-ivory/80 pt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-tp-cyan shrink-0" />
                <span className="font-semibold">{job.location}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{salaryDisplay}</span>
              </div>

              {job.closingDate && (
                <div className="flex items-center gap-1.5 text-rose-300">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>
                    {t("closingOn")} {new Date(job.closingDate).toLocaleDateString(locale === "ar" ? "ar-MA" : "fr-FR")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Boutons d'action et Partage */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
            <a
              href="#postuler"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-tp-cyan hover:bg-tp-cyan-hover text-white font-black text-sm shadow-lg shadow-tp-cyan/20 transition group"
            >
              <span>{t("applyNow")}</span>
              {isAr ? (
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
              ) : (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              )}
            </a>

            <JobShareButtons jobTitle={job.title} jobLocation={job.location} slug={job.slug} />
          </div>
        </div>
      </section>

      {/* CORPS PRINCIPAL */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 relative z-10 space-y-10">
        <div className="grid grid-cols-1 gap-8">
          {/* FICHE DESCRIPTIVE */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-tp-line shadow-sm space-y-8">
            {/* Description générale */}
            <div className="space-y-3">
              <h2 className="text-lg sm:text-xl font-black text-tp-midnight flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-tp-cyan" />
                <span>{isAr ? "عن الوظيفة والفرصة" : "Présentation du Poste"}</span>
              </h2>
              <div className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {descriptionText}
              </div>
            </div>

            {/* Missions */}
            {job.missions && job.missions.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h3 className="text-lg font-black text-tp-midnight">
                  {t("missionsTitle")}
                </h3>
                <ul className="space-y-2.5 text-slate-700 text-xs sm:text-sm">
                  {job.missions.map((mission: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-tp-cyan/10 text-tp-cyan flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{mission}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Profil recherché */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h3 className="text-lg font-black text-tp-midnight">
                  {t("requirementsTitle")}
                </h3>
                <ul className="space-y-2.5 text-slate-700 text-xs sm:text-sm">
                  {job.requirements.map((req: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rémunération */}
            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-1">
              <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">
                {t("compensationTitle")}
              </h4>
              <p className="text-sm font-bold text-amber-950">
                {salaryDisplay}
              </p>
            </div>
          </div>

          {/* FORMULAIRE DE CANDIDATURE INTÉGRÉ */}
          <JobApplicationForm jobPostingId={job.id} jobTitle={job.title} />

          {/* SECTION OFFRES SIMILAIRES */}
          {similarJobs && similarJobs.length > 0 && (
            <div className="space-y-5 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-black text-tp-midnight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>{t("similarJobs")}</span>
                </h3>
                <Link
                  href={`/${locale}/carrieres`}
                  className="text-xs font-bold text-tp-cyan hover:underline"
                >
                  {isAr ? "عرض جميع الوظائف" : "Toutes les offres"}
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {similarJobs.map((sim: any) => (
                  <Link
                    key={sim.id}
                    href={`/${locale}/carrieres/${sim.slug}`}
                    className="bg-white p-5 rounded-2xl border border-tp-line hover:border-tp-cyan/50 hover:shadow-md transition space-y-2 group block"
                  >
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                      {(t as any)(`contracts.${sim.employmentType}`) || sim.employmentType}
                    </span>
                    <h4 className="text-sm font-black text-tp-midnight group-hover:text-tp-cyan transition line-clamp-1">
                      {sim.title}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-tp-cyan shrink-0" />
                      <span>{sim.location}</span>
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
