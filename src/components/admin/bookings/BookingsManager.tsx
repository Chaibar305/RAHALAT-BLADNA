"use client";

import React, { useState, useMemo } from "react";
import { 
  Ticket, AlertTriangle, CheckCircle2, 
  Clock, Download, Filter, Loader2, XCircle, Banknote 
} from "lucide-react";
import { BookingsTable } from "./BookingsTable";
import { ReceiptVerificationModal, BookingAdminItem } from "./ReceiptVerificationModal";
import { DigitalTicketModal } from "./DigitalTicketModal";
import { EditBookingModal } from "./EditBookingModal";
import { DeleteBookingModal } from "./DeleteBookingModal";
import { exportBookingsExcelAction, cancelBookingAdminAction } from "@/actions/booking.actions";

interface BookingsManagerProps {
  initialBookings: BookingAdminItem[];
  allTrips: Array<{ id: string; titleFr: string; titleAr: string }>;
  locale?: string;
}

export function BookingsManager({
  initialBookings,
  allTrips,
  locale = "fr",
}: BookingsManagerProps) {
  const isAr = locale === "ar";
  const [bookings, setBookings] = useState<BookingAdminItem[]>(initialBookings);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [selectedTripFilter, setSelectedTripFilter] = useState<string>("ALL");
  const [isExporting, setIsExporting] = useState(false);

  // Modals state
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<BookingAdminItem | null>(null);
  const [selectedTicketBooking, setSelectedTicketBooking] = useState<BookingAdminItem | null>(null);
  const [editingBooking, setEditingBooking] = useState<BookingAdminItem | null>(null);
  const [deletingBooking, setDeletingBooking] = useState<BookingAdminItem | null>(null);

  // Sync props
  React.useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);

  // Counts par statut
  const counts = useMemo(() => {
    const res = {
      ALL: bookings.length,
      PENDING_VERIFICATION: 0,
      DEPOSIT_CONFIRMED: 0,
      FULLY_PAID: 0,
      PENDING_PAYMENT: 0,
      CANCELLED: 0,
    };
    bookings.forEach((b) => {
      if (b.status === "PENDING_VERIFICATION") res.PENDING_VERIFICATION += 1;
      else if (b.status === "DEPOSIT_CONFIRMED") res.DEPOSIT_CONFIRMED += 1;
      else if (b.status === "FULLY_PAID") res.FULLY_PAID += 1;
      else if (b.status === "PENDING_PAYMENT") res.PENDING_PAYMENT += 1;
      else if (b.status === "CANCELLED") res.CANCELLED += 1;
    });
    return res;
  }, [bookings]);

  // Filtrage par onglet et par circuit
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesTab = activeTab === "ALL" || b.status === activeTab;
      const matchesTrip = selectedTripFilter === "ALL" || b.tripId === selectedTripFilter;
      return matchesTab && matchesTrip;
    });
  }, [bookings, activeTab, selectedTripFilter]);

  // Export Excel
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const res = await exportBookingsExcelAction(activeTab);
      if (res.success && res.base64) {
        const byteCharacters = atob(res.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = res.filename || "reservations_rahalat_bladna.xlsx";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert(res.error || "Échec de l'exportation.");
      }
    } catch (err: any) {
      alert("Erreur : " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Annulation
  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler ce dossier de réservation ?")) {
      return;
    }
    const reason = window.prompt("Motif d'annulation (optionnel) :") || undefined;

    try {
      const res = await cancelBookingAdminAction(bookingId, reason);
      if (res.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: "CANCELLED" } : b))
        );
      } else {
        alert(res.error || "Erreur lors de l'annulation.");
      }
    } catch (err: any) {
      alert("Erreur de connexion : " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barre d'Onglets de Statut & Actions Supérieures */}
      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Onglets */}
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {/* Tous */}
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === "ALL"
                ? "bg-cyan-500 text-slate-950 font-black shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span>Tous les dossiers</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-950/10 text-[10px] font-black">
              {counts.ALL}
            </span>
          </button>

          {/* À Vérifier (Reçus R2) */}
          <button
            type="button"
            onClick={() => setActiveTab("PENDING_VERIFICATION")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === "PENDING_VERIFICATION"
                ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                : "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>À Vérifier (Reçus R2)</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                counts.PENDING_VERIFICATION > 0
                  ? "bg-amber-600 text-white animate-pulse"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-600"
              }`}
            >
              {counts.PENDING_VERIFICATION}
            </span>
          </button>

          {/* Acomptes Validés */}
          <button
            type="button"
            onClick={() => setActiveTab("DEPOSIT_CONFIRMED")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === "DEPOSIT_CONFIRMED"
                ? "bg-emerald-600 text-white font-black shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Acomptes Validés</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-black">
              {counts.DEPOSIT_CONFIRMED}
            </span>
          </button>

          {/* Soldés 100% */}
          <button
            type="button"
            onClick={() => setActiveTab("FULLY_PAID")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === "FULLY_PAID"
                ? "bg-cyan-600 text-white font-black shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Banknote className="w-3.5 h-3.5 text-cyan-400" />
            <span>Soldés 100%</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-black">
              {counts.FULLY_PAID}
            </span>
          </button>

          {/* En Attente Paiement */}
          <button
            type="button"
            onClick={() => setActiveTab("PENDING_PAYMENT")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === "PENDING_PAYMENT"
                ? "bg-slate-800 text-white font-black shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>En Attente</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-black">
              {counts.PENDING_PAYMENT}
            </span>
          </button>

          {/* Annulés */}
          <button
            type="button"
            onClick={() => setActiveTab("CANCELLED")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === "CANCELLED"
                ? "bg-rose-600 text-white font-black shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Annulés</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-black">
              {counts.CANCELLED}
            </span>
          </button>
        </div>

        {/* Contrôles Droite : Filtre Circuit & Bouton Export */}
        <div className="flex items-center gap-2.5">
          <select
            value={selectedTripFilter}
            onChange={(e) => setSelectedTripFilter(e.target.value)}
            className="text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">Tous les circuits</option>
            {allTrips.map((t) => (
              <option key={t.id} value={t.id}>
                {isAr ? t.titleAr : t.titleFr}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : (
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <span>Export (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Tableau des Réservations */}
      <BookingsTable
        bookings={filteredBookings}
        onOpenReceipt={(b) => setSelectedReceiptBooking(b)}
        onOpenTicket={(b) => setSelectedTicketBooking(b)}
        onCancelBooking={handleCancelBooking}
        onEditBooking={(b) => setEditingBooking(b)}
        onDeleteBooking={(b) => setDeletingBooking(b)}
        locale={locale}
      />

      {/* Modale de Vérification de Preuve R2 */}
      <ReceiptVerificationModal
        isOpen={!!selectedReceiptBooking}
        onClose={() => setSelectedReceiptBooking(null)}
        booking={selectedReceiptBooking}
        onSuccess={() => {
          // Recharger les données ou basculer en local
          window.location.reload();
        }}
        locale={locale}
      />

      {/* Modale Billet d'Embarquement Numérique */}
      <DigitalTicketModal
        isOpen={!!selectedTicketBooking}
        onClose={() => setSelectedTicketBooking(null)}
        booking={selectedTicketBooking}
        locale={locale}
      />

      {/* Modale de Modification de Réservation */}
      <EditBookingModal
        isOpen={!!editingBooking}
        onClose={() => setEditingBooking(null)}
        booking={editingBooking}
        onSuccess={() => {
          window.location.reload();
        }}
        locale={locale}
      />

      {/* Modale de Suppression de Réservation */}
      <DeleteBookingModal
        isOpen={!!deletingBooking}
        onClose={() => setDeletingBooking(null)}
        booking={deletingBooking}
        onSuccess={() => {
          window.location.reload();
        }}
        locale={locale}
      />
    </div>
  );
}
