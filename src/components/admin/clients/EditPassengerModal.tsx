"use client";

import React, { useState, useEffect } from "react";
import { X, UserCheck, Shield, Phone, MapPin, Bed, Loader2 } from "lucide-react";
import { updatePassengerAction } from "@/actions/client.actions";

interface EditPassengerModalProps {
  isOpen: boolean;
  onClose: () => void;
  passenger: {
    id: string;
    fullName: string;
    cinPassport: string;
    phone: string;
    pickupCity?: string;
    roomType?: string;
    category?: string;
  } | null;
  onSuccess: (updated: any) => void;
}

export function EditPassengerModal({
  isOpen,
  onClose,
  passenger,
  onSuccess,
}: EditPassengerModalProps) {
  const [fullName, setFullName] = useState("");
  const [cinPassport, setCinPassport] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupCity, setPickupCity] = useState("Casablanca");
  const [roomType, setRoomType] = useState("DOUBLE_TWIN");
  const [category, setCategory] = useState("ADULTE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (passenger) {
      setFullName(passenger.fullName || "");
      setCinPassport(passenger.cinPassport || "");
      setPhone(passenger.phone || "");
      setPickupCity(passenger.pickupCity || "Casablanca");
      setRoomType(passenger.roomType || "DOUBLE_TWIN");
      setCategory(passenger.category || "ADULTE");
      setError(null);
    }
  }, [passenger]);

  if (!isOpen || !passenger) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Le nom complet est obligatoire.");
      return;
    }
    if (!cinPassport.trim()) {
      setError("Le numéro de CIN ou Passeport est obligatoire.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updatePassengerAction(passenger.id, {
        fullName: fullName.trim(),
        cinPassport: cinPassport.trim().toUpperCase(),
        phone: phone.trim() || undefined,
        pickupCity: pickupCity.trim(),
        roomType: roomType.trim(),
        category,
      });

      if (res.success && res.passenger) {
        onSuccess(res.passenger);
        onClose();
      } else {
        setError(res.error || "Une erreur est survenue.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur de connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Édition Rapide du Voyageur
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rectification nominative conforme CIN avant édition de feuille de route.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Nom & Prénom (Conforme CIN) *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: Amine Bennani"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                N° CIN ou Passeport *
              </label>
              <input
                type="text"
                value={cinPassport}
                onChange={(e) => setCinPassport(e.target.value.toUpperCase())}
                placeholder="Ex: BK654321"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Téléphone Direct
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 0661234567"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                Ville de Ramassage
              </label>
              <select
                value={pickupCity}
                onChange={(e) => setPickupCity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="Casablanca">Casablanca (Casa-Voyageurs)</option>
                <option value="Rabat">Rabat (Rabat-Ville / Agdal)</option>
                <option value="Fès">Fès (Gare Ferroviaire)</option>
                <option value="Kénitra">Kénitra</option>
                <option value="Tanger">Tanger</option>
                <option value="Marrakech">Marrakech</option>
                <option value="Meknès">Meknès</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Bed className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                Type de Chambre
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="DOUBLE_TWIN">Double Twin (2 lits séparés)</option>
                <option value="DOUBLE_MATRIMONIAL">Double Matrimoniale (Grand lit)</option>
                <option value="TRIPLE">Triple (3 personnes)</option>
                <option value="SINGLE">Individuelle (Single)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Catégorie Voyageur
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value="ADULTE"
                  checked={category === "ADULTE"}
                  onChange={() => setCategory("ADULTE")}
                  className="text-cyan-600 focus:ring-cyan-500"
                />
                Adulte
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value="ENFANT"
                  checked={category === "ENFANT"}
                  onChange={() => setCategory("ENFANT")}
                  className="text-cyan-600 focus:ring-cyan-500"
                />
                Enfant (-12 ans)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-xs font-black shadow-md flex items-center gap-2 transition disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Enregistrer les Modifications</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
