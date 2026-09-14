"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { 
  User, Mail, Phone, CreditCard, MapPin, 
  Lock, Eye, EyeOff, CheckCircle2, AlertCircle, 
  Loader2, ShieldCheck, Sparkles, KeyRound, Globe, 
  ArrowRight, Check, HelpCircle
} from "lucide-react";
import { 
  updatePersonalInfoAction, 
  updatePasswordAction, 
  UpdatePersonalInfoInput, 
  UpdatePasswordInput 
} from "@/actions/profile";

interface UserProfileSettingsProps {
  initialUser: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    cin: string;
    city: string;
    role: string;
    hasPassword: boolean;
    image?: string | null;
  };
}

export function UserProfileSettings({ initialUser }: UserProfileSettingsProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  // Formulaire 1 : Informations Personnelles
  const [personalInfo, setPersonalInfo] = useState<UpdatePersonalInfoInput>({
    fullName: initialUser.fullName || "",
    phone: initialUser.phone || "",
    cin: initialUser.cin || "",
    city: initialUser.city || "Casablanca",
  });
  const [isSubmittingInfo, setIsSubmittingInfo] = useState(false);
  const [infoFeedback, setInfoFeedback] = useState<{
    type: "SUCCESS" | "ERROR";
    message: string;
  } | null>(null);

  // Formulaire 2 : Changement de Mot de Passe
  const [passwordData, setPasswordData] = useState<UpdatePasswordInput>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "SUCCESS" | "ERROR";
    message: string;
  } | null>(null);

  // Soumission Informations Personnelles
  const handleUpdatePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingInfo(true);
    setInfoFeedback(null);

    try {
      const res = await updatePersonalInfoAction(personalInfo);
      if (res.success) {
        setInfoFeedback({
          type: "SUCCESS",
          message: isAr
            ? "تم تحديث بياناتك الشخصية بنجاح !"
            : res.message || "Coordonnées mises à jour avec succès !",
        });
        setTimeout(() => setInfoFeedback(null), 5000);
      } else {
        setInfoFeedback({
          type: "ERROR",
          message: res.error || (isAr ? "تعذر تحديث البيانات." : "Erreur lors de la mise à jour."),
        });
      }
    } catch (err: any) {
      setInfoFeedback({
        type: "ERROR",
        message: isAr ? "حدث خطأ غير متوقع." : "Une erreur est survenue.",
      });
    } finally {
      setIsSubmittingInfo(false);
    }
  };

  // Soumission Mot de Passe
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPassword(true);
    setPasswordFeedback(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordFeedback({
        type: "ERROR",
        message: isAr
          ? "كلمتا المرور غير متطابقتين."
          : "Les deux mots de passe ne correspondent pas.",
      });
      setIsSubmittingPassword(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordFeedback({
        type: "ERROR",
        message: isAr
          ? "يجب أن تتكون كلمة المرور الجديدة من 8 أحرف على الأقل."
          : "Le nouveau mot de passe doit contenir au moins 8 caractères.",
      });
      setIsSubmittingPassword(false);
      return;
    }

    try {
      const res = await updatePasswordAction(passwordData);
      if (res.success) {
        setPasswordFeedback({
          type: "SUCCESS",
          message: isAr
            ? "تم تغيير كلمة المرور بنجاح !"
            : res.message || "Mot de passe modifié avec succès.",
        });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setTimeout(() => setPasswordFeedback(null), 5000);
      } else {
        setPasswordFeedback({
          type: "ERROR",
          message: res.error || (isAr ? "تعذر تغيير كلمة المرور." : "Erreur technique."),
        });
      }
    } catch (err: any) {
      setPasswordFeedback({
        type: "ERROR",
        message: isAr ? "حدث خطأ غير متوقع." : "Une erreur est survenue.",
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <div className="space-y-8" dir={isAr ? "rtl" : "ltr"}>
      {/* 1. EN-TÊTE DE LA PAGE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 dark:bg-tp-cyan/15 text-cyan-800 dark:text-tp-cyan border border-cyan-200 dark:border-tp-cyan/30 text-xs font-black">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAr ? "إدارة الحساب والأمان" : "Espace Compte Sécurisé"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {isAr ? "حسابي والأمان" : "Mon Profil & Sécurité"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              {isAr
                ? "قم بتحديث معلوماتك الشخصية لضمان تطابق بياناتك مع بيان النقل السياحي الرسمي (TIST) وإدارة كلمة المرور بأمان."
                : "Corrigez vos coordonnées personnelles pour la conformité des manifestes de transport touristique TIST et gérez la sécurité de votre compte."}
            </p>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-mono flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">{initialUser.email}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ========================================================================= */}
        {/* PANNEAU 1 : RECTIFICATION DES INFORMATIONS PERSONNELLES */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-tp-cyan/10 text-cyan-600 dark:text-tp-cyan flex items-center justify-center border border-cyan-200 dark:border-tp-cyan/20">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {isAr ? "المعلومات الشخصية" : "Coordonnées Personnelles"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr ? "بيانات الحساب وبيان الركاب" : "Données d'embarquement & contact"}
                </p>
              </div>
            </div>
          </div>

          {/* Toast / Alerte Feedback Panneau 1 */}
          {infoFeedback && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
                infoFeedback.type === "SUCCESS"
                  ? "bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                  : "bg-red-500/10 border-red-300 dark:border-red-500/30 text-red-800 dark:text-red-300"
              }`}
            >
              {infoFeedback.type === "SUCCESS" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              )}
              <span className="font-bold">{infoFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePersonalInfo} className="space-y-4">
            {/* Nom complet */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {isAr ? "الاسم الكامل (الاسم العائلي والشخصي) :" : "Nom Complet (Prénom & Nom) :"}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={personalInfo.fullName}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                  placeholder="Ex: Mohamed Amine Chaibare"
                  className="w-full ps-10 pe-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-cyan-500 transition shadow-xs"
                />
              </div>
            </div>

            {/* Email (Lecture seule) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? "البريد الإلكتروني (غير قابل للتعديل) :" : "Adresse Email (Fixée à l'inscription) :"}
                </label>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {isAr ? "معرّف موثق" : "Compte Certifié"}
                </span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  disabled
                  value={initialUser.email}
                  className="w-full ps-10 pe-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-mono cursor-not-allowed shadow-xs"
                />
              </div>
            </div>

            {/* Téléphone & WhatsApp */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {isAr ? "رقم الهاتف / واتساب المغربي :" : "Numéro de Téléphone / WhatsApp (+212) :"}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  required
                  value={personalInfo.phone}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                  placeholder="+212 600-000000"
                  className="w-full ps-10 pe-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:border-cyan-500 transition shadow-xs"
                />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {isAr
                  ? "يستخدم لتنسيق الانطلاق والتواصل السريع عبر واتساب."
                  : "Indispensable pour le pointage autocar et l'envoi des convocations WhatsApp."}
              </p>
            </div>

            {/* Grille : N° CIN / Passeport & Ville */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CIN ou Passeport */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? "رقم البطاقة الوطنية (CIN) / الجواز :" : "N° CIN ou Passeport :"}
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={personalInfo.cin}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, cin: e.target.value })}
                    placeholder="Ex: AB123456"
                    className="w-full ps-10 pe-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold uppercase focus:outline-none focus:border-cyan-500 transition shadow-xs"
                  />
                </div>
              </div>

              {/* Ville de résidence */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? "مدينة الإقامة الرئيسية :" : "Ville de résidence :"}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={personalInfo.city}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, city: e.target.value })}
                    placeholder="Casablanca, Rabat, Fès..."
                    className="w-full ps-10 pe-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-cyan-500 transition shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bouton d'Action Panneau 1 */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmittingInfo}
                className="w-full py-3.5 px-5 rounded-2xl bg-cyan-500 hover:bg-cyan-600 dark:bg-tp-cyan dark:hover:bg-tp-cyan-hover text-slate-950 font-black text-xs transition shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmittingInfo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isAr ? "جاري الحفظ..." : "Enregistrement en cours..."}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isAr ? "تحديث معلوماتي الشخصية" : "Mettre à jour mes coordonnées"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ========================================================================= */}
        {/* PANNEAU 2 : SÉCURITÉ & CHANGEMENT DE MOT DE PASSE */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center border border-slate-200 dark:border-slate-700">
                <Lock className="w-5 h-5 text-cyan-600 dark:text-tp-cyan" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {isAr ? "الأمان وكلمة المرور" : "Sécurité & Mot de Passe"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr ? "حماية وتحديث مفتاح الدخول" : "Protection & accès au compte"}
                </p>
              </div>
            </div>
          </div>

          {/* CAS A : COMPTE GOOGLE OAUTH SANS MOT DE PASSE */}
          {!initialUser.hasPassword ? (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-300 dark:border-emerald-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {isAr ? "حسابك موثق عبر Google" : "Connexion sécurisée par Google"}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {isAr
                    ? "تم تسجيل دخولك باستخدام حساب Google الموحد. لا توجد كلمة مرور محلية لتعديلها، فأنت محمي تلقائياً بمصادقة Google."
                    : "Votre compte est authentifié via votre adresse Google sécurisée. Aucun mot de passe local n'est requis ni modifiable ici."}
                </p>
              </div>
            </div>
          ) : (
            /* CAS B : COMPTE CLASSIQUE AVEC FORMULAIRE MOT DE PASSE */
            <>
              {/* Toast / Alerte Feedback Panneau 2 */}
              {passwordFeedback && (
                <div
                  className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
                    passwordFeedback.type === "SUCCESS"
                      ? "bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                      : "bg-red-500/10 border-red-300 dark:border-red-500/30 text-red-800 dark:text-red-300"
                  }`}
                >
                  {passwordFeedback.type === "SUCCESS" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                  )}
                  <span className="font-bold">{passwordFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                {/* Mot de passe actuel */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? "كلمة المرور الحالية :" : "Mot de passe actuel :"}
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      }
                      placeholder="••••••••"
                      className="w-full ps-4 pe-11 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-cyan-500 transition shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
                      aria-label="Afficher / Masquer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Nouveau mot de passe */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? "كلمة المرور الجديدة :" : "Nouveau mot de passe :"}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      placeholder="Min. 8 caractères dont 1 chiffre"
                      className="w-full ps-4 pe-11 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-cyan-500 transition shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
                      aria-label="Afficher / Masquer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {isAr
                      ? "يجب أن تحتوي على 8 خانات على الأقل وتتضمن رقماً واحداً."
                      : "Minimum 8 caractères comprenant au moins un chiffre."}
                  </p>
                </div>

                {/* Confirmer nouveau mot de passe */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? "تأكيد كلمة المرور الجديدة :" : "Confirmer le nouveau mot de passe :"}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      placeholder="••••••••"
                      className="w-full ps-4 pe-11 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-cyan-500 transition shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
                      aria-label="Afficher / Masquer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Bouton d'Action Panneau 2 */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSubmittingPassword}
                    className="w-full py-3.5 px-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 font-bold text-xs transition shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isAr ? "جاري التعديل..." : "Modification en cours..."}</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 text-cyan-400 dark:text-cyan-600" />
                        <span>{isAr ? "تعديل كلمة المرور" : "Modifier le mot de passe"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
