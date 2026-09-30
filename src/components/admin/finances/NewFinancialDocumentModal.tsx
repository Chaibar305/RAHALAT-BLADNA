"use client";

import React, { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import {
  X,
  FileText,
  Sparkles,
  Building2,
  Calendar,
  Users,
  Plus,
  Trash2,
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { DocumentType, DocumentStatus } from "@/types/finance";
import {
  createFinancialDocumentAction,
  getAvailableTripsForDocumentAction,
  CreateFinancialDocumentInput,
} from "@/actions/finance.actions";
import { formatMAD } from "@/lib/utils";

interface NewFinancialDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: DocumentType;
  onCreated?: (docNumber: string) => void;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceMAD: number;
  totalMAD: number;
}

export function NewFinancialDocumentModal({
  isOpen,
  onClose,
  defaultType = DocumentType.QUOTE_B2B,
  onCreated,
}: NewFinancialDocumentModalProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const [docType, setDocType] = useState<DocumentType>(defaultType);
  const [docStatus, setDocStatus] = useState<DocumentStatus>(
    defaultType === DocumentType.QUOTE_B2B ? DocumentStatus.SENT : DocumentStatus.DRAFT
  );

  // Client info
  const [clientName, setClientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [ice, setIce] = useState("");
  const [taxId, setTaxId] = useState("");
  const [rcNumber, setRcNumber] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");

  // Trip details
  const [availableTrips, setAvailableTrips] = useState<Array<{ id: string; title: string; basePrice: number }>>([]);
  const [selectedTripId, setSelectedTripId] = useState("custom");
  const [tripTitle, setTripTitle] = useState("");
  const [tripDate, setTripDate] = useState("");
  const [participantsCount, setParticipantsCount] = useState<number>(10);

  // Line items
  const [items, setItems] = useState<LineItem[]>([
    {
      id: "item-1",
      description: "Forfait Séjour & Hébergement (3J/2N)",
      quantity: 10,
      unitPriceMAD: 1450,
      totalMAD: 14500,
    },
    {
      id: "item-2",
      description: "Transport Touristique Grand Confort TIST (Aller-Retour)",
      quantity: 1,
      unitPriceMAD: 3500,
      totalMAD: 3500,
    },
  ]);

  // Financial rates
  const [vatRate, setVatRate] = useState<number>(0); // 0% par défaut pour agence / franchise
  const [depositAmount, setDepositAmount] = useState<number>(5400); // ~30%
  const [validUntil, setValidUntil] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState(
    "Devis valable 30 jours à compter de la date d'émission. Acompte de 30% à la réservation, le solde au départ. Règlement par virement bancaire sur compte CIH Bank officiel."
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch catalog trips on open
  useEffect(() => {
    if (isOpen) {
      getAvailableTripsForDocumentAction().then((trips) => {
        setAvailableTrips(trips);
      });
    }
  }, [isOpen]);

  // Sync docType change
  useEffect(() => {
    setDocType(defaultType);
    setDocStatus(defaultType === DocumentType.QUOTE_B2B ? DocumentStatus.SENT : DocumentStatus.DRAFT);
  }, [defaultType]);

  // Trip selection handler
  const handleTripSelect = (tId: string) => {
    setSelectedTripId(tId);
    if (tId === "custom") {
      setTripTitle("");
    } else {
      const match = availableTrips.find((t) => t.id === tId);
      if (match) {
        setTripTitle(match.title);
        // Met à jour la 1ere ligne avec le prix unitaire du circuit
        setItems((prev) => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          updated[0] = {
            ...updated[0],
            description: `Forfait Circuit : ${match.title}`,
            unitPriceMAD: match.basePrice,
            totalMAD: match.basePrice * (updated[0].quantity || 1),
          };
          return updated;
        });
      }
    }
  };

  // Calculations
  const subtotalHT = items.reduce((acc, it) => acc + (Number(it.totalMAD) || 0), 0);
  const vatAmount = vatRate > 0 ? (subtotalHT * vatRate) / 100 : 0;
  const totalTTC = subtotalHT + vatAmount;
  const remainingAmount = Math.max(0, totalTTC - (Number(depositAmount) || 0));

  // Add Item
  const handleAddItem = (presetDesc?: string, presetPrice?: number) => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      description: presetDesc || "Prestation touristique complémentaire",
      quantity: 1,
      unitPriceMAD: presetPrice || 500,
      totalMAD: presetPrice || 500,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Update Item
  const handleUpdateItem = (id: string, field: keyof LineItem, val: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: val };
        if (field === "quantity" || field === "unitPriceMAD") {
          const q = field === "quantity" ? Number(val) : it.quantity;
          const p = field === "unitPriceMAD" ? Number(val) : it.unitPriceMAD;
          updated.totalMAD = (q || 0) * (p || 0);
        }
        return updated;
      })
    );
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!clientName.trim()) {
      setErrorMsg(isAr ? "الرجاء إدخال اسم العميل أو ممثل الشركة" : "Veuillez renseigner le nom du contact / client.");
      return;
    }
    if (!clientPhone.trim() && !clientEmail.trim()) {
      setErrorMsg(isAr ? "الرجاء إدخال رقم الهاتف أو البريد الإلكتروني" : "Veuillez renseigner au moins un numéro de téléphone ou email.");
      return;
    }
    if (!tripTitle.trim()) {
      setErrorMsg(isAr ? "الرجاء إدخال عنوان الرحلة أو البرنامج" : "Veuillez indiquer le nom du circuit ou de l'événement.");
      return;
    }
    if (items.length === 0) {
      setErrorMsg(isAr ? "الرجاء إدخال عنصر واحد على الأقل" : "Veuillez ajouter au moins une ligne de prestation.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: CreateFinancialDocumentInput = {
        type: docType,
        status: docStatus,
        clientName: clientName.trim(),
        companyName: companyName.trim() || undefined,
        ice: ice.trim() || undefined,
        taxId: taxId.trim() || undefined,
        rcNumber: rcNumber.trim() || undefined,
        clientEmail: clientEmail.trim(),
        clientPhone: clientPhone.trim(),
        clientAddress: clientAddress.trim() || undefined,
        tripTitle: tripTitle.trim(),
        tripDate: tripDate ? tripDate : null,
        participantsCount: Number(participantsCount) || 1,
        items: items.map((it) => ({
          description: it.description,
          quantity: Number(it.quantity) || 1,
          unitPriceMAD: Number(it.unitPriceMAD) || 0,
          totalMAD: Number(it.totalMAD) || 0,
        })),
        subtotalHT,
        vatRate,
        vatAmount,
        totalTTC,
        depositAmount: Number(depositAmount) || 0,
        remainingAmount,
        validUntil: docType === DocumentType.QUOTE_B2B ? validUntil : null,
        notes: notes.trim() || undefined,
      };

      const res = await createFinancialDocumentAction(payload);

      if (res.success && res.documentNumber) {
        setSuccessMsg(
          isAr
            ? `تم إنشاء المستند بنجاح برقم ${res.documentNumber}`
            : `Document ${res.documentNumber} généré avec succès et archivé sur Cloudflare R2.`
        );
        if (onCreated) onCreated(res.documentNumber);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.error || "Erreur lors de la génération du document.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erreur inattendue");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isIceValid = ice.trim().length === 15 && /^\d+$/.test(ice.trim());

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        
        {/* Header Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-tp-cyan/10 border border-tp-cyan/30 text-tp-cyan flex items-center justify-center">
              {docType === DocumentType.QUOTE_B2B ? <Sparkles className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{docType === DocumentType.QUOTE_B2B ? "Nouveau Devis B2B (Entreprise)" : "Nouvelle Facture Client"}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-tp-cyan/15 text-tp-cyan font-bold uppercase tracking-wider">
                  Officiel Maroc
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Génération instantanée du document conforme et téléversement direct sur Cloudflare R2
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Messages Alert */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-bold">{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          {/* Toggle Type & Statut */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Type de document financier
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDocType(DocumentType.QUOTE_B2B)}
                  className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                    docType === DocumentType.QUOTE_B2B
                      ? "bg-tp-cyan text-white dark:text-slate-950 shadow-md font-black"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-tp-cyan"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Devis B2B</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDocType(DocumentType.INVOICE)}
                  className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                    docType === DocumentType.INVOICE
                      ? "bg-tp-cyan text-white dark:text-slate-950 shadow-md font-black"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-tp-cyan"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Facture</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Statut initial
              </label>
              <select
                value={docStatus}
                onChange={(e) => setDocStatus(e.target.value as DocumentStatus)}
                className="w-full py-2 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-tp-cyan"
              >
                {docType === DocumentType.QUOTE_B2B ? (
                  <>
                    <option value={DocumentStatus.SENT}>Envoyé au client (Recommandé)</option>
                    <option value={DocumentStatus.DRAFT}>Brouillon interne</option>
                    <option value={DocumentStatus.ACCEPTED}>Validé / Accepté</option>
                  </>
                ) : (
                  <>
                    <option value={DocumentStatus.SENT}>Émise (Acompte en attente)</option>
                    <option value={DocumentStatus.PAID}>Payée (Solde 100% encaissé)</option>
                    <option value={DocumentStatus.DRAFT}>Brouillon</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Section 1 : Informations Client / Société (Entreprise Marocaine B2B) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1.5">
              <Building2 className="w-3.5 h-3.5 text-tp-cyan" />
              <span>1. Informations Client / Entreprise Marocaine</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  Nom du Contact / Responsable <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: M. Karim Tazi"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-tp-cyan"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  Raison Sociale / Entreprise
                </label>
                <input
                  type="text"
                  placeholder="Ex: Maroc Telecom / OCP SA"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-tp-cyan"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-600 dark:text-slate-400 font-bold">
                    ICE (15 chiffres obligatoire au Maroc)
                  </label>
                  {ice && (
                    <span className={`text-[10px] font-bold ${isIceValid ? "text-emerald-500" : "text-amber-500"}`}>
                      {isIceValid ? "✓ 15 chiffres OK" : `${ice.length}/15`}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="001234567000089"
                  value={ice}
                  onChange={(e) => setIce(e.target.value.replace(/\D/g, ""))}
                  className={`w-full p-2.5 font-mono bg-slate-50 dark:bg-slate-950 border rounded-xl text-slate-900 dark:text-white outline-none focus:border-tp-cyan ${
                    ice && isIceValid ? "border-emerald-500" : "border-slate-300 dark:border-slate-800"
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  Identifiant Fiscal (IF)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 40123456"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-tp-cyan"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  Registre de Commerce (RC)
                </label>
                <input
                  type="text"
                  placeholder="Ex: RC Casablanca 245120"
                  value={rcNumber}
                  onChange={(e) => setRcNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-tp-cyan"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  Téléphone / WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="+212 661 00 00 00"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-tp-cyan"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  Email Professionnel <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="contact@societe.ma"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-tp-cyan"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  Adresse du Siège Social (Ville & Boulevard)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Boulevard d'Anfa, 20000 Casablanca"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-tp-cyan"
                />
              </div>
            </div>
          </div>

          {/* Section 2 : Prestation Touristique / Circuit */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1.5">
              <Calendar className="w-3.5 h-3.5 text-tp-cyan" />
              <span>2. Détails de la Prestation & Voyageurs</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  Sélection du Circuit (Catalogue ou Sur-Mesure)
                </label>
                <select
                  value={selectedTripId}
                  onChange={(e) => handleTripSelect(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-bold outline-none focus:border-tp-cyan mb-2"
                >
                  <option value="custom">✏️ Circuit Sur-Mesure / Événement Personnalisé</option>
                  {availableTrips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.basePrice} MAD)
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  required
                  placeholder="Intitulé officiel de la prestation (ex: Séjour Teambuilding Désert d'Agafay)"
                  value={tripTitle}
                  onChange={(e) => setTripTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-bold outline-none focus:border-tp-cyan"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  Nombre de Participants
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute start-3 top-3" />
                  <input
                    type="number"
                    min={1}
                    value={participantsCount}
                    onChange={(e) => setParticipantsCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full ps-9 pe-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-bold outline-none focus:border-tp-cyan"
                  />
                </div>

                <div className="mt-2">
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    Date prévue du voyage
                  </label>
                  <input
                    type="date"
                    value={tripDate}
                    onChange={(e) => setTripDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-bold outline-none focus:border-tp-cyan"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 : Ventilation Financière & Articles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-xs uppercase tracking-wider">
                <DollarSign className="w-3.5 h-3.5 text-tp-cyan" />
                <span>3. Ventilation des Prestations & Articles</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddItem("Session Quad 1h dans les dunes", 400)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:text-tp-cyan hover:bg-tp-cyan/10 transition"
                >
                  + Quad
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem("Soirée Feu de Camp & Animation Gnawa", 2500)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:text-tp-cyan hover:bg-tp-cyan/10 transition"
                >
                  + Soirée Gnawa
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem()}
                  className="px-3 py-1 rounded-lg bg-tp-cyan hover:bg-tp-cyan-hover text-white dark:text-slate-950 font-black text-xs flex items-center gap-1 shadow-sm transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>Ajouter une ligne</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800"
                >
                  <div className="col-span-12 sm:col-span-6">
                    <input
                      type="text"
                      placeholder="Description de la prestation..."
                      value={item.description}
                      onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                      className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium outline-none focus:border-tp-cyan"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        placeholder="Qté"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full p-2 text-xs text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-bold outline-none focus:border-tp-cyan"
                      />
                    </div>
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      min={0}
                      placeholder="Prix U."
                      value={item.unitPriceMAD}
                      onChange={(e) => handleUpdateItem(item.id, "unitPriceMAD", parseFloat(e.target.value) || 0)}
                      className="w-full p-2 text-xs text-end bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-bold outline-none focus:border-tp-cyan"
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-1.5 text-end font-black text-xs text-slate-900 dark:text-white">
                    {formatMAD(item.totalMAD, locale)}
                  </div>

                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={items.length <= 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-30 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4 : Totaux & TVA */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Régime de TVA Maroc
                </label>
                <select
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-tp-cyan"
                >
                  <option value={0}>0% (Exonéré / Franchise TVA)</option>
                  <option value={20}>20% (TVA Standard Prestations)</option>
                </select>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Total HT :
                </span>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {formatMAD(subtotalHT, locale)}
                </p>
                {vatRate > 0 && (
                  <p className="text-[10px] text-slate-500">
                    TVA ({vatRate}%) : {formatMAD(vatAmount, locale)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Acompte versé / demandé (MAD)
                </label>
                <input
                  type="number"
                  min={0}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-tp-cyan"
                />
                <div className="flex gap-1 mt-1">
                  <button
                    type="button"
                    onClick={() => setDepositAmount(Math.round(totalTTC * 0.3))}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-bold"
                  >
                    30%
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositAmount(Math.round(totalTTC * 0.5))}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-bold"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositAmount(totalTTC)}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-bold"
                  >
                    100%
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-tp-midnight text-white text-end space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-tp-ivory/70 block">
                  Total TTC Net
                </span>
                <p className="text-lg font-black text-tp-gold">
                  {formatMAD(totalTTC, locale)}
                </p>
                <p className="text-[10px] text-tp-cyan font-bold">
                  Solde dû : {formatMAD(remainingAmount, locale)}
                </p>
              </div>
            </div>

            {/* Validité et Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-200 dark:border-slate-800 pt-3">
              {docType === DocumentType.QUOTE_B2B && (
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    Date de Validité du Devis
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-bold outline-none focus:border-tp-cyan"
                  />
                </div>
              )}

              <div className={docType === DocumentType.QUOTE_B2B ? "sm:col-span-2" : "sm:col-span-3"}>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  Conditions particulières & Notes officielles
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-tp-cyan resize-none text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-2xl bg-tp-cyan hover:bg-tp-cyan-hover text-white dark:text-slate-950 font-black shadow-tp-cyan flex items-center gap-2 transition active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white dark:text-slate-950" />
                  <span>Génération PDF Cloudflare R2...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {docType === DocumentType.QUOTE_B2B
                      ? "Émettre le Devis B2B Officiel"
                      : "Générer la Facture Officielle"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
