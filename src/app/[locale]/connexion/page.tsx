"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Logo } from "@/components/shared/Logo";
import { ShieldCheck, User, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const locale = useLocale();
  const t = useTranslations("auth");
  const isAr = locale === "ar";

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        emailOrPhone,
        password,
        callbackUrl: `/${locale}`,
      });
      if (res?.ok) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = `/${locale}`;
        }, 800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-tp-ivory flex items-center justify-center p-4 sm:p-6 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-tp-line overflow-hidden">
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
                {t("loginTitle")}
              </h1>
              <p className="text-xs text-tp-ivory/75 leading-relaxed mt-1">
                {t("loginSubtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {success && (
            <div className="p-4 rounded-2xl bg-tp-ok-bg text-tp-ok-fg text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{t("loginSuccess")}</span>
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
              {isAr ? "أو باستخدام البريد الإلكتروني" : "ou avec vos identifiants"}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-tp-line focus:border-tp-cyan focus:outline-none text-xs font-bold text-tp-midnight bg-tp-surface-2"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-tp-midnight">
                  {t("password")}
                </label>
                <Link
                  href={`/${locale}/connexion`}
                  className="text-[11px] font-bold text-tp-cyan-hover hover:underline"
                >
                  {isAr ? "نسيت كلمة المرور ؟" : "Mot de passe oublié ?"}
                </Link>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-tp-muted absolute start-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full ps-10 pe-10 py-2.5 rounded-xl border border-tp-line focus:border-tp-cyan focus:outline-none text-xs font-bold text-tp-midnight bg-tp-surface-2"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 text-tp-muted hover:text-tp-midnight p-1"
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
              <span>{t("loginBtn")}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>

            <div className="pt-2 text-center text-xs text-tp-muted border-t border-tp-line">
              {t("noAccount")}{" "}
              <Link
                href={`/${locale}/inscription`}
                className="font-black text-tp-cyan-hover hover:underline"
              >
                {t("registerBtn")}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
