"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Users,
  Plus,
  Search,
  Filter,
  Camera,
  FileText,
  DollarSign,
  Edit3,
  Trash2,
  Phone,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Compass,
  Award,
  Bus,
  ExternalLink,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Link2,
} from "lucide-react";
import { TeamRole } from "@/types/enums";
import { TeamMemberModal } from "./TeamMemberModal";
import {
  toggleTeamMemberStatusAction,
  deleteTeamMemberAction,
} from "@/actions/team.actions";

interface TeamMemberItem {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: TeamRole;
  cinNumber: string | null;
  guideCardNumber: string | null;
  notes: string | null;
  canScanTickets: boolean;
  canViewManifest: boolean;
  canCollectCash: boolean;
  canEditTrips: boolean;
  isActive: boolean;
  userId: string | null;
  user?: {
    id: string;
    email: string;
    role: string;
    name: string | null;
    avatarUrl: string | null;
  } | null;
  assignedTrips: Array<{
    trip: {
      id: string;
      titleFr: string;
      titleAr: string;
      slug: string;
      durationDays: number;
    };
  }>;
}

interface TeamManagementDashboardProps {
  initialMembers: TeamMemberItem[];
  stats: {
    totalMembers: number;
    activeMembers: number;
    tourLeadersAndGuides: number;
    drivers: number;
    authorizedScanners: number;
    cashCollectors: number;
  };
  availableUsers: Array<{
    id: string;
    email: string;
    fullName: string | null;
    name: string | null;
    role: string;
    teamMember: { id: string; fullName: string } | null;
  }>;
}

