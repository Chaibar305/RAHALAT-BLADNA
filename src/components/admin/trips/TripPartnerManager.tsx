"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { 
  Building2, Bus, Plus, Trash2, Edit, Save, 
  CheckCircle2, AlertTriangle, Clock, XCircle, DollarSign, ShieldCheck,
  Compass, Waves, Loader2
} from "lucide-react";
import { 
  assignPartnerToTripAction, 
  updateTripPartnerStatusAction 
} from "@/actions/partner.actions";
import { removePartnerFromTrip } from "@/actions/trip-partners";
import { PartnerType, PartnerStatus } from "@prisma/client";
import { formatMAD } from "@/lib/utils";

export interface PartnerItem {
  id: string;
  type: PartnerType;
  companyName: string;
  contactName: string;
  phone: string;
  city: string;
  capacity?: number | null;
  vehicleType?: string | null;
  plateNumber?: string | null;
  activityType?: string | null;
}

export interface TripPartnerAssignment {
  id: string;
  tripId: string;
  partnerId: string;
  status: PartnerStatus;
  negotiatedCost?: number | null;
  driverAssigned?: string | null;
  notes?: string | null;
  confirmedAt?: string | null;
  partner: PartnerItem;
}

interface TripPartnerManagerProps {
  tripId: string;
  tripTitle: string;
  durationDays?: number;
  initialAssignments: TripPartnerAssignment[];
  availablePartners: PartnerItem[];
  canPublish: boolean;
  publishBlockReason: string | null;
}

