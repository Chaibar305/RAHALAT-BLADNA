"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, Filter, Download, Printer, Edit2, 
  CheckCircle2, Clock, ShieldCheck, AlertCircle, 
  MapPin, Calendar, Phone, MessageSquare, Loader2, Compass 
} from "lucide-react";
import { togglePassengerCheckInAction, exportAllPassengersExcelAction } from "@/actions/client.actions";
import { generateOfficialManifestHtml } from "@/lib/pdf-generator";
import { ManifestTransportInfo, ManifestPassengerRow } from "@/types";

export interface PassengerRegistryItem {
  id: string;
  fullName: string;
  cinPassport: string;
  phone: string;
  category: string;
  pickupCity: string;
  roomType: string;
  isCheckedIn: boolean;
  bookingId: string;
  bookingReference: string;
  bookingStatus: string;
  paymentStatus: string;
  totalAmount: number;
  amountPaid: number;
  tripId: string;
  tripTitle: string;
  departureDate: string | null;
  clientName: string;
  clientEmail: string;
}

interface PassengersRegistryTableProps {
  passengers: PassengerRegistryItem[];
  allTrips: Array<{ id: string; titleFr: string; titleAr: string }>;
  pickupPoints: Array<{ id: string; cityName: string }>;
  onEditPassenger: (passenger: PassengerRegistryItem) => void;
  locale?: string;
}

/**
 * Valide le format d'une CIN marocaine (1-2 lettres + 4-7 chiffres) ou Passeport
 */
function isValidCinFormat(cin: string): boolean {
  if (!cin) return false;
  const clean = cin.trim().toUpperCase();
  // Format CIN Maroc : 1 ou 2 lettres + 4 à 7 chiffres
  const cinRegex = /^[A-Z]{1,2}[0-9]{4,7}$/;
  // Format Passeport : 6 à 9 caractères alphanumériques
  const passRegex = /^[A-Z0-9]{6,9}$/;
  return cinRegex.test(clean) || passRegex.test(clean);
}

