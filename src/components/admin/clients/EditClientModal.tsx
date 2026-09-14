"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Shield,
  Loader2,
  Save,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { updateClientAdminAction } from "@/actions/client.actions";
import { ClientDetailedData } from "./ClientDetailsDrawer";
import { UserRole } from "@prisma/client";

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientDetailedData | null;
  onSuccess?: (updatedClient: any) => void;
  locale?: string;
}

export function EditClientModal({
  isOpen,
  onClose,
  client,
  onSuccess,
  locale = "fr",
}: EditClientModalProps) {
  const isAr = locale === "ar";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cinOrPassport, setCinOrPassport] = useState("");
  const [city, setCity] = useState("Casablanca");
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);

  // Gestion du mot de passe
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      setFullName(client.fullName || "");
      setEmail(client.email || "");
      setPhone(client.phone && client.phone !== "—" ? client.phone : "");
      setCinOrPassport(client.cinOrPassport || "");
      setCity(client.city || "Casablanca");
      setRole((client.role as UserRole) || UserRole.CLIENT);
      setNewPassword("");
      setShowPassword(false);
      setCopiedWhatsApp(false);
      setErrorMsg(null);
    }
  }, [client]);

  if (!isOpen || !client) return null;

  // Génération instantanée d'un mot de passe temporaire robuste et communicable (ex: Bladna2026742!#)
  const handleGenerateTempPassword = () => {
    const currentYear = new Date().getFullYear();
    const prefixes = ["Bladna", "Sahara", "Atlas", "Voyage", "Maroc"];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomDigits = Math.floor(100 + Math.random() * 900); // 3 chiffres
    const symbols = ["!#", "!$", "@!", "#!"];
    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const generated = `${randomPrefix}${currentYear}${randomDigits}${randomSymbol}`;
    setNewPassword(generated);
    setShowPassword(true);
    setCopiedWhatsApp(false);
  };

  // Copie dans le presse-papier au format WhatsApp
  const handleCopyWhatsApp = () => {
    if (!newPassword) return;
    const clientName = fullName || client.fullName || (isAr ? "عزيزي المسافر" : "Voyageur");
    const message = isAr
      ? `مرحباً ${clientName}، كلمة المرور المؤقتة الخاصة بحسابك على رحلات بلادنا هي : ${newPassword}`
      : `Bonjour ${clientName}, votre mot de passe temporaire pour Rahalat Bladna est : ${newPassword}`;

    navigator.clipboard.writeText(message);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.trim() && newPassword.trim().length < 6) {
      setErrorMsg(
        isAr
          ? "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل."
          : "Le nouveau mot de passe doit comporter au moins 6 caractères."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await updateClientAdminAction(client.id, {
        fullName,
        email,
        phone,
        cinOrPassport,
        city,
        role,
        newPassword: newPassword.trim() || undefined,
      });

      if (res.success && res.client) {
        if (onSuccess) onSuccess(res.client);
        onClose();
      } else {
        setErrorMsg(res.error || "Une erreur est survenue lors de la mise à jour.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur technique de communication.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isAr ? "تعديل بيانات العميل" : "Modifier les Coordonnées Client"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {client.fullName} ({client.email})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto tp-scrollbar">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Nom complet */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-500" />
              <span>{isAr ? "الاسم الكامل (الاسم العائلي والشخصي) :" : "Nom Complet (Prénom & Nom) :"}</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              placeholder="Ex: Mohamed Amine Chaibare"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-500" />
              <span>{isAr ? "البريد الإلكتروني :" : "Adresse Email :"}</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none font-mono"
              placeholder="client@exemple.ma"
            />
          </div>

          {/* Téléphone & CIN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-500" />
                <span>{isAr ? "الهاتف / واتساب :" : "Téléphone / WhatsApp :"}</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none font-mono"
                placeholder="+212 600-000000"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-cyan-500" />
                <span>{isAr ? "رقم ب.ت.و أو جواز السفر :" : "N° CIN ou Passeport :"}</span>
              </label>
              <input
                type="text"
                value={cinOrPassport}
                onChange={(e) => setCinOrPassport(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none font-mono uppercase"
                placeholder="Ex: CD123456"
              />
            </div>
          </div>

          {/* Ville & Rôle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-500" />
                <span>{isAr ? "مدينة الإقامة :" : "Ville de Résidence :"}</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                placeholder="Casablanca, Rabat, etc."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-500" />
                <span>{isAr ? "الدور والصلاحيات :" : "Rôle Système :"}</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              >
                <option value={UserRole.CLIENT}>Client (Voyageur)</option>
                <option value={UserRole.TOUR_LEADER}>Tour Leader (Guide / Accompagnateur)</option>
                <option value={UserRole.AGENCY_STAFF}>Staff Agence</option>
                <option value={UserRole.AGENCY_ADMIN}>Admin Agence</option>
                <option value={UserRole.SUPER_ADMIN}>Super-Administrateur</option>
              </select>
            </div>
          </div>

          {/* ==================================================== */}
          {/* SECTION : GESTION D'ACCÈS & MOT DE PASSE             */}
          {/* ==================================================== */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    {isAr ? "إدارة الوصول وكلمة المرور" : "Gestion d'Accès & Mot de Passe"}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr
                      ? "إعادة تعيين أو تحديد كلمة مرور جديدة لحساب هذا العميل"
                      : "Définir ou réinitialiser le mot de passe du voyageur"}
                  </p>
                </div>
              </div>

              {client.isGoogleAuth && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200/60 dark:border-blue-800/60">
                  <svg className="w-3 h-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google OAuth</span>
                </span>
              )}
            </div>

            {/* A. Détection du type de compte (Google OAuth vs compte classique) */}
            {client.isGoogleAuth && (
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-2.5">
                <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0 mt-0.5">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold">
                    {isAr
                      ? "تسجيل دخول بواسطة حساب Google"
                      : "Ce voyageur s'authentifie via son compte Google. Il n'utilise pas de mot de passe local."}
                  </p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300/80 leading-relaxed">
                    {isAr
                      ? "يمكنك تعيين كلمة مرور محلية له أدناه لتمكينه أيضاً من تسجيل الدخول الكلاسيكي بالبريد الإلكتروني."
                      : "Vous pouvez néanmoins lui définir un mot de passe local ci-dessous pour lui permettre de se connecter aussi par email."}
                  </p>
                </div>
              </div>
            )}

            {/* B. Contrôles de Saisie */}
            <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{isAr ? "تعيين / تعديل كلمة المرور" : "Définir / Modifier le mot de passe"}</span>
                  </span>
                  {newPassword && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {isAr ? "جاهز للتسجيل" : "Prêt à être enregistré"}
                    </span>
                  )}
                </label>

                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={isAr ? "اتركه فارغاً إذا لم يتغير" : "Laisser vide si inchangé"}
                    className="w-full px-3.5 py-2.5 pe-10 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none font-mono tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-2.5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    title={showPassword ? "Masquer" : "Afficher en clair"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Boutons d'actions rapides : Générer & WhatsApp */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* 1. Bouton Générer un mot de passe temporaire */}
                <button
                  type="button"
                  onClick={handleGenerateTempPassword}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 text-[11px] font-bold transition active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                  <span>{isAr ? "توليد كلمة مرور مؤقتة" : "Générer un mot de passe temporaire"}</span>
                </button>

                {/* 2. Bouton rapide WhatsApp (copie presse-papier) */}
                {newPassword && (
                  <>
                    <button
                      type="button"
                      onClick={handleCopyWhatsApp}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition active:scale-95 cursor-pointer"
                      title="Copier le format WhatsApp dans le presse-papier"
                    >
                      {copiedWhatsApp ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isAr ? "تم النسخ !" : "Copié pour WhatsApp !"}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isAr ? "نسخ للواتساب" : "Copier pour WhatsApp"}</span>
                        </>
                      )}
                    </button>

                    {phone && (
                      <a
                        href={`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                          isAr
                            ? `مرحباً ${fullName || client.fullName || "عزيزي المسافر"}، كلمة المرور المؤقتة الخاصة بحسابك على رحلات بلادنا هي : ${newPassword}`
                            : `Bonjour ${fullName || client.fullName || "Cher voyageur"}, votre mot de passe temporaire pour Rahalat Bladna est : ${newPassword}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition shadow-xs active:scale-95"
                        title="Ouvrir WhatsApp directement"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </>
                )}
              </div>

              {/* Feedback de copie */}
              {copiedWhatsApp && (
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium flex items-center gap-1.5 animate-in fade-in">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    {isAr
                      ? `تم نسخ الرسالة: "مرحباً ${fullName || client.fullName}، كلمة المرور المؤقتة الخاصة بحسابك على رحلات بلادنا هي : ${newPassword}"`
                      : `Message copié : "Bonjour ${fullName || client.fullName}, votre mot de passe temporaire pour Rahalat Bladna est : ${newPassword}"`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions footer */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {isAr ? "إلغاء" : "Annuler"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? "جاري الحفظ..." : "Enregistrement..."}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isAr ? "حفظ التعديلات" : "Enregistrer les modifications"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
