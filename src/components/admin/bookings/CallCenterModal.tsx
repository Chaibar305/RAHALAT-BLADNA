"use client";

import React, { useState, useEffect } from "react";
import {
  X, Phone, MessageSquare, Calendar, Clock, CheckCircle2,
  AlertTriangle, UserCheck, ShieldCheck, MapPin, BedDouble,
  Copy, Check, ExternalLink, Send, ArrowRight, Sparkles, Loader2, RotateCcw
} from "lucide-react";
import { formatMAD } from "@/lib/utils";
import { BookingAdminItem } from "./ReceiptVerificationModal";
import { updateCallStatusAction } from "@/actions/call-center.actions";
import { 
  CALL_CENTER_TEMPLATES, 
  generateWhatsAppLink, 
  cleanMoroccanPhone 
} from "@/lib/callCenterWhatsApp";

interface TeamMemberOption {
  id: string;
  fullName: string;
  role: string;
}

interface CallCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingAdminItem | null;
  teamMembers?: TeamMemberOption[];
  onSuccess: (updatedBooking?: any) => void;
  locale?: string;
}

export const CALL_STATUS_CONFIG = {
  PENDING_CALL: {
    label: "À Contacter (Nouveau)",
    labelAr: "في انتظار الاتصال",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    badgeColor: "bg-amber-500 text-slate-950",
    icon: Phone,
    description: "Nouveau lead web / pub à appeler en priorité",
  },
  NO_ANSWER_1: {
    label: "Ne répond pas (T1)",
    labelAr: "لا يجيب (محاولة 1)",
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
    badgeColor: "bg-orange-500 text-white",
    icon: RotateCcw,
    description: "1ère tentative sans réponse - Envoyer relance WhatsApp",
  },
  NO_ANSWER_2: {
    label: "Ne répond pas (T2)",
    labelAr: "لا يجيب (محاولة 2)",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
    badgeColor: "bg-rose-600 text-white",
    icon: RotateCcw,
    description: "2ème tentative sans réponse - Dernière relance",
  },
  CALLBACK_SCHEDULED: {
    label: "À Rappeler (Programmé)",
    labelAr: "إعادة الاتصال لاحقاً",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    badgeColor: "bg-blue-600 text-white",
    icon: Clock,
    description: "Le client a convenu d'un créneau précis pour le rappel",
  },
  CONFIRMED_PHONE: {
    label: "Accord Verbal (Attente Acompte)",
    labelAr: "موافق شفهياً (في انتظار التسبيق)",
    color: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
    badgeColor: "bg-teal-600 text-white",
    icon: CheckCircle2,
    description: "Le client confirme et attend le RIB pour verser l'acompte",
  },
  DEPOSIT_RECEIVED: {
    label: "Acompte Reçu & Validé",
    labelAr: "تم استلام التسبيق",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    badgeColor: "bg-emerald-600 text-white",
    icon: ShieldCheck,
    description: "Acompte encaissé - Sièges et billet garantis",
  },
  CANCELLED_REFUSED: {
    label: "Refusé / Pas Intéressé",
    labelAr: "ملغى / غير مهتم",
    color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30",
    badgeColor: "bg-slate-600 text-white",
    icon: X,
    description: "Désistement, dates incompatibles ou refus",
  },
  WRONG_NUMBER: {
    label: "Faux Numéro / Injoignable",
    labelAr: "رقم خاطئ",
    color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
    badgeColor: "bg-red-700 text-white",
    icon: X,
    description: "Numéro non attribué ou faux lead",
  },
};

