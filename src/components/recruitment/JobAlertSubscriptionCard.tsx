"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Bell, CheckCircle2, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { subscribeJobAlertAction } from "@/actions/recruitment.actions";

export function JobAlertSubscriptionCard() {
  const t = useTranslations("recruitment");
  const locale = useLocale();
  const isAr = locale === "ar";

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await subscribeJobAlertAction(email);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setError(res.error || "Erreur lors de l'inscription.");
      }
    } catch (err: any) {
      setError("Erreur de connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-3xl p-6 sm:p-8 text-center space-y-3 max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h4 className="text-base sm:text-lg font-black text-emerald-950">
          {t("subscribedSuccess")}
        </h4>
        <p className="text-xs text-emerald-700">
          {isAr
            ? `سنقوم بإشعاركم على : ${email} بمجرد فتح فرص جديدة.`
            : `Vous recevrez un email à ${email} dès qu'un nouveau poste sera publié.`}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-tp-line shadow-sm max-w-xl mx-auto text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-tp-cyan/10 text-tp-cyan flex items-center justify-center mx-auto">
        <Bell className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h4 className="text-base sm:text-lg font-black text-tp-midnight">
          {t("alertSubscribeText")}
        </h4>
        <p className="text-xs text-slate-500">
          {isAr
            ? "لا رسائل مزعجة، فقط التنبيه بالوظائف التي تناسب مؤهلاتك."
            : "Pas de spam, seulement les nouvelles offres d'aventure Rahalat Bladna."}
        </p>
      </div>

      {error && (
        <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 pt-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          className="flex-1 h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-tp-cyan focus:ring-1 focus:ring-tp-cyan/20 transition text-left rtl:text-right"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-12 px-6 rounded-xl bg-tp-cyan hover:bg-tp-cyan-hover text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shrink-0 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>{t("subscribeButton")}</span>
              {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
