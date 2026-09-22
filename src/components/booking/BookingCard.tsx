"use client";

import React, { useState, useTransition, useId } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { 
  Calendar, Users, MapPin, BedDouble, 
  CreditCard, CheckCircle2, ShieldCheck, AlertCircle, Sparkles, 
  ArrowRight, Minus, Plus, Train, Bus, Clock, Check, FileText,
  ChevronRight, ArrowLeft
} from "lucide-react";
import { PickupPointDto, AddonDto, PassengerSubmission } from "@/types";
import { formatMAD } from "@/lib/utils";
import { InvoiceDownloadButton } from "@/components/invoices/InvoiceDownloadButton";
import { createBookingAction } from "@/actions/booking.actions";
import { trackClientMetaEvent, generateMetaEventId } from "@/lib/meta-client";

export interface BookingDepartureDateDto {
  id: string;
  startDate: string;
  endDate: string;
  status?: string;
  availableSeats?: number;
  price?: number;
  priceOverride?: number | null;
}

export interface BookingCardProps {
  tripId?: string;
  tripTitle: string;
  departureDateId?: string;
  basePrice?: number;
  singleSupplement?: number;
  depositPerPerson?: number;
  pickupPoints?: PickupPointDto[];
  availableAddons?: AddonDto[];
  addons?: AddonDto[];
  dates?: BookingDepartureDateDto[];
  onCompleteBooking?: (data: any) => void;
}

/**
 * Formate proprement une plage de dates en français, arabe ou anglais.
 * Ex: "Du 15 au 17 Septembre 2026"
 */
export function formatReadableDateRange(startStr: string, endStr: string, locale: string): string {
  if (!startStr) return "";
  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : start;

  if (isNaN(start.getTime())) {
    return `${startStr} → ${endStr}`;
  }

  const isSameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const isSameDay = start.getTime() === end.getTime();

  if (locale === "ar") {
    const monthsAr = [
      "يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو",
      "يوليوز", "غشت", "شتنبر", "أكتوبر", "نونبر", "دجنبر"
    ];
    if (isSameDay) {
      return `${start.getDate()} ${monthsAr[start.getMonth()]} ${start.getFullYear()}`;
    }
    if (isSameMonth) {
      return `من ${start.getDate()} إلى ${end.getDate()} ${monthsAr[start.getMonth()]} ${start.getFullYear()}`;
    }
    return `من ${start.getDate()} ${monthsAr[start.getMonth()]} إلى ${end.getDate()} ${monthsAr[end.getMonth()]} ${end.getFullYear()}`;
  }

  const monthsFr = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  if (isSameDay) {
    return `Le ${start.getDate()} ${monthsFr[start.getMonth()]} ${start.getFullYear()}`;
  }
  if (isSameMonth) {
    return `Du ${start.getDate()} au ${end.getDate()} ${monthsFr[start.getMonth()]} ${start.getFullYear()}`;
  }
  return `Du ${start.getDate()} ${monthsFr[start.getMonth()]} au ${end.getDate()} ${monthsFr[end.getMonth()]} ${end.getFullYear()}`;
}

