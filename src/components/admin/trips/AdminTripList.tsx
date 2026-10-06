"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { 
  Plus, Search, Filter, Edit, Copy, Trash2, 
  Eye, CheckCircle2, Clock, Bus, MapPin, 
  Sparkles, AlertCircle, ShieldCheck, ArrowUpDown, 
  Users, UserCheck, Building2, TrendingUp, Flame,
  Layers, FolderTree, Globe
} from "lucide-react";
import { formatMAD } from "@/lib/utils";
import { 
  deleteTripAction, 
  duplicateTripAction, 
  toggleTripPublishAction 
} from "@/actions/trip.actions";
import { SerializedCollection } from "@/actions/collection.actions";
import { ScheduleThisWeekModal } from "./ScheduleThisWeekModal";
import { CollectionsManagerModal } from "./CollectionsManagerModal";

interface AdminTripListProps {
  initialTrips: any[];
  initialCollections?: SerializedCollection[];
}

export function AdminTripList({ initialTrips, initialCollections = [] }: AdminTripListProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [isPending, startTransition] = useTransition();

  const [trips, setTrips] = useState(initialTrips);
  const [collections, setCollections] = useState<SerializedCollection[]>(initialCollections);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT" | "GUARANTEED" | "WEEK_STAR">("ALL");
  const [scopeFilter, setScopeFilter] = useState<"ALL" | "NATIONAL" | "INTERNATIONAL">("ALL");
  const [collectionFilter, setCollectionFilter] = useState<string>("ALL");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedTripForSchedule, setSelectedTripForSchedule] = useState<any | null>(null);
  const [isCollectionsModalOpen, setIsCollectionsModalOpen] = useState(false);

  // Filtering
  const filteredTrips = trips.filter((trip) => {
    const matchesSearch =
      (trip.titleFr || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.titleAr || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.destinationRegion || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.slug || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter === "PUBLISHED" && (!trip.isActive && trip.publishStatus !== "PUBLISHED")) return false;
    if (statusFilter === "DRAFT" && (trip.isActive || trip.publishStatus === "PUBLISHED")) return false;
    if (statusFilter === "GUARANTEED" && !trip.isFeatured) return false;
    if (statusFilter === "WEEK_STAR" && !trip.isScheduledThisWeek) return false;

    // Scope filter (National vs International)
    const tripScope = trip.scope || "NATIONAL";
    if (scopeFilter !== "ALL" && tripScope !== scopeFilter) return false;

    // Collection filter
    if (collectionFilter !== "ALL") {
      if (collectionFilter === "UNASSIGNED") {
        if (trip.collectionId) return false;
      } else {
        if (trip.collectionId !== collectionFilter) return false;
      }
    }

    return true;
  });

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le circuit "${title}" ?`)) return;

    startTransition(async () => {
      const res = await deleteTripAction(id);
      if (res.success) {
        setTrips((prev) => prev.filter((t) => t.id !== id));
        setFeedback("Circuit supprimé avec succès.");
        setTimeout(() => setFeedback(null), 3000);
      }
    });
  };

  const handleDuplicate = (id: string) => {
    startTransition(async () => {
      const res = await duplicateTripAction(id);
      if (res.success) {
        setFeedback("Circuit dupliqué avec succès.");
        const original = trips.find((t) => t.id === id);
        if (original) {
          setTrips([
            {
              ...original,
              id: res.newId,
              titleFr: `${original.titleFr} (Copie)`,
              titleAr: `${original.titleAr} (نسخة)`,
              isActive: false,
            },
            ...trips,
          ]);
        }
        setTimeout(() => setFeedback(null), 3000);
      }
    });
  };

  const handleTogglePublish = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await toggleTripPublishAction(id, !currentStatus);
      if (res.success) {
        setTrips((prev) =>
          prev.map((t) => (t.id === id ? { ...t, isActive: !currentStatus } : t))
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-tp-cyan/10 text-tp-cyan-hover dark:text-tp-cyan text-[11px] font-bold uppercase tracking-wider">
              {isAr ? "كتالوج الرحلات السياحية" : "Catalogue & Gestion des Circuits"}
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-xs font-mono font-bold">
              {trips.length} {isAr ? "رحلة مسجلة" : "circuits au total"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {isAr ? "إدارة وتعديل البرامج السياحية" : "Gestion Globale des Voyages Organisés"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            {isAr
              ? "إنشاء الرحلات، التحكم في التكاليف، تعيين الطاقم وتتبع الركاب والربحية."
              : "Créez et configurez vos départs, supervisez le staff, les partenaires et la rentabilité en temps réel."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollectionsModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-tp-cyan text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-tp-cyan" />
            <span>{isAr ? "إدارة المجموعات" : "Gérer les Collections"}</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500">
              {collections.length}
            </span>
          </button>

          <Link
            href={`/${locale}/admin/trips/new`}
            className="px-5 py-2.5 rounded-2xl bg-tp-cyan hover:bg-tp-cyan-hover text-white dark:text-slate-950 font-black text-xs sm:text-sm shadow-tp-cyan transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? "إضافة رحلة جديدة" : "Créer un Circuit"}</span>
          </Link>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter and Search Bar (Status & Search) */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-950 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
          <input
            type="text"
            placeholder={isAr ? "بحث بالاسم، المنطقة أو المدينة..." : "Rechercher par titre, région ou ville..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-2xl ps-10 pe-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-tp-cyan transition"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: "ALL", label: isAr ? "الكل" : "Tous" },
              { id: "WEEK_STAR", label: isAr ? "🔥 رحلة الأسبوع" : "🔥 Vedette Semaine" },
              { id: "PUBLISHED", label: isAr ? "منشورة" : "En Ligne" },
              { id: "DRAFT", label: isAr ? "مسودات" : "Brouillons" },
              { id: "GUARANTEED", label: isAr ? "مضمونة" : "Garantis" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === item.id
                  ? "bg-tp-cyan text-white dark:text-slate-950 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scope & Collection Fast Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-950 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        {/* Scope fast filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 me-1">
            {isAr ? "النطاق:" : "Périmètre :"}
          </span>

          <button
            onClick={() => setScopeFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              scopeFilter === "ALL"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm"
                : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
            }`}
          >
            <span>{isAr ? "الكل" : "Tous"}</span>
            <span className="text-[10px] opacity-75 font-mono">({trips.length})</span>
          </button>

          <button
            onClick={() => setScopeFilter("NATIONAL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              scopeFilter === "NATIONAL"
                ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30"
            }`}
          >
            <span>🇲🇦</span>
            <span>{isAr ? "رحلات وطنية" : "National"}</span>
            <span className="text-[10px] opacity-75 font-mono">
              ({trips.filter((t) => (t.scope || "NATIONAL") === "NATIONAL").length})
            </span>
          </button>

          <button
            onClick={() => setScopeFilter("INTERNATIONAL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              scopeFilter === "INTERNATIONAL"
                ? "bg-sky-500 text-white shadow-sm shadow-sky-500/20"
                : "bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 border border-sky-500/30"
            }`}
          >
            <span>✈️</span>
            <span>{isAr ? "رحلات دولية" : "International"}</span>
            <span className="text-[10px] opacity-75 font-mono">
              ({trips.filter((t) => t.scope === "INTERNATIONAL").length})
            </span>
          </button>
        </div>

        {/* Collection Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
            {isAr ? "المجموعة:" : "Collection :"}
          </span>
          <select
            value={collectionFilter}
            onChange={(e) => setCollectionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-tp-cyan cursor-pointer"
          >
            <option value="ALL">{isAr ? "جميع المجموعات" : "Toutes les collections"}</option>
            <option value="UNASSIGNED">{isAr ? "بدون مجموعة" : "Sans collection"}</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.scope === "NATIONAL" ? "🇲🇦" : "✈️"} {c.nameFr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Trips Table List */}
      <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start text-slate-700 dark:text-slate-300">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold bg-slate-50 dark:bg-slate-900/50">
                <th className="py-3.5 px-4 text-start">{isAr ? "الرحلة" : "Circuit & Destination"}</th>
                <th className="py-3.5 px-4 text-start">{isAr ? "المدة" : "Durée"}</th>
                <th className="py-3.5 px-4 text-start">{isAr ? "السعر / التسبيق" : "Tarifs"}</th>
                <th className="py-3.5 px-4 text-center">{isAr ? "الوحدات الإدارية" : "Modules Métier"}</th>
                <th className="py-3.5 px-4 text-center">{isAr ? "الحالة" : "Statut"}</th>
                <th className="py-3.5 px-4 text-end">{isAr ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    {isAr ? "لا توجد أي رحلة مطابقة للبحث" : "Aucun circuit trouvé pour cette recherche"}
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => {
                  const isOnline = trip.isActive || trip.publishStatus === "PUBLISHED";
                  return (
                    <tr key={trip.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition group">
                      {/* Trip details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 relative">
                            <img
                              src={trip.coverImageUrl || "/images/merzouga/cover-merzouga.jpg"}
                              alt={trip.titleFr}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 max-w-xs sm:max-w-sm">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Scope Badge (National / International) */}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider border ${
                                  (trip.scope || "NATIONAL") === "NATIONAL"
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                    : "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30"
                                }`}
                              >
                                {(trip.scope || "NATIONAL") === "NATIONAL" ? "🇲🇦 National" : "✈️ International"}
                              </span>

                              {/* Collection Badge */}
                              {trip.collection && (
                                <span 
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[9.5px] font-bold"
                                  title={`Collection: ${trip.collection.nameFr}`}
                                >
                                  <Layers className="w-2.5 h-2.5 text-tp-cyan" />
                                  <span>{trip.collection.nameFr}</span>
                                </span>
                              )}

                              <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm line-clamp-1 group-hover:text-tp-cyan transition">
                                {trip.titleFr}
                              </p>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {trip.titleAr}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-mono">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{trip.destinationRegion}</span>
                              </span>
                              {trip.isScheduledThisWeek && (
                                <button
                                  onClick={() => setSelectedTripForSchedule(trip)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider hover:bg-amber-500/25 transition cursor-pointer"
                                  title={trip.featuredWeekMessage || "Circuit au départ ce week-end"}
                                >
                                  <Flame className="w-3 h-3 text-amber-500 animate-pulse shrink-0" />
                                  <span>{isAr ? "رحلة الأسبوع" : "Vedette Semaine"}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-slate-200 dark:border-slate-800">
                          {trip.durationDays}J / {trip.durationNights}N
                        </span>
                      </td>

                      {/* Prices */}
                      <td className="py-3.5 px-4">
                        <p className="font-black text-tp-cyan-hover dark:text-tp-cyan text-xs sm:text-sm">
                          {formatMAD(Number(trip.basePrice || 0), locale)}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Acompte : {formatMAD(Number(trip.depositPerPerson || 500), locale)}
                        </p>
                      </td>

                      {/* Modular Shortcut Buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/${locale}/admin/trips/${trip.id}/voyageurs`}
                            title="Voyageurs & Manifeste"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-tp-cyan transition"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/${locale}/admin/trips/${trip.id}/equipe`}
                            title="Équipe & Staff"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-purple-500 dark:hover:text-purple-400 transition"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/${locale}/admin/trips/${trip.id}/partenaires`}
                            title="Partenaires & Logistique"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-amber-500 dark:hover:text-amber-400 transition"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/${locale}/admin/trips/${trip.id}/rentabilite`}
                            title="Moteur de Rentabilité"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-emerald-500 dark:hover:text-emerald-400 transition"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => setSelectedTripForSchedule(trip)}
                            title={isAr ? "برمجة كرحلة الأسبوع Vedette" : "Programmer comme Départ Vedette ce week-end"}
                            className={`p-1.5 rounded-lg border transition ${
                              trip.isScheduledThisWeek
                                ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/30"
                                : "bg-slate-100 dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-amber-600 hover:border-amber-300"
                            }`}
                          >
                            <Flame className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Status switch */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleTogglePublish(trip.id, isOnline)}
                          className={`px-3 py-1 rounded-full text-[10.5px] font-black transition-all ${
                            isOnline
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          {isOnline ? (isAr ? "منشور" : "En Ligne") : (isAr ? "مسودة" : "Brouillon")}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/${locale}/trips/${trip.slug}`}
                            target="_blank"
                            title="Voir la page publique"
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            href={`/${locale}/admin/trips/${trip.id}/edit`}
                            title="Modifier le circuit"
                            className="p-2 rounded-xl bg-tp-cyan/10 hover:bg-tp-cyan/20 text-tp-cyan-hover dark:text-tp-cyan transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleDuplicate(trip.id)}
                            title="Dupliquer le circuit"
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(trip.id, trip.titleFr)}
                            title="Supprimer"
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Programmation du Départ Vedette */}
      {selectedTripForSchedule && (
        <ScheduleThisWeekModal
          trip={selectedTripForSchedule}
          isOpen={Boolean(selectedTripForSchedule)}
          onClose={() => setSelectedTripForSchedule(null)}
          onSuccess={(updated) => {
            setTrips((prev) =>
              prev.map((t) => {
                if (t.id === updated.id) {
                  return {
                    ...t,
                    isScheduledThisWeek: updated.isScheduledThisWeek,
                    featuredWeekMessage: updated.featuredWeekMessage,
                  };
                }
                return t;
              })
            );
            setFeedback(
              updated.isScheduledThisWeek
                ? "Circuit programmé avec succès comme Départ Vedette de la Semaine !"
                : "Circuit retiré des départs vedettes de la semaine."
            );
            setTimeout(() => setFeedback(null), 3500);
          }}
        />
      )}

      {/* Modal de Gestion des Collections & Catégories */}
      <CollectionsManagerModal
        isOpen={isCollectionsModalOpen}
        onClose={() => setIsCollectionsModalOpen(false)}
        collections={collections}
        onCollectionsChange={(updated) => setCollections(updated)}
      />
    </div>
  );
}


