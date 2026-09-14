"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, Download, MessageSquare, Eye, 
  Users, MapPin, Calendar, ArrowUpDown, Loader2,
  Edit2, Ban, ShieldCheck, Trash2, CheckCircle2, ShieldAlert
} from "lucide-react";
import { formatMAD } from "@/lib/utils";
import { exportClientsExcelAction } from "@/actions/client.actions";
import { ClientDetailedData } from "./ClientDetailsDrawer";

interface ClientsCrmTableProps {
  clients: ClientDetailedData[];
  onSelectClient: (client: ClientDetailedData) => void;
  onEditClient?: (client: ClientDetailedData) => void;
  onToggleBlock?: (client: ClientDetailedData) => void;
  onDeleteClient?: (client: ClientDetailedData) => void;
  locale?: string;
}

export function ClientsCrmTable({
  clients,
  onSelectClient,
  onEditClient,
  onToggleBlock,
  onDeleteClient,
  locale = "fr",
}: ClientsCrmTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [volumeFilter, setVolumeFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"name" | "spend" | "bookings" | "date">("spend");
  const [isExporting, setIsExporting] = useState(false);

  // Filtrage et recherche
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.city.toLowerCase().includes(q);

      const bookingsCount = c.bookings.filter((b) => b.status !== "ANNULEE").length;
      let matchesVolume = true;
      if (volumeFilter === "REPEAT_3") matchesVolume = bookingsCount >= 3;
      else if (volumeFilter === "ACTIVE_1") matchesVolume = bookingsCount >= 1;
      else if (volumeFilter === "NEW_0") matchesVolume = bookingsCount === 0;

      return matchesSearch && matchesVolume;
    });
  }, [clients, searchQuery, volumeFilter]);

  // Tri des clients
  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) => {
      if (sortBy === "spend") {
        const spendA = a.bookings.reduce((sum, b) => sum + b.amountPaid, 0);
        const spendB = b.bookings.reduce((sum, b) => sum + b.amountPaid, 0);
        return spendB - spendA;
      }
      if (sortBy === "bookings") {
        return b.bookings.length - a.bookings.length;
      }
      if (sortBy === "name") {
        return a.fullName.localeCompare(b.fullName);
      }
      return 0;
    });
  }, [filteredClients, sortBy]);

  // Gestion de l'export Excel
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const res = await exportClientsExcelAction();
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
        link.download = res.filename || "clients_crm.xlsx";
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

  return (
    <div className="space-y-4">
      {/* Barre d'Outils et Filtres */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Recherche */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3" />
            <input
              type="text"
              placeholder="Rechercher nom, email, tél, ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-10 pe-4 py-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            />
          </div>

          {/* Filtre Volume */}
          <select
            value={volumeFilter}
            onChange={(e) => setVolumeFilter(e.target.value)}
            className="w-full sm:w-auto text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">Tous les volumes</option>
            <option value="REPEAT_3">Clients Fidèles (3+ voyages)</option>
            <option value="ACTIVE_1">Clients Actifs (1+ voyage)</option>
            <option value="NEW_0">Nouveaux Inscrits (0 voyage)</option>
          </select>

          {/* Sélecteur Tri */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full sm:w-auto text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="spend">Trier par Total Dépensé (MAD)</option>
            <option value="bookings">Trier par Nb de Voyages</option>
            <option value="name">Trier par Nom (A-Z)</option>
          </select>
        </div>

        {/* Bouton Export Excel */}
        <button
          type="button"
          onClick={handleExportExcel}
          disabled={isExporting}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs active:scale-95 disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          )}
          <span>Exporter Base Clients (.xlsx)</span>
        </button>
      </div>

      {/* Tableau des Comptes Clients */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <Users className="w-4 h-4 text-cyan-500" />
            <span>Répertoire des Clients Inscrits ({sortedClients.length})</span>
          </div>
          <span>Trié par {sortBy === "spend" ? "dépenses" : sortBy === "bookings" ? "voyages" : "nom"}</span>
        </div>

        {sortedClients.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs">
            Aucun compte client ne correspond à votre recherche.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 text-start">Client / Acheteur</th>
                  <th className="px-5 py-3.5 text-center">Statut Accès</th>
                  <th className="px-5 py-3.5 text-start">Contact WhatsApp</th>
                  <th className="px-5 py-3.5 text-start">Ville</th>
                  <th className="px-5 py-3.5 text-center">Voyages</th>
                  <th className="px-5 py-3.5 text-end">Total Dépensé</th>
                  <th className="px-5 py-3.5 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {sortedClients.map((client) => {
                  const validBookings = client.bookings.filter((b) => b.status !== "ANNULEE");
                  const totalSpent = validBookings.reduce((sum, b) => sum + b.amountPaid, 0);

                  const cleanPhone = client.phone.replace(/[^0-9]/g, "");
                  const waUrl = cleanPhone
                    ? `https://wa.me/${cleanPhone.startsWith("0") ? "212" + cleanPhone.slice(1) : cleanPhone}`
                    : null;

                  return (
                    <tr
                      key={client.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                        client.isBlocked ? "bg-rose-50/20 dark:bg-rose-950/10" : ""
                      }`}
                    >
                      {/* Avatar & Nom */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {client.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-extrabold text-slate-900 dark:text-white">
                                {client.fullName}
                              </p>
                              {client.cinOrPassport && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  {client.cinOrPassport}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              {client.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Statut Accès (Actif vs Suspendu) */}
                      <td className="px-5 py-4 text-center">
                        {client.isBlocked ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 cursor-help"
                            title={client.blockedReason || "Compte suspendu par l'administration"}
                          >
                            <Ban className="w-3 h-3 text-rose-600" />
                            <span>Suspendu</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Actif</span>
                          </span>
                        )}
                      </td>

                      {/* WhatsApp Phone */}
                      <td className="px-5 py-4 font-mono font-medium">
                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{client.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Ville */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <MapPin className="w-3 h-3 text-cyan-500" />
                          {client.city}
                        </span>
                      </td>

                      {/* Nb de Voyages */}
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-pill text-[10px] font-bold ${
                            validBookings.length >= 3
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                              : validBookings.length >= 1
                              ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          }`}
                        >
                          {validBookings.length} {validBookings.length > 1 ? "voyages" : "voyage"}
                        </span>
                      </td>

                      {/* Total Dépensé (MAD) */}
                      <td className="px-5 py-4 text-end font-mono">
                        <p className="font-black text-slate-900 dark:text-white">
                          {formatMAD(totalSpent, locale)}
                        </p>
                      </td>

                      {/* Actions Administrateur */}
                      <td className="px-5 py-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Fiche Dossier */}
                          <button
                            type="button"
                            onClick={() => onSelectClient(client)}
                            className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 font-bold text-xs transition active:scale-95 shadow-xs"
                            title="Voir la fiche dossier complète"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Modifier Coordonnées */}
                          {onEditClient && (
                            <button
                              type="button"
                              onClick={() => onEditClient(client)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition active:scale-95 shadow-xs"
                              title="Modifier les informations du compte"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Bloquer / Débloquer */}
                          {onToggleBlock && (
                            <button
                              type="button"
                              onClick={() => onToggleBlock(client)}
                              className={`p-2 rounded-xl transition active:scale-95 shadow-xs ${
                                client.isBlocked
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60"
                              }`}
                              title={client.isBlocked ? "Débloquer l'accès" : "Suspendre l'accès"}
                            >
                              {client.isBlocked ? (
                                <ShieldCheck className="w-3.5 h-3.5" />
                              ) : (
                                <Ban className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* Supprimer Client */}
                          {onDeleteClient && (
                            <button
                              type="button"
                              onClick={() => onDeleteClient(client)}
                              className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition active:scale-95 shadow-xs"
                              title="Supprimer définitivement le compte client"
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
