import React from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default function AdminLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const isAr = locale === "ar";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row antialiased transition-colors duration-200">
      {/* Collapsible / Responsive Admin Sidebar (starts right at top of screen) */}
      <AdminSidebar />

      {/* Main Admin Content Viewport - Self-contained scrollable area starting right at top */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Admin Header Bar (Desktop) */}
        <header className="hidden lg:flex h-16 items-center justify-between px-6 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0 sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black tracking-wider text-slate-600 dark:text-slate-400 uppercase">
              {isAr ? "نظام إدارة رحلات بلادنا المركزي • الإدارة العامة" : "Portail de Direction Officiel • Rahalat Bladna"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle variant="compact" />

            {/* Public Site Link */}
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-tp-cyan dark:hover:text-tp-cyan bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 transition shadow-xs"
              title={isAr ? "زيارة الموقع العام" : "Ouvrir le site public"}
            >
              <span>{isAr ? "الموقع" : "Site Public"}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Scrollable Main Work Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-100 dark:bg-slate-950 transition-colors">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
