"use client";

import React, { useState, useEffect } from "react";
import { 
  X, Trash2, AlertTriangle, Loader2, CalendarX, 
  UserX, ShieldCheck, CheckCircle2, RotateCcw, AlertCircle
} from "lucide-react";
import { deleteClientAdminAction, clearClientBookingsAction } from "@/actions/admin-clients";
import { ClientDetailedData } from "./ClientDetailsDrawer";
import { formatMAD } from "@/lib/utils";

type DeleteMode = "CLEAR_BOOKINGS" | "DELETE_ACCOUNT";

interface DeleteClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientDetailedData | null;
  onSuccess?: (deletedClientId: string) => void;
  onBookingsCleared?: (clientId: string) => void;
  initialMode?: DeleteMode;
  locale?: string;
}

export function DeleteClientModal({
  isOpen,
  onClose,
  client,
  onSuccess,
  onBookingsCleared,
  initialMode,
  locale = "fr",
}: DeleteClientModalProps) {
  const isAr = locale === "ar";
  const [selectedMode, setSelectedMode] = useState<DeleteMode>("CLEAR_BOOKINGS");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const bookingsCount = client?.bookings?.length || 0;
  const totalSpend = client?.bookings?.reduce((acc, b) => acc + (b.amountPaid || 0), 0) || 0;

  // Ajuster le mode par défaut selon l'existence de réservations
  useEffect(() => {
    if (initialMode) {
      setSelectedMode(initialMode);
    } else if (bookingsCount > 0) {
      setSelectedMode("CLEAR_BOOKINGS");
    } else {
      setSelectedMode("DELETE_ACCOUNT");
    }
  }, [client, bookingsCount, initialMode]);

  if (!isOpen || !client) return null;

  const handleExecute = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (selectedMode === "CLEAR_BOOKINGS") {
        const res = await clearClientBookingsAction(client.id);
        if (res.success) {
          if (onBookingsCleared) onBookingsCleared(client.id);
          onClose();
        } else {
          setErrorMsg(res.error || "Une erreur est survenue lors de la suppression des réservations.");
        }
      } else {
        const res = await deleteClientAdminAction(client.id);
        if (res.success) {
          if (onSuccess) onSuccess(client.id);
          onClose();
        } else {
          setErrorMsg(res.error || "Une erreur est survenue lors de la suppression du compte.");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de traitement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className={`p-5 sm:p-6 border-b flex items-center justify-between transition-colors ${
          selectedMode === "CLEAR_BOOKINGS"
            ? "border-amber-100 dark:border-amber-950/40 bg-amber-500/10"
            : "border-rose-100 dark:border-rose-950/40 bg-rose-500/10"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              selectedMode === "CLEAR_BOOKINGS"
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
            }`}>
              {selectedMode === "CLEAR_BOOKINGS" ? (
                <CalendarX className="w-5 h-5" />
              ) : (
                <UserX className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className={`text-base font-black ${
                selectedMode === "CLEAR_BOOKINGS"
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}>
                {isAr ? "خيارات الحذف وإدارة العميل" : "Gestion de la Suppression Client"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {client.fullName} ({client.email})
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

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Résumé du client */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {isAr ? "البيانات المسجلة" : "Historique Commercial"}
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {bookingsCount} {isAr ? "حجوزات" : "réservation(s)"} enregistrée(s)
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {isAr ? "إجمالي المدفوع" : "Total Dépensé"}
              </span>
              <span className="font-black text-cyan-600 dark:text-cyan-400 font-sans">
                {formatMAD(totalSpend)}
              </span>
            </div>
          </div>

          {/* Sélecteur des 2 Options */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? "اختر نوع الإجراء المطلوب :" : "Sélectionnez le niveau de suppression souhaité :"}
            </label>

            <div className="grid grid-cols-1 gap-3">
              {/* Option 1 : Vider les réservations uniquement */}
              <button
                type="button"
                onClick={() => setSelectedMode("CLEAR_BOOKINGS")}
                disabled={bookingsCount === 0}
                className={`w-full p-4 rounded-2xl border text-left rtl:text-right transition-all flex items-start gap-3.5 relative ${
                  selectedMode === "CLEAR_BOOKINGS"
                    ? "border-amber-400 dark:border-amber-600 bg-amber-500/5 dark:bg-amber-950/20 ring-2 ring-amber-500/20 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                } ${bookingsCount === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  selectedMode === "CLEAR_BOOKINGS"
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}>
                  <RotateCcw className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{isAr ? "إفراغ الحجوزات والمدفوعات فقط" : "Vider réservations & paiements"}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] shrink-0 border border-emerald-500/20">
                      {isAr ? "حساب محفوظ" : "Compte conservé"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {isAr 
                      ? "حذف كافة ملفات الحجز والتذاكر والمدفوعات، مع استرجاع المقاعد المحجوزة. الحساب يبقى نشطاً للمستقبل."
                      : "Supprime les réservations, billets et paiements de ce client et libère les places sur les départs. Le compte utilisateur reste actif."}
                  </p>
                  {bookingsCount === 0 && (
                    <span className="text-[10px] text-slate-400 italic block pt-0.5">
                      (Aucun dossier de réservation à vider pour ce client)
                    </span>
                  )}
                </div>
              </button>

              {/* Option 2 : Supprimer définitivement le compte */}
              <button
                type="button"
                onClick={() => setSelectedMode("DELETE_ACCOUNT")}
                className={`w-full p-4 rounded-2xl border text-left rtl:text-right transition-all flex items-start gap-3.5 relative ${
                  selectedMode === "DELETE_ACCOUNT"
                    ? "border-rose-400 dark:border-rose-600 bg-rose-500/5 dark:bg-rose-950/20 ring-2 ring-rose-500/20 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                } cursor-pointer`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  selectedMode === "DELETE_ACCOUNT"
                    ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}>
                  <Trash2 className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{isAr ? "حذف حساب العميل نهائياً" : "Supprimer définitivement le compte"}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold text-[10px] shrink-0 border border-rose-500/20">
                      {isAr ? "حذف كامل" : "Suppression totale"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {isAr
                      ? "إزالة الحساب من قاعدة البيانات بالكامل مع سجلاته وبيانات تسجيل الدخول. إجراء نهائي لا يمكن التراجع عنه."
                      : "Supprime définitivement le compte utilisateur, ses identifiants et l'ensemble de son historique de la base de données."}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Tableau comparatif d'impact */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-2 text-[11px]">
            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block text-[10px]">
              {isAr ? "ملخص التأثير :" : "Conséquences de l'action sélectionnée :"}
            </span>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">
                {isAr ? "حساب العميل وبيانات الاتصال" : "Compte utilisateur & profil :"}
              </span>
              <span className={`font-bold ${
                selectedMode === "CLEAR_BOOKINGS"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}>
                {selectedMode === "CLEAR_BOOKINGS" ? "Conservé actif" : "Supprimé définitivement"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">
                {isAr ? "ملفات الحجز وتذاكر الرحلات" : "Dossiers de réservation & billets :"}
              </span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                Supprimés ({bookingsCount})
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">
                {isAr ? "استرجاع المقاعد في المواعيد" : "Quotas de places sur les départs :"}
              </span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">
                Libérés automatiquement
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {isAr ? "إلغاء" : "Annuler"}
            </button>

            <button
              type="button"
              onClick={handleExecute}
              disabled={isSubmitting || (selectedMode === "CLEAR_BOOKINGS" && bookingsCount === 0)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs transition shadow-md disabled:opacity-50 ${
                selectedMode === "CLEAR_BOOKINGS"
                  ? "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-amber-600/20"
                  : "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-600/20"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? "جاري المعالجة..." : "Traitement..."}</span>
                </>
              ) : selectedMode === "CLEAR_BOOKINGS" ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>
                    {isAr 
                      ? `تأكيد إفراغ الحجوزات (${bookingsCount})` 
                      : `Vider les réservations (${bookingsCount})`}
                  </span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {isAr ? "تأكيد حذف الحساب نهائياً" : "Confirmer la suppression du compte"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
