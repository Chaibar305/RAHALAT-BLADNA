"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  X, User, Lock, Mail, Phone, FileBadge,
  ArrowRight, CheckCircle2, ShieldCheck, KeyRound,
  Eye, EyeOff, AlertCircle, HelpCircle, Loader2,
} from "lucide-react";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { registerUserAction, requestPasswordResetAction } from "@/actions/auth.actions";

export type AuthTab = "LOGIN" | "REGISTER" | "FORGOT";

export function AuthModal({
  isOpen,
  initialTab = "LOGIN",
  onClose,
  onLoginSuccess,
}: {
  isOpen: boolean;
  initialTab?: AuthTab;
  onClose: () => void;
  onLoginSuccess?: (user: { name: string; email: string }) => void;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("auth");
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- LOGIN form state ---
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");

  // --- REGISTER form state ---
  const [fullName, setFullName] = useState("");
  const [cin, setCin] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);

  // --- FORGOT form state ---
  const [forgotIdentifier, setForgotIdentifier] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [initialTab, isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // ─── CONNEXION ──────────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        emailOrPhone: emailOrPhone.trim(),
        password,
      });

      if (res?.ok) {
        setSuccessMessage(t("loginSuccess"));
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess({
              name: emailOrPhone.includes("@")
                ? emailOrPhone.split("@")[0]
                : (isAr ? "مسافر رحلات بلادنا" : "Voyageur Rahalat Bladna"),
              email: emailOrPhone,
            });
          }
          onClose();
          router.refresh();
        }, 800);
      } else {
        // NextAuth error message
        const msg = res?.error;
        if (msg === "CredentialsSignin") {
          setErrorMessage(isAr ? "بيانات الدخول غير صحيحة" : "Identifiants incorrects. Vérifiez votre email/téléphone et mot de passe.");
        } else {
          setErrorMessage(msg || (isAr ? "فشل تسجيل الدخول" : "Échec de la connexion. Veuillez réessayer."));
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || (isAr ? "خطأ تقني" : "Erreur technique. Veuillez réessayer."));
    } finally {
      setIsLoading(false);
    }
  };

  // ─── INSCRIPTION ────────────────────────────────────────────────
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!agreeTerms) {
      setErrorMessage(isAr ? "يجب قبول الشروط والأحكام" : "Vous devez accepter les conditions générales.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerUserAction({
        fullName,
        email,
        phone,
        password: registerPassword,
        confirmPassword,
        cinOrPassport: cin || undefined,
      });

      if (!result.success) {
        setErrorMessage(result.error || (isAr ? "فشل إنشاء الحساب" : "Échec de la création du compte."));
        return;
      }

      // Auto-sign-in after registration
      const signInRes = await signIn("credentials", {
        redirect: false,
        emailOrPhone: email.trim().toLowerCase(),
        password: registerPassword,
      });

      if (signInRes?.ok) {
        setSuccessMessage(t("registerSuccess"));
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess({
              name: fullName,
              email,
            });
          }
          onClose();
          // Redirect to profile completion if CIN not provided
          if (!cin) {
            router.push(`/${locale}/completer-profil`);
          } else {
            router.refresh();
          }
        }, 800);
      } else {
        // Account created but auto-login failed — redirect to login page
        setSuccessMessage(
          isAr
            ? "تم إنشاء حسابك بنجاح! قم بتسجيل الدخول الآن."
            : "Compte créé avec succès ! Veuillez vous connecter."
        );
        setTimeout(() => {
          switchTab("LOGIN");
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || (isAr ? "خطأ تقني" : "Erreur technique."));
    } finally {
      setIsLoading(false);
    }
  };

  // ─── MOT DE PASSE OUBLIÉ ────────────────────────────────────────
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await requestPasswordResetAction(forgotIdentifier, locale);
      if (res.success) {
        setSuccessMessage(
          res.message ||
            (isAr
              ? "إذا كان هذا الحساب مسجلاً لدينا، فستصلك رسالة تحتوي على رابط إعادة التعيين."
              : "Si un compte est associé à cette adresse, un lien de réinitialisation vous a été envoyé.")
        );
      } else {
        setErrorMessage(
          res.error ||
            (isAr
              ? "تعذر إرسال رابط إعادة التعيين. يرجى المحاولة مرة أخرى."
              : "Impossible d'envoyer le lien de réinitialisation.")
        );
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || (isAr ? "خطأ تقني في الاتصال بالخادم." : "Erreur technique lors de l'envoi.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Dark Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-tp-midnight/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Centering Wrapper */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 md:p-6">
        {/* Modal Card */}
        <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-tp-line overflow-hidden z-10 my-auto flex flex-col max-h-[92dvh] animate-in fade-in zoom-in-95 duration-200">
          {/* 1. FIXED TOP BANNER */}
          <div className="bg-tp-midnight p-5 sm:p-6 text-white relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-moroccan-pattern-dark opacity-20 pointer-events-none" />

            <button
              onClick={onClose}
              className="absolute top-4 end-4 text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition active:scale-95 z-20"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 space-y-1 pe-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-white/10 backdrop-blur-md text-tp-cyan-soft text-[11px] font-black uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isAr ? "فضاء الأمان والحسابات" : "Espace Sécurisé Rahalat Bladna"}</span>
              </div>

              <h2 className="text-lg sm:text-2xl font-black text-white leading-snug">
                {activeTab === "LOGIN" && t("loginTitle")}
                {activeTab === "REGISTER" && t("registerTitle")}
                {activeTab === "FORGOT" && t("forgotTitle")}
              </h2>

              <p className="text-xs text-tp-ivory/75 leading-relaxed">
                {activeTab === "LOGIN" && t("loginSubtitle")}
                {activeTab === "REGISTER" && t("registerSubtitle")}
                {activeTab === "FORGOT" && t("forgotSubtitle")}
              </p>
            </div>
          </div>

          {/* 2. FIXED TAB SWITCHER */}
          <div className="flex border-b border-tp-line bg-tp-surface-2 p-1.5 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => switchTab("LOGIN")}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                activeTab === "LOGIN"
                  ? "bg-white text-tp-midnight shadow-sm border border-tp-line/80"
                  : "text-tp-muted hover:text-tp-midnight"
              }`}
            >
              {t("loginBtn")}
            </button>
            <button
              type="button"
              onClick={() => switchTab("REGISTER")}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                activeTab === "REGISTER"
                  ? "bg-white text-tp-midnight shadow-sm border border-tp-line/80"
                  : "text-tp-muted hover:text-tp-midnight"
              }`}
            >
              {t("registerBtn")}
            </button>
            <button
              type="button"
              onClick={() => switchTab("FORGOT")}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                activeTab === "FORGOT"
                  ? "bg-white text-tp-midnight shadow-sm border border-tp-line/80"
                  : "text-tp-muted hover:text-tp-midnight"
              }`}
            >
              <span className="truncate">{isAr ? "استرجاع" : "Récupération"}</span>
            </button>
          </div>

          {/* 3. SCROLLABLE FORM BODY */}
          <div className="p-5 sm:p-7 space-y-5 overflow-y-auto tp-scrollbar">

            {/* Success / Error banners */}
            {successMessage && (
              <div className="p-4 rounded-2xl bg-tp-ok-bg text-tp-ok-fg text-xs font-bold flex items-center gap-2.5 animate-in fade-in shadow-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ── TAB 1: CONNEXION ── */}
            {activeTab === "LOGIN" && (
              <div className="space-y-4">
                <GoogleAuthButton
                  variant="dark"
                  callbackUrl="/fr"
                  onSuccess={() => {
                    onClose();
                    router.refresh();
                  }}
                />

                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-tp-line w-full" />
                  <span className="bg-white px-3 text-[11px] font-bold text-tp-muted uppercase tracking-wider relative z-10 shrink-0">
                    {isAr ? "أو تسجيل الدخول عبر" : "ou avec vos identifiants"}
                  </span>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-tp-midnight">
                      {t("emailOrPhone")}
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-tp-muted absolute start-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="contact@exemple.ma / 0661000000"
                        value={emailOrPhone}
                        onChange={(e) => setEmailOrPhone(e.target.value)}
                        className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-tp-line focus:border-tp-cyan focus:ring-2 focus:ring-tp-cyan/20 focus:outline-none text-xs font-bold text-tp-midnight bg-tp-surface-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-tp-midnight">
                        {t("password")}
                      </label>
                      <button
                        type="button"
                        onClick={() => switchTab("FORGOT")}
                        className="text-[11px] font-bold text-tp-cyan-hover hover:underline"
                      >
                        {isAr ? "نسيت كلمة المرور ؟" : "Mot de passe oublié ?"}
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-tp-muted absolute start-3.5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full ps-10 pe-10 py-2.5 rounded-xl border border-tp-line focus:border-tp-cyan focus:ring-2 focus:ring-tp-cyan/20 focus:outline-none text-xs font-bold text-tp-midnight bg-tp-surface-2"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute end-3 text-tp-muted hover:text-tp-midnight p-1"
                        aria-label="Afficher ou masquer mot de passe"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-control bg-tp-cyan hover:bg-tp-cyan-hover disabled:opacity-60 text-white text-xs sm:text-sm font-black shadow-tp-cyan transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>{t("loginBtn")}</span>
                        <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center text-xs text-tp-muted border-t border-tp-line">
                    {t("noAccount")}{" "}
                    <button
                      type="button"
                      onClick={() => switchTab("REGISTER")}
                      className="font-black text-tp-cyan-hover hover:underline"
                    >
                      {t("registerBtn")}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── TAB 2: INSCRIPTION ── */}
            {activeTab === "REGISTER" && (
              <div className="space-y-4">
                <GoogleAuthButton
                  variant="dark"
                  callbackUrl="/fr"
                  onSuccess={() => {
                    onClose();
                    router.refresh();
                  }}
                />

                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-tp-line w-full" />
                  <span className="bg-white px-3 text-[11px] font-bold text-tp-muted uppercase tracking-wider relative z-10 shrink-0">
                    {isAr ? "أو التسجيل اليدوي عبر الاستمارة" : "ou inscription par formulaire"}
                  </span>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {/* SECTION 1: IDENTITÉ OFFICIELLE */}
                  <div className="p-4 rounded-2xl bg-tp-surface-2 border border-tp-line space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-tp-cyan text-white text-[11px] font-black flex items-center justify-center">
                        1
                      </span>
                      <h4 className="text-xs font-black text-tp-midnight uppercase tracking-wider">
                        {isAr ? "المعلومات الشخصية الرسمية" : "Identité Officielle (Feuille de Route)"}
                      </h4>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-tp-midnight">
                        {t("fullName")} *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={isAr ? "يوسف بناني" : "Ex: Youssef Bennani"}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-tp-line focus:border-tp-cyan focus:outline-none text-xs font-bold text-tp-midnight bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-tp-midnight">
                          {t("cin")}
                        </label>
                        <span className="text-[10px] text-tp-muted">
                          {isAr ? "للدرك الملكي (اختياري)" : "Gendarmerie/TIST (facultatif)"}
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="Ex: AB123456"
                        value={cin}
                        onChange={(e) => setCin(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 rounded-xl border border-tp-line focus:border-tp-cyan focus:outline-none text-xs font-bold text-tp-midnight uppercase font-mono bg-white"
                      />
                    </div>
                  </div>

                  {/* SECTION 2: COORDONNÉES DE CONTACT */}
                  <div className="p-4 rounded-2xl bg-tp-surface-2 border border-tp-line space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-tp-cyan text-white text-[11px] font-black flex items-center justify-center">
                        2
                      </span>
                      <h4 className="text-xs font-black text-tp-midnight uppercase tracking-wider">
                        {isAr ? "معلومات التواصل وتأكيد الحجز" : "Coordonnées de Contact & WhatsApp"}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-tp-midnight">
                          {t("phone")} *
                        </label>
                        <div className="relative flex items-center">
                          <Phone className="w-3.5 h-3.5 text-tp-muted absolute start-3" />
                          <input
                            type="tel"
                            required
                            placeholder="0661000000"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full ps-8 pe-3 py-2 rounded-xl border border-tp-line focus:border-tp-cyan focus:outline-none text-xs font-bold text-tp-midnight bg-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-tp-midnight">
                          {t("email")} *
                        </label>
                        <div className="relative flex items-center">
                          <Mail className="w-3.5 h-3.5 text-tp-muted absolute start-3" />
                          <input
                            type="email"
                            required
                            placeholder="exemple@email.ma"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full ps-8 pe-3 py-2 rounded-xl border border-tp-line focus:border-tp-cyan focus:outline-none text-xs font-bold text-tp-midnight bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: SÉCURITÉ DU MOT DE PASSE */}
                  <div className="p-4 rounded-2xl bg-tp-surface-2 border border-tp-line space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-tp-cyan text-white text-[11px] font-black flex items-center justify-center">
                        3
                      </span>
                      <h4 className="text-xs font-black text-tp-midnight uppercase tracking-wider">
                        {isAr ? "كلمة المرور والأمان" : "Sécurité du Compte"}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-tp-midnight">
                          {t("password")} * <span className="text-tp-muted font-normal">(min. 8 car.)</span>
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={8}
                            placeholder="••••••••"
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            className="w-full ps-3 pe-8 py-2 rounded-xl border border-tp-line focus:border-tp-cyan focus:outline-none text-xs font-bold text-tp-midnight bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute end-2 text-tp-muted hover:text-tp-midnight p-1"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-tp-midnight">
                          {t("confirmPassword")} *
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full ps-3 pe-8 py-2 rounded-xl border focus:outline-none text-xs font-bold text-tp-midnight bg-white ${
                              confirmPassword && registerPassword !== confirmPassword
                                ? "border-rose-400 focus:border-rose-500"
                                : "border-tp-line focus:border-tp-cyan"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute end-2 text-tp-muted hover:text-tp-midnight p-1"
                          >
                            {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {confirmPassword && registerPassword !== confirmPassword && (
                          <p className="text-[10px] text-rose-600 font-bold">
                            {isAr ? "كلمتا المرور غير متطابقتين" : "Les mots de passe ne correspondent pas"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Terms checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="w-4 h-4 text-tp-cyan rounded border-tp-line focus:ring-tp-cyan mt-0.5"
                      />
                      <span className="text-[11px] text-tp-slate font-medium leading-tight">
                        {isAr
                          ? "أوافق على الشروط العامة لخدمات السفر والنقل السياحي لرحلات بلادنا."
                          : "J'accepte les conditions générales de vente et d'assurance voyage Rahalat Bladna."}
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!agreeTerms || isLoading || (!!confirmPassword && registerPassword !== confirmPassword)}
                    className="w-full py-3.5 rounded-control bg-tp-cyan hover:bg-tp-cyan-hover disabled:opacity-50 text-white text-xs sm:text-sm font-black shadow-tp-cyan transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>{t("registerBtn")}</span>
                        <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                      </>
                    )}
                  </button>

                  <div className="text-center text-xs text-tp-muted pt-1 border-t border-tp-line">
                    {t("hasAccount")}{" "}
                    <button
                      type="button"
                      onClick={() => switchTab("LOGIN")}
                      className="font-black text-tp-cyan-hover hover:underline"
                    >
                      {t("loginBtn")}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── TAB 3: MOT DE PASSE OUBLIÉ ── */}
            {activeTab === "FORGOT" && (
              <div className="space-y-4">
                {successMessage ? (
                  <div className="space-y-4 py-2">
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed space-y-2">
                      <div className="flex items-center gap-2 font-black text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{isAr ? "تم إرسال الرابط بنجاح" : "Email envoyé avec succès"}</span>
                      </div>
                      <p className="text-emerald-800 font-medium">{successMessage}</p>
                      <p className="text-[11px] text-emerald-700 pt-1 border-t border-emerald-200/60">
                        {isAr
                          ? "يرجى مراجعة صندوق الوارد الخاص بك ومجلد الرسائل غير المرغوب فيها (Spam). صلاحية الرابط 60 دقيقة."
                          : "Pensez à vérifier votre boîte de réception et le dossier Courrier indésirable (Spam). Le lien est valide 60 minutes."}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => switchTab("LOGIN")}
                      className="w-full py-3.5 rounded-control bg-tp-midnight hover:bg-tp-midnight/90 text-white text-xs sm:text-sm font-black shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                      <span>{isAr ? "الرجوع لتسجيل الدخول" : "Retour à la connexion"}</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <div className="p-4 rounded-2xl bg-tp-surface-2 border border-tp-line space-y-2">
                      <div className="flex items-center gap-2 text-tp-midnight font-black text-xs">
                        <HelpCircle className="w-4 h-4 text-tp-cyan-hover" />
                        <span>{isAr ? "كيفية استرجاع الحساب" : "Procédure de Récupération"}</span>
                      </div>
                      <p className="text-xs text-tp-slate leading-relaxed">
                        {isAr
                          ? "أدخل البريد الإلكتروني أو رقم الهاتف المسجل لتلقي رابط إعادة تعيين كلمة المرور فوراً."
                          : "Saisissez l'adresse email ou le numéro de téléphone associé à votre compte pour recevoir un lien de réinitialisation sécurisé."}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-tp-midnight">
                        {t("emailOrPhone")}
                      </label>
                      <div className="relative flex items-center">
                        <KeyRound className="w-4 h-4 text-tp-muted absolute start-3.5" />
                        <input
                          type="text"
                          required
                          placeholder="contact@exemple.ma / 0661000000"
                          value={forgotIdentifier}
                          onChange={(e) => setForgotIdentifier(e.target.value)}
                          className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-tp-line focus:border-tp-cyan focus:outline-none text-xs font-bold text-tp-midnight bg-tp-surface-2"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 rounded-control bg-tp-cyan hover:bg-tp-cyan-hover disabled:opacity-60 text-white text-xs sm:text-sm font-black shadow-tp-cyan transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>{t("sendResetBtn")}</span>
                          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                        </>
                      )}
                    </button>

                    <div className="text-center text-xs text-tp-muted pt-2 border-t border-tp-line">
                      <button
                        type="button"
                        onClick={() => switchTab("LOGIN")}
                        className="font-black text-tp-cyan-hover hover:underline"
                      >
                        {isAr ? "الرجوع إلى تسجيل الدخول" : "Retour à la connexion"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
