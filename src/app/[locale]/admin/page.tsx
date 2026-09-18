export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { 
  TrendingUp, Users, Ticket, ArrowUpRight, 
  Clock, Bus, Compass 
} from "lucide-react";
import { formatMAD } from "@/lib/utils";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { PaymentStatus, BookingStatus } from "@prisma/client";

export default async function AdminDashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdminSession("VIEW_ADMIN_DASHBOARD");
  const t = await getTranslations({ locale, namespace: "admin" });
  const isAr = locale === "ar";

  // 1. Indicateurs Réels calculés via Prisma ORM avec comptabilité stricte
  let totalRevenue = 0;
  let totalDeposits = 0;
  let confirmedBookingsCount = 0;
  let totalTravelersCount = 0;
  let activeTripsCount = 0;
  let pendingActionsCount = 0;
  let recentBookings: any[] = [];

  try {
    // A. Chiffre d'affaires encaissé : Somme des paiements vérifiés sur les dossiers confirmés
    const verifiedPaymentsAgg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: PaymentStatus.VERIFIED,
        booking: {
          status: {
            in: [
              BookingStatus.DEPOSIT_PAID,
              BookingStatus.FULLY_PAID,
              "DEPOSIT_CONFIRMED" as any,
              "CONFIRMEE" as any,
            ],
          },
        },
      },
    });
    totalRevenue = Number(verifiedPaymentsAgg._sum?.amount || 0);

    // B. Acomptes vérifiés spécifiquement
    const depositsAgg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        type: "ACOMPTE",
        status: PaymentStatus.VERIFIED,
        booking: {
          status: {
            in: [
              BookingStatus.DEPOSIT_PAID,
              BookingStatus.FULLY_PAID,
              "DEPOSIT_CONFIRMED" as any,
              "CONFIRMEE" as any,
            ],
          },
        },
      },
    });
    totalDeposits = Number(depositsAgg._sum?.amount || 0);

    // Fallback de cohérence : si aucun enregistrement Payment individuel, lire depuis Booking.depositPaid / amountPaid des dossiers confirmés
    if (totalRevenue === 0) {
      const bookingRevenueAgg = await prisma.booking.aggregate({
        _sum: { depositPaid: true, amountPaid: true },
        where: {
          status: {
            in: [
              BookingStatus.DEPOSIT_PAID,
              BookingStatus.FULLY_PAID,
              "DEPOSIT_CONFIRMED" as any,
              "CONFIRMEE" as any,
            ],
          },
        },
      });
      const sumDeposit = Number(bookingRevenueAgg._sum?.depositPaid || 0);
      const sumAmount = Number(bookingRevenueAgg._sum?.amountPaid || 0);
      totalRevenue = Math.max(sumDeposit, sumAmount);
    }

    if (totalDeposits === 0) {
      const bookingDepositAgg = await prisma.booking.aggregate({
        _sum: { depositPaid: true, amountPaid: true },
        where: {
          status: {
            in: [BookingStatus.DEPOSIT_PAID, "DEPOSIT_CONFIRMED" as any],
          },
        },
      });
      const sumDeposit = Number(bookingDepositAgg._sum?.depositPaid || 0);
      const sumAmount = Number(bookingDepositAgg._sum?.amountPaid || 0);
      totalDeposits = Math.max(sumDeposit, sumAmount);
    }

    // C. Dossiers confirmés (acompte ou solde validé)
    confirmedBookingsCount = await prisma.booking.count({
      where: {
        status: {
          in: [
            BookingStatus.DEPOSIT_PAID,
            BookingStatus.FULLY_PAID,
            "DEPOSIT_CONFIRMED" as any,
            "CONFIRMEE" as any,
          ],
        },
      },
    });

    // D. Voyageurs confirmés
    totalTravelersCount = await prisma.traveler.count({
      where: {
        booking: {
          status: {
            in: [
              BookingStatus.DEPOSIT_PAID,
              BookingStatus.FULLY_PAID,
              "DEPOSIT_CONFIRMED" as any,
              "CONFIRMEE" as any,
            ],
          },
        },
      },
    });

    // E. Circuits actifs
    activeTripsCount = await prisma.trip.count({
      where: { isActive: true },
    });

    // F. Actions administratives requises (reçus téléversés à vérifier)
    const pendingBookingsCount = await prisma.booking.count({
      where: {
        status: BookingStatus.PENDING_VERIFICATION,
        paymentStatus: { in: [PaymentStatus.PENDING, "PENDING" as any] },
      },
    });

    const pendingPaymentsCount = await prisma.payment.count({
      where: {
        status: PaymentStatus.PENDING,
        booking: {
          status: {
            notIn: [
              BookingStatus.CANCELLED_BY_CLIENT,
              BookingStatus.CANCELLED_BY_ADMIN,
              "CANCELLED" as any,
              "ANNULEE" as any,
            ],
          },
          paymentStatus: {
            not: PaymentStatus.REJECTED,
          },
        },
      },
    });

    pendingActionsCount = Math.max(pendingBookingsCount, pendingPaymentsCount);

    // G. Derniers dossiers de réservation
    const dbBookings = await prisma.booking.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        trip: true,
        travelers: true,
        departureDate: true,
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    recentBookings = dbBookings.map((b) => {
      const total = Number(b.totalAmount || 0);
      const paid = Number(b.depositPaid ?? b.amountPaid ?? 0);
      const balance = Math.max(0, total - paid);
      const latestPayment = b.payments?.[0];

      return {
        id: b.id,
        reference: b.reference,
        client: b.user?.fullName || b.user?.name || "Client",
        cin: b.user?.cinOrPassport || "N/A",
        trip: isAr && b.trip?.titleAr ? b.trip.titleAr : b.trip?.titleFr || "Circuit Organisé",
        passengers: b.travelers.length || 1,
        total,
        paid,
        balance,
        status: b.status,
        paymentStatus: b.paymentStatus,
        latestPaymentStatus: latestPayment?.status,
        date: new Date(b.createdAt).toLocaleDateString("fr-FR"),
      };
    });
  } catch (error) {
    console.error("Erreur récupération métriques Dashboard:", error);
  }

  const kpis = [
    {
      title: isAr ? "إجمالي المداخيل المحصلة" : "Chiffre d'Affaires Encaissé",
      value: totalRevenue > 0 ? formatMAD(totalRevenue, locale) : "0 MAD",
      subtitle: totalDeposits > 0 ? `${formatMAD(totalDeposits, locale)} d'acomptes` : isAr ? "لا توجد تسبيقات بعد" : "Aucun acompte encaissé",
      isPositive: totalRevenue > 0,
      icon: TrendingUp,
      accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: isAr ? "عدد المسافرين المؤكدين" : "Voyageurs Embarqués",
      value: `${totalTravelersCount} ${isAr ? "مسافر" : "Voyageurs"}`,
      subtitle: `${confirmedBookingsCount} ${isAr ? "حجوزات مؤكدة" : "dossiers confirmés"}`,
      isPositive: totalTravelersCount > 0,
      icon: Users,
      accent: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      title: isAr ? "الرحلات النشطة المنشورة" : "Circuits Actifs",
      value: `${activeTripsCount} ${isAr ? "رحلات" : "Circuits"}`,
      subtitle: isAr ? "جاهزة للحجز الفوري" : "Ouverts à la réservation",
      isPositive: true,
      icon: Bus,
      accent: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: isAr ? "عمليات دفع بانتظار التحقق" : "Reçus à Vérifier",
      value: `${pendingActionsCount} ${isAr ? "معاملات" : "Dossiers"}`,
      subtitle: pendingActionsCount > 0 ? (isAr ? "يتطلب المراجعة" : "Validation requise") : (isAr ? "الكل مدقق" : "Comptabilité à jour"),
      isPositive: pendingActionsCount === 0,
      icon: Clock,
      accent: pendingActionsCount > 0 ? "text-amber-500 bg-amber-500/10 border-amber-500/30 animate-pulse" : "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
  ];

  // Helper pour afficher le badge de statut réel et exact
  const renderStatusBadge = (b: any) => {
    const isRejected =
      b.paymentStatus === PaymentStatus.REJECTED ||
      b.latestPaymentStatus === PaymentStatus.REJECTED;

    const isCancelledClient = b.status === BookingStatus.CANCELLED_BY_CLIENT;
    const isCancelledAdmin =
      b.status === BookingStatus.CANCELLED_BY_ADMIN ||
      b.status === "CANCELLED" ||
      b.status === "ANNULEE";

    const isSoldOut =
      !isRejected &&
      !isCancelledClient &&
      !isCancelledAdmin &&
      (b.status === BookingStatus.FULLY_PAID ||
        b.paymentStatus === "PAYE_INTEGRALEMENT" ||
        (b.paid >= b.total && b.total > 0));

    const isDepositValid =
      !isRejected &&
      !isCancelledClient &&
      !isCancelledAdmin &&
      !isSoldOut &&
      (b.status === BookingStatus.DEPOSIT_PAID ||
        b.status === "DEPOSIT_CONFIRMED" ||
        b.paymentStatus === "ACOMPTE_VERSE" ||
        b.paid > 0);

    const isPendingReview =
      !isRejected &&
      !isCancelledClient &&
      !isCancelledAdmin &&
      !isSoldOut &&
      !isDepositValid &&
      (b.status === BookingStatus.PENDING_VERIFICATION ||
        b.paymentStatus === PaymentStatus.PENDING ||
        b.latestPaymentStatus === PaymentStatus.PENDING);

    if (isCancelledClient) {
      return (
        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
          {isAr ? "ملغى من العميل" : "Annulé Client"}
        </span>
      );
    }
    if (isCancelledAdmin) {
      return (
        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
          {isAr ? "ملغى من الوكالة" : "Annulé Agence"}
        </span>
      );
    }
    if (isRejected) {
      return (
        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
          {isAr ? "وصل مرفوض (0 د.م)" : "Reçu Rejeté (0 MAD)"}
        </span>
      );
    }
    if (isSoldOut) {
      return (
        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
          {isAr ? "مدفوع بالكامل (100%)" : "Soldé 100%"}
        </span>
      );
    }
    if (isDepositValid) {
      return (
        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
          {isAr ? "عربون مؤكد" : "Acompte Validé"}
        </span>
      );
    }
    if (isPendingReview) {
      return (
        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/40 animate-pulse">
          {isAr ? "في انتظار التحقق" : "À Vérifier"}
        </span>
      );
    }
    return (
      <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30">
        {isAr ? "في انتظار الدفع" : "Non Payé"}
      </span>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isAr ? "المنظومة السحابية متصلة" : "PostgreSQL Supabase Connecté"}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {isAr ? "لوحة القيادة والمتابعة العامة" : "Tableau de Bord de Direction"}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {isAr
              ? "مؤشرات حقيقية لحجوزات رحلات بلادنا، المبيعات المحصلة ومتابعة الحافلات السياحية."
              : "Suivi en temps réel de l'activité, rentabilité des départs et conformité légale TIST."}
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Link
            href={`/${locale}/admin/trips`}
            className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
          >
            <Compass className="w-4 h-4" />
            <span>{isAr ? "إدارة الرحلات" : "Gérer les Circuits"}</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-950 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {kpi.title}
                </span>
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${kpi.accent}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {kpi.value}
                </p>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                  {kpi.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Bookings Live Stream */}
      <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ticket className="w-5 h-5 text-cyan-500" />
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {isAr ? "آخر الحجوزات المسجلة بالمنظومة" : "Derniers Dossiers de Réservation"}
            </h2>
          </div>

          <Link
            href={`/${locale}/admin/bookings`}
            className="text-xs font-black text-cyan-600 hover:underline flex items-center gap-1"
          >
            <span>{isAr ? "عرض كل الحجوزات" : "Voir Tout"}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            {isAr ? "لا توجد حجوزات مسجلة لهذه الفترة" : "Aucune donnée pour cette période"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-start">{isAr ? "المرجع والعميل" : "Réf. & Client"}</th>
                  <th className="px-6 py-4 text-start">{isAr ? "الرحلة" : "Circuit"}</th>
                  <th className="px-6 py-4 text-center">{isAr ? "المقاعد" : "Passagers"}</th>
                  <th className="px-6 py-4 text-end">{isAr ? "المبلغ والتسبيق" : "Montant / Acompte"}</th>
                  <th className="px-6 py-4 text-center">{isAr ? "حالة الدفع" : "Statut"}</th>
                  <th className="px-6 py-4 text-end">{isAr ? "التاريخ" : "Date"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                    <td className="px-6 py-4">
                      <p className="font-mono font-black text-cyan-600 dark:text-cyan-400">{b.reference}</p>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">{b.client}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">CIN: {b.cin}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {b.trip}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-black text-slate-800 dark:text-white text-[11px]">
                        {b.passengers}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-end font-mono">
                      <p className="font-black text-slate-900 dark:text-white">{formatMAD(b.total, locale)}</p>
                      <p className={`text-[11px] font-bold ${b.paid > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                        {isAr ? "المؤدى :" : "Payé :"} {formatMAD(b.paid, locale)}
                      </p>
                      {b.total - b.paid > 0 && b.status !== BookingStatus.CANCELLED_BY_CLIENT && b.status !== BookingStatus.CANCELLED_BY_ADMIN && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                          {isAr ? "الباقي :" : "Reste :"} {formatMAD(b.balance, locale)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderStatusBadge(b)}
                    </td>
                    <td className="px-6 py-4 text-end text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {b.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
