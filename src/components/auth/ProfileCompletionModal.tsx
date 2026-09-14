"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "next-intl";
import { 
  X, Phone, FileBadge, ShieldCheck, CheckCircle2, 
  ArrowRight, AlertCircle, Sparkles 
} from "lucide-react";

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: { phone: string; cinOrPassport: string }) => void;
  initialPhone?: string;
  initialCin?: string;
}

export function ProfileCompletionModal({
  isOpen,
  onClose,
  onComplete,
  initialPhone = "",
  initialCin = "",
}: ProfileCompletionModalProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [mounted, setMounted] = useState(false);

  const [phone, setPhone] = useState(initialPhone);
  const [cin, setCin] = useState(initialCin);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setSuccess(true);
      setTimeout(() => {
        onComplete({ phone, cinOrPassport: cin });
        setIsSubmitting(false);
        setSuccess(false);
        onClose();
      }, 900);
    }, 500);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div
        className="fixed inset-0 bg-tp-midnight/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-tp-line overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
          {/* Header Banner */}
          <div className="bg-tp-midnight p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-moroccan-pattern-dark opacity-20 pointer-events-none" />

            <button
              onClick={onClose}
              className="absolute top-4 end-4 text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-white/10 text-tp-cyan-soft text-[11px] font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAr ? "الخطوة الأخيرة للحجز" : "Dernière étape avant réservation"}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {isAr ? "استكمال بيانات ملفك الشخصي" : "Complétez votre profil"}
              </h2>
              <p className="text-xs text-tp-ivory/75 leading-relaxed">
                {isAr
                  ? "لإتمام حجزك وضمان مقعدك بالحافلة السياحية، يرجى إدخال رقم هاتفك ورقم البطاقة الوطنية."
                  : "Pour valider votre réservation et émettre votre billet numérique, veuillez renseigner votre téléphone et N° CIN."}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
            {success ? (
              <div className="p-4 rounded-2xl bg-tp-ok-bg text-tp-ok-fg text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{isAr ? "تم حفظ البيانات بنجاح !" : "Profil mis à jour avec succès !"}</span>
              </div>
            ) : (
              <>
                <div className="bg-amber-50 border-s-4 border-amber-500 p-3.5 rounded-e-2xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11.5px] text-amber-900 leading-snug font-medium">
                    {isAr
                      ? "رقم البطاقة الوطنية مطلوب من طرف مصالح الدرك الملكي والأمن الوطني لورقة الطريق السياحية."
                      : "La CIN est obligatoire pour l'édition de la feuille de route officielle (Transport Agréé TIST)."}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-tp-midnight">
                    {isAr ? "رقم الهاتف المحمول (واتساب) *" : "Numéro de téléphone portable (WhatsApp) *"}
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="w-4 h-4 text-tp-muted absolute start-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="0661000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-tp-line focus:border-tp-cyan focus:outline-none text-xs font-bold text-tp-midnight bg-tp-surface-2"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-tp-midnight">
                    {isAr ? "رقم بطاقة التعريف الوطنية أو جواز السفر *" : "N° de Carte CIN ou Passeport *"}
                  </label>
                  <div className="relative flex items-center">
                    <FileBadge className="w-4 h-4 text-tp-muted absolute start-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="AB123456"
                      value={cin}
                      onChange={(e) => setCin(e.target.value.toUpperCase())}
                      className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-tp-line focus:border-tp-cyan focus:outline-none text-xs font-bold text-tp-midnight uppercase font-mono bg-tp-surface-2"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 mt-2 rounded-control bg-tp-cyan hover:bg-tp-cyan-hover text-white text-xs sm:text-sm font-black shadow-tp-cyan transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <span>{isAr ? "تأكيد واستمرار" : "Enregistrer et continuer"}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