export function CallCenterModal({
  isOpen,
  onClose,
  booking,
  teamMembers = [],
  onSuccess,
  locale = "fr",
}: CallCenterModalProps) {
  const isAr = locale === "ar";
  const [callStatus, setCallStatus] = useState<string>("PENDING_CALL");
  const [callNotes, setCallNotes] = useState<string>("");
  const [pickupCity, setPickupCity] = useState<string>("Casablanca");
  const [pickupPoint, setPickupPoint] = useState<string>("");
  const [roomPreference, setRoomPreference] = useState<string>("DOUBLE_TWIN");
  const [nextCallbackDate, setNextCallbackDate] = useState<string>("");
  const [confirmedByMemberId, setConfirmedByMemberId] = useState<string>("");
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<keyof typeof CALL_CENTER_TEMPLATES>("NO_ANSWER_RELANCE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [activeTab, setActiveTab] = useState<"CALL_FORM" | "WHATSAPP_SCRIPTS" | "SCRIPT_GUIDE">("CALL_FORM");

  useEffect(() => {
    if (booking) {
      setCallStatus(booking.callStatus || "PENDING_CALL");
      setCallNotes(booking.callNotes || "");
      setPickupCity(booking.pickupCity || booking.travelers[0]?.pickupCity || "Casablanca");
      setPickupPoint(booking.pickupPoint || "");
      setRoomPreference(booking.roomPreference || booking.travelers[0]?.roomType || "DOUBLE_TWIN");
      setNextCallbackDate(
        booking.nextCallbackDate ? new Date(booking.nextCallbackDate).toISOString().slice(0, 16) : ""
      );
      setConfirmedByMemberId(booking.confirmedByMemberId || "");
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  // Génération des paramètres pour WhatsApp
  const templateParams = {
    clientName: booking.clientName,
    clientPhone: booking.clientPhone,
    reference: booking.reference,
    tripTitle: booking.tripTitle,
    departureDate: booking.departureDate,
    depositAmount: booking.depositAmount,
    totalAmount: booking.totalAmount,
    passengersCount: booking.passengersCount,
    pickupCity: pickupCity || booking.clientCity,
    pickupPoint: pickupPoint || undefined,
  };

  const currentGeneratedMessage = CALL_CENTER_TEMPLATES[selectedTemplateKey](templateParams);
  const waDirectUrl = generateWhatsAppLink(booking.clientPhone, currentGeneratedMessage);
  const cleanPhone = cleanMoroccanPhone(booking.clientPhone);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(currentGeneratedMessage);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleQuickStatusClick = (statusKey: string) => {
    setCallStatus(statusKey);
    // Si statut = CALLBACK_SCHEDULED et date vide, proposer +2 heures
    if (statusKey === "CALLBACK_SCHEDULED" && !nextCallbackDate) {
      const later = new Date();
      later.setHours(later.getHours() + 2);
      setNextCallbackDate(later.toISOString().slice(0, 16));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await updateCallStatusAction(booking.id, {
        callStatus,
        callNotes,
        nextCallbackDate: callStatus === "CALLBACK_SCHEDULED" && nextCallbackDate ? nextCallbackDate : null,
        pickupCity,
        pickupPoint,
        roomPreference,
        confirmedByMemberId: confirmedByMemberId || null,
        incrementAttempts: callStatus === "NO_ANSWER_1" || callStatus === "NO_ANSWER_2",
      });

      if (res.success) {
        onSuccess(res.booking);
        onClose();
      } else {
        alert(res.error || "Erreur lors de la mise à jour");
      }
    } catch (err: any) {
      alert("Erreur de connexion : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 transition-all flex flex-col max-h-[92vh]">
        
        {/* Top Header : Prospect & Actions Rapides d'Appel */}
        <div className="bg-gradient-to-r from-slate-900 via-brand-teal-dark to-slate-900 p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-teal/30 shrink-0">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold text-xs border border-cyan-500/30">
                {booking.reference}
              </span>
              {booking.source && (
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-brand-gold text-[10px] font-black uppercase tracking-wider">
                  🎯 {booking.source}
                </span>
              )}
              <span className="text-xs text-brand-sand/70">
                • {booking.tripTitle} ({booking.departureDate})
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {booking.clientName}
              </h2>
              <span className="text-xs text-slate-300 font-bold bg-white/10 px-2.5 py-1 rounded-xl">
                {booking.passengersCount} voyageur(s)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-brand-sand/80">
              <span className="flex items-center gap-1 font-mono font-bold text-brand-gold">
                📞 {booking.clientPhone}
              </span>
              <span>•</span>
              <span>Total : <strong>{formatMAD(booking.totalAmount, locale)}</strong></span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">Acompte exigé : {formatMAD(booking.depositAmount, locale)}</span>
            </div>
          </div>

          {/* Boutons d'Action Téléphonique Directe */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`tel:+${cleanPhone}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
            >
              <Phone className="w-4 h-4" />
              <span>Appeler Direct</span>
            </a>

            <a
              href={waDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-green-700 hover:bg-green-600 text-white font-black text-xs shadow-lg shadow-green-700/30 transition-all active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation par Onglets Internes */}
        <div className="bg-slate-100 dark:bg-slate-800/60 px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("CALL_FORM")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "CALL_FORM"
                ? "bg-white dark:bg-slate-900 text-brand-teal dark:text-cyan-400 shadow-sm font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Fiche de Traitement d&apos;Appel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("WHATSAPP_SCRIPTS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "WHATSAPP_SCRIPTS"
                ? "bg-white dark:bg-slate-900 text-brand-teal dark:text-cyan-400 shadow-sm font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
            <span>Templates WhatsApp (Maroc)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SCRIPT_GUIDE")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SCRIPT_GUIDE"
                ? "bg-white dark:bg-slate-900 text-brand-teal dark:text-cyan-400 shadow-sm font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
            <span>Guide &amp; Script Téléphonique</span>
          </button>
        </div>

        {/* Corps du Modal Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* VUE 1 : Formulaire de Traitement de l'Appel */}
          {activeTab === "CALL_FORM" && (
            <form id="call-center-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* 1. Qualification Rapide du Statut d'Appel */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Statut &amp; Résultat de l&apos;Appel Téléphonique</span>
                  <span className="text-[11px] text-slate-400 lowercase font-normal">
                    (Sélectionnez en 1 clic pour qualifier le prospect)
                  </span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {Object.entries(CALL_STATUS_CONFIG).map(([key, cfg]) => {
                    const isSelected = callStatus === key;
                    const Icon = cfg.icon;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleQuickStatusClick(key)}
                        className={`p-3 rounded-2xl border text-start flex flex-col justify-between gap-2 transition-all ${
                          isSelected
                            ? `${cfg.color} ring-2 ring-cyan-500 shadow-md scale-[1.02] font-black`
                            : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <Icon className="w-4 h-4 shrink-0" />
                          {isSelected && <Check className="w-4 h-4 text-cyan-600" />}
                        </div>
                        <div>
                          <p className="text-xs font-extrabold leading-tight">{cfg.label}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {cfg.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Champs Logistiques & Rappel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                
                {/* Ville de Ramassage */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-orange" />
                    <span>Ville de Ramassage convenue</span>
                  </label>
                  <select
                    value={pickupCity}
                    onChange={(e) => setPickupCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="Casablanca">Casablanca (Gare Casa-Voyageurs / Marjane Californie)</option>
                    <option value="Rabat">Rabat (Gare Rabat-Agdal / Gare Rabat-Ville)</option>
                    <option value="Kénitra">Kénitra (Gare Kénitra-Ville)</option>
                    <option value="Meknès">Meknès (Gare Meknès-Ville)</option>
                    <option value="Fès">Fès (Gare Fès-Ville)</option>
                    <option value="Tanger">Tanger (Gare Tanger-Ville / Place des Nations)</option>
                    <option value="Marrakech">Marrakech (Gare ONCF / Guéliz)</option>
                    <option value="Agadir">Agadir</option>
                  </select>
                </div>

                {/* Point de Ramassage Précis */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Point de RDV exact (Arrêt)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Devant l'Hôtel Ibis Casa-Voyageurs"
                    value={pickupPoint}
                    onChange={(e) => setPickupPoint(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* Préférence de Chambre */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <BedDouble className="w-3.5 h-3.5 text-brand-gold" />
                    <span>Type de Chambre souhaité</span>
                  </label>
                  <select
                    value={roomPreference}
                    onChange={(e) => setRoomPreference(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="DOUBLE_TWIN">Chambre Double Twin (2 lits séparés)</option>
                    <option value="DOUBLE_MATRIMONIAL">Chambre Double Grand Lit (Couples mariés)</option>
                    <option value="TRIPLE">Chambre Triple (3 lits / Amis)</option>
                    <option value="SINGLE">Chambre Individuelle Single (+ supplément)</option>
                  </select>
                </div>

                {/* Date et heure de rappel si programmé */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>Horaire du rappel convenu (si rappel programmé)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={nextCallbackDate}
                    onChange={(e) => setNextCallbackDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* 3. Notes d'Appel & Agent de Confirmation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Notes &amp; Compte-rendu de l&apos;échange téléphonique
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Le client voyage avec son frère. Ils prendront le bus à Rabat Agdal à 06h45. Promesse de virement d'acompte CIH ce soir vers 19h..."
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    className="w-full p-3 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Agent(e) Assigné(e)</span>
                  </label>
                  <select
                    value={confirmedByMemberId}
                    onChange={(e) => setConfirmedByMemberId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">-- Non assigné --</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.role})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Permet de tracer la performance de confirmation par agent.
                  </p>
                </div>
              </div>
            </form>
          )}

          {/* VUE 2 : Boîte à Outils WhatsApp (Templates Marocains) */}
          {activeTab === "WHATSAPP_SCRIPTS" && (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemplateKey("NO_ANSWER_RELANCE")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                    selectedTemplateKey === "NO_ANSWER_RELANCE"
                      ? "bg-amber-500 text-slate-950 border-amber-500 font-black shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  📵 Relance Appel Sans Réponse
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplateKey("DEPOSIT_RIB_DETAILS")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                    selectedTemplateKey === "DEPOSIT_RIB_DETAILS"
                      ? "bg-teal-600 text-white border-teal-600 font-black shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  🏦 Envoi RIB CIH / Attijari (Acompte)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplateKey("BOOKING_CONFIRMED_SUMMARY")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                    selectedTemplateKey === "BOOKING_CONFIRMED_SUMMARY"
                      ? "bg-emerald-600 text-white border-emerald-600 font-black shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  🎉 Confirmation &amp; Infos Départ
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplateKey("EXPIRING_OPTION_REMINDER")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                    selectedTemplateKey === "EXPIRING_OPTION_REMINDER"
                      ? "bg-rose-600 text-white border-rose-600 font-black shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  ⏳ Rappel Expiration d&apos;Option
                </button>
              </div>

              {/* Aperçu & Édition du Message */}
              <div className="bg-emerald-50/60 dark:bg-slate-800/80 p-5 rounded-2xl border border-emerald-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>Aperçu du Message WhatsApp Prêt à l&apos;Emploi</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-100 flex items-center gap-1.5 transition"
                    >
                      {copiedText ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copier le texte</span>
                        </>
                      )}
                    </button>

                    <a
                      href={waDirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-1.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-green-600/20 transition active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Envoyer sur WhatsApp</span>
                    </a>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-emerald-100 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-sans whitespace-pre-line leading-relaxed shadow-xs">
                  {currentGeneratedMessage}
                </div>
              </div>
            </div>
          )}

          {/* VUE 3 : Guide d'Entretien & Script d'Appel */}
          {activeTab === "SCRIPT_GUIDE" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-xs text-cyan-900 dark:text-cyan-200 space-y-3">
                <h4 className="font-black text-sm flex items-center gap-2 text-cyan-800 dark:text-cyan-300">
                  <Sparkles className="w-4 h-4 text-cyan-600" />
                  Guide d&apos;Entretien Téléphonique &amp; Argumentaire
                </h4>
                
                <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-cyan-100 dark:border-slate-800">
                    <p className="font-bold text-brand-teal dark:text-cyan-400">1. Prise de contact chaleureuse :</p>
                    <p className="italic mt-1">&quot;Salam {booking.clientName}, c&apos;est [Votre Prénom] de l&apos;agence Rahalat Bladna. Je vous appelle suite à votre demande pour le voyage {booking.tripTitle}...&quot;</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-cyan-100 dark:border-slate-800">
                    <p className="font-bold text-brand-teal dark:text-cyan-400">2. Qualification &amp; Ramassage :</p>
                    <p className="italic mt-1">&quot;Vous partez bien de Casablanca ou Rabat ? Vous préférez quel point de ramassage ? Nous avons Casa-Voyageurs à 05h30 et Rabat-Agdal à 06h45...&quot;</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-cyan-100 dark:border-slate-800">
                    <p className="font-bold text-brand-teal dark:text-cyan-400">3. Modalités d&apos;acompte &amp; Clôture :</p>
                    <p className="italic mt-1">&quot;Pour bloquer vos sièges dans l&apos;autocar VIP, un acompte de {booking.depositAmount} DH suffit. Je vous transmets nos RIB CIH et Attijariwafa directement sur WhatsApp pour que vous puissiez nous envoyer le reçu...&quot;</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 dark:bg-slate-900/80 p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 hidden sm:block">
            Dossier créé le {booking.createdAt} • Tentatives : <strong>{booking.callAttemptsCount || 0}</strong>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Fermer
            </button>

            <button
              type="submit"
              form="call-center-form"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enregistrer la Fiche d&apos;Appel</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
