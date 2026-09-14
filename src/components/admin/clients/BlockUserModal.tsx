"use client";

import React, { useState } from "react";
import { X, ShieldAlert, ShieldCheck, AlertTriangle, Loader2, Ban, CheckCircle } from "lucide-react";
import { toggleBlockUserAction } from "@/actions/client.actions";
import { ClientDetailedData } from "./ClientDetailsDrawer";

interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientDetailedData | null;
  onSuccess?: (result: { isBlocked: boolean; blockedReason?: string | null }) => void;
  locale?: string;
}

const PRESET_REASONS = [
  "Fraude ou tentative de transmission de faux reçu bancaire",
  "Non-respect répété des conditions générales et horaires d'embarquement",
  "Impayé persistant ou solde non régularisé",
  "Comportement abusif / perturbation du groupe lors des départs",
  "Autre motif (à préciser ci-dessous)",
];

export function BlockUserModal({
  isOpen,
  onClose,
  client,
  onSuccess,
  locale = "fr",
}: BlockUserModalProps) {
  const isAr = locale === "ar";
  const [selectedPreset, setSelectedPreset] = useState(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !client) return null;

  const isCurrentlyBlocked = !!client.isBlocked;

  const handleToggle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const nextBlockedState = !isCurrentlyBlocked;
      const finalReason = nextBlockedState
        ? selectedPreset === "Autre motif (à préciser ci-dessous)"
          ? customReason.trim() || "Compte suspendu par l'administration"
          : selectedPreset
        : undefined;

      const res = await toggleBlockUserAction(client.id, nextBlockedState, finalReason);

      if (res.success) {
        if (onSuccess) {
          onSuccess({
            isBlocked: res.isBlocked ?? nextBlockedState,
            blockedReason: res.blockedReason ?? null,
          });
        }
        onClose();
      } else {
        setErrorMsg(res.error || "Une erreur est survenue lors de l'opération.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className={`p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between ${
          isCurrentlyBlocked ? "bg-emerald-500/10" : "bg-rose-500/10"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isCurrentlyBlocked
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
            }`}>
              {isCurrentlyBlocked ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isCurrentlyBlocked
                  ? (isAr ? "إلغاء حظر حساب العميل" : "Débloquer l'accès Client")
                  : (isAr ? "تعليق وحظر حساب العميل" : "Suspendre l'accès Client")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {client.fullName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleToggle} className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {isCurrentlyBlocked ? (
            /* Mode Déblocage */
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Rétablissement de l&apos;accès</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  Le client pourra à nouveau se connecter, consulter ses réservations et réserver des circuits en ligne.
                </p>
                {client.blockedReason && (
                  <p className="text-[11px] pt-1 text-slate-600 dark:text-slate-400 border-t border-emerald-200/60 dark:border-emerald-800/40">
                    <span className="font-bold">Motif initial de suspension :</span> {client.blockedReason}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Mode Suspension */
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  En suspendant ce compte, le client sera immédiatement déconnecté et ne pourra plus se connecter avec ses identifiants ni via Google OAuth.
                </p>
              </div>

              {/* Choix du motif */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? "سبب التعليق :" : "Motif de la suspension :"}
                </label>
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  {PRESET_REASONS.map((r, i) => (
                    <option key={i} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Zone motif personnalisé */}
              {(selectedPreset === "Autre motif (à préciser ci-dessous)" || true) && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {isAr ? "تفاصيل إضافية للسبب :" : "Précisions ou notes pour l'équipe :"}
                  </label>
                  <textarea
                    rows={2}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Détails complémentaires consultables par l'administration..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {isAr ? "إلغاء" : "Annuler"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-md disabled:opacity-50 ${
                isCurrentlyBlocked
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-rose-600 hover:bg-rose-700 text-white"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? "جاري المعالجة..." : "Traitement..."}</span>
                </>
              ) : isCurrentlyBlocked ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{isAr ? "تأكيد رفع الحظر" : "Confirmer le déblocage"}</span>
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4" />
                  <span>{isAr ? "تأكيد تعليق الحساب" : "Confirmer la suspension"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
