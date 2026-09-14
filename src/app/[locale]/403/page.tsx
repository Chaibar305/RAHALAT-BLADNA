import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogIn, Lock } from "lucide-react";

export default function ForbiddenPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const isAr = locale === "ar";

  return (
    <div className="min-h-[85vh] bg-tp-midnight text-white flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 bg-moroccan-pattern-dark opacity-15 pointer-events-none" />
      
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-tp-cyan/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-10 text-center shadow-2xl space-y-6">
        {/* Icon & Code */}
        <div className="space-y-2">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-red-500/20 text-red-300 text-xs font-black tracking-widest uppercase">
            <Lock className="w-3.5 h-3.5" />
            <span>HTTP 403 • FORBIDDEN</span>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2.5">
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            {isAr ? "عذراً، الوصول إلى هذا الفضاء مقيد" : "Accès Réservé à la Direction"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            {isAr
              ? "يتطلب الوصول إلى لوحة إدارة رحلات بلادنا حساباً بصلاحيات إدارية (Admin / Super Admin). حسابك الحالي لا يمتلك الصلاحيات الكافية."
              : "Cette section d'administration requiert un niveau de privilèges élevé (Admin / Direction d'Agence). Votre compte actuel ne dispose pas des droits d'accès nécessaires."}
          </p>
        </div>

        {/* Security Notice */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 text-start space-y-1">
          <p className="font-bold text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            {isAr ? "سجل المراقبة والأمان" : "Journal de Sécurité & Audit"}
          </p>
          <p className="leading-snug">
            {isAr
              ? "تم تسجيل محاولة الدخول لأغراض حماية المنظومة المعلوماتية وفق المعايير المعتمدة."
              : "Cette tentative d'accès a été consignée dans le journal d'audit de sécurité de la plateforme."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link
            href={`/${locale}`}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-black text-xs transition border border-slate-700 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{isAr ? "العودة للرئيسية" : "Retour à l'accueil"}</span>
          </Link>

          <Link
            href={`/${locale}/connexion?callbackUrl=/${locale}/admin`}
            className="py-3 px-4 rounded-xl bg-tp-cyan hover:bg-tp-cyan-hover text-white font-black text-xs transition shadow-tp-cyan flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{isAr ? "تسجيل دخول إداري" : "Connexion Admin"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
