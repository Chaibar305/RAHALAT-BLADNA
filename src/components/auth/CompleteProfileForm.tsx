"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { 
  ShieldCheck, Phone, CreditCard, MapPin, 
  Sparkles, CheckCircle2, ArrowRight, ArrowLeft, Loader2, AlertCircle 
} from "lucide-react";
import { completeProfileAction } from "@/actions/user.actions";

export function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { data: session, update } = useSession();
  const locale = useLocale();
  const isAr = locale === "ar";

  const user = session?.user as any;
  const [phone, setPhone] = useState(user?.phone || "");
  const [cinOrPassport, setCinOrPassport] = useState(user?.cinOrPassport || "");
  const [city, setCity] = useState("Casablanca");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone || phone.trim().length < 8) {
      setError(isAr ? "يرجى إدخال رقم هاتف صحيح (WhatsApp)" : "Veuillez renseigner un numéro de téléphone valide.");
      return;
    }

    if (!cinOrPassport || cinOrPassport.trim().length < 4) {
      setError(isAr ? "يرجى إدخال رقم البطاقة الوطنية (CIN) أو جواز السفر" : "Veuillez renseigner votre N° CIN ou Passeport.");
      return;
    }

    startTransition(async () => {
      const res = await completeProfileAction({
        phone,
        cinOrPassport,
        city,
      });

      if (res.success) {
        // Mettre à jour la session NextAuth
        if (update) {
          await update({
            phone,
            cinOrPassport,
            isProfileComplete: true,
          });
        }
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError(res.error || "Une erreur est survenue.");
      }
    });
  };

  const handleSkip = () => {
    router.push(callbackUrl);
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-950 p-6 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Decorative top glow */}
      <div className="absolute -top-24 -end-24 w-48 h-48 bg-tp-cyan/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center space-y-2 relative z-10">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-tp-midnight to-slate-900 border-2 border-tp-cyan/40 p-1 mx-auto flex items-center justify-center shadow-lg">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt="Avatar"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-tp-cyan/20 flex items-center justify-center text-tp-cyan font-black text-xl">
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "R"}
            </div>
          )}
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tp-cyan/10 border border-tp-cyan/20 text-tp-cyan text-[11px] font-black uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isAr ? "مرحباً بك في رحلات بلادنا" : "Bienvenue sur Rahalat Bladna"}</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white">
          {session?.user?.name || (isAr ? "إكمال الملف الشخصي" : "Complétez votre profil voyageur")}
        </h1>

        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          {isAr
            ? "يرجى تزويدنا برقم الهاتف والبطاقة الوطنية لضمان تأمينك في الرحلات وبيان الركاب الرسمي."
            : "Renseignez vos coordonnées pour faciliter vos prochaines réservations et la feuille de route touristique officielle."}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        {/* Email Read-only */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-400">
            {isAr ? "البريد الإلكتروني الموثق" : "Email vérifié (Google)"}
          </label>
          <div className="px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-center justify-between font-mono">
            <span className="truncate">{session?.user?.email}</span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              <span>{isAr ? "موثق" : "Vérifié"}</span>
            </span>
          </div>
        </div>

        {/* Phone / WhatsApp */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-300">
            {isAr ? "رقم الهاتف / واتساب *" : "Numéro de Téléphone (WhatsApp) *"}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-500 text-xs font-bold font-mono">
              🇲🇦 +212
            </div>
            <input
              type="tel"
              required
              placeholder="06 12 34 56 78"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full ps-20 pe-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white font-mono focus:border-tp-cyan focus:outline-none transition shadow-inner"
            />
          </div>
          <p className="text-[10px] text-slate-500">
            {isAr ? "سنرسل تذاكرك ورمز QR الخاص بالحجز عبر الواتساب" : "Pour recevoir vos billets numériques et QR Code d'embarquement."}
          </p>
        </div>

        {/* CIN / Passeport */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-300">
            {isAr ? "رقم البطاقة الوطنية (CIN) أو جواز السفر *" : "N° CIN ou N° Passeport *"}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-tp-cyan">
              <CreditCard className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              placeholder="Ex: AB123456 ou Pass. 09AB..."
              value={cinOrPassport}
              onChange={(e) => setCinOrPassport(e.target.value.toUpperCase())}
              className="w-full ps-10 pe-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white uppercase font-mono tracking-wider focus:border-tp-cyan focus:outline-none transition shadow-inner"
            />
          </div>
          <p className="text-[10px] text-slate-500">
            {isAr ? "مطلوب قانونياً من طرف وزارة النقل والدرك الملكي" : "Exigé par la réglementation du transport touristique marocain (TIST)."}
          </p>
        </div>

        {/* City */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-300">
            {isAr ? "مدينة الإقامة / الانطلاق المفضلة" : "Ville de résidence / départ préférée"}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-tp-cyan">
              <MapPin className="w-4 h-4" />
            </div>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full ps-10 pe-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white focus:border-tp-cyan focus:outline-none transition"
            >
              <option value="Casablanca">Casablanca (الدار البيضاء)</option>
              <option value="Rabat">Rabat (الرباط)</option>
              <option value="Kénitra">Kénitra (القنيطرة)</option>
              <option value="Marrakech">Marrakech (مراكش)</option>
              <option value="Tanger">Tanger (طنجة)</option>
              <option value="Fès">Fès (فاس)</option>
              <option value="Meknès">Meknès (مكناس)</option>
              <option value="Agadir">Agadir (أكادير)</option>
              <option value="Autre">Autre ville au Maroc</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="pt-3 space-y-2">
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 rounded-2xl bg-tp-cyan hover:bg-tp-cyan-hover text-slate-950 font-black text-xs sm:text-sm shadow-tp-cyan transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isAr ? "جارٍ الحفظ..." : "Enregistrement en cours..."}</span>
              </>
            ) : (
              <>
                <span>{isAr ? "حفظ ومتابعة" : "Enregistrer et continuer"}</span>
                {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="w-full py-2.5 rounded-2xl bg-transparent hover:bg-slate-900 text-slate-400 hover:text-slate-200 font-bold text-xs transition"
          >
            {isAr ? "تخطي الآن (سأقوم بالإكمال لاحقاً عند الحجز)" : "Passer pour l'instant (compléter au moment de réserver)"}
          </button>
        </div>
      </form>
    </div>
  );
}
