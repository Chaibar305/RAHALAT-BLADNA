"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Logo } from "@/components/shared/Logo";
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { verifyResetTokenAction, resetPasswordAction } from "@/actions/auth.actions";

function ResetPasswordContent() {
  const locale = useLocale();
  const router = useRouter();
  const isAr = locale === "ar";
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  // États de vérification initiale du jeton
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // États du formulaire
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Vérification du token au chargement
  useEffect(() => {
    let isMounted = true;

    async function checkToken() {
      if (!token) {
        if (isMounted) {
          setIsVerifying(false);
          setTokenValid(false);
          setTokenError(
            isAr
              ? "لم يتم العثور على رمز التحقق أو أن الرابط غير مكتمل."
              : "Aucun jeton de réinitialisation n'a été fourni ou le lien est incomplet."
          );
        }
        return;
      }

      try {
        const res = await verifyResetTokenAction(token);
        if (isMounted) {
          setIsVerifying(false);
          if (res.valid) {
            setTokenValid(true);
            setUserEmail(res.email || null);
          } else {
            setTokenValid(false);
            setTokenError(
              res.error ||
                (isAr
                  ? "انتهت صلاحية هذا الرابط أو تم استخدامه بالفعل."
                  : "Ce lien de réinitialisation est invalide ou a expiré.")
            );
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setIsVerifying(false);
          setTokenValid(false);
          setTokenError(
            err.message ||
              (isAr ? "حدث خطأ أثناء التحقق من الرابط." : "Erreur technique lors de la vérification du lien.")
          );
        }
      }
    }

    checkToken();

    return () => {
      isMounted = false;
    };
  }, [token, isAr]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password.length < 8) {
      setFormError(
        isAr
          ? "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل."
          : "Le mot de passe doit comporter au moins 8 caractères."
      );
      return;
    }

    if (password !== confirmPassword) {
      setFormError(
        isAr ? "كلمتا المرور غير متطابقتين." : "Les mots de passe ne correspondent pas."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await resetPasswordAction({
        token,
        password,
        confirmPassword,
        locale,
      });

      if (res.success) {
        setFormSuccess(true);
        setTimeout(() => {
          router.push(`/${locale}/connexion`);
        }, 2200);
      } else {
        setFormError(
          res.error ||
            (isAr
              ? "تعذر تحديث كلمة المرور. يرجى المحاولة مرة أخرى."
              : "Impossible de réinitialiser le mot de passe.")
        );
      }
    } catch (err: any) {
      setFormError(
        err.message ||
          (isAr ? "حدث خطأ غير متوقع في الاتصال." : "Une erreur imprévue est survenue.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPasswordValid = password.length >= 8;
  const isMatch = password.length > 0 && password === confirmPassword;

  return (
    <div className="min-h-[85vh] bg-tp-ivory flex items-center justify-center p-4 sm:p-6 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-tp-line overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header avec motif marocain & Midnight Theme */}
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
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-white/10 backdrop-blur-md text-tp-cyan-soft text-[11px] font-black uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isAr ? "تحديث الأمان" : "Sécurité du Compte"}</span>
              </div>
              <h1 className="text-2xl font-black text-white">
                {isAr ? "إعادة تعيين كلمة المرور" : "Nouveau mot de passe"}
              </h1>
              <p className="text-xs text-tp-ivory/75 leading-relaxed mt-1">
                {isAr
                  ? "اختر كلمة مرور جديدة قوية لحماية حسابك في رحلات بلادنا."
                  : "Définissez un mot de passe sécurisé pour accéder à votre espace."}
              </p>
            </div>
          </div>
        </div>

        {/* Corps de la page */}
        <div className="p-6 sm:p-8 space-y-5">
          {/* ÉTAT 1 : VÉRIFICATION DU JETON */}
          {isVerifying && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-tp-cyan animate-spin mx-auto" />
              <p className="text-xs font-bold text-tp-slate">
                {isAr
                  ? "جارٍ التحقق من صلاحية رابط الاسترجاع..."
                  : "Vérification de la validité de votre lien sécurisé..."}
              </p>
            </div>
          )}

          {/* ÉTAT 2 : JETON INVALIDE OU EXPIRÉ */}
          {!isVerifying && !tokenValid && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-black text-rose-900">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{isAr ? "رابط غير صالح أو منتهي الصلاحية" : "Lien expiré ou introuvable"}</span>
                </div>
                <p className="leading-relaxed">
                  {tokenError ||
                    (isAr
                      ? "انتهت صلاحية هذا الرابط أو تم استخدامه مسبقاً. روابط الاسترجاع صالحة لمدة 60 دقيقة فقط."
                      : "Ce lien de réinitialisation a expiré ou a déjà été utilisé. Les liens sont valides 60 minutes.")}
                </p>
              </div>

              <div className="space-y-2">
                <Link
                  href={`/${locale}/connexion`}
                  className="w-full py-3.5 rounded-control bg-tp-cyan hover:bg-tp-cyan-hover text-white text-xs sm:text-sm font-black shadow-tp-cyan transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isAr ? "طلب رابط استرجاع جديد" : "Demander un nouveau lien"}</span>
                </Link>

                <Link
                  href={`/${locale}/connexion`}
                  className="w-full py-3 text-center block text-xs font-bold text-tp-muted hover:text-tp-midnight hover:underline"
                >
                  {isAr ? "العودة لتسجيل الدخول" : "Retour à la page de connexion"}
                </Link>
              </div>
            </div>
          )}

          {/* ÉTAT 3 : FORMULAIRE DE SAISIE */}
          {!isVerifying && tokenValid && (
            <>
              {/* Succès final */}
              {formSuccess ? (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-4 text-center animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-black">
                      {isAr ? "تم تغيير كلمة المرور بنجاح !" : "Mot de passe modifié avec succès !"}
                    </h3>
                    <p className="text-xs text-emerald-700 leading-relaxed mt-1">
                      {isAr
                        ? "يمكنك الآن استخدام كلمة المرور الجديدة لتسجيل الدخول إلى حسابك. جارٍ تحويلك تلقائياً..."
                        : "Votre compte est à nouveau sécurisé. Redirection vers la page de connexion..."}
                    </p>
                  </div>

                  <Link
                    href={`/${locale}/connexion`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-control bg-tp-midnight hover:bg-tp-midnight/90 text-white text-xs font-black shadow transition-all"
                  >
                    <span>{isAr ? "تسجيل الدخول الآن" : "Se connecter maintenant"}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {userEmail && (
                    <div className="p-3.5 rounded-xl bg-tp-surface-2 border border-tp-line flex items-center justify-between text-xs">
                      <span className="text-tp-muted font-medium">
                        {isAr ? "الحساب المعني :" : "Compte associé :"}
                      </span>
                      <span className="font-bold text-tp-midnight">
                        {userEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3")}
                      </span>
                    </div>
                  )}

                  {formError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Nouveau mot de passe */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-tp-midnight">
                      {isAr ? "كلمة المرور الجديدة" : "Nouveau mot de passe"}
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-tp-muted absolute start-3.5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full ps-10 pe-10 py-2.5 rounded-xl border border-tp-line focus:border-tp-cyan focus:outline-none text-xs font-bold text-tp-midnight bg-tp-surface-2"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute end-3 text-tp-muted hover:text-tp-midnight p-1"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-tp-slate ps-1">
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${
                          isPasswordValid ? "bg-emerald-500" : "bg-tp-line"
                        }`}
                      />
                      <span>{isAr ? "8 أحرف على الأقل" : "Au moins 8 caractères"}</span>
                    </div>
                  </div>

                  {/* Confirmer le mot de passe */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-tp-midnight">
                      {isAr ? "تأكيد كلمة المرور الجديدة" : "Confirmer le nouveau mot de passe"}
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-tp-muted absolute start-3.5" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full ps-10 pe-10 py-2.5 rounded-xl border border-tp-line focus:border-tp-cyan focus:outline-none text-xs font-bold text-tp-midnight bg-tp-surface-2"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute end-3 text-tp-muted hover:text-tp-midnight p-1"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] ps-1">
                        {isMatch ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isAr ? "كلمتا المرور متطابقتان" : "Les mots de passe correspondent"}
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {isAr ? "كلمتا المرور غير متطابقتين" : "Les mots de passe ne correspondent pas"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bouton de validation */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !isPasswordValid || !isMatch}
                    className="w-full py-3.5 rounded-control bg-tp-cyan hover:bg-tp-cyan-hover disabled:opacity-50 text-white text-xs sm:text-sm font-black shadow-tp-cyan transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>{isAr ? "تأكيد كلمة المرور الجديدة" : "Enregistrer le mot de passe"}</span>
                        <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] bg-tp-ivory flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-tp-cyan animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
