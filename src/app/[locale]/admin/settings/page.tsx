import React from "react";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { AgencySettingsManager } from "@/components/admin/settings/AgencySettingsManager";
import {
  Settings,
  ShieldCheck,
  Lock,
  UserCheck,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default async function AdminSettingsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdminSession("ADMIN_SETTINGS_PAGE", locale);
  const isAr = locale === "ar";

  // Charger les données de l'agence depuis la DB
  const agency = await prisma.agency.findFirst({
    orderBy: { createdAt: "asc" },
  });

  const agencyData = agency
    ? {
        id: agency.id,
        name: agency.name,
        phone: agency.phone,
        email: agency.email,
        city: agency.city,
        address: agency.address,
        licenseNumber: agency.licenseNumber,
        iceNumber: agency.iceNumber,
        rcNumber: agency.rcNumber,
        bankAccounts: agency.bankAccounts,
      }
    : null;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-tp-cyan/10 border border-tp-cyan/30 text-tp-cyan-hover dark:text-tp-cyan text-xs font-black uppercase tracking-wider">
            <Settings className="w-3.5 h-3.5" />
            <span>{isAr ? "إعدادات المنظومة" : "Configuration de la Plateforme"}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {isAr ? "بيانات الوكالة والأمان" : "Paramètres Généraux"}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {isAr
              ? "تعديل بيانات الوكالة الرسمية، المعرفات القانونية، البنوك والبنية التحتية."
              : "Coordonnées officielles de l'agence, identifiants légaux, comptes bancaires et infrastructure cloud."}
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Editable Agency Info */}
        <AgencySettingsManager initialAgency={agencyData} />

        {/* Card 2: Infrastructure & Sécurité */}
        <div className="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 flex flex-col justify-between transition-colors">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-tp-cyan-hover dark:text-tp-cyan pb-3 border-b border-slate-200 dark:border-slate-800">
              <Lock className="w-5 h-5" />
              <h2 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
                {isAr ? "حالة السحابة وقواعد البيانات" : "Infrastructure & Stockage"}
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-black text-slate-900 dark:text-white text-sm">PostgreSQL Supabase</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">aws-0-eu-central-1.pooler.supabase.com</p>
                </div>
                <span className="px-2.5 py-1 rounded-pill bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                  {isAr ? "متصل" : "Connecté (Actif)"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-black text-slate-900 dark:text-white text-sm">Cloudflare R2 Bucket</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">rahalat-bladna</p>
                </div>
                <span className="px-2.5 py-1 rounded-pill bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                  {isAr ? "يعمل" : "Opérationnel"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-black text-slate-900 dark:text-white text-sm">Google OAuth 2.0</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">Authentification active</p>
                </div>
                <span className="px-2.5 py-1 rounded-pill bg-tp-cyan/15 text-tp-cyan-hover dark:text-tp-cyan font-bold text-[10px]">
                  {isAr ? "مفعل" : "Vérifié"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{isAr ? "نظام الأمان والتشفير مشغل بنجاح" : "Environnement de production sécurisé & prêt pour vos données réelles."}</span>
          </div>
        </div>
      </div>

      {/* Card 3: Lien vers la gestion d'équipe centralisée */}
      <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-white shadow-md shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 dark:text-white text-base">
                {isAr ? "إدارة الفريق والأدوار والصلاحيات" : "Gestion de l'Équipe & Rôles (RBAC)"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
                {isAr
                  ? "إضافة أعضاء الفريق (المنظم، المرشد، السائق)، تحديد الأدوار والصلاحيات (الماسح، التحصيل، التعديل) من صفحة الفريق المركزية."
                  : "Ajout des membres (Organisateur, Guide, Chauffeur), attribution des permissions terrain (Scanner, Encaissement, Modification) — géré exclusivement depuis la page dédiée."}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {["Super Admin", "Organisateur", "Tour Leader", "Guide Officiel", "Chauffeur"].map((r) => (
                  <span key={r} className="px-2 py-0.5 rounded-pill bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <Link
            href={`/${locale}/admin/team`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-500 text-white text-xs font-black shadow-md shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all shrink-0"
          >
            <UserCheck className="w-4 h-4" />
            <span>{isAr ? "إدارة الفريق" : "Gérer l'Équipe"}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </Link>
        </div>
      </div>
    </div>
  );
}
