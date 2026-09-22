"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { 
  Briefcase, MapPin, Calendar, Clock, ChevronRight, 
  Sparkles, Filter, RotateCcw, ArrowRight, ArrowLeft, Users 
} from "lucide-react";
import { JobAlertSubscriptionCard } from "./JobAlertSubscriptionCard";

interface JobItem {
  id: string;
  title: string;
  slug: string;
  department: string | null;
  employmentType: string;
  location: string;
  descriptionFr: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  missions: string[];
  requirements: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  salaryType: string | null;
  publishedAt: string | null;
  closingDate: string | null;
}

interface CareerListingsClientProps {
  initialJobs: JobItem[];
  filterOptions: {
    departments: string[];
    locations: string[];
  };
}

export function CareerListingsClient({ initialJobs, filterOptions }: CareerListingsClientProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("recruitment");

  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [selectedContract, setSelectedContract] = useState("ALL");
  const [selectedLocation, setSelectedLocation] = useState("ALL");

  // Filtrage réactif
  const filteredJobs = useMemo(() => {
    return initialJobs.filter((job) => {
      if (selectedDepartment !== "ALL" && job.department !== selectedDepartment) {
        return false;
      }
      if (selectedContract !== "ALL" && job.employmentType !== selectedContract) {
        return false;
      }
      if (selectedLocation !== "ALL" && job.location !== selectedLocation) {
        return false;
      }
      return true;
    });
  }, [initialJobs, selectedDepartment, selectedContract, selectedLocation]);

  const hasActiveFilters =
    selectedDepartment !== "ALL" || selectedContract !== "ALL" || selectedLocation !== "ALL";

  const resetFilters = () => {
    setSelectedDepartment("ALL");
    setSelectedContract("ALL");
    setSelectedLocation("ALL");
  };

  // Détermine si un poste a été publié il y a moins de 7 jours (badge "Nouveau")
  const isNewJob = (publishedAtStr: string | null) => {
    if (!publishedAtStr) return false;
    const pubDate = new Date(publishedAtStr).getTime();
    const now = Date.now();
    const diffDays = (now - pubDate) / (1000 * 3600 * 24);
    return diffDays <= 7;
  };

  return (
    <div className="space-y-10">
      {/* BARRE DE FILTRES */}
      {initialJobs.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-tp-line shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-tp-midnight uppercase tracking-wider">
              <Filter className="w-4 h-4 text-tp-cyan" />
              <span>{t("filters")}</span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-tp-cyan transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t("resetFilters")}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Filtre Département */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block uppercase">
                {isAr ? "القسم / الميدان" : "Département"}
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:border-tp-cyan transition"
              >
                <option value="ALL">{t("allDepartments")}</option>
                {filterOptions.departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre Type de Contrat */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block uppercase">
                {isAr ? "نوع العقد" : "Type de contrat"}
              </label>
              <select
                value={selectedContract}
                onChange={(e) => setSelectedContract(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:border-tp-cyan transition"
              >
                <option value="ALL">{t("allContracts")}</option>
                <option value="FREELANCE">{t("contracts.FREELANCE")}</option>
                <option value="TEMPS_PARTIEL">{t("contracts.TEMPS_PARTIEL")}</option>
                <option value="TEMPS_PLEIN">{t("contracts.TEMPS_PLEIN")}</option>
                <option value="MISSION_PONCTUELLE">{t("contracts.MISSION_PONCTUELLE")}</option>
                <option value="STAGE">{t("contracts.STAGE")}</option>
              </select>
            </div>

            {/* Filtre Ville */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block uppercase">
                {isAr ? "المدينة / الانطلاق" : "Localisation"}
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:border-tp-cyan transition"
              >
                <option value="ALL">{t("allLocations")}</option>
                {filterOptions.locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* LISTE DES OFFRES OU ÉTAT VIDE */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-14 border border-tp-line shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-200 shadow-inner">
            <Briefcase className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-xl sm:text-2xl font-black text-tp-midnight">
              {t("noJobsTitle")}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {t("noJobsSubtitle")}
            </p>
          </div>

          <div className="pt-4">
            <JobAlertSubscriptionCard />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
            const isNew = isNewJob(job.publishedAt);
            const contractLabel = (t as any)(`contracts.${job.employmentType}`) || job.employmentType;

            return (
              <div
                key={job.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-tp-line hover:border-tp-cyan/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Badges en-tête */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                      {contractLabel}
                    </span>

                    {isNew && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500" />
                        <span>{t("newBadge")}</span>
                      </span>
                    )}
                  </div>

                  {/* Titre & Localisation */}
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-black text-tp-midnight group-hover:text-tp-cyan transition">
                      <Link href={`/${locale}/carrieres/${job.slug}`}>
                        {job.title}
                      </Link>
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-tp-cyan shrink-0" />
                        <span>{job.location}</span>
                      </div>
                      {job.department && (
                        <div className="flex items-center gap-1 font-medium">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{job.department}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Aperçu des missions (2 premiers points) */}
                  {job.missions && job.missions.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">
                        {isAr ? "نظرة على المهام :" : "Missions clés :"}
                      </p>
                      <ul className="text-xs text-slate-600 space-y-1">
                        {job.missions.slice(0, 2).map((m, idx) => (
                          <li key={idx} className="line-clamp-1 flex items-start gap-1.5">
                            <span className="text-tp-cyan shrink-0 font-bold">•</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Bouton d'action */}
                <div className="pt-6 mt-4 border-t border-slate-100">
                  <Link
                    href={`/${locale}/carrieres/${job.slug}`}
                    className="w-full h-11 rounded-xl bg-slate-50 hover:bg-tp-midnight text-slate-800 hover:text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition group/btn"
                  >
                    <span>{t("viewDetails")}</span>
                    {isAr ? (
                      <ArrowLeft className="w-4 h-4 group-hover/btn:-translate-x-1 transition" />
                    ) : (
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition" />
                    )}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