export function BookingCard({
  tripId = "trip-default",
  tripTitle,
  departureDateId,
  basePrice = 0,
  singleSupplement = 350,
  depositPerPerson = 400,
  pickupPoints = [],
  availableAddons = [],
  addons = [],
  dates = [],
  onCompleteBooking,
}: BookingCardProps) {
  const addonsList = availableAddons.length > 0 ? availableAddons : addons;
  const t = useTranslations("booking");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [isPending, startTransition] = useTransition();

  const baseTripPrice = Number(basePrice || 0);

  // Points de ramassage avec valeurs par défaut élégantes (Gares marocaines) si non renseignés
  const effectivePickupPoints: PickupPointDto[] = pickupPoints.length > 0 ? pickupPoints : [
    {
      id: "pickup-casa",
      locationName: isRtl ? "محطة القطار الدار البيضاء المسافرين" : "Gare Casablanca-Voyageurs",
      cityName: isRtl ? "الدار البيضاء" : "Casablanca",
      departureTime: "05h30",
    },
    {
      id: "pickup-rabat",
      locationName: isRtl ? "محطة القطار الرباط أكدال" : "Gare Rabat-Agdal",
      cityName: isRtl ? "الرباط" : "Rabat",
      departureTime: "06h45",
    },
    {
      id: "pickup-kenitra",
      locationName: isRtl ? "محطة القطار القنيطرة / فاس" : "Gare Kénitra / Fès",
      cityName: isRtl ? "القنيطرة / فاس" : "Kénitra / Fès",
      departureTime: "08h00",
    },
  ];

  // Dates par défaut réalistes si la liste est vide
  const effectiveDates: BookingDepartureDateDto[] = dates.length > 0 ? dates : [
    {
      id: "date-sept-1",
      startDate: "2026-09-18",
      endDate: "2026-09-20",
      status: "GUARANTEED",
      availableSeats: 24,
      price: baseTripPrice,
      priceOverride: null,
    },
    {
      id: "date-sept-2",
      startDate: "2026-09-25",
      endDate: "2026-09-27",
      status: "OPEN_FOR_BOOKING",
      availableSeats: 6,
      price: baseTripPrice,
      priceOverride: null,
    },
    {
      id: "date-oct-1",
      startDate: "2026-10-02",
      endDate: "2026-10-04",
      status: "GUARANTEED",
      availableSeats: 18,
      price: baseTripPrice,
      priceOverride: null,
    },
  ];

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [passengerCount, setPassengerCount] = useState<number>(2);
  const [selectedDateId, setSelectedDateId] = useState<string>(departureDateId || effectiveDates[0]?.id || "");
  const [selectedPickup, setSelectedPickup] = useState<string>(effectivePickupPoints[0]?.id || "");

  // Étape 2: Passagers
  const [passengers, setPassengers] = useState<PassengerSubmission[]>([
    {
      fullName: "",
      cinOrPassport: "",
      nationality: isRtl ? "مغربية" : "Marocaine",
      phone: "",
      gender: "M",
      roomType: "DOUBLE_TWIN",
      pickupPointId: effectivePickupPoints[0]?.id || "",
    },
    {
      fullName: "",
      cinOrPassport: "",
      nationality: isRtl ? "مغربية" : "Marocaine",
      phone: "",
      gender: "F",
      roomType: "DOUBLE_TWIN",
      pickupPointId: effectivePickupPoints[0]?.id || "",
    },
  ]);

  // Étape 3 & 4: Options & Paiement
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});
  const [paymentOption, setPaymentOption] = useState<"DEPOSIT" | "FULL">("DEPOSIT");
  const [paymentMethod, setPaymentMethod] = useState<"CMI_CARD" | "BANK_TRANSFER">("BANK_TRANSFER");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [bookingResult, setBookingResult] = useState<{
    reference: string;
    invoiceNumber: string;
    quoteNumber: string;
    amountPaid: number;
    balanceDue: number;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Synchronisation dynamique du nombre de passagers
  const handlePassengerCountChange = (count: number) => {
    const validCount = Math.max(1, Math.min(20, count));
    setPassengerCount(validCount);
    const updated = [...passengers];
    if (validCount > updated.length) {
      for (let i = updated.length; i < validCount; i++) {
        updated.push({
          fullName: "",
          cinOrPassport: "",
          nationality: isRtl ? "مغربية" : "Marocaine",
          phone: "",
          gender: "M",
          roomType: "DOUBLE_TWIN",
          pickupPointId: selectedPickup,
        });
      }
    } else {
      updated.splice(validCount);
    }
    setPassengers(updated);
  };

  // Date sélectionnée actuelle
  const selectedDateObj = effectiveDates.find((d) => d.id === selectedDateId) || effectiveDates[0];
  
  // Correction stricte de la discordance de prix :
  // 1. baseTripPrice (prix du circuit) est la référence principale
  // 2. Si un override explicite existe sur la date (priceOverride), on l'utilise
  // 3. Sinon, on utilise le prix de base du circuit (baseTripPrice)
  const activeBasePrice = selectedDateObj?.priceOverride != null && Number(selectedDateObj.priceOverride) > 0
    ? Number(selectedDateObj.priceOverride)
    : (baseTripPrice > 0 ? baseTripPrice : Number(selectedDateObj?.price || 0));

  // Calcul financier dynamique
  const calculateTotal = () => {
    let total = passengerCount * activeBasePrice;
    
    // Suppléments Single
    passengers.forEach((p) => {
      if (p.roomType === "SINGLE") {
        total += singleSupplement;
      }
    });

    // Extras sélectionnés
    Object.entries(selectedAddons).forEach(([addonId, qty]) => {
      const addon = addonsList.find((a) => a.id === addonId);
      if (addon && qty > 0) {
        total += addon.price * qty;
      }
    });

    const depositTotal = passengerCount * depositPerPerson;
    const amountToPayNow = paymentOption === "DEPOSIT" ? depositTotal : total;
    const remainingBalance = Math.max(0, total - amountToPayNow);

    return { total, depositTotal, amountToPayNow, remainingBalance };
  };

  const financials = calculateTotal();

  // Soumission de réservation finale
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validation des passagers à l'étape 4
    for (let i = 0; i < passengers.length; i++) {
      if (!passengers[i].fullName.trim()) {
        setSubmitError(isRtl ? `يرجى إدخال اسم المسافر رقم ${i + 1}` : `Veuillez renseigner le nom complet du voyageur ${i + 1}.`);
        setStep(2);
        return;
      }
      if (!passengers[i].cinOrPassport.trim()) {
        setSubmitError(isRtl ? `يرجى إدخال رقم بطاقة التعريف أو الجواز للمسافر ${i + 1}` : `Le N° CIN ou Passeport est obligatoire pour le voyageur ${i + 1} (Exigences TIST).`);
        setStep(2);
        return;
      }
    }

    startTransition(async () => {
      try {
        // 1. Génération d'un eventId unique partagé pour déduplication stricte Meta Pixel Client <-> CAPI Serveur
        const checkoutEventId = generateMetaEventId("rb_checkout");

        // 2. Déclenchement simultané de l'événement InitiateCheckout côté client
        trackClientMetaEvent(
          "InitiateCheckout",
          {
            content_name: tripTitle || "Circuit Rahalat Bladna",
            content_category: "Circuit Touristique",
            content_ids: [tripId],
            contents: [
              {
                id: tripId,
                quantity: passengers.length,
                item_price: activeBasePrice,
              },
            ],
            currency: "MAD",
            value: financials.total,
            num_items: passengers.length,
          },
          checkoutEventId
        );

        const payload = {
          tripId,
          departureDateId: selectedDateId || undefined,
          travelers: passengers.map((p) => ({
            fullName: p.fullName,
            cinPassport: p.cinOrPassport,
            phone: p.phone || undefined,
            email: p.email || undefined,
            category: "ADULTE" as const,
          })),
          selectedAddons,
          paymentOption,
          paymentMethod: paymentMethod === "BANK_TRANSFER" ? ("VIREMENT" as const) : ("CARTE" as const),
          eventId: checkoutEventId,
        };

        const res = await createBookingAction(payload);
        if (res.success && "reference" in res && res.reference) {
          // 3. Déclenchement de l'événement Lead côté client après validation
          const leadEventId = `lead_${res.reference}`;
          trackClientMetaEvent(
            "Lead",
            {
              content_name: tripTitle || "Circuit Rahalat Bladna",
              currency: "MAD",
              value: financials.total,
              order_id: res.reference,
              num_items: passengers.length,
            },
            leadEventId
          );

          setIsSubmitted(true);
          setBookingResult({
            reference: res.reference,
            invoiceNumber: res.invoiceNumber || "",
            quoteNumber: res.quoteNumber || "",
            amountPaid: res.amountPaid || 0,
            balanceDue: res.balanceDue || 0,
          });
          if (onCompleteBooking) onCompleteBooking(res);
        } else {
          setSubmitError(res.error || (isRtl ? "فشل إنشاء الحجز" : "Une erreur est survenue lors de la réservation."));
        }
      } catch (err: any) {
        setSubmitError(err?.message || "Erreur technique lors de la validation.");
      }
    });
  };

  // Scroll vers le widget sur mobile
  const handleScrollToWidget = () => {
    const el = document.getElementById("booking-card-widget");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Écran de Succès
  if (isSubmitted && bookingResult) {
    return (
      <div 
        id="booking-card-widget"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl p-6 sm:p-7 text-center space-y-5 animate-in fade-in"
      >
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="text-[11px] uppercase tracking-wider font-black text-tp-cyan font-mono">
            {bookingResult.reference}
          </span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            {isRtl ? "تم تسجيل حجزك بنجاح !" : "Réservation Enregistrée !"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {isRtl
              ? "تم إرسال قسيمة الحجز وتفاصيل التحويل البنكي إلى حسابك مباشرة."
              : "Votre dossier est créé. Retrouvez votre billet d'embarquement et votre voucher dans votre espace voyageur."}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2 text-start font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">{isRtl ? "المبلغ الإجمالي :" : "Total du voyage :"}</span>
            <span className="font-bold text-slate-900 dark:text-white">{formatMAD(financials.total, locale)}</span>
          </div>
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
            <span className="font-bold">{isRtl ? "التسبيق المؤدى / المستحق :" : "Acompte :"}</span>
            <span className="font-black">{formatMAD(bookingResult.amountPaid, locale)}</span>
          </div>
          <div className="flex justify-between text-amber-600 dark:text-amber-400">
            <span>{isRtl ? "الباقي عند الانطلاق :" : "Solde au départ :"}</span>
            <span className="font-bold">{formatMAD(bookingResult.balanceDue, locale)}</span>
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          <InvoiceDownloadButton
            invoiceNumber={bookingResult.invoiceNumber}
            type="FACTURE_ACOMPTE"
            label={isRtl ? "تحميل التذكرة والوصل PDF" : "Télécharger Voucher & Reçu PDF"}
            variant="cyan"
          />

          <Link
            href={`/${locale}/mon-compte/reservations`}
            className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-900 dark:text-white text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <span>{isRtl ? "عرض في فضاء المسافر" : "Consulter mon espace voyageur"}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        id="booking-card-widget"
        className="sticky top-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl p-6 sm:p-7 space-y-6 transition-colors"
      >
        {/* ========================================================================= */}
        {/* A. EN-TÊTE DE LA CARTE                                                    */}
        {/* ========================================================================= */}
        <div className="space-y-3 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wide bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isRtl ? "100% انطلاقات مضمونة" : "100% Départs Garantis"}</span>
            </span>

            {step > 1 && (
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {isRtl ? `المرحلة ${step} من 4` : `Étape ${step} sur 4`}
              </span>
            )}
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {step === 1 ? (isRtl ? "احجز مقاعدك الآن" : "Réservez vos places") : tripTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-tp-cyan shrink-0" />
              <span>{isRtl ? "تأكيد فوري وتسبيق آمن 100%" : "Confirmation instantanée & acompte sécurisé"}</span>
            </p>
          </div>

          {/* Affichage du prix */}
          <div className="pt-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {activeBasePrice.toLocaleString("fr-MA")} <span className="text-base font-bold text-tp-cyan">MAD</span>
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ps-1.5">
                {isRtl ? "/ للمسافر" : "/ personne"}
              </span>
            </div>

            <div className="text-end">
              <span className="inline-block px-2.5 py-1 rounded-xl bg-tp-cyan/10 text-tp-cyan text-[11px] font-bold border border-tp-cyan/20">
                {isRtl ? `التسبيق : ${depositPerPerson} درهم` : `Acompte : ${depositPerPerson} MAD / pers`}
              </span>
            </div>
          </div>
        </div>

        {/* Message d'erreur éventuel */}
        {submitError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ÉTAPE 1 : SÉLECTION DATE, NOMBRE DE VOYAGEURS ET POINT DE RAMASSAGE       */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-6">
            {/* 1. Sélection de la Date de Départ */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-tp-cyan" />
                <span>{isRtl ? "اختر تاريخ الانطلاق" : "Choisissez votre date de départ"}</span>
              </label>

              <div className="grid grid-cols-1 gap-2">
                {effectiveDates.map((d) => {
                  const isSelected = selectedDateId === d.id;
                  const readableDate = formatReadableDateRange(d.startDate, d.endDate, locale);
                  const isLowSeats = typeof d.availableSeats === "number" && d.availableSeats <= 8;

                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDateId(d.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? "border-tp-cyan bg-cyan-50/70 dark:bg-cyan-950/30 ring-1 ring-tp-cyan/50 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-100/70 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Custom Radio Circle */}
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? "border-tp-cyan bg-tp-cyan" : "border-slate-400 dark:border-slate-600"
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        </div>

                        <div className="min-w-0">
                          <p className={`text-xs sm:text-sm font-bold truncate ${
                            isSelected ? "text-slate-900 dark:text-white" : "text-slate-800 dark:text-slate-200"
                          }`}>
                            {readableDate}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {d.startDate} → {d.endDate}
                          </p>
                        </div>
                      </div>

                      {/* Badge de disponibilité */}
                      <div className="shrink-0">
                        {isLowSeats ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{isRtl ? `آخر المقاعد (${d.availableSeats})` : `Dernières places (${d.availableSeats})`}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            <span>{isRtl ? "مقاعد متوفرة" : "Places disponibles"}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Nombre de Voyageurs (Compteur Ergonomique [-] [N] [+]) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-tp-cyan" />
                  <span>{isRtl ? "عدد المسافرين" : "Nombre de voyageurs"}</span>
                </label>
                <span className="text-xs font-bold text-tp-cyan">
                  {passengerCount} {passengerCount > 1 ? (isRtl ? "مسافرين" : "voyageurs") : (isRtl ? "مسافر" : "voyageur")}
                </span>
              </div>

              {/* Compteur tactile central */}
              <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handlePassengerCountChange(passengerCount - 1)}
                  disabled={passengerCount <= 1}
                  className="w-12 h-12 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 hover:border-tp-cyan text-slate-900 dark:text-white font-black text-lg flex items-center justify-center transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  aria-label="Diminuer"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="text-center px-4">
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {passengerCount}
                  </span>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {passengerCount > 1 ? (isRtl ? "مسافرين" : "voyageurs") : (isRtl ? "مسافر" : "voyageur")}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handlePassengerCountChange(passengerCount + 1)}
                  disabled={passengerCount >= 20}
                  className="w-12 h-12 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 hover:border-tp-cyan text-slate-900 dark:text-white font-black text-lg flex items-center justify-center transition active:scale-95 disabled:opacity-40 shadow-sm"
                  aria-label="Augmenter"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Pastilles tactiles rapides min-h-[44px] */}
              <div className="grid grid-cols-6 gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((num) => {
                  const isCurrent = passengerCount === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handlePassengerCountChange(num)}
                      className={`min-h-[44px] rounded-xl font-mono text-xs font-black transition-all flex items-center justify-center active:scale-95 ${
                        isCurrent
                          ? "bg-tp-cyan text-slate-950 shadow-md shadow-tp-cyan/20 ring-2 ring-tp-cyan"
                          : "bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Sélection du Point de Ramassage */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-tp-cyan" />
                <span>{isRtl ? "نقطة الانطلاق والتجمع" : "Point de ramassage"}</span>
              </label>

              <div className="space-y-2">
                {effectivePickupPoints.map((pickup) => {
                  const isSelected = selectedPickup === pickup.id;
                  const isTrain = pickup.locationName.toLowerCase().includes("gare") || pickup.locationName.includes("محطة");

                  return (
                    <div
                      key={pickup.id}
                      onClick={() => setSelectedPickup(pickup.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? "border-tp-cyan bg-cyan-50/70 dark:bg-cyan-950/30 ring-1 ring-tp-cyan/50 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-100/70 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Icon Station / Car */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-tp-cyan/20 text-tp-cyan border border-tp-cyan/30"
                            : "bg-slate-200/60 dark:bg-slate-800 text-slate-500"
                        }`}>
                          {isTrain ? <Train className="w-4 h-4" /> : <Bus className="w-4 h-4" />}
                        </div>

                        <div className="min-w-0">
                          <p className={`text-xs sm:text-sm font-bold truncate ${
                            isSelected ? "text-slate-900 dark:text-white" : "text-slate-800 dark:text-slate-200"
                          }`}>
                            {pickup.locationName}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {pickup.cityName}
                          </p>
                        </div>
                      </div>

                      {/* Horaire de passage */}
                      <div className="shrink-0 text-end">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold">
                          {pickup.departureTime || "06h30"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ÉTAPE 2 : IDENTITÉ DES VOYAGEURS (CIN & CHAMBRES)                         */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-tp-cyan" />
                <span>{isRtl ? "بيانات المسافرين (وفق بطاقة التعريف)" : "Détails des passagers (CIN & Chambres)"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-tp-cyan hover:underline"
              >
                {isRtl ? "تعديل العدد" : "Modifier"}
              </button>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pe-1">
              {passengers.map((p, idx) => (
                <div 
                  key={idx} 
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-tp-cyan uppercase">
                      {isRtl ? `المسافر رقم ${idx + 1}` : `Voyageur ${idx + 1}`}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {idx === 0 ? (isRtl ? "المسافر الرئيسي" : "Contact Principal") : ""}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder={isRtl ? "الاسم الكامل (وفق البطاقة الوطنية) *" : "Nom et Prénom (selon CIN) *"}
                      value={p.fullName}
                      onChange={(e) => {
                        const copy = [...passengers];
                        copy[idx].fullName = e.target.value;
                        setPassengers(copy);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-tp-cyan focus:outline-none"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder={isRtl ? "رقم ب.ت.و أو الجواز *" : "N° CIN ou Passeport *"}
                        value={p.cinOrPassport}
                        onChange={(e) => {
                          const copy = [...passengers];
                          copy[idx].cinOrPassport = e.target.value.toUpperCase();
                          setPassengers(copy);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono placeholder:text-slate-400 focus:border-tp-cyan focus:outline-none"
                      />

                      <input
                        type="tel"
                        placeholder={isRtl ? "الهاتف المحمول *" : "Téléphone mobile *"}
                        value={p.phone || ""}
                        onChange={(e) => {
                          const copy = [...passengers];
                          copy[idx].phone = e.target.value;
                          setPassengers(copy);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-tp-cyan focus:outline-none"
                      />
                    </div>

                    {/* Email du voyageur principal pour réception de la facture / reçu */}
                    {idx === 0 && (
                      <input
                        type="email"
                        placeholder={isRtl ? "البريد الإلكتروني لاستلام التذكرة والفاتورة *" : "Email pour recevoir le reçu et la facture *"}
                        value={p.email || ""}
                        onChange={(e) => {
                          const copy = [...passengers];
                          copy[idx].email = e.target.value;
                          setPassengers(copy);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-tp-cyan focus:outline-none"
                      />
                    )}

                    {/* Préférence de Chambre */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        {isRtl ? "نوع الغرفة المفضل :" : "Type de chambre préféré :"}
                      </label>
                      <select
                        value={p.roomType}
                        onChange={(e) => {
                          const copy = [...passengers];
                          copy[idx].roomType = e.target.value as any;
                          setPassengers(copy);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:border-tp-cyan focus:outline-none"
                      >
                        <option value="DOUBLE_TWIN">{isRtl ? "غرفة مزدوجة (سريران منفصلان)" : "Chambre Double (2 lits séparés)"}</option>
                        <option value="DOUBLE_MATRIMONIAL">{isRtl ? "غرفة مزدوجة (سرير كبير للأزواج)" : "Chambre Double (Grand lit couple)"}</option>
                        <option value="TRIPLE">{isRtl ? "غرفة ثلاثية (3 أسرة)" : "Chambre Triple (3 lits)"}</option>
                        <option value="SINGLE">{isRtl ? `غرفة فردية (+${singleSupplement} درهم)` : `Chambre Single Individuelle (+${singleSupplement} MAD)`}</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ÉTAPE 3 : OPTIONS & EXTRAS                                                */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Sparkles className="w-4 h-4 text-tp-cyan" />
              <span>{isRtl ? "الأنشطة والخيارات الإضافية" : "Activités et options supplémentaires"}</span>
            </h3>

            {addonsList.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">
                {isRtl ? "جميع الأنشطة مدمجة ضمن البرنامج." : "Toutes les activités principales sont déjà incluses dans ce circuit."}
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pe-1">
                {addonsList.map((addon) => {
                  const qty = selectedAddons[addon.id] || 0;
                  return (
                    <div
                      key={addon.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {addon.name}
                        </p>
                        <p className="text-[10px] text-tp-cyan font-bold font-mono">
                          +{addon.price} MAD
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAddons((prev) => ({
                              ...prev,
                              [addon.id]: Math.max(0, qty - 1),
                            }));
                          }}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold hover:border-tp-cyan"
                        >
                          -
                        </button>
                        <span className="text-xs font-mono font-bold w-4 text-center">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAddons((prev) => ({
                              ...prev,
                              [addon.id]: qty + 1,
                            }));
                          }}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold hover:border-tp-cyan"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ÉTAPE 4 : PAIEMENT ET VALIDATION                                         */}
        {/* ========================================================================= */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <CreditCard className="w-4 h-4 text-tp-cyan" />
              <span>{isRtl ? "طريقة الأداء والتأكيد" : "Modalités de règlement & Acompte"}</span>
            </h3>

            {/* Option Acompte vs Intégral */}
            <div className="grid grid-cols-2 gap-2">
              <div
                onClick={() => setPaymentOption("DEPOSIT")}
                className={`p-3 rounded-2xl border cursor-pointer transition text-center ${
                  paymentOption === "DEPOSIT"
                    ? "border-tp-cyan bg-cyan-50/70 dark:bg-cyan-950/30 font-bold"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400"
                }`}
              >
                <p className="text-xs font-black text-slate-900 dark:text-white">
                  {isRtl ? "أداء التسبيق فقط" : "Acompte Requis"}
                </p>
                <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                  {formatMAD(financials.depositTotal, locale)}
                </p>
              </div>

              <div
                onClick={() => setPaymentOption("FULL")}
                className={`p-3 rounded-2xl border cursor-pointer transition text-center ${
                  paymentOption === "FULL"
                    ? "border-tp-cyan bg-cyan-50/70 dark:bg-cyan-950/30 font-bold"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400"
                }`}
              >
                <p className="text-xs font-black text-slate-900 dark:text-white">
                  {isRtl ? "أداء 100% كاملاً" : "100% Intégral"}
                </p>
                <p className="text-[11px] font-mono text-tp-cyan font-bold mt-0.5">
                  {formatMAD(financials.total, locale)}
                </p>
              </div>
            </div>

            {/* Mode de règlement */}
            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {isRtl ? "طريقة التحويل :" : "Moyen de paiement :"}
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("BANK_TRANSFER")}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    paymentMethod === "BANK_TRANSFER"
                      ? "border-tp-cyan bg-cyan-500 text-slate-950 font-black shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isRtl ? "تحويل بنكي (CIH)" : "Virement CIH Bank"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("CMI_CARD")}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    paymentMethod === "CMI_CARD"
                      ? "border-tp-cyan bg-cyan-500 text-slate-950 font-black shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isRtl ? "بطاقة بنكية (CMI)" : "Carte Bancaire CMI"}</span>
                </button>
              </div>

              {paymentMethod === "BANK_TRANSFER" && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {isRtl ? "الحساب الرسمي لوكالة رحلات بلادنا :" : "Coordonnées bancaires officielles (CIH Bank) :"}
                  </p>
                  <p className="font-mono text-[11px] text-tp-cyan bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 select-all">
                    RIB : 230 810 6784594211008100 80
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Bénéficiaire : MOHAMMED AMINE CHAIBAR (Rahalat Bladna)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* E. BLOC RÉCAPITULATIF FINANCIER & CTA                                     */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              {isRtl ? "المبلغ الإجمالي للرحلة :" : "Montant Total du Voyage :"}
            </span>
            <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
              {financials.total.toLocaleString("fr-MA")} MAD
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/80 dark:border-slate-800/80">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {isRtl ? "التسبيق الواجب أداؤه اليوم :" : "Acompte à régler aujourd'hui :"}
            </span>
            <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400">
              {financials.amountToPayNow.toLocaleString("fr-MA")} MAD
            </span>
          </div>

          {financials.remainingBalance > 0 && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {isRtl ? "الرصيد المتبقي يوم الانطلاق :" : "Solde restant au départ :"}
              </span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {financials.remainingBalance.toLocaleString("fr-MA")} MAD
              </span>
            </div>
          )}
        </div>

        {/* Boutons d'Action */}
        <div className="space-y-2 pt-1">
          {step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-base shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span>{isRtl ? "متابعة الحجز الآن" : "Continuer la Réservation"}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-4 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center justify-center"
              >
                {isRtl ? "رجوع" : "Retour"}
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s + 1) as any)}
                  className="flex-1 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-sm shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>{isRtl ? "متابعة" : "Continuer"}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="flex-1 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-sm shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isPending
                      ? (isRtl ? "جاري التأكيد..." : "Confirmation en cours...")
                      : (isRtl ? "تأكيد الحجز النهائي" : "Confirmer ma réservation")}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BARRE D'ACTION FLOTTANTE SUR MOBILE (STICKY BOTTOM BAR)                   */}
      {/* ========================================================================= */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3.5 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono truncate">
              {financials.total.toLocaleString("fr-MA")} MAD
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              ({passengerCount} pax)
            </span>
          </div>
          <p className="text-[10px] font-bold text-tp-cyan">
            {isRtl ? `تسبيق: ${financials.depositTotal} MAD` : `Acompte : ${financials.depositTotal} MAD`}
          </p>
        </div>

        <button
          type="button"
          onClick={handleScrollToWidget}
          className="px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition active:scale-95 shrink-0 flex items-center gap-1.5"
        >
          <span>{isRtl ? "احجز مقاعدك الآن" : "Réservez vos places"}</span>
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>
      </div>
    </>
  );
}

// Export de rétrocompatibilité
export const TripBookingSidebar = BookingCard;
export const BookingWizard = BookingCard;
