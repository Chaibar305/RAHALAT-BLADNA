"use client";

import React, { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import {
  Tag,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Percent,
  DollarSign,
  Compass,
  Copy,
  Check,
  Edit2,
  Trash2,
  Sparkles,
  AlertTriangle,
  Flame,
  Calendar,
  X,
  RefreshCw,
  Power,
} from "lucide-react";
import {
  savePromoCode,
  togglePromoStatus,
  deletePromoCode,
} from "@/actions/promo.actions";

interface PromoCodeItem {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minBookingAmount: number | null;
  maxDiscountLimit: number | null;
  maxUses: number | null;
  usedCount: number;
  startDate: string | null;
  expiresAt: string | null;
  isActive: boolean;
  targetTripId: string | null;
  targetTrip: {
    id: string;
    titleFr: string;
    titleAr: string;
    slug: string;
  } | null;
  _count?: {
    bookings: number;
  };
  createdAt: string;
}

interface TripOption {
  id: string;
  titleFr: string;
  titleAr: string;
  slug: string;
}

interface PromoCodesManagerProps {
  initialPromos: PromoCodeItem[];
  trips: TripOption[];
}

export function PromoCodesManager({
  initialPromos,
  trips,
}: PromoCodesManagerProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const [promos, setPromos] = useState<PromoCodeItem[]>(initialPromos);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "EXPIRED">("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCodeItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [formDiscountValue, setFormDiscountValue] = useState("");
  const [formMinBookingAmount, setFormMinBookingAmount] = useState("");
  const [formMaxDiscountLimit, setFormMaxDiscountLimit] = useState("");
  const [formMaxUses, setFormMaxUses] = useState("");
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [formTargetTripId, setFormTargetTripId] = useState("ALL");
  const [formIsActive, setFormIsActive] = useState(true);

  // Copied indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenCreateModal = () => {
    setEditingPromo(null);
    setFormCode("");
    setFormDescription("");
    setFormDiscountType("PERCENTAGE");
    setFormDiscountValue("");
    setFormMinBookingAmount("");
    setFormMaxDiscountLimit("");
    setFormMaxUses("");
    setFormExpiresAt("");
    setFormTargetTripId("ALL");
    setFormIsActive(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (promo: PromoCodeItem) => {
    setEditingPromo(promo);
    setFormCode(promo.code);
    setFormDescription(promo.description || "");
    setFormDiscountType(promo.discountType);
    setFormDiscountValue(String(promo.discountValue));
    setFormMinBookingAmount(promo.minBookingAmount ? String(promo.minBookingAmount) : "");
    setFormMaxDiscountLimit(promo.maxDiscountLimit ? String(promo.maxDiscountLimit) : "");
    setFormMaxUses(promo.maxUses ? String(promo.maxUses) : "");
    setFormExpiresAt(promo.expiresAt ? promo.expiresAt.substring(0, 10) : "");
    setFormTargetTripId(promo.targetTripId || "ALL");
    setFormIsActive(promo.isActive);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const generateRandomCode = () => {
    const prefixes = ["ATLAS", "SAHARA", "VOYAGE", "ETE", "REMISE", "SPECIAL"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(10 + Math.random() * 90);
    setFormCode(`${prefix}${num}`);
  };

  const handleToggleStatus = (promo: PromoCodeItem) => {
    const nextStatus = !promo.isActive;
    // Mise à jour optimiste
    setPromos((prev) =>
      prev.map((p) => (p.id === promo.id ? { ...p, isActive: nextStatus } : p))
    );

    startTransition(async () => {
      const res = await togglePromoStatus(promo.id, nextStatus);
      if (!res.success) {
        // Rollback
        setPromos((prev) =>
          prev.map((p) => (p.id === promo.id ? { ...p, isActive: !nextStatus } : p))
        );
      }
    });
  };

  const handleDelete = (id: string, code: string) => {
    if (!confirm(isAr ? `هل أنت متأكد من حذف الرمز "${code}"؟` : `Voulez-vous vraiment supprimer le code "${code}" ?`)) {
      return;
    }

    setPromos((prev) => prev.filter((p) => p.id !== id));
    startTransition(async () => {
      await deletePromoCode(id);
    });
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const val = parseFloat(formDiscountValue);
    if (isNaN(val) || val <= 0) {
      setErrorMsg(isAr ? "يرجى إدخال قيمة تخفيض صالحة" : "Veuillez saisir une valeur de réduction valide.");
      return;
    }

    startTransition(async () => {
      const payload = {
        id: editingPromo ? editingPromo.id : undefined,
        code: formCode,
        description: formDescription,
        discountType: formDiscountType,
        discountValue: val,
        minBookingAmount: formMinBookingAmount ? parseFloat(formMinBookingAmount) : null,
        maxDiscountLimit: formMaxDiscountLimit ? parseFloat(formMaxDiscountLimit) : null,
        maxUses: formMaxUses ? parseInt(formMaxUses, 10) : null,
        expiresAt: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
        isActive: formIsActive,
        targetTripId: formTargetTripId === "ALL" ? null : formTargetTripId,
      };

      const res = await savePromoCode(payload);
      if (!res.success) {
        setErrorMsg(res.error || "Erreur enregistrement.");
      } else {
        setIsModalOpen(false);
        // Mise à jour locale
        if (editingPromo) {
          setPromos((prev) =>
            prev.map((p) =>
              p.id === editingPromo.id
                ? {
                    ...p,
                    code: formCode.toUpperCase(),
                    description: formDescription || null,
                    discountType: formDiscountType,
                    discountValue: val,
                    minBookingAmount: formMinBookingAmount ? parseFloat(formMinBookingAmount) : null,
                    maxDiscountLimit: formMaxDiscountLimit ? parseFloat(formMaxDiscountLimit) : null,
                    maxUses: formMaxUses ? parseInt(formMaxUses, 10) : null,
                    expiresAt: formExpiresAt ? formExpiresAt : null,
                    isActive: formIsActive,
                    targetTripId: formTargetTripId === "ALL" ? null : formTargetTripId,
                    targetTrip:
                      formTargetTripId === "ALL"
                        ? null
                        : trips.find((t) => t.id === formTargetTripId) || null,
                  }
                : p
            )
          );
        } else {
          // Création locale instantanée
          const newItem: PromoCodeItem = {
            id: `temp_${Date.now()}`,
            code: formCode.toUpperCase(),
            description: formDescription || null,
            discountType: formDiscountType,
            discountValue: val,
            minBookingAmount: formMinBookingAmount ? parseFloat(formMinBookingAmount) : null,
            maxDiscountLimit: formMaxDiscountLimit ? parseFloat(formMaxDiscountLimit) : null,
            maxUses: formMaxUses ? parseInt(formMaxUses, 10) : null,
            usedCount: 0,
            startDate: new Date().toISOString(),
            expiresAt: formExpiresAt ? formExpiresAt : null,
            isActive: formIsActive,
            targetTripId: formTargetTripId === "ALL" ? null : formTargetTripId,
            targetTrip:
              formTargetTripId === "ALL"
                ? null
                : trips.find((t) => t.id === formTargetTripId) || null,
            createdAt: new Date().toISOString(),
          };
          setPromos((prev) => [newItem, ...prev]);
        }
      }
    });
  };

  // Filtrage
  const now = new Date();
  const filteredPromos = promos.filter((p) => {
    const isExpired = p.expiresAt && now > new Date(p.expiresAt);
    if (statusFilter === "ACTIVE" && (!p.isActive || isExpired)) return false;
    if (statusFilter === "INACTIVE" && p.isActive) return false;
    if (statusFilter === "EXPIRED" && !isExpired) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const codeMatch = p.code.toLowerCase().includes(q);
      const descMatch = (p.description || "").toLowerCase().includes(q);
      const tripMatch = (p.targetTrip?.titleFr || "").toLowerCase().includes(q);
      return codeMatch || descMatch || tripMatch;
    }
    return true;
  });

  const activeCount = promos.filter((p) => p.isActive && (!p.expiresAt || now <= new Date(p.expiresAt))).length;
  const totalUses = promos.reduce((acc, p) => acc + (p.usedCount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* 1. HEADER & KPI QUICK CARDS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAr ? "إدارة رموز التخفيض والكوبونات" : "Codes Promo & Coupons de Réduction"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isAr
                ? "إنشاء عروض ترويجية، تحديد شروط السعر والرحلات المستهدفة، ومراقبة الاستخدام الفعلي"
                : "Créez des remises, activez/désactivez les coupons et suivez les réservations converties"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs sm:text-sm font-black shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? "رمز ترويجي جديد" : "Nouveau Code Promo"}</span>
          </button>
        </div>
      </div>

      {/* 2. STATS COMPACTES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              {isAr ? "الرموز النشطة" : "Codes Actifs"}
            </p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {activeCount} <span className="text-xs text-slate-400 font-medium">/ {promos.length}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              {isAr ? "مجموع الاستخدامات" : "Utilisations Réelles"}
            </p>
            <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
              {totalUses} <span className="text-xs text-slate-400 font-medium">réservations</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              {isAr ? "التحكم اللحظي" : "Contrôle en Temps Réel"}
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Désactivation instantanée 1-clic</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <Power className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. FILTRES & RECHERCHE */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={isAr ? "بحث عن طريق الرمز أو الوصف..." : "Rechercher par code (ex: ATLAS15), note..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
          {(
            [
              { key: "ALL", labelFr: "Tous", labelAr: "الكل" },
              { key: "ACTIVE", labelFr: "Actifs", labelAr: "النشطة" },
              { key: "INACTIVE", labelFr: "Inactifs", labelAr: "غير النشطة" },
              { key: "EXPIRED", labelFr: "Expirés", labelAr: "المنتهية" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === tab.key
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {isAr ? tab.labelAr : tab.labelFr}
            </button>
          ))}
        </div>
      </div>

      {/* 4. TABLEAU DE GESTION DES CODES */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 text-[11px]">
              <tr>
                <th className="py-4 px-5">{isAr ? "الرمز والوصف" : "Code & Note"}</th>
                <th className="py-4 px-4">{isAr ? "قيمة الخصم" : "Valeur de Réduction"}</th>
                <th className="py-4 px-4">{isAr ? "شروط الاستحقاق" : "Conditions"}</th>
                <th className="py-4 px-4">{isAr ? "الاستخدام" : "Utilisations"}</th>
                <th className="py-4 px-4 text-center">{isAr ? "الحالة" : "Statut"}</th>
                <th className="py-4 px-5 text-right">{isAr ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {filteredPromos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                    {isAr ? "لا يوجد أي رمز ترويجي مطابق." : "Aucun code promo trouvé."}
                  </td>
                </tr>
              ) : (
                filteredPromos.map((promo) => {
                  const isExpired = promo.expiresAt && now > new Date(promo.expiresAt);
                  const isLimitReached = promo.maxUses !== null && promo.usedCount >= promo.maxUses;
                  const usagePercent = promo.maxUses ? Math.min(100, Math.round((promo.usedCount / promo.maxUses) * 100)) : null;

                  return (
                    <tr
                      key={promo.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* Colonne 1 : Code & Note */}
                      <td className="py-4 px-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 tracking-wider">
                              {promo.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(promo.code, promo.id)}
                              title="Copier le code"
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                            >
                              {copiedId === promo.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          {promo.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {promo.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Colonne 2 : Valeur de réduction */}
                      <td className="py-4 px-4">
                        {promo.discountType === "PERCENTAGE" ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-black font-mono text-xs">
                              <Percent className="w-3 h-3" />
                              -{promo.discountValue}%
                            </span>
                            {promo.maxDiscountLimit && (
                              <p className="text-[10px] text-slate-400 font-medium">
                                Plafond: {promo.maxDiscountLimit} MAD
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-400 font-black font-mono text-xs">
                            -{promo.discountValue} MAD
                          </span>
                        )}
                      </td>

                      {/* Colonne 3 : Conditions */}
                      <td className="py-4 px-4">
                        <div className="space-y-1 text-[11px]">
                          {/* Panier minimum */}
                          <div>
                            {promo.minBookingAmount ? (
                              <span className="text-slate-600 dark:text-slate-300">
                                Dès <span className="font-bold">{promo.minBookingAmount} MAD</span>
                              </span>
                            ) : (
                              <span className="text-slate-400">Aucun minimum</span>
                            )}
                          </div>

                          {/* Circuit ciblé */}
                          <div>
                            {promo.targetTrip ? (
                              <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium line-clamp-1">
                                <Compass className="w-3 h-3 text-cyan-500 shrink-0" />
                                {promo.targetTrip.titleFr}
                              </span>
                            ) : (
                              <span className="text-slate-400">Tous les circuits</span>
                            )}
                          </div>

                          {/* Expiration */}
                          {promo.expiresAt && (
                            <div className="flex items-center gap-1 text-[10px]">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span className={isExpired ? "text-red-500 font-bold" : "text-slate-400"}>
                                {isExpired ? "Expiré" : `Fin: ${new Date(promo.expiresAt).toLocaleDateString("fr-MA")}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Colonne 4 : Utilisations */}
                      <td className="py-4 px-4">
                        <div className="space-y-1.5 w-32">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {promo.usedCount}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              / {promo.maxUses ? promo.maxUses : "∞"}
                            </span>
                          </div>
                          {usagePercent !== null && (
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${usagePercent}%` }}
                                className={`h-full rounded-full ${
                                  usagePercent >= 100
                                    ? "bg-red-500"
                                    : usagePercent > 75
                                    ? "bg-amber-500"
                                    : "bg-cyan-500"
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Colonne 5 : Switch On / Off */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(promo)}
                          disabled={isPending}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            promo.isActive && !isExpired && !isLimitReached
                              ? "bg-emerald-500"
                              : "bg-slate-300 dark:bg-slate-700"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              promo.isActive && !isExpired && !isLimitReached
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </td>

                      {/* Colonne 6 : Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(promo)}
                            title="Modifier"
                            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(promo.id, promo.code)}
                            title="Supprimer"
                            className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* 5. MODAL DE CRÉATION / MODIFICATION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {editingPromo
                    ? isAr
                      ? `تعديل الرمز ${editingPromo.code}`
                      : `Modifier le Code Promo ${editingPromo.code}`
                    : isAr
                    ? "إنشاء رمز ترويجي جديد"
                    : "Créer un Nouveau Code Promo"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Code et Générateur */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? "الرمز الترويجي (أحرف لاتينية كبيرة) *" : "Code Promo (Majuscules) *"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Ex: ATLAS15, ETE2026"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3.5 py-2.5 rounded-xl font-mono uppercase font-black text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Générer</span>
                  </button>
                </div>
              </div>

              {/* Note / Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? "ملاحظة أو وصف داخلي" : "Note / Description interne"}
                </label>
                <input
                  type="text"
                  placeholder="Ex: Campagne influenceur Instagram @voyageur_maroc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Type de réduction & Valeur */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? "نوع الخصم *" : "Type de réduction *"}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setFormDiscountType("PERCENTAGE")}
                      className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
                        formDiscountType === "PERCENTAGE"
                          ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                          : "text-slate-500"
                      }`}
                    >
                      <Percent className="w-3.5 h-3.5" />
                      <span>Pourcent %</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormDiscountType("FIXED_AMOUNT")}
                      className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
                        formDiscountType === "FIXED_AMOUNT"
                          ? "bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-xs"
                          : "text-slate-500"
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Fixe MAD</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? "القيمة المحسومة *" : "Valeur de la remise *"}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder={formDiscountType === "PERCENTAGE" ? "15 (pour 15%)" : "150 (MAD)"}
                      value={formDiscountValue}
                      onChange={(e) => setFormDiscountValue(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {formDiscountType === "PERCENTAGE" ? "%" : "MAD"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Conditions financières (Panier min & Plafond max) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? "الحد الأدنى للطلب (MAD)" : "Panier minimum requis (MAD)"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Optionnel (ex: 1200)"
                    value={formMinBookingAmount}
                    onChange={(e) => setFormMinBookingAmount(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? "السقف الأقصى للتخفيض (MAD)" : "Plafond max remise (si %)"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Optionnel (ex: 300)"
                    disabled={formDiscountType !== "PERCENTAGE"}
                    value={formMaxDiscountLimit}
                    onChange={(e) => setFormMaxDiscountLimit(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Limite d'utilisations & Date d'expiration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? "الحد الأقصى لمرات الاستخدام" : "Limite totale d'utilisations"}
                  </label>
                  <input
                    type="number"
                    placeholder="Illimité si vide (ex: 50)"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? "تاريخ انتهاء الصلاحية" : "Date d'expiration"}
                  </label>
                  <input
                    type="date"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Ciblage d'un circuit spécifique */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? "تطبيق الخصم على" : "Ciblage du circuit"}
                </label>
                <select
                  value={formTargetTripId}
                  onChange={(e) => setFormTargetTripId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="ALL">🌍 Tous les circuits (Global)</option>
                  {trips.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      📍 {trip.titleFr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Switch On / Off */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {isAr ? "تفعيل الكود فور الحفظ" : "Activer immédiatement le code"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isAr ? "يمكن للمسافرين استخدامه على الفور" : "Les clients pourront l'appliquer lors de la réservation"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    formIsActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formIsActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Boutons d'action */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {isAr ? "إلغاء" : "Annuler"}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs font-black shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isAr ? "حفظ الرمز" : "Enregistrer le Code"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
