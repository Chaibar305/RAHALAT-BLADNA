"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { 
  Phone, Clock, RotateCcw, CheckCircle2, ShieldCheck, 
  X, AlertTriangle, Download, Filter, Loader2, Sparkles, UserCheck, 
  Layers, Ticket, PhoneCall, CreditCard, Banknote, Calendar
} from "lucide-react";
import { BookingsTable } from "./BookingsTable";
import { FinancialTicketingTable } from "./FinancialTicketingTable";
import { ReceiptVerificationModal, BookingAdminItem } from "./ReceiptVerificationModal";
import { DigitalTicketModal } from "./DigitalTicketModal";
import { EditBookingModal } from "./EditBookingModal";
import { DeleteBookingModal } from "./DeleteBookingModal";
import { CallCenterModal } from "./CallCenterModal";
import { exportBookingsExcelAction, cancelBookingAdminAction } from "@/actions/booking.actions";
import { formatMAD } from "@/lib/utils";

interface TeamMemberOption {
  id: string;
  fullName: string;
  role: string;
}

interface BookingsManagerProps {
  initialBookings: BookingAdminItem[];
  allTrips: Array<{ id: string; titleFr: string; titleAr: string }>;
  teamMembers?: TeamMemberOption[];
  locale?: string;
}

export function BookingsManager({
  initialBookings,
  allTrips,
  teamMembers = [],
  locale = "fr",
}: BookingsManagerProps) {
  const isAr = locale === "ar";
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Navigation principale : 'ticketing' (Billetterie & Reçus R2) vs 'calls' (Traitement Téléphonique CRM)
  const viewParam = searchParams.get("view");
  const [activeMainTab, setActiveMainTab] = useState<"ticketing" | "calls">(
    viewParam === "calls" ? "calls" : "ticketing"
  );

  // Synchronisation avec l'URL
  const handleMainTabChange = (tab: "ticketing" | "calls") => {
    setActiveMainTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [bookings, setBookings] = useState<BookingAdminItem[]>(initialBookings);

  // Sous-onglets de filtrage
  const [financialTab, setFinancialTab] = useState<string>("ALL");
  const [callTab, setCallTab] = useState<string>("ALL");

  // Filtres déroulants
  const [selectedTripFilter, setSelectedTripFilter] = useState<string>("ALL");
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>("ALL");
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>("ALL");
  const [isExporting, setIsExporting] = useState(false);

  // États des modales partagées
  const [selectedCallBooking, setSelectedCallBooking] = useState<BookingAdminItem | null>(null);
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<BookingAdminItem | null>(null);
  const [selectedTicketBooking, setSelectedTicketBooking] = useState<BookingAdminItem | null>(null);
  const [editingBooking, setEditingBooking] = useState<BookingAdminItem | null>(null);
  const [deletingBooking, setDeletingBooking] = useState<BookingAdminItem | null>(null);

  // Synchronisation avec les props serveur
  useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);

  // ==========================================
  // 1. MÉTRIQUES & COMPTEURS FINANCIERS (TICKETING)
  // ==========================================
  const financialMetrics = useMemo(() => {
    let totalCollectedMAD = 0;
    let totalRemainingMAD = 0;

    bookings.forEach((b) => {
      if (!b.status.startsWith("CANCELLED") && b.status !== "ANNULEE") {
        totalCollectedMAD += Number(b.amountPaid || 0);
        const rem = Math.max(0, Number(b.totalAmount || 0) - Number(b.amountPaid || 0));
        totalRemainingMAD += rem;
      }
    });

    return { totalCollectedMAD, totalRemainingMAD };
  }, [bookings]);

  const financialCounts = useMemo(() => {
    const res = {
      ALL: bookings.length,
      PENDING_VERIFICATION: 0,
      DEPOSIT_CONFIRMED: 0,
      FULLY_PAID: 0,
      PENDING_PAYMENT: 0,
      CANCELLED: 0,
    };

    bookings.forEach((b) => {
      if (b.status === "PENDING_VERIFICATION" || (b.proofUrl && b.paymentStatus !== "VERIFIED" && b.status !== "FULLY_PAID")) {
        res.PENDING_VERIFICATION += 1;
      } else if (b.status === "DEPOSIT_PAID" || b.status === "DEPOSIT_CONFIRMED" || b.callStatus === "DEPOSIT_RECEIVED") {
        res.DEPOSIT_CONFIRMED += 1;
      } else if (b.status === "FULLY_PAID") {
        res.FULLY_PAID += 1;
      } else if (b.status.startsWith("CANCELLED") || b.status === "ANNULEE") {
        res.CANCELLED += 1;
      } else {
        res.PENDING_PAYMENT += 1;
      }
    });

    return res;
  }, [bookings]);

  // ==========================================
  // 2. MÉTRIQUES & COMPTEURS CALL CENTER (CRM)
  // ==========================================
  const callMetrics = useMemo(() => {
    let potentialVerbalMAD = 0;

    bookings.forEach((b) => {
      if (!b.status.startsWith("CANCELLED") && b.callStatus === "CONFIRMED_PHONE") {
        potentialVerbalMAD += Number(b.totalAmount || 0);
      }
    });

    return { potentialVerbalMAD };
  }, [bookings]);

  const callCounts = useMemo(() => {
    const res = {
      ALL: bookings.length,
      PENDING_CALL: 0,
      CALLBACK_SCHEDULED: 0,
      NO_ANSWER: 0,
      CONFIRMED_PHONE: 0,
      DEPOSIT_RECEIVED: 0,
      RECEIPTS_AUDIT: 0,
      CANCELLED_REFUSED: 0,
    };

    bookings.forEach((b) => {
      const cStatus = b.callStatus || "PENDING_CALL";
      if (cStatus === "PENDING_CALL") res.PENDING_CALL += 1;
      else if (cStatus === "CALLBACK_SCHEDULED") res.CALLBACK_SCHEDULED += 1;
      else if (cStatus === "NO_ANSWER_1" || cStatus === "NO_ANSWER_2") res.NO_ANSWER += 1;
      else if (cStatus === "CONFIRMED_PHONE") res.CONFIRMED_PHONE += 1;
      else if (
        cStatus === "DEPOSIT_RECEIVED" ||
        b.status === "DEPOSIT_PAID" ||
        b.status === "DEPOSIT_CONFIRMED" ||
        b.status === "FULLY_PAID"
      ) {
        res.DEPOSIT_RECEIVED += 1;
      } else if (
        cStatus === "CANCELLED_REFUSED" ||
        cStatus === "WRONG_NUMBER" ||
        b.status.startsWith("CANCELLED") ||
        b.status === "ANNULEE"
      ) {
        res.CANCELLED_REFUSED += 1;
      }

      if (b.status === "PENDING_VERIFICATION" && b.proofUrl) {
        res.RECEIPTS_AUDIT += 1;
      }
    });

    return res;
  }, [bookings]);

  // Liste des sources uniques
  const uniqueSources = useMemo(() => {
    const s = new Set<string>();
    bookings.forEach((b) => {
      if (b.source) s.add(b.source);
    });
    return Array.from(s);
  }, [bookings]);

  // ==========================================
  // 3. FILTRAGE DES DONNÉES SELON LA VUE
  // ==========================================
  const filteredFinancialBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Filtre d'onglet financier
      let matchesTab = true;
      if (financialTab === "PENDING_VERIFICATION") {
        matchesTab = b.status === "PENDING_VERIFICATION" || (!!b.proofUrl && b.paymentStatus !== "VERIFIED" && b.status !== "FULLY_PAID");
      } else if (financialTab === "DEPOSIT_CONFIRMED") {
        matchesTab = b.status === "DEPOSIT_PAID" || b.status === "DEPOSIT_CONFIRMED" || b.callStatus === "DEPOSIT_RECEIVED";
      } else if (financialTab === "FULLY_PAID") {
        matchesTab = b.status === "FULLY_PAID";
      } else if (financialTab === "PENDING_PAYMENT") {
        matchesTab = b.status === "PENDING" || b.status === "PENDING_PAYMENT" || b.status === "QUOTE_REQUESTED";
      } else if (financialTab === "CANCELLED") {
        matchesTab = b.status.startsWith("CANCELLED") || b.status === "ANNULEE";
      }

      // Filtre Circuit
      const matchesTrip = selectedTripFilter === "ALL" || b.tripId === selectedTripFilter;

      return matchesTab && matchesTrip;
    });
  }, [bookings, financialTab, selectedTripFilter]);

  const filteredCallBookings = useMemo(() => {
    return bookings.filter((b) => {
      const cStatus = b.callStatus || "PENDING_CALL";

      // Filtre Onglet CRM
      let matchesTab = true;
      if (callTab === "PENDING_CALL") {
        matchesTab = cStatus === "PENDING_CALL";
      } else if (callTab === "CALLBACK_SCHEDULED") {
        matchesTab = cStatus === "CALLBACK_SCHEDULED";
      } else if (callTab === "NO_ANSWER") {
        matchesTab = cStatus === "NO_ANSWER_1" || cStatus === "NO_ANSWER_2";
      } else if (callTab === "CONFIRMED_PHONE") {
        matchesTab = cStatus === "CONFIRMED_PHONE";
      } else if (callTab === "DEPOSIT_RECEIVED") {
        matchesTab =
          cStatus === "DEPOSIT_RECEIVED" ||
          b.status === "DEPOSIT_PAID" ||
          b.status === "DEPOSIT_CONFIRMED" ||
          b.status === "FULLY_PAID";
      } else if (callTab === "RECEIPTS_AUDIT") {
        matchesTab = b.status === "PENDING_VERIFICATION" && !!b.proofUrl;
      } else if (callTab === "CANCELLED_REFUSED") {
        matchesTab =
          cStatus === "CANCELLED_REFUSED" ||
          cStatus === "WRONG_NUMBER" ||
          b.status.startsWith("CANCELLED") ||
          b.status === "ANNULEE";
      }

      // Filtre Circuit
      const matchesTrip = selectedTripFilter === "ALL" || b.tripId === selectedTripFilter;

      // Filtre Agent
      const matchesAgent = selectedAgentFilter === "ALL" || b.confirmedByMemberId === selectedAgentFilter;

      // Filtre Source
      const matchesSource = selectedSourceFilter === "ALL" || b.source === selectedSourceFilter;

      return matchesTab && matchesTrip && matchesAgent && matchesSource;
    });
  }, [bookings, callTab, selectedTripFilter, selectedAgentFilter, selectedSourceFilter]);

  // ==========================================
  // 4. ACTIONS & HANDLERS
  // ==========================================
  const handleCallSuccess = (updatedData?: any) => {
    if (updatedData && updatedData.id) {
      setBookings((prev) =>
        prev.map((b) => (b.id === updatedData.id ? { ...b, ...updatedData } : b))
      );
    }
  };

  const handleQuickStatusChanged = (bookingId: string, newStatus: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              callStatus: newStatus,
              callAttemptsCount: (b.callAttemptsCount || 0) + 1,
              lastCallDate: new Date().toISOString(),
            }
          : b
      )
    );
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const activeFilter = activeMainTab === "ticketing" ? financialTab : callTab;
      const res = await exportBookingsExcelAction(activeFilter);
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

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler ce dossier de réservation ?")) {
      return;
    }
    const reason = window.prompt("Motif d'annulation (optionnel) :") || undefined;

    try {
      const res = await cancelBookingAdminAction(bookingId, reason);
      if (res.success) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId
              ? {
                  ...b,
                  status: "CANCELLED_BY_ADMIN",
                  callStatus: "CANCELLED_REFUSED",
                }
              : b
          )
        );
      } else {
        alert(res.error || "Erreur lors de l'annulation.");
      }
    } catch (err: any) {
      alert("Erreur de connexion : " + err.message);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      
      {/* ========================================================================= */}
      {/* SYSTÈME À DOUBLE ONGLET PRINCIPAL (TICKETING VS TRAITEMENT TÉLÉPHONIQUE)  */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-3 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit border border-slate-200 dark:border-slate-700 shadow-xs">
        <button
          type="button"
          onClick={() => handleMainTabChange("ticketing")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition ${
            activeMainTab === "ticketing"
              ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Ticket className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{isAr ? "💳 التذاكر، التسبيقات ووصولات الدفع" : "💳 Billetterie, Acomptes & Reçus R2"}</span>
        </button>

        <button
          type="button"
          onClick={() => handleMainTabChange("calls")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition ${
            activeMainTab === "calls"
              ? "bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <PhoneCall className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>{isAr ? "📞 معالجة المكالمات وإغلاق المبيعات" : "📞 Traitement Téléphonique & Closing CRM"}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VUE 1 : BILLETTERIE, ACOMPTES & REÇUS R2 (GESTION FINANCIÈRE)             */}
      {/* ========================================================================= */}
      {activeMainTab === "ticketing" && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
          {/* 1. Header Banner Financier */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
            <div className="space-y-2 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-black uppercase tracking-wider">
                <CreditCard className="w-3.5 h-3.5" />
                <span>{isAr ? "الإدارة المالية وإصدار التذاكر" : "Gestion Financière & Billetterie"}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {isAr ? "الحجوزات، التسبيقات ووصولات الدفع" : "Réservations, Acomptes & Billetterie"}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                {isAr
                  ? "متابعة ملفات الحجز، التحقق من إيصالات التحويل البنكي وإصدار بطاقات الركوب الرسمية."
                  : "Suivi des dossiers de réservation, vérification des preuves de virement bancaire (R2) et émission des cartes d'embarquement officielles."}
              </p>
            </div>

            <div className="flex items-center gap-3 z-10">
              <span className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 font-mono font-black text-sm border border-slate-200 dark:border-slate-700 shadow-xs">
                {bookings.length} {isAr ? "ملف مسجل" : "Dossiers Enregistrés"}
              </span>
            </div>
          </div>

          {/* 2. 4 Cartes KPI Financières & Billetterie */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* KPI 1 : Reçus R2 à Vérifier */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-2 transition-colors relative overflow-hidden">
              {financialCounts.PENDING_VERIFICATION > 0 && (
                <span className="absolute top-3 end-3 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                </span>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  {isAr ? "وصولات R2 للتحقق" : "Reçus R2 à Vérifier"}
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-amber-600 dark:text-amber-400 font-black text-2xl sm:text-3xl font-mono">
                {financialCounts.PENDING_VERIFICATION}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr ? "إيصالات تحويل بنكي في انتظار المراجعة" : "Preuves de virement en attente d'audit"}
              </p>
            </div>

            {/* KPI 2 : Acomptes Confirmés */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-2 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  {isAr ? "تسبيقات مؤكدة" : "Acomptes Confirmés"}
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-emerald-600 dark:text-emerald-400 font-black text-2xl sm:text-3xl font-mono">
                {financialCounts.DEPOSIT_CONFIRMED}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr ? "مقاعد محجوزة وتذاكر مُصدرة" : "Places réservées & Billets émis"}
              </p>
            </div>

            {/* KPI 3 : Total Encaissé */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-2 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  {isAr ? "المجموع المقبوض (درهم)" : "Total Encaissé (MAD)"}
                </span>
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
              </div>
              <p className="text-cyan-600 dark:text-cyan-400 font-black text-2xl sm:text-3xl font-mono">
                {formatMAD(financialMetrics.totalCollectedMAD, locale)}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr ? "تسبيقات وأرصدة محصلة" : "Acomptes et soldes perçus"}
              </p>
            </div>

            {/* KPI 4 : Solde Restant à Percevoir */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-2 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  {isAr ? "الرصيد المتبقي للتحصيل" : "Solde Restant à Percevoir"}
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-blue-600 dark:text-blue-400 font-black text-2xl sm:text-3xl font-mono">
                {formatMAD(financialMetrics.totalRemainingMAD, locale)}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr ? "واجب التحصيل قبل موعد الانطلاق" : "À recouvrer avant le départ"}
              </p>
            </div>

          </div>

          {/* 3. Barre d'Onglets & Filtres Financiers */}
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Onglets Financiers */}
            <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 md:pb-0">
              
              {/* Tous */}
              <button
                type="button"
                onClick={() => setFinancialTab("ALL")}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  financialTab === "ALL"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{isAr ? "جميع الملفات" : "Tous les dossiers"}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-slate-500/20 text-[10px] font-black">
                  {financialCounts.ALL}
                </span>
              </button>

              {/* À Vérifier (Reçus R2) */}
              <button
                type="button"
                onClick={() => setFinancialTab("PENDING_VERIFICATION")}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  financialTab === "PENDING_VERIFICATION"
                    ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                    : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{isAr ? "للتحقق (وصولات R2)" : "À Vérifier (Reçus R2)"}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-slate-950/20 text-[10px] font-black">
                  {financialCounts.PENDING_VERIFICATION}
                </span>
              </button>

              {/* Acomptes Validés */}
              <button
                type="button"
                onClick={() => setFinancialTab("DEPOSIT_CONFIRMED")}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  financialTab === "DEPOSIT_CONFIRMED"
                    ? "bg-emerald-600 text-white font-black shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isAr ? "تسبيقات مؤكدة" : "Acomptes Validés"}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-black">
                  {financialCounts.DEPOSIT_CONFIRMED}
                </span>
              </button>

              {/* Soldés 100% */}
              <button
                type="button"
                onClick={() => setFinancialTab("FULLY_PAID")}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  financialTab === "FULLY_PAID"
                    ? "bg-cyan-600 text-white font-black shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40"
                }`}
              >
                <span>{isAr ? "مدفوع 100%" : "Soldés 100%"}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-black">
                  {financialCounts.FULLY_PAID}
                </span>
              </button>

              {/* En Attente */}
              <button
                type="button"
                onClick={() => setFinancialTab("PENDING_PAYMENT")}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  financialTab === "PENDING_PAYMENT"
                    ? "bg-slate-700 text-white font-black shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{isAr ? "في الانتظار" : "En Attente"}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-black">
                  {financialCounts.PENDING_PAYMENT}
                </span>
              </button>

              {/* Annulés */}
              <button
                type="button"
                onClick={() => setFinancialTab("CANCELLED")}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  financialTab === "CANCELLED"
                    ? "bg-rose-600 text-white font-black shadow-sm"
                    : "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>{isAr ? "ملغاة" : "Annulés"}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-black">
                  {financialCounts.CANCELLED}
                </span>
              </button>

            </div>

            {/* Filtre Circuit & Export (.xlsx) */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                <select
                  value={selectedTripFilter}
                  onChange={(e) => setSelectedTripFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{isAr ? "جميع الرحلات" : "Tous les circuits"}</option>
                  {allTrips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {isAr && t.titleAr ? t.titleAr : t.titleFr}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleExportExcel}
                disabled={isExporting}
                className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Export (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* 4. Tableau Financier & Billetterie */}
          <FinancialTicketingTable
            bookings={filteredFinancialBookings}
            onOpenReceipt={(b) => setSelectedReceiptBooking(b)}
            onOpenTicket={(b) => setSelectedTicketBooking(b)}
            onCancelBooking={handleCancelBooking}
            onEditBooking={(b) => setEditingBooking(b)}
            onDeleteBooking={(b) => setDeletingBooking(b)}
            locale={locale}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* VUE 2 : TRAITEMENT TÉLÉPHONIQUE & CLOSING CRM (CENTRE D'APPELS)           */}
      {/* ========================================================================= */}
      {activeMainTab === "calls" && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
          {/* 1. Header Banner Centre d'Appels */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
            <div className="space-y-2 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-black uppercase tracking-wider">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{isAr ? "مركز الاتصالات وتأكيد الحجوزات" : "Centre de Traitement des Appels & Confirmations"}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {isAr ? "متابعة المكالمات، إغلاق المبيعات والأقساط" : "Traitement Téléphonique, Closing & Acomptes"}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                {isAr
                  ? "معالجة مكالمات الحجز الواردة من إعلانات ميتا واستمارات الويب، تأكيد نقاط الركوب والغرف، إرسال الحسابات البنكية عبر واتساب ومتابعة التحويلات."
                  : "Qualification opérationnelle des prospects Meta Ads & formulaires web, calage logistique (ramassages & chambres), envoi de RIB sur WhatsApp et validation des acomptes."}
              </p>
            </div>

            <div className="flex items-center gap-3 z-10">
              <span className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 font-mono font-black text-sm border border-slate-200 dark:border-slate-700 shadow-xs">
                {bookings.length} {isAr ? "ملف prospect" : "Dossiers & Prospects"}
              </span>
            </div>
          </div>

          {/* 2. 4 Cartes KPI Opérationnelles Centre d'Appels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* KPI 1 : Nouveaux Prospects à Appeler */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-2 transition-colors relative overflow-hidden">
              {callCounts.PENDING_CALL > 0 && (
                <span className="absolute top-3 end-3 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                </span>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  {isAr ? "مكالمات ذات أولوية" : "À Contacter (Nouveaux)"}
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
              </div>
              <p className="text-amber-600 dark:text-amber-400 font-black text-2xl sm:text-3xl font-mono">
                {callCounts.PENDING_CALL}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr ? "طلبات حجز جديدة لم يتم الاتصال بها" : "Prospects chauds en attente du 1er appel"}
              </p>
            </div>

            {/* KPI 2 : Rappels Programmés */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-2 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  {isAr ? "مواعيد إعادة الاتصال" : "Rappels Programmés"}
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-blue-600 dark:text-blue-400 font-black text-2xl sm:text-3xl font-mono">
                {callCounts.CALLBACK_SCHEDULED}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr ? "مواعيد محددة مع العملاء" : "Créneaux convenus à rappeler"}
              </p>
            </div>

            {/* KPI 3 : Accords Verbaux (Closing) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-2 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  {isAr ? "موافقات شفهية (Closing)" : "Accords Verbaux (Closing)"}
                </span>
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-teal-600 dark:text-teal-400 font-black text-2xl sm:text-3xl font-mono">
                {callCounts.CONFIRMED_PHONE}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Potentiel : {formatMAD(callMetrics.potentialVerbalMAD, locale)} (RIB envoyé)
              </p>
            </div>

            {/* KPI 4 : Acomptes & Billets Validés */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-2 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  {isAr ? "حجوزات مؤكدة بالتسبيق" : "Acomptes & Billets Validés"}
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-emerald-600 dark:text-emerald-400 font-black text-2xl sm:text-3xl font-mono">
                {callCounts.DEPOSIT_RECEIVED}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Total encaissé : {formatMAD(financialMetrics.totalCollectedMAD, locale)}
              </p>
            </div>

          </div>

          {/* 3. Barre d'Onglets Opérationnels Call Center */}
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Onglets CRM */}
            <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 md:pb-0">
              
              {/* Tous */}
              <button
                type="button"
                onClick={() => setCallTab("ALL")}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  callTab === "ALL"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{isAr ? "جميع الملفات" : "Tous les dossiers"}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-slate-500/20 text-[10px] font-black">
                  {callCounts.ALL}
                </span>
              </button>

              {/* 📞 Nouveaux à Appeler */}
              <button
                type="button"
                onClick={() => setCallTab("PENDING_CALL")}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  callTab === "PENDING_CALL"
                    ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{isAr ? "في الانتظار" : "À Appeler"}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-slate-950/20 text-[10px] font-black">
                  {callCounts.PENDING_CALL}
                </span>
              </button>

              {/* ⏰ Rappels Programmés */}
              <button
                type="button"
                onClick={() => setCallTab("CALLBACK_SCHEDULED")}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  callTab === "CALLBACK_SCHEDULED"
                    ? "bg-blue-600 text-white font-black shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isAr ? "مواعيد إعادة الاتصال" : "Rappels Prévus"}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-black">
                  {callCounts.CALLBACK_SCHEDULED}
                </span>
              </button>

              {/* 📵 Sans Réponse */}
              <button
                type="button"
                onClick={() => setCallTab("NO_ANSWER")}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  callTab === "NO_ANSWER"
                    ? "bg-rose-600 text-white font-black shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isAr ? "لا يجيب" : "Sans Réponse"}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-black">
                  {callCounts.NO_ANSWER}
                </span>
              </button>

              {/* 🤝 Accords Verbaux */}
              <button
                type="button"
                onClick={() => setCallTab("CONFIRMED_PHONE")}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  callTab === "CONFIRMED_PHONE"
                    ? "bg-teal-600 text-white font-black shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isAr ? "موافقات شفهية" : "Accords Verbaux"}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-black">
                  {callCounts.CONFIRMED_PHONE}
                </span>
              </button>

              {/* 🟢 Acomptes Validés */}
              <button
                type="button"
                onClick={() => setCallTab("DEPOSIT_RECEIVED")}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  callTab === "DEPOSIT_RECEIVED"
                    ? "bg-emerald-600 text-white font-black shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isAr ? "تسبيقات مؤكدة" : "Acomptes Validés"}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-black">
                  {callCounts.DEPOSIT_RECEIVED}
                </span>
              </button>

              {/* 🧾 Reçus R2 à Auditer */}
              {callCounts.RECEIPTS_AUDIT > 0 && (
                <button
                  type="button"
                  onClick={() => setCallTab("RECEIPTS_AUDIT")}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                    callTab === "RECEIPTS_AUDIT"
                      ? "bg-amber-600 text-white font-black shadow-sm"
                      : "text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{isAr ? "وصولات R2" : "Reçus R2 à Vérifier"}</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-amber-700 text-white text-[10px] font-black animate-pulse">
                    {callCounts.RECEIPTS_AUDIT}
                  </span>
                </button>
              )}

              {/* ❌ Refusés */}
              <button
                type="button"
                onClick={() => setCallTab("CANCELLED_REFUSED")}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  callTab === "CANCELLED_REFUSED"
                    ? "bg-slate-700 text-white font-black shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>{isAr ? "ملغاة / خاطئة" : "Refusés / Faux N°"}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-slate-500/20 text-[10px] font-black">
                  {callCounts.CANCELLED_REFUSED}
                </span>
              </button>
            </div>

            {/* Bouton Export Excel */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={isExporting}
                className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* 4. Filtres Combinés : Circuit + Agent + Source */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Filtre par Circuit */}
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-500 shrink-0 ms-1" />
              <select
                value={selectedTripFilter}
                onChange={(e) => setSelectedTripFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL">{isAr ? "جميع الرحلات" : "Tous les circuits"}</option>
                {allTrips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {isAr && t.titleAr ? t.titleAr : t.titleFr}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par Agent de Confirmation */}
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-500 shrink-0 ms-1" />
              <select
                value={selectedAgentFilter}
                onChange={(e) => setSelectedAgentFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL">{isAr ? "جميع الوكلاء" : "Tous les agents"}</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par Canal d'Acquisition (Meta Ads, Web, etc.) */}
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-orange shrink-0 ms-1" />
              <select
                value={selectedSourceFilter}
                onChange={(e) => setSelectedSourceFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL">{isAr ? "جميع المصادر (إعلانات ميتا، الويب...)" : "Toutes les sources (Meta Ads, Web...)"}</option>
                {uniqueSources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Tableau des Prospects / Appels */}
          <BookingsTable
            bookings={filteredCallBookings}
            onOpenCallCenter={(b) => setSelectedCallBooking(b)}
            onOpenReceipt={(b) => setSelectedReceiptBooking(b)}
            onOpenTicket={(b) => setSelectedTicketBooking(b)}
            onEditBooking={(b) => setEditingBooking(b)}
            onDeleteBooking={(b) => setDeletingBooking(b)}
            onCancelBooking={handleCancelBooking}
            onCallStatusChanged={handleQuickStatusChanged}
            locale={locale}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALES COMMUNES DU MODULE DES RÉSERVATIONS                                */}
      {/* ========================================================================= */}
      
      {/* Modale 1 : Fiche d'Appel CRM Call Center */}
      <CallCenterModal
        isOpen={!!selectedCallBooking}
        onClose={() => setSelectedCallBooking(null)}
        booking={selectedCallBooking}
        teamMembers={teamMembers}
        onSuccess={handleCallSuccess}
        locale={locale}
      />

      {/* Modale 2 : Vérification Reçu R2 */}
      <ReceiptVerificationModal
        isOpen={!!selectedReceiptBooking}
        onClose={() => setSelectedReceiptBooking(null)}
        booking={selectedReceiptBooking}
        onSuccess={() => {
          if (selectedReceiptBooking) {
            setBookings((prev) =>
              prev.map((b) =>
                b.id === selectedReceiptBooking.id
                  ? {
                      ...b,
                      status: "DEPOSIT_PAID",
                      callStatus: "DEPOSIT_RECEIVED",
                      paymentStatus: "VERIFIED",
                      amountPaid: b.depositAmount,
                    }
                  : b
              )
            );
          }
        }}
        locale={locale}
      />

      {/* Modale 3 : Billet Digital QR */}
      <DigitalTicketModal
        isOpen={!!selectedTicketBooking}
        onClose={() => setSelectedTicketBooking(null)}
        booking={selectedTicketBooking}
        locale={locale}
      />

      {/* Modale 4 : Édition Dossier */}
      <EditBookingModal
        isOpen={!!editingBooking}
        onClose={() => setEditingBooking(null)}
        booking={editingBooking}
        onSuccess={() => {}}
        locale={locale}
      />

      {/* Modale 5 : Suppression Dossier */}
      <DeleteBookingModal
        isOpen={!!deletingBooking}
        onClose={() => setDeletingBooking(null)}
        booking={deletingBooking}
        onSuccess={() => {
          if (deletingBooking) {
            const idToRemove = deletingBooking.id;
            setBookings((prev) => prev.filter((b) => b.id !== idToRemove));
          }
          setDeletingBooking(null);
        }}
        locale={locale}
      />

    </div>
  );
}
