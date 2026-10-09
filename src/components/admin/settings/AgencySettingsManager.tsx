"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { 
  Building2, Save, CheckCircle2, AlertCircle, 
  CreditCard, PhoneCall, ShieldCheck, FileText, Globe 
} from "lucide-react";
import { updateAgencySettingsAction } from "@/actions/agency.actions";
import { AgencySettingsData } from "@/lib/agency";
import { useRouter } from "next/navigation";

interface AgencySettingsManagerProps {
  initialSettings?: AgencySettingsData | null;
  initialAgency?: any; // Compatibilité rétrograde
}

export function AgencySettingsManager({ 
  initialSettings, 
  initialAgency 
}: AgencySettingsManagerProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();

  // Déterminer la source de données initiale
  const source = initialSettings || initialAgency || {};

  const [formData, setFormData] = useState({
    companyName: source.companyName || source.name || "Rahalat Bladna",
    whatsappPhone: source.whatsappPhone || source.phone || "+212681024758",
    email: source.email || "contact@rahalatbladna.ma",
    city: source.city || "Rabat",
    address: source.address || "Rabat & Casablanca, Maroc",
    licenseNumber: source.licenseNumber || "",
    ice: source.ice || source.iceNumber || "004003997000036",
    rc: source.rc || source.rcNumber || "",
    taxId: source.taxId || "",
    bankName: source.bankName || "CIH Bank",
    bankRib: source.bankRib || (source.bankAccounts?.rib as string)?.replace(/\s+/g, "") || "230810678459421100810080",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cleanIce = formData.ice.replace(/\D/g, "");
  const cleanRib = formData.bankRib.replace(/\D/g, "");
  const isIce15 = cleanIce.length === 15;
  const isRib24 = cleanRib.length === 24;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim() || !formData.whatsappPhone.trim() || !formData.email.trim()) {
      setErrorMessage(
        isAr
          ? "الاسم التجاري، هاتف الواتساب والبريد الإلكتروني حقول إلزامية."
          : "La raison sociale, le téléphone WhatsApp et l'email sont obligatoires."
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await updateAgencySettingsAction({
        companyName: formData.companyName.trim(),
        whatsappPhone: formData.whatsappPhone.trim(),
        email: formData.email.trim(),
        city: formData.city.trim(),
        address: formData.address.trim() || null,
        licenseNumber: formData.licenseNumber.trim() || null,
        ice: formData.ice.trim() || null,
        rc: formData.rc.trim() || null,
        taxId: formData.taxId.trim() || null,
        bankName: formData.bankName.trim() || "CIH Bank",
        bankRib: formData.bankRib.trim().replace(/\s+/g, "") || null,
      });

      if (res.success) {
        setSuccessMessage(
          isAr
            ? "تم حفظ وتحديث بيانات الوكالة بنجاح ! التغييرات مفعلة فوراً على الموقع والفواتير."
            : "Coordonnées officielles enregistrées avec succès ! Synchronisation immédiate active."
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-2">
        <div className="flex items-center gap-3 text-tp-cyan-hover dark:text-tp-cyan">
          <Building2 className="w-5 h-5 shrink-0" />
          <div>
            <h2 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
              {isAr ? "بيانات وهوية الوكالة الرسمية" : "Coordonnées Officielles de l'Agence"}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isAr
                ? "تتزامن تلقائياً وبشكل حي مع الـ Navbar، زر الواتساب، الفوتر وفواتير B2B PDF."
                : "Synchronisation temps réel : Navbar, WhatsApp flottant, Footer, Devis & Factures PDF."}
            </p>
          </div>
        </div>

        <span className="self-start sm:self-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-pill flex items-center gap-1.5 shrink-0">
          <Globe className="w-3 h-3" />
          <span>{isAr ? "مباشر وتفاعلي 100%" : "Actif en direct"}</span>
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* Section 1 : Identité & Contact Public */}
        <div className="space-y-3">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <PhoneCall className="w-3.5 h-3.5 text-tp-cyan" />
            <span>{isAr ? "1. معلومات التواصل والظهور العام" : "1. Coordonnées & Affichage Public"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                {isAr ? "الاسم التجاري / Raison Sociale *" : "Raison Sociale *"}
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Ex: Rahalat Bladna SARL"
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
                value={formData.whatsappPhone}
                onChange={(e) => setFormData({ ...formData, whatsappPhone: e.target.value })}
                placeholder="+212681024758"
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
                placeholder="contact@rahalatbladna.ma"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-200 font-mono focus:border-tp-cyan focus:outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                {isAr ? "المدينة الرسمية" : "Ville"}
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Rabat / Casablanca..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-tp-cyan focus:outline-none transition"
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
              placeholder="Rabat & Casablanca, Maroc"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-tp-cyan focus:outline-none transition"
            />
          </div>
        </div>

        {/* Section 2 : Identifiants Légaux & Fiscaux (En-tête & Pied de page Factures) */}
        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-tp-cyan" />
            <span>{isAr ? "2. المعرفات القانونية والجبائية (الفواتير وDevis)" : "2. Identifiants Légaux & Fiscaux (Facturation B2B)"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                {isAr ? "رقم رخصة وزارة السياحة" : "N° d'Agrément Ministère du Tourisme"}
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-slate-700 dark:text-slate-300 font-bold">
                  {isAr ? "الرقم الموحد للمقاولة (ICE)" : "Identifiant Commun de l'Entreprise (ICE)"}
                </label>
                {formData.ice && (
                  <span className={`text-[10px] font-bold ${isIce15 ? "text-emerald-500" : "text-amber-500"}`}>
                    {isIce15 ? "✓ 15 chiffres OK" : `${cleanIce.length}/15`}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={formData.ice}
                onChange={(e) => setFormData({ ...formData, ice: e.target.value })}
                placeholder="00XXXXXXXXXXXXX"
                className={`w-full bg-white dark:bg-slate-900 border ${
                  formData.ice && isIce15 ? "border-emerald-500/60" : "border-slate-300 dark:border-slate-700"
                } rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-200 font-mono focus:border-tp-cyan focus:outline-none transition`}
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                {isAr ? "السجل التجاري (RC)" : "Registre de Commerce (RC)"}
              </label>
              <input
                type="text"
                value={formData.rc}
                onChange={(e) => setFormData({ ...formData, rc: e.target.value })}
                placeholder="RC-XXXXX"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-200 font-mono focus:border-tp-cyan focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                {isAr ? "التعريف الضريبي (IF)" : "Identifiant Fiscal (IF / Tax ID)"}
              </label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="IF-XXXXXXXX"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-200 font-mono focus:border-tp-cyan focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Section 3 : Coordonnées Bancaires pour Règlements des Acomptes */}
        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5 text-tp-cyan" />
            <span>{isAr ? "3. الحساب البنكي الرسمي (تسوية التسبيقات والفواتير)" : "3. Règlement des Acomptes & RIB Bancaire"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                {isAr ? "اسم البنك" : "Établissement Bancaire"}
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="CIH Bank..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-bold focus:border-tp-cyan focus:outline-none transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-slate-700 dark:text-slate-300 font-bold">
                  {isAr ? "رقم الحساب البنكي الكامل (RIB 24 رقماً)" : "RIB Bancaire Complet (24 chiffres pour virements)"}
                </label>
                {formData.bankRib && (
                  <span className={`text-[10px] font-bold ${isRib24 ? "text-emerald-500" : "text-amber-500"}`}>
                    {isRib24 ? "✓ 24 chiffres OK" : `${cleanRib.length}/24`}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={formData.bankRib}
                onChange={(e) => setFormData({ ...formData, bankRib: e.target.value })}
                placeholder="230810678459421100810080"
                className={`w-full bg-white dark:bg-slate-900 border ${
                  formData.bankRib && isRib24 ? "border-emerald-500/60" : "border-slate-300 dark:border-slate-700"
                } rounded-xl px-3.5 py-2.5 text-emerald-600 dark:text-emerald-400 font-mono font-bold focus:border-tp-cyan focus:outline-none transition`}
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
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

        {/* Submit */}
        <div className="pt-2 flex items-center justify-between">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-2xl bg-tp-cyan hover:bg-tp-cyan-hover text-white dark:text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-tp-cyan transition active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSubmitting
                ? isAr
                  ? "جاري الحفظ والتحديث..."
                  : "Enregistrement en cours..."
                : isAr
                ? "حفظ ومزامنة فورية"
                : "Enregistrer & Synchroniser en Direct"}
            </span>
          </button>

          <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline-block">
            {isAr ? "يحدث المنظومة كاملة فوراً" : "Revalidation globale automatique"}
          </span>
        </div>
      </form>
    </div>
  );
}
