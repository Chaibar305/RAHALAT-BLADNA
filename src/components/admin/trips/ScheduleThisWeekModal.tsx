"use client";

import React, { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { 
  X, Flame, Sparkles, AlertCircle, CheckCircle2, 
  MapPin, Clock, ArrowRight, Loader2, Info
} from "lucide-react";
import { toggleTripScheduledThisWeekAction } from "@/actions/trip.actions";
import { formatMAD } from "@/lib/utils";

interface ScheduleThisWeekModalProps {
  trip: {
    id: string;
    titleFr: string;
    titleAr?: string | null;
    slug: string;
    destinationRegion: string;
    durationDays: number;
    durationNights: number;
    basePrice: number | string;
    coverImageUrl?: string | null;
    isScheduledThisWeek?: boolean;
    featuredWeekMessage?: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedTrip: { id: string; isScheduledThisWeek: boolean; featuredWeekMessage: string | null }) => void;
}

const PRESET_MESSAGES = [
  "🔥 Il ne reste que 6 places pour ce week-end !",
  "✅ Départ Garanti ce Week-end — Dernières places disponibles !",
  "⭐ Circuit Vedette de la Semaine — Départ confirmé vendredi !",
  "⚡ Départ Spécial Week-end — Tarifs et disponibilités limités !",
];

export function ScheduleThisWeekModal({
  trip,
  isOpen,
  onClose,
  onSuccess,
}: ScheduleThisWeekModalProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [isPending, startTransition] = useTransition();

  const [isScheduled, setIsScheduled] = useState<boolean>(Boolean(trip.isScheduledThisWeek));
  const [message, setMessage] = useState<string>(trip.featuredWeekMessage || "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const res = await toggleTripScheduledThisWeekAction(
        trip.id,
        isScheduled,
        isScheduled ? (message.trim() || null) : null
      );

      if (res.success && res.trip) {
        onSuccess({
          id: res.trip.id,
          isScheduledThisWeek: (res.trip as any).isScheduledThisWeek,
          featuredWeekMessage: (res.trip as any).featuredWeekMessage,
        });
        onClose();
      } else {
        setErrorMsg(res.error || "Une erreur est survenue lors de l'enregistrement.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-950 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Flame gradient */}
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 dark:from-amber-950/30 dark:to-slate-950 border-b border-amber-200/40 dark:border-amber-900/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAr ? "برمجة عطلة نهاية الأسبوع" : "Départ Vedette du Week-end"}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {isAr ? "تعيين كرحلة الأسبوع الرسمية" : "Circuit Planifié cette Semaine"}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              disabled={isPending}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Trip Summary Card */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 relative">
              <img
                src={trip.coverImageUrl || "/images/merzouga/cover-merzouga.jpg"}
                alt={trip.titleFr}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {trip.titleFr}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{trip.destinationRegion}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {trip.durationDays}J / {trip.durationNights}N
                </span>
                <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                  {formatMAD(Number(trip.basePrice || 0), locale)}
                </span>
              </div>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20">
            <div className="space-y-0.5 pr-4">
              <label htmlFor="scheduledToggle" className="text-sm font-black text-slate-900 dark:text-white cursor-pointer block">
                {isAr ? "تفعيل كرحلة منطلقة هذا الأسبوع" : "Activer comme Départ Vedette cette semaine"}
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? "سيتم إبراز هذه الرحلة للمسافرين وتوجيههم إليها عبر رسائل تنبيه ذكية."
                  : "Met en avant ce circuit sur la page d'accueil et invite les visiteurs des autres circuits à réserver ce départ."}
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                id="scheduledToggle"
                type="checkbox"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
                className="sr-only peer"
                disabled={isPending}
              />
              <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Custom Message Field (when activated) */}
          {isScheduled && (
            <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {isAr ? "الرسالة الترويجية المرافقة (اختيارية)" : "Message Informatif & Argument de Vente"}
                </label>
                <span className="text-[11px] text-slate-400">
                  Affiché sur les fiches clients
                </span>
              </div>

              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ex: Il ne reste que 6 places pour ce week-end ! Départ garanti."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                maxLength={120}
                disabled={isPending}
              />

              {/* Suggestions Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  {isAr ? "نماذج رسائل سريعة :" : "Modèles de messages rapides :"}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_MESSAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMessage(preset)}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-100 hover:text-amber-800 dark:hover:bg-amber-950/50 dark:hover:text-amber-300 transition text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-Selection Guidance */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  {isAr
                    ? "ملاحظة: يمكنك برمجة عدة رحلات في نفس الوقت لعطلة نهاية الأسبوع (مثل أسفالو + شفشاون)، وستظهر جميعها للمسافرين كرحلات مؤكدة الانطلاق."
                    : "Note : Plusieurs circuits peuvent être programmés simultanément pour le week-end (ex: Barrage Asfalou + Chefchaouen). Ils seront tous mis en avant auprès des voyageurs."}
                </span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {isAr ? "إلغاء" : "Annuler"}
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black shadow-md shadow-amber-500/20 transition disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? "جاري الحفظ..." : "Enregistrement..."}</span>
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4" />
                  <span>
                    {isScheduled
                      ? (isAr ? "تأكيد رحلة الأسبوع" : "Confirmer le Départ Vedette")
                      : (isAr ? "حفظ التغييرات" : "Enregistrer")}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
