"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { 
  FileText, Building2, CheckCircle2, Clock, 
  Search, Filter, ShieldCheck, Download, Sparkles 
} from "lucide-react";
import { InvoiceDownloadButton } from "@/components/invoices/InvoiceDownloadButton";
import { formatMAD } from "@/lib/utils";
import { ExcelExportButton } from "../excel/ExcelExportButtons";

export interface InvoiceDocItem {
  id: string;
  invoiceNumber: string;
  bookingId: string | null;
  type: "FACTURE_SOLDE" | "FACTURE_ACOMPTE" | "DEVIS";
  status: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  clientCompany?: string;
  clientCin?: string;
  tripTitle: string;
  travelDates: string;
  passengerCount: number;
  totalHt: number;
  tvaAmount: number;
  totalTtcMad: number;
  depositPaidMad: number;
  remainingBalanceMad: number;
  pdfUrl?: string;
  issuedAt: string;
}

interface FinanceDocumentsManagerProps {
  invoices: InvoiceDocItem[];
  quotes: InvoiceDocItem[];
}

export function FinanceDocumentsManager({
  invoices,
  quotes,
}: FinanceDocumentsManagerProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [activeTab, setActiveTab] = useState<"INVOICES" | "QUOTES">("INVOICES");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const currentList = activeTab === "INVOICES" ? invoices : quotes;

  const filteredList = currentList.filter((doc) => {
    const matchesSearch =
      doc.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tripTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.bookingId && doc.bookingId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || doc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4 transition-colors">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            {isAr ? "المستندات المالية والمحاسبية" : "Documents Financiers & Comptabilité"}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {isAr
              ? "فصل دقيق بين الفواتير الرسمية المستحقة وعروض الأسعار التقديرية للشركات."
              : "Séparation stricte entre factures réelles émises et devis estimatifs B2B."}
          </p>
        </div>

        {/* Actions & Tab Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <ExcelExportButton
            type="FINANCES"
            label={isAr ? "تصدير المحاسبة (.xlsx)" : "Grand Livre Excel (.xlsx)"}
            variant="secondary"
          />

          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab("INVOICES")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                activeTab === "INVOICES"
                  ? "bg-tp-cyan text-white dark:text-slate-950 shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isAr ? `الفواتير الرسمية (${invoices.length})` : `Factures Officielles (${invoices.length})`}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("QUOTES")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                activeTab === "QUOTES"
                  ? "bg-tp-cyan text-white dark:text-slate-950 shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? `عروض الأسعار (${quotes.length})` : `Devis B2B (${quotes.length})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
          <input
            type="text"
            placeholder={isAr ? "بحث بالرقم أو اسم العميل..." : "Rechercher numéro, client, circuit..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-9 pe-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-tp-cyan"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-1.5 outline-none focus:border-tp-cyan"
          >
            <option value="ALL">{isAr ? "جميع الحالات" : "Tous les statuts"}</option>
            {activeTab === "INVOICES" ? (
              <>
                <option value="PAYEE">Payée (Solde 100%)</option>
                <option value="PARTIELLEMENT_PAYEE">Partiellement Payée (Acompte)</option>
                <option value="EMISE">Émise</option>
                <option value="ANNULEE">Annulée</option>
              </>
            ) : (
              <>
                <option value="ACCEPTE">Accepté</option>
                <option value="ENVOYE">Envoyé</option>
                <option value="BROUILLON">Brouillon</option>
                <option value="EXPIRE">Expiré</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Table Content */}
      {filteredList.length === 0 ? (
        <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs">
          {isAr
            ? "لا توجد أي مستندات مطابقة لهذا البحث"
            : `Aucun document trouvé dans la section ${activeTab === "INVOICES" ? "Factures" : "Devis"}`}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start text-slate-700 dark:text-slate-300">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold bg-slate-50 dark:bg-slate-900/50">
                <th className="py-3.5 px-4 text-start">{isAr ? "المرجع" : "Référence N°"}</th>
                <th className="py-3.5 px-4 text-start">{isAr ? "العميل / الشركة" : "Client / Société"}</th>
                <th className="py-3.5 px-4 text-start">{isAr ? "الرحلة & التاريخ" : "Circuit & Date"}</th>
                <th className="py-3.5 px-4 text-start">
                  {activeTab === "INVOICES" ? (isAr ? "المبلغ المفوتر (TTC)" : "Montant Facturé (TTC)") : (isAr ? "المبلغ التقديري" : "Montant Estimatif")}
                </th>
                <th className="py-3.5 px-4 text-center">{isAr ? "الحالة" : "Statut"}</th>
                <th className="py-3.5 px-4 text-end">{isAr ? "المستند" : "Téléchargement"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredList.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition group">
                  <td className="py-3.5 px-4">
                    <p className="font-mono font-bold text-tp-cyan-hover dark:text-tp-cyan text-xs sm:text-sm">
                      {doc.invoiceNumber}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {doc.issuedAt}
                    </p>
                  </td>

                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {doc.clientName}
                    </p>
                    {doc.clientCompany && (
                      <p className="text-[11px] text-tp-cyan-hover dark:text-tp-cyan font-bold flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span>{doc.clientCompany}</span>
                      </p>
                    )}
                    {doc.clientCin && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">CIN: {doc.clientCin}</p>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {doc.tripTitle}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {doc.passengerCount} {isAr ? "مسافر" : "voyageur(s)"} • {doc.travelDates}
                    </p>
                  </td>

                  <td className="py-3.5 px-4">
                    <p className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                      {formatMAD(doc.totalTtcMad, locale)}
                    </p>
                    {activeTab === "INVOICES" && doc.depositPaidMad > 0 && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        {isAr ? "التسبيق :" : "Acompte :"} {formatMAD(doc.depositPaidMad, locale)}
                      </p>
                    )}
                    {activeTab === "INVOICES" && doc.remainingBalanceMad > 0 && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                        {isAr ? "الباقي :" : "Solde :"} {formatMAD(doc.remainingBalanceMad, locale)}
                      </p>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {doc.status === "PAYEE" || doc.status === "PAYE" ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {isAr ? "مدفوع بالكامل" : "Soldé (100%)"}
                      </span>
                    ) : doc.status === "PARTIELLEMENT_PAYEE" ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        {isAr ? "تسبيق مسدد" : "Acompte Reçu"}
                      </span>
                    ) : doc.type === "DEVIS" ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-tp-cyan/10 text-tp-cyan-hover dark:text-tp-cyan border border-tp-cyan/30">
                        {doc.status === "ACCEPTE" ? "Accepté" : doc.status === "ENVOYE" ? "Envoyé" : "Brouillon"}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {doc.status}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-end">
                    <InvoiceDownloadButton
                      invoiceNumber={doc.invoiceNumber}
                      type={doc.type}
                      variant="cyan"
                      label={doc.type === "DEVIS" ? "Devis PDF" : "Facture PDF"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
