"use client";

import React, { useState } from "react";
import { Download, FileText, Loader2, CheckCircle2 } from "lucide-react";

interface InvoiceDownloadButtonProps {
  invoiceNumber: string;
  type?: "FACTURE" | "DEVIS" | "FACTURE_ACOMPTE" | "FACTURE_SOLDE";
  isPartnerDocument?: boolean;
  label?: string;
  variant?: "primary" | "outline" | "cyan" | "slate";
  className?: string;
}

export function InvoiceDownloadButton({
  invoiceNumber,
  type = "FACTURE",
  isPartnerDocument,
  label,
  variant = "primary",
  className = "",
}: InvoiceDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const defaultLabel = label || (type === "DEVIS" ? "Télécharger le Devis PDF" : "Télécharger la Facture PDF");

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const isPartner = isPartnerDocument !== undefined ? isPartnerDocument : type === "DEVIS";
      const downloadUrl = `/api/invoices/${invoiceNumber}/download?partner=${isPartner}`;
      
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error("Erreur de téléchargement");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setIsDone(true);
      setTimeout(() => setIsDone(false), 2500);
    } catch (err) {
      console.error(err);
      alert("Erreur lors du téléchargement du document PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "cyan":
        return "bg-tp-cyan hover:bg-tp-cyan-hover text-slate-950 shadow-tp-cyan";
      case "slate":
        return "bg-slate-900 hover:bg-slate-800 text-white border border-slate-700";
      case "outline":
        return "bg-transparent text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-tp-cyan hover:bg-tp-cyan/5";
      case "primary":
      default:
        return "bg-slate-950 hover:bg-slate-900 text-white border border-slate-800 hover:border-tp-cyan/40 shadow-md";
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isDownloading}
      className={`inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all duration-200 active:scale-95 disabled:opacity-60 ${getVariantStyles()} ${className}`}
    >
      {isDownloading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-tp-cyan" />
      ) : isDone ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <FileText className="w-3.5 h-3.5 text-tp-cyan" />
      )}

      <span>{isDownloading ? "Génération PDF..." : isDone ? "Téléchargé !" : defaultLabel}</span>
      {!isDownloading && !isDone && <Download className="w-3 h-3 opacity-60" />}
    </button>
  );
}
