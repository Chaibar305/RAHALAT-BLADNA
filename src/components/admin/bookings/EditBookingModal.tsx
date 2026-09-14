"use client";

import React, { useState, useEffect } from "react";
import { X, Edit3, Banknote, Calendar, Tag, ShieldCheck, Loader2, Save } from "lucide-react";
import { updateBookingAdminAction } from "@/actions/booking.actions";
import { BookingAdminItem } from "./ReceiptVerificationModal";
import { BookingStatus, PaymentStatus } from "@prisma/client";

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
  const isAr = locale === "ar";
  const [status, setStatus] = useState<BookingStatus>(BookingStatus.PENDING_PAYMENT);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.NON_PAYE);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (booking) {
      setStatus((booking.status as BookingStatus) || BookingStatus.PENDING_PAYMENT);
      setPaymentStatus((booking.paymentStatus as PaymentStatus) || PaymentStatus.NON_PAYE);
      setTotalAmount(booking.totalAmount || 0);
      setDepositAmount(booking.depositAmount || 0);
      setAmountPaid(booking.amountPaid || 0);
      setNotes(booking.notes || "");
      setErrorMsg(null);
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await updateBookingAdminAction(booking.id, {
        status,
        paymentStatus,
        totalAmount,
        depositAmount,
        amountPaid,
        notes,
      });

      if (res.success) {
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
                <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-pill">
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
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-cyan-500" />
                <span>{isAr ? "حالة ملف الحجز :" : "Statut du Dossier :"}</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BookingStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none font-bold"
              >
                <option value={BookingStatus.PENDING_PAYMENT}>En Attente Paiement (PENDING_PAYMENT)</option>
                <option value={BookingStatus.PENDING_VERIFICATION}>Reçu Téléversé (PENDING_VERIFICATION)</option>
                <option value={BookingStatus.DEPOSIT_CONFIRMED}>Acompte Validé (DEPOSIT_CONFIRMED)</option>
                <option value={BookingStatus.FULLY_PAID}>Soldé 100% (FULLY_PAID)</option>
                <option value={BookingStatus.CANCELLED}>Annulée (CANCELLED)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
                <span>{isAr ? "حالة التسوية المالية :" : "Règlement Financier :"}</span>
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none font-bold"
              >
                <option value={PaymentStatus.NON_PAYE}>Non Payé (0 MAD)</option>
                <option value={PaymentStatus.ACOMPTE_VERSE}>Acompte Versé</option>
                <option value={PaymentStatus.SOLDE_VERSE}>Solde Versé</option>
                <option value={PaymentStatus.PAYE_INTEGRALEMENT}>Payé Intégralement (100%)</option>
              </select>
            </div>
          </div>

          {/* Montants Financiers */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5 text-cyan-500" />
              <span>Ajustement des Montants (MAD)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Total TTC */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Total TTC (MAD) :
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
                  Acompte (MAD) :
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
                  Encaissé Payé (MAD) :
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-xs font-mono font-black bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Reste à payer calculé */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700/60">
              <span>Solde restant au départ :</span>
              <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                {Math.max(0, totalAmount - amountPaid)} MAD
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
