"use client";

import React from "react";
import { 
  X, Mail, Phone, MapPin, Calendar, 
  MessageSquare, Compass, CreditCard, Users, 
  CheckCircle2, Clock, FileText, Download,
  Edit2, Ban, ShieldCheck, Trash2, ShieldAlert
} from "lucide-react";
import { formatMAD } from "@/lib/utils";

export interface ClientDetailedData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  cinOrPassport?: string | null;
  city: string;
  role?: string;
  isBlocked: boolean;
  blockedReason?: string | null;
  avatarUrl?: string | null;
  registeredAt: string;
  hasPassword?: boolean;
  isGoogleAuth?: boolean;
  bookings: Array<{
    id: string;
    reference: string;
    tripTitle: string;
    departureDate: string;
    totalAmount: number;
    amountPaid: number;
    status: string;
    paymentStatus: string;
    travelers: Array<{
      id: string;
      fullName: string;
      cinPassport: string;
    }>;
  }>;
  invoices: Array<{
    id: string;
    number: string;
    totalTTC: number;
    status: string;
    issuedAt: string;
    pdfUrl?: string | null;
  }>;
}

interface ClientDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientDetailedData | null;
  onEditClient?: (client: ClientDetailedData) => void;
  onToggleBlock?: (client: ClientDetailedData) => void;
  onDeleteClient?: (client: ClientDetailedData) => void;
  locale?: string;
}

