"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, Eye, QrCode, MessageSquare, 
  Calendar, CheckCircle2, Clock, AlertTriangle, 
  FileText, ArrowRight, XCircle, Loader2, Edit2, Trash2, Mail 
} from "lucide-react";
import { formatMAD } from "@/lib/utils";
import { BookingAdminItem } from "./ReceiptVerificationModal";
import { sendBookingInvoiceEmailAction } from "@/actions/booking.actions";

interface BookingsTableProps {
  bookings: BookingAdminItem[];
  onOpenReceipt: (booking: BookingAdminItem) => void;
  onOpenTicket: (booking: BookingAdminItem) => void;
  onCancelBooking: (bookingId: string) => void;
  onEditBooking?: (booking: BookingAdminItem) => void;
  onDeleteBooking?: (booking: BookingAdminItem) => void;
  locale?: string;
}

export function BookingsTable({
  bookings,
  onOpenReceipt,
  onOpenTicket,
  onCancelBooking,
  onEditBooking,
  onDeleteBooking,
  locale = "fr",
}: BookingsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [emailFeedback, setEmailFeedback] = useState<{ id: string; success: boolean; msg: string } | null>(null);

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

  const filteredBookings = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return bookings;
    return bookings.filter(
      (b) =>
        b.reference.toLowerCase().includes(q) ||
        b.clientName.toLowerCase().includes(q) ||
        b.clientPhone.includes(q) ||
        b.clientEmail.toLowerCase().includes(q) ||
        b.tripTitle.toLowerCase().includes(q)
    );
  }, [bookings, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Toast de Notification d'envoi d'email */}
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

      {/* Search Input Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3" />
          <input
            type="text"
            placeholder="Rechercher par référence, client, téléphone, circuit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-bold hidden sm:inline-block">
          {filteredBookings.length} dossiers affichés
        </span>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs">
            Aucun dossier de réservation ne correspond à votre sélection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 text-start">Réf. Dossier & Client</th>
                  <th className="px-5 py-3.5 text-start">Circuit & Départ</th>
                  <th className="px-5 py-3.5 text-center">Preuve Reçu (R2)</th>
                  <th className="px-5 py-3.5 text-end">Montants (TTC / Payé)</th>
                  <th className="px-5 py-3.5 text-center">Statut Dossier</th>
                  <th className="px-5 py-3.5 text-center">Billetterie</th>
                  <th className="px-5 py-3.5 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredBookings.map((b) => {
                  const balance = Math.max(0, b.totalAmount - b.amountPaid);
                  const isVerified = b.status === "DEPOSIT_PAID" || b.status === "DEPOSIT_CONFIRMED" || b.status === "FULLY_PAID";
                  const isPendingReview = b.status === "PENDING_VERIFICATION";

                  const cleanPhone = b.clientPhone.replace(/[^0-9]/g, "");
                  const waUrl = cleanPhone
                    ? `https://wa.me/${cleanPhone.startsWith("0") ? "212" + cleanPhone.slice(1) : cleanPhone}`
                    : null;

                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                        isPendingReview ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
                      }`}
                    >
                      {/* Réf Dossier & Client */}
                      <td className="px-5 py-4">
                        <p className="font-mono font-black text-cyan-600 dark:text-cyan-400 text-xs">
                          {b.reference}
                        </p>
                        <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                          {b.clientName}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {b.clientPhone}
                        </p>
                      </td>

                      {/* Circuit & Départ */}
                      <td className="px-5 py-4 max-w-[200px]">
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {b.tripTitle}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                          <span>{b.departureDate}</span>
                          <span className="ms-1 px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 font-bold">
                            {b.passengersCount} pax
                          </span>
                        </p>
                      </td>

                      {/* Preuve Virement R2 */}
                      <td className="px-5 py-4 text-center">
                        {b.proofUrl ? (
                          <button
                            type="button"
                            onClick={() => onOpenReceipt(b)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition shadow-xs active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Voir Reçu</span>
                            {isPendingReview && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            )}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Non téléversé
                          </span>
                        )}
                      </td>

                      {/* Montants */}
                      <td className="px-5 py-4 text-end font-mono">
                        <p className="font-black text-slate-900 dark:text-white text-xs">
                          {formatMAD(b.totalAmount, locale)}
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          Payé : {formatMAD(b.amountPaid, locale)}
                        </p>
                        {balance > 0 ? (
                          <p className="text-[10px] text-amber-600 dark:text-amber-400">
                            Solde : {formatMAD(balance, locale)}
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-400">Soldé</p>
                        )}
                      </td>

                      {/* Statut Dossier */}
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            b.status === "PENDING_VERIFICATION"
                              ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-pulse"
                              : b.status === "DEPOSIT_PAID" || b.status === "DEPOSIT_CONFIRMED"
                              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                              : b.status === "FULLY_PAID"
                              ? "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30"
                              : b.status === "CANCELLED_BY_CLIENT"
                              ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                              : b.status === "CANCELLED_BY_ADMIN" || b.status === "CANCELLED"
                              ? "bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-500/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {b.status === "PENDING_VERIFICATION" ? (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              <span>À Vérifier</span>
                            </>
                          ) : b.status === "DEPOSIT_PAID" || b.status === "DEPOSIT_CONFIRMED" ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Acompte Validé</span>
                            </>
                          ) : b.status === "FULLY_PAID" ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Soldé 100%</span>
                            </>
                          ) : b.status === "CANCELLED_BY_CLIENT" ? (
                            <span>Annulée (Client)</span>
                          ) : b.status === "CANCELLED_BY_ADMIN" || b.status === "CANCELLED" ? (
                            <span>Annulée (Agence)</span>
                          ) : (
                            <span>En Attente</span>
                          )}
                        </span>
                      </td>

                      {/* Billetterie Digitale */}
                      <td className="px-5 py-4 text-center">
                        {isVerified ? (
                          <button
                            type="button"
                            onClick={() => onOpenTicket(b)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 font-bold text-xs transition shadow-xs active:scale-95"
                          >
                            <QrCode className="w-3.5 h-3.5 text-cyan-600" />
                            <span>Billet QR</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            En attente acompte
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Bouton WhatsApp */}
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition shadow-xs"
                              title="Contacter sur WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Bouton Vérifier Reçu */}
                          {b.proofUrl && (
                            <button
                              type="button"
                              onClick={() => onOpenReceipt(b)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-cyan-500 hover:text-slate-950 transition"
                              title="Vérifier le Reçu"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Bouton Envoyer Facture / Reçu PDF par Email */}
                          <button
                            type="button"
                            disabled={sendingEmailId === b.id}
                            onClick={() => handleSendInvoiceEmail(b)}
                            className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition shadow-xs disabled:opacity-50"
                            title={`Envoyer le reçu/facture PDF par email à ${b.clientEmail || "client"}`}
                          >
                            {sendingEmailId === b.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Mail className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Bouton Modifier Dossier */}
                          {onEditBooking && (
                            <button
                              type="button"
                              onClick={() => onEditBooking(b)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:text-cyan-600 dark:hover:text-cyan-400 transition shadow-xs"
                              title="Modifier la réservation (statut, montants, notes)"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Bouton Annuler Dossier */}
                          {!b.status.startsWith("CANCELLED") && b.status !== "ANNULEE" && (
                            <button
                              type="button"
                              onClick={() => onCancelBooking(b.id)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                              title="Annuler cette réservation"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Bouton Supprimer Dossier */}
                          {onDeleteBooking && (
                            <button
                              type="button"
                              onClick={() => onDeleteBooking(b)}
                              className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition shadow-xs"
                              title="Supprimer définitivement le dossier"
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