export function TeamManagementDashboard({
  initialMembers,
  stats: initialStats,
  availableUsers,
}: TeamManagementDashboardProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const [members, setMembers] = useState<TeamMemberItem[]>(initialMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [scannerFilter, setScannerFilter] = useState(false);
  const [cashFilter, setCashFilter] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberItem | null>(null);

  // Notification / Toast
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // Filtrage dynamique
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // 1. Recherche texte
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = m.fullName.toLowerCase().includes(q);
        const matchesPhone = m.phone.toLowerCase().includes(q);
        const matchesEmail = m.email ? m.email.toLowerCase().includes(q) : false;
        const matchesCin = m.cinNumber ? m.cinNumber.toLowerCase().includes(q) : false;
        const matchesGuide = m.guideCardNumber ? m.guideCardNumber.toLowerCase().includes(q) : false;

        if (!matchesName && !matchesPhone && !matchesEmail && !matchesCin && !matchesGuide) {
          return false;
        }
      }

      // 2. Filtre Rôle
      if (selectedRole !== "ALL" && m.role !== selectedRole) {
        return false;
      }

      // 3. Filtre Statut
      if (selectedStatus === "ACTIVE" && !m.isActive) return false;
      if (selectedStatus === "INACTIVE" && m.isActive) return false;

      // 4. Filtre Scanner
      if (scannerFilter && !m.canScanTickets) return false;

      // 5. Filtre Cash
      if (cashFilter && !m.canCollectCash) return false;

      return true;
    });
  }, [members, searchQuery, selectedRole, selectedStatus, scannerFilter, cashFilter]);

  // Activation / Suspension immédiate
  const handleToggleStatus = async (id: string) => {
    try {
      const res = await toggleTeamMemberStatusAction(id);
      if (res.success) {
        setMembers((prev) =>
          prev.map((m) => (m.id === id ? { ...m, isActive: res.isActive ?? !m.isActive } : m))
        );
        showNotification(
          "success",
          res.isActive
            ? isAr
              ? "تمت إعادة تفعيل حساب العضو بنجاح"
              : "Compte réactivé avec succès"
            : isAr
            ? "تم تعليق العضو وحظر وصوله للماسح"
            : "Membre suspendu (accès au scanner immédiatement révoqué)"
        );
      } else {
        showNotification("error", res.error || "Erreur lors du changement de statut");
      }
    } catch {
      showNotification("error", "Erreur technique");
    }
  };

  // Suppression d'un membre
  const handleDeleteMember = async (id: string, name: string) => {
    if (
      !confirm(
        isAr
          ? `هل أنت متأكد من رغبتك في حذف العضو "${name}" نهائياً من الفريق؟`
          : `Êtes-vous sûr de vouloir supprimer définitivement "${name}" de l'équipe ?`
      )
    ) {
      return;
    }

    try {
      const res = await deleteTeamMemberAction(id);
      if (res.success) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
        showNotification(
          "success",
          isAr ? "تم حذف العضو بنجاح" : "Membre supprimé avec succès."
        );
      } else {
        showNotification("error", res.error || "Erreur de suppression");
      }
    } catch {
      showNotification("error", "Erreur technique");
    }
  };

  // Ouvrir modal pour nouveau membre
  const handleOpenCreateModal = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  // Ouvrir modal pour modification
  const handleOpenEditModal = (member: TeamMemberItem) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const getRoleBadge = (role: TeamRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return {
          label: "Super Admin",
          icon: ShieldCheck,
          color: "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400",
        };
      case "ORGANIZER":
        return {
          label: isAr ? "منظم" : "Organisateur",
          icon: Compass,
          color: "bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400",
        };
      case "TOUR_LEADER":
        return {
          label: isAr ? "رئيس رحلة" : "Tour Leader",
          icon: Users,
          color: "bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-400",
        };
      case "OFFICIAL_GUIDE":
        return {
          label: isAr ? "مرشد معتمد" : "Guide Officiel",
          icon: Award,
          color: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400",
        };
      case "DRIVER":
        return {
          label: isAr ? "سائق نقل سياحي" : "Chauffeur",
          icon: Bus,
          color: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400",
        };
      default:
        return {
          label: String(role || "Membre"),
          icon: Users,
          color: "bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-400",
        };
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 border ${
            notification.type === "success"
              ? "bg-emerald-900/90 border-emerald-500 text-white"
              : "bg-rose-900/90 border-rose-500 text-white"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}

      {/* Top Banner & Actions */}
      <div className="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isAr ? "إدارة الصلاحيات والأمان (RBAC)" : "Matrice des Permissions & Rôles"}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {isAr ? "فريق العمل والمكلفون الميدانيون" : "Gestion de l'Équipe & Rôles Terrain"}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {isAr
              ? "إدارة طاقم الرحلات، أرقام البطاقات الوطنية والتراخيص الرسمية، وتحديد صلاحيات ماسح التذاكر المباشر وتحصيل المبالغ النقدية."
              : "Attribution des rôles de terrain (Tour Leader, Guide officiel, Chauffeur), gestion des cartes professionnelles et contrôle strict des accès au scanner QR mobile."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <Link
            href={`/${locale}/admin/scanner`}
            className="px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <QrCode className="w-4 h-4 text-cyan-500" />
            <span>{isAr ? "فتح الماسح المباشر" : "Scanner Mobile QR"}</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-xs font-black shadow-md transition active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? "إضافة عضو جديد" : "Nouveau Membre"}</span>
          </button>
        </div>
      </div>

      {/* KPI Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Members */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              {isAr ? "إجمالي الفريق" : "Effectif Total"}
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {initialStats.totalMembers}
          </p>
          <span className="text-[10px] text-slate-400 block">Collaborateurs déclarés</span>
        </div>

        {/* Active Members */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
              {isAr ? "الأعضاء النشطون" : "Actifs"}
            </span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {initialStats.activeMembers}
          </p>
          <span className="text-[10px] text-slate-400 block">Accès système autorisés</span>
        </div>

        {/* Tour Leaders & Guides */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase">
              {isAr ? "رؤساء ومرشدون" : "Guides & Chefs"}
            </span>
            <Compass className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
            {initialStats.tourLeadersAndGuides}
          </p>
          <span className="text-[10px] text-slate-400 block">Encadrement terrain</span>
        </div>

        {/* Drivers */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase">
              {isAr ? "السائقون" : "Chauffeurs"}
            </span>
            <Bus className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
            {initialStats.drivers}
          </p>
          <span className="text-[10px] text-slate-400 block">Transport touristique</span>
        </div>

        {/* Authorized Scanners */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase">
              {isAr ? "ماسح التذاكر" : "Scanners QR"}
            </span>
            <Camera className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono">
            {initialStats.authorizedScanners}
          </p>
          <span className="text-[10px] text-slate-400 block">Caméra mobile active</span>
        </div>

        {/* Cash Collectors */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase">
              {isAr ? "تحصيل النقود" : "Collecte Cash"}
            </span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {initialStats.cashCollectors}
          </p>
          <span className="text-[10px] text-slate-400 block">Habilités au départ</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full md:flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAr
                  ? "البحث بالاسم، الهاتف، البريد، رقم البطاقة الوطنية أو بطاقة الإرشاد..."
                  : "Recherche par nom, WhatsApp, email, N° CIN ou carte guide..."
              }
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold outline-none focus:border-cyan-500 transition"
          >
            <option value="ALL">{isAr ? "جميع الأدوار" : "Tous les Rôles"}</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ORGANIZER">Organisateur</option>
            <option value="TOUR_LEADER">Tour Leader</option>
            <option value="OFFICIAL_GUIDE">Guide Officiel</option>
            <option value="DRIVER">Chauffeur</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold outline-none focus:border-cyan-500 transition"
          >
            <option value="ALL">{isAr ? "جميع الحالات" : "Tous les statuts"}</option>
            <option value="ACTIVE">{isAr ? "نشط فقط" : "Actifs uniquement"}</option>
            <option value="INACTIVE">{isAr ? "معلق فقط" : "Suspendus uniquement"}</option>
          </select>

          {/* Quick Toggles */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setScannerFilter(!scannerFilter)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                scannerFilter
                  ? "bg-teal-500/20 border-teal-500/40 text-teal-700 dark:text-teal-400"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{isAr ? "ماسح مسموح" : "Scanner OK"}</span>
            </button>

            <button
              type="button"
              onClick={() => setCashFilter(!cashFilter)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                cashFilter
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-400"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>{isAr ? "تحصيل كاش" : "Cash OK"}</span>
            </button>
          </div>
        </div>

        {/* Filter count */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
          <span>
            {isAr
              ? `عرض ${filteredMembers.length} من أصل ${members.length} عضو`
              : `Affichage de ${filteredMembers.length} sur ${members.length} membres`}
          </span>
          {(searchQuery || selectedRole !== "ALL" || selectedStatus !== "ALL" || scannerFilter || cashFilter) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedRole("ALL");
                setSelectedStatus("ALL");
                setScannerFilter(false);
                setCashFilter(false);
              }}
              className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isAr ? "إعادة ضبط الفلاتر" : "Réinitialiser les filtres"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Team Members List */}
      <div className="space-y-3">
        {filteredMembers.length === 0 ? (
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center mx-auto text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? "لم يتم العثور على أي عضو" : "Aucun membre trouvé"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {isAr
                  ? "جرّب تغيير معايير البحث أو تصفية الأدوار، أو أضف عضواً جديداً في الفريق."
                  : "Modifiez vos critères de recherche ou ajoutez un nouveau membre à votre effectif."}
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-xs font-black shadow-sm transition"
            >
              {isAr ? "إضافة عضو الآن" : "Ajouter un membre maintenant"}
            </button>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const roleInfo = getRoleBadge(member.role);
            const RoleIcon = roleInfo.icon;
            const cleanPhone = member.phone.replace(/[^0-9]/g, "");

            return (
              <div
                key={member.id}
                className={`bg-white dark:bg-slate-950 border rounded-3xl p-5 sm:p-6 shadow-sm transition flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                  member.isActive
                    ? "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    : "border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10 opacity-75"
                }`}
              >
                {/* Member Info */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Avatar with Status Dot */}
                  <div className="relative shrink-0">
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-800 dark:text-white font-black text-lg shadow-xs">
                      {member.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-950 ${
                        member.isActive ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                      title={member.isActive ? "Actif" : "Suspendu"}
                    />
                  </div>

                  {/* Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        {member.fullName}
                      </h3>

                      {/* Role Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill border text-xs font-bold ${roleInfo.color}`}
                      >
                        <RoleIcon className="w-3.5 h-3.5" />
                        <span>{roleInfo.label}</span>
                      </span>

                      {/* Status Pill */}
                      {!member.isActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase">
                          <XCircle className="w-3 h-3" />
                          <span>{isAr ? "معلق" : "Suspendu"}</span>
                        </span>
                      )}
                    </div>

                    {/* Meta info: Phone WhatsApp, Email, CIN, Guide Card */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:underline font-mono font-bold"
                        title="Ouvrir WhatsApp"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{member.phone}</span>
                      </a>

                      {member.email && (
                        <span className="inline-flex items-center gap-1.5 font-mono">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{member.email}</span>
                        </span>
                      )}

                      {member.cinNumber && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-[10px]">
                          CIN: {member.cinNumber}
                        </span>
                      )}

                      {member.guideCardNumber && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-mono font-bold text-[10px]">
                          <Award className="w-3 h-3" />
                          Guide: {member.guideCardNumber}
                        </span>
                      )}

                      {/* User Account Link Chip */}
                      {member.user ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md">
                          <Link2 className="w-3 h-3" />
                          <span>Compte lié: {member.user.email}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          Non relié à un compte utilisateur
                        </span>
                      )}
                    </div>

                    {/* Permissions Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {/* Permission Scanner */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                          member.canScanTickets
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                            : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 line-through"
                        }`}
                        title="Autorisation du scanner QR"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Scanner QR</span>
                      </span>

                      {/* Permission Manifest */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                          member.canViewManifest
                            ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-400"
                            : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 line-through"
                        }`}
                        title="Consultation du manifeste des passagers"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Manifeste</span>
                      </span>

                      {/* Permission Cash */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                          member.canCollectCash
                            ? "bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-400"
                            : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60"
                        }`}
                        title="Droit d'encaisser le solde restant au départ"
                      >
                        <DollarSign className="w-3 h-3" />
                        <span>Cash au départ</span>
                      </span>

                      {/* Permission Edit Trips */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                          member.canEditTrips
                            ? "bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400"
                            : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60"
                        }`}
                        title="Droit de modifier les voyages"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Modif Voyages</span>
                      </span>

                      {/* Circuits Assignés Count */}
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold ml-1">
                        {member.assignedTrips.length} circuit(s) assigné(s)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions & Immediate Toggle */}
                <div className="flex sm:flex-row lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                  {/* Quick Toggle Active / Suspend */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {member.isActive
                        ? isAr
                          ? "نشط"
                          : "Actif"
                        : isAr
                        ? "معلق"
                        : "Suspendu"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(member.id)}
                      className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                        member.isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                      title={
                        member.isActive
                          ? "Suspendre immédiatement le compte"
                          : "Réactiver le compte"
                      }
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform absolute top-1 ${
                          member.isActive ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Buttons Edit & Delete */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(member)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isAr ? "تعديل" : "Modifier"}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteMember(member.id, member.fullName)}
                      className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                      title={isAr ? "حذف العضو" : "Supprimer"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add / Edit */}
      <TeamMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingMember={editingMember}
        availableUsers={availableUsers}
        onSuccess={() => {
          showNotification(
            "success",
            editingMember
              ? isAr
                ? "تم تحديث بيانات العضو بنجاح"
                : "Membre mis à jour avec succès"
              : isAr
              ? "تمت إضافة العضو الجديد بنجاح"
              : "Nouveau membre ajouté avec succès"
          );
          // Recharger
          window.location.reload();
        }}
      />
    </div>
  );
}
