"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Logo } from "@/components/shared/Logo";
import { ShieldCheck, User, Phone, Mail, Lock, FileBadge, ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { registerUserAction } from "@/actions/auth.actions";

export default function RegisterPage() {
  const locale = useLocale();
  const t = useTranslations("auth");
  const isAr = locale === "ar";
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [cin, setCin] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const result = await registerUserAction({
        fullName,
        email,
        phone,
        password,
        confirmPassword,
        cinOrPassport: cin || undefined,
      });

      if (!result.success) {
        setErrorMsg(result.error || (isAr ? "فشل إنشاء الحساب" : "Échec de la création du compte."));
        return;
      }

      // Auto sign-in
      const signInRes = await signIn("credentials", {
        redirect: false,
        emailOrPhone: email.trim().toLowerCase(),
        password,
      });

      setSuccess(true);
      setTimeout(() => {
        if (!cin) {
          router.push(`/${locale}/completer-profil`);
        } else {
          router.push(`/${locale}`);
        }
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || (isAr ? "خطأ تقني" : "Erreur technique. Veuillez réessayer."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] bg-tp-ivory flex items-center justify-center p-4 sm:p-6 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-tp-line overflow-hidden">
        {/* Header */}
        <div className="bg-tp-midnight p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-moroccan-pattern-dark opacity-20 pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <Link
                href={`/${locale}`}
                className="inline-flex items-center gap-1.5 text-xs text-tp-cyan-soft hover:underline font-bold"
              >
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{isAr ? "العودة للرئيسية" : "Retour à l'accueil"}</span>
              </Link>
              <Logo variant="light" size="sm" />
            </div>

            <div>
              <h1 className="text-2xl font-black text-white">
                {t("registerTitle")}
              </h1>
              <p className="text-xs text-tp-ivory/75 leading-relaxed mt-1">
                {t("registerSubtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {success && (
            <div className="p-4 rounded-2xl bg-tp-ok-bg text-tp-ok-fg text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{t("registerSuccess")}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Auth Button */}
          <GoogleAuthButton
            variant="dark"
            callbackUrl={`/${locale}`}
          />

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-tp-line w-full" />
            <span className="bg-white px-3 text-[11px] font-bold text-tp-muted uppercase tracking-wider relative z-10 shrink-0">
              {isAr ? "أو التسجيل عبر الاستمارة" : "ou inscription par formulaire"}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Identité */}
            <div className="p-4 rounded-2xl bg-tp-surface-2 border border-tp-line space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-tp-cyan text-white text-[11px] font-black flex items-center justify-center">
                  1
                </span>
                <h2 className="text-xs font-black text-tp-midnight uppercase tracking-wider">
                  {isAr ? "المعلومات الشخصية الرسمية" : "Identité Officielle"}
                </h2>
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
                <label className="block text-[11px] font-bold text-tp-midnight">
                  {t("cin")} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: AB123456"
                  value={cin}
                  onChange={(e) => setCin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-tp-line focus:border-tp-cyan focus:outline-none text-xs font-bold text-tp-midnight uppercase font-mono bg-white"
                />
              </div>
            </div>

            {/* Step 2: Contact */}
            <div className="p-4 rounded-2xl bg-tp-surface-2 border border-tp-line space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-tp-cyan text-white text-[11px] font-black flex items-center justify-center">
                  2
                </span>
                <h2 className="text-xs font-black text-tp-midnight uppercase tracking-wider">
                  {isAr ? "معلومات التواصل" : "Coordonnées de Contact"}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-tp-midnight">
                    {t("phone")} *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0661000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-tp-line focus:border-tp-cyan focus:outline-none text-xs font-bold text-tp-midnight bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-tp-midnight">
                    {t("email")} *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="contact@exemple.ma"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-tp-line focus:border-tp-cyan focus:outline-none text-xs font-bold text-tp-midnight bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Password */}
            <div className="p-4 rounded-2xl bg-tp-surface-2 border border-tp-line space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-tp-cyan text-white text-[11px] font-black flex items-center justify-center">
                  3
                </span>
                <h2 className="text-xs font-black text-tp-midnight uppercase tracking-wider">
                  {isAr ? "كلمة المرور والأمان" : "Sécurité du Compte"}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-tp-midnight">
                    {t("password")} *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-tp-line focus:border-tp-cyan focus:outline-none text-xs font-bold text-tp-midnight bg-white"
                  />
                </div>
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
                  <span>{t("registerBtn")}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs text-tp-muted border-t border-tp-line">
              {t("hasAccount")}{" "}
              <Link
                href={`/${locale}/connexion`}
                className="font-black text-tp-cyan-hover hover:underline"
              >
                {t("loginBtn")}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
