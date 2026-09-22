"use client";

import React, { useState, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { 
  Upload, FileText, CheckCircle2, AlertCircle, 
  Loader2, Plus, Trash2, ShieldCheck, ArrowRight, ArrowLeft 
} from "lucide-react";
import { submitJobApplicationAction } from "@/actions/recruitment.actions";

interface JobApplicationFormProps {
  jobPostingId: string;
  jobTitle: string;
}

export function JobApplicationForm({ jobPostingId, jobTitle }: JobApplicationFormProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("recruitment");

  // Champs du formulaire
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [availability, setAvailability] = useState("immediate");
  const [coverMessage, setCoverMessage] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>([""]);
  const [consent, setConsent] = useState(false);

  // État du fichier CV
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [cvUploadedKey, setCvUploadedKey] = useState<string | null>(null);
  const [cvSanitizedName, setCvSanitizedName] = useState<string | null>(null);

  // États de soumission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gestion des liens portfolio dynamiques
  const handleAddLink = () => {
    if (portfolioLinks.length < 5) {
      setPortfolioLinks([...portfolioLinks, ""]);
    }
  };

  const handleLinkChange = (index: number, value: string) => {
    const updated = [...portfolioLinks];
    updated[index] = value;
    setPortfolioLinks(updated);
  };

  const handleRemoveLink = (index: number) => {
    const updated = portfolioLinks.filter((_, i) => i !== index);
    setPortfolioLinks(updated.length > 0 ? updated : [""]);
  };

  // Validation du fichier CV (MIME + Magic Bytes PDF)
  const validateAndSetCvFile = async (file: File) => {
    setErrorMessage(null);

    // 1. Validation de la taille (5 Mo max)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(isAr ? "حجم الملف يتجاوز 5 ميغابايت." : "Le fichier dépasse la taille maximale autorisée de 5 Mo.");
      return;
    }

    if (file.size === 0) {
      setErrorMessage(isAr ? "الملف فارغ أو تالف." : "Le fichier est vide.");
      return;
    }

    // 2. Validation de l'extension
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage(isAr ? "يجب أن يكون الملف بصيغة PDF حصراً." : "Seuls les fichiers PDF sont acceptés.");
      return;
    }

    // 3. Scan anti-malware basique : Vérification des Magic Bytes réels du PDF (%PDF)
    try {
      const buffer = await file.slice(0, 4).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // %PDF correspond aux octets hexadécimaux: 0x25, 0x50, 0x44, 0x46
      const isRealPdf =
        bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;

      if (!isRealPdf) {
        setErrorMessage(
          isAr
            ? "الملف غير صالح : توقيع الملف لا يطابق وثيقة PDF حقيقية."
            : "Fichier non valide : la signature interne du document ne correspond pas à un véritable PDF."
        );
        return;
      }
    } catch (e) {
      console.warn("Impossible de lire les magic bytes du fichier :", e);
    }

    setCvFile(file);
    setCvUploadedKey(null);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetCvFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetCvFile(e.target.files[0]);
    }
  };

  // Upload direct vers Cloudflare R2 via URL présignée avec suivi XMLHttpRequest
  const uploadCvToR2 = async (file: File): Promise<{ key: string; sanitizedName: string }> => {
    setIsUploadingCv(true);
    setUploadProgress(10);

    const tempAppId = `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Demande d'URL présignée
    const presignedRes = await fetch("/api/recruitment/presigned-cv-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobPostingId,
        applicationId: tempAppId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: "application/pdf",
      }),
    });

    const presignedData = await presignedRes.json();
    if (!presignedRes.ok || !presignedData.success) {
      throw new Error(presignedData.error || "Impossible d'initialiser le téléversement du CV.");
    }

    const { uploadUrl, key, sanitizedFileName } = presignedData;

    // 2. Upload binaire PUT direct vers Cloudflare R2 avec suivi de progression
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", "application/pdf");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 90);
          setUploadProgress(10 + percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);
          resolve();
        } else {
          reject(new Error(`Erreur lors du téléversement vers Cloudflare R2 (Code: ${xhr.status}).`));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Erreur réseau pendant le téléversement du CV."));
      };

      xhr.send(file);
    });

    setIsUploadingCv(false);
    setCvUploadedKey(key);
    setCvSanitizedName(sanitizedFileName);

    return { key, sanitizedName: sanitizedFileName };
  };

  // Soumission finale du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validations côté client
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setErrorMessage(isAr ? "يرجى ملء جميع الحقول الإلزامية." : "Veuillez renseigner tous les champs obligatoires.");
      return;
    }

    if (!cvFile && !cvUploadedKey) {
      setErrorMessage(isAr ? "يرجى تحميل سيرتك الذاتية (CV)." : "Veuillez téléverser votre Curriculum Vitae (CV).");
      return;
    }

    if (!consent) {
      setErrorMessage(
        isAr
          ? "يرجى الموافقة على معالجة البيانات الشخصية للمتابعة."
          : "Veuillez accepter les conditions de traitement des données pour soumettre votre candidature."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Étape 1 : Upload du CV s'il n'est pas encore téléversé
      let key = cvUploadedKey;
      let finalFileName = cvSanitizedName || cvFile?.name || "cv.pdf";

      if (!key && cvFile) {
        const uploadResult = await uploadCvToR2(cvFile);
        key = uploadResult.key;
        finalFileName = uploadResult.sanitizedName;
      }

      if (!key) {
        throw new Error(isAr ? "فشل تحميل السيرة الذاتية." : "Échec du téléversement du CV.");
      }

      // Étape 2 : Appel de la Server Action avec transaction
      const res = await submitJobApplicationAction({
        jobPostingId,
        fullName,
        email,
        phone,
        city,
        coverMessage,
        cvFileUrl: key,
        cvFileName: finalFileName,
        cvFileSize: cvFile?.size || 0,
        portfolioLinks: portfolioLinks.filter((l) => l.trim().length > 0),
        availability,
        locale,
      });

      if (!res.success) {
        throw new Error(res.error || "Une erreur est survenue lors de l'enregistrement.");
      }

      setIsSuccess(true);
    } catch (err: any) {
      console.error("Erreur soumission candidature :", err);
      setErrorMessage(err.message || "Une erreur est survenue. Veuillez vérifier votre connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-emerald-100 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-4 border-emerald-100 shadow-inner">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>
        <div className="space-y-3 max-w-md mx-auto">
          <h3 className="text-2xl sm:text-3xl font-black text-tp-midnight">
            {t("successTitle")}
          </h3>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {t("successMessage")}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 max-w-md mx-auto">
          <p>
            {isAr
              ? `تم إرسال تأكيد الاستلام إلى بريدكم الإلكتروني : ${email}`
              : `Un accusé de réception a été envoyé à votre adresse : ${email}`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="postuler" className="bg-white rounded-3xl p-6 sm:p-10 border border-tp-line shadow-xl space-y-8 scroll-mt-24">
      <div className="space-y-2 border-b border-slate-100 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tp-cyan/10 text-tp-cyan text-xs font-black uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isAr ? "طلب ترشح رسمي" : "Candidature Officielle"}</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-tp-midnight">
          {t("formTitle")}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500">
          {t("formSubtitle")}
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Coordonnées */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-tp-midnight block">
              {t("fullName")} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("fullNamePlaceholder")}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:border-tp-cyan focus:ring-2 focus:ring-tp-cyan/20 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-tp-midnight block">
              {t("email")} <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:border-tp-cyan focus:ring-2 focus:ring-tp-cyan/20 transition text-left rtl:text-right"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-tp-midnight block">
              {t("phone")} <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("phonePlaceholder")}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:border-tp-cyan focus:ring-2 focus:ring-tp-cyan/20 transition text-left rtl:text-right"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-tp-midnight block">
              {t("city")}
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t("cityPlaceholder")}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:border-tp-cyan focus:ring-2 focus:ring-tp-cyan/20 transition"
            />
          </div>
        </div>

        {/* Disponibilité */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-tp-midnight block">
            {t("availability")}
          </label>
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:border-tp-cyan focus:ring-2 focus:ring-tp-cyan/20 transition"
          >
            <option value="immediate">{t("availabilityOptions.immediate")}</option>
            <option value="weekends">{t("availabilityOptions.weekends")}</option>
            <option value="fullTime">{t("availabilityOptions.fullTime")}</option>
            <option value="custom">{t("availabilityOptions.custom")}</option>
          </select>
        </div>

        {/* Liens Portfolio / Réseaux sociaux */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-tp-midnight block">
            {t("portfolioTitle")}
          </label>
          <div className="space-y-2">
            {portfolioLinks.map((link, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => handleLinkChange(idx, e.target.value)}
                  placeholder="https://instagram.com/..., https://drive.google.com/..."
                  className="flex-1 h-10 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-tp-cyan focus:ring-1 focus:ring-tp-cyan/20 transition text-left"
                />
                {portfolioLinks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(idx)}
                    className="p-2.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                    title={t("removeLink")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {portfolioLinks.length < 5 && (
            <button
              type="button"
              onClick={handleAddLink}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-tp-cyan hover:underline pt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("addLink")}</span>
            </button>
          )}
        </div>

        {/* Message de motivation */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-tp-midnight block">
            {t("coverMessage")}
          </label>
          <textarea
            rows={4}
            value={coverMessage}
            onChange={(e) => setCoverMessage(e.target.value)}
            placeholder={t("coverMessagePlaceholder")}
            className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:border-tp-cyan focus:ring-2 focus:ring-tp-cyan/20 transition resize-y"
          />
        </div>

        {/* Zone Téléversement CV PDF avec Drag & Drop */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-tp-midnight block">
            {t("cvUploadTitle")} <span className="text-rose-500">*</span>
          </label>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
              cvFile
                ? "border-emerald-400 bg-emerald-50/30"
                : "border-slate-300 hover:border-tp-cyan bg-slate-50/50 hover:bg-white"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="application/pdf"
              className="hidden"
            />

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto text-tp-cyan">
                {cvFile ? <FileText className="w-6 h-6 text-emerald-600" /> : <Upload className="w-6 h-6" />}
              </div>

              {cvFile ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-emerald-700 break-all">
                    {cvFile.name} ({(cvFile.size / (1024 * 1024)).toFixed(2)} Mo)
                  </p>
                  <p className="text-[11px] text-emerald-600 font-medium">
                    {isAr ? "اضغط هنا لتغيير الملف المختار" : "Cliquez pour remplacer le fichier"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-bold text-slate-700">
                    {t("cvUploadInstruction")}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {t("cvUploadNote")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Barre de progression pendant l'upload */}
          {isUploadingCv && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>{t("cvUploading")}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-tp-cyan transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Consentement RGPD */}
        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-600 leading-relaxed select-none">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-slate-300 text-tp-cyan focus:ring-tp-cyan"
            />
            <span>{t("consentText")}</span>
          </label>
        </div>

        {/* Bouton de soumission */}
        <button
          type="submit"
          disabled={isSubmitting || isUploadingCv}
          className="w-full h-14 rounded-2xl bg-tp-midnight hover:bg-tp-midnight-soft text-white font-black text-sm sm:text-base flex items-center justify-center gap-3 transition shadow-lg shadow-tp-midnight/15 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t("submitting")}</span>
            </>
          ) : (
            <>
              <span>{t("submitApplication")}</span>
              {isAr ? (
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition" />
              ) : (
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              )}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
