"use client";

import React, { useState, useRef } from "react";
import { useLocale } from "next-intl";
import { 
  Upload, FileSpreadsheet, X, Download, AlertCircle, 
  CheckCircle2, Loader2, Users, Building2, Bus, Waves, 
  ArrowRight, RefreshCw, FileText
} from "lucide-react";
import { 
  parsePartnersExcelFile, 
  downloadPartnersImportTemplate, 
  ImportPartnerRecord, 
  formatPartnerTypeLabel 
} from "@/lib/excel/partnerExcelService";
import { bulkImportPartnersAction } from "@/actions/partner.actions";

interface ImportPartnersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export function ImportPartnersModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportPartnersModalProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [parsedRecords, setParsedRecords] = useState<ImportPartnerRecord[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [totalRowsDetected, setTotalRowsDetected] = useState(0);
  const [importResult, setImportResult] = useState<{ success: boolean; count: number; errors?: string[] } | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setSelectedFile(null);
    setParsedRecords([]);
    setParseErrors([]);
    setTotalRowsDetected(0);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processFile = async (file: File) => {
    if (!file) return;

    setSelectedFile(file);
    setIsParsing(true);
    setImportResult(null);

    try {
      const result = await parsePartnersExcelFile(file);
      setParsedRecords(result.validRecords);
      setParseErrors(result.errors);
      setTotalRowsDetected(result.totalRows);
    } catch (err: any) {
      setParseErrors([err.message || "Erreur lors de la lecture du fichier Excel."]);
      setParsedRecords([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteImport = async () => {
    if (parsedRecords.length === 0) return;

    setIsImporting(true);
    try {
      const res = await bulkImportPartnersAction(parsedRecords);
      if (res.success) {
        setImportResult({
          success: true,
          count: res.count || 0,
          errors: res.errors,
        });
        onSuccess(res.count || 0);
      } else {
        setImportResult({
          success: false,
          count: 0,
          errors: [res.error || "Erreur lors de l'enregistrement en base."],
        });
      }
    } catch (err: any) {
      setImportResult({
        success: false,
        count: 0,
        errors: [err.message || "Erreur technique."],
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-2xl w-full space-y-6 shadow-2xl max-h-[92dvh] overflow-y-auto relative my-auto transition-colors">
        {/* Bouton de Fermeture */}
        <button
          type="button"
          onClick={() => {
            handleReset();
            onClose();
          }}
          className="absolute top-5 end-5 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* En-tête */}
        <div className="space-y-1 pe-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tp-cyan/10 border border-tp-cyan/20 text-tp-cyan-hover dark:text-tp-cyan text-[10px] font-black uppercase tracking-wider">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{isAr ? "استيراد الشركاء من إكسيل" : "Importation Excel en Masse"}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {isAr ? "استيراد قائمة الشركاء (.xlsx / .csv)" : "Importer des Partenaires (.xlsx)"}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {isAr
              ? "قم برفع ملف إكسيل يحتوي على الفنادق، شركات النقل TIST وأندية الأنشطة لإضافتهم دفعة واحدة."
              : "Ajoutez en masse vos hôtels, transporteurs et sociétés d'activités & loisirs grâce à notre modèle structuré."}
          </p>
        </div>

        {/* 1. Téléchargement du Modèle Vierge */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Besoin du format exact ?</span>
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Téléchargez notre fichier modèle pré-rempli avec des lignes d&apos;exemples pour chaque catégorie.
            </p>
          </div>

          <button
            type="button"
            onClick={downloadPartnersImportTemplate}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-tp-cyan-hover dark:text-tp-cyan font-bold text-xs border border-slate-300 dark:border-slate-700 hover:border-tp-cyan/40 transition flex items-center gap-2 shrink-0 active:scale-95 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Télécharger le modèle (.xlsx)</span>
          </button>
        </div>

        {/* 2. Zone de Téléversement Drag & Drop */}
        {!selectedFile ? (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
                dragActive
                  ? "border-tp-cyan bg-tp-cyan/10"
                  : "border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-950/60"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-tp-cyan shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? "اسحب وأسقط ملف إكسيل هنا" : "Glissez-déposez votre fichier Excel ici"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAr ? "أو اضغط لاختيار ملف من جهازك" : "ou cliquez pour parcourir vos fichiers (.xlsx, .xls, .csv)"}
                </p>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                Reconnaissance automatique des colonnes & des types de partenaires
              </span>
            </div>
          </div>
        ) : (
          /* Prévisualisation et Analyse du fichier */
          <div className="space-y-4">
            {/* Info Fichier */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-tp-cyan/10 text-tp-cyan border border-tp-cyan/20 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {(selectedFile.size / 1024).toFixed(1)} Ko • {totalRowsDetected} ligne(s) détectée(s)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
                title="Changer de fichier"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* État de chargement / Parsing */}
            {isParsing && (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-tp-cyan" />
                <p>Analyse du classeur Excel et validation des colonnes...</p>
              </div>
            )}

            {/* Erreurs de parsing */}
            {parseErrors.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Avertissements de validation ({parseErrors.length}) :</span>
                </div>
                <ul className="list-disc ps-5 space-y-0.5 text-[11px] text-amber-700 dark:text-amber-300/80 max-h-28 overflow-y-auto">
                  {parseErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tableau de Prévisualisation des Données Valides */}
            {parsedRecords.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Prêts pour l&apos;importation ({parsedRecords.length} partenaires valides)</span>
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 shadow-xs">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Société / Établissement</th>
                        <th className="p-2.5">Spécialité</th>
                        <th className="p-2.5">Ville</th>
                        <th className="p-2.5">Contact / Tél</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {parsedRecords.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                          <td className="p-2.5 font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-mono ${
                                item.type === "LEISURE_ACTIVITY"
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : item.type === "HOTEL_BIVOUAC" || item.type === "HOTEL_AUBERGE"
                                  ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {formatPartnerTypeLabel(item.type)}
                            </span>
                          </td>
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white">{item.companyName}</td>
                          <td className="p-2.5 text-slate-500 dark:text-slate-400">
                            {item.activityType || item.vehicleType || `${item.capacity || 0} places`}
                          </td>
                          <td className="p-2.5 text-slate-700 dark:text-slate-300">{item.city}</td>
                          <td className="p-2.5 text-slate-500 dark:text-slate-400 font-mono">
                            {item.contactName} ({item.phone})
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Résultat d'importation */}
            {importResult && (
              <div
                className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                  importResult.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {importResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {importResult.success
                      ? `🎉 ${importResult.count} partenaire(s) importé(s) avec succès !`
                      : "Échec de l'importation."}
                  </span>
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <ul className="list-disc ps-5 space-y-0.5 text-[11px]">
                    {importResult.errors.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Boutons d'Action */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
              >
                {importResult?.success ? "Fermer" : "Annuler"}
              </button>

              {!importResult?.success && (
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={parsedRecords.length === 0 || isImporting || isParsing}
                  className="px-5 py-2.5 rounded-xl bg-tp-cyan hover:bg-tp-cyan-hover text-white dark:text-slate-950 font-black text-xs shadow-md shadow-tp-cyan/20 transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enregistrement en base...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Confirmer l&apos;import ({parsedRecords.length})</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
