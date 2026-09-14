"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { 
  User, LogIn, UserPlus, KeyRound, Ticket, 
  ShieldCheck, LogOut, ChevronDown, Compass, Users, UserCheck 
} from "lucide-react";
import { AuthModal, AuthTab } from "./AuthModal";

export function UserAuthDropdown() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("nav");
  const { user, isAdmin, isSuperAdmin, isLoading, signOut } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<AuthTab>("LOGIN");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const openAuthWithTab = (tab: AuthTab) => {
    setModalInitialTab(tab);
    setAuthModalOpen(true);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut({ callbackUrl: `/${locale}` });
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* User Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-tp-line hover:border-tp-cyan text-xs font-bold text-tp-midnight bg-white/80 backdrop-blur-sm transition-all shadow-tp-sm hover:shadow-md active:scale-95"
          aria-label="Menu Utilisateur"
        >
          {isLoading ? (
            <div className="w-6 h-6 rounded-full bg-slate-200 animate-pulse" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-tp-cyan-tint text-tp-cyan-hover flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name || "Avatar"}
                  className="w-full h-full object-cover"
                />
              ) : user?.name ? (
                user.name.charAt(0).toUpperCase()
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
            </div>
          )}

          <span className="max-w-[100px] truncate hidden sm:inline">
            {isLoading ? "..." : user ? user.name || "Voyageur" : t("guest")}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-tp-muted transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-tp-line/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* Header User Info if logged in */}
            {user ? (
              <div className="px-4 py-3 border-b border-tp-line bg-tp-surface-2/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-tp-cyan-tint text-tp-cyan-hover flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                    {user.image ? (
                      <img src={user.image} alt={user.name || "Avatar"} className="w-full h-full object-cover" />
                    ) : (
                      (user.name || "V").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-tp-midnight truncate">
                      {user.name || "Voyageur"}
                    </p>
                    <p className="text-[11px] text-tp-muted truncate font-mono">
                      {user.email}
                    </p>
                    {isAdmin && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-black font-mono tracking-wider bg-tp-cyan/15 text-tp-cyan border border-tp-cyan/30">
                        {isSuperAdmin ? "👑 SUPER ADMIN" : "🛡️ ADMIN"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-4 py-2.5 border-b border-tp-line text-[11px] font-extrabold text-tp-muted uppercase tracking-wider">
                {isAr ? "الحساب الشخصي" : "Espace Voyageur"}
              </div>
            )}

            {/* Menu Options */}
            <div className="p-1 space-y-0.5 text-xs font-bold">
              {!user ? (
                <>
                  <button
                    onClick={() => openAuthWithTab("LOGIN")}
                    className="w-full px-3 py-2 text-start rounded-xl flex items-center gap-2.5 text-tp-midnight hover:bg-tp-cyan-tint hover:text-tp-cyan-hover transition"
                  >
                    <LogIn className="w-4 h-4 text-tp-cyan" />
                    <span>{t("login")}</span>
                  </button>

                  <button
                    onClick={() => openAuthWithTab("REGISTER")}
                    className="w-full px-3 py-2 text-start rounded-xl flex items-center gap-2.5 text-tp-midnight hover:bg-tp-cyan-tint hover:text-tp-cyan-hover transition"
                  >
                    <UserPlus className="w-4 h-4 text-tp-cyan" />
                    <span>{t("register")}</span>
                  </button>

                  <button
                    onClick={() => openAuthWithTab("FORGOT")}
                    className="w-full px-3 py-2 text-start rounded-xl flex items-center gap-2.5 text-tp-muted hover:bg-tp-surface-2 hover:text-tp-midnight transition text-[11.5px]"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-tp-muted" />
                    <span>{t("forgotPassword")}</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={`/${locale}/mon-compte/profil`}
                    onClick={() => setIsOpen(false)}
                    className="w-full px-3 py-2 text-start rounded-xl flex items-center gap-2.5 text-tp-midnight hover:bg-tp-surface-2 transition"
                  >
                    <UserCheck className="w-4 h-4 text-tp-cyan" />
                    <span>{isAr ? "حسابي والأمان" : "Mon Profil & Sécurité"}</span>
                  </Link>

                  <Link
                    href={`/${locale}/mon-compte/reservations`}
                    onClick={() => setIsOpen(false)}
                    className="w-full px-3 py-2 text-start rounded-xl flex items-center gap-2.5 text-tp-midnight hover:bg-tp-surface-2 transition"
                  >
                    <Ticket className="w-4 h-4 text-tp-cyan-hover" />
                    <span>{t("myBookings")}</span>
                  </Link>

                  {/* Accès direct gestion des circuits pour les administrateurs */}
                  {isAdmin && (
                    <>
                      <Link
                        href={`/${locale}/admin/trips`}
                        onClick={() => setIsOpen(false)}
                        className="w-full px-3 py-2 text-start rounded-xl flex items-center gap-2.5 text-tp-midnight hover:bg-tp-surface-2 transition"
                      >
                        <Compass className="w-4 h-4 text-emerald-600" />
                        <span>{isAr ? "إدارة الرحلات والبرامج" : "Gestion des Circuits"}</span>
                      </Link>

                      <Link
                        href={`/${locale}/admin/clients`}
                        onClick={() => setIsOpen(false)}
                        className="w-full px-3 py-2 text-start rounded-xl flex items-center gap-2.5 text-tp-midnight hover:bg-tp-surface-2 transition"
                      >
                        <Users className="w-4 h-4 text-amber-600" />
                        <span>{isAr ? "قائمة الزبائن والمسافرين" : "Liste des Clients"}</span>
                      </Link>
                    </>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2 text-start rounded-xl flex items-center gap-2.5 text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t("logout")}</span>
                  </button>
                </>
              )}

              {/* Lien d'Administration Conditionnel : Visible UNIQUEMENT pour ADMIN / SUPERADMIN */}
              {isAdmin && (
                <div className="pt-1 mt-1 border-t border-tp-line">
                  <Link
                    href={`/${locale}/admin`}
                    onClick={() => setIsOpen(false)}
                    className="w-full px-3 py-2 text-start rounded-xl flex items-center justify-between text-tp-midnight hover:bg-tp-cyan-tint/50 hover:text-tp-cyan-hover transition text-[11.5px] font-black"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-tp-cyan" />
                      <span>{t("admin")}</span>
                    </div>
                    <span className="text-[10px] text-tp-cyan uppercase font-mono">
                      Tableau de bord &rarr;
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal Triggered from Dropdown */}
      <AuthModal
        isOpen={authModalOpen}
        initialTab={modalInitialTab}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
