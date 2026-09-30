"use client";

import React, { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import {
  X,
  User,
  Phone,
  Mail,
  Shield,
  CreditCard,
  Camera,
  FileText,
  DollarSign,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Save,
  Link2,
  Award,
  Video,
  PhoneCall,
  Megaphone,
} from "lucide-react";
import { TeamRole } from "@/types/enums";
import {
  createTeamMemberAction,
  updateTeamMemberAction,
  TeamMemberInput,
} from "@/actions/team.actions";

interface AvailableUser {
  id: string;
  email: string;
  fullName: string | null;
  name: string | null;
  role: string;
  teamMember: { id: string; fullName: string } | null;
}

interface TeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingMember?: any | null;
  availableUsers: AvailableUser[];
  isSuperAdmin?: boolean;
}

export function TeamMemberModal({
  isOpen,
  onClose,
  onSuccess,
  editingMember,
  availableUsers,
  isSuperAdmin = false,
}: TeamMemberModalProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const isEn = locale === "en";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<TeamMemberInput>({
    fullName: "",
    phone: "",
    email: "",
    role: "TOUR_LEADER",
    cinNumber: "",
    guideCardNumber: "",
    notes: "",
    canScanTickets: true,
    canViewManifest: true,
    canCollectCash: false,
    canEditTrips: false,
    isActive: true,
    userId: "",
  });

  useEffect(() => {
    if (editingMember) {
      setFormData({
        fullName: editingMember.fullName || "",
        phone: editingMember.phone || "",
        email: editingMember.email || "",
        role: editingMember.role || "TOUR_LEADER",
        cinNumber: editingMember.cinNumber || "",
        guideCardNumber: editingMember.guideCardNumber || "",
        notes: editingMember.notes || "",
        canScanTickets: editingMember.canScanTickets ?? true,
        canViewManifest: editingMember.canViewManifest ?? true,
        canCollectCash: editingMember.canCollectCash ?? false,
        canEditTrips: editingMember.canEditTrips ?? false,
        isActive: editingMember.isActive ?? true,
        userId: editingMember.userId || "",
      });
    } else {
      setFormData({
        fullName: "",
        phone: "+212 ",
        email: "",
        role: "TOUR_LEADER",
        cinNumber: "",
        guideCardNumber: "",
        notes: "",
        canScanTickets: true,
        canViewManifest: true,
        canCollectCash: false,
        canEditTrips: false,
        isActive: true,
        userId: "",
      });
    }
    setError(null);
  }, [editingMember, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isTargetSuperAdmin = editingMember?.role === "SUPER_ADMIN";

  // Auto-ajustement des permissions recommandées lors du changement de rôle
  const handleRoleChange = (role: TeamRole) => {
    if (isTargetSuperAdmin) {
      setError(
        isAr
          ? "أمان : لا يمكن تغيير رتبة حساب المشرف العام"
          : "Sécurité : Le rôle du compte Super Admin principal ne peut pas être modifié."
      );
      return;
    }

    let defaults = {
      canScanTickets: true,
      canViewManifest: true,
      canCollectCash: false,
      canEditTrips: false,
    };

    if (role === "SUPER_ADMIN") {
      defaults = {
        canScanTickets: true,
        canViewManifest: true,
        canCollectCash: true,
        canEditTrips: true,
      };
    } else if (role === "ORGANIZER") {
      defaults = {
        canScanTickets: true,
        canViewManifest: true,
        canCollectCash: true,
        canEditTrips: true,
      };
    } else if (role === "TOUR_LEADER") {
      defaults = {
        canScanTickets: true,
        canViewManifest: true,
        canCollectCash: true,
        canEditTrips: false,
      };
    } else if (role === "OFFICIAL_GUIDE") {
      defaults = {
        canScanTickets: true,
        canViewManifest: true,
        canCollectCash: false,
        canEditTrips: false,
      };
    } else if (role === "DRIVER" || role === "PRO_DRIVER") {
      defaults = {
        canScanTickets: true,
        canViewManifest: false,
        canCollectCash: false,
        canEditTrips: false,
      };
    } else if (role === "CONFIRMATION_AGENT") {
      defaults = {
        canScanTickets: false,
        canViewManifest: true,
        canCollectCash: false,
        canEditTrips: false,
      };
    } else if (role === "MEDIA_BUYER") {
      defaults = {
        canScanTickets: false,
        canViewManifest: false,
        canCollectCash: false,
        canEditTrips: false,
      };
    } else if (role === "PHOTOGRAPHER_VIDEOGRAPHER") {
      defaults = {
        canScanTickets: false,
        canViewManifest: true,
        canCollectCash: false,
        canEditTrips: false,
      };
    }

    setFormData((prev) => ({
      ...prev,
      role,
      ...defaults,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!formData.fullName.trim()) {
        throw new Error(isAr ? "يرجى إدخال الاسم الكامل" : "Le nom complet est obligatoire.");
      }
      if (!formData.phone.trim() || formData.phone.trim() === "+212") {
        throw new Error(isAr ? "يرجى إدخال رقم الهاتف" : "Le numéro de téléphone est obligatoire.");
      }

      if (formData.role === "SUPER_ADMIN" && !isSuperAdmin) {
        throw new Error(
          isAr
            ? "غير مصرح : صلاحيات المشرف العام مطلوبة لتعيين هذا الدور"
            : "Action non autorisée : Privilèges Super Admin requis pour attribuer ce rôle."
        );
      }

      const payload = {
        ...formData,
        role: isTargetSuperAdmin ? "SUPER_ADMIN" : formData.role,
        isActive: isTargetSuperAdmin ? true : formData.isActive,
        canScanTickets: isTargetSuperAdmin ? true : formData.canScanTickets,
        canViewManifest: isTargetSuperAdmin ? true : formData.canViewManifest,
        canCollectCash: isTargetSuperAdmin ? true : formData.canCollectCash,
        canEditTrips: isTargetSuperAdmin ? true : formData.canEditTrips,
        userId: formData.userId && formData.userId.trim() !== "" ? formData.userId.trim() : null,
      };

      let res;
      if (editingMember) {
        res = await updateTeamMemberAction(editingMember.id, payload);
      } else {
        res = await createTeamMemberAction(payload);
      }

      if (!res.success) {
        throw new Error(res.error || "Une erreur est survenue.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur de validation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 cursor-default"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-white shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {editingMember
                  ? isAr
                    ? "تعديل بيانات عضو الفريق"
                    : "Modifier le Membre d'Équipe"
                  : isAr
                  ? "إضافة عضو جديد في الفريق"
                  : "Ajouter un Membre d'Équipe"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? "تحديد الأدوار الميدانية وتخصيص صلاحيات الماسح والمالية"
                  : "Attribution des rôles opérationnels et des permissions terrain"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Identité & Coordonnées */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              <span>{isAr ? "المعلومات الشخصية والاتصال" : "Identité & Contact"}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? "الاسم الكامل *" : "Nom & Prénom *"}
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Ex: Youssef El Mansouri"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? "رقم الهاتف / واتساب *" : "Téléphone WhatsApp *"}
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+212 661-234567"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? "البريد الإلكتروني" : "Adresse Email (Connexion)"}
                </label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nom@rahalatbladna.ma"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? "رقم البطاقة الوطنية (CIN)" : "N° CIN (Feuille TIST)"}
                </label>
                <input
                  type="text"
                  value={formData.cinNumber || ""}
                  onChange={(e) => setFormData({ ...formData, cinNumber: e.target.value.toUpperCase() })}
                  placeholder="Ex: BE876543"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono uppercase outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Rôle Principal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                <span>
                  {isAr
                    ? "الدور والمسؤولية الميدانية"
                    : isEn
                    ? "Role & Field Specialization"
                    : "Rôle & Spécialisation"}
                </span>
              </h3>
              {isTargetSuperAdmin && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                  {isAr ? "حساب محمي" : "Compte Protégé"}
                </span>
              )}
            </div>

            {isTargetSuperAdmin && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <Shield className="w-4 h-4 shrink-0 text-rose-600" />
                <span>
                  {isAr
                    ? "أمان RBAC : صلاحيات ورتبة حساب المشرف العام مقفلة ومحمية ضد التعديل أو التخفيض."
                    : "Sécurité RBAC : Les permissions et le rôle du compte Super Admin principal sont verrouillés par mesure de sécurité."}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                {
                  role: "TOUR_LEADER" as TeamRole,
                  title: isAr ? "Tour Leader" : isEn ? "Tour Leader" : "Tour Leader",
                  desc: isAr
                    ? "رئيس الرحلة والتنسيق الميداني"
                    : isEn
                    ? "Expedition leader & coordinator"
                    : "Chef d'expédition & coordinateur",
                  color: "border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30",
                  icon: User,
                },
                {
                  role: "OFFICIAL_GUIDE" as TeamRole,
                  title: isAr ? "مرشد معتمد" : isEn ? "Official Guide" : "Guide Officiel",
                  desc: isAr
                    ? "مرشد سياحي معتمد من الوزارة"
                    : isEn
                    ? "Certified Tourism Guide"
                    : "Agrément Ministère du Tourisme",
                  color: "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30",
                  icon: Award,
                },
                {
                  role: "DRIVER" as TeamRole,
                  title: isAr ? "سائق محترف" : isEn ? "Pro Driver" : "Chauffeur Pro",
                  desc: isAr
                    ? "حافلات وسيارات سياحية"
                    : isEn
                    ? "Coach & minibus passenger check-in"
                    : "Autocar & Minibus (Pointage)",
                  color: "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30",
                  icon: CreditCard,
                },
                {
                  role: "ORGANIZER" as TeamRole,
                  title: isAr ? "منظم رحلات" : isEn ? "Organizer" : "Organisateur",
                  desc: isAr
                    ? "إدارة البرامج واللوجستيك"
                    : isEn
                    ? "Trips & logistics manager"
                    : "Gestion circuits & prestataires",
                  color: "border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30",
                  icon: Shield,
                },
                {
                  role: "CONFIRMATION_AGENT" as TeamRole,
                  title: isAr ? "تأكيد هاتفي" : isEn ? "Confirmation Agent" : "Agent Confirmation",
                  desc: isAr
                    ? "تأكيد الحجوزات والمكالمات ومتابعة الزبائن"
                    : isEn
                    ? "Phone calls & booking confirmation"
                    : "Confirmation appels & réservations",
                  color: "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
                  icon: PhoneCall,
                },
                {
                  role: "MEDIA_BUYER" as TeamRole,
                  title: isAr ? "مسؤول إعلانات" : isEn ? "Media Buyer" : "Media Buyer",
                  desc: isAr
                    ? "إدارة الحملات الممولة (Meta, TikTok, Ads)"
                    : isEn
                    ? "Ad acquisition (Meta, TikTok, Ads)"
                    : "Acquisition publicitaire (Meta, Ads)",
                  color: "border-violet-500 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30",
                  icon: Megaphone,
                },
                {
                  role: "PHOTOGRAPHER_VIDEOGRAPHER" as TeamRole,
                  title: isAr ? "مصور وفيديوجرافر" : isEn ? "Photo / Video" : "Photographe / Vidéaste",
                  desc: isAr
                    ? "توثيق الرحلات الميدانية، ريلز وطائرات درون"
                    : isEn
                    ? "Field photo & video (Reels, Drone)"
                    : "Reels, drone, shooting & souvenirs",
                  color: "border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-950/30",
                  icon: Video,
                },
                {
                  role: "SUPER_ADMIN" as TeamRole,
                  title: isAr ? "مشرف عام" : isEn ? "Super Admin" : "Super Admin",
                  desc: isAr
                    ? "إشراف كلي وصلاحيات مالية"
                    : isEn
                    ? "Total system access & finances"
                    : "Accès total & finances",
                  color: "border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30",
                  icon: Shield,
                },
              ]
                .filter((item) => (isSuperAdmin || isTargetSuperAdmin ? true : item.role !== "SUPER_ADMIN"))
                .map((item) => {
                  const isSelected =
                    formData.role === item.role ||
                    (item.role === "DRIVER" && formData.role === ("PRO_DRIVER" as TeamRole));
                  return (
                    <button
                      key={item.role}
                      type="button"
                      disabled={isTargetSuperAdmin}
                      onClick={() => handleRoleChange(item.role)}
                      className={`p-3 rounded-2xl border text-start transition flex flex-col justify-between ${
                        isTargetSuperAdmin
                          ? isSelected
                            ? "opacity-90 border-rose-500 text-rose-700 bg-rose-50 dark:bg-rose-950/40 cursor-not-allowed"
                            : "opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800"
                          : isSelected
                          ? item.color + " shadow-sm ring-1 ring-offset-1 ring-cyan-500/50"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <item.icon className="w-4 h-4 opacity-80" />
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <span className="text-xs font-black block leading-snug">{item.title}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                          {item.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>

            {formData.role === "OFFICIAL_GUIDE" && (
              <div className="pt-2 animate-in fade-in">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isAr ? "رقم بطاقة المرشد المهني" : "N° Carte Professionnelle de Guide (TIST)"}</span>
                </label>
                <input
                  type="text"
                  value={formData.guideCardNumber || ""}
                  onChange={(e) => setFormData({ ...formData, guideCardNumber: e.target.value })}
                  placeholder="Ex: G-NAT-2024-0412"
                  className="w-full px-4 py-2.5 rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/20 text-slate-900 dark:text-white text-xs font-mono outline-none focus:border-amber-500 transition"
                />
              </div>
            )}
          </div>

          {/* Matrice des Permissions Granulaires */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5" />
                <span>{isAr ? "صلاحيات الوصول والتحكم الميداني" : "Permissions Granulaires"}</span>
              </h3>
              <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold">
                {isAr ? "تعديل مرن ومباشر" : "Configurable individuellement"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Permission 1: Scanner */}
              <label
                className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                  formData.canScanTickets
                    ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/40"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-70"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.canScanTickets}
                  onChange={(e) => setFormData({ ...formData, canScanTickets: e.target.checked })}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    {isAr ? "استخدام ماسح QR للصعود" : "Scanner Billets QR (/admin/scanner)"}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr
                      ? "السماح بالوصول للكاميرا ومسح تذاكر المسافرين عند الركوب"
                      : "Droit d'utiliser la caméra mobile pour pointer les passagers"}
                  </p>
                </div>
              </label>

              {/* Permission 2: Manifeste */}
              <label
                className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                  formData.canViewManifest
                    ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-500/40"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-70"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.canViewManifest}
                  onChange={(e) => setFormData({ ...formData, canViewManifest: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    {isAr ? "الاطلاع على بيان الركاب" : "Consulter Manifeste (/admin/manifests)"}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr
                      ? "عرض قائمة المسافرين وأرقام بطاقاتهم وأماكن ركوبهم"
                      : "Droit de consulter la feuille de route et le manifeste nominatif"}
                  </p>
                </div>
              </label>

              {/* Permission 3: Cash Collection */}
              <label
                className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                  formData.canCollectCash
                    ? "bg-teal-50/40 dark:bg-teal-950/20 border-teal-500/40"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-70"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.canCollectCash}
                  onChange={(e) => setFormData({ ...formData, canCollectCash: e.target.checked })}
                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-teal-600" />
                    {isAr ? "استخلاص المتبقي نقداً" : "Encaisser Cash sur Quai"}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr
                      ? "السماح بتحصيل الرصيد المتبقي نقداً من المسافرين عند الانطلاق"
                      : "Autorise l'encaissement du solde restant au départ du convoi"}
                  </p>
                </div>
              </label>

              {/* Permission 4: Edit Trips */}
              <label
                className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                  formData.canEditTrips
                    ? "bg-purple-50/40 dark:bg-purple-950/20 border-purple-500/40"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-70"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.canEditTrips}
                  onChange={(e) => setFormData({ ...formData, canEditTrips: e.target.checked })}
                  className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                    {isAr ? "تعديل برامج الرحلات" : "Modifier Circuits (/admin/trips)"}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr
                      ? "إمكانية تحديث مسارات ونقاط التجمع الخاصة بالبرنامج"
                      : "Droit de modifier les détails du programme et les escales"}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Liaison Compte Utilisateur & Statut */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-cyan-600" />
                <span>{isAr ? "ربط بحساب مستخدم مسجل" : "Lier à un compte utilisateur"}</span>
              </label>
              <select
                value={formData.userId || ""}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value || null })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:border-cyan-500 transition"
              >
                <option value="">{isAr ? "— بدون ربط مسبق (تلقائي عبر الإيميل) —" : "— Aucun (Liaison auto par email) —"}</option>
                {availableUsers.map((u) => {
                  const isAlreadyBound = Boolean(u.teamMember && u.teamMember.id !== editingMember?.id);
                  return (
                    <option key={u.id} value={u.id} disabled={isAlreadyBound}>
                      {u.email} ({u.role}) {isAlreadyBound ? `[Déjà lié à ${u.teamMember?.fullName}]` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>{isAr ? "حالة الحساب المباشرة" : "Statut d'activité"}</span>
                {isTargetSuperAdmin && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    {isAr ? "(دائماً نشط)" : "(Toujours actif)"}
                  </span>
                )}
              </label>
              <div className="flex items-center gap-4 pt-1.5">
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-emerald-600 dark:text-emerald-400">
                  <input
                    type="radio"
                    name="isActive"
                    checked={formData.isActive === true}
                    onChange={() => setFormData({ ...formData, isActive: true })}
                    className="text-emerald-600"
                  />
                  <span>{isAr ? "نشط وفعال" : "Actif (Accès autorisé)"}</span>
                </label>
                <label
                  className={`flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 ${
                    isTargetSuperAdmin ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                  }`}
                  title={
                    isTargetSuperAdmin
                      ? "Sécurité : Le compte Super Admin ne peut pas être suspendu"
                      : undefined
                  }
                >
                  <input
                    type="radio"
                    name="isActive"
                    disabled={isTargetSuperAdmin}
                    checked={formData.isActive === false}
                    onChange={() => {
                      if (!isTargetSuperAdmin) {
                        setFormData({ ...formData, isActive: false });
                      }
                    }}
                    className="text-rose-600"
                  />
                  <span>{isAr ? "معلق ومحظور" : "Suspendu (Bloqué)"}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer & Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {isAr ? "إلغاء" : "Annuler"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-xs font-black shadow-md transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? isAr
                    ? "جار الحفظ..."
                    : "Enregistrement..."
                  : isAr
                  ? "حفظ التغييرات"
                  : "Enregistrer"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