export function PassengersRegistryTable({
  passengers: initialPassengers,
  allTrips,
  pickupPoints,
  onEditPassenger,
  locale = "fr",
}: PassengersRegistryTableProps) {
  const isAr = locale === "ar";
  const [passengers, setPassengers] = useState<PassengerRegistryItem[]>(initialPassengers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTripId, setSelectedTripId] = useState<string>("ALL");
  const [selectedPickup, setSelectedPickup] = useState<string>("ALL");
  const [selectedPayment, setSelectedPayment] = useState<string>("ALL");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Sync si les props changent
  React.useEffect(() => {
    setPassengers(initialPassengers);
  }, [initialPassengers]);

  // Villes uniques de ramassage
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    passengers.forEach((p) => {
      if (p.pickupCity) set.add(p.pickupCity);
    });
    pickupPoints.forEach((pt) => {
      if (pt.cityName) set.add(pt.cityName);
    });
    return Array.from(set);
  }, [passengers, pickupPoints]);

  // Filtrage combiné
  const filteredPassengers = useMemo(() => {
    return passengers.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.fullName.toLowerCase().includes(q) ||
        p.cinPassport.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.bookingReference.toLowerCase().includes(q);

      const matchesTrip = selectedTripId === "ALL" || p.tripId === selectedTripId;
      const matchesPickup = selectedPickup === "ALL" || p.pickupCity.toLowerCase().includes(selectedPickup.toLowerCase());
      const matchesPayment =
        selectedPayment === "ALL" ||
        (selectedPayment === "CONFIRMED" && p.paymentStatus === "PAYE_INTEGRALEMENT") ||
        (selectedPayment === "DEPOSIT" && p.paymentStatus === "ACOMPTE_VERSE") ||
        (selectedPayment === "UNPAID" && (p.paymentStatus === "NON_PAYE" || p.paymentStatus === "EN_ATTENTE"));

      return matchesSearch && matchesTrip && matchesPickup && matchesPayment;
    });
  }, [passengers, searchQuery, selectedTripId, selectedPickup, selectedPayment]);

  // Bascule du statut de pointage (présent à bord)
  const handleToggleCheckIn = async (passengerId: string) => {
    setTogglingId(passengerId);
    try {
      const res = await togglePassengerCheckInAction(passengerId);
      if (res.success) {
        setPassengers((prev) =>
          prev.map((p) =>
            p.id === passengerId ? { ...p, isCheckedIn: !!res.isCheckedIn } : p
          )
        );
      } else {
        alert(res.error || "Erreur de mise à jour du pointage.");
      }
    } catch (err: any) {
      alert("Erreur de connexion : " + err.message);
    } finally {
      setTogglingId(null);
    }
  };

  // Export Excel
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const res = await exportAllPassengersExcelAction({
        tripId: selectedTripId,
        pickupCity: selectedPickup,
        paymentStatus: selectedPayment,
      });

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
        link.download = res.filename || "registre_passagers_tist.xlsx";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert(res.error || "Échec de l'exportation Excel.");
      }
    } catch (err: any) {
      alert("Erreur lors de l'exportation : " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Impression PDF Manifeste Officiel
  const handlePrintPdf = () => {
    const selectedTrip = allTrips.find((t) => t.id === selectedTripId);
    const transportInfo: ManifestTransportInfo = {
      tripId: selectedTrip?.id,
      tripTitle: selectedTrip ? (isAr ? selectedTrip.titleAr : selectedTrip.titleFr) : "Registre Global des Passagers",
      departureDate: new Date().toLocaleDateString("fr-FR"),
      transporterName: "Transport Touristique Agréé (Série TIST)",
      tistNumber: "TIST-AGRÉÉ-DGSN",
      plateNumber: "Autocar Touristique",
      driverName: "Chauffeur Professionnel Agréé",
      driverPhone: "+212 600-000000",
      agencyName: "Rahalat Bladna (رحلات بلادنا)",
      agencyLicense: "Agrément Officiel Tourisme",
      driverCard: null,
      hasTransportAssigned: true,
      hasDriverAssigned: true,
    };

    const manifestRows: ManifestPassengerRow[] = filteredPassengers.map((p, idx) => ({
      id: p.id,
      seatNumber: idx + 1,
      fullName: p.fullName,
      cinOrPassport: p.cinPassport,
      nationality: "Marocaine",
      phone: p.phone,
      pickupLocation: p.pickupCity || "Casablanca",
      roomType: p.roomType || "Double Twin",
      bookingNumber: p.bookingReference,
      isCheckedIn: p.isCheckedIn,
      paymentStatus: p.paymentStatus === "PAYE_INTEGRALEMENT" ? "FULLY_PAID" : "DEPOSIT_PAID",
      remainingBalance: Math.max(0, p.totalAmount - p.amountPaid),
    }));

    const htmlContent = generateOfficialManifestHtml(transportInfo, manifestRows);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  const boardedCount = filteredPassengers.filter((p) => p.isCheckedIn).length;

  return (
    <div className="space-y-4">
      {/* Barre d'outils et Filtres Avancés */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
        {/* Ligne 1 : Recherche et Sélecteurs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Recherche */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3" />
            <input
              type="text"
              placeholder="Nom, CIN, tél, réf..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-10 pe-4 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Filtre Circuit */}
          <div>
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ALL">Tous les circuits</option>
              {allTrips.map((t) => (
                <option key={t.id} value={t.id}>
                  {isAr ? t.titleAr : t.titleFr}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Ville de Ramassage */}
          <div>
            <select
              value={selectedPickup}
              onChange={(e) => setSelectedPickup(e.target.value)}
              className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ALL">Toutes les villes de ramassage</option>
              {uniqueCities.map((city, idx) => (
                <option key={idx} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Statut Paiement */}
          <div>
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ALL">Tous les statuts de paiement</option>
              <option value="CONFIRMED">Payé 100% (Soldé)</option>
              <option value="DEPOSIT">Acompte Versé</option>
              <option value="UNPAID">En attente de paiement</option>
            </select>
          </div>
        </div>

        {/* Ligne 2 : Compteurs et Actions Groupées */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Pointage Présence :
            </span>
            <span className="px-3 py-1 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 font-mono font-black text-xs border border-cyan-200/60 dark:border-cyan-800/60">
              {boardedCount} / {filteredPassengers.length} Présents à bord
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Export Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs active:scale-95 disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              <span>Exporter Excel (.xlsx)</span>
            </button>

            {/* Imprimer PDF */}
            <button
              type="button"
              onClick={handlePrintPdf}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-black shadow-md transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer Manifeste (PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tableau Nominatif des Voyageurs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredPassengers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs">
            Aucun voyageur inscrit ne correspond à ces critères.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 text-center">Pointage</th>
                  <th className="px-4 py-3.5 text-start">Passager (Nom CIN)</th>
                  <th className="px-4 py-3.5 text-center">N° CIN / Passeport</th>
                  <th className="px-4 py-3.5 text-start">Téléphone</th>
                  <th className="px-4 py-3.5 text-start">Circuit & Date</th>
                  <th className="px-4 py-3.5 text-start">Ramassage</th>
                  <th className="px-4 py-3.5 text-start">Réf. Dossier</th>
                  <th className="px-4 py-3.5 text-center">Paiement</th>
                  <th className="px-4 py-3.5 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredPassengers.map((p, idx) => {
                  const isValidCin = isValidCinFormat(p.cinPassport);
                  const isToggling = togglingId === p.id;
                  const cleanPhone = p.phone.replace(/[^0-9]/g, "");
                  const waUrl = cleanPhone
                    ? `https://wa.me/${cleanPhone.startsWith("0") ? "212" + cleanPhone.slice(1) : cleanPhone}`
                    : null;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                        p.isCheckedIn ? "bg-emerald-50/30 dark:bg-emerald-950/15" : ""
                      }`}
                    >
                      {/* Switch Pointage Présence à Bord */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleCheckIn(p.id)}
                          disabled={isToggling}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition shadow-xs ${
                            p.isCheckedIn
                              ? "bg-emerald-500 text-white hover:bg-emerald-600"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                          }`}
                          title="Cliquer pour pointer la présence à bord"
                        >
                          {isToggling ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : p.isCheckedIn ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>À bord</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>Attente</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Nom du passager */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400 text-[10px]">#{idx + 1}</span>
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-white">
                              {p.fullName}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              {p.category === "ENFANT" ? "Enfant (-12 ans)" : "Adulte"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* CIN avec badge de validité */}
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono font-bold text-xs text-slate-900 dark:text-white">
                          <span>{p.cinPassport}</span>
                          {isValidCin ? (
                            <span title="Format CIN/Passeport Conforme">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            </span>
                          ) : (
                            <span title="Format CIN à vérifier">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Téléphone */}
                      <td className="px-4 py-3 font-mono">
                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{p.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Circuit & Date */}
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {p.tripTitle}
                        </p>
                        {p.departureDate && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-cyan-500 shrink-0" />
                            <span>{p.departureDate}</span>
                          </p>
                        )}
                      </td>

                      {/* Ville de Ramassage */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          <MapPin className="w-3 h-3 text-amber-500" />
                          {p.pickupCity || "Casablanca"}
                        </span>
                      </td>

                      {/* Réf Dossier */}
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                          {p.bookingReference}
                        </span>
                      </td>

                      {/* Statut Paiement */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.paymentStatus === "PAYE_INTEGRALEMENT"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : p.paymentStatus === "ACOMPTE_VERSE"
                              ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {p.paymentStatus === "PAYE_INTEGRALEMENT"
                            ? "Soldé"
                            : p.paymentStatus === "ACOMPTE_VERSE"
                            ? "Acompte"
                            : "En attente"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition"
                              title="Contacter sur WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => onEditPassenger(p)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-cyan-500 hover:text-slate-950 transition"
                            title="Modifier les informations (Édition rapide)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
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
