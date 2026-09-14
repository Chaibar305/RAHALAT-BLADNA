"use client";

import React, { useState, useRef } from "react";
import { 
  UploadCloud, Image as ImageIcon, X, CheckCircle2, 
  AlertCircle, Loader2, Sparkles, Copy, ExternalLink, FileText 
} from "lucide-react";

interface R2ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: "trips" | "receipts" | "invoices" | "documents" | "avatars";
  label?: string;
  aspectRatio?: "video" | "square" | "cover";
  autoOptimizeWebp?: boolean;
}

export function R2ImageUploader({
  value,
  onChange,
  folder = "trips",
  label = "Téléverser une image (Cloudflare R2)",
  aspectRatio = "video",
  autoOptimizeWebp = true,
}: R2ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Optimisation client vers WebP via Canvas pour un chargement instantané
  const optimizeToWebp = async (file: File): Promise<Blob> => {
    if (!autoOptimizeWebp || !file.type.startsWith("image/")) {
      return file;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                resolve(file);
              }
            },
            "image/webp",
            0.88
          );
        } else {
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
    });
  };

  const uploadFile = async (rawFile: File) => {
    setError(null);
    setIsUploading(true);
    setUploadProgress(15);

    try {
      // 1. Optimisation WebP
      const optimizedBlob = await optimizeToWebp(rawFile);
      setUploadProgress(45);

      const fileName = autoOptimizeWebp && rawFile.type.startsWith("image/")
        ? `${rawFile.name.replace(/\.[^/.]+$/, "")}.webp`
        : rawFile.name;

      const fileToSend = new File([optimizedBlob], fileName, {
        type: optimizedBlob.type,
      });

      // 2. Envoi via FormData vers notre API Route /api/upload
      const formData = new FormData();
      formData.append("file", fileToSend);
      formData.append("folder", folder);

      setUploadProgress(70);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setUploadProgress(100);

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erreur lors du téléversement vers Cloudflare R2.");
      }

      onChange(data.url);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Impossible de téléverser le fichier vers Cloudflare R2.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const handleCopyUrl = () => {
    if (value) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </label>
          <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-mono bg-cyan-50 dark:bg-cyan-950/50 px-2 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-800">
            R2 Bucket : /{folder}
          </span>
        </div>
      )}

      {/* Upload Zone or Preview */}
      {value ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 group shadow-sm">
          <div className={`w-full ${aspectRatio === "video" ? "aspect-video" : "h-44"} relative bg-slate-100 dark:bg-slate-950 flex items-center justify-center`}>
            {value.endsWith(".pdf") ? (
              <div className="flex flex-col items-center gap-2 p-6 text-slate-500 dark:text-slate-400">
                <FileText className="w-12 h-12 text-cyan-500" />
                <span className="text-xs font-mono">Document PDF stocké sur R2</span>
              </div>
            ) : (
              <img
                src={value}
                alt="Aperçu Cloudflare R2"
                className="w-full h-full object-cover"
              />
            )}

            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Remplacer</span>
              </button>

              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copié !" : "Copier URL"}</span>
              </button>

              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition"
                title="Ouvrir dans un nouvel onglet"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => onChange("")}
                className="p-1.5 rounded-xl bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/30 transition"
                title="Supprimer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400 truncate">
            <span className="truncate max-w-[320px] text-cyan-600 dark:text-cyan-400 font-semibold">{value}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 shrink-0">
              Cloudflare R2 OK
            </span>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-cyan-500 bg-cyan-500/10 scale-[1.01]"
              : "border-slate-300 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900"
          }`}
        >
          {isUploading ? (
            <div className="space-y-3 py-4">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Téléversement sécurisé vers Cloudflare R2...
                </p>
                <div className="w-48 mx-auto h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
                <UploadCloud className="w-6 h-6" />
              </div>

              <div>
                <p className="text-xs font-black text-slate-900 dark:text-white">
                  Glissez-déposez votre visuel ici ou <span className="text-cyan-600 dark:text-cyan-400 underline">parcourir</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Formats acceptés : WebP, JPEG, PNG, PDF • Max 5 Mo (Images) / 10 Mo (PDF)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/webp,image/jpeg,image/png,image/jpg,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
