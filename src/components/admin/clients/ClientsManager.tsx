"use client";

import React, { useState, useEffect } from "react";
import { Users, UserCheck } from "lucide-react";
import { ClientsCrmTable } from "./ClientsCrmTable";
import { ClientDetailsDrawer, ClientDetailedData } from "./ClientDetailsDrawer";
import { PassengersRegistryTable, PassengerRegistryItem } from "./PassengersRegistryTable";
import { EditPassengerModal } from "./EditPassengerModal";
import { EditClientModal } from "./EditClientModal";
import { BlockUserModal } from "./BlockUserModal";
import { DeleteClientModal } from "./DeleteClientModal";

interface ClientsManagerProps {
  clients: ClientDetailedData[];
  passengers: PassengerRegistryItem[];
  allTrips: Array<{ id: string; titleFr: string; titleAr: string }>;
  pickupPoints: Array<{ id: string; cityName: string }>;
  locale?: string;
}

export function ClientsManager({
  clients: initialClients,
  passengers: initialPassengers,
  allTrips,
  pickupPoints,
  locale = "fr",
}: ClientsManagerProps) {
  const isAr = locale === "ar";
  const [activeTab, setActiveTab] = useState<"crm" | "registry">("crm");
  const [clientsList, setClientsList] = useState<ClientDetailedData[]>(initialClients);
  const [passengersList, setPassengersList] = useState<PassengerRegistryItem[]>(initialPassengers);

  // Sélections pour le Drawer et les Modales
  const [selectedClient, setSelectedClient] = useState<ClientDetailedData | null>(null);
  const [editingClient, setEditingClient] = useState<ClientDetailedData | null>(null);
  const [blockingClient, setBlockingClient] = useState<ClientDetailedData | null>(null);
  const [deletingClient, setDeletingClient] = useState<ClientDetailedData | null>(null);
  const [editingPassenger, setEditingPassenger] = useState<PassengerRegistryItem | null>(null);

  // Synchronisation si initialClients change
  useEffect(() => {
    setClientsList(initialClients);
  }, [initialClients]);

  // Handlers pour Client
  const handleClientUpdated = (updated: any) => {
    setClientsList((prev) =>
      prev.map((c) =>
        c.id === updated.id
          ? {
              ...c,
              fullName: updated.fullName,
              email: updated.email,
              phone: updated.phone || "—",
              cinOrPassport: updated.cinOrPassport || null,
              city: updated.city || "Casablanca",
              role: updated.role || c.role,
              isBlocked: updated.isBlocked ?? c.isBlocked,
              blockedReason: updated.blockedReason ?? c.blockedReason,
            }
          : c
      )
    );

    if (selectedClient && selectedClient.id === updated.id) {
      setSelectedClient((prev) =>
        prev
          ? {
              ...prev,
              fullName: updated.fullName,
              email: updated.email,
              phone: updated.phone || "—",
              cinOrPassport: updated.cinOrPassport || null,
              city: updated.city || "Casablanca",
              role: updated.role || prev.role,
              isBlocked: updated.isBlocked ?? prev.isBlocked,
              blockedReason: updated.blockedReason ?? prev.blockedReason,
            }
          : null
      );
    }
  };

  const handleBlockToggled = (result: { isBlocked: boolean; blockedReason?: string | null }) => {
    if (!blockingClient) return;
    const clientId = blockingClient.id;

    setClientsList((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              isBlocked: result.isBlocked,
              blockedReason: result.blockedReason,
            }
          : c
      )
    );

    if (selectedClient && selectedClient.id === clientId) {
      setSelectedClient((prev) =>
        prev
          ? {
              ...prev,
              isBlocked: result.isBlocked,
              blockedReason: result.blockedReason,
            }
          : null
      );
    }
  };

  const handleClientDeleted = (deletedId: string) => {
    setClientsList((prev) => prev.filter((c) => c.id !== deletedId));
    if (selectedClient && selectedClient.id === deletedId) {
      setSelectedClient(null);
    }
  };

  // Mise à jour locale après édition rapide d'un passager
  const handlePassengerUpdated = (updated: any) => {
    setPassengersList((prev) =>
      prev.map((p) =>
        p.id === updated.id
          ? {
              ...p,
              fullName: updated.fullName,
              cinPassport: updated.cinPassport,
              phone: updated.phone || p.phone,
              pickupCity: updated.pickupCity || p.pickupCity,
              roomType: updated.roomType || p.roomType,
              category: updated.category || p.category,
            }
          : p
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Sélecteur de Vue à 2 Onglets */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-2">
        {/* Onglet 1 : Comptes Clients (CRM & Fidélité) */}
        <button
          type="button"
          onClick={() => setActiveTab("crm")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-xs font-black transition-all ${
            activeTab === "crm"
              ? "bg-cyan-500 text-slate-950 shadow-md scale-[1.01]"
              : "bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{isAr ? "حسابات العملاء (CRM والولاء)" : "1. Comptes Clients (CRM & Fidélité)"}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "crm"
                ? "bg-slate-950/20 text-slate-950"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}
          >
            {clientsList.length}
          </span>
        </button>

        {/* Onglet 2 : Tous les Voyageurs Inscrits (Registre Passagers) */}
        <button
          type="button"
          onClick={() => setActiveTab("registry")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-xs font-black transition-all ${
            activeTab === "registry"
              ? "bg-cyan-500 text-slate-950 shadow-md scale-[1.01]"
              : "bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>{isAr ? "سجل جميع المسافرين (المركبة TIST)" : "2. Tous les Voyageurs Inscrits (Registre Passagers)"}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "registry"
                ? "bg-slate-950/20 text-slate-950"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}
          >
            {passengersList.length}
          </span>
        </button>
      </div>

      {/* Contenu de l'Onglet Actif */}
      {activeTab === "crm" ? (
        <ClientsCrmTable
          clients={clientsList}
          onSelectClient={(c) => setSelectedClient(c)}
          onEditClient={(c) => setEditingClient(c)}
          onToggleBlock={(c) => setBlockingClient(c)}
          onDeleteClient={(c) => setDeletingClient(c)}
          locale={locale}
        />
      ) : (
        <PassengersRegistryTable
          passengers={passengersList}
          allTrips={allTrips}
          pickupPoints={pickupPoints}
          onEditPassenger={(p) => setEditingPassenger(p)}
          locale={locale}
        />
      )}

      {/* Drawer Fiche Détails Client */}
      <ClientDetailsDrawer
        isOpen={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        client={selectedClient}
        onEditClient={(c) => setEditingClient(c)}
        onToggleBlock={(c) => setBlockingClient(c)}
        onDeleteClient={(c) => setDeletingClient(c)}
        locale={locale}
      />

      {/* Modale d'Édition Rapide Voyageur */}
      <EditPassengerModal
        isOpen={!!editingPassenger}
        onClose={() => setEditingPassenger(null)}
        passenger={editingPassenger}
        onSuccess={handlePassengerUpdated}
      />

      {/* Modale de Modification Client */}
      <EditClientModal
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        client={editingClient}
        onSuccess={handleClientUpdated}
        locale={locale}
      />

      {/* Modale de Blocage / Déblocage Client */}
      <BlockUserModal
        isOpen={!!blockingClient}
        onClose={() => setBlockingClient(null)}
        client={blockingClient}
        onSuccess={handleBlockToggled}
        locale={locale}
      />

      {/* Modale de Suppression Client */}
      <DeleteClientModal
        isOpen={!!deletingClient}
        onClose={() => setDeletingClient(null)}
        client={deletingClient}
        onSuccess={handleClientDeleted}
        locale={locale}
      />
    </div>
  );
}
