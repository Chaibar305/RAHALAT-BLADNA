import React from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { 
  TrendingUp, Users, CalendarCheck, ShieldCheck, 
  FileText, Ticket, ArrowUpRight, CheckCircle2, 
  Clock, AlertTriangle, Bus, Sparkles, Compass 
} from "lucide-react";
import { formatMAD } from "@/lib/utils";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdminSession("ADMIN_DASHBOARD", locale);
  const isAr = locale === "ar";

  // 1. Agrégations financières et métriques réelles depuis Supabase
  let totalRevenue = 0;
  let totalDeposits = 0;
  let confirmedBookingsCount = 0;
  let totalTravelersCount = 0;
  let activeTripsCount = 0;
  let pendingPaymentsCount = 0;
  let recentBookings: any[] = [];

  try {
    const revenueAgg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "VALIDE" },
    });
    totalRevenue = Number(revenueAgg._sum.amount || 0);

    const depositsAgg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { type: "ACOMPTE", status: "VALIDE" },
    });
    totalDeposits = Number(depositsAgg._sum.amount || 0);

    confirmedBookingsCount = await prisma.booking.count({
      where: { status: "CONFIRMEE" },
    });

    totalTravelersCount = await prisma.traveler.count({
      where: { booking: { status: "CONFIRMEE" } },
    });

    activeTripsCount = await prisma.trip.count({
      where: { isActive: true },
    });

    pendingPaymentsCount = await prisma.payment.count({
      where: { status: "EN_ATTENTE" },
    });

    const dbBookings = await prisma.booking.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        trip: true,
        travelers: true,
        departureDate: true,
      },
    });

    recentBookings = dbBookings.map((b) => ({
      id: b.id,
      reference: b.reference,
      client: b.user?.fullName || b.user?.name || "Client",
      cin: b.user?.cinOrPassport || "N/A",
      trip: isAr && b.trip?.titleAr ? b.trip.titleAr : b.trip?.titleFr || "Circuit Organisé",
      passengers: b.travelers.length || 1,
      total: Number(b.totalAmount),
      paid: Number(b.amountPaid),
      status: b.status,
      paymentStatus: b.paymentStatus,
      date: new Date(b.createdAt).toLocaleDateString("fr-FR"),
    }));
  } catch (error) {
    console.error("Erreur récupération métriques Dashboard:", error);
  }

  const kpis = [
    {
      title: isAr ? "إجمالي المداخيل المحصلة" : "Chiffre d'Affaires Encaissé",
      value: totalRevenue > 0 ? formatMAD(totalRevenue, locale) : "0 MAD",
      subtitle: totalDeposits > 0 ? `${formatMAD(totalDeposits, locale)} d'acomptes` : isAr ? "لا توجد تسبيقات بعد" : "Aucun acompte",
      isPositive: totalRevenue > 0,
      icon: TrendingUp,
      accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: isAr ? "عدد المسافرين المؤكدين" : "Voyageurs Embarqués",
      value: `${totalTravelersCount} ${isAr ? "مسافر" : "Voyageurs"}`,
      subtitle: `${confirmedBookingsCount} ${isAr ? "حجوزات مؤكدة" : "réservations confirmées"}`,
      isPositive: totalTravelersCount > 0,
      icon: Users,
      accent: "text-tp-cyan bg-tp-cyan/10 border-tp-cyan/20",
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
      title: isAr ? "عمليات دفع بانتظار التحقق" : "Paiements à Valider",
      value: `${pendingPaymentsCount} ${isAr ? "معاملات" : "Transactions"}`,
      subtitle: pendingPaymentsCount > 0 ? (isAr ? "يتطلب المراجعة" : "Action requise") : (isAr ? "الكل مدقق" : "Tout est à jour"),
      isPositive: pendingPaymentsCount === 0,
      icon: Clock,
      accent: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
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
            className="px-4 py-2.5 rounded-2xl bg-tp-cyan hover:bg-tp-cyan-hover text-white dark:text-slate-950 font-black text-xs flex items-center gap-2 shadow-tp-cyan transition active:scale-95"
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
            <Ticket className="w-5 h-5 text-tp-cyan" />
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {isAr ? "آخر الحجوزات المسجلة بالمنظومة" : "Derniers Dossiers de Réservation"}
            </h2>
          </div>

          <Link
            href={`/${locale}/admin/bookings`}
            className="text-xs font-black text-tp-cyan hover:underline flex items-center gap-1"
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
                      <p className="font-mono font-black text-tp-cyan-hover dark:text-tp-cyan">{b.reference}</p>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">{b.client}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">CIN: {b.cin}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {b.trip}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 rounded-pill bg-slate-100 dark:bg-slate-800 font-black text-slate-800 dark:text-white text-[11px]">
                        {b.passengers}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-end font-mono">
                      <p className="font-black text-slate-900 dark:text-white">{formatMAD(b.total, locale)}</p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                        {isAr ? "المؤدى :" : "Payé :"} {formatMAD(b.paid, locale)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-pill text-[10px] font-black uppercase font-mono ${
                          b.paymentStatus === "PAYE_INTEGRALEMENT"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : "bg-tp-cyan/15 text-tp-cyan-hover dark:text-tp-cyan border border-tp-cyan/30"
                        }`}
                      >
                        {b.paymentStatus === "PAYE_INTEGRALEMENT" ? (isAr ? "مدفوع بالكامل" : "Soldé") : (isAr ? "تسبيق مؤكد" : "Acompte Payé")}
                      </span>
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
