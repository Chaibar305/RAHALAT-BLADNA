"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import { 
  LayoutDashboard, FileText, Ticket, Compass, 
  CreditCard, Settings, LogOut, ExternalLink, 
  ShieldCheck, ChevronRight, Menu, X, Bell, User, Users, Building2, QrCode, UserCheck 
} from "lucide-react";
import { getAdminSidebarCountsAction } from "@/actions/sidebar.actions";
import { ThemeToggle } from "./ThemeToggle";

export function AdminSidebar() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [counts, setCounts] = useState<{ bookingsCount: number; pendingPaymentsCount: number }>({ bookingsCount: 0, pendingPaymentsCount: 0 });

  useEffect(() => {
    getAdminSidebarCountsAction().then((res) => {
      if (res.success) {
        setCounts({ bookingsCount: res.bookingsCount, pendingPaymentsCount: res.pendingPaymentsCount });
      }
    });
  }, [pathname]);

  const user = session?.user || {
    name: "Administrateur Rahalat Bladna",
    email: "admin@rahalatbladna.ma",
    role: "SUPER_ADMIN",
  };

  const navItems = [
    {
      label: isAr ? "لوحة القيادة" : "Tableau de Bord",
      href: `/${locale}/admin`,
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: isAr ? "نقطة المسح والصعود (مباشر)" : "Scanner Embarquement",
      href: `/${locale}/admin/scanner`,
      icon: QrCode,
      badge: "Live",
    },
    {
      label: isAr ? "ورقة الطريق وبيان الركاب (TIST)" : "Manifestes TIST & Passagers",
      href: `/${locale}/admin/manifests`,
      icon: FileText,
      badge: isAr ? "رسمي" : "Officiel",
    },
    {
      label: isAr ? "الحجوزات والأقساط" : "Réservations & Acomptes",
      href: `/${locale}/admin/bookings`,
      icon: Ticket,
      badge: counts.bookingsCount > 0 ? String(counts.bookingsCount) : null,
    },
    {
      label: isAr ? "إدارة الرحلات والبرامج" : "Gestion des Circuits",
      href: `/${locale}/admin/trips`,
      icon: Compass,
      badge: null,
    },
    {
      label: isAr ? "العملاء والمسافرون" : "Clients & Voyageurs",
      href: `/${locale}/admin/clients`,
      icon: Users,
      badge: null,
    },
    {
      label: isAr ? "الشركاء والموردون" : "Partenaires",
      href: `/${locale}/admin/partners`,
      icon: Building2,
      badge: null,
    },
    {
      label: isAr ? "المالية وفواتير الشركاء" : "Finances & Facturation",
      href: `/${locale}/admin/finances`,
      icon: CreditCard,
      badge: null,
    },
    {
      label: isAr ? "فريق العمل والأدوار" : "Équipe & Rôles",
      href: `/${locale}/admin/team`,
      icon: UserCheck,
      badge: "RBAC",
    },
    {
      label: isAr ? "إعدادات المنظومة والمستخدمين" : "Paramètres Généraux",
      href: `/${locale}/admin/settings`,
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-3.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            aria-label="Ouvrir le menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo/logo-emblem.png"
              alt="Logo"
              width={26}
              height={26}
              className="object-contain"
            />
            <span className="font-black text-xs text-tp-cyan-hover dark:text-tp-cyan tracking-wider">
              ADMINISTRATION
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle variant="compact" />
          <Link
            href={`/${locale}`}
            className="text-xs text-slate-700 dark:text-slate-300 hover:text-tp-cyan dark:hover:text-white flex items-center gap-1 font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition"
          >
            <span>{isAr ? "الموقع" : "Site Public"}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 start-0 z-50 h-screen w-72 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-e border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 rtl:translate-x-full rtl:lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between transition-colors">
          <Link
            href={`/${locale}/admin`}
            className="flex items-center gap-3 group transition-transform duration-150 hover:scale-[1.01]"
          >
            <div className="relative w-11 h-11 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-1 flex items-center justify-center shadow-sm dark:shadow-lg dark:shadow-black/20 shrink-0 group-hover:border-tp-cyan/50 transition-colors">
              <Image
                src="/images/logo/logo-emblem.png"
                alt="Rahalat Bladna"
                width={38}
                height={38}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h2 className="font-black text-slate-900 dark:text-white text-sm leading-tight group-hover:text-tp-cyan transition-colors">
                {isAr ? "إدارة رحلات بلادنا" : "Rahalat Bladna"}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-tp-cyan-hover dark:text-tp-cyan font-bold uppercase tracking-wider">
                  Espace Direction
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Admin User Badge */}
        <div className="p-3.5 mx-3 my-3 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-tp-cyan/10 border border-tp-cyan/30 text-tp-cyan flex items-center justify-center font-black text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                {user.name}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {(user as any).role || "SUPER_ADMIN"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto tp-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== `/${locale}/admin` && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-black transition-all ${
                  isActive
                    ? "bg-tp-cyan text-white dark:text-slate-950 shadow-md shadow-tp-cyan/25"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white dark:text-slate-950" : "text-slate-400 dark:text-slate-500"}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-pill text-[10px] font-black ${
                      isActive
                        ? "bg-white/20 dark:bg-slate-950 text-white dark:text-tp-cyan"
                        : "bg-slate-200/80 dark:bg-tp-cyan/15 text-slate-700 dark:text-tp-cyan"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 space-y-2 transition-colors">
          {/* Theme Switcher Toggle */}
          <ThemeToggle />

          <Link
            href={`/${locale}`}
            className="w-full px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-between border border-slate-200/80 dark:border-transparent"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-tp-cyan" />
              {isAr ? "الرجوع إلى الموقع العام" : "Voir le Site Public"}
            </span>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180 text-slate-400 dark:text-slate-500" />
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: `/${locale}` })}
            className="w-full px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 transition flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isAr ? "تسجيل الخروج الآمن" : "Déconnexion Sécurisée"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
