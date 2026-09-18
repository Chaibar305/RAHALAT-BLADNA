"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Edit3, Banknote, Tag, ShieldCheck, Loader2, Save } from "lucide-react";
import { updateBookingAction } from "@/actions/admin-bookings";
import { BookingAdminItem } from "./ReceiptVerificationModal";
import { BookingStatus } from "@prisma/client";
import { formatMAD } from "@/lib/utils";

interface EditBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingAdminItem | null;
  onSuccess?: () => void;
  locale?: string;
}

export function EditBookingModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
  locale = "fr",
}: EditBookingModalProps) {
  const router = useRouter();
  const isAr = locale === "ar";
  const [status, setStatus] = useState<string>(BookingStatus.PENDING_VERIFICATION);
  const [financialStatus, setFinancialStatus] = useState<string>("UNPAID");
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (booking) {
      const tot = Number(booking.totalAmount || 0);
      const dep = Number(booking.depositAmount || 0);
      const paid = Number(booking.depositPaid ?? booking.amountPaid ?? 0);

      setTotalAmount(tot);
      setDepositAmount(dep);
      setAmountPaid(paid);
      setStatus(booking.status || BookingStatus.PENDING_VERIFICATION);
      setNotes(booking.notes || "");
      setErrorMsg(null);

      // Déduire le statut financier initial
      if (
        booking.paymentStatus === "PAYE_INTEGRALEMENT" ||
        booking.paymentStatus === "FULLY_PAID" ||
        (paid >= tot && tot > 0)
      ) {
        setFinancialStatus("FULLY_PAID");
      } else if (
        paid > 0 ||
        booking.paymentStatus === "ACOMPTE_VERSE" ||
        booking.paymentStatus === "DEPOSIT_PAID" ||
        booking.paymentStatus === "VERIFIED"
      ) {
        setFinancialStatus("DEPOSIT_PAID");
      } else {
        setFinancialStatus("UNPAID");
      }
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  // 1. Liaison automatique du sélecteur "Règlement Financier"
  const handleFinancialStatusChange = (newFin: string) => {
    setFinancialStatus(newFin);

    if (newFin === "UNPAID") {
      setAmountPaid(0);
      setStatus(BookingStatus.PENDING_VERIFICATION);
    } else if (newFin === "DEPOSIT_PAID") {
      const defaultDeposit = depositAmount > 0 ? depositAmount : 400;
      setAmountPaid(defaultDeposit);
      setStatus(BookingStatus.DEPOSIT_PAID);
    } else if (newFin === "FULLY_PAID") {
      const defaultTotal = totalAmount > 0 ? totalAmount : 1500;
      setAmountPaid(defaultTotal);
      setStatus(BookingStatus.FULLY_PAID);
    }
  };

  // 2. Gestion de l'input "Encaissé Payé" avec ajustement dynamique
  const handleAmountPaidChange = (newVal: number) => {
    const safeVal = Math.max(0, newVal);
    setAmountPaid(safeVal);

    if (safeVal === 0) {
      setFinancialStatus("UNPAID");
      if (status === BookingStatus.DEPOSIT_PAID || status === BookingStatus.FULLY_PAID) {
        setStatus(BookingStatus.PENDING_VERIFICATION);
      }
    } else if (safeVal >= totalAmount && totalAmount > 0) {
      setFinancialStatus("FULLY_PAID");
      setStatus(BookingStatus.FULLY_PAID);
    } else {
      setFinancialStatus("DEPOSIT_PAID");
      if (status === BookingStatus.PENDING_VERIFICATION || status === BookingStatus.FULLY_PAID) {
        setStatus(BookingStatus.DEPOSIT_PAID);
      }
    }
  };

  // 3. Calcul dynamique du solde restant
  const soldeRestant = Math.max(0, Number(totalAmount) - Number(amountPaid));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await updateBookingAction(booking.id, {
        status,
        financialStatus,
        depositPaid: amountPaid,
        amountPaid,
        totalAmount,
        depositAmount,
        notes,
      });

      if (res.success) {
        router.refresh();
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || "Erreur lors de la mise à jour de la réservation.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur technique de communication.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isAr ? "تعديل ملف الحجز" : "Modifier le Dossier de Réservation"}
                </h3>
                <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                  {booking.reference}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {booking.clientName} · {booking.tripTitle}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Statuts Dossier & Paiement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Statut du Dossier */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-cyan-500" />
                <span>{isAr ? "حالة ملف الحجز :" : "Statut du Dossier :"}</span>
              </label>
              <select
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none font-bold"
              >
                <option value={BookingStatus.PENDING_VERIFICATION}>🟡 En Attente Vérification (PENDING_VERIFICATION)</option>
                <option value={BookingStatus.DEPOSIT_PAID}>🟢 Acompte Validé (DEPOSIT_PAID)</option>
                <option value={BookingStatus.FULLY_PAID}>🔵 Soldé 100% (FULLY_PAID)</option>
                <option value={BookingStatus.CANCELLED_BY_CLIENT}>🔴 Annulée par le client (CANCELLED_BY_CLIENT)</option>
                <option value={BookingStatus.CANCELLED_BY_ADMIN}>⚪ Annulée par l&apos;agence (CANCELLED_BY_ADMIN)</option>
                <option value="REJECTED">🚫 Reçu Rejeté (REJECTED)</option>
                <option value={BookingStatus.PENDING_PAYMENT}>En Attente Paiement (Legacy)</option>
                <option value={BookingStatus.DEPOSIT_CONFIRMED}>Acompte Confirmé (Legacy)</option>
                <option value={BookingStatus.CANCELLED}>Annulée (Legacy)</option>
              </select>
            </div>

            {/* Règlement Financier */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
                <span>{isAr ? "حالة التسوية المالية :" : "Règlement Financier :"}</span>
              </label>
              <select
                name="financialStatus"
                value={financialStatus}
                onChange={(e) => handleFinancialStatusChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none font-bold"
              >
                <option value="UNPAID">{isAr ? "غير مدفوع (0 درهم)" : "Non Payé (0 MAD)"}</option>
                <option value="DEPOSIT_PAID">{isAr ? "تم تسديد العربون" : "Acompte Réglé"}</option>
                <option value="FULLY_PAID">{isAr ? "مسدد بالكامل (100%)" : "Totalité Soldée (100%)"}</option>
              </select>
            </div>
          </div>

          {/* Montants Financiers */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5 text-cyan-500" />
              <span>{isAr ? "تعديل المبالغ المالية (MAD)" : "Ajustement des Montants (MAD)"}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Total TTC */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  {isAr ? "المجموع شامل الضريبة :" : "Total TTC (MAD) :"}
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-xs font-mono font-black bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              {/* Acompte Requis */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  {isAr ? "العربون المطلوب :" : "Acompte (MAD) :"}
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-xs font-mono font-black bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              {/* Montant Payé Encaissé */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  {isAr ? "المبلغ المقبوض الفعلي :" : "Encaissé Payé (MAD) :"}
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={amountPaid}
                  onChange={(e) => handleAmountPaidChange(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-xs font-mono font-black bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Reste à payer calculé en direct */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700/60">
              <span>{isAr ? "المبلغ المتبقي عند الانطلاق :" : "Solde restant au départ :"}</span>
              <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                {formatMAD(soldeRestant, locale)}
              </span>
            </div>
          </div>

          {/* Notes Internes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? "ملاحظات وتوجيهات المشرفين :" : "Notes & Historique Interne du Dossier :"}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes confidentielles agence, historique des acomptes, remises accordées..."
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none"
            />
          </div>

          {/* Actions footer */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs transition shadow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? "جاري التحديث..." : "Mise à jour..."}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isAr ? "تحديث Dossier" : "Enregistrer le dossier"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
