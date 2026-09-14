"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { 
  FileText, Download, CheckCircle2, Clock, 
  Bus, Shield, Filter, Search, Printer, UploadCloud, Users, Camera 
} from "lucide-react";
import { ManifestPassengerRow, ManifestTransportInfo } from "@/types";
import { generateOfficialManifestHtml } from "@/lib/pdf-generator";
import { ExcelExportButton } from "./excel/ExcelExportButtons";
import { PassengerImportModal } from "./excel/PassengerImportModal";

interface PassengerManifestTableProps {
  departureInfo: ManifestTransportInfo;
  passengersList: ManifestPassengerRow[];
}

export function PassengerManifestTable({
  departureInfo,
  passengersList,
}: PassengerManifestTableProps) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [passengers, setPassengers] = useState<ManifestPassengerRow[]>(passengersList);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPickup, setFilterPickup] = useState<string>("ALL");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const toggleCheckIn = (passengerId: string) => {
    setPassengers((prev) =>
      prev.map((p) =>
        p.id === passengerId ? { ...p, isCheckedIn: !p.isCheckedIn } : p
      )
    );
  };

  const handlePrintPdf = () => {
    const htmlContent = generateOfficialManifestHtml(departureInfo, passengers);
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

  const filteredPassengers = passengers.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.cinOrPassport.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery);

    const matchesPickup = filterPickup === "ALL" || p.pickupLocation.includes(filterPickup);

    return matchesSearch && matchesPickup;
  });

  const checkedCount = passengers.filter((p) => p.isCheckedIn).length;
  const uniquePickups = Array.from(new Set(passengers.map((p) => p.pickupLocation)));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* En-tête Logistique & Transporteur Agréé TIST */}
      <div className="p-6 md:p-8 bg-white dark:bg-slate-900 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-xs font-black uppercase tracking-widest">
            <Shield className="w-4 h-4" />
            {t("tistHeader")}
          </div>
          <h2 className="text-slate-900 dark:text-white font-bold text-lg sm:text-2xl mt-1">{departureInfo.tripTitle}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Départ le <strong className="text-slate-700 dark:text-slate-200">{departureInfo.departureDate}</strong> • Véhicule :{" "}
            <span className="font-mono text-slate-900 dark:text-white font-bold">{departureInfo.plateNumber}</span>{" "}
            (Agrément : {departureInfo.tistNumber})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 text-center flex-1 sm:flex-initial shadow-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">Présence à bord</span>
            <p className="text-xl font-black text-cyan-600 dark:text-cyan-400">
              {checkedCount} / {passengers.length} {t("passengersBoarded")}
            </p>
          </div>

          {/* Bouton Scanner Caméra Live */}
          {departureInfo.tripId && (
            <Link
              href={`/${locale}/admin/scanner?tripId=${departureInfo.tripId}`}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2.5 rounded-2xl text-xs shadow-md transition-all flex-1 sm:flex-initial active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Scanner Live</span>
            </Link>
          )}

          {/* Bouton Export Excel */}
          {departureInfo.tripId && (
            <ExcelExportButton
              type="MANIFEST"
              tripId={departureInfo.tripId}
              variant="secondary"
            />
          )}

          {/* Bouton Import Excel */}
          {departureInfo.tripId && (
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-xs active:scale-95"
            >
              <UploadCloud className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Importer (.xlsx)</span>
            </button>
          )}

          {/* Bouton Impression PDF Gendarmerie */}
          <button
            type="button"
            onClick={handlePrintPdf}
            className="flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold px-4 py-2.5 rounded-2xl text-xs shadow-md transition-all flex-1 sm:flex-initial active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>{t("downloadPdf")}</span>
          </button>
        </div>
      </div>

      {/* Modal d'import de passagers */}
      {departureInfo.tripId && (
        <PassengerImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          tripId={departureInfo.tripId}
          tripTitle={departureInfo.tripTitle}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}

      {/* Détails du chauffeur et de la société */}
      <div className="bg-slate-50 dark:bg-slate-950/60 p-4 border-b border-slate-200 dark:border-slate-800 text-xs flex flex-wrap gap-x-8 gap-y-2 text-slate-700 dark:text-slate-300">
        <div>
          <span className="font-bold text-slate-900 dark:text-white">Transporteur :</span>{" "}
          {departureInfo.transporterName ? (
            <span>{departureInfo.transporterName}</span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              Non assigné —{" "}
              {departureInfo.tripId && (
                <a
                  href={`/${locale}/admin/trips/${departureInfo.tripId}/partenaires`}
                  className="underline hover:text-amber-500"
                >
                  Assigner un transporteur
                </a>
              )}
            </span>
          )}
        </div>
        <div>
          <span className="font-bold text-slate-900 dark:text-white">Chauffeur agréé :</span>{" "}
          {departureInfo.driverName ? (
            <span>{departureInfo.driverName} {departureInfo.driverPhone ? `(${departureInfo.driverPhone})` : ""}</span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              Non assigné —{" "}
              {departureInfo.tripId && (
                <a
                  href={`/${locale}/admin/trips/${departureInfo.tripId}/equipe`}
                  className="underline hover:text-amber-500"
                >
                  Assigner un chauffeur
                </a>
              )}
            </span>
          )}
        </div>
        <div>
          <span className="font-bold text-slate-900 dark:text-white">Immatriculation :</span>{" "}
          <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
            {departureInfo.plateNumber || "En attente"}
          </span>
        </div>
        {departureInfo.driverCard && (
          <div>
            <span className="font-bold text-slate-900 dark:text-white">Permis / Carte Pro :</span>{" "}
            <span>{departureInfo.driverCard}</span>
          </div>
        )}
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center bg-white dark:bg-slate-900">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher nom, CIN ou tél..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-9 pe-4 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={filterPickup}
            onChange={(e) => setFilterPickup(e.target.value)}
            className="text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">Tous les points de ramassage</option>
            {uniquePickups.map((loc, idx) => (
              <option key={idx} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau Nominatif Réglementaire */}
      <div className="overflow-x-auto">
        <table className="w-full text-start text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-[11px] uppercase font-bold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-4">{t("status")}</th>
              <th className="p-4">{t("name")}</th>
              <th className="p-4">{t("cinNumber")}</th>
              <th className="p-4">{t("nationality")}</th>
              <th className="p-4">{t("pickup")}</th>
              <th className="p-4">{t("room")}</th>
              <th className="p-4">{t("payment")}</th>
              <th className="p-4 text-center">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {filteredPassengers.map((p, idx) => (
              <tr
                key={p.id}
                className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                  p.isCheckedIn ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""
                }`}
              >
                <td className="p-4 font-semibold text-slate-500 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono">#{idx + 1}</span>
                    {p.isCheckedIn ? (
                      <span className="inline-flex items-center text-xs text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 me-1" /> {t("boarded")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs text-amber-700 dark:text-amber-400 font-medium bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
                        <Clock className="w-3.5 h-3.5 me-1" /> {t("waiting")}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4 font-extrabold text-slate-900 dark:text-white">
                  {p.fullName}
                  <span className="block text-xs font-normal text-slate-500 mt-0.5">
                    {p.phone}
                  </span>
                </td>
                <td className="p-4 font-mono font-bold text-slate-900 dark:text-white text-xs">
                  {p.cinOrPassport}
                </td>
                <td className="p-4 text-xs">{p.nationality}</td>
                <td className="p-4 text-xs font-medium">{p.pickupLocation}</td>
                <td className="p-4 text-xs">{p.roomType}</td>
                <td className="p-4">
                  {p.paymentStatus === "FULLY_PAID" ? (
                    <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-1 rounded-lg">
                      Payé 100%
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-bold px-2 py-1 rounded-lg">
                      Solde : {p.remainingBalance} DH
                    </span>
                  )}
                </td>
                <td className="p-4 text-center">
                  <button
                    type="button"
                    onClick={() => toggleCheckIn(p.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                      p.isCheckedIn
                        ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {p.isCheckedIn ? t("cancelAction") : t("boardAction")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
