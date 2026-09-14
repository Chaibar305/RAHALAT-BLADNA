import React from "react";
import Link from "next/link";
import { getInvoicesListAction } from "@/actions/invoice.actions";
import { FinanceDocumentsManager } from "@/components/admin/finances/FinanceDocumentsManager";
import { 
  CreditCard, TrendingUp, CheckCircle2, Clock, Sparkles 
} from "lucide-react";
import { formatMAD } from "@/lib/utils";
import { requireAdminSession } from "@/lib/adminAuth";

export default async function AdminFinancesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdminSession("ADMIN_FINANCES_PAGE", locale);

  const isAr = locale === "ar";
  const result = await getInvoicesListAction();
  
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

        <div className="flex items-center gap-3 z-10">
          <Link
            href={`/${locale}/trips`}
            className="px-5 py-3 rounded-2xl bg-tp-cyan hover:bg-tp-cyan-hover text-white dark:text-slate-950 font-black text-xs sm:text-sm shadow-tp-cyan transition-all active:scale-95 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAr ? "إنشاء حجز / فاتورة جديدة" : "Nouveau Devis B2B"}</span>
          </Link>
        </div>
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

      {/* Interactive Table with strict separation between Factures and Devis */}
      <FinanceDocumentsManager
        invoices={invoices}
        quotes={quotes}
      />
    </div>
  );
}
