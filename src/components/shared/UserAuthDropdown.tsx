"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { 
  User, LogIn, UserPlus, KeyRound, Ticket, 
  ShieldCheck, LogOut, ChevronDown, Compass, Users, UserCheck,
  QrCode, ClipboardList, PhoneCall, BarChart3, Briefcase
} from "lucide-react";
import { AuthModal, AuthTab } from "./AuthModal";

export function UserAuthDropdown() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("nav");
  const { user, isAdmin, isSuperAdmin, isStaff, teamRole, permissions, isLoading, signOut } = useAuth();

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

  // Fermer le menu lors d'un clic extérieur
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

  // Badge du rôle d'équipe / administratif
  const getRoleBadge = () => {
    if (isSuperAdmin) {
      return { text: "👑 SUPER ADMIN", color: "bg-tp-cyan/15 text-tp-cyan border-tp-cyan/30" };
    }
    if (teamRole === "ORGANIZER" || user?.role === "AGENCY_ADMIN") {
      return { text: isAr ? "🏛️ مدير العمليات" : "🏛️ ORGANISATEUR", color: "bg-blue-500/15 text-blue-600 border-blue-500/30" };
    }
    if (teamRole === "TOUR_LEADER" || user?.role === "TOUR_LEADER") {
      return { text: isAr ? "🧭 قائد رحلة" : "🧭 TOUR LEADER", color: "bg-amber-500/15 text-amber-600 border-amber-500/30" };
    }
    if (teamRole === "CONFIRMATION_AGENT") {
      return { text: isAr ? "📞 تأكيد الحجوزات" : "📞 AGENT CONFIRMATION", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" };
    }
    if (teamRole === "MEDIA_BUYER") {
      return { text: isAr ? "🚀 إعلانات رقمية" : "🚀 MEDIA BUYER", color: "bg-purple-500/15 text-purple-600 border-purple-500/30" };
    }
    if (teamRole === "OFFICIAL_GUIDE") {
      return { text: isAr ? "📜 مرشد رسمي" : "📜 GUIDE OFFICIEL", color: "bg-teal-500/15 text-teal-600 border-teal-500/30" };
    }
    if (teamRole === "PRO_DRIVER" || teamRole === "DRIVER") {
      return { text: isAr ? "🚐 سائق محترف" : "🚐 CHAUFFEUR PRO", color: "bg-sky-500/15 text-sky-600 border-sky-500/30" };
    }
    if (teamRole === "PHOTOGRAPHER_VIDEOGRAPHER") {
      return { text: isAr ? "📸 مصور وموثق" : "📸 VIDÉASTE", color: "bg-rose-500/15 text-rose-600 border-rose-500/30" };
    }
    if (isStaff) {
      return { text: isAr ? "💼 عضو الفريق" : "💼 COLLABORATEUR", color: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30" };
    }
    if (isAdmin) {
      return { text: "🛡️ ADMIN", color: "bg-tp-cyan/15 text-tp-cyan border-tp-cyan/30" };
    }
    return null;
  };

  const roleBadge = getRoleBadge();

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
          <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-tp-line/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
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
                    {roleBadge && (
                      <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-black font-mono tracking-wider border ${roleBadge.color}`}>
                        {roleBadge.text}
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
                  {/* Liens Collaborateur / Terrain */}
                  {(isStaff || isAdmin) && (
                    <div className="mb-2 pb-2 border-b border-tp-line/70">
                      <div className="px-3 py-1 text-[10px] font-black tracking-wider uppercase text-tp-muted flex items-center gap-1.5">
                        <Briefcase className="w-3 h-3 text-tp-cyan" />
                        <span>{isAr ? "فضاء العمل والمهام" : "Espace Collaborateur & Pro"}</span>
                      </div>

                      <Link
                        href={`/${locale}/admin`}
                        onClick={() => setIsOpen(false)}
                        className="w-full px-3 py-2 text-start rounded-xl flex items-center justify-between text-tp-midnight hover:bg-tp-cyan-tint/60 transition group"
                      >
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-tp-cyan group-hover:scale-110 transition-transform" />
                          <span className="font-extrabold text-tp-midnight">{isAr ? "لوحة الإدارة الرئيسية" : "Dashboard / Backoffice"}</span>
                        </div>
                        <span className="text-[10px] text-tp-cyan font-mono font-bold">&rarr;</span>
                      </Link>

                      {/* Scanner mobile direct */}
                      {permissions?.canScanTickets && (
                        <Link
                          href={`/${locale}/admin/scanner`}
                          onClick={() => setIsOpen(false)}
                          className="w-full px-3 py-1.5 text-start rounded-xl flex items-center gap-2.5 text-tp-slate hover:bg-tp-surface-2 transition text-[11.5px]"
                        >
                          <QrCode className="w-3.5 h-3.5 text-purple-600" />
                          <span>{isAr ? "ماسح التذاكر السريع (QR)" : "Scanner Billets QR"}</span>
                        </Link>
                      )}

                      {/* Réservations / Appels pour agent confirmation */}
                      {(teamRole === "CONFIRMATION_AGENT" || isSuperAdmin || teamRole === "ORGANIZER") && (
                        <Link
                          href={`/${locale}/admin/bookings`}
                          onClick={() => setIsOpen(false)}
                          className="w-full px-3 py-1.5 text-start rounded-xl flex items-center gap-2.5 text-tp-slate hover:bg-tp-surface-2 transition text-[11.5px]"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isAr ? "حجوزات وتأكيدات الهاتف" : "Gestion Appels & Réservations"}</span>
                        </Link>
                      )}

                      {/* Analytics / Campagnes pour media buyer */}
                      {(teamRole === "MEDIA_BUYER" || isSuperAdmin) && (
                        <Link
                          href={`/${locale}/admin/analytics`}
                          onClick={() => setIsOpen(false)}
                          className="w-full px-3 py-1.5 text-start rounded-xl flex items-center gap-2.5 text-tp-slate hover:bg-tp-surface-2 transition text-[11.5px]"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
                          <span>{isAr ? "إحصائيات وحملات الإعلانات" : "Analytics & Performances"}</span>
                        </Link>
                      )}

                      {/* Manifestes */}
                      {permissions?.canViewManifest && (
                        <Link
                          href={`/${locale}/admin/manifests`}
                          onClick={() => setIsOpen(false)}
                          className="w-full px-3 py-1.5 text-start rounded-xl flex items-center gap-2.5 text-tp-slate hover:bg-tp-surface-2 transition text-[11.5px]"
                        >
                          <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                          <span>{isAr ? "لوائح المسافرين (Manifeste)" : "Manifestes de Voyage"}</span>
                        </Link>
                      )}

                      {/* Circuits & Départs */}
                      {(permissions?.canEditTrips || isSuperAdmin || teamRole === "ORGANIZER") && (
                        <Link
                          href={`/${locale}/admin/trips`}
                          onClick={() => setIsOpen(false)}
                          className="w-full px-3 py-1.5 text-start rounded-xl flex items-center gap-2.5 text-tp-slate hover:bg-tp-surface-2 transition text-[11.5px]"
                        >
                          <Compass className="w-3.5 h-3.5 text-amber-600" />
                          <span>{isAr ? "إدارة الرحلات والبرامج" : "Gestion des Circuits"}</span>
                        </Link>
                      )}

                      {/* Gestion Équipe pour admin / organisateur */}
                      {(isSuperAdmin || teamRole === "ORGANIZER") && (
                        <Link
                          href={`/${locale}/admin/team`}
                          onClick={() => setIsOpen(false)}
                          className="w-full px-3 py-1.5 text-start rounded-xl flex items-center gap-2.5 text-tp-slate hover:bg-tp-surface-2 transition text-[11.5px]"
                        >
                          <Users className="w-3.5 h-3.5 text-cyan-600" />
                          <span>{isAr ? "فريق العمل والأذونات" : "Équipe & Permissions"}</span>
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Liens Personnels / Voyageur */}
                  <div className="px-3 py-1 text-[10px] font-black tracking-wider uppercase text-tp-muted">
                    {isAr ? "الحساب الشخصي" : "Compte Personnel"}
                  </div>

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

                  <div className="pt-1 mt-1 border-t border-tp-line">
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2 text-start rounded-xl flex items-center gap-2.5 text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t("logout")}</span>
                    </button>
                  </div>
                </>
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
