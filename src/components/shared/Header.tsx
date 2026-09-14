"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { UserAuthDropdown } from "./UserAuthDropdown";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import { AuthModal, AuthTab } from "./AuthModal";
import { Logo } from "./Logo";
import { 
  PhoneCall, Sparkles, Menu, X, Compass,
  Briefcase, Star, ShieldCheck,
  LogIn, UserPlus, Ticket, LogOut, Home, Palmtree, MessageCircle,
  Instagram, Facebook, UserCheck
} from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const locale = useLocale();
  const isAr = locale === "ar";
  const { data: session } = useSession();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileAuthModalOpen, setMobileAuthModalOpen] = useState(false);
  const [mobileAuthTab, setMobileAuthTab] = useState<AuthTab>("LOGIN");

  const userRole = ((session?.user as any)?.role || "").toUpperCase();
  const isAdmin = ["ADMIN", "SUPERADMIN", "SUPER_ADMIN", "AGENCY_ADMIN"].includes(userRole);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent background scrolling when mobile drawer is open (Mobile-First / iOS)
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.touchAction = "auto";
    }
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.touchAction = "auto";
    };
  }, [mobileMenuOpen]);

  // Masquer complètement la TopBar publique sur toutes les pages d'administration
  if (pathname?.includes("/admin")) {
    return null;
  }

  const navLinks = [
    { href: `/${locale}`, label: t("home"), icon: Home },
    { href: `/${locale}#weekends`, label: t("weekendTrips"), icon: Palmtree },
    { href: `/${locale}/trips`, label: t("trips"), icon: Compass },
    { href: `/${locale}#sur-mesure`, label: t("tailorMade"), icon: Sparkles },
    { href: `/${locale}#b2b`, label: t("b2b"), icon: Briefcase },
    { href: `/${locale}#avis`, label: t("reviews"), icon: Star },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-tp-sm border-b border-tp-line/80 dark:border-slate-800/80 py-2.5"
            : "bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm border-b border-tp-line/40 dark:border-slate-800/40 py-3 sm:py-3.5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4">
          {/* Brand Logo */}
          <Logo />

          {/* Desktop Navigation Links (Visible >= 1024px) */}
          <nav className="hidden lg:flex items-center gap-6 text-[13.5px] font-bold text-tp-slate dark:text-slate-300">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-tp-cyan-hover dark:hover:text-tp-cyan transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-tp-cyan after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Right Bar (>= 1024px) */}
          <div className="hidden lg:flex items-center gap-2.5">
            <ThemeToggle variant="compact" />
            <UserAuthDropdown />
            <LanguageSwitcher />

            {/* Social Media Links (Instagram & Facebook) */}
            <div className="flex items-center gap-1.5 border-s border-tp-line/60 dark:border-slate-800 ps-2">
              <a
                href="https://www.instagram.com/rahalat_bladna/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] border border-slate-200/80 dark:border-slate-700 transition-all duration-300 shadow-xs hover:shadow-md hover:scale-110 active:scale-95"
                title="Instagram @rahalat_bladna"
                aria-label="Instagram Rahalat Bladna"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://web.facebook.com/profile.php?id=61594099776679"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-[#1877F2] border border-slate-200/80 dark:border-slate-700 transition-all duration-300 shadow-xs hover:shadow-md hover:scale-110 active:scale-95"
                title="Facebook Rahalat Bladna"
                aria-label="Facebook Rahalat Bladna"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>

            <a
              href="https://wa.me/212681024758"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 bg-tp-ok-bg/50 hover:bg-tp-ok-bg text-tp-ok-fg px-3 py-2 rounded-control text-xs font-extrabold border border-tp-ok-fg/20 transition-all shadow-tp-sm active:scale-95"
              aria-label="Contacter sur WhatsApp"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">WhatsApp</span>
            </a>

            <Link
              href={`/${locale}/trips`}
              className="inline-flex items-center gap-2 bg-tp-cyan hover:bg-tp-cyan-hover text-white px-4.5 py-2.5 rounded-control text-xs sm:text-sm font-extrabold shadow-tp-cyan hover:shadow-lg transition-all active:scale-95 hover:translate-y-[-1px]"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t("bookNow")}</span>
            </Link>
          </div>

          {/* Tablet & Mobile Right Bar (< 1024px) */}
          <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
            <ThemeToggle variant="compact" />
            <UserAuthDropdown />
            <LanguageSwitcher />

            {/* Hamburger Trigger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 sm:p-2.5 rounded-2xl text-tp-midnight dark:text-white hover:bg-tp-cream/60 dark:hover:bg-slate-800 border border-tp-line dark:border-slate-700 active:scale-95 transition-all shadow-tp-sm"
              aria-label="Ouvrir le menu de navigation"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Modern Slide-Over Mobile & Tablet Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[999] lg:hidden animate-in fade-in duration-200">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel in Midnight Glassmorphism */}
          <div className="fixed inset-y-0 end-0 max-w-sm w-full bg-slate-950/95 backdrop-blur-2xl border-s border-slate-800 shadow-2xl p-5 sm:p-6 flex flex-col justify-between z-10 overflow-y-auto overscroll-contain animate-in slide-in-from-right duration-300 pb-safe">
            <div className="space-y-6">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <Logo variant="light" size="md" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition active:scale-95"
                  aria-label="Fermer le menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Session Profile Header in Mobile Drawer */}
              {session?.user ? (
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-tp-cyan/20 border border-tp-cyan/40 flex items-center justify-center text-tp-cyan font-black text-sm overflow-hidden shrink-0">
                      {session.user.image ? (
                        <img
                          src={session.user.image}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        session.user.name?.charAt(0).toUpperCase() || "R"
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-white truncate">
                        {session.user.name || "Voyageur"}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate font-mono">
                        {session.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1 border-t border-slate-800/80">
                    <Link
                      href={`/${locale}/mon-compte/profil`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-950 text-slate-200 hover:bg-slate-800 font-bold text-[11px] flex items-center justify-center gap-1.5 border border-slate-800"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isAr ? "حسابي والأمان" : "Mon Profil & Sécurité"}</span>
                    </Link>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/${locale}/mon-compte/reservations`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="py-2 px-3 rounded-xl bg-slate-950 text-tp-cyan hover:bg-slate-800 font-bold text-[11px] flex items-center justify-center gap-1.5 border border-slate-800"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>{t("myBookings")}</span>
                      </Link>

                      {isAdmin ? (
                        <Link
                          href={`/${locale}/admin`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="py-2 px-3 rounded-xl bg-tp-cyan/10 text-tp-cyan hover:bg-tp-cyan/20 font-bold text-[11px] flex items-center justify-center gap-1.5 border border-tp-cyan/30"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{t("admin")}</span>
                        </Link>
                      ) : (
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            signOut({ redirect: false });
                          }}
                          className="py-2 px-3 rounded-xl bg-slate-950 text-red-400 hover:bg-red-500/10 font-bold text-[11px] flex items-center justify-center gap-1.5 border border-slate-800"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{t("logout")}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Guest Auth Callouts */
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800">
                  <button
                    onClick={() => {
                      setMobileAuthTab("LOGIN");
                      setMobileAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="py-2.5 px-3 text-center text-xs font-bold rounded-xl bg-slate-950 text-white shadow-sm border border-slate-800 flex items-center justify-center gap-1.5 hover:bg-slate-800 active:scale-95 transition"
                  >
                    <LogIn className="w-3.5 h-3.5 text-tp-cyan" />
                    <span>{t("login")}</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileAuthTab("REGISTER");
                      setMobileAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="py-2.5 px-3 text-center text-xs font-bold rounded-xl bg-tp-cyan text-slate-950 shadow-tp-cyan flex items-center justify-center gap-1.5 active:scale-95 transition font-black"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{t("register")}</span>
                  </button>
                </div>
              )}

              {/* Navigation Links with Icons */}
              <nav className="flex flex-col space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition-all border border-transparent hover:border-slate-800 active:scale-[0.98]"
                    >
                      <Icon className="w-4 h-4 text-tp-cyan" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Bottom Actions with Safe Area */}
            <div className="space-y-3 pt-6 border-t border-slate-800 mt-6">
              {/* Social Channels (Instagram & Facebook) */}
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href="https://www.instagram.com/rahalat_bladna/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#f09433]/20 via-[#dc2743]/20 to-[#bc1888]/20 hover:from-[#f09433]/30 hover:to-[#bc1888]/30 border border-[#dc2743]/40 text-white text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <Instagram className="w-4 h-4 text-[#E4405F]" />
                  <span>Instagram</span>
                </a>
                <a
                  href="https://web.facebook.com/profile.php?id=61594099776679"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-[#1877F2]/20 hover:bg-[#1877F2]/30 border border-[#1877F2]/40 text-white text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <Facebook className="w-4 h-4 text-[#1877F2]" />
                  <span>Facebook</span>
                </a>
              </div>

              {/* WhatsApp Direct Assistance */}
              <a
                href="https://wa.me/212681024758"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>{isAr ? "مساعدة واتساب 24/7" : "Assistance WhatsApp 24/7"}</span>
              </a>

              {/* CTA Booking Button */}
              <Link
                href={`/${locale}/trips`}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3.5 rounded-2xl bg-tp-cyan hover:bg-tp-cyan-hover text-slate-950 text-center text-xs font-black flex items-center justify-center gap-2 shadow-tp-cyan active:scale-95 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t("bookNow")}</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Auth Modal */}
      <AuthModal
        isOpen={mobileAuthModalOpen}
        initialTab={mobileAuthTab}
        onClose={() => setMobileAuthModalOpen(false)}
      />
    </>
  );
}