export function ClientDetailsDrawer({
  isOpen,
  onClose,
  client,
  onEditClient,
  onToggleBlock,
  onDeleteClient,
  locale = "fr",
}: ClientDetailsDrawerProps) {
  if (!isOpen || !client) return null;

  // Extraire les compagnons habituels uniques
  const companionMap = new Map<string, { fullName: string; cinPassport: string; tripsCount: number }>();
  client.bookings.forEach((b) => {
    b.travelers.forEach((t) => {
      // Si ce n'est pas le client lui-même
      if (t.fullName.toLowerCase() !== client.fullName.toLowerCase()) {
        const existing = companionMap.get(t.fullName.toLowerCase());
        if (existing) {
          existing.tripsCount += 1;
        } else {
          companionMap.set(t.fullName.toLowerCase(), {
            fullName: t.fullName,
            cinPassport: t.cinPassport,
            tripsCount: 1,
          });
        }
      }
    });
  });

  const companions = Array.from(companionMap.values());
  const validBookings = client.bookings.filter((b) => b.status !== "ANNULEE");
  const totalSpent = validBookings.reduce((sum, b) => sum + b.amountPaid, 0);

  const cleanPhone = client.phone.replace(/[^0-9]/g, "");
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith("0") ? "212" + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(`Bonjour ${client.fullName}, l'équipe Rahalat Bladna vous contacte concernant vos réservations.`)}` : null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 flex justify-end">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl border-s border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
      >
        {/* Top Bar */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-md">
              {client.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {client.fullName}
                </h2>
                {client.isBlocked ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] font-black uppercase flex items-center gap-1">
                    <Ban className="w-3 h-3" /> Suspendu
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-[10px] font-black uppercase">
                    Client Actif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Membre depuis le {client.registeredAt}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-3 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Actions d&apos;Administration
          </span>

          <div className="flex items-center gap-1.5">
            {onEditClient && (
              <button
                type="button"
                onClick={() => onEditClient(client)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:text-cyan-600 dark:hover:text-cyan-400 font-bold text-xs transition active:scale-95 shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Modifier</span>
              </button>
            )}

            {onToggleBlock && (
              <button
                type="button"
                onClick={() => onToggleBlock(client)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition active:scale-95 shadow-xs border ${
                  client.isBlocked
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                    : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
                }`}
              >
                {client.isBlocked ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Débloquer</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>Suspendre</span>
                  </>
                )}
              </button>
            )}

            {onDeleteClient && (
              <button
                type="button"
                onClick={() => onDeleteClient(client)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 font-bold text-xs transition active:scale-95 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Alerte si le compte est suspendu */}
          {client.isBlocked && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-900 dark:text-rose-200 space-y-1">
              <div className="flex items-center gap-2 font-black text-rose-700 dark:text-rose-400">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Compte Actuellement Suspendu</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Ce client ne peut plus se connecter ni effectuer de réservation.
              </p>
              {client.blockedReason && (
                <p className="text-[11px] font-semibold pt-1 border-t border-rose-200/60 dark:border-rose-800/40">
                  Motif renseigné : « {client.blockedReason} »
                </p>
              )}
            </div>
          )}

          {/* Quick Contact & Info Card */}
          <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Coordonnées & Statut
              </span>
              <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                <span className="truncate">{client.email}</span>
              </p>
              <p className="font-mono text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{client.phone}</span>
              </p>
              {client.cinOrPassport && (
                <p className="font-mono text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span>CIN: {client.cinOrPassport}</span>
                </p>
              )}
              <p className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{client.city}</span>
              </p>
            </div>

            <div className="flex flex-col justify-between items-start sm:items-end border-t sm:border-t-0 sm:border-s border-slate-200 dark:border-slate-800 pt-3 sm:pt-0 sm:ps-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block sm:text-end">
                  Total Dépensé Cumulé
                </span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 sm:text-end font-mono">
                  {formatMAD(totalSpent, locale)}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 sm:text-end mt-0.5">
                  {validBookings.length} réservations confirmées
                </p>
              </div>

              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition active:scale-95"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Contacter sur WhatsApp</span>
                </a>
              )}
            </div>
          </div>

          {/* Frequent Companions Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Users className="w-4 h-4 text-cyan-500" />
              <span>Compagnons de Voyage Habituels ({companions.length})</span>
            </div>

            {companions.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                Ce client voyage généralement seul ou n&apos;a pas encore inscrit d&apos;autres passagers.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {companions.map((comp, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{comp.fullName}</p>
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        CIN : {comp.cinPassport}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                      {comp.tripsCount} {comp.tripsCount > 1 ? "voyages" : "voyage"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bookings History */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Compass className="w-4 h-4 text-cyan-500" />
              <span>Historique des Réservations ({client.bookings.length})</span>
            </div>

            {client.bookings.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic p-4 text-center">
                Aucune réservation enregistrée.
              </p>
            ) : (
              <div className="space-y-3">
                {client.bookings.map((b) => {
                  const balance = b.totalAmount - b.amountPaid;
                  return (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-xs text-cyan-600 dark:text-cyan-400">
                              {b.reference}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                b.paymentStatus === "PAYE_INTEGRALEMENT"
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : b.paymentStatus === "ACOMPTE_VERSE"
                                  ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400"
                                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {b.paymentStatus === "PAYE_INTEGRALEMENT"
                                ? "Soldé"
                                : b.paymentStatus === "ACOMPTE_VERSE"
                                ? "Acompte Payé"
                                : "En attente"}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs mt-1">
                            {b.tripTitle}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-cyan-500" />
                            Départ : {b.departureDate}
                          </p>
                        </div>

                        <div className="text-end font-mono">
                          <p className="font-black text-slate-900 dark:text-white text-xs">
                            {formatMAD(b.totalAmount, locale)}
                          </p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            Payé : {formatMAD(b.amountPaid, locale)}
                          </p>
                          {balance > 0 && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400">
                              Reste : {formatMAD(balance, locale)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Voyageurs inclus dans ce dossier */}
                      {b.travelers && b.travelers.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="text-slate-400 text-[10px] font-semibold">Passagers :</span>
                          {b.travelers.map((tr) => (
                            <span
                              key={tr.id}
                              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
                            >
                              {tr.fullName} <span className="font-mono text-slate-400">({tr.cinPassport})</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Invoices List */}
          {client.invoices && client.invoices.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <FileText className="w-4 h-4 text-cyan-500" />
                <span>Factures Émises ({client.invoices.length})</span>
              </div>

              <div className="space-y-2">
                {client.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-mono font-bold text-slate-900 dark:text-white">{inv.number}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Émise le {inv.issuedAt}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        {formatMAD(inv.totalTTC, locale)}
                      </span>
                      {inv.pdfUrl && (
                        <a
                          href={inv.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-cyan-600 hover:text-cyan-500 transition"
                          title="Télécharger Facture PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
