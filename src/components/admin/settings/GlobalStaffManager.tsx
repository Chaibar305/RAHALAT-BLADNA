"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import {
  Users, Plus, Pencil, Trash2, Phone, Shield,
  ChevronDown, ChevronUp, CheckCircle2, X, Save
} from "lucide-react";
import {
  createStaffMemberAction,
  updateStaffMemberAction,
  deleteStaffMemberAction,
} from "@/actions/staff.actions";
import { DEFAULT_STAFF_MISSIONS } from "@/types/staff";
import { useRouter } from "next/navigation";

interface StaffMemberData {
  id: string;
  name: string;
  phone: string;
  role: string;
  notes: string | null;
  assignmentsCount: number;
}

interface GlobalStaffManagerProps {
  initialStaff: StaffMemberData[];
}

const ROLE_OPTIONS = [
  { value: "ORGANISATEUR", labelFr: "Organisateur", labelAr: "المنظم", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { value: "GUIDE_ANIMATEUR", labelFr: "Guide / Animateur", labelAr: "مرشد / منشط", color: "bg-tp-cyan/20 text-tp-cyan border-tp-cyan/30" },
  { value: "CHAUFFEUR", labelFr: "Chauffeur", labelAr: "سائق", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "SURVEILLANT", labelFr: "Surveillant", labelAr: "مراقب", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
];

export function GlobalStaffManager({ initialStaff }: GlobalStaffManagerProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();

  const [staff, setStaff] = useState<StaffMemberData[]>(initialStaff);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedMissions, setExpandedMissions] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    role: "GUIDE_ANIMATEUR" as string,
    notes: "",
  });

  const resetForm = () => {
    setFormData({ name: "", phone: "", role: "GUIDE_ANIMATEUR", notes: "" });
    setEditingId(null);
    setShowForm(false);
    setFormError(null);
  };

  const startEdit = (member: StaffMemberData) => {
    setFormData({
      name: member.name,
      phone: member.phone,
      role: member.role,
      notes: member.notes || "",
    });
    setEditingId(member.id);
    setShowForm(true);
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      setFormError(isAr ? "الاسم ورقم الهاتف مطلوبان" : "Le nom et le téléphone sont requis");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingId) {
        const result = await updateStaffMemberAction(editingId, {
          name: formData.name,
          phone: formData.phone,
          role: formData.role as any,
          notes: formData.notes || undefined,
        });
        if (!result.success) {
          setFormError(result.error || "Erreur de mise à jour");
          return;
        }
        setStaff((prev) =>
          prev.map((s) =>
            s.id === editingId
              ? { ...s, name: formData.name, phone: formData.phone, role: formData.role, notes: formData.notes || null }
              : s
          )
        );
      } else {
        const result = await createStaffMemberAction({
          name: formData.name,
          phone: formData.phone,
          role: formData.role as any,
          notes: formData.notes || undefined,
        });
        if (!result.success) {
          setFormError(result.error || "Erreur de création");
          return;
        }
        if (result.staff) {
          const s = result.staff as any;
          setStaff((prev) => [
            ...prev,
            {
              id: s.id,
              name: s.fullName || s.name || formData.name,
              phone: s.phone,
              role: s.role,
              notes: s.notes,
              assignmentsCount: 0,
            },
          ]);
        }
      }
      resetForm();
      router.refresh();
    } catch (err: any) {
      setFormError(err.message || "Erreur inattendue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isAr ? "هل أنت متأكد من حذف هذا العضو؟" : "Êtes-vous sûr de vouloir supprimer ce membre ?")) {
      return;
    }

    try {
      const result = await deleteStaffMemberAction(id);
      if (result.success) {
        setStaff((prev) => prev.filter((s) => s.id !== id));
        router.refresh();
      }
    } catch (err) {
      console.error("Erreur suppression staff:", err);
    }
  };

  const getRoleConfig = (role: string) => {
    return ROLE_OPTIONS.find((r) => r.value === role) || ROLE_OPTIONS[1];
  };

  const getMissionsForRole = (role: string): string[] => {
    return (DEFAULT_STAFF_MISSIONS as any)[role] || [];
  };

  return (
    <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-tp-cyan" />
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            {isAr ? "فريق العمل والتأطير" : "Équipe & Encadrement"}
          </h2>
          <span className="px-2 py-0.5 rounded-pill bg-slate-100 dark:bg-slate-800 text-tp-cyan-hover dark:text-tp-cyan text-[10px] font-black">
            {staff.length} {isAr ? "عضو" : "membres"}
          </span>
        </div>

        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 rounded-2xl bg-tp-cyan hover:bg-tp-cyan-hover text-white dark:text-slate-950 font-black text-xs flex items-center gap-2 shadow-tp-cyan transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAr ? "إضافة عضو" : "Ajouter un Membre"}</span>
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-400 text-[11px] font-bold mb-1.5">
                {isAr ? "الاسم الكامل" : "Nom Complet"} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={isAr ? "محمد أمين" : "Mohammed Amine"}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-tp-cyan focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-400 text-[11px] font-bold mb-1.5">
                {isAr ? "رقم الهاتف" : "Téléphone"} *
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+212 6XX-XXXXXX"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-mono font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-tp-cyan focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-400 text-[11px] font-bold mb-1.5">
                {isAr ? "الدور الوظيفي" : "Rôle"}
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-bold focus:border-tp-cyan focus:outline-none transition"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {isAr ? opt.labelAr : opt.labelFr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-400 text-[11px] font-bold mb-1.5">
                {isAr ? "ملاحظات" : "Notes"}
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={isAr ? "ملاحظات اختيارية" : "Notes optionnelles"}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-tp-cyan focus:outline-none transition"
              />
            </div>
          </div>

          {/* Default missions preview */}
          <div className="mt-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              {isAr ? "المهام الافتراضية لهذا الدور :" : "Missions par défaut pour ce rôle :"}
            </p>
            <ul className="space-y-1">
              {getMissionsForRole(formData.role).map((m, i) => (
                <li key={i} className="text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>

          {formError && (
            <p className="text-red-500 dark:text-red-400 text-xs font-bold mt-3">{formError}</p>
          )}

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-2xl bg-tp-cyan hover:bg-tp-cyan-hover text-white dark:text-slate-950 font-black text-xs flex items-center gap-2 shadow-tp-cyan transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "..." : editingId ? (isAr ? "تحديث" : "Mettre à jour") : (isAr ? "إنشاء" : "Créer")}</span>
            </button>

            <button
              onClick={resetForm}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-2 transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>{isAr ? "إلغاء" : "Annuler"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Staff List */}
      {staff.length === 0 ? (
        <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs">
          {isAr ? "لا يوجد أي عضو مسجل في فريق العمل" : "Aucun membre d'équipe enregistré"}
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {staff.map((member) => {
            const roleConfig = getRoleConfig(member.role);
            const missions = getMissionsForRole(member.role);
            const isExpanded = expandedMissions === member.id;

            return (
              <div key={member.id} className="p-4 sm:px-6 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border font-black text-xs shrink-0 ${roleConfig.color}`}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{member.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          {member.phone}
                        </span>
                        <span className={`px-2 py-0.5 rounded-pill text-[10px] font-black border ${roleConfig.color}`}>
                          {isAr ? roleConfig.labelAr : roleConfig.labelFr}
                        </span>
                        {member.assignmentsCount > 0 && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {member.assignmentsCount} {isAr ? "رحلات" : "circuit(s)"}
                          </span>
                        )}
                      </div>
                      {member.notes && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate max-w-md">{member.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpandedMissions(isExpanded ? null : member.id)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                      title={isAr ? "عرض المهام" : "Voir les missions"}
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => startEdit(member)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-tp-cyan-hover dark:text-tp-cyan transition"
                      title={isAr ? "تعديل" : "Modifier"}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(member.id)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 transition"
                      title={isAr ? "حذف" : "Supprimer"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Missions */}
                {isExpanded && missions.length > 0 && (
                  <div className="mt-3 ms-14 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/30">
                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      {isAr ? "المهام الافتراضية :" : "Missions par défaut :"}
                    </p>
                    <ul className="space-y-1.5">
                      {missions.map((m, i) => (
                        <li key={i} className="text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
