"use client";

import React, { useState } from "react";
import { FileSpreadsheet, Download, Loader2, AlertCircle } from "lucide-react";
import { exportManifestExcelAction, exportFinancesExcelAction, getPassengerImportTemplateAction } from "@/actions/excel.actions";

interface ExcelExportButtonProps {
  type: "MANIFEST" | "FINANCES" | "TEMPLATE";
  tripId?: string;
  label?: string;
  variant?: "primary" | "secondary" | "outline" | "compact";
  className?: string;
}

export function ExcelExportButton({
  type,
  tripId,
  label,
  variant = "outline",
  className = "",
}: ExcelExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadBase64Blob = (base64: string, filename: string, mimeType: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);
  };

  const handleExport = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setIsExporting(true);
      setError(null);

      if (type === "TEMPLATE") {
        // Téléchargement direct fiable via l'API route dédiée
        const response = await fetch("/api/admin/excel/template");
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "modele_import_voyageurs_rahalat_bladna.xlsx";
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, 200);
          return;
        }
      }

      let res: any;
      if (type === "MANIFEST") {
        if (!tripId) {
          setError("Identifiant du circuit requis.");
          setIsExporting(false);
          return;
        }
        res = await exportManifestExcelAction(tripId);
      } else if (type === "FINANCES") {
        res = await exportFinancesExcelAction();
      } else if (type === "TEMPLATE") {
        res = await getPassengerImportTemplateAction();
      }

      if (res?.success && res.base64) {
        downloadBase64Blob(res.base64, res.filename, res.mimeType);
      } else {
        setError(res?.error || "Erreur lors de l'export.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur inattendue.");
    } finally {
      setIsExporting(false);
    }
  };

  const getButtonStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md";
      case "secondary":
        return "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs";
      case "compact":
        return "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs px-3 py-2 font-bold";
      case "outline":
      default:
        return "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-xs";
    }
  };

  const getDefaultLabel = () => {
    if (label) return label;
    switch (type) {
      case "MANIFEST":
        return "Exporter Manifeste (.xlsx)";
      case "FINANCES":
        return "Grand Livre Excel (.xlsx)";
      case "TEMPLATE":
        return "Télécharger Modèle Excel (.xlsx)";
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${getButtonStyles()} ${className}`}
        title={getDefaultLabel()}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
        ) : (
          <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        )}
        <span className="font-bold text-xs">{isExporting ? "Téléchargement..." : getDefaultLabel()}</span>
        <Download className="w-3.5 h-3.5 opacity-70 ml-1" />
      </button>

      {error && (
        <span className="text-[11px] text-red-400 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </span>
      )}
    </div>
  );
}
