"use client";

import React, { useState, useRef } from "react";
import { 
  UploadCloud, FileSpreadsheet, Download, CheckCircle2, 
  AlertTriangle, X, Loader2, Users, ArrowRight 
} from "lucide-react";
import { importPassengersExcelAction } from "@/actions/excel.actions";
import { ExcelExportButton } from "./ExcelExportButtons";

interface PassengerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripTitle: string;
  departures?: Array<{ id: string; startDate: string; endDate: string }>;
  onSuccess?: () => void;
}

export function PassengerImportModal({
  isOpen,
  onClose,
  tripId,
  tripTitle,
  departures = [],
  onSuccess,
}: PassengerImportModalProps) {
  const [selectedDepartureId, setSelectedDepartureId] = useState<string>(
    departures[0]?.id || ""
  );
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorsList, setErrorsList] = useState<string[]>([]);
  const [successResult, setSuccessResult] = useState<{ count: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError(null);
      setErrorsList([]);
      setSuccessResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
      setErrorsList([]);
      setSuccessResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Veuillez sélectionner un fichier Excel (.xlsx ou .csv).");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setErrorsList([]);

      // Convertir en base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Content = (reader.result as string).split(",")[1];
          const res = await importPassengersExcelAction(
            tripId,
            selectedDepartureId || null,
            base64Content
          );

          if (res.success) {
            setSuccessResult({ count: res.count || 0 });
            if (onSuccess) onSuccess();
          } else {
            setError(res.error || "Erreur lors de l'import des passagers.");
            if (res.errors && res.errors.length > 0) {
              setErrorsList(res.errors);
            }
          }
        } catch (subErr: any) {
          setError(subErr.message || "Erreur lors du traitement.");
        } finally {
          setIsUploading(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || "Erreur inattendue.");
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl space-y-0 text-slate-900 dark:text-white">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Import de Voyageurs en Masse (.xlsx)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-sm">
                Circuit : <span className="text-slate-900 dark:text-white font-bold">{tripTitle}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Étape 1 : Téléchargement du Modèle */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">1. Modèle Excel Officiel</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Téléchargez le modèle pré-rempli avec les colonnes conformes.
              </p>
            </div>
            <a
              href="/api/admin/excel/template"
              download="modele_import_voyageurs_rahalat_bladna.xlsx"
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition active:scale-95 shadow-xs shrink-0"
              title="Télécharger le modèle Excel officiel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Télécharger le modèle</span>
              <Download className="w-3.5 h-3.5 opacity-70 ml-0.5" />
            </a>
          </div>

          {/* Étape 2 : Sélection du Départ */}
          {departures.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                2. Sélectionner la Date de Départ :
              </label>
              <select
                value={selectedDepartureId}
                onChange={(e) => setSelectedDepartureId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
              >
                {departures.map((d) => (
                  <option key={d.id} value={d.id}>
                    Du {new Date(d.startDate).toLocaleDateString("fr-FR")} au {new Date(d.endDate).toLocaleDateString("fr-FR")}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Étape 3 : Zone de Dépose du Fichier */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
              file
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50/80 dark:bg-slate-950/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <UploadCloud className="w-6 h-6" />
            </div>

            {file ? (
              <div>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{file.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB • Cliquez pour changer de fichier
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Glissez-déposez votre fichier Excel ici
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  ou cliquez pour parcourir vos fichiers (.xlsx, .csv)
                </p>
              </div>
            )}
          </div>

          {/* Messages de Statut */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              {errorsList.length > 0 && (
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-red-600 dark:text-red-300 max-h-32 overflow-y-auto">
                  {errorsList.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {successResult && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Importation réussie avec succès !</span>
              </div>
              <p className="text-[11px] text-emerald-600/80 dark:text-emerald-300/80">
                {successResult.count} voyageur(s) inséré(s) dans le manifeste et le registre des réservations.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
          >
            Fermer
          </button>

          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Traitement en cours...</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                <span>Valider l&apos;Importation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
