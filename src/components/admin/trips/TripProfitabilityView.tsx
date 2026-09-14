"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { 
  TrendingUp, DollarSign, Users, AlertTriangle, 
  CheckCircle2, Plus, Trash2, Save, Sparkles, 
  Layers, Calculator, Percent, ArrowUpRight 
} from "lucide-react";
import { TripProfitabilityResult, updateTripCostsAction } from "@/actions/profitability.actions";
import { formatMAD } from "@/lib/utils";

interface TripProfitabilityViewProps {
  tripId: string;
  tripTitle: string;
  initialData: TripProfitabilityResult;
}

export function TripProfitabilityView({
  tripId,
  tripTitle,
  initialData,
}: TripProfitabilityViewProps) {
  const router = useRouter();
  const locale = useLocale();
  const isAr = locale === "ar";
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState<TripProfitabilityResult>(initialData);
  const [fixedCosts, setFixedCosts] = useState(initialData.fixedCostsBreakdown);
  const [variableCosts, setVariableCosts] = useState(initialData.variableCostsBreakdown);
  const [feedback, setFeedback] = useState<string | null>(null);

  // New cost item states
  const [newFixedLabel, setNewFixedLabel] = useState("");
  const [newFixedAmount, setNewFixedAmount] = useState<number>(500);
  const [newVarLabel, setNewVarLabel] = useState("");
  const [newVarAmount, setNewVarAmount] = useState<number>(100);

  const handleAddFixedCost = () => {
    if (!newFixedLabel.trim()) return;
    setFixedCosts([...fixedCosts, { label: newFixedLabel.trim(), amount: Number(newFixedAmount) }]);
    setNewFixedLabel("");
    setNewFixedAmount(500);
  };

  const handleRemoveFixedCost = (index: number) => {
    setFixedCosts(fixedCosts.filter((_, i) => i !== index));
  };

  const handleAddVarCost = () => {
    if (!newVarLabel.trim()) return;
    setVariableCosts([...variableCosts, { label: newVarLabel.trim(), amount: Number(newVarAmount) }]);
    setNewVarLabel("");
    setNewVarAmount(100);
  };

  const handleRemoveVarCost = (index: number) => {
    setVariableCosts(variableCosts.filter((_, i) => i !== index));
  };

  const handleSaveCosts = () => {
    startTransition(async () => {
      const res = await updateTripCostsAction(tripId, fixedCosts, variableCosts);
      if (res.success) {
        // Recalculate locally
        const totalFixed = fixedCosts.reduce((acc, it) => acc + it.amount, 0);
        const unitVar = variableCosts.reduce((acc, it) => acc + it.amount, 0);
        const contribution = data.pricePerPerson - unitVar;
        const breakEven = contribution > 0 ? Math.ceil(totalFixed / contribution) : data.totalCapacity;
        const totalCosts = totalFixed + data.confirmedPassengers * unitVar;
        const expectedRev = data.confirmedPassengers * data.pricePerPerson;
        const netMargin = expectedRev - totalCosts;
        const marginRate = expectedRev > 0 ? Math.round((netMargin / expectedRev) * 100) : 0;

        let statusIndicator: "RED" | "ORANGE" | "GREEN" = "RED";
        if (data.confirmedPassengers >= breakEven) {
          statusIndicator = marginRate >= 10 ? "GREEN" : "ORANGE";
        }

        setData({
          ...data,
          totalFixedCosts: totalFixed,
          unitVariableCost: unitVar,
          breakEvenPassengers: breakEven,
          totalCostsCurrent: totalCosts,
          netMarginCurrent: netMargin,
          marginRatePercentage: marginRate,
          statusIndicator,
          fixedCostsBreakdown: fixedCosts,
          variableCostsBreakdown: variableCosts,
        });

        setFeedback("Structure de coûts enregistrée et seuil de rentabilité recalculé avec succès.");
        router.refresh();
        setTimeout(() => setFeedback(null), 3000);
      }
    });
  };

  const occupancyRate = Math.round((data.confirmedPassengers / (data.totalCapacity || 48)) * 100);
  const breakEvenRate = Math.round((data.breakEvenPassengers / (data.totalCapacity || 48)) * 100);

  return (
    <div className="space-y-6 sm:space-y-8">
      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Top Banner: Real Profitability Status Gauge */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm ${
          data.statusIndicator === "GREEN"
            ? "bg-emerald-50 border-emerald-200 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-100"
            : data.statusIndicator === "ORANGE"
            ? "bg-amber-50 border-amber-200 text-amber-950 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-100"
            : "bg-rose-50 border-rose-200 text-rose-950 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-100"
        }`}
      >
        <div className="space-y-2 z-10">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-pill text-xs font-black uppercase tracking-wider ${
              data.statusIndicator === "GREEN"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                : data.statusIndicator === "ORANGE"
                ? "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30"
                : "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30"
            }`}
          >
            {data.statusIndicator === "GREEN" ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isAr ? "رحلة رابحة ومضمونة" : "Voyage Rentable (Marge > 10%)"}</span>
              </>
            ) : data.statusIndicator === "ORANGE" ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{isAr ? "فوق نقطة التعادل (هامش ربح متوسط)" : "Seuil Atteint (Marge Modérée < 10%)"}</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{isAr ? "تحت نقطة التعادل (عجز مالي مؤقت)" : "En dessous du Point Mort"}</span>
              </>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {data.statusIndicator === "GREEN"
              ? (isAr ? `صافي الأرباح المحققة : ${formatMAD(data.netMarginCurrent, locale)}` : `Bénéfice Net Estimé : +${formatMAD(data.netMarginCurrent, locale)}`)
              : data.statusIndicator === "ORANGE"
              ? (isAr ? `هامش ربح إيجابي : ${formatMAD(data.netMarginCurrent, locale)}` : `Marge Nette Actuelle : +${formatMAD(data.netMarginCurrent, locale)}`)
              : (isAr ? `ينقصك ${data.breakEvenPassengers - data.confirmedPassengers} ركاب لتغطية التكاليف` : `Manque ${data.breakEvenPassengers - data.confirmedPassengers} passagers pour amortir les coûts fixes`)}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            {isAr
              ? `سعر التذكرة : ${formatMAD(data.pricePerPerson, locale)} | التكاليف الثابتة : ${formatMAD(data.totalFixedCosts, locale)} | تكلفة الفرد المتغيرة : ${formatMAD(data.unitVariableCost, locale)}`
              : `Prix vente: ${formatMAD(data.pricePerPerson, locale)} | Coûts Fixes: ${formatMAD(data.totalFixedCosts, locale)} | Coût Var/Pax: ${formatMAD(data.unitVariableCost, locale)}`}
          </p>
        </div>

        {/* Big Break-Even Circle KPI */}
        <div className={`flex items-center gap-4 bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border shrink-0 text-slate-900 dark:text-white shadow-xs ${
          data.statusIndicator === "GREEN"
            ? "border-emerald-200 dark:border-emerald-900/50"
            : data.statusIndicator === "ORANGE"
            ? "border-amber-200 dark:border-amber-900/50"
            : "border-rose-200 dark:border-rose-900/50"
        }`}>
          <div className="text-center">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              {isAr ? "عتبة الأمان" : "Seuil d'Équilibre"}
            </span>
            <p className="text-3xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
              {data.breakEvenPassengers} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">pax</span>
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              sur {data.totalCapacity} places ({breakEvenRate}%)
            </p>
          </div>

          <div className="h-10 w-px bg-slate-200 dark:border-slate-800" />

          <div className="text-center">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              {isAr ? "المسجلون الفعليون" : "Inscriptions Actuelles"}
            </span>
            <p className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {data.confirmedPassengers} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">pax</span>
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
              {occupancyRate}% rempli
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-1">
          <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase">
            {isAr ? "إجمالي التكاليف الثابتة" : "Total Coûts Fixes"}
          </span>
          <p className="text-slate-900 dark:text-white font-black text-2xl font-mono">
            {formatMAD(data.totalFixedCosts, locale)}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-xs">Transport + Staff + Péages</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-1">
          <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase">
            {isAr ? "التكلفة المتغيرة للمسافر" : "Coût Variable / Pax"}
          </span>
          <p className="text-slate-900 dark:text-white font-black text-2xl font-mono">
            {formatMAD(data.unitVariableCost, locale)}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-xs">Hôtel + Repas + Activités</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-1">
          <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase">
            {isAr ? "المداخيل المحصلة بالبنك" : "CA Encaissé (Paiements Validés)"}
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatMAD(data.realCollectedRevenue, locale)}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-xs">Trésorerie effective en compte</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-1">
          <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase">
            {isAr ? "نسبة الهامش الصافي" : "Taux de Marge Nette"}
          </span>
          <p className={`text-2xl font-black font-mono ${data.marginRatePercentage >= 10 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
            {data.marginRatePercentage}%
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-xs">Calculé sur les inscrits confirmés</p>
        </div>
      </div>

      {/* Cost Breakdown & Interactive Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Fixed Costs List & Add */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6 space-y-4">
          <div className="text-slate-900 dark:text-white font-bold border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-sm font-black">
                {isAr ? "تفاصيل التكاليف الثابتة (Fixed Costs)" : "1. Coûts Fixes du Circuit"}
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
              {formatMAD(fixedCosts.reduce((a, b) => a + b.amount, 0), locale)}
            </span>
          </div>

          {fixedCosts.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs">
              {isAr ? "لم يتم تحديد أي تكاليف ثابتة لهذا البرنامج بعد" : "Aucun coût fixe configuré. Ajoutez un poste de dépense ci-dessous."}
            </div>
          ) : (
            <div>
              {fixedCosts.map((fc, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-3.5 mb-2.5 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-900 dark:text-white">{fc.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-slate-900 dark:text-slate-200">
                      {formatMAD(fc.amount, locale)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFixedCost(idx)}
                      className="text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Fixed Cost Line */}
          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <input
              type="text"
              value={newFixedLabel}
              onChange={(e) => setNewFixedLabel(e.target.value)}
              placeholder="Ex: Frais de dossier / Guide"
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs outline-none focus:border-cyan-500"
            />
            <input
              type="number"
              value={newFixedAmount}
              onChange={(e) => setNewFixedAmount(Number(e.target.value))}
              placeholder="MAD"
              className="w-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-xs outline-none focus:border-cyan-500 text-right font-bold"
            />
            <button
              type="button"
              onClick={handleAddFixedCost}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold text-xs flex items-center gap-1 transition border border-slate-200 dark:border-slate-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Variable Costs per Person List & Add */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6 space-y-4">
          <div className="text-slate-900 dark:text-white font-bold border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-black">
                {isAr ? "تفاصيل التكلفة المتغيرة لكل مسافر" : "2. Coûts Variables Unitaires (Par Pax)"}
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
              {formatMAD(variableCosts.reduce((a, b) => a + b.amount, 0), locale)} / pax
            </span>
          </div>

          {variableCosts.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs">
              {isAr ? "لم يتم تحديد أي تكاليف متغيرة لهذا البرنامج بعد" : "Aucun coût variable configuré. Ajoutez un poste de dépense ci-dessous."}
            </div>
          ) : (
            <div>
              {variableCosts.map((vc, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-3.5 mb-2.5 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-900 dark:text-white">{vc.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-slate-900 dark:text-slate-200">
                      {formatMAD(vc.amount, locale)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVarCost(idx)}
                      className="text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Variable Cost Line */}
          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <input
              type="text"
              value={newVarLabel}
              onChange={(e) => setNewVarLabel(e.target.value)}
              placeholder="Ex: Soirée folklorique / Repas"
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs outline-none focus:border-cyan-500"
            />
            <input
              type="number"
              value={newVarAmount}
              onChange={(e) => setNewVarAmount(Number(e.target.value))}
              placeholder="MAD"
              className="w-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-xs outline-none focus:border-cyan-500 text-right font-bold"
            />
            <button
              type="button"
              onClick={handleAddVarCost}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold text-xs flex items-center gap-1 transition border border-slate-200 dark:border-slate-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSaveCosts}
          disabled={isPending}
          className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs sm:text-sm shadow-md transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{isPending ? "Mise à jour..." : "Sauvegarder & Recalculer le Seuil"}</span>
        </button>
      </div>
    </div>
  );
}
