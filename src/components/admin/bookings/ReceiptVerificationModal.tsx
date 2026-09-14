"use client";

import React, { useState } from "react";
import { 
  X, CheckCircle2, AlertTriangle, ExternalLink, 
  FileText, ShieldCheck, Banknote, Loader2, ZoomIn, Eye 
} from "lucide-react";
import { formatMAD } from "@/lib/utils";
import { 
  validateBookingDepositAction, 
  validateBookingFullPaymentAction, 
  rejectBookingReceiptAction 
} from "@/actions/booking.actions";

export interface BookingAdminItem {
  id: string;
  reference: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCity: string;
  tripId: string;
  tripTitle: string;
  departureDate: string;
  passengersCount: number;
  totalAmount: number;
  depositAmount: number;
  amountPaid: number;
  status: string;
  paymentStatus: string;
  proofUrl: string | null;
  paymentMethod: string;
  notes: string | null;
  qrCodeToken: string;
  travelers: Array<{
    id: string;
    fullName: string;
    cinPassport: string;
    category: string;
    pickupCity: string;
    roomType: string;
  }>;
  createdAt: string;
}

interface ReceiptVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingAdminItem | null;
  onSuccess: () => void;
  locale?: string;
}

export function ReceiptVerificationModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
  locale = "fr",
}: ReceiptVerificationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [customDeposit, setCustomDeposit] = useState<number | "">("");
  const [adminNotes, setAdminNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const total = booking.totalAmount;
  const deposit = booking.depositAmount;
  const balance = Math.max(0, total - booking.amountPaid);
  const isPdf = booking.proofUrl?.toLowerCase().endsWith(".pdf");

  const handleValidateDeposit = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const depositVal = customDeposit !== "" ? Number(customDeposit) : deposit;
      const res = await validateBookingDepositAction(booking.id, depositVal, adminNotes || undefined);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error || "Échec de la validation.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur de connexion.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleValidateFull = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await validateBookingFullPaymentAction(booking.id, adminNotes || undefined);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error || "Échec de la validation.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur de connexion.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      setError("Veuillez renseigner le motif du rejet.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const res = await rejectBookingReceiptAction(booking.id, rejectReason.trim());
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error || "Échec du rejet.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur de connexion.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Vérification de Preuve de Virement
                </h3>
                <span className="font-mono font-bold text-xs text-cyan-600 dark:text-cyan-400">
                  {booking.reference}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Client : <strong>{booking.clientName}</strong> ({booking.clientPhone}) • {booking.tripTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Colonne Gauche : Aperçu Reçu Bancaire Cloudflare R2 */}
            <div className="md:col-span-7 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                Preuve de Virement Téléversée
              </span>

              {booking.proofUrl ? (
                <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950 flex flex-col items-center justify-center min-h-[300px] group">
                  {isPdf ? (
                    <div className="p-8 text-center space-y-3 text-white">
                      <FileText className="w-16 h-16 text-cyan-400 mx-auto" />
                      <p className="text-sm font-bold">Document PDF Téléversé</p>
                      <a
                        href={booking.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Ouvrir le PDF en plein écran</span>
                      </a>
                    </div>
                  ) : (
                    <>
                      {/* Image Viewer with direct link */}
                      <img
                        src={booking.proofUrl}
                        alt="Reçu bancaire"
                        className="max-h-[380px] w-full object-contain"
                      />
                      <a
                        href={booking.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-3 end-3 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-xs text-white text-xs font-bold flex items-center gap-1.5 hover:bg-slate-900 transition shadow-md"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Plein écran</span>
                      </a>
                    </>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-400 text-xs">
                  Aucun reçu téléversé pour le moment.
                </div>
              )}
            </div>

            {/* Colonne Droite : Données Financières & Actions de Validation */}
            <div className="md:col-span-5 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                Détails Financiers du Dossier
              </span>

              <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Total Réservation :</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                    {formatMAD(total, locale)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Acompte Minimum Requis :</span>
                  <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    {formatMAD(deposit, locale)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Déjà Encaissé :</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatMAD(booking.amountPaid, locale)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Solde Restant à Régler :</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 text-sm">
                    {formatMAD(balance, locale)}
                  </span>
                </div>
              </div>

              {/* Ajustement Acompte Reçu (Optionnel) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                  Montant Reçu à Créditer (MAD) :
                </label>
                <input
                  type="number"
                  placeholder={`Par défaut : ${deposit} MAD`}
                  value={customDeposit}
                  onChange={(e) => setCustomDeposit(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                />
              </div>

              {/* Note Admin */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                  Note Interne / Réf Virement CIH / Attijari :
                </label>
                <input
                  type="text"
                  placeholder="Ex: Virement reçu sur compte CIH #9842"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Formulaire de Rejet (Repliable) */}
              {showRejectForm ? (
                <form onSubmit={handleRejectReceipt} className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-2.5 animate-in fade-in">
                  <label className="text-xs font-bold text-rose-800 dark:text-rose-200 block">
                    Motif du Rejet (Notifié au client) :
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Montant incomplet, preuve illisible, faux reçu..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-rose-300 dark:border-rose-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(false)}
                      className="px-3 py-1 text-xs text-slate-500 font-bold hover:underline"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="px-3 py-1 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition"
                    >
                      Confirmer le Rejet
                    </button>
                  </div>
                </form>
              ) : null}

              {/* Boutons d'Action Principaux */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleValidateDeposit}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Valider l&apos;Acompte (Émettre Billet)</span>
                </button>

                <button
                  type="button"
                  onClick={handleValidateFull}
                  disabled={isProcessing}
                  className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <Banknote className="w-4 h-4" />
                  <span>Valider Solde Complet (100%)</span>
                </button>

                {!showRejectForm && (
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(true)}
                    disabled={isProcessing}
                    className="w-full py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs border border-slate-200 dark:border-slate-700 hover:border-rose-300 transition flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Rejeter cette Preuve</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
