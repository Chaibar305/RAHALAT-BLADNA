"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, Eye, QrCode, MessageSquare, 
  Calendar, CheckCircle2, Clock, AlertTriangle, 
  FileText, ArrowRight, XCircle, Loader2, Edit2, Trash2, Mail,
  Phone, PhoneCall, UserCheck, MapPin, Sparkles, Send, ShieldCheck
} from "lucide-react";
import { formatMAD } from "@/lib/utils";
import { BookingAdminItem } from "./ReceiptVerificationModal";
import { sendBookingInvoiceEmailAction } from "@/actions/booking.actions";
import { CALL_STATUS_CONFIG } from "./CallCenterModal";
import { quickLogCallAttemptAction } from "@/actions/call-center.actions";
import { cleanMoroccanPhone, generateWhatsAppLink, CALL_CENTER_TEMPLATES } from "@/lib/callCenterWhatsApp";

interface BookingsTableProps {
  bookings: BookingAdminItem[];
  onOpenReceipt: (booking: BookingAdminItem) => void;
  onOpenTicket: (booking: BookingAdminItem) => void;
  onOpenCallCenter: (booking: BookingAdminItem) => void;
  onCancelBooking: (bookingId: string) => void;
  onEditBooking?: (booking: BookingAdminItem) => void;
  onDeleteBooking?: (booking: BookingAdminItem) => void;
  onCallStatusChanged?: (bookingId: string, newStatus: string) => void;
  locale?: string;
}

