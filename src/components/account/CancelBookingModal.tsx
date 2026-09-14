"use client";

import React, { useState } from "react";
import { 
  AlertTriangle, X, Calendar, MapPin, 
  Info, Loader2, ArrowRight, CheckCircle2 
} from "lucide-react";
import { cancelBookingAction } from "@/actions/cancel-booking";
import { SerializedBooking } from "./BookingsList";

interface CancelBookingModalProps {
  booking: SerializedBooking;
  isAr?: boolean;
  onClose: () => void;
  onSuccess: (bookingId: string) => void;
}

const CANCELLATION_REASONS_FR = [
  { value: "PROFESSIONAL", label: "Empêchement professionnel" },
  { value: "MEDICAL", label: "Raison médicale ou de santé" },
  { value: "TRANSPORT", label: "Problème de transport ou déplacement" },
  { value: "FAMILY", label: "Imprévu familial" },
  { value: "OTHER", label: "Autre motif personnel" },
];

const CANCELLATION_REASONS_AR = [
  { value: "PROFESSIONAL", label: "التزام مهني أو عمل طارئ" },
  { value: "MEDICAL", label: "أسباب صحية أو طبية" },
  { value: "TRANSPORT", label: "صعوبات في التنقل أو المواصلات" },
  { value: "FAMILY", label: "ظرف عائلي طارئ" },
  { value: "OTHER", label: "سبب شخصي آخر" },
];

export function CancelBookingModal({
  booking,
  isAr = false,
  onClose,
  onSuccess,
}: CancelBookingModalProps) {
  const [selectedReason, setSelectedReason] = useState(
    isAr ? "التزام مهني أو عمل طارئ" : "Empêchement professionnel"
  );
  const [customDetails, setCustomDetails] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reasonsList = isAr ? CANCELLATION_REASONS_AR : CANCELLATION_REASONS_FR;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(isAr ? "ar-MA" : "fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleConfirmCancel = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await cancelBookingAction(
        booking.id,
        selectedReason,
        customDetails
      );

      if (res.success) {
        onSuccess(booking.id);
      } else {
        setErrorMessage(
          res.error ||
            (isAr
              ? "تعذر إلغاء الحجز، يرجى المحاولة مرة أخرى."
              : "Impossible d'annuler la réservation.")
        );
      }
    } catch (err: any) {
      console.error("Cancel modal error:", err);
      setErrorMessage(
        isAr
          ? "حدث خطأ غير متوقع. يرجى الاتصال بخدمة العملاء."
          : "Une erreur est survenue lors de l'annulation."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div 
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-2xl space-y-5 text-slate-900 dark:text-white relative my-auto"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Bouton Fermer */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-5 end-5 p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* En-tête : Icône Alerte Rose/Rouge & Titre */}
        <div className="flex items-start gap-3.5 pe-8">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {isAr
                ? `إلغاء الحجز ملف [${booking.bookingNumber}]`
                : `Annulation du dossier [${booking.bookingNumber}]`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? "تأكيد طلب إلغاء مشاركتك في هذا البرنامج السياحي."
                : "Confirmation de votre demande d'annulation pour ce voyage."}
            </p>
          </div>
        </div>

        {/* Rappel du Circuit & Dates */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
          <p className="text-sm font-black text-slate-900 dark:text-white">
            {isAr
              ? booking.departure.trip.titleAr || booking.departure.trip.titleFr
              : booking.departure.trip.titleFr}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-tp-cyan" />
              <span>
                {isAr
                  ? `من ${formatDate(booking.departure.startDate)} إلى ${formatDate(booking.departure.endDate)}`
                  : `Du ${formatDate(booking.departure.startDate)} au ${formatDate(booking.departure.endDate)}`}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-tp-cyan" />
              <span>{booking.departure.trip.departureCity}</span>
            </span>
          </div>
        </div>

        {/* Alerte Politique d'Annulation & Acomptes */}
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-300 dark:border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-200">
          <Info className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">
              {isAr ? "تذكير بشروط الإلغاء واسترجاع العربون :" : "Politique d'annulation & Acomptes :"}
            </p>
            <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-300">
              {isAr
                ? "وفقاً لشروط الحجز المعتمدة، فإن العربون المدفوع غير قابل للاسترداد في حال الإلغاء قبل أقل من 7 أيام من موعد الانطلاق إلا في حالات القوة القاهرة المبررة رسمياً."
                : "Conformément à nos conditions, l'acompte versé n'est pas remboursable en cas d'annulation à moins de 7 jours du départ sauf motif de force majeure justifié."}
            </p>
          </div>
        </div>

        {/* Motif d'Annulation (Optionnel) */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {isAr ? "سبب الإلغاء (اختياري) :" : "Motif d'annulation (Optionnel) :"}
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-rose-500 transition cursor-pointer"
          >
            {reasonsList.map((r) => (
              <option key={r.value} value={r.label}>
                {r.label}
              </option>
            ))}
          </select>

          {/* Précisions facultatives */}
          <textarea
            value={customDetails}
            onChange={(e) => setCustomDetails(e.target.value)}
            placeholder={
              isAr
                ? "رسالة إضافية لفريق خدمة العملاء (اختياري)..."
                : "Message optionnel pour notre service client..."
            }
            rows={2}
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-rose-500 transition resize-none"
          />
        </div>

        {/* Message d'erreur éventuel */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-300 text-xs text-red-600 dark:text-red-300 font-bold">
            {errorMessage}
          </div>
        )}

        {/* Deux Actions : Conserver ou Confirmer Annulation */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition active:scale-95"
          >
            {isAr ? "الاحتفاظ برحلتي" : "Conserver mon voyage"}
          </button>

          <button
            type="button"
            onClick={handleConfirmCancel}
            disabled={isLoading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isAr ? "جارٍ الإلغاء..." : "Annulation en cours..."}</span>
              </>
            ) : (
              <span>
                {isAr ? "تأكيد الإلغاء النهائي" : "Confirmer l'annulation définitive"}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
