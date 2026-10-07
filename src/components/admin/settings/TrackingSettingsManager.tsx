"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import {
  Activity,
  Code2,
  Target,
  FileSpreadsheet,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Check,
  Zap,
} from "lucide-react";
import { updateTrackingSettingsAction, testGoogleSheetsAction } from "@/actions/settings.actions";
import { trackConversion } from "@/lib/tracking";
import { useRouter } from "next/navigation";

interface TrackingSettingsData {
  id?: string;
  googleAnalyticsId?: string | null;
  googleAdsId?: string | null;
  googleAdsConversionLabel?: string | null;
  facebookPixelId?: string | null;
  tiktokPixelId?: string | null;
  snapchatPixelId?: string | null;
  customHeadScripts?: string | null;
  customBodyScripts?: string | null;
  conversionEventType?: string;
  conversionTriggerType?: string;
  googleSheetsEnabled?: boolean;
  googleSheetId?: string | null;
  googleSheetTabName?: string | null;
  googleSheetsCredentials?: string | null;
  googleSheetsWebhookUrl?: string | null;
}

interface TrackingSettingsManagerProps {
  initialSettings: TrackingSettingsData | null;
}

export function TrackingSettingsManager({ initialSettings }: TrackingSettingsManagerProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"pixels" | "scripts" | "conversion" | "sheets">("pixels");

  // Form State
  const [formData, setFormData] = useState({
    googleAnalyticsId: initialSettings?.googleAnalyticsId || "",
    googleAdsId: initialSettings?.googleAdsId || "",
    googleAdsConversionLabel: initialSettings?.googleAdsConversionLabel || "",
    facebookPixelId: initialSettings?.facebookPixelId || "1118260296106847",
    tiktokPixelId: initialSettings?.tiktokPixelId || "",
    snapchatPixelId: initialSettings?.snapchatPixelId || "",

    customHeadScripts: initialSettings?.customHeadScripts || "",
    customBodyScripts: initialSettings?.customBodyScripts || "",

    conversionEventType: initialSettings?.conversionEventType || "lead",
    conversionTriggerType: initialSettings?.conversionTriggerType || "on_submit",

    googleSheetsEnabled: initialSettings?.googleSheetsEnabled ?? false,
    googleSheetId: initialSettings?.googleSheetId || "",
    googleSheetTabName: initialSettings?.googleSheetTabName || "Réservations",
    googleSheetsCredentials: initialSettings?.googleSheetsCredentials || "",
    googleSheetsWebhookUrl: initialSettings?.googleSheetsWebhookUrl || "",
  });

  const [sheetsAuthMode, setSheetsAuthMode] = useState<"service_account" | "webhook">(
    initialSettings?.googleSheetsWebhookUrl ? "webhook" : "service_account"
  );

  // States de soumission et tests
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Test Sheets state
  const [isTestingSheets, setIsTestingSheets] = useState(false);
  const [sheetsTestResult, setSheetsTestResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  // Test Conversion state
  const [testConversionTriggered, setTestConversionTriggered] = useState(false);

  // Validation format helper
  const isGa4Valid = !formData.googleAnalyticsId || /^G-[A-Z0-9]+$/i.test(formData.googleAnalyticsId.trim());
  const isGoogleAdsValid = !formData.googleAdsId || /^AW-[0-9]+$/i.test(formData.googleAdsId.trim());

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const res = await updateTrackingSettingsAction(formData);
      if (res.success) {
        setSaveSuccess(
          isAr
            ? "تم حفظ إعدادات التتبع والربط بنجاح !"
            : "Paramètres de tracking et d'intégration enregistrés avec succès !"
        );
        router.refresh();
        setTimeout(() => setSaveSuccess(null), 4000);
      } else {
        setSaveError(res.error || "Une erreur est survenue lors de la sauvegarde.");
      }
    } catch (err: any) {
      setSaveError(err.message || "Erreur de communication.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestGoogleSheets = async () => {
    setIsTestingSheets(true);
    setSheetsTestResult(null);

    try {
      const res = await testGoogleSheetsAction({
        sheetId: formData.googleSheetId,
        tabName: formData.googleSheetTabName,
        credentialsJson: formData.googleSheetsCredentials,
        webhookUrl: formData.googleSheetsWebhookUrl,
      });

      if (res.success) {
        setSheetsTestResult({
          success: true,
          message: res.message || "Connexion à Google Sheets réussie !",
        });
      } else {
        setSheetsTestResult({
          success: false,
          error: res.error || "Échec de la connexion à Google Sheets.",
        });
      }
    } catch (err: any) {
      setSheetsTestResult({
        success: false,
        error: err.message || "Erreur réseau lors du test de connexion.",
      });
    } finally {
      setIsTestingSheets(false);
    }
  };

  const handleTestConversion = () => {
    setTestConversionTriggered(true);
    trackConversion(formData.conversionEventType, {
      content_name: "Test Déclenchement Panneau Admin",
      content_category: "Test Conversion",
      value: 1450,
      currency: "MAD",
      order_id: `TEST-${Date.now().toString().slice(-6)}`,
    });
    setTimeout(() => setTestConversionTriggered(false), 3000);
  };

  return (
    <div className="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors space-y-6">
      {/* Entête du module */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs font-black uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5" />
            <span>{isAr ? "التتبع والربط البرمجي" : "Tracking & Intégrations API"}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isAr ? "إدارة البيكسل وحملات الإعلانات وجداول جوجل" : "Pixels Publicitaires & Synchronisation Google Sheets"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {isAr
              ? "ربط بيكسل Meta و TikTok و Snapchat و Google Ads وحقن الأكواد المخصصة والمزامنة التلقائية مع Google Sheets."
              : "Pilotez vos pixels Meta, TikTok, Snap, Google Ads, injectez vos scripts custom et synchronisez vos leads vers Google Sheets."}
          </p>
        </div>

        {/* Bouton de sauvegarde principal */}
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white font-black text-xs sm:text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shrink-0"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{isAr ? "جاري الحفظ..." : "Enregistrement..."}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isAr ? "حفظ التغييرات" : "Enregistrer les Paramètres"}</span>
            </>
          )}
        </button>
      </div>

      {/* Messages de retour */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span className="font-bold">{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span className="font-bold">{saveError}</span>
        </div>
      )}

      {/* Navigation par Onglets */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full">
        <button
          type="button"
          onClick={() => setActiveTab("pixels")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === "pixels"
              ? "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>{isAr ? "البيكسل والتحليلات" : "Pixels & Analytiques"}</span>
          {(formData.facebookPixelId || formData.googleAnalyticsId || formData.tiktokPixelId) && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("scripts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === "scripts"
              ? "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>{isAr ? "الأكواد المخصصة (Head & Body)" : "Scripts Personnalisés"}</span>
          {(formData.customHeadScripts || formData.customBodyScripts) && (
            <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("conversion")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === "conversion"
              ? "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Target className="w-4 h-4" />
          <span>{isAr ? "أحداث التحويل (Conversions)" : "Type de Conversion"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sheets")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === "sheets"
              ? "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{isAr ? "مزامنة Google Sheets" : "Google Sheets"}</span>
          {formData.googleSheetsEnabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          )}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ==================================================== */}
        {/* ONGLET 1 : PIXELS & ANALYTIQUES                      */}
        {/* ==================================================== */}
        {activeTab === "pixels" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <p>
                {isAr
                  ? "يتم تحميل الأكواد البرمجية الرسمية تلقائياً وبشكل غير متزامن فقط للمنصات التي تم إدخال معرف البيكسل الخاص بها، دون أي تأثير على سرعة الموقع."
                  : "Les scripts officiels sont chargés de façon asynchrone uniquement pour les plateformes dont l'ID est renseigné ci-dessous. Aucun code mort n'est injecté."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Meta / Facebook Pixel */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔵</span>
                    <div>
                      <h3 className="font-black text-sm text-slate-900 dark:text-white">Meta / Facebook Pixel</h3>
                      <p className="text-[11px] text-slate-500">Facebook & Instagram Ads</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-pill text-[10px] font-bold ${
                      formData.facebookPixelId
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {formData.facebookPixelId ? "Actif" : "Non configuré"}
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? "معرف بيكسل فيسبوك (Pixel ID)" : "Identifiant du Pixel (Pixel ID)"}
                  </label>
                  <input
                    type="text"
                    value={formData.facebookPixelId}
                    onChange={(e) => setFormData({ ...formData, facebookPixelId: e.target.value })}
                    placeholder="Ex: 1118260296106847"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* TikTok Pixel */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚫</span>
                    <div>
                      <h3 className="font-black text-sm text-slate-900 dark:text-white">TikTok Pixel</h3>
                      <p className="text-[11px] text-slate-500">TikTok Ads Manager</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-pill text-[10px] font-bold ${
                      formData.tiktokPixelId
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {formData.tiktokPixelId ? "Actif" : "Non configuré"}
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? "معرف بيكسل تيك توك (TikTok Pixel ID)" : "Identifiant TikTok Pixel (Pixel ID)"}
                  </label>
                  <input
                    type="text"
                    value={formData.tiktokPixelId}
                    onChange={(e) => setFormData({ ...formData, tiktokPixelId: e.target.value })}
                    placeholder="Ex: CXXXXXXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Snapchat Pixel */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🟡</span>
                    <div>
                      <h3 className="font-black text-sm text-slate-900 dark:text-white">Snapchat Pixel</h3>
                      <p className="text-[11px] text-slate-500">Snap Ads Manager</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-pill text-[10px] font-bold ${
                      formData.snapchatPixelId
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {formData.snapchatPixelId ? "Actif" : "Non configuré"}
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? "معرف بيكسل سناب شات (Snap Pixel ID)" : "Identifiant Snapchat Pixel ID"}
                  </label>
                  <input
                    type="text"
                    value={formData.snapchatPixelId}
                    onChange={(e) => setFormData({ ...formData, snapchatPixelId: e.target.value })}
                    placeholder="Ex: 869df9c2-5555-46aa-bbbb-xxxxxxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Google Analytics 4 (GA4) */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    <div>
                      <h3 className="font-black text-sm text-slate-900 dark:text-white">Google Analytics 4 (GA4)</h3>
                      <p className="text-[11px] text-slate-500">Flux Web & Mesure d'audience</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-pill text-[10px] font-bold ${
                      formData.googleAnalyticsId
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {formData.googleAnalyticsId ? "Actif" : "Non configuré"}
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>{isAr ? "معرف القياس (Measurement ID)" : "ID de mesure GA4 (G-XXXXXX)"}</span>
                    {!isGa4Valid && (
                      <span className="text-rose-500 font-normal text-[10px]">Doit commencer par G-</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData.googleAnalyticsId}
                    onChange={(e) => setFormData({ ...formData, googleAnalyticsId: e.target.value })}
                    placeholder="Ex: G-XXXXXXXXXX"
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-950 font-mono text-xs outline-none ${
                      isGa4Valid
                        ? "border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-purple-500"
                        : "border-rose-500 focus:ring-2 focus:ring-rose-500"
                    }`}
                  />
                </div>
              </div>

              {/* Google Ads */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 md:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    <div>
                      <h3 className="font-black text-sm text-slate-900 dark:text-white">Google Ads (Search & Display)</h3>
                      <p className="text-[11px] text-slate-500">Suivi des conversions de formulaires et retours sur investissement</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-pill text-[10px] font-bold ${
                      formData.googleAdsId
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {formData.googleAdsId ? "Actif" : "Non configuré"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>{isAr ? "معرف الحساب (Google Ads ID)" : "ID Google Ads (AW-XXXXXX)"}</span>
                      {!isGoogleAdsValid && (
                        <span className="text-rose-500 font-normal text-[10px]">Doit commencer par AW-</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={formData.googleAdsId}
                      onChange={(e) => setFormData({ ...formData, googleAdsId: e.target.value })}
                      placeholder="Ex: AW-123456789"
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-950 font-mono text-xs outline-none ${
                        isGoogleAdsValid
                          ? "border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-purple-500"
                          : "border-rose-500 focus:ring-2 focus:ring-rose-500"
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? "رمز التحويل (Conversion Label)" : "Label de conversion (Conversion Label)"}
                    </label>
                    <input
                      type="text"
                      value={formData.googleAdsConversionLabel}
                      onChange={(e) => setFormData({ ...formData, googleAdsConversionLabel: e.target.value })}
                      placeholder="Ex: AbC_D12eF34g"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* ONGLET 2 : SCRIPTS PERSONNALISÉS                     */}
        {/* ==================================================== */}
        {activeTab === "scripts" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {isAr ? "تنبيه أمان وحقن الأكواد :" : "Injection sécurisée de balises :"}
                </p>
                <p className="text-[11px] mt-0.5">
                  {isAr
                    ? "يمكنك وضع أكواد Google Tag Manager أو Microsoft Clarity أو Chatbots الخارجية. تأكد من صحة وسوم <script> لتفادي أي أخطاء في العرض."
                    : "Ces scripts seront directement injectés dans le DOM. Vous pouvez y intégrer Google Tag Manager (GTM), Microsoft Clarity, Hotjar, Crisp Chat, etc. Veillez à inclure les balises <script> complètes."}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Head Scripts */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-purple-600" />
                    <span>{isAr ? "أكواد رأس الصفحة (<head>)" : "Scripts personnalisés dans le <head>"}</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">balise &lt;head&gt;</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isAr
                    ? "يتم حقنها في أعلى المستند (مناسبة لـ GTM، بالات التحقق وخطوط الويب)."
                    : "Exécuté en amont du chargement de la page (ex: Google Tag Manager, pixels propriétaires, vérifications de domaine)."}
                </p>
                <textarea
                  rows={6}
                  value={formData.customHeadScripts}
                  onChange={(e) => setFormData({ ...formData, customHeadScripts: e.target.value })}
                  placeholder={`<!-- Exemple: Google Tag Manager -->\n<script>(function(w,d,s,l,i){w[l]=w[l]||[];...})(window,document,'script','dataLayer','GTM-XXXX');</script>`}
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 font-mono text-xs focus:ring-2 focus:ring-purple-500 outline-none resize-y"
                  dir="ltr"
                />
              </div>

              {/* Body Scripts */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-cyan-600" />
                    <span>{isAr ? "أكواد أسفل الصفحة (<body>)" : "Scripts personnalisés dans le <body>"}</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">balise &lt;body&gt;</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isAr
                    ? "يتم حقنها في أسفل الصفحة (مناسبة لويدجت الدردشة، واتساب المباشر والتنبيهات)."
                    : "Exécuté après le rendu du contenu (ex: widgets de chat en direct, iframes de tracking, bannières d'assistance)."}
                </p>
                <textarea
                  rows={6}
                  value={formData.customBodyScripts}
                  onChange={(e) => setFormData({ ...formData, customBodyScripts: e.target.value })}
                  placeholder={`<!-- Exemple: Widget Chatbot -->\n<script type="text/javascript">\n  window.$crisp=[];\n</script>`}
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 font-mono text-xs focus:ring-2 focus:ring-cyan-500 outline-none resize-y"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* ONGLET 3 : TYPE DE CONVERSION                        */}
        {/* ==================================================== */}
        {activeTab === "conversion" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Type d'événement standard */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2.5">
                  <Target className="w-5 h-5 text-purple-600" />
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {isAr ? "الحدث القياسي المُرسل للبيكسل" : "Événement de Conversion Standard"}
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  {isAr
                    ? "اختر نوع الحدث الذي ترغب بإرساله إلى منصات الإعلانات عند قيام العميل بالحجز."
                    : "Définit l'événement de conversion émis simultanément vers Meta, TikTok, Snap et GA4 lors d'une réservation."}
                </p>

                <div className="space-y-2">
                  {[
                    { value: "lead", label: "Lead (Prospect Qualifié)", desc: "Recommandé au Maroc pour le flux réservation avec acompte par virement" },
                    { value: "purchase", label: "Purchase (Achat Confirmé)", desc: "Pour les paiements immédiats validés ou confirmation ferme" },
                    { value: "page_view", label: "PageView (Vue d'Étape)", desc: "Vue de la page d'initiation ou du reçu" },
                    { value: "contact", label: "Contact (Demande de Contact)", desc: "Idéal pour les demandes de rappel téléphonique" },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        formData.conversionEventType === opt.value
                          ? "bg-purple-500/10 border-purple-500/40 text-purple-900 dark:text-purple-200"
                          : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="conversionEventType"
                        value={opt.value}
                        checked={formData.conversionEventType === opt.value}
                        onChange={(e) => setFormData({ ...formData, conversionEventType: e.target.value })}
                        className="mt-1 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <p className="font-bold text-xs">{opt.label}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Déclencheur (Trigger) */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-5 h-5 text-cyan-600" />
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">
                      {isAr ? "لحظة إطلاق التحويل (Trigger)" : "Moment de Déclenchement (Trigger)"}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    {isAr
                      ? "تحديد اللحظة الدقيقة التي يتم فيها إرسال إشارة التحويل للخوادم الإعلانية."
                      : "Détermine quand la conversion est tirée côté client pour garantir une attribution exacte sans doublon."}
                  </p>

                  <div className="space-y-2">
                    {[
                      {
                        value: "on_submit",
                        label: "on_submit (Validation du formulaire - Recommandé)",
                        desc: "Déclenché dès que la réservation est enregistrée en base et le numéro RB attribué.",
                      },
                      {
                        value: "on_click",
                        label: "on_click (Clic sur 'Confirmer la réservation')",
                        desc: "Déclenché instantanément au clic client sur le bouton final.",
                      },
                      {
                        value: "on_page_load",
                        label: "on_page_load (Chargement de l'écran de confirmation)",
                        desc: "Déclenché lorsque l'écran de succès et téléchargement de facture s'affiche.",
                      },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          formData.conversionTriggerType === opt.value
                            ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-900 dark:text-cyan-200"
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="conversionTriggerType"
                          value={opt.value}
                          checked={formData.conversionTriggerType === opt.value}
                          onChange={(e) => setFormData({ ...formData, conversionTriggerType: e.target.value })}
                          className="mt-1 text-cyan-600 focus:ring-cyan-500"
                        />
                        <div>
                          <p className="font-bold text-xs">{opt.label}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Bouton de test direct */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleTestConversion}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-500/30 transition-all active:scale-[0.98]"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>
                      {testConversionTriggered
                        ? "✅ Événement envoyé dans la console & pixels !"
                        : "Tester le déclenchement de conversion en direct"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* ONGLET 4 : GOOGLE SHEETS                             */}
        {/* ==================================================== */}
        {activeTab === "sheets" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Toggle Switch d'activation */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {isAr ? "تفعيل المزامنة الفورية مع Google Sheets" : "Activer la synchronisation Google Sheets"}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                  {isAr
                    ? "عند تفعيل هذا الخيار، سيتم نسخ كل حجز جديد تلقائياً في جدول بيانات Google Sheets كسطر جديد مع إنشاء الأعمدة آلياً."
                    : "Chaque nouvelle réservation effectuée sur le site sera automatiquement ajoutée comme une nouvelle ligne dans votre document Google Sheets."}
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={formData.googleSheetsEnabled}
                  onChange={(e) => setFormData({ ...formData, googleSheetsEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Formulaire Google Sheets */}
            <div className={`space-y-6 transition-all ${formData.googleSheetsEnabled ? "opacity-100" : "opacity-60"}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>{isAr ? "معرف جدول بيانات جوجل (Spreadsheet ID)" : "ID du Document Google Sheets (Spreadsheet ID)"}</span>
                    <span className="text-[10px] text-slate-500">Obligatoire</span>
                  </label>
                  <input
                    type="text"
                    value={formData.googleSheetId}
                    onChange={(e) => setFormData({ ...formData, googleSheetId: e.target.value })}
                    placeholder="Ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-500">
                    Présent dans l'URL du fichier : https://docs.google.com/spreadsheets/d/<strong>[ID_ICI]</strong>/edit
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? "اسم ورقة العمل (Tab Name)" : "Nom de l'onglet (Feuille cible)"}
                  </label>
                  <input
                    type="text"
                    value={formData.googleSheetTabName}
                    onChange={(e) => setFormData({ ...formData, googleSheetTabName: e.target.value })}
                    placeholder="Réservations"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-500">
                    Nom de l'onglet en bas de votre Google Sheet (par défaut : Réservations).
                  </p>
                </div>
              </div>

              {/* Sélecteur de méthode d'authentification */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <button
                    type="button"
                    onClick={() => setSheetsAuthMode("service_account")}
                    className={`text-xs font-bold pb-2 transition-all border-b-2 -mb-[10px] ${
                      sheetsAuthMode === "service_account"
                        ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                        : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Méthode 1 : Clé Compte de Service Google (JSON)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSheetsAuthMode("webhook")}
                    className={`text-xs font-bold pb-2 transition-all border-b-2 -mb-[10px] ${
                      sheetsAuthMode === "webhook"
                        ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                        : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Méthode 2 : URL Webhook (Apps Script / Make / n8n)
                  </button>
                </div>

                {sheetsAuthMode === "service_account" ? (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>{isAr ? "محتوى ملف JSON لحساب الخدمة" : "Contenu JSON du Compte de Service (Service Account)"}</span>
                      <span className="text-[10px] text-slate-500">Google Cloud Console</span>
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Téléchargez le fichier JSON de clé depuis la console Google Cloud (IAM &gt; Comptes de service),
                      puis partagez votre feuille Google Sheet avec l'adresse <code>client_email</code> en tant
                      qu'<strong>Éditeur</strong>.
                    </p>
                    <textarea
                      rows={6}
                      value={formData.googleSheetsCredentials}
                      onChange={(e) => setFormData({ ...formData, googleSheetsCredentials: e.target.value })}
                      placeholder={`{\n  "type": "service_account",\n  "project_id": "mon-projet",\n  "private_key_id": "...",\n  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",\n  "client_email": "rahalat-sync@mon-projet.iam.gserviceaccount.com"\n}`}
                      className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-y"
                      dir="ltr"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? "رابط الويب هوك (Webhook URL)" : "URL du Webhook de Réception (Make / n8n / Apps Script)"}
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Idéal si vous préférez router vos réservations via un webhook Google Apps Script Web App, un
                      scénario Make.com, n8n ou Zapier sans manipuler de clé Google Cloud.
                    </p>
                    <input
                      type="url"
                      value={formData.googleSheetsWebhookUrl}
                      onChange={(e) => setFormData({ ...formData, googleSheetsWebhookUrl: e.target.value })}
                      placeholder="https://script.google.com/macros/s/AKfycby.../exec ou https://hook.eu1.make.com/..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Bouton de test de connexion Google Sheets */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/30">
                <div className="space-y-0.5">
                  <p className="font-black text-xs text-slate-900 dark:text-white">
                    {isAr ? "اختبار الربط مع جدول جوجل" : "Validation de l'intégration"}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr
                      ? "يتحقق النظام فورياً من صحة الصلاحيات وإمكانية القراءة والكتابة."
                      : "Vérifie immédiatement la validité du jeton JWT, les droits d'écriture et l'existence du classeur."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTestGoogleSheets}
                  disabled={isTestingSheets}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 shrink-0"
                >
                  {isTestingSheets ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isAr ? "جاري الاختبار..." : "Test en cours..."}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{isAr ? "اختبار الاتصال الآن" : "Tester la connexion"}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Résultat du test */}
              {sheetsTestResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs flex items-start gap-3 animate-fadeIn ${
                    sheetsTestResult.success
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-500/40 text-rose-800 dark:text-rose-300"
                  }`}
                >
                  {sheetsTestResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">
                      {sheetsTestResult.success ? "Test Réussi avec Succès !" : "Échec du test de connexion :"}
                    </p>
                    <p className="mt-0.5">{sheetsTestResult.message || sheetsTestResult.error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bouton de sauvegarde inférieur */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white font-black text-xs sm:text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{isAr ? "جاري الحفظ..." : "Enregistrement..."}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isAr ? "حفظ التغييرات" : "Enregistrer les Paramètres"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TrackingSettingsManager;
