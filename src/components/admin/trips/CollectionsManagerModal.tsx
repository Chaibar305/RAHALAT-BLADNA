"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useLocale } from "next-intl";
import {
  X, Plus, Sparkles, Edit2, Trash2, CheckCircle2, 
  AlertCircle, Loader2, Globe, MapPin, Image as ImageIcon,
  ArrowUpDown, Layers, Check, ExternalLink, RefreshCw
} from "lucide-react";
import { 
  SerializedCollection, 
  createCollectionAction, 
  updateCollectionAction, 
  deleteCollectionAction, 
  toggleCollectionActiveAction,
  seedInitialCollectionsAction 
} from "@/actions/collection.actions";
import { TripCollectionFormData } from "@/lib/validations/trip.schema";
import { R2ImageUploader } from "@/components/admin/R2ImageUploader";

interface CollectionsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: SerializedCollection[];
  onCollectionsChange: (collections: SerializedCollection[]) => void;
}

export function CollectionsManagerModal({
  isOpen,
  onClose,
  collections,
  onCollectionsChange,
}: CollectionsManagerModalProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [isPending, startTransition] = useTransition();

  // Active view: "list" | "create" | "edit"
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [scopeFilter, setScopeFilter] = useState<"ALL" | "NATIONAL" | "INTERNATIONAL">("ALL");
  const [editingCollection, setEditingCollection] = useState<SerializedCollection | null>(null);

  // Form State
  const [formData, setFormData] = useState<TripCollectionFormData>({
    slug: "",
    scope: "NATIONAL",
    nameFr: "",
    nameAr: "",
    nameEn: "",
    descriptionFr: "",
    descriptionAr: "",
    descriptionEn: "",
    coverImage: "",
    displayOrder: 0,
    isActive: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, any>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (editingCollection && view === "edit") {
      setFormData({
        id: editingCollection.id,
        slug: editingCollection.slug,
        scope: editingCollection.scope,
        nameFr: editingCollection.nameFr,
        nameAr: editingCollection.nameAr || "",
        nameEn: editingCollection.nameEn || "",
        descriptionFr: editingCollection.descriptionFr || "",
        descriptionAr: editingCollection.descriptionAr || "",
        descriptionEn: editingCollection.descriptionEn || "",
        coverImage: editingCollection.coverImage || "",
        displayOrder: editingCollection.displayOrder || 0,
        isActive: editingCollection.isActive,
      });
    }
  }, [editingCollection, view]);

  if (!isOpen) return null;

  // Auto-slug generator from nameFr
  const handleNameFrChange = (value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, nameFr: value };
      if (view === "create" && (!prev.slug || prev.slug === generateSlug(prev.nameFr))) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleStartCreate = () => {
    setEditingCollection(null);
    setFormData({
      slug: "",
      scope: "NATIONAL",
      nameFr: "",
      nameAr: "",
      nameEn: "",
      descriptionFr: "",
      descriptionAr: "",
      descriptionEn: "",
      coverImage: "",
      displayOrder: collections.length + 1,
      isActive: true,
    });
    setFormErrors({});
    setView("create");
  };

  const handleStartEdit = (col: SerializedCollection) => {
    setEditingCollection(col);
    setFormErrors({});
    setView("edit");
  };

  const handleSave = () => {
    setFormErrors({});
    setFeedback(null);

    startTransition(async () => {
      if (view === "create") {
        const res = await createCollectionAction(formData);
        if (res.success && res.collection) {
          onCollectionsChange([res.collection, ...collections]);
          setFeedback({ type: "success", message: "Collection créée avec succès !" });
          setView("list");
        } else {
          if (res.errors) {
            setFormErrors(res.errors);
          } else {
            setFeedback({ type: "error", message: res.error || "Une erreur est survenue." });
          }
        }
      } else if (view === "edit" && editingCollection) {
        const res = await updateCollectionAction(editingCollection.id, formData);
        if (res.success && res.collection) {
          onCollectionsChange(
            collections.map((c) => (c.id === editingCollection.id ? res.collection : c))
          );
          setFeedback({ type: "success", message: "Collection mise à jour avec succès !" });
          setView("list");
        } else {
          if (res.errors) {
            setFormErrors(res.errors);
          } else {
            setFeedback({ type: "error", message: res.error || "Une erreur est survenue." });
          }
        }
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Supprimer définitivement la collection "${name}" ? Les circuits associés ne seront pas supprimés mais dissociés.`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteCollectionAction(id);
      if (res.success) {
        onCollectionsChange(collections.filter((c) => c.id !== id));
        setFeedback({ type: "success", message: "Collection supprimée." });
      } else {
        setFeedback({ type: "error", message: res.error || "Impossible de supprimer la collection." });
      }
    });
  };

  const handleToggleActive = (id: string, currentActive: boolean) => {
    startTransition(async () => {
      const res = await toggleCollectionActiveAction(id, !currentActive);
      if (res.success) {
        onCollectionsChange(
          collections.map((c) => (c.id === id ? { ...c, isActive: !currentActive } : c))
        );
      }
    });
  };

  const handleSeedDefaults = () => {
    if (!confirm("Voulez-vous charger les collections recommandées (Sahara, Montagnes, Week-ends, Turquie/Omra, Europe) ?")) {
      return;
    }

    startTransition(async () => {
      const res = await seedInitialCollectionsAction();
      if (res.success) {
        window.location.reload();
      } else {
        setFeedback({ type: "error", message: res.message || res.error || "Erreur de chargement" });
      }
    });
  };

  const filteredCollections = collections.filter((c) => {
    if (scopeFilter === "ALL") return true;
    return c.scope === scopeFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-tp-cyan/15 flex items-center justify-center text-tp-cyan-hover dark:text-tp-cyan shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  {isAr ? "إدارة مجموعات وتصنيفات الرحلات" : "Collections & Catégories de Circuits"}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500">
                  {collections.length} {isAr ? "مجموعة" : "collections"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? "تنظيم البرامج حسب الثيمات أو الوجهات الجغرافية الوطنية والدولية."
                  : "Organisez vos circuits par thématiques ou destinations Nationales 🇲🇦 et Internationales ✈️"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 border ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {view === "list" ? (
            <>
              {/* Actions & Filters Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Scope Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs font-bold w-fit">
                  <button
                    onClick={() => setScopeFilter("ALL")}
                    className={`px-3 py-1.5 rounded-xl transition ${
                      scopeFilter === "ALL"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {isAr ? "الكل" : "Toutes"} ({collections.length})
                  </button>
                  <button
                    onClick={() => setScopeFilter("NATIONAL")}
                    className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                      scopeFilter === "NATIONAL"
                        ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span>🇲🇦</span>
                    <span>{isAr ? "وطني (المغرب)" : "National"}</span>
                    <span className="text-[10px] opacity-75">
                      ({collections.filter((c) => c.scope === "NATIONAL").length})
                    </span>
                  </button>
                  <button
                    onClick={() => setScopeFilter("INTERNATIONAL")}
                    className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                      scopeFilter === "INTERNATIONAL"
                        ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span>✈️</span>
                    <span>{isAr ? "دولي (الخارج)" : "International"}</span>
                    <span className="text-[10px] opacity-75">
                      ({collections.filter((c) => c.scope === "INTERNATIONAL").length})
                    </span>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {collections.length === 0 && (
                    <button
                      onClick={handleSeedDefaults}
                      disabled={isPending}
                      className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isAr ? "تحميل أمثلة مقترحة" : "Modèles par défaut"}</span>
                    </button>
                  )}

                  <button
                    onClick={handleStartCreate}
                    className="px-4 py-2 rounded-2xl bg-tp-cyan hover:bg-tp-cyan-hover text-white dark:text-slate-950 text-xs font-black flex items-center gap-2 shadow-sm transition active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAr ? "إضافة مجموعة جديدة" : "Nouvelle Collection"}</span>
                  </button>
                </div>
              </div>

              {/* Collections Cards Grid / List */}
              {filteredCollections.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center p-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">
                    {isAr ? "لا توجد أي مجموعة في هذا القسم" : "Aucune collection dans cette vue"}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
                    {isAr
                      ? "ابدأ بإنشاء أول مجموعة مثل 'الصحراء والمبيت' أو اضغط على 'تحميل أمثلة مقترحة'."
                      : "Créez votre première collection thématique pour regrouper vos circuits."}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleStartCreate}
                      className="px-4 py-2 rounded-xl bg-tp-cyan text-white dark:text-slate-950 text-xs font-bold"
                    >
                      {isAr ? "إنشاء مجموعة" : "Créer une collection"}
                    </button>
                    {collections.length === 0 && (
                      <button
                        onClick={handleSeedDefaults}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                      >
                        {isAr ? "تحميل النماذج" : "Charger les modèles"}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCollections.map((col) => {
                    const isNat = col.scope === "NATIONAL";
                    const tripsCount = col._count?.trips ?? col.trips?.length ?? 0;

                    return (
                      <div
                        key={col.id}
                        className={`group relative p-4 rounded-3xl border transition-all ${
                          col.isActive
                            ? "bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-tp-cyan/50"
                            : "bg-slate-100/50 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/60 opacity-60"
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          {/* Cover Image Thumbnail */}
                          <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 overflow-hidden relative shrink-0 border border-slate-200 dark:border-slate-700">
                            {col.coverImage ? (
                              <img
                                src={col.coverImage}
                                alt={col.nameFr}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <ImageIcon className="w-6 h-6" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Scope Badge */}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                  isNat
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                    : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30"
                                }`}
                              >
                                {isNat ? "🇲🇦 National" : "✈️ International"}
                              </span>

                              {/* Order Badge */}
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                                #{col.displayOrder}
                              </span>

                              {/* Trips Count */}
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                {tripsCount} {tripsCount > 1 ? "circuits" : "circuit"}
                              </span>
                            </div>

                            <h3 className="font-black text-sm text-slate-900 dark:text-white mt-1 group-hover:text-tp-cyan transition line-clamp-1">
                              {col.nameFr}
                            </h3>
                            {col.nameAr && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-arabic" dir="rtl">
                                {col.nameAr}
                              </p>
                            )}

                            {col.descriptionFr && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                                {col.descriptionFr}
                              </p>
                            )}

                            <div className="mt-2 text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <span>slug:</span>
                              <span className="text-slate-600 dark:text-slate-300 font-semibold">{col.slug}</span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Actions Toolbar */}
                        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleToggleActive(col.id, col.isActive)}
                            className={`text-[10.5px] font-bold px-2.5 py-1 rounded-xl transition ${
                              col.isActive
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                                : "bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                          >
                            {col.isActive ? (isAr ? "مفعّلة" : "Active") : (isAr ? "معطّلة" : "Désactivée")}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStartEdit(col)}
                              title={isAr ? "تعديل" : "Modifier"}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(col.id, col.nameFr)}
                              title={isAr ? "حذف" : "Supprimer"}
                              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* CREATE OR EDIT FORM */
            <div className="space-y-6">
              {/* Back to list button */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setView("list")}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5"
                >
                  <span>←</span>
                  <span>{isAr ? "العودة إلى قائمة المجموعات" : "Retour à la liste"}</span>
                </button>
                <span className="text-xs font-black uppercase text-tp-cyan tracking-wider">
                  {view === "create"
                    ? isAr
                      ? "إضافة مجموعة جديدة"
                      : "Créer une nouvelle collection"
                    : isAr
                    ? "تعديل المجموعة"
                    : "Modifier la collection"}
                </span>
              </div>

              {/* 1. Scope Selector Cards */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? "1. النطاق الجغرافي للرحلات" : "1. Périmètre Géographique (Scope)"} *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setFormData({ ...formData, scope: "NATIONAL" })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.scope === "NATIONAL"
                        ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🇲🇦</span>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">
                          {isAr ? "رحلات وطنية (المغرب)" : "National (Maroc)"}
                        </h4>
                      </div>
                      {formData.scope === "NATIONAL" && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {isAr
                        ? "الصحراء، جبال الأطلس، المدن العتيقة والشواطئ المغربية."
                        : "Circuits internes au Maroc (Sahara, Atlas, Villes impériales, Côte)."}
                    </p>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, scope: "INTERNATIONAL" })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.scope === "INTERNATIONAL"
                        ? "border-sky-500 bg-sky-500/10 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">✈️</span>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">
                          {isAr ? "رحلات دولية (الخارج)" : "International (Étranger)"}
                        </h4>
                      </div>
                      {formData.scope === "INTERNATIONAL" && (
                        <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {isAr
                        ? "العمرة وزيارات تركيا، إسبانيا، إيطاليا والوجهات العالمية."
                        : "Séjours et circuits hors Maroc (Turquie, Omra, Europe & Méditerranée)."}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Trilingual Titles */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? "2. التسميات باللغات الثلاث" : "2. Titres Trilingues"} *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1 block">
                      🇫🇷 Nom (Français) *
                    </label>
                    <input
                      type="text"
                      value={formData.nameFr}
                      onChange={(e) => handleNameFrChange(e.target.value)}
                      placeholder="Ex: Sahara & Bivouac"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold outline-none focus:border-tp-cyan"
                    />
                    {formErrors.nameFr && (
                      <p className="text-[10px] text-rose-500 mt-1">{formErrors.nameFr._errors?.join(", ")}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1 block">
                      🇲🇦 Nom (العربية)
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      value={formData.nameAr || ""}
                      onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                      placeholder="مثال: الصحراء والمبيت في المخيمات"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold outline-none focus:border-tp-cyan text-right"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1 block">
                      🇬🇧 Nom (English)
                    </label>
                    <input
                      type="text"
                      value={formData.nameEn || ""}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      placeholder="Ex: Sahara & Desert Bivouac"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold outline-none focus:border-tp-cyan"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Slug */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  3. Slug URL Unique *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">/collections/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                    placeholder="sahara-bivouac"
                    className="flex-1 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold outline-none focus:border-tp-cyan"
                  />
                </div>
                {formErrors.slug && (
                  <p className="text-[10px] text-rose-500 mt-1">{formErrors.slug._errors?.join(", ")}</p>
                )}
              </div>

              {/* 4. Cover Image Upload (Cloudflare R2) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? "4. صورة الغلاف (Cloudflare R2)" : "4. Image de Couverture (Cloudflare R2)"}
                </label>
                <R2ImageUploader
                  value={formData.coverImage || ""}
                  onChange={(url) => setFormData({ ...formData, coverImage: url })}
                  folder="trips"
                  label="Téléverser l'image de couverture de la collection"
                  aspectRatio="video"
                />
              </div>

              {/* 5. Trilingual Descriptions / SEO */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? "5. الوصف ومحتوى السيو (SEO)" : "5. Descriptions & Optimisation SEO"}
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1 block">
                      Description (Français)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.descriptionFr || ""}
                      onChange={(e) => setFormData({ ...formData, descriptionFr: e.target.value })}
                      placeholder="Texte descriptif affiché en en-tête de collection..."
                      className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs outline-none focus:border-tp-cyan"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1 block">
                      الوصف (العربية)
                    </label>
                    <textarea
                      rows={2}
                      dir="rtl"
                      value={formData.descriptionAr || ""}
                      onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                      placeholder="وصف تسويقي وسياحي للرحلات التابعة لهذه المجموعة..."
                      className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs outline-none focus:border-tp-cyan text-right"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1 block">
                      Description (English)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.descriptionEn || ""}
                      onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                      placeholder="English description for international visitors..."
                      className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs outline-none focus:border-tp-cyan"
                    />
                  </div>
                </div>
              </div>

              {/* 6. Settings: Display order & IsActive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    {isAr ? "ترتيب الظهور" : "Ordre d'affichage"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold outline-none focus:border-tp-cyan"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      {isAr ? "تفعيل المجموعة" : "Collection Active"}
                    </h5>
                    <p className="text-[10px] text-slate-500">
                      {isAr ? "تظهر للزوار في الكتالوج العام" : "Visible sur le site et le catalogue"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                      formData.isActive ? "bg-tp-cyan justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition" />
                  </button>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                >
                  {isAr ? "إلغاء" : "Annuler"}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-2xl bg-tp-cyan hover:bg-tp-cyan-hover text-white dark:text-slate-950 text-xs font-black shadow-tp-cyan transition active:scale-95 flex items-center gap-2"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isAr ? "حفظ المجموعة" : "Enregistrer la collection"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