export function BookingsTable({
  bookings,
  onOpenReceipt,
  onOpenTicket,
  onOpenCallCenter,
  onCancelBooking,
  onEditBooking,
  onDeleteBooking,
  onCallStatusChanged,
  locale = "fr",
}: BookingsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [emailFeedback, setEmailFeedback] = useState<{ id: string; success: boolean; msg: string } | null>(null);
  const [quickStatusLoadingId, setQuickStatusLoadingId] = useState<string | null>(null);

  const handleSendInvoiceEmail = async (b: BookingAdminItem) => {
    if (sendingEmailId) return;
    setSendingEmailId(b.id);
    setEmailFeedback(null);
    try {
      const res = await sendBookingInvoiceEmailAction(b.id);
      if (res.success) {
        setEmailFeedback({ id: b.id, success: true, msg: res.message || "Facture PDF envoyée au client avec succès !" });
      } else {
        setEmailFeedback({ id: b.id, success: false, msg: res.error || "Échec de l'envoi de l'email." });
      }
    } catch (err: any) {
      setEmailFeedback({ id: b.id, success: false, msg: err.message || "Erreur de connexion." });
    } finally {
      setSendingEmailId(null);
      setTimeout(() => setEmailFeedback(null), 5000);
    }
  };

  const handleQuickStatusChange = async (b: BookingAdminItem, newStatus: string) => {
    setQuickStatusLoadingId(b.id);
    try {
      const res = await quickLogCallAttemptAction(b.id, newStatus);
      if (res.success && onCallStatusChanged) {
        onCallStatusChanged(b.id, newStatus);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setQuickStatusLoadingId(null);
    }
  };

  const filteredBookings = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return bookings;
    return bookings.filter(
      (b) =>
        b.reference.toLowerCase().includes(q) ||
        b.clientName.toLowerCase().includes(q) ||
        b.clientPhone.includes(q) ||
        b.clientEmail.toLowerCase().includes(q) ||
        b.tripTitle.toLowerCase().includes(q) ||
        (b.callNotes && b.callNotes.toLowerCase().includes(q)) ||
        (b.pickupCity && b.pickupCity.toLowerCase().includes(q)) ||
        (b.confirmedByMemberName && b.confirmedByMemberName.toLowerCase().includes(q))
    );
  }, [bookings, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Toast Notification Email */}
      {emailFeedback && (
        <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 shadow-md transition-all ${
          emailFeedback.success 
            ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800" 
            : "bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800"
        }`}>
          <div className="flex items-center gap-2">
            {emailFeedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{emailFeedback.msg}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setEmailFeedback(null)} 
            className="text-xs font-black opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Barre de Recherche Rapide */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone (+212), circuit, notes d'appel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
          <span>{filteredBookings.length} prospects & dossiers affichés</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="p-16 text-center text-slate-400 dark:text-slate-500 text-xs space-y-2">
            <Phone className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 opacity-60" />
            <p className="font-bold">Aucun dossier ou prospect ne correspond à ce filtre.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 text-start">Prospect & Contact</th>
                  <th className="px-5 py-3.5 text-start">Circuit & Logistique</th>
                  <th className="px-5 py-3.5 text-start">Suivi Téléphonique (CRM)</th>
                  <th className="px-5 py-3.5 text-end">Montants (Total / Acompte)</th>
                  <th className="px-5 py-3.5 text-center">Agent & Reçu R2</th>
                  <th className="px-5 py-3.5 text-end">Actions Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredBookings.map((b) => {
                  const balance = Math.max(0, b.totalAmount - b.amountPaid);
                  const isVerified = b.status === "DEPOSIT_PAID" || b.status === "DEPOSIT_CONFIRMED" || b.status === "FULLY_PAID" || b.callStatus === "DEPOSIT_RECEIVED";
                  const cleanPhone = cleanMoroccanPhone(b.clientPhone);
                  
                  // Config du statut d'appel
                  const currentCallStatusKey = (b.callStatus || "PENDING_CALL") as keyof typeof CALL_STATUS_CONFIG;
                  const callConfig = CALL_STATUS_CONFIG[currentCallStatusKey] || CALL_STATUS_CONFIG.PENDING_CALL;
                  const isPendingFirstCall = currentCallStatusKey === "PENDING_CALL";
                  const hasCallback = currentCallStatusKey === "CALLBACK_SCHEDULED" && b.nextCallbackDate;

                  // Template WhatsApp rapide pour le bouton de la ligne
                  const defaultWaMsg = CALL_CENTER_TEMPLATES.NO_ANSWER_RELANCE({
                    clientName: b.clientName,
                    clientPhone: b.clientPhone,
                    reference: b.reference,
                    tripTitle: b.tripTitle,
                  });
                  const waUrl = generateWhatsAppLink(b.clientPhone, defaultWaMsg);

                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                        isPendingFirstCall ? "bg-amber-50/30 dark:bg-amber-950/15" : ""
                      }`}
                    >
                      {/* COLONNE 1 : Prospect, Téléphone & Origine */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-cyan-600 dark:text-cyan-400 text-xs">
                              {b.reference}
                            </span>
                            {b.source && (
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                                {b.source}
                              </span>
                            )}
                          </div>

                          <p className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {b.clientName}
                          </p>

                          <div className="flex items-center gap-2 pt-0.5">
                            <a
                              href={`tel:+${cleanPhone}`}
                              className="inline-flex items-center gap-1 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                              title="Cliquer pour appeler"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{b.clientPhone}</span>
                            </a>

                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                              {b.callAttemptsCount || 0} appel(s)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* COLONNE 2 : Circuit & Détails Logistiques */}
                      <td className="px-5 py-4 max-w-[220px]">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 dark:text-white truncate" title={b.tripTitle}>
                            {b.tripTitle}
                          </p>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                            <span>{b.departureDate}</span>
                            <span className="ms-1 px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 font-bold">
                              {b.passengersCount} pax
                            </span>
                          </p>

                          {(b.pickupCity || b.pickupPoint) && (
                            <p className="text-[10px] text-brand-orange dark:text-brand-gold flex items-center gap-1 truncate" title={b.pickupPoint || b.pickupCity || ""}>
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span>{b.pickupCity} {b.pickupPoint ? `• ${b.pickupPoint}` : ""}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* COLONNE 3 : Suivi Téléphonique (CRM Call Status) */}
                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          {/* Badge de Statut d'Appel Interactif */}
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${callConfig.color}`}
                            >
                              {isPendingFirstCall && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                              )}
                              <span>{callConfig.label}</span>
                            </span>
                          </div>

                          {/* Alerte Rappel Programmé */}
                          {hasCallback && (
                            <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-900 w-fit">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>Rappel : {new Date(b.nextCallbackDate!).toLocaleString("fr-FR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                          )}

                          {/* Notes d'appel */}
                          {b.callNotes && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 italic" title={b.callNotes}>
                              💬 {b.callNotes}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* COLONNE 4 : Montants Financiers */}
                      <td className="px-5 py-4 text-end font-mono">
                        <p className="font-black text-slate-900 dark:text-white text-xs">
                          {formatMAD(b.totalAmount, locale)}
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          Acompte : {formatMAD(b.depositAmount, locale)}
                        </p>
                        {b.amountPaid > 0 ? (
                          <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">
                            Reçu : {formatMAD(b.amountPaid, locale)}
                          </p>
                        ) : (
                          <p className="text-[10px] text-amber-600 dark:text-amber-400">
                            En attente acompte
                          </p>
                        )}
                      </td>

                      {/* COLONNE 5 : Agent Assigné & Preuve Reçu */}
                      <td className="px-5 py-4 text-center">
                        <div className="space-y-1 flex flex-col items-center">
                          {b.confirmedByMemberName ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                              <UserCheck className="w-3 h-3 text-cyan-600" />
                              <span className="truncate max-w-[100px]">{b.confirmedByMemberName}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Non assigné</span>
                          )}

                          {b.proofUrl ? (
                            <button
                              type="button"
                              onClick={() => onOpenReceipt(b)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold hover:bg-amber-500/20 transition"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Voir Reçu</span>
                            </button>
                          ) : (
                            <span className="text-[9px] text-slate-400">Sans reçu R2</span>
                          )}
                        </div>
                      </td>

                      {/* COLONNE 6 : Actions Opérationnelles Agent */}
                      <td className="px-5 py-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. Bouton PRINCIPAL : Fiche d'Appel CRM */}
                          <button
                            type="button"
                            onClick={() => onOpenCallCenter(b)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-sm transition active:scale-95"
                            title="Ouvrir la Fiche d'Appel & Traitement Téléphonique"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Traiter</span>
                          </button>

                          {/* 2. Bouton WhatsApp Rapide */}
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition shadow-xs"
                            title="Ouvrir WhatsApp avec message personnalisé"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>

                          {/* 3. Billet QR Code */}
                          {isVerified && (
                            <button
                              type="button"
                              onClick={() => onOpenTicket(b)}
                              className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 transition shadow-xs"
                              title="Voir le Billet Numérique QR"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 4. Envoi Facture par Email */}
                          <button
                            type="button"
                            disabled={sendingEmailId === b.id}
                            onClick={() => handleSendInvoiceEmail(b)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition shadow-xs disabled:opacity-50"
                            title={`Envoyer le reçu/facture PDF par email à ${b.clientEmail || "client"}`}
                          >
                            {sendingEmailId === b.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Mail className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* 5. Modifier Dossier */}
                          {onEditBooking && (
                            <button
                              type="button"
                              onClick={() => onEditBooking(b)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:text-cyan-600 transition shadow-xs"
                              title="Modifier la réservation (montants, statut)"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 6. Annuler Dossier */}
                          {!b.status.startsWith("CANCELLED") && b.status !== "ANNULEE" && (
                            <button
                              type="button"
                              onClick={() => onCancelBooking(b.id)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Annuler cette réservation"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 7. Supprimer Dossier */}
                          {onDeleteBooking && (
                            <button
                              type="button"
                              onClick={() => onDeleteBooking(b)}
                              className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition shadow-xs"
                              title="Supprimer définitivement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
