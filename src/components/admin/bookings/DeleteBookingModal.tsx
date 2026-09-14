"use client";

import React, { useState } from "react";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { deleteBookingAdminAction } from "@/actions/booking.actions";
import { BookingAdminItem } from "./ReceiptVerificationModal";

interface DeleteBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingAdminItem | null;
  onSuccess?: () => void;
  locale?: string;
}

export function DeleteBookingModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
  locale = "fr",
}: DeleteBookingModalProps) {
  const isAr = locale === "ar";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const handleDelete = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await deleteBookingAdminAction(booking.id);

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || "Erreur lors de la suppression de la réservation.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de communication.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-rose-100 dark:border-rose-950/40 flex items-center justify-between bg-rose-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-rose-600 dark:text-rose-400">
                {isAr ? "حذف ملف الحجز نهائياً" : "Supprimer le Dossier de Réservation"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Action irréversible
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
        <div className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Avertissement Suppression</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Vous allez supprimer définitivement le dossier <strong className="font-mono text-slate-900 dark:text-white">{booking.reference}</strong> ({booking.clientName}) pour le circuit <strong>{booking.tripTitle}</strong>.
            </p>
            <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
              ⚠️ Les {booking.passengersCount} voyageur(s) inscrits, les tickets QR générés ainsi que les factures associées seront effacés. Le quota de places de l&apos;autocar sera automatiquement restitué sur le départ.
            </p>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            {isAr
              ? "هل أنت متأكد من رغبتك في حذف هذا الحجز نهائياً؟"
              : "Confirmez-vous la suppression définitive de cette réservation ?"}
          </p>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {isAr ? "إلغاء" : "Conserver le dossier"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? "جاري الحذف..." : "Suppression..."}</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>{isAr ? "نعم، حذف نهائي" : "Confirmer la suppression"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
