"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import {
  FileText,
  Building2,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Download,
  Sparkles,
  Plus,
  Send,
  Trash2,
  ArrowRightLeft,
  MessageCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { DocumentType, DocumentStatus } from "@/types/finance";
import { InvoiceDownloadButton } from "@/components/invoices/InvoiceDownloadButton";
import { formatMAD } from "@/lib/utils";
import { ExcelExportButton } from "../excel/ExcelExportButtons";
import { NewFinancialDocumentModal } from "./NewFinancialDocumentModal";
import {
  updateFinancialDocumentStatusAction,
  convertQuoteToInvoiceAction,
  deleteFinancialDocumentAction,
} from "@/actions/finance.actions";

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
  ice?: string;
  taxId?: string;
  rcNumber?: string;
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
  isFinancialDocument?: boolean;
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<DocumentType>(DocumentType.QUOTE_B2B);

  // Loading States
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const currentList = activeTab === "INVOICES" ? invoices : quotes;

  const filteredList = currentList.filter((doc) => {
    const matchesSearch =
      doc.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.clientCompany && doc.clientCompany.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.ice && doc.ice.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.tripTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.bookingId && doc.bookingId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ||
      doc.status === statusFilter ||
      (statusFilter === "PAID" && (doc.status === "PAYEE" || doc.status === "PAID")) ||
      (statusFilter === "SENT" && (doc.status === "ENVOYE" || doc.status === "EMISE" || doc.status === "SENT")) ||
      (statusFilter === "ACCEPTED" && (doc.status === "ACCEPTE" || doc.status === "ACCEPTED")) ||
      (statusFilter === "DRAFT" && (doc.status === "BROUILLON" || doc.status === "DRAFT"));

    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = (type: DocumentType) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (docId: string, newStatus: DocumentStatus) => {
    try {
      const res = await updateFinancialDocumentStatusAction(docId, newStatus);
      if (res.success) {
        setActionNotice({
          type: "success",
          msg: `Statut mis à jour avec succès : ${newStatus}`,
        });
        setTimeout(() => setActionNotice(null), 3000);
      } else {
        setActionNotice({ type: "error", msg: res.error || "Erreur de mise à jour" });
      }
    } catch (e: any) {
      setActionNotice({ type: "error", msg: e.message });
    }
  };

  const handleConvertQuote = async (quoteId: string, quoteNumber: string) => {
    if (!confirm(`Souhaitez-vous valider le devis ${quoteNumber} et générer la facture officielle correspondante ?`)) {
      return;
    }

    try {
      setConvertingId(quoteId);
      const res = await convertQuoteToInvoiceAction(quoteId);
      if (res.success && res.invoiceNumber) {
        setActionNotice({
          type: "success",
          msg: `Devis validé ! Facture ${res.invoiceNumber} générée avec succès.`,
        });
        setActiveTab("INVOICES");
      } else {
        setActionNotice({ type: "error", msg: res.error || "Erreur lors de la conversion" });
      }
    } catch (e: any) {
      setActionNotice({ type: "error", msg: e.message });
    } finally {
      setConvertingId(null);
    }
  };

  const handleDelete = async (docId: string, docNumber: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement le document ${docNumber} ?`)) {
      return;
    }
    try {
      const res = await deleteFinancialDocumentAction(docId);
      if (res.success) {
        setActionNotice({ type: "success", msg: `Document ${docNumber} supprimé.` });
        setTimeout(() => setActionNotice(null), 3000);
      } else {
        setActionNotice({ type: "error", msg: res.error || "Erreur de suppression" });
      }
    } catch (e: any) {
      setActionNotice({ type: "error", msg: e.message });
    }
  };

  const getWhatsAppShareUrl = (doc: InvoiceDocItem) => {
    const phone = (doc.clientPhone || "").replace(/\D/g, "");
    const cleanPhone = phone.startsWith("0") ? `212${phone.slice(1)}` : phone.startsWith("212") ? phone : `212${phone}`;
    
    const docName = doc.type === "DEVIS" ? "votre Devis B2B" : "votre Facture";
    const text = `Bonjour ${doc.clientName},\n\nVoici le récapitulatif pour ${docName} Rahalat Bladna :\n• Réf : *${doc.invoiceNumber}*\n• Circuit : *${doc.tripTitle}*\n• Date : ${doc.travelDates}\n• Montant Total : *${doc.totalTtcMad.toLocaleString("fr-FR")} MAD*\n${doc.depositPaidMad > 0 ? `• Acompte versé : ${doc.depositPaidMad.toLocaleString("fr-FR")} MAD\n• Solde dû au départ : ${doc.remainingBalanceMad.toLocaleString("fr-FR")} MAD\n` : ""}\nVous pouvez consulter ou télécharger le document officiel ici :\nhttps://rahalatbladna.ma/api/invoices/${doc.invoiceNumber}/download\n\nCordialement,\nÉquipe Rahalat Bladna`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-4">
      {/* Feedback Notice */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
            actionNotice.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
              : "bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            )}
            <span>{actionNotice.msg}</span>
          </div>
          <button type="button" onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4 transition-colors">
        
        {/* Header & Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{isAr ? "المستندات المالية والمحاسبية" : "Documents Financiers & Comptabilité"}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold font-mono">
                {invoices.length + quotes.length} docs
              </span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {isAr
                ? "إدارة متكاملة لفواتير الزبناء وعروض الأسعار للشركات مع أرشفة Cloudflare R2."
                : "Gestion complète des factures clients, devis entreprises (B2B avec ICE) et archivage R2."}
            </p>
          </div>

          {/* Action Buttons & Document Creation */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleOpenModal(DocumentType.QUOTE_B2B)}
              className="px-4 py-2.5 rounded-2xl bg-tp-cyan hover:bg-tp-cyan-hover text-white dark:text-slate-950 font-black text-xs shadow-tp-cyan transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Nouveau Devis B2B</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenModal(DocumentType.INVOICE)}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-tp-cyan" />
              <span>+ Nouvelle Facture</span>
            </button>

            <ExcelExportButton
              type="FINANCES"
              label={isAr ? "تصدير (.xlsx)" : "Export Excel"}
              variant="secondary"
            />
          </div>
        </div>

        {/* Tab Switcher & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
          
          {/* Tab buttons */}
          <div className="flex bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("INVOICES")}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-black transition flex items-center justify-center gap-2 ${
                activeTab === "INVOICES"
                  ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-tp-cyan" />
              <span>{isAr ? `الفواتير الرسمية (${invoices.length})` : `Factures Officielles (${invoices.length})`}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("QUOTES")}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-black transition flex items-center justify-center gap-2 ${
                activeTab === "QUOTES"
                  ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isAr ? `عروض الأسعار (${quotes.length})` : `Devis B2B (${quotes.length})`}</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-2.5" />
              <input
                type="text"
                placeholder={isAr ? "بحث بالرقم أو اسم العميل أو ICE..." : "Rechercher numéro, client, ICE..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ps-8 pe-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-tp-cyan"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-1.5 outline-none focus:border-tp-cyan"
              >
                <option value="ALL">{isAr ? "جميع الحالات" : "Tous statuts"}</option>
                {activeTab === "INVOICES" ? (
                  <>
                    <option value="PAID">Payée (100%)</option>
                    <option value="SENT">Émise (Acompte)</option>
                    <option value="DRAFT">Brouillon</option>
                    <option value="CANCELLED">Annulée</option>
                  </>
                ) : (
                  <>
                    <option value="SENT">Envoyé</option>
                    <option value="ACCEPTED">Accepté</option>
                    <option value="DRAFT">Brouillon</option>
                    <option value="REJECTED">Refusé</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {filteredList.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-400 mx-auto flex items-center justify-center">
              {activeTab === "INVOICES" ? <FileText className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              {isAr
                ? "لا توجد أي مستندات مطابقة في هذا القسم"
                : `Aucun document trouvé dans la section ${activeTab === "INVOICES" ? "Factures" : "Devis B2B"}.`}
            </p>
            <button
              type="button"
              onClick={() => handleOpenModal(activeTab === "INVOICES" ? DocumentType.INVOICE : DocumentType.QUOTE_B2B)}
              className="px-4 py-2 rounded-xl bg-tp-cyan/10 text-tp-cyan hover:bg-tp-cyan/20 font-bold text-xs transition inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{activeTab === "INVOICES" ? "Créer une première facture" : "Créer un premier devis B2B"}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start text-slate-700 dark:text-slate-300">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold bg-slate-50 dark:bg-slate-900/50">
                  <th className="py-3 px-3 text-start">{isAr ? "المرجع والتاريخ" : "Réf & Date"}</th>
                  <th className="py-3 px-3 text-start">{isAr ? "العميل / الشركة" : "Client / Société B2B"}</th>
                  <th className="py-3 px-3 text-start">{isAr ? "الرحلة / البرنامج" : "Prestation & Date"}</th>
                  <th className="py-3 px-3 text-start">
                    {activeTab === "INVOICES" ? "Montant TTC / Solde" : "Montant Estimatif"}
                  </th>
                  <th className="py-3 px-3 text-center">{isAr ? "الحالة" : "Statut"}</th>
                  <th className="py-3 px-3 text-end">{isAr ? "الإجراءات" : "Actions & PDF"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredList.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition group">
                    
                    {/* Document Number & Date */}
                    <td className="py-3.5 px-3">
                      <p className="font-mono font-black text-tp-cyan-hover dark:text-tp-cyan text-xs sm:text-sm">
                        {doc.invoiceNumber}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{doc.issuedAt}</span>
                      </p>
                    </td>

                    {/* Client & Company */}
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-slate-900 dark:text-white text-xs">
                        {doc.clientName}
                      </p>
                      {doc.clientCompany && (
                        <p className="text-[11px] text-tp-cyan font-bold flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[170px]">{doc.clientCompany}</span>
                        </p>
                      )}
                      {doc.ice && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          ICE: <span className="font-bold">{doc.ice}</span>
                        </p>
                      )}
                    </td>

                    {/* Trip & Travelers */}
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[220px]">
                        {doc.tripTitle}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {doc.passengerCount} pers. • {doc.travelDates}
                      </p>
                    </td>

                    {/* Financial Figures */}
                    <td className="py-3.5 px-3">
                      <p className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                        {formatMAD(doc.totalTtcMad, locale)}
                      </p>
                      {activeTab === "INVOICES" && (
                        <div className="text-[10px] mt-0.5 space-y-0.5">
                          {doc.depositPaidMad > 0 && (
                            <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                              Acompte: {formatMAD(doc.depositPaidMad, locale)}
                            </p>
                          )}
                          {doc.remainingBalanceMad > 0 ? (
                            <p className="text-amber-600 dark:text-amber-400 font-bold">
                              Solde: {formatMAD(doc.remainingBalanceMad, locale)}
                            </p>
                          ) : (
                            <p className="text-emerald-600 font-bold">Soldé 100%</p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status Pill with Quick Switcher if FinancialDocument */}
                    <td className="py-3.5 px-3 text-center">
                      {doc.isFinancialDocument ? (
                        <div className="inline-block relative">
                          <select
                            value={doc.status}
                            onChange={(e) => handleStatusChange(doc.id, e.target.value as DocumentStatus)}
                            className={`text-[10px] font-black rounded-full px-2.5 py-1 border outline-none cursor-pointer ${
                              doc.status === "PAID" || doc.status === "PAYEE"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : doc.status === "ACCEPTED" || doc.status === "ACCEPTE"
                                ? "bg-tp-cyan/15 text-tp-cyan font-black border-tp-cyan/30"
                                : doc.status === "SENT" || doc.status === "ENVOYE" || doc.status === "PARTIELLEMENT_PAYEE"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                            }`}
                          >
                            {activeTab === "QUOTES" ? (
                              <>
                                <option value="SENT">Envoyé</option>
                                <option value="ACCEPTED">Accepté</option>
                                <option value="DRAFT">Brouillon</option>
                                <option value="REJECTED">Refusé</option>
                                <option value="CANCELLED">Annulé</option>
                              </>
                            ) : (
                              <>
                                <option value="SENT">Émise</option>
                                <option value="PAID">Payée (Soldée)</option>
                                <option value="DRAFT">Brouillon</option>
                                <option value="CANCELLED">Annulée</option>
                              </>
                            )}
                          </select>
                        </div>
                      ) : (
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                            doc.status === "PAYEE" || doc.status === "PAID"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {doc.status}
                        </span>
                      )}
                    </td>

                    {/* Actions & PDF Downloads */}
                    <td className="py-3.5 px-3 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Convert Quote to Invoice Button */}
                        {activeTab === "QUOTES" && (
                          <button
                            type="button"
                            onClick={() => handleConvertQuote(doc.id, doc.invoiceNumber)}
                            disabled={convertingId === doc.id}
                            title="Valider et convertir en Facture officielle"
                            className="px-2 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold flex items-center gap-1 transition"
                          >
                            {convertingId === doc.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <ArrowRightLeft className="w-3 h-3" />
                            )}
                            <span className="hidden md:inline">Facturer</span>
                          </button>
                        )}

                        {/* WhatsApp share */}
                        {doc.clientPhone && (
                          <a
                            href={getWhatsAppShareUrl(doc)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Envoyer les détails par WhatsApp"
                            className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition flex items-center"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* Download PDF button */}
                        <InvoiceDownloadButton
                          invoiceNumber={doc.invoiceNumber}
                          type={doc.type}
                          variant="cyan"
                          label="PDF"
                          className="py-1 px-2.5 text-[11px]"
                        />

                        {/* Delete for FinancialDocuments */}
                        {doc.isFinancialDocument && (
                          <button
                            type="button"
                            onClick={() => handleDelete(doc.id, doc.invoiceNumber)}
                            title="Supprimer ce document"
                            className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      <NewFinancialDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType={modalType}
        onCreated={() => {
          setIsModalOpen(false);
          setActionNotice({
            type: "success",
            msg: "Nouveau document généré et archivé sur Cloudflare R2 avec succès !",
          });
        }}
      />
    </div>
  );
}
