import React from "react";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { formatMAD } from "@/lib/utils";
import { 
  Ticket, AlertTriangle, CheckCircle2, 
  Banknote, Calendar, ShieldCheck, Clock 
} from "lucide-react";
import { BookingsManager } from "@/components/admin/bookings/BookingsManager";
import { BookingAdminItem } from "@/components/admin/bookings/ReceiptVerificationModal";

export default async function AdminBookingsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdminSession("ADMIN_BOOKINGS_PAGE", locale);
  const isAr = locale === "ar";

  // Récupération de tous les dossiers de réservation avec relations complètes
  const dbBookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      trip: true,
      departureDate: true,
      travelers: true,
      payments: {
        orderBy: { createdAt: "desc" },
      },
      invoice: true,
    },
  });

  // Récupération des circuits pour les filtres
  const allTrips = await prisma.trip.findMany({
    where: { isActive: true },
    select: { id: true, titleFr: true, titleAr: true },
    orderBy: { createdAt: "desc" },
  });

  // Formatage des données
  const bookings: BookingAdminItem[] = dbBookings.map((b) => {
    const depDate = b.departureDate?.startDate
      ? new Date(b.departureDate.startDate).toLocaleDateString("fr-FR")
      : "À définir";

    // Chercher la dernière preuve de paiement téléversée
    const proofPayment = b.payments.find((p) => p.proofUrl);

    return {
      id: b.id,
      reference: b.reference,
      clientName: b.user?.fullName || b.user?.name || "Client Sans Nom",
      clientEmail: b.user?.email || "",
      clientPhone: b.user?.phone || "—",
      clientCity: b.user?.city || "Casablanca",
      tripId: b.tripId,
      tripTitle: isAr && b.trip?.titleAr ? b.trip.titleAr : b.trip?.titleFr || "Circuit",
      departureDate: depDate,
      passengersCount: b.travelers.length || 1,
      totalAmount: Number(b.totalAmount),
      depositAmount: Number(b.depositAmount),
      amountPaid: Number(b.amountPaid),
      status: b.status,
      paymentStatus: b.paymentStatus,
      proofUrl: proofPayment?.proofUrl || null,
      paymentMethod: proofPayment?.method || "VIREMENT",
      notes: b.notes,
      qrCodeToken: b.qrCodeToken || b.reference,
      travelers: b.travelers.map((t) => ({
        id: t.id,
        fullName: t.fullName,
        cinPassport: t.cinPassport,
        category: t.category,
        pickupCity: t.pickupCity || "Casablanca",
        roomType: t.roomType || "DOUBLE_TWIN",
      })),
      createdAt: new Date(b.createdAt).toLocaleDateString("fr-FR"),
    };
  });

  // Calcul des 4 KPI Métriques
  const pendingVerificationCount = bookings.filter((b) => b.status === "PENDING_VERIFICATION").length;
  const confirmedDepositsCount = bookings.filter(
    (b) => b.status === "DEPOSIT_CONFIRMED" || b.status === "FULLY_PAID"
  ).length;

  let totalCollectedMAD = 0;
  let totalBalanceDueMAD = 0;

  bookings.forEach((b) => {
    if (b.status !== "CANCELLED") {
      totalCollectedMAD += b.amountPaid;
      totalBalanceDueMAD += Math.max(0, b.totalAmount - b.amountPaid);
    }
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-black uppercase tracking-wider">
            <Ticket className="w-3.5 h-3.5" />
            <span>{isAr ? "إدارة الحجوزات الرسمية" : "Gestion Financière & Billetterie"}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {isAr ? "سجل الحجوزات، الأقساط والتذاكر" : "Réservations, Acomptes & Billetterie"}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            {isAr
              ? "متابعة شاملة لملفات الحجز، التحقق من تحويلات الأقساط البنكية (R2)، وإصدار تذاكر الصعود الإلكترونية مع رمز QR."
              : "Suivi des dossiers de réservation, vérification des preuves de virement bancaire (R2) et émission des cartes d'embarquement officielles."}
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <span className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 font-mono font-black text-sm border border-slate-200 dark:border-slate-700 shadow-xs">
            {bookings.length} {isAr ? "ملف حجز" : "Dossiers Enregistrés"}
          </span>
        </div>
      </div>

      {/* 4 Cartes KPI Financières & Opérationnelles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1 : Reçus R2 à Vérifier */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-2 transition-colors relative overflow-hidden">
          {pendingVerificationCount > 0 && (
            <span className="absolute top-3 end-3 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </span>
          )}
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              {isAr ? "إيصالات قيد المراجعة" : "Reçus R2 à Vérifier"}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-amber-600 dark:text-amber-400 font-black text-2xl sm:text-3xl font-mono">
            {pendingVerificationCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isAr ? "تحويلات بنكية تتطلب مصادقة المشرف" : "Preuves de virement en attente d'audit"}
          </p>
        </div>

        {/* KPI 2 : Acomptes Confirmés (Billets Émis) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              {isAr ? "التسبيقات المؤكدة" : "Acomptes Confirmés"}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-emerald-600 dark:text-emerald-400 font-black text-2xl sm:text-3xl font-mono">
            {confirmedDepositsCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isAr ? "مقاعد مضمونة وتذاكر صعود نشطة" : "Places réservées & Billets émis"}
          </p>
        </div>

        {/* KPI 3 : Total Encaissé (MAD) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              {isAr ? "إجمالي المقبوضات" : "Total Encaissé (MAD)"}
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-slate-900 dark:text-white font-black text-2xl sm:text-3xl font-mono">
            {formatMAD(totalCollectedMAD, locale)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isAr ? "المبالغ المحصلة عبر البنك والبطاقة" : "Acomptes et soldes perçus"}
          </p>
        </div>

        {/* KPI 4 : Solde Restant à Percevoir */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              {isAr ? "الباقي للاستخلاص" : "Solde Restant à Percevoir"}
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-slate-900 dark:text-white font-black text-2xl sm:text-3xl font-mono">
            {formatMAD(totalBalanceDueMAD, locale)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isAr ? "مستحقات واجبة الأداء قبل موعد الرحلة" : "À recouvrer avant le départ"}
          </p>
        </div>
      </div>

      {/* Module Principal de Gestion */}
      <BookingsManager
        initialBookings={bookings}
        allTrips={allTrips}
        locale={locale}
      />
    </div>
  );
}
