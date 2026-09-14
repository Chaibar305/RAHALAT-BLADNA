"use client";

import React from "react";
import { 
  X, Printer, MessageSquare, QrCode, 
  MapPin, Calendar, Users, ShieldCheck, Bus, CheckCircle2 
} from "lucide-react";
import { formatMAD } from "@/lib/utils";
import { BookingAdminItem } from "./ReceiptVerificationModal";

interface DigitalTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingAdminItem | null;
  locale?: string;
}

export function DigitalTicketModal({
  isOpen,
  onClose,
  booking,
  locale = "fr",
}: DigitalTicketModalProps) {
  if (!isOpen || !booking) return null;

  const isFull = booking.status === "FULLY_PAID";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `RAHALAT_BLADNA_TICKET:${booking.reference}:${booking.clientName}:${booking.tripTitle}:${booking.departureDate}`
  )}`;

  const cleanPhone = booking.clientPhone.replace(/[^0-9]/g, "");
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith("0") ? "212" + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(
        `🎉 *Félicitations ${booking.clientName} !*\nVotre réservation pour le circuit *${booking.tripTitle}* est confirmée.\n\n🎫 *Réf Dossier :* ${booking.reference}\n📅 *Départ le :* ${booking.departureDate}\n📍 *Point de rassemblement :* ${booking.travelers[0]?.pickupCity || "Casablanca"}\n👥 *Passagers :* ${booking.passengersCount} personnes\n\nVotre Billet d'Embarquement Numérique avec QR Code officiel est disponible dans votre espace voyageur Rahalat Bladna.`
      )}`
    : null;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>BILLET D'EMBARQUEMENT - ${booking.reference}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 30px; color: #111; font-size: 12px; }
            .ticket { border: 2px solid #000; border-radius: 12px; overflow: hidden; max-width: 650px; margin: auto; }
            .header { background: #0f172a; color: #fff; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 20px; font-weight: 900; letter-spacing: 1px; }
            .pass-badge { background: #06b6d4; color: #0f172a; font-weight: bold; padding: 4px 10px; border-radius: 20px; font-size: 11px; }
            .body { padding: 24px; display: flex; gap: 20px; }
            .info-col { flex: 1; }
            .qr-col { width: 140px; text-align: center; border-left: 2px dashed #ccc; padding-left: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
            .qr-col img { width: 120px; height: 120px; }
            .section-title { font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
            .section-val { font-size: 14px; font-weight: bold; margin-bottom: 12px; }
            .pax-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
            .pax-table th { background: #f1f5f9; padding: 6px; text-align: left; border-bottom: 1px solid #cbd5e1; }
            .pax-table td { padding: 6px; border-bottom: 1px solid #e2e8f0; }
            .footer { background: #f8fafc; padding: 12px 24px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <div>
                <div class="logo">RAHALAT BLADNA (رحلات بلادنا)</div>
                <div style="font-size: 11px; opacity: 0.8;">CARTE D'EMBARQUEMENT OFFICIELLE • TRANSPORT AGRÉÉ TIST</div>
              </div>
              <div class="pass-badge">${isFull ? "SOLDÉ 100%" : "ACOMPTE VALIDÉ"}</div>
            </div>
            <div class="body">
              <div class="info-col">
                <div class="section-title">Circuit & Destination</div>
                <div class="section-val" style="color: #0891b2;">${booking.tripTitle}</div>

                <div style="display: flex; gap: 20px;">
                  <div>
                    <div class="section-title">Date de Départ</div>
                    <div class="section-val">${booking.departureDate}</div>
                  </div>
                  <div>
                    <div class="section-title">Point de Ramassage</div>
                    <div class="section-val">${booking.travelers[0]?.pickupCity || "Casablanca"}</div>
                  </div>
                  <div>
                    <div class="section-title">Réf. Dossier</div>
                    <div class="section-val" style="font-family: monospace;">${booking.reference}</div>
                  </div>
                </div>

                <div class="section-title" style="margin-top: 8px;">Passagers Enregistrés (${booking.passengersCount})</div>
                <table class="pax-table">
                  <thead>
                    <tr>
                      <th>Nom & Prénom</th>
                      <th>N° CIN / Passeport</th>
                      <th>Chambre</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${booking.travelers
                      .map(
                        (t) => `
                      <tr>
                        <td><strong>${t.fullName}</strong></td>
                        <td style="font-family: monospace;">${t.cinPassport}</td>
                        <td>${t.roomType || "Standard"}</td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>

              <div class="qr-col">
                <img src="${qrUrl}" alt="QR Code d'embarquement" />
                <div style="font-size: 9px; margin-top: 6px; font-weight: bold; font-family: monospace;">${booking.reference}</div>
                <div style="font-size: 8px; color: #64748b; margin-top: 2px;">Présenter au chef de bord</div>
              </div>
            </div>
            <div class="footer">
              Ce billet numérique fait foi de confirmation officielle auprès du transporteur touristique et des autorités de contrôle.
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Billet d&apos;Embarquement Numérique
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    isFull
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400"
                  }`}
                >
                  {isFull ? "Soldé 100%" : "Acompte Validé"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Document certifié conforme pour le chef de bord et les autorités routières.
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

        {/* Ticket Visual */}
        <div className="p-6 space-y-6">
          <div className="rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 overflow-hidden shadow-md">
            {/* Header Ticket */}
            <div className="bg-slate-950 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block">
                  RAHALAT BLADNA (رحلات بلادنا)
                </span>
                <h4 className="text-base font-extrabold text-white mt-0.5">
                  {booking.tripTitle}
                </h4>
              </div>
              <span className="font-mono text-xs font-black text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800">
                {booking.reference}
              </span>
            </div>

            {/* Ticket Body with QR */}
            <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-4 flex-1 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Date de Départ
                    </span>
                    <p className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      <span>{booking.departureDate}</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Ville d&apos;Embarquement
                    </span>
                    <p className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{booking.travelers[0]?.pickupCity || "Casablanca"}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                    Passagers Inscrits ({booking.passengersCount})
                  </span>
                  <div className="space-y-1">
                    {booking.travelers.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between text-[11px] bg-slate-100/70 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg font-medium text-slate-800 dark:text-slate-200"
                      >
                        <span className="font-bold">{t.fullName}</span>
                        <span className="font-mono text-slate-500 dark:text-slate-400">
                          CIN : {t.cinPassport}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="sm:border-s sm:border-slate-200 dark:sm:border-slate-800 sm:ps-6 flex flex-col items-center justify-center shrink-0">
                <div className="p-2 bg-white rounded-2xl shadow-sm border border-slate-200">
                  <img
                    src={qrUrl}
                    alt="QR d'embarquement"
                    className="w-32 h-32 rounded-xl"
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-bold mt-2">
                  {booking.reference}
                </span>
                <span className="text-[9px] text-slate-400">Scannable à l&apos;autocar</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer Billet (PDF)</span>
            </button>

            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Envoyer Billet (WhatsApp)</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
