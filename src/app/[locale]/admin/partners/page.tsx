import React from "react";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/adminAuth";
import { PartnerListManager } from "@/components/admin/partners/PartnerListManager";
import { Building2, Bus, ShieldCheck } from "lucide-react";

export default async function AdminPartnersPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdminSession("VIEW_PARTNERS", locale);
  const isAr = locale === "ar";

  const dbPartners: any[] = await prisma.$queryRawUnsafe(
    'SELECT * FROM "Partner" ORDER BY "companyName" ASC'
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            <span>{isAr ? "دليل الشركاء والموردين المعتمدين" : "Réseau de Prestataires Agréés"}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {isAr ? "إدارة الفنادق، النقل السياحي والأنشطة الترفيهية" : "Partenaires Hôteliers, Transport & Activités"}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {isAr
              ? "سجل موحد لجميع الفنادق، شركات النقل TIST، وأندية الأنشطة والرياضات (الغطس، الكواد، الجيت سكي، القوارب)."
              : "Base de données centralisée de nos hébergements, transporteurs et prestataires d'activités (Quads, Plongée, Jet Ski, Barquiers) avec tarifs négociés."}
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <span className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-900 text-tp-cyan-hover dark:text-tp-cyan font-mono font-black text-sm border border-slate-200 dark:border-slate-800 shadow-xs">
            {dbPartners.length} {isAr ? "شريك معتمد" : "Partenaires Agréés"}
          </span>
        </div>
      </div>

      <PartnerListManager initialPartners={dbPartners} />
    </div>
  );
}