export function TripPartnerManager({
  tripId,
  tripTitle,
  durationDays = 2,
  initialAssignments,
  availablePartners,
  canPublish,
  publishBlockReason,
}: TripPartnerManagerProps) {
  const router = useRouter();
  const locale = useLocale();
  const isAr = locale === "ar";
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [assignments, setAssignments] = useState<TripPartnerAssignment[]>(initialAssignments);

  // Synchronisation si les props changent
  useEffect(() => {
    setAssignments(initialAssignments);
  }, [initialAssignments]);

  // Anti-doublons : filtrer pour exclure les partenaires déjà associés à ce circuit
  const assignedPartnerIds = new Set(assignments.map((a) => a.partnerId));
  const unassignedPartners = availablePartners.filter((p) => !assignedPartnerIds.has(p.id));

  // Regroupement par catégories avec support des alias d'enums
  const hotelPartners = unassignedPartners.filter(
    (p) => p.type === "HOTEL_AUBERGE" || p.type === "HOTEL_BIVOUAC"
  );
  const transportPartners = unassignedPartners.filter(
    (p) => p.type === "TRANSPORT_TOURISTIQUE" || p.type === "TRANSPORTER_TIST"
  );
  const activityPartners = unassignedPartners.filter(
    (p) => p.type === "LEISURE_ACTIVITY" || p.type === "ACTIVITE_LOISIR"
  );

  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(
    unassignedPartners[0]?.id || ""
  );

  // Mettre à jour automatiquement le selectedPartnerId si le partenaire sélectionné n'est plus disponible
  useEffect(() => {
    if (!unassignedPartners.some((p) => p.id === selectedPartnerId)) {
      setSelectedPartnerId(unassignedPartners[0]?.id || "");
    }
  }, [assignments, unassignedPartners, selectedPartnerId]);

  const [status, setStatus] = useState<PartnerStatus>("EN_ATTENTE");
  const [negotiatedCost, setNegotiatedCost] = useState<number>(450);
  const [driverAssigned, setDriverAssigned] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const selectedPartnerObj = availablePartners.find((p) => p.id === selectedPartnerId);

  // Mise à jour du coût par défaut selon le type de partenaire sélectionné
  const handlePartnerSelectChange = (newPartnerId: string) => {
    setSelectedPartnerId(newPartnerId);
    const p = availablePartners.find((item) => item.id === newPartnerId);
    if (p?.type === "TRANSPORT_TOURISTIQUE" || p?.type === "TRANSPORTER_TIST") {
      setNegotiatedCost(4500);
    } else if (p?.type === "LEISURE_ACTIVITY" || p?.type === "ACTIVITE_LOISIR") {
      setNegotiatedCost(350);
    } else {
      setNegotiatedCost(450);
    }
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId) return;

    startTransition(async () => {
      const res = await assignPartnerToTripAction({
        tripId,
        partnerId: selectedPartnerId,
        status,
        negotiatedCost: Number(negotiatedCost),
        driverAssigned: driverAssigned || undefined,
        notes: notes || undefined,
      });

      if (res.success && res.assignment) {
        if (selectedPartnerObj) {
          const newAssignment: TripPartnerAssignment = {
            id: res.assignment.id,
            tripId: res.assignment.tripId,
            partnerId: res.assignment.partnerId,
            status: res.assignment.status,
            negotiatedCost: res.assignment.negotiatedCost ? Number(res.assignment.negotiatedCost) : negotiatedCost,
            driverAssigned: res.assignment.driverAssigned,
            notes: res.assignment.notes,
            confirmedAt: res.assignment.confirmedAt ? res.assignment.confirmedAt.toISOString() : null,
            partner: selectedPartnerObj,
          };
          setAssignments((prev) => [...prev, newAssignment]);
        }
        setFeedback({ type: "success", message: isAr ? "تم ربط الشريك بنجاح" : "Partenaire associé au circuit avec succès." });
        setNotes("");
        setDriverAssigned("");
        router.refresh();
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setFeedback({ type: "error", message: res.error || "Erreur d'association du prestataire" });
      }
    });
  };

  const handleStatusChange = (assignmentId: string, newStatus: PartnerStatus) => {
    startTransition(async () => {
      const res = await updateTripPartnerStatusAction(assignmentId, newStatus, tripId);
      if (res.success) {
        setAssignments((prev) =>
          prev.map((a) => (a.id === assignmentId ? { ...a, status: newStatus } : a))
        );
        setFeedback({ type: "success", message: `Statut mis à jour : ${newStatus}` });
        router.refresh();
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: "error", message: res.error || "Erreur de mise à jour du statut" });
      }
    });
  };

  // Suppression fiable avec confirmation et état de chargement
  const handleRemove = (assignmentId: string) => {
    if (!confirm(isAr ? "هل تريد حقاً فصل هذا الشريك عن هذا المسار؟" : "Voulez-vous vraiment détacher ce prestataire du circuit ?")) {
      return;
    }

    setDeletingId(assignmentId);
    startTransition(async () => {
      try {
        const res = await removePartnerFromTrip(assignmentId, tripId);
        if (res.success) {
          setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
          setFeedback({ type: "success", message: isAr ? "تم فصل الشريك عن المسار بنجاح." : "Prestataire détaché du circuit avec succès." });
          router.refresh();
          setTimeout(() => setFeedback(null), 3000);
        } else {
          alert("Erreur : " + (res.error || "Impossible de détacher le prestataire"));
          setFeedback({ type: "error", message: res.error || "Erreur de suppression" });
        }
      } catch (err: any) {
        alert("Erreur inattendue : " + err.message);
      } finally {
        setDeletingId(null);
      }
    });
  };

  // Règles de validation de publication
  const isMultiDay = durationDays >= 2;
  const hasHotelAccepted = assignments.some(
    (a) => (a.partner.type === "HOTEL_AUBERGE" || a.partner.type === "HOTEL_BIVOUAC") && a.status === "ACCEPTE"
  );
  const hasTransportAccepted = assignments.some(
    (a) => (a.partner.type === "TRANSPORT_TOURISTIQUE" || a.partner.type === "TRANSPORTER_TIST") && a.status === "ACCEPTE"
  );

  const readyForPublication = isMultiDay
    ? hasHotelAccepted && hasTransportAccepted
    : hasTransportAccepted;

  return (
    <div className="space-y-6 sm:space-y-8">
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              : "bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Règle Métier Obligatoire: Publication Banner */}
      <div
        className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
          readyForPublication
            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/30 text-emerald-950 dark:text-emerald-300 shadow-sm"
            : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/30 text-amber-950 dark:text-amber-300 shadow-sm"
        }`}
      >
        <div className="flex items-center gap-3">
          {readyForPublication ? (
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}

          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {readyForPublication
                ? (isAr ? "الرحلة مؤهلة للنشر الرسمي (الفندق والنقل مؤكدان)" : "Conditions de Publication Validées")
                : (isAr ? "تنبيه: لا يمكن نشر الرحلة بدون استيفاء الشركاء المؤكدين" : "Règle de Publication Non Satisfaite")}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
              {readyForPublication
                ? (isAr ? "تم اعتماد شركاء النقل والإيواء بنجاح." : "Tous les prestataires requis (transporteur et hébergement) ont le statut ACCEPTE.")
                : isMultiDay
                ? (isAr ? "يجب تأكيد شركة نقل سياحي TIST وفندق/مخيم بحالة (مقبول - ACCEPTE) لتفعيل حجز الرحلة." : "Un Transporteur TIST et un Hébergement au statut ACCEPTE sont obligatoires pour ce circuit de 2 jours ou plus.")
                : (isAr ? "يجب تأكيد شركة نقل سياحي TIST بحالة (مقبول - ACCEPTE) لتفعيل الرحلة." : "Au moins un Transporteur TIST au statut ACCEPTE est requis pour valider ce circuit.")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold shrink-0">
          {isMultiDay && (
            <span className={`px-3 py-1.5 rounded-full border ${hasHotelAccepted ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"}`}>
              🏨 {hasHotelAccepted ? "Hôtel OK" : "Hôtel Manquant"}
            </span>
          )}
          <span className={`px-3 py-1.5 rounded-full border ${hasTransportAccepted ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"}`}>
            🚌 {hasTransportAccepted ? "Transport OK" : "Transport Manquant"}
          </span>
        </div>
      </div>

      {/* Grid: Formulaire d'association & Liste des prestataires */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Formulaire d'association (5 cols) */}
        <form
          onSubmit={handleAssign}
          className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6 space-y-4 transition-colors"
        >
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {isAr ? "ربط فندق أو شركة نقل بهذا المسار" : "Associer un Partenaire au Circuit"}
            </h3>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1.5">
                {isAr ? "اختر الشريك" : "Sélectionner le partenaire *"}
              </label>

              <select
                value={selectedPartnerId}
                onChange={(e) => handlePartnerSelectChange(e.target.value)}
                disabled={unassignedPartners.length === 0}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition font-medium disabled:opacity-50"
              >
                {unassignedPartners.length === 0 ? (
                  <option value="" disabled>
                    {isAr ? "جميع الشركاء مرتبطون بالفعل بهذا المسار" : "Tous les prestataires disponibles sont déjà associés"}
                  </option>
                ) : (
                  <>
                    {hotelPartners.length > 0 && (
                      <optgroup label="🏨 Hôtels & Bivouacs">
                        {hotelPartners.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.companyName} ({p.city}) {p.capacity ? `- ${p.capacity} lits` : ""}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {transportPartners.length > 0 && (
                      <optgroup label="🚌 Transporteurs TIST">
                        {transportPartners.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.companyName} ({p.city}) {p.vehicleType ? `- ${p.vehicleType}` : ""}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {activityPartners.length > 0 && (
                      <optgroup label="🏄‍♂️ Activités & Loisirs (Plongée, Jet Ski, Quad, Barques)">
                        {activityPartners.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.companyName} ({p.city}) {p.activityType ? `- ${p.activityType}` : ""}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1.5">
                {isAr ? "حالة التأكيد" : "Statut de confirmation"}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PartnerStatus)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition font-medium"
              >
                <option value="EN_ATTENTE">EN_ATTENTE (En attente de devis / validation)</option>
                <option value="ACCEPTE">ACCEPTE (Confirmé & Validé pour publication)</option>
                <option value="REFUSE">REFUSE (Indisponible / Complet)</option>
                <option value="ANNULE">ANNULE (Annulé)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1.5">
                {selectedPartnerObj?.type === "TRANSPORT_TOURISTIQUE" || selectedPartnerObj?.type === "TRANSPORTER_TIST"
                  ? (isAr ? "التكلفة الإجمالية للنقل (MAD)" : "Coût Forfaitaire Transport (MAD)")
                  : (isAr ? "السعر التفاوضي للسرير / ليلة (MAD)" : "Coût Négocié par Nuitée / Pers (MAD)")}
              </label>
              <input
                type="number"
                min={0}
                value={negotiatedCost}
                onChange={(e) => setNegotiatedCost(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono font-bold outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                placeholder="Ex: 4500"
              />
            </div>

            {(selectedPartnerObj?.type === "TRANSPORT_TOURISTIQUE" || selectedPartnerObj?.type === "TRANSPORTER_TIST") && (
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1.5">
                  {isAr ? "اسم السائق المعين" : "Chauffeur assigné"}
                </label>
                <input
                  type="text"
                  value={driverAssigned}
                  onChange={(e) => setDriverAssigned(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  placeholder="Ex: Mohamed El Bakkali"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1.5">
                {isAr ? "ملاحظات وتفاصيل الحجز" : "Notes logistiques & Conditions"}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                placeholder="Ex: Bivouac réservé en exclusivité pour 48 pax..."
              />
            </div>

            <button
              type="submit"
              disabled={isPending || unassignedPartners.length === 0 || !selectedPartnerId}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs shadow-md transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending && !deletingId ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isAr ? "تثبيت الشريك في هذا المسار" : "Enregistrer le Partenaire"}</span>
            </button>
          </div>
        </form>

        {/* Right: Liste des prestataires associés (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6 space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {isAr ? "الشركاء المعتمدون في هذا المسار" : "Prestataires Associés à ce Circuit"}
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
              {assignments.length} associé{assignments.length > 1 ? "s" : ""}
            </span>
          </div>

          {assignments.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              {isAr ? "لم يتم ربط أي شريك بعد بهذا المسار" : "Aucun prestataire associé à ce circuit. Utilisez le formulaire à gauche pour en ajouter."}
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-xs"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase font-mono ${
                          item.partner.type === "LEISURE_ACTIVITY" || item.partner.type === "ACTIVITE_LOISIR"
                            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"
                            : item.partner.type === "HOTEL_AUBERGE" || item.partner.type === "HOTEL_BIVOUAC"
                            ? "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30"
                            : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30"
                        }`}
                      >
                        {item.partner.type === "LEISURE_ACTIVITY" || item.partner.type === "ACTIVITE_LOISIR"
                          ? "Activité / Loisir"
                          : item.partner.type === "HOTEL_AUBERGE" || item.partner.type === "HOTEL_BIVOUAC"
                          ? "Hôtel / Bivouac"
                          : "Transport TIST"}
                      </span>

                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {item.partner.companyName}
                      </span>

                      {item.partner.activityType && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 font-bold">
                          {item.partner.activityType}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <p>📍 {item.partner.city}</p>
                      <p>📞 {item.partner.contactName} ({item.partner.phone})</p>
                      {item.driverAssigned && <p className="text-cyan-600 dark:text-cyan-400 font-bold">🚍 Chauffeur: {item.driverAssigned}</p>}
                      {item.negotiatedCost && (
                        <p className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          💰 Coût : {formatMAD(item.negotiatedCost, locale)}
                        </p>
                      )}
                    </div>

                    {item.notes && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value as PartnerStatus)}
                      disabled={isPending}
                      className={`text-xs font-mono font-bold rounded-xl px-2.5 py-1.5 border outline-none cursor-pointer transition ${
                        item.status === "ACCEPTE"
                          ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                          : item.status === "REFUSE"
                          ? "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30"
                          : item.status === "ANNULE"
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                          : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30"
                      }`}
                    >
                      <option value="EN_ATTENTE">EN_ATTENTE</option>
                      <option value="ACCEPTE">ACCEPTE</option>
                      <option value="REFUSE">REFUSE</option>
                      <option value="ANNULE">ANNULE</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      disabled={isPending && deletingId === item.id}
                      className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-red-600 dark:text-red-400 border border-rose-200 dark:border-rose-500/30 text-xs transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      title={isAr ? "فصل الشريك" : "Détacher ce prestataire du circuit"}
                    >
                      {isPending && deletingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
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
