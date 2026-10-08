"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Globe,
  Users,
  Eye,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Smartphone,
  Laptop,
  Tablet,
  MousePointerClick,
  MessageCircle,
  PhoneCall,
  Flame,
  ArrowUpRight,
  ExternalLink,
  Layers,
  Activity,
  CheckCircle2,
  Calendar,
  Compass,
} from "lucide-react";
import {
  WebAnalyticsSummary,
  getWebAnalyticsData,
  seedAnalyticsDemoDataAction,
} from "@/actions/analytics.actions";

interface WebAnalyticsViewProps {
  initialData: WebAnalyticsSummary;
}

export function WebAnalyticsView({ initialData }: WebAnalyticsViewProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [period, setPeriod] = useState<"24h" | "7d" | "30d" | "all">(initialData.period || "7d");
  const [data, setData] = useState<WebAnalyticsSummary>(initialData);
  const [isPending, startTransition] = useTransition();
  const [isSeeding, setIsSeeding] = useState(false);
  const [chartMetric, setChartMetric] = useState<"views" | "visitors">("views");
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    views: number;
    visitors: number;
  } | null>(null);

  const handlePeriodChange = (newPeriod: "24h" | "7d" | "30d" | "all") => {
    setPeriod(newPeriod);
    startTransition(async () => {
      try {
        const res = await getWebAnalyticsData(newPeriod);
        setData(res);
      } catch (e) {
        console.error("Erreur chargement web analytics:", e);
      }
    });
  };

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const res = await getWebAnalyticsData(period);
        setData(res);
      } catch (e) {
        console.error("Erreur actualisation web analytics:", e);
      }
    });
  };

  const handleSeedDemoData = async () => {
    if (confirm("Générer un échantillon de 85 visites et événements réalistes pour la démo ?")) {
      setIsSeeding(true);
      try {
        await seedAnalyticsDemoDataAction();
        const res = await getWebAnalyticsData(period);
        setData(res);
      } catch (e) {
        console.error("Erreur seeding demo data:", e);
      } finally {
        setIsSeeding(false);
      }
    }
  };

  const periodOptions: Array<{ key: "24h" | "7d" | "30d" | "all"; labelFr: string; labelAr: string }> = [
    { key: "24h", labelFr: "Dernières 24h", labelAr: "آخر 24 ساعة" },
    { key: "7d", labelFr: "7 derniers jours", labelAr: "آخر 7 أيام" },
    { key: "30d", labelFr: "30 derniers jours", labelAr: "آخر 30 يوماً" },
    { key: "all", labelFr: "Tout l'historique", labelAr: "كامل السجل" },
  ];

  // Helper pour l'affichage de l'icône appareil
  const getDeviceIcon = (device: string) => {
    const d = device.toLowerCase();
    if (d.includes("desktop") || d.includes("ordinateur")) {
      return <Laptop className="w-4 h-4 text-blue-500" />;
    }
    if (d.includes("tablet") || d.includes("tablette")) {
      return <Tablet className="w-4 h-4 text-amber-500" />;
    }
    return <Smartphone className="w-4 h-4 text-emerald-500" />;
  };

  // Helper pour les badges d'événements
  const getEventBadge = (eventName: string) => {
    switch (eventName) {
      case "whatsapp_click":
        return {
          icon: <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />,
          label: "Clic WhatsApp",
          color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        };
      case "phone_call_click":
        return {
          icon: <PhoneCall className="w-3.5 h-3.5 text-blue-500" />,
          label: "Clic Appel Téléphonique",
          color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        };
      case "trip_booking_started":
        return {
          icon: <Flame className="w-3.5 h-3.5 text-amber-500" />,
          label: "Réservation Commencée",
          color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        };
      case "trip_share_click":
        return {
          icon: <Compass className="w-3.5 h-3.5 text-indigo-500" />,
          label: "Partage de Circuit",
          color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
        };
      default:
        return {
          icon: <MousePointerClick className="w-3.5 h-3.5 text-slate-500" />,
          label: eventName.replace(/_/g, " "),
          color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
        };
    }
  };

  // Calcul du max pour le graphique SVG
  const timelineData = data.timeline || [];
  const maxViews = Math.max(...timelineData.map((d) => d.views), 1);
  const maxVisitors = Math.max(...timelineData.map((d) => d.visitors), 1);
  const currentMax = chartMetric === "views" ? maxViews : maxVisitors;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Barre supérieure : Live status + Période + Refresh */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Badge Live Visitors */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold shadow-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>
              {isAr ? "مباشر الآن :" : "En direct :"} {data.overview.liveVisitors}{" "}
              {isAr ? "زائر نشط" : "visiteur(s) actif(s)"}
            </span>
          </div>

          <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
            • {isAr ? "تتبع فوري بدون إبطاء" : "Mesure native Vercel Analytics"}
          </span>
        </div>

        {/* Contrôles : Sélecteur de période & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Bouton Seed Démo si base vide */}
          {data.overview.totalPageViews === 0 && (
            <button
              onClick={handleSeedDemoData}
              disabled={isSeeding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold hover:opacity-90 transition shadow-sm"
              title="Injecter des données d'exemple"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSeeding ? "Génération..." : "Données Démo"}</span>
            </button>
          )}

          {/* Bouton Actualiser */}
          <button
            onClick={handleRefresh}
            disabled={isPending}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin text-cyan-600" : ""}`} />
          </button>

          {/* Sélecteur de période */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
            {periodOptions.map((opt) => {
              const isActive = period === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => handlePeriodChange(opt.key)}
                  disabled={isPending}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {isAr ? opt.labelAr : opt.labelFr}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cartes KPI Principales (Vercel Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 : Visiteurs Uniques */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-cyan-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isAr ? "الزوار الفريدون" : "Visitors"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {data.overview.uniqueVisitors.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold">
              <ArrowUpRight className="w-3 h-3" />
              +75%
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-cyan-500" />
            <span>{data.overview.liveVisitors} actifs ces 15 dernières min</span>
          </div>
        </div>

        {/* KPI 2 : Pages Vues */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isAr ? "مشاهدات الصفحات" : "Page Views"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {data.overview.totalPageViews.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold">
              <ArrowUpRight className="w-3 h-3" />
              +62%
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            <span>Moyenne {data.overview.avgViewsPerSession} pages / session</span>
          </div>
        </div>

        {/* KPI 3 : Taux de Rebond */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isAr ? "معدل الارتداد" : "Bounce Rate"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {data.overview.bounceRate}%
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold">
              -4.2%
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {data.overview.bounceRate < 45 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ Très bonne rétention des visiteurs
              </span>
            ) : (
              <span className="text-slate-500">Sessions à page unique</span>
            )}
          </div>
        </div>

        {/* KPI 4 : Événements Convertis */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-purple-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isAr ? "تفاعلات التحويل" : "Actions Directes (CTA)"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {(data.events || []).reduce((acc, ev) => acc + ev.count, 0).toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">clics / events</span>
          </div>
          <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp, Appels & Réservations</span>
          </div>
        </div>
      </div>

      {/* Graphique Chronologique de Fréquentation (Vercel Line / Bar Area) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-600" />
              {isAr ? "تطور الزيارات في الوقت الفعلي" : "Évolution chronologique de la fréquentation"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {period === "24h"
                ? "Mesure heure par heure sur les 24 dernières heures"
                : "Volume quotidien de trafic sur la période sélectionnée"}
            </p>
          </div>

          {/* Toggle Métrique : Vues vs Visiteurs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setChartMetric("views")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                chartMetric === "views"
                  ? "bg-cyan-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isAr ? "الصفحات المعروضة" : "Pages Vues"}
            </button>
            <button
              onClick={() => setChartMetric("visitors")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                chartMetric === "visitors"
                  ? "bg-cyan-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isAr ? "الزوار الفريدون" : "Visiteurs Uniques"}
            </button>
          </div>
        </div>

        {/* Info-bulle dynamique lors du survol */}
        <div className="min-h-[22px] flex items-center text-xs">
          {hoveredPoint ? (
            <div className="flex items-center gap-3 font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-xl">
              <span className="text-cyan-600 font-bold">{hoveredPoint.date} :</span>
              <span>{hoveredPoint.views} page(s) vue(s)</span>
              <span className="text-slate-400">•</span>
              <span>{hoveredPoint.visitors} visiteur(s) unique(s)</span>
            </div>
          ) : (
            <span className="text-slate-400 text-xs italic">
              Survolez une barre pour inspecter le volume précis à cette date
            </span>
          )}
        </div>

        {/* SVG / Bar Timeline Visualizer */}
        {timelineData.length === 0 ? (
          <div className="h-48 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-sm">
            Aucune donnée de visite sur cette période
          </div>
        ) : (
          <div className="space-y-2">
            <div className="h-56 flex items-end gap-1.5 sm:gap-2 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
              {timelineData.map((item, idx) => {
                const val = chartMetric === "views" ? item.views : item.visitors;
                const heightPercent = currentMax > 0 ? Math.max((val / currentMax) * 100, 4) : 4;
                const isHovered = hoveredPoint?.date === item.date;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredPoint(item)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="flex-1 min-w-[14px] sm:min-w-[20px] h-full flex flex-col justify-end items-center group cursor-pointer relative"
                  >
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[24px] rounded-t-md transition-all duration-300 ${
                        isHovered
                          ? "bg-gradient-to-t from-cyan-600 to-teal-400 shadow-md shadow-cyan-500/20"
                          : val > 0
                          ? "bg-cyan-500/70 hover:bg-cyan-500 dark:bg-cyan-600/70 dark:hover:bg-cyan-500"
                          : "bg-slate-200 dark:bg-slate-800"
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Labels d'abscisse (X-axis) */}
            <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1">
              <span>{timelineData[0]?.date}</span>
              {timelineData.length > 2 && (
                <span>{timelineData[Math.floor(timelineData.length / 2)]?.date}</span>
              )}
              <span>{timelineData[timelineData.length - 1]?.date}</span>
            </div>
          </div>
        )}
      </div>

      {/* Grille Principale 2 Colonnes : Top Pages & Top Référents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne 1 : Top Pages consultées */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-600" />
              {isAr ? "الصفحات الأكثر زيارة" : "Top Pages Consultées"}
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              {data.topPages.length} routes
            </span>
          </div>

          <div className="space-y-3">
            {data.topPages.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Aucune page visitée enregistrée
              </p>
            ) : (
              data.topPages.map((page, idx) => (
                <div key={idx} className="space-y-1 group">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="text-[10px] text-slate-400 font-mono w-4">#{idx + 1}</span>
                      <a
                        href={page.path}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition flex items-center gap-1"
                        title={page.path}
                      >
                        <span className="font-mono">{page.path}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition shrink-0" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-slate-900 dark:text-white font-bold">{page.views}</span>
                      <span className="text-[10px] text-slate-400 w-8 text-right font-medium">
                        {page.percentage}%
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${page.percentage}%` }}
                      className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Colonne 2 : Top Référents (Sources de trafic) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              {isAr ? "مصادر الزيارات والإحالات" : "Provenance du Trafic (Référents)"}
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              {data.topReferrers.length} sources
            </span>
          </div>

          <div className="space-y-3">
            {data.topReferrers.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Aucun référent détecté
              </p>
            ) : (
              data.topReferrers.map((ref, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="text-[10px] text-slate-400 font-mono w-4">#{idx + 1}</span>
                      <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                        {ref.host}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-slate-900 dark:text-white font-bold">{ref.views}</span>
                      <span className="text-[10px] text-slate-400 w-8 text-right font-medium">
                        {ref.percentage}%
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${ref.percentage}%` }}
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Grille 2 Colonnes : Pays & Appareils/OS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tableau 3 : Répartition par Pays (Countries) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-500" />
              {isAr ? "الدول والجغرافيا" : "Pays (Countries)"}
            </h3>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              x-vercel-ip-country
            </span>
          </div>

          <div className="space-y-3">
            {data.countries.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">Aucun pays détecté</p>
            ) : (
              data.countries.map((c, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{c.flag}</span>
                      <span className="text-slate-700 dark:text-slate-300">{c.name}</span>
                      <span className="text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 font-mono">
                        {c.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-900 dark:text-white font-bold">{c.views}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{c.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${c.percentage}%` }}
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tableau 4 : Appareils & Systèmes (Devices / OS) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-500" />
              {isAr ? "الأجهزة والأنظمة" : "Appareils & Systèmes (Devices / OS)"}
            </h3>
          </div>

          {/* Types d'appareils */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Type d&apos;appareil
            </span>
            <div className="grid grid-cols-3 gap-2">
              {data.devices.map((dev, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-1"
                >
                  {getDeviceIcon(dev.device)}
                  <span className="capitalize text-xs font-bold text-slate-700 dark:text-slate-300">
                    {dev.device}
                  </span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {dev.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Systèmes d'exploitation (OS) */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Systèmes d&apos;exploitation (OS)
            </span>
            <div className="space-y-1.5">
              {data.osList.map((os, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">{os.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{os.views}</span>
                      <span className="text-[10px] text-slate-400">{os.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${os.percentage}%` }}
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grille 2 Colonnes : Événements Personnalisés & Navigateurs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tableau 5 : Événements Personnalisés (Custom Events) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-purple-600" />
              {isAr ? "الأحداث المخصصة" : "Événements Personnalisés (Custom Events)"}
            </h3>
            <span className="text-[10px] font-mono text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full font-bold">
              trackClientEvent()
            </span>
          </div>

          <div className="space-y-3">
            {data.events.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Aucun événement personnalisé enregistré pour le moment.
              </p>
            ) : (
              data.events.map((ev, idx) => {
                const meta = getEventBadge(ev.eventName);
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {meta.icon}
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {meta.label}
                        </span>
                      </div>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {ev.count}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono">{ev.eventName}</span>
                      <span>Dernier : {ev.lastTriggered}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tableau 6 / Navigateurs & Synthèse de Qualité de Trafic */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-600" />
              {isAr ? "المتصفحات وجودة المرور" : "Navigateurs & Qualité de Trafic"}
            </h3>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Navigateurs les plus utilisés
            </span>
            <div className="space-y-2">
              {data.browsers.map((b, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">{b.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{b.views}</span>
                      <span className="text-[10px] text-slate-400">{b.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${b.percentage}%` }}
                      className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
            <div className="font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Respect de la vie privée & Performance
            </div>
            <p className="text-[11px] leading-relaxed">
              Zéro cookie tiers intrusif, aucune bannière GDPR bloquante. Les visites sont transmises
              via <code className="font-mono bg-cyan-500/10 px-1 py-0.5 rounded text-cyan-700 dark:text-cyan-300">navigator.sendBeacon</code> sans impacter le score Core Web Vitals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
