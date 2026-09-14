"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { Building2, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { updateAgencySettingsAction } from "@/actions/agency.actions";
import { useRouter } from "next/navigation";

interface AgencyData {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string | null;
  licenseNumber?: string | null;
  iceNumber?: string | null;
  rcNumber?: string | null;
  bankAccounts?: any;
}

interface AgencySettingsManagerProps {
  initialAgency: AgencyData | null;
}

export function AgencySettingsManager({ initialAgency }: AgencySettingsManagerProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: initialAgency?.name || "",
    phone: initialAgency?.phone || "",
    email: initialAgency?.email || "",
    city: initialAgency?.city || "Casablanca",
    address: initialAgency?.address || "",
    licenseNumber: initialAgency?.licenseNumber || "",
    iceNumber: initialAgency?.iceNumber || "",
    rcNumber: initialAgency?.rcNumber || "",
    ribDetails: (initialAgency?.bankAccounts as any)?.rib || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim()) {
      setErrorMessage(
        isAr
          ? "الاسم التجاري، الهاتف والبريد الإلكتروني حقول إلزامية"
          : "La raison sociale, le téléphone et l'email sont obligatoires."
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await updateAgencySettingsAction(formData);
      if (res.success) {
        setSuccessMessage(
          isAr
            ? "تم حفظ بيانات الوكالة الرسمية بنجاح !"
            : "Coordonnées de l'agence enregistrées avec succès !"
        );
        router.refresh();
      } else {
        setErrorMessage(res.error || "Une erreur est survenue.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur de communication.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 text-tp-cyan-hover dark:text-tp-cyan">
          <Building2 className="w-5 h-5" />
          <h2 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
            {isAr ? "معلومات الوكالة الرسمية (قابلة للتعديل)" : "Coordonnées Officielles de l'Agence"}
          </h2>
        </div>
        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-pill border border-slate-200 dark:border-slate-800">
          {isAr ? "بيانات حقيقية" : "Données Réelles"}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
              {isAr ? "الاسم التجاري / Raison Sociale *" : "Raison Sociale *"}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={isAr ? "اسم وكالة الأسفار" : "Ex: Rahalat Bladna SARL"}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-bold focus:border-tp-cyan focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
              {isAr ? "رقم الواتساب والهاتف الرسمي *" : "Téléphone WhatsApp Officiel *"}
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+212 6XX-XXXXXX"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-emerald-600 dark:text-emerald-400 font-mono font-bold focus:border-tp-cyan focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
              {isAr ? "البريد الإلكتروني للاتصال *" : "Email Officiel *"}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@agence.ma"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-200 font-mono focus:border-tp-cyan focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
              {isAr ? "المدينة" : "Ville"}
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Casablanca / Rabat..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-tp-cyan focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
              {isAr ? "رقم الترخيص / N° d'Agrément" : "N° d'Agrément (Ministère du Tourisme)"}
            </label>
            <input
              type="text"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              placeholder="LIC-MAR-XXXX/XXX"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-200 font-mono focus:border-tp-cyan focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
              {isAr ? "الرقم الموحد للمقاولة (ICE)" : "Identifiant Commun de l'Entreprise (ICE)"}
            </label>
            <input
              type="text"
              value={formData.iceNumber}
              onChange={(e) => setFormData({ ...formData, iceNumber: e.target.value })}
              placeholder="00XXXXXXXXXXXXX"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-200 font-mono focus:border-tp-cyan focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
              {isAr ? "السجل التجاري (RC)" : "Registre de Commerce (RC)"}
            </label>
            <input
              type="text"
              value={formData.rcNumber}
              onChange={(e) => setFormData({ ...formData, rcNumber: e.target.value })}
              placeholder="RC-XXXX-XXXXXX"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-200 font-mono focus:border-tp-cyan focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
              {isAr ? "الحساب البنكي الرسمي (RIB)" : "RIB Bancaire (CIH, Attijari...)"}
            </label>
            <input
              type="text"
              value={formData.ribDetails}
              onChange={(e) => setFormData({ ...formData, ribDetails: e.target.value })}
              placeholder="24 chiffres..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-emerald-600 dark:text-emerald-400 font-mono focus:border-tp-cyan focus:outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
            {isAr ? "العنوان الكامل للمقر" : "Adresse Complète du Siège"}
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder={isAr ? "العنوان التجاري" : "Boulevard, Ville..."}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-tp-cyan focus:outline-none transition"
          />
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 flex items-center gap-2 font-bold text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-2xl bg-tp-cyan hover:bg-tp-cyan-hover text-white dark:text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-tp-cyan transition active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? (isAr ? "جاري الحفظ..." : "Enregistrement...") : (isAr ? "حفظ التغييرات" : "Enregistrer les Coordonnées")}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
