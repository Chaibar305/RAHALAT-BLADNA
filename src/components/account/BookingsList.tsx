"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { 
  Calendar, MapPin, Clock, Users, CreditCard, 
  CheckCircle2, AlertCircle, AlertTriangle, Clock3, Sparkles, 
  ExternalLink, QrCode, Send, MessageCircle, ShieldCheck, 
  Bus, X, Copy, Check, UploadCloud, Trash2, Loader2, 
  FileImage, FileText, ArrowRight, Compass, Download
} from "lucide-react";
import { InvoiceDownloadButton } from "@/components/invoices/InvoiceDownloadButton";
import { uploadBookingReceiptAction } from "@/actions/booking.actions";
import { CancelBookingModal } from "./CancelBookingModal";

export interface SerializedBooking {
  id: string;
  bookingNumber: string;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  bookingStatus: string;
  paymentStatus: string;
  qrCodeToken: string;
  createdAt: string;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  departure: {
    id: string;
    startDate: string;
    endDate: string;
    status: string;
    trip: {
      id: string;
      slug: string;
      titleFr: string;
      titleAr: string;
      coverImageUrl: string;
      durationDays: number;
      durationNights: number;
      departureCity: string;
    };
  };
  passengers: Array<{
    id: string;
    fullName: string;
    cinOrPassport: string;
    phone?: string | null;
    roomTypePreference: string;
    isCheckedIn: boolean;
  }>;
  invoices?: Array<{
    id: string;
    invoiceNumber: string;
    type: string;
    status: string;
  }>;
  payments?: Array<{
    id: string;
    status: string;
    amount: number;
    type: string;
    method: string;
    proofUrl?: string | null;
  }>;
}

interface BookingsListProps {
  bookings: SerializedBooking[];
  user: {
    name: string;
    email: string;
    phone?: string | null;
  };
}

