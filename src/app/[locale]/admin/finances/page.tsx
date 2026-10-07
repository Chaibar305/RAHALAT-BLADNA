import React from "react";
import Link from "next/link";
import { getInvoicesListAction } from "@/actions/invoice.actions";
import { FinanceDocumentsManager } from "@/components/admin/finances/FinanceDocumentsManager";
import { FinanceHeaderActions } from "@/components/admin/finances/FinanceHeaderActions";
import { 
  CreditCard, TrendingUp, CheckCircle2, Clock, Sparkles, Building2, ExternalLink, ShieldCheck 
} from "lucide-react";
import { formatMAD } from "@/lib/utils";
import { requireAdminSession } from "@/lib/adminAuth";
import { getAgencySettingsAction } from "@/actions/agency.actions";

export default async function AdminFinancesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdminSession("ADMIN_FINANCES_PAGE", locale);

  const isAr = locale === "ar";
  const result = await getInvoicesListAction();
  const agencySettings = await getAgencySettingsAction();
  
  const invoices = result.invoices || [];
  const quotes = result.quotes || [];
  const summary = result.summary || {
    totalFactureTtc: 0,
    totalAcomptesEncaisses: 0,
    totalSoldesAEncaisser: 0,
    totalQuotesTtc: 0,
    invoicesCount: 0,
    quotesCount: 0,
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-tp-cyan/10 border border-tp-cyan/30 text-tp-cyan-hover dark:text-tp-cyan text-xs font-black uppercase tracking-wider">
            <CreditCard className="w-3.5 h-3.5" />
            <span>{isAr ? "المالية والفواتير الرسمية" : "Gestion Financière & Comptabilité"}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {isAr ? "سجل الفواتير وعروض الأسعار (Devis)" : "Facturation & Devis Officiels"}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {isAr
              ? "إصدار وتنزيل فواتير التسبيق، تسوية الحسابات مع الشركاء وعروض أسعار الشركات."
              : "Émission automatique des factures d'acomptes, archivage Cloudflare R2 et devis B2B."}
          </p>
        </div>

        <FinanceHeaderActions locale={locale} />
      </div>

      {/* KPI Cards : CALCULÉS STRICTEMENT SUR LES FACTURES RÉELLES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>{isAr ? "إجمالي الفواتير الصادرة" : "Total Facturé (TTC)"}</span>
            <div className="p-2 rounded-xl bg-tp-cyan/10 text-tp-cyan">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {formatMAD(summary.totalFactureTtc, locale)}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isAr ? `من ${summary.invoicesCount} فاتورة مؤكدة` : `${summary.invoicesCount} facture(s) officielle(s) émise(s)`}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>{isAr ? "الأقساط والتسبيقات المحصلة" : "Acomptes Encaissés"}</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatMAD(summary.totalAcomptesEncaisses, locale)}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isAr ? "مبالغ التسبيق المؤكدة" : "Trésorerie garantie en banque"}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>{isAr ? "البواقي المستحقة للتحصيل" : "Soldes à Encaisser"}</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {formatMAD(summary.totalSoldesAEncaisser, locale)}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isAr ? "تؤدى عند الانطلاق بالحافلة" : "À régler au départ de l'autocar"}
          </p>
        </div>
      </div>

      {/* Official Agency Coordinates & Payment RIB Card for Invoices & Quotes */}
      <div className="bg-white dark:bg-slate-950 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-tp-cyan/15 text-tp-cyan-hover dark:text-tp-cyan flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {isAr ? "بيانات الإيداع والفوترة الرسمية للوكالة" : "Coordonnées Officielles & Règlement Bancaire des Devis/Factures"}
                </h3>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-pill border border-emerald-500/20">
                  {isAr ? "مفعل بالـ PDF" : "Actif sur PDF"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? "تظهر هذه المعلومات تلقائياً في ترويسة وتذييل الفواتير وعروض الأسعار مع الحساب البنكي لتحصيل الأقساط."
                  : "Ces coordonnées et le RIB sont injectés automatiquement sur l'en-tête, le pied de page et l'encadré de règlement."}
              </p>
            </div>
          </div>

          <Link
            href={`/${locale}/admin/settings`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-tp-cyan-hover dark:text-tp-cyan hover:underline self-start md:self-auto shrink-0"
          >
            <span>{isAr ? "تعديل البيانات في الإعدادات" : "Modifier dans les Paramètres"}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider mb-1">
              {isAr ? "الاسم التجاري / Émetteur" : "Raison Sociale"}
            </span>
            <p className="font-black text-slate-900 dark:text-white text-sm">
              {agencySettings.companyName}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {agencySettings.address || `${agencySettings.city}, Maroc`}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider mb-1">
              {isAr ? "المعرفات القانونية" : "Identifiants Légaux"}
            </span>
            <p className="font-mono font-bold text-slate-900 dark:text-white text-xs">
              ICE : {agencySettings.ice || "Non renseigné"}
            </p>
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
              {[agencySettings.rc ? `RC: ${agencySettings.rc}` : null, agencySettings.licenseNumber ? `Agr: ${agencySettings.licenseNumber}` : null].filter(Boolean).join(" • ") || "RC & Agrément Ministère"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 sm:col-span-2">
            <span className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400 block tracking-wider mb-1 flex items-center justify-between">
              <span>{isAr ? "الحساب البنكي لتحصيل الأقساط (RIB)" : "RIB Bancaire pour Règlement des Acomptes"}</span>
              <span className="font-mono text-[10px]">{agencySettings.bankName || "Attijariwafa / CIH"}</span>
            </span>
            <p className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm tracking-wide">
              {agencySettings.bankRib ? agencySettings.bankRib.replace(/(\d{3})(\d{3})(\d{16})(\d{2})/, "$1 $2 $3 $4") : "Non configuré"}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Bénéficiaire officiel : <strong className="text-slate-700 dark:text-slate-300">{agencySettings.companyName}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Table with strict separation between Factures and Devis */}
      <FinanceDocumentsManager
        invoices={invoices}
        quotes={quotes}
      />
    </div>
  );
}
