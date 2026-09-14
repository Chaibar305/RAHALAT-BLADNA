"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { 
  FileEdit, Users, UserCheck, 
  Building2, TrendingUp, Compass, ArrowLeft 
} from "lucide-react";

interface TripAdminTabsProps {
  tripId: string;
  tripSlug: string;
  tripTitle: string;
}

export function TripAdminTabs({ tripId, tripSlug, tripTitle }: TripAdminTabsProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const isAr = locale === "ar";

  const tabs = [
    {
      label: isAr ? "تفاصيل البرنامج" : "Détails & Programme",
      href: `/${locale}/admin/trips/${tripId}/edit`,
      icon: FileEdit,
      active: pathname.endsWith(`/admin/trips/${tripId}/edit`),
    },
    {
      label: isAr ? "قائمة المسافرين" : "Voyageurs & Manifeste",
      href: `/${locale}/admin/trips/${tripId}/voyageurs`,
      icon: Users,
      active: pathname.endsWith(`/admin/trips/${tripId}/voyageurs`),
    },
    {
      label: isAr ? "فريق العمل والتأطير" : "Équipe & Encadrement",
      href: `/${locale}/admin/trips/${tripId}/equipe`,
      icon: UserCheck,
      active: pathname.endsWith(`/admin/trips/${tripId}/equipe`),
    },
    {
      label: isAr ? "الشركاء (فنادق ونقل)" : "Partenaires & Logistique",
      href: `/${locale}/admin/trips/${tripId}/partenaires`,
      icon: Building2,
      active: pathname.endsWith(`/admin/trips/${tripId}/partenaires`),
    },
    {
      label: isAr ? "تحليل المردودية والربح" : "Rentabilité & Point Mort",
      href: `/${locale}/admin/trips/${tripId}/rentabilite`,
      icon: TrendingUp,
      active: pathname.endsWith(`/admin/trips/${tripId}/rentabilite`),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/admin/trips`}
            className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition active:scale-95 shrink-0"
            title={isAr ? "العودة للرحلات" : "Retour aux circuits"}
          >
            <ArrowLeft className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />
          </Link>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-600 dark:text-cyan-400 font-bold">
              {isAr ? "إدارة الرحلة المتقدمة" : "Gestion Modulaire du Circuit"}
            </span>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate max-w-xl">
              {tripTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/trips/${tripSlug}`}
            target="_blank"
            className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>{isAr ? "معاينة الصفحة للعموم" : "Page Publique"}</span>
          </Link>
        </div>
      </div>

      {/* Tabs Navigation (Horizontal Scrollable on Mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-slate-800/80">
        {tabs.map((tab, idx) => {
          const Icon = tab.icon;
          return (
            <Link
              key={idx}
              href={tab.href}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
                tab.active
                  ? "bg-cyan-500 text-slate-950 shadow-md"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-xs"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