export function BookingsList({ bookings, user }: BookingsListProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const [activeFilter, setActiveFilter] = useState<"ALL" | "UPCOMING" | "PAID" | "PENDING">("ALL");
  const [selectedQrBooking, setSelectedQrBooking] = useState<SerializedBooking | null>(null);
  const [receiptModalBooking, setReceiptModalBooking] = useState<SerializedBooking | null>(null);
  
  // États de l'Upload R2 et du Reçu
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [isUploadingR2, setIsUploadingR2] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedReceiptUrl, setUploadedReceiptUrl] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Notes et formulaire
  const [receiptNotes, setReceiptNotes] = useState("");
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);
  const [receiptSuccess, setReceiptSuccess] = useState(false);
  const [copiedRib, setCopiedRib] = useState(false);
  const [submittedReceiptBookingIds, setSubmittedReceiptBookingIds] = useState<Set<string>>(new Set());
  const [cancelModalBooking, setCancelModalBooking] = useState<SerializedBooking | null>(null);
  const [cancelledBookingIds, setCancelledBookingIds] = useState<Set<string>>(new Set());

  const handleCancelSuccess = (bookingId: string) => {
    setCancelledBookingIds((prev) => new Set(prev).add(bookingId));
    setCancelModalBooking(null);
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeFilter === "UPCOMING") {
      return new Date(b.departure.startDate) >= new Date();
    }
    if (activeFilter === "PAID") {
      return b.bookingStatus === "FULLY_PAID" || b.bookingStatus === "DEPOSIT_CONFIRMED" || b.paymentStatus === "FULLY_PAID" || b.paymentStatus === "DEPOSIT_PAID";
    }
    if (activeFilter === "PENDING") {
      return b.bookingStatus === "PENDING_PAYMENT" || b.bookingStatus === "PENDING_VERIFICATION" || b.paymentStatus === "UNPAID";
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === "ar" ? "ar-MA" : "fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === "ar" ? "ar-MA" : "fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Badge dynamique selon statut et réceptions en attente
  const getStatusBadge = (booking: SerializedBooking) => {
    const isCancelled =
      booking.bookingStatus === "CANCELLED" ||
      booking.bookingStatus === "ANNULEE" ||
      cancelledBookingIds.has(booking.id);

    if (isCancelled) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 shadow-xs">
          <X className="w-3.5 h-3.5" />
          <span>{isAr ? "حجز ملغى" : "Réservation Annulée"}</span>
        </span>
      );
    }

    const hasPendingReceipt = 
      booking.bookingStatus === "PENDING_VERIFICATION" ||
      booking.payments?.some((p) => p.status === "EN_ATTENTE") ||
      submittedReceiptBookingIds.has(booking.id);

    if (hasPendingReceipt) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 shadow-sm animate-pulse">
          <Clock3 className="w-3.5 h-3.5" />
          <span>{isAr ? "وصل في طور المراجعة" : "Reçu en cours de vérification"}</span>
        </span>
      );
    }

    if (booking.bookingStatus === "DEPOSIT_CONFIRMED" || booking.bookingStatus === "CONFIRMED" || booking.paymentStatus === "DEPOSIT_PAID") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isAr ? "تم تأكيد الحجز (عربون مؤدى)" : "Acompte Validé & Confirmé"}</span>
        </span>
      );
    }
    if (booking.bookingStatus === "FULLY_PAID" || booking.paymentStatus === "FULLY_PAID" || booking.bookingStatus === "COMPLETED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-cyan-500/15 text-cyan-900 dark:text-cyan-300 border border-cyan-500/30">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isAr ? "خالص بالكامل 100%" : "Voyage 100% Soldé"}</span>
        </span>
      );
    }
    if (booking.bookingStatus === "CANCELLED" || booking.bookingStatus === "ANNULEE") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-500/15 text-red-800 dark:text-red-400 border border-red-500/30">
          <X className="w-3.5 h-3.5" />
          <span>{isAr ? "ملغاة" : "Annulée"}</span>
        </span>
      );
    }
    if (booking.bookingStatus === "PENDING_PAYMENT" || booking.paymentStatus === "UNPAID") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/20">
          <Clock3 className="w-3.5 h-3.5" />
          <span>{isAr ? "في انتظار إثبات التحويل" : "En attente de virement"}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
        <span>{booking.bookingStatus}</span>
      </span>
    );
  };

  // Copie rapide du RIB
  const handleCopyRib = () => {
    navigator.clipboard.writeText("230810678459421100810080");
    setCopiedRib(true);
    setTimeout(() => setCopiedRib(false), 2500);
  };

  // Ouverture de la modale de reçu
  const handleOpenReceiptModal = (b: SerializedBooking) => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadedReceiptUrl("");
    setUploadProgress(0);
    setUploadError(null);
    setReceiptNotes("");
    setReceiptSuccess(false);
    setReceiptModalBooking(b);
  };

  // Gestion du Drag & Drop et Upload R2
  const processFileUpload = async (file: File) => {
    if (!file) return;
    setUploadError(null);

    // Validation de la taille : 10 Mo max
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(isAr ? "حجم الملف يتجاوز 10 ميغابايت" : "Le fichier dépasse la taille maximale autorisée de 10 Mo.");
      return;
    }

    const isFilePdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    setIsPdf(isFilePdf);
    setSelectedFile(file);

    if (!isFilePdf) {
      const preview = URL.createObjectURL(file);
      setFilePreview(preview);
    } else {
      setFilePreview(null);
    }

    // Téléversement vers Cloudflare R2 (/api/upload avec folder = 'receipts')
    try {
      setIsUploadingR2(true);
      setUploadProgress(15);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "receipts");

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 92);
          setUploadProgress(Math.max(20, percent));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.success && res.url) {
              setUploadProgress(100);
              setUploadedReceiptUrl(res.url);
            } else {
              setUploadError(res.error || (isAr ? "فشل رفع الملف إلى الخادم" : "Échec du stockage Cloudflare R2"));
            }
          } catch {
            setUploadError(isAr ? "خطأ في قراءة الاستجابة" : "Erreur de traitement serveur");
          }
        } else {
          try {
            const res = JSON.parse(xhr.responseText);
            setUploadError(res.error || (isAr ? "خطأ أثناء الرفع" : "Erreur serveur lors du téléversement"));
          } catch {
            setUploadError(isAr ? "فشل الاتصال بالخادم" : "Erreur réseau lors de l'envoi");
          }
        }
        setIsUploadingR2(false);
      };

      xhr.onerror = () => {
        setUploadError(isAr ? "خطأ في الشبكة أثناء الرفع" : "Erreur réseau lors du téléversement");
        setIsUploadingR2(false);
      };

      xhr.send(formData);
    } catch (err: any) {
      setUploadError(err.message || (isAr ? "خطأ غير متوقع" : "Erreur inattendue"));
      setIsUploadingR2(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFileUpload(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadedReceiptUrl("");
    setUploadProgress(0);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Soumission finale du reçu
  const handleSendReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptModalBooking || !uploadedReceiptUrl) return;

    try {
      setIsSubmittingReceipt(true);
      const res = await uploadBookingReceiptAction({
        bookingId: receiptModalBooking.id,
        bankName: "CIH Bank",
        receiptUrl: uploadedReceiptUrl,
        notes: receiptNotes,
      });

      if (res.success) {
        setReceiptSuccess(true);
        setSubmittedReceiptBookingIds((prev) => new Set(prev).add(receiptModalBooking.id));
        setTimeout(() => {
          setReceiptSuccess(false);
          setReceiptModalBooking(null);
          handleRemoveFile();
          setReceiptNotes("");
        }, 2200);
      } else {
        alert(res.error || (isAr ? "حدث خطأ أثناء الإرسال" : "Erreur lors de l'envoi"));
      }
    } catch (err: any) {
      alert(err.message || "Erreur technique");
    } finally {
      setIsSubmittingReceipt(false);
    }
  };

  // Génération du lien WhatsApp dynamique avec N° Dossier et Nom
  const getWhatsAppUrl = (booking: SerializedBooking) => {
    const clientName = user.name || (isAr ? "زبون" : "Client");
    const rawText = isAr
      ? `السلام عليكم رحلات بلادنا، إليكم وصل التحويل البنكي الخاص بحجزي رقم ${booking.bookingNumber} باسم ${clientName}.`
      : `Bonjour Rahalat Bladna, voici le reçu de virement pour ma réservation ${booking.bookingNumber} au nom de ${clientName}.`;
    return `https://wa.me/212681024758?text=${encodeURIComponent(rawText)}`;
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm mb-8 relative overflow-hidden transition-colors">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tp-cyan/10 border border-tp-cyan/20 text-tp-cyan dark:bg-tp-cyan/15 dark:text-tp-cyan text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? "فضاء المسافر" : "Espace Voyageur Certifié"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {isAr ? "حجوزاتي وتذاكر السفر" : "Mes Réservations & Billets"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
            {isAr
              ? "متابعة مباشرة لجميع حجوزاتك، تحميل تذاكر السفر وقسائم الحجز الرسمية ورمز QR للصعود إلى الحافلة."
              : "Retrouvez ici l'ensemble de vos circuits réservés, téléchargez vos vouchers et factures officielles avec QR Code d'embarquement."}
          </p>
        </div>

        {/* WhatsApp Assistance Button */}
        <a
          href="https://wa.me/212681024758?text=Bonjour%20Rahalat%20Bladna,%20je%20souhaite%20des%20renseignements%20sur%20mes%20r%C3%A9servations."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-emerald-500/20 transition-all active:scale-95 self-start md:self-auto shrink-0 relative z-10"
        >
          <MessageCircle className="w-4 h-4 fill-current" />
          <span>{isAr ? "المساعدة عبر واتساب" : "Support Client WhatsApp"}</span>
        </a>

        {/* Ambient Glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-tp-cyan/10 dark:bg-tp-cyan/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter Tabs */}
      <div className="bg-slate-200/60 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-300/60 dark:border-slate-800 inline-flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveFilter("ALL")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeFilter === "ALL"
              ? "bg-cyan-500 text-slate-950 font-bold shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800"
          }`}
        >
          {isAr ? "جميع الحجوزات" : "Toutes les réservations"} ({bookings.length})
        </button>
        <button
          onClick={() => setActiveFilter("UPCOMING")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeFilter === "UPCOMING"
              ? "bg-cyan-500 text-slate-950 font-bold shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800"
          }`}
        >
          {isAr ? "الرحلات القادمة" : "Départs à venir"}
        </button>
        <button
          onClick={() => setActiveFilter("PAID")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeFilter === "PAID"
              ? "bg-cyan-500 text-slate-950 font-bold shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800"
          }`}
        >
          {isAr ? "المؤكدة / الخالصة" : "Confirmées & Soldées"}
        </button>
        <button
          onClick={() => setActiveFilter("PENDING")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeFilter === "PENDING"
              ? "bg-cyan-500 text-slate-950 font-bold shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800"
          }`}
        >
          {isAr ? "في انتظار الدفع" : "En attente de paiement"}
        </button>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? "لا توجد حجوزات في هذا القسم" : "Aucune réservation trouvée"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {isAr
                ? "ابدأ باكتشاف رحلاتنا المنظمة واحجز مقعدك للمغامرة القادمة."
                : "Explorez nos circuits organisés au Maroc et réservez votre prochaine aventure."}
            </p>
          </div>
          <Link
            href={`/${locale}/trips`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-xs font-black transition shadow-sm"
          >
            <span>{isAr ? "استكشاف الرحلات" : "Découvrir les circuits"}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBookings.map((b) => {
            const trip = b.departure.trip;
            const invoiceNumber = b.invoices?.[0]?.invoiceNumber || `FAC-2026-${b.bookingNumber.replace(/\D/g, "").slice(-4) || "0042"}`;
            const isCancelled =
              b.bookingStatus === "CANCELLED" ||
              b.bookingStatus === "ANNULEE" ||
              cancelledBookingIds.has(b.id);
            const isDeparturePassed = new Date(b.departure.startDate) < new Date();

            return (
              <div
                key={b.id}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg overflow-hidden transition-all duration-300 flex flex-col lg:flex-row mb-6"
              >
                {/* Visual Trip Thumbnail & Dates */}
                <div className="lg:w-80 relative shrink-0 min-h-[220px] lg:min-h-full">
                  <img
                    src={trip.coverImageUrl || "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80"}
                    alt={trip.titleFr}
                    className="w-full h-full object-cover absolute inset-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/30" />
                  
                  {/* Floating Top Badge */}
                  <div className="absolute top-4 start-4">
                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-mono text-[11px] font-black border border-white/20 shadow-sm">
                      N° {b.bookingNumber}
                    </span>
                  </div>

                  {/* Floating Duration */}
                  <div className="absolute bottom-4 start-4 end-4 flex items-center justify-between text-xs text-white font-bold">
                    <span className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10">
                      <Clock className="w-3.5 h-3.5 text-tp-cyan" />
                      <span>{trip.durationDays}J / {trip.durationNights}N</span>
                    </span>
                    <span className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10">
                      <MapPin className="w-3.5 h-3.5 text-tp-cyan" />
                      <span>{trip.departureCity}</span>
                    </span>
                  </div>
                </div>

                {/* Booking Content Details */}
                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
                  {/* Top Bar: Title & Status */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {getStatusBadge(b)}
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {isAr ? `تاريخ الحجز: ${formatShortDate(b.createdAt)}` : `Réservé le ${formatShortDate(b.createdAt)}`}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white hover:text-tp-cyan transition">
                      <Link href={`/${locale}/trips/${trip.slug}`}>
                        {isAr ? trip.titleAr || trip.titleFr : trip.titleFr}
                      </Link>
                    </h2>

                    {/* Travel Dates */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 dark:text-slate-300 font-medium pt-1">
                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                        <Calendar className="w-4 h-4 text-tp-cyan shrink-0" />
                        <span>
                          {isAr
                            ? `من ${formatDate(b.departure.startDate)} إلى ${formatDate(b.departure.endDate)}`
                            : `Du ${formatDate(b.departure.startDate)} au ${formatDate(b.departure.endDate)}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Passengers details */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-tp-cyan" />
                        <span>{isAr ? `المسافرون (${b.passengers.length})` : `Passagers Enregistrés (${b.passengers.length})`}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                        {isAr ? "بيان النقل السياحي TIST" : "Feuille de route officielle"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {b.passengers.map((p, idx) => (
                        <div
                          key={p.id || idx}
                          className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between font-mono"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-5 h-5 rounded-full bg-tp-cyan/10 text-tp-cyan text-[10px] font-black flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-slate-900 dark:text-white font-sans font-bold truncate">{p.fullName}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 ps-2">
                            CIN: {p.cinOrPassport}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                        {isAr ? "المبلغ الإجمالي" : "Montant Total"}
                      </span>
                      <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
                        {b.totalAmount.toLocaleString("fr-MA")} <span className="text-xs text-tp-cyan">MAD</span>
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
                        {isAr ? "العربون المؤدى" : "Acompte Réglé"}
                      </span>
                      <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {b.paidAmount.toLocaleString("fr-MA")} <span className="text-xs">MAD</span>
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
                        {isAr ? "الباقي يوم الانطلاق" : "Solde Restant au Départ"}
                      </span>
                      <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                        {b.remainingBalance.toLocaleString("fr-MA")} <span className="text-xs">MAD</span>
                      </p>
                    </div>
                  </div>

                  {/* Banner Voyage Annulé */}
                  {isCancelled && (
                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-start gap-2.5 text-rose-900 dark:text-rose-200">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                        <div>
                          <p className="font-bold">
                            {isAr
                              ? `تم إلغاء هذا الحجز${b.cancelledAt ? ` بتاريخ ${formatDate(b.cancelledAt)}` : ""}.`
                              : `Ce voyage a été annulé${b.cancelledAt ? ` le ${formatDate(b.cancelledAt)}` : ""}.`}
                          </p>
                          <p className="text-[11px] text-rose-700 dark:text-rose-300">
                            {isAr
                              ? "تواصل مع خدمة العملاء عبر واتساب في حال وجود أي استفسار."
                              : "Contactez le support WhatsApp en cas de question."}
                          </p>
                          {b.cancellationReason && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                              <span className="font-semibold">{isAr ? "سبب الإلغاء : " : "Motif : "}</span>
                              {b.cancellationReason}
                            </p>
                          )}
                        </div>
                      </div>
                      <a
                        href={`https://wa.me/212681024758?text=${encodeURIComponent(
                          `Bonjour Rahalat Bladna, je vous contacte concernant l'annulation de ma réservation ${b.bookingNumber}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp Support</span>
                      </a>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Download PDF Voucher & Invoice Button */}
                      {isCancelled ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-805 text-slate-400 dark:text-slate-500 font-bold text-xs border border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed"
                          title={isAr ? "الحجز ملغى" : "Réservation annulée"}
                        >
                          <Download className="w-4 h-4" />
                          <span>{isAr ? "تحميل التذكرة والوصل PDF" : "Télécharger Voucher & Facture PDF"}</span>
                        </span>
                      ) : (
                        <InvoiceDownloadButton
                          invoiceNumber={invoiceNumber}
                          type={b.remainingBalance > 0 ? "FACTURE_ACOMPTE" : "FACTURE"}
                          label={isAr ? "تحميل التذكرة والوصل PDF" : "Télécharger Voucher & Facture PDF"}
                          variant="cyan"
                        />
                      )}

                      {/* Display QR Code Token */}
                      {isCancelled ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs border border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed"
                          title={isAr ? "الحجز ملغى" : "Réservation annulée"}
                        >
                          <QrCode className="w-4 h-4" />
                          <span>{isAr ? "رمز الصعود QR" : "QR Code Embarquement"}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedQrBooking(b)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 hover:border-tp-cyan/40 transition active:scale-95"
                        >
                          <QrCode className="w-4 h-4 text-tp-cyan" />
                          <span>{isAr ? "رمز الصعود QR" : "QR Code Embarquement"}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Submit Bank Receipt if pending */}
                      {!isCancelled && b.bookingStatus !== "FULLY_PAID" && b.paymentStatus !== "FULLY_PAID" && (
                        <button
                          type="button"
                          onClick={() => handleOpenReceiptModal(b)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-xs border border-amber-300 dark:border-amber-500/30 transition active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>
                            {b.bookingStatus === "PENDING_VERIFICATION" || b.payments?.some((p) => p.status === "EN_ATTENTE") || submittedReceiptBookingIds.has(b.id)
                              ? (isAr ? "تعديل وصل التحويل" : "Modifier le reçu")
                              : (isAr ? "إرسال وصل التحويل" : "Transmettre reçu")}
                          </span>
                        </button>
                      )}

                      {/* Bouton Annuler la réservation */}
                      {!isCancelled && !isDeparturePassed && (
                        <button
                          type="button"
                          onClick={() => setCancelModalBooking(b)}
                          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 text-xs font-semibold py-2 px-3.5 rounded-xl transition-all active:scale-95"
                          title={isAr ? "إلغاء هذا الحجز" : "Annuler la réservation"}
                        >
                          <span>{isAr ? "إلغاء الحجز" : "Annuler la réservation"}</span>
                        </button>
                      )}

                      {/* View Trip Program */}
                      <Link
                        href={`/${locale}/trips/${trip.slug}`}
                        className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition"
                      >
                        <span>{isAr ? "تفاصيل البرنامج" : "Voir le circuit"}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal QR Code */}
      {selectedQrBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 text-center relative">
            <button
              onClick={() => setSelectedQrBooking(null)}
              className="absolute top-4 end-4 p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-tp-cyan/10 text-tp-cyan flex items-center justify-center mx-auto">
              <Bus className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isAr ? "رمز الصعود إلى الحافلة" : "Pass Embarquement Digital"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? "قدّم هذا الرمز لمرافق الرحلة عند نقطة الانطلاق لتسجيل صعودك."
                  : "Présentez ce QR Code au Tour Leader ou Chauffeur lors de l'embarquement."}
              </p>
            </div>

            {/* QR Code Container */}
            <div className="p-4 rounded-2xl bg-white mx-auto inline-block shadow-sm border border-slate-200 dark:border-transparent">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `https://rahalatbladna.ma/verify/${selectedQrBooking.bookingNumber}`
                )}`}
                alt="QR Code"
                className="w-44 h-44 mx-auto"
              />
            </div>

            <div className="space-y-1">
              <p className="font-mono text-xs font-black text-tp-cyan">
                {selectedQrBooking.bookingNumber}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {selectedQrBooking.passengers.length} {isAr ? "مسافر(ين)" : "voyageur(s) enregistré(s)"}
              </p>
            </div>

            <button
              onClick={() => setSelectedQrBooking(null)}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs border border-slate-200 dark:border-slate-700 transition"
            >
              {isAr ? "إغلاق" : "Fermer"}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NOUVELLE MODALE : TRANSMETTRE UN REÇU DE VIREMENT (CIH BANK & R2 & WHATSAPP) */}
      {/* ========================================================================= */}
      {receiptModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-2xl space-y-6 relative my-auto max-h-[92vh] overflow-y-auto">
            {/* Bouton de Fermeture Claire en Haut à Droite */}
            <button
              type="button"
              onClick={() => setReceiptModalBooking(null)}
              className="absolute top-5 end-5 p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition z-20"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* En-tête de la Modale */}
            <div className="space-y-1.5 pe-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-500/20 text-[10px] font-bold">
                <CreditCard className="w-3 h-3" />
                <span>Réf. Dossier : {receiptModalBooking.bookingNumber}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {isAr ? "إرسال وصل التحويل البنكي" : "Transmettre un reçu de virement"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? "أرسل إشعار التحويل البنكي عبر واتساب أو ارفعه مباشرة لتأكيد حجزك رسمياً."
                  : "Effectuez votre virement vers le compte CIH officiel ci-dessous, puis transmettez votre reçu pour validation comptable."}
              </p>
            </div>

            {/* 1. CARTE BANCAIRE VISUELLE ÉLÉGANTE (MIDNIGHT & CYAN) */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B2239] via-[#0B2239] to-[#087C89] border border-tp-cyan/30 p-5 text-white shadow-xl space-y-4">
              {/* Éléments visuels d'accentuation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/15 text-[11px] font-black tracking-wider text-tp-cyan">
                    CIH BANK
                  </div>
                  <span className="text-[10px] text-slate-300 font-bold uppercase">Compte Officiel</span>
                </div>
                <div className="w-7 h-5 rounded bg-amber-400/80 border border-amber-300/60 shadow-sm flex items-center justify-center opacity-90">
                  <div className="w-5 h-3 border border-amber-800/40 rounded-sm" />
                </div>
              </div>

              {/* Titulaire & RIB */}
              <div className="space-y-2">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-300 tracking-wider">
                    {isAr ? "المستفيد" : "Bénéficiaire"}
                  </span>
                  <p className="text-xs sm:text-sm font-black text-white tracking-wide">
                    MOHAMMED AMINE CHAIBAR
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-slate-300 tracking-wider">
                      {isAr ? "رقم الحساب (24 رقماً)" : "RIB Officiel (24 chiffres)"}
                    </span>
                    <span className="text-[9px] text-tp-cyan font-bold">Agence 081</span>
                  </div>
                  <p className="text-xs sm:text-sm font-mono font-black text-tp-cyan tracking-wider break-all select-all pt-0.5">
                    230 810 6784594211008100 80
                  </p>
                  <p className="text-[10px] font-mono text-slate-300/80 pt-0.5">
                    IBAN : MA64 2308 1067 8459 4211 0081 0080
                  </p>
                </div>
              </div>

              {/* Bouton Rapide Copier le RIB */}
              <div className="pt-1 flex items-center justify-between gap-3 border-t border-white/10">
                <p className="text-[10px] text-slate-300">
                  {isAr ? "انسخ الرقم واستعمله في تطبيقك البنكي" : "Copiez pour votre application CIH Mobile"}
                </p>
                <button
                  type="button"
                  onClick={handleCopyRib}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                    copiedRib
                      ? "bg-emerald-500 text-slate-950 font-black"
                      : "bg-slate-950/70 hover:bg-slate-950 text-tp-cyan border border-tp-cyan/40"
                  }`}
                >
                  {copiedRib ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{isAr ? "تم النسخ !" : "Copié !"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isAr ? "نسخ RIB" : "Copier le RIB"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 2. OPTION RAPIDE : BOUTON DIRECT WHATSAPP */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{isAr ? "الخيار الأسرع : واتساب" : "Option Rapide Recommandée"}</span>
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400/80 font-mono">+212 681-024758</span>
              </div>

              <a
                href={getWhatsAppUrl(receiptModalBooking)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 active:scale-95"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>
                  {isAr
                    ? "إرسال التوصيل مباشرة عبر واتساب"
                    : "Envoyer la capture directement sur WhatsApp"}
                </span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </a>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
                {isAr
                  ? "سيتم فتح محادثة برقم حجزك مباشرة لتأكيد فوري من فريق المحاسبة."
                  : "Le message s'ouvre pré-rempli avec votre référence dossier pour validation en direct."}
              </p>
            </div>

            {/* Séparateur */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider shrink-0">
                {isAr ? "أو رفع الوصل في الموقع" : "Ou téléversement sur le site"}
              </span>
            </div>

            {/* Notification de Succès */}
            {receiptSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-center space-y-2 animate-in fade-in">
                <CheckCircle2 className="w-9 h-9 mx-auto text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {isAr ? "تم إرسال وصل التحويل بنجاح !" : "Reçu de virement transmis avec succès !"}
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300/80 max-w-sm mx-auto">
                  {isAr
                    ? "ملفك الآن في طور التحقق المحاسبي. ستصلك رسالة تأكيد عند اكتمال التحقق."
                    : "Votre justificatif a été stocké sur Cloudflare R2. Votre dossier est désormais en cours de validation par notre service comptabilité."}
                </p>
              </div>
            ) : (
              /* FORMULAIRE D'UPLOAD CLOUDFLARE R2 */
              <form onSubmit={handleSendReceipt} className="space-y-4">
                {/* Zone de Drag & Drop */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? "صورة أو ملف إشعار التحويل *" : "Justificatif de virement (JPG, PNG, PDF) *"}
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {!selectedFile ? (
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2.5 ${
                        dragActive
                          ? "border-tp-cyan bg-tp-cyan/10"
                          : "border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-950/50"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                        <UploadCloud className="w-5 h-5 text-tp-cyan" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">
                          {isAr ? "اسحب وأفلت صورة الوصل هنا" : "Glissez-déposez la capture de votre reçu ici"}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {isAr ? "أو اضغط لتصفح ملفاتك (الصور أو PDF)" : "ou cliquez pour parcourir vos fichiers (JPG, PNG, PDF)"}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        Taille maximale : 10 Mo
                      </span>
                    </div>
                  ) : (
                    /* Prévisualisation immédiate et Statut R2 */
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {filePreview ? (
                            <img
                              src={filePreview}
                              alt="Preview"
                              className="w-12 h-12 object-cover rounded-xl border border-slate-300 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-tp-cyan shrink-0">
                              <FileText className="w-6 h-6" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {selectedFile.name}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Supprimer le fichier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Barre de progression pendant l'upload R2 */}
                      {isUploadingR2 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1.5">
                              <Loader2 className="w-3 h-3 animate-spin text-tp-cyan" />
                              <span>{isAr ? "جاري الرفع إلى السحابة..." : "Téléversement sécurisé Cloudflare R2..."}</span>
                            </span>
                            <span className="font-mono text-tp-cyan font-bold">{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-tp-cyan to-emerald-400 h-1.5 transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Succès Upload Cloudflare R2 */}
                      {uploadedReceiptUrl && !isUploadingR2 && (
                        <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            {isAr ? "تم حفظ الملف بنجاح في الخادم السحابي" : "Fichier prêt et sécurisé sur Cloudflare R2"}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message d'erreur d'upload */}
                  {uploadError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>

                {/* Champ Remarques Éventuelles */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? "ملاحظات إضافية (اختياري)" : "Remarques éventuelles (Optionnel)"}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      isAr
                        ? "مثال: تم التحويل من تطبيق CIH باسم محمد..."
                        : "Ex: Virement émis depuis mon compte CIH Mobile à 14h..."
                    }
                    value={receiptNotes}
                    onChange={(e) => setReceiptNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-tp-cyan focus:outline-none"
                  />
                </div>

                {/* Boutons d'Action de Soumission */}
                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={!uploadedReceiptUrl || isSubmittingReceipt || isUploadingR2}
                    className="flex-1 py-3 rounded-xl bg-tp-cyan hover:bg-tp-cyan-hover text-slate-950 font-black text-xs shadow-md shadow-tp-cyan/20 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmittingReceipt ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isAr ? "جاري الحفظ..." : "Enregistrement en cours..."}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{isAr ? "تأكيد إرسال الوصل" : "Transmettre le reçu"}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setReceiptModalBooking(null)}
                    className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition"
                  >
                    {isAr ? "إلغاء" : "Annuler"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modale de Confirmation d'Annulation de Réservation */}
      {cancelModalBooking && (
        <CancelBookingModal
          booking={cancelModalBooking}
          isAr={isAr}
          onClose={() => setCancelModalBooking(null)}
          onSuccess={handleCancelSuccess}
        />
      )}
    </div>
  );
}
