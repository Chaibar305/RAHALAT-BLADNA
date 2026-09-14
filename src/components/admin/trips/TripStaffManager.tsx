"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { 
  UserCheck, Plus, Trash2, Edit, Save, 
  Copy, ShieldCheck, DollarSign, ListChecks, CheckCircle2, AlertCircle 
} from "lucide-react";
import { 
  assignStaffToTripAction, 
  removeStaffFromTripAction, 
  duplicateStaffAssignmentsAction 
} from "@/actions/staff.actions";
import { DEFAULT_TEAM_MISSIONS, DEFAULT_STAFF_MISSIONS } from "@/types/staff";
import { TeamRole } from "@/types/enums";
import { formatMAD } from "@/lib/utils";

interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: TeamRole;
  notes?: string | null;
}

interface TripStaffAssignment {
  id: string;
  tripId: string;
  staffId: string;
  role: TeamRole;
  assignedMissions: string[];
  remuneration?: number | null;
  staff: StaffMember;
}

interface OtherTrip {
  id: string;
  titleFr: string;
  titleAr: string;
}

interface TripStaffManagerProps {
  tripId: string;
  tripTitle: string;
  initialAssignments: TripStaffAssignment[];
  availableStaff: StaffMember[];
  otherTrips: OtherTrip[];
}

