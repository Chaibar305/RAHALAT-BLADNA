"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { 
  TrendingUp, DollarSign, Calendar, RefreshCw, 
  PhoneCall, Users, Ticket, ArrowUpRight, 
  Compass, Eye, CheckCircle2, Award, Zap,
  BarChart3, PieChart, Sparkles, Filter, ShieldCheck, Share2
} from "lucide-react";
import { AnalyticsData, getAnalyticsMetrics } from "@/actions/analytics.actions";

interface AnalyticsDashboardClientProps {
  initialData: AnalyticsData;
  initialPeriod: "7d" | "30d" | "month" | "all";
}

export function AnalyticsDashboardClient({ initialData, initialPeriod }: AnalyticsDashboardClientProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [period, setPeriod] = useState<"7d" | "30d" | "month" | "all">(initialPeriod);
  const [data, setData] = useState<AnalyticsData>(initialData);
  const [isPending, startTransition] = useTransition();

  const handlePeriodChange = (newPeriod: "7d" | "30d" | "month" | "all") => {
    setPeriod(newPeriod);
    startTransition(async () => {
      try {
        const updated = await getAnalyticsMetrics(newPeriod);
        setData(updated);
      } catch (err) {
        console.error("Erreur actualisation métriques analytics:", err);
      }
    });
  };

  const formatMAD = (amount: number) => {
    return new Intl.NumberFormat("fr-MA", {
      style: "currency",
      currency: "MAD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const periodLabels: Record<string, { fr: string; ar: string }> = {
    "7d": { fr: "7 derniers jours", ar: "آخر 7 أيام" },
    "30d": { fr: "30 derniers jours", ar: "آخر 30 يوماً" },
    month: { fr: "Ce mois-ci", ar: "هذا الشهر" },
    all: { fr: "Tout l'historique", ar: "كامل السجل" },
  };

  const getSourceIconBg = (sourceName: string) => {
    if (sourceName.toLowerCase().includes("meta") || sourceName.toLowerCase().includes("facebook") || sourceName.toLowerCase().includes("instagram")) {
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    }
    if (sourceName.toLowerCase().includes("tiktok")) {
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    }
    if (sourceName.toLowerCase().includes("google")) {
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    }
    if (sourceName.toLowerCase().includes("whatsapp")) {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    }
    return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header & Filtres temporels */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center shadow-md">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isAr ? "لوحة الإحصائيات والأداء" : "Analytics & Performances"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isAr
                  ? "مؤشرات المبيعات، عوائد الحملات الإعلانية ومردودية عمال التأكيد"
                  : "Pilotage du chiffre d'affaires, attribution publicitaire (Meta/TikTok) & conversion d'appels"}
              </p>
            </div>
          </div>
        </div>

        {/* Sélecteur de période */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          {(["7d", "30d", "month", "all"] as const).map((pKey) => {
            const isActive = period === pKey;
            return (
              <button
                key={pKey}
                onClick={() => handlePeriodChange(pKey)}
                disabled={isPending}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  isActive
                    ? "bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {isAr ? periodLabels[pKey].ar : periodLabels[pKey].fr}
              </button>
            );
          })}

          <button
            onClick={() => handlePeriodChange(period)}
            disabled={isPending}
            title={isAr ? "تحديث" : "Actualiser"}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin text-cyan-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Chiffre d'Affaires */}
        <div className="bg-gradient-to-br from-white to-cyan-50/30 dark:from-slate-900 dark:to-cyan-950/20 p-5 rounded-3xl border border-cyan-500/20 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? "إجمالي رقم المعاملات" : "Chiffre d'Affaires"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatMAD(data.overview.totalRevenue)}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{isAr ? "حجوزات مؤكدة" : "Réservations confirmées"}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Acomptes Encaissés */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? "التسبيقات المحصلة" : "Acomptes Encaissés"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatMAD(data.overview.totalDeposits)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              {isAr ? "سيولة بنكية فعلية" : "Fonds débloqués en banque"}
            </p>
          </div>
        </div>

        {/* Card 3: Réservations */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? "الحجوزات المؤكدة" : "Confirmations"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {data.overview.confirmedBookings}
              </p>
              <span className="text-xs text-slate-400 font-bold">
                / {data.overview.totalBookings} {isAr ? "طلب" : "leads"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              {data.overview.totalBookings - data.overview.confirmedBookings} {isAr ? "في الانتظار" : "en attente"}
            </p>
          </div>
        </div>

        {/* Card 4: Taux de Confirmation */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? "نسبة التحويل الهاتفي" : "Taux de Transformation"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {data.overview.conversionRate}%
            </p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, data.overview.conversionRate)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 5: Panier Moyen */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? "متوسط قيمة الحجز" : "Panier Moyen"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatMAD(data.overview.averageCart)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              {isAr ? "لكل تذكرة / مسافر" : "Par voyageur confirmé"}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Acquisition & Trafic (Media Buyer) + Top Circuits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne Gauche: Canaux d'Acquisition (Media Buyer View) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  {isAr ? "قنوات الإعلانات ومصادر الحجوزات (Media Buyer)" : "Attribution & Canaux Publicitaires (Media Buyer)"}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isAr ? "تتبع التحويلات وعائد الإنفاق عبر Meta وTikTok" : "Suivi du ROI, volume de leads et CA généré par canal"}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              ROAS Track
            </span>
          </div>

          <div className="space-y-3.5">
            {data.trafficSources.map((item, idx) => {
              const share = data.overview.totalRevenue > 0
                ? Math.round((item.estimatedRevenue / data.overview.totalRevenue) * 100)
                : 0;

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${getSourceIconBg(item.source)}`}>
                        {item.source}
                      </span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {item.bookingsCount} {isAr ? "مؤكد" : "confirmés"} / {item.leadsCount} {isAr ? "طلب" : "leads"}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {formatMAD(item.estimatedRevenue)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium ms-1.5">
                        ({share}%)
                      </span>
                    </div>
                  </div>

                  {/* Barre de progression & Taux de conversion */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, Math.min(100, item.conversionRate))}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                      {isAr ? `تحويل: ${item.conversionRate}%` : `${item.conversionRate}% conv.`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Colonne Droite: Top Circuits Performants */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  {isAr ? "الرحلات الأكثر مردودية" : "Top Circuits les Plus Rentables"}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isAr ? "الحجوزات ومعدل ملء الحافلات" : "Volume de passagers & taux d'occupation autocar"}
                </p>
              </div>
            </div>
            <Award className="w-4 h-4 text-amber-500" />
          </div>

          <div className="space-y-3">
            {data.topTrips.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {isAr ? "لا توجد رحلات مسجلة في هذه الفترة" : "Aucune donnée de circuit pour cette période"}
              </div>
            ) : (
              data.topTrips.map((trip, idx) => (
                <div
                  key={trip.id || idx}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-black text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {trip.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2.5 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <span>{trip.bookingsCount} {isAr ? "تذكرة" : "voyageurs"}</span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {trip.fillRate}% {isAr ? "ملء الحافلة" : "remplissage"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {formatMAD(trip.revenue)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Grid: Performance Équipe Téléphonique + Tendance Récente */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Performance Agents de Confirmation */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  {isAr ? "أداء عمال التأكيد الهاتفي" : "Performance Agents de Confirmation"}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isAr ? "المكالمات المعالجة وتثبيت الأقساط" : "Appels traités, relances et taux de validation d'acompte"}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-pill bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Live Desk
            </span>
          </div>

          <div className="space-y-3">
            {data.teamPerformance.confirmationAgents.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? "لا توجد مكالمات أو حجوزات مسجلة لهذه الفترة" : "Aucun dossier traité sur cette période"}
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1 mb-3">
                  {isAr 
                    ? "عندما يقوم عون التأكيد الهاتفي بتثبيت الحجوزات أو تحصيل الأقساط، ستظهر إحصائياته الحقيقية هنا مباشرة."
                    : "Les membres affectés au rôle « Agent(e) de Confirmation » et traitant des réservations apparaîtront ici."}
                </p>
                <Link
                  href={`/${locale}/admin/team`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{isAr ? "إدارة فريق العمل" : "Voir l'équipe"}</span>
                </Link>
              </div>
            ) : (
              data.teamPerformance.confirmationAgents.map((agent, i) => {
                const badgeColor =
                  agent.rate >= 70
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    : agent.rate >= 50
                    ? "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800"
                    : agent.rate > 0
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700";

                return (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
                        {agent.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {agent.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {agent.confirmedCount} {isAr ? "مؤكد" : "confirmés"} / {agent.callsHandled} {isAr ? "معالج" : "traités"}
                          {agent.revenueMAD !== undefined && agent.revenueMAD > 0 ? (
                            <span className="ms-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                              • {formatMAD(agent.revenueMAD)}
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`px-2.5 py-1 rounded-xl font-black text-xs border ${badgeColor}`}>
                        {agent.rate}% {isAr ? "نجاح" : "succès"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tendance Chronologique */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-black">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  {isAr ? "منحنى النشاط والمبيعات" : "Tendance Chronologique des Réservations"}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isAr ? "توزيع الطلبات ورقم المعاملات حسب الأيام" : "Évolution journalière des réservations et revenus"}
                </p>
              </div>
            </div>
            <Calendar className="w-4 h-4 text-cyan-500" />
          </div>

          <div className="space-y-3">
            {data.recentTrend.slice(-6).map((point, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 w-16">
                    {point.date}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {point.bookings} {isAr ? "حجز" : "réservations"}
                  </span>
                </div>

                <div className="text-right font-black text-xs text-cyan-600 dark:text-cyan-400">
                  {formatMAD(point.revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