export function TripStaffManager({
  tripId,
  tripTitle,
  initialAssignments,
  availableStaff,
  otherTrips,
}: TripStaffManagerProps) {
  const router = useRouter();
  const locale = useLocale();
  const isAr = locale === "ar";
  const [isPending, startTransition] = useTransition();

  const [assignments, setAssignments] = useState<TripStaffAssignment[]>(initialAssignments);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(availableStaff[0]?.id || "");
  const [selectedRole, setSelectedRole] = useState<TeamRole>(availableStaff[0]?.role || "TOUR_LEADER");
  const [remuneration, setRemuneration] = useState<number>(1000);
  const [customMission, setCustomMission] = useState<string>("");
  const [missionsList, setMissionsList] = useState<string[]>(
    DEFAULT_TEAM_MISSIONS[selectedRole] || []
  );

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [targetTripId, setTargetTripId] = useState<string>(otherTrips[0]?.id || "");

  const handleRoleChange = (role: TeamRole) => {
    setSelectedRole(role);
    setMissionsList(DEFAULT_TEAM_MISSIONS[role] || []);
  };

  const handleAddMission = () => {
    if (!customMission.trim()) return;
    setMissionsList([...missionsList, customMission.trim()]);
    setCustomMission("");
  };

  const handleRemoveMission = (index: number) => {
    setMissionsList(missionsList.filter((_, i) => i !== index));
  };

  const handleAssignStaff = () => {
    if (!selectedStaffId) return;

    startTransition(async () => {
      const res = await assignStaffToTripAction({
        tripId,
        staffId: selectedStaffId,
        role: selectedRole,
        assignedMissions: missionsList,
        remuneration: Number(remuneration),
      });

      if (res.success && res.assignment) {
        const staffObj = availableStaff.find((s) => s.id === selectedStaffId);
        if (staffObj) {
          const newAssignment: any = {
            ...res.assignment,
            staff: staffObj,
            remuneration: Number(res.assignment.remuneration || remuneration),
          };

          setAssignments((prev) => {
            const filtered = prev.filter((a) => !(a.staffId === selectedStaffId && a.role === selectedRole));
            return [...filtered, newAssignment];
          });
        }
        setFeedback({ type: "success", message: "Membre d'équipe affecté avec succès." });
        router.refresh();
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: "error", message: res.error || "Erreur d'affectation" });
      }
    });
  };

  const handleRemoveAssignment = (assignmentId: string) => {
    if (!confirm("Voulez-vous retirer ce membre de l'équipe pour ce départ ?")) return;

    startTransition(async () => {
      const res = await removeStaffFromTripAction(assignmentId, tripId);
      if (res.success) {
        setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
        setFeedback({ type: "success", message: "Membre retiré de l'équipe." });
        router.refresh();
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: "error", message: res.error || "Erreur de suppression" });
      }
    });
  };

  const handleDuplicate = () => {
    if (!targetTripId) return;

    startTransition(async () => {
      const res = await duplicateStaffAssignmentsAction(tripId, targetTripId);
      if (res.success) {
        setFeedback({ type: "success", message: `Équipe dupliquée avec succès vers le départ cible (${res.count} membres).` });
        router.refresh();
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback({ type: "error", message: res.error || "Erreur de duplication" });
      }
    });
  };

  const totalStaffRemuneration = assignments.reduce(
    (acc, a) => acc + (a.remuneration ? Number(a.remuneration) : 0),
    0
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Summary KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-1">
          <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase">
            {isAr ? "أعضاء الفريق المعينين" : "Staff Affecté au Convoi"}
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {assignments.length} {isAr ? "أفراد" : "Membres"}
          </p>
          <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold">
            {isAr ? "موزعين على الأدوار الأربعة" : "Organisateur, Guide, Chauffeur, Surveillant"}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-1">
          <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase">
            {isAr ? "إجمالي تعويضات التأطير" : "Budget Rémunération Staff"}
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatMAD(totalStaffRemuneration, locale)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isAr ? "يحتسب في التكاليف الثابتة" : "Intégré dans les coûts fixes du point mort"}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-1">
          <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase">
            {isAr ? "تكرار الفريق لرحلة أخرى" : "Duplication d'Équipe"}
          </span>
          <div className="flex items-center gap-2 mt-2">
            <select
              value={targetTripId}
              onChange={(e) => setTargetTripId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none flex-1 truncate"
            >
              {otherTrips.map((ot) => (
                <option key={ot.id} value={ot.id}>
                  {isAr ? ot.titleAr : ot.titleFr}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={isPending || otherTrips.length === 0}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{isAr ? "نسخ" : "Dupliquer"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid 2 Columns: Add Form & Current List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Assign/Edit Staff Form (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <UserCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {isAr ? "تعيين عضو وتحديد مهامه" : "Affecter un Membre au Circuit"}
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                {isAr ? "اختيار الموظف" : "Membre du personnel"}
              </label>
              <select
                value={selectedStaffId}
                onChange={(e) => {
                  setSelectedStaffId(e.target.value);
                  const staffObj = availableStaff.find((s) => s.id === e.target.value);
                  if (staffObj) handleRoleChange(staffObj.role);
                }}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition"
              >
                {availableStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.role}) — {staff.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                {isAr ? "الدور في هذا المسار" : "Rôle sur ce convoi"}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(["TOUR_LEADER", "OFFICIAL_GUIDE", "DRIVER", "ORGANIZER", "SUPER_ADMIN"] as TeamRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleChange(r)}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold text-center transition ${
                      selectedRole === r
                        ? "bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 text-cyan-700 dark:text-cyan-300"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    {r === "TOUR_LEADER" ? "Chef de voyage" : r === "OFFICIAL_GUIDE" ? "Guide officiel" : r === "DRIVER" ? "Chauffeur" : r === "ORGANIZER" ? "Organisateur" : "Super Admin"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                {isAr ? "التعويض المالي (MAD) - للإدارة فقط" : "Rémunération convenue (MAD - Admin only)"}
              </label>
              <input
                type="number"
                value={remuneration}
                onChange={(e) => setRemuneration(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-cyan-500 transition"
                placeholder="Ex: 1200"
              />
            </div>

            {/* Missions spécifiques */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-slate-600 dark:text-slate-400 font-bold">
                {isAr ? "المهام والمسؤوليات الموكلة" : "Missions spécifiques assignées"}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customMission}
                  onChange={(e) => setCustomMission(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddMission())}
                  className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs outline-none focus:border-cyan-500"
                  placeholder="Ajouter une mission spécifique..."
                />
                <button
                  type="button"
                  onClick={handleAddMission}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl font-bold transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {missionsList.map((m, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-700 dark:text-slate-300"
                  >
                    <span className="truncate">• {m}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMission(idx)}
                      className="text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={handleAssignStaff}
              disabled={isPending}
              className="w-full mt-2 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isAr ? "حفظ التعيين في الرحلة" : "Enregistrer l'Affectation"}</span>
            </button>
          </div>
        </div>

        {/* Right: Current Trip Staff Roster (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {isAr ? "تشكيلة الطاقم المعين لهذا المسار" : "Équipe Actuelle du Circuit"}
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
              {assignments.length} affectés
            </span>
          </div>

          {assignments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              {isAr ? "لم يتم تعيين أي طاقم بعد لهذه الرحلة" : "Aucun membre d'équipe affecté à ce convoi"}
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-xs"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {item.staff.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-pill text-[10px] font-black uppercase font-mono ${
                          item.role === "SUPER_ADMIN"
                            ? "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30"
                            : item.role === "ORGANIZER"
                            ? "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-500/30"
                            : item.role === "OFFICIAL_GUIDE"
                            ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30"
                            : item.role === "DRIVER"
                            ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30"
                            : "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/30"
                        }`}
                      >
                        {item.role === "TOUR_LEADER" ? "Chef de voyage" : item.role === "OFFICIAL_GUIDE" ? "Guide officiel" : item.role === "DRIVER" ? "Chauffeur" : item.role === "ORGANIZER" ? "Organisateur" : "Super Admin"}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      📞 {item.staff.phone}
                    </p>

                    {item.assignedMissions && item.assignedMissions.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Missions confiées :
                        </p>
                        {item.assignedMissions.map((m, mIdx) => (
                          <p key={mIdx} className="text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-1">
                            <span className="text-cyan-600 dark:text-cyan-400 font-bold">•</span>
                            <span>{m}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <div className="text-end">
                      <p className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {item.remuneration ? formatMAD(item.remuneration, locale) : "0 MAD"}
                      </p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase">Rémunération</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveAssignment(item.id)}
                      disabled={isPending}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30 text-xs transition"
                      title="Retirer de l'équipe"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
