import React from "react";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { formatMAD } from "@/lib/utils";
import { Users, UserCheck, Banknote, Calendar } from "lucide-react";
import { ClientsManager } from "@/components/admin/clients/ClientsManager";
import { ClientDetailedData } from "@/components/admin/clients/ClientDetailsDrawer";
import { PassengerRegistryItem } from "@/components/admin/clients/PassengersRegistryTable";

export default async function AdminClientsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdminSession("ADMIN_CLIENTS_PAGE", locale);
  const isAr = locale === "ar";

  // 1. Récupération des Clients (Comptes Acheteurs) sans requêtes N+1
  const dbUsers = await prisma.user.findMany({
    where: {
      OR: [
        { role: "CLIENT" },
        { bookings: { some: {} } },
      ],
    },
    include: {
      accounts: { select: { provider: true } },
      bookings: {
        include: {
          trip: { select: { id: true, titleFr: true, titleAr: true } },
          departureDate: { select: { startDate: true } },
          travelers: { select: { id: true, fullName: true, cinPassport: true } },
          invoice: { select: { id: true, number: true, totalTTC: true, status: true, issuedAt: true, pdfUrl: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Formater les données clients pour l'UI
  const clients: ClientDetailedData[] = dbUsers.map((u) => {
    const formattedBookings = u.bookings.map((b) => ({
      id: b.id,
      reference: b.reference,
      tripTitle: isAr && b.trip?.titleAr ? b.trip.titleAr : b.trip?.titleFr || "Circuit",
      departureDate: b.departureDate?.startDate
        ? new Date(b.departureDate.startDate).toLocaleDateString("fr-FR")
        : "À définir",
      totalAmount: Number(b.totalAmount || 0),
      amountPaid: Number(b.amountPaid || 0),
      status: b.status,
      paymentStatus: b.paymentStatus,
      travelers: b.travelers.map((t) => ({
        id: t.id,
        fullName: t.fullName,
        cinPassport: t.cinPassport,
      })),
    }));

    const formattedInvoices = u.bookings
      .filter((b) => b.invoice)
      .map((b) => ({
        id: b.invoice!.id,
        number: b.invoice!.number,
        totalTTC: Number(b.invoice!.totalTTC || 0),
        status: b.invoice!.status,
        issuedAt: new Date(b.invoice!.issuedAt).toLocaleDateString("fr-FR"),
        pdfUrl: b.invoice!.pdfUrl,
      }));

    const isGoogleAccount = !u.passwordHash || (u.accounts && u.accounts.some((a) => a.provider === "google"));

    return {
      id: u.id,
      fullName: u.fullName || u.name || "Client Sans Nom",
      email: u.email,
      phone: u.phone || "—",
      cinOrPassport: u.cinOrPassport || null,
      city: u.city || "Casablanca",
      role: u.role,
      isBlocked: !!u.isBlocked,
      blockedReason: u.blockedReason || null,
      avatarUrl: u.avatarUrl || u.image,
      registeredAt: new Date(u.createdAt).toLocaleDateString("fr-FR"),
      hasPassword: !!u.passwordHash,
      isGoogleAuth: isGoogleAccount,
      bookings: formattedBookings,
      invoices: formattedInvoices,
    };
  });

  // 2. Récupération de tous les Voyageurs / Passagers Physiques (TIST) sans N+1
  const dbTravelers = await prisma.traveler.findMany({
    include: {
      booking: {
        include: {
          trip: { select: { id: true, titleFr: true, titleAr: true } },
          departureDate: { select: { startDate: true } },
          user: { select: { id: true, fullName: true, name: true, email: true, phone: true, city: true } },
        },
      },
    },
    orderBy: { fullName: "asc" },
  });

  const passengers: PassengerRegistryItem[] = dbTravelers.map((t) => ({
    id: t.id,
    fullName: t.fullName,
    cinPassport: t.cinPassport,
    phone: t.phone || t.booking?.user?.phone || "—",
    category: t.category,
    pickupCity: t.pickupCity || t.booking?.user?.city || "Casablanca",
    roomType: t.roomType || "DOUBLE_TWIN",
    isCheckedIn: !!t.isCheckedIn,
    bookingId: t.bookingId,
    bookingReference: t.booking?.reference || "—",
    bookingStatus: t.booking?.status || "EN_ATTENTE",
    paymentStatus: t.booking?.paymentStatus || "NON_PAYE",
    totalAmount: Number(t.booking?.totalAmount || 0),
    amountPaid: Number(t.booking?.amountPaid || 0),
    tripId: t.booking?.tripId || "",
    tripTitle: isAr && t.booking?.trip?.titleAr ? t.booking.trip.titleAr : t.booking?.trip?.titleFr || "Circuit",
    departureDate: t.booking?.departureDate?.startDate
      ? new Date(t.booking.departureDate.startDate).toLocaleDateString("fr-FR")
      : null,
    clientName: t.booking?.user?.fullName || t.booking?.user?.name || "Client",
    clientEmail: t.booking?.user?.email || "",
  }));

  // 3. Récupérer tous les circuits et points de ramassage pour les filtres
  const allTrips = await prisma.trip.findMany({
    where: { isActive: true },
    select: { id: true, titleFr: true, titleAr: true },
    orderBy: { createdAt: "desc" },
  });

  const pickupPoints = await prisma.tripPickupPoint.findMany({
    select: { id: true, cityName: true },
    distinct: ["cityName"],
  });

  // 4. Calcul des KPI Métriques
  const totalClientsCount = clients.length;

  // Voyageurs actifs ce mois (départ dans les 30 derniers jours ou à venir)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const activeTravelersThisMonth = dbTravelers.filter((t) => {
    if (!t.booking?.departureDate?.startDate) return false;
    const depDate = new Date(t.booking.departureDate.startDate);
    return depDate >= startOfMonth && t.booking.status !== "ANNULEE";
  }).length;

  // Volume d'affaires global MAD (Total encaissé cumulé)
  let totalRevenueMAD = 0;
  dbUsers.forEach((u) => {
    u.bookings.forEach((b) => {
      if (b.status !== "ANNULEE") {
        totalRevenueMAD += Number(b.amountPaid || 0);
      }
    });
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* En-tête & Barre de Titre */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-black uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" />
            <span>{isAr ? "دليل العملاء وسجل الركاب" : "Gestion Intégrée CRM & TIST"}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {isAr ? "دليل العملاء وسجل المسافرين" : "Annuaire Clients & Registre des Voyageurs"}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            {isAr
              ? "متابعة شاملة لحسابات العملاء المشترين، تاريخ الحجوزات، وسجل المسافرين الفعليين على متن الحافلات السياحية المرخصة."
              : "Suivi des comptes clients, historique des réservations et registre nominatif des passagers pour les contrôles de route."}
          </p>
        </div>
      </div>

      {/* Barre de Statistiques KPI (3 Cartes Thème Clair / Sombre) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* KPI 1 : Total Clients Enregistrés */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              {isAr ? "إجمالي العملاء المسجلين" : "Total Clients Enregistrés"}
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-slate-900 dark:text-white font-black text-2xl sm:text-3xl font-mono">
            {totalClientsCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isAr ? "حسابات عملاء مع حجوزات ومشتريات" : "Comptes acheteurs actifs"}
          </p>
        </div>

        {/* KPI 2 : Voyageurs Actifs ce Mois */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              {isAr ? "المسافرون النشطون هذا الشهر" : "Voyageurs Actifs ce Mois"}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-emerald-600 dark:text-emerald-400 font-black text-2xl sm:text-3xl font-mono">
            {activeTravelersThisMonth}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isAr ? "مسافرون على انطلاقات هذا الشهر" : "Passagers inscrits sur départs actifs"}
          </p>
        </div>

        {/* KPI 3 : Volume d'Affaires Global (MAD) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              {isAr ? "إجمالي حجم المعاملات (درهم)" : "Volume d'Affaires Global (MAD)"}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-slate-900 dark:text-white font-black text-2xl sm:text-3xl font-mono">
            {formatMAD(totalRevenueMAD, locale)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isAr ? "إجمالي المبالغ المحصلة المؤكدة" : "Total encaissé cumulé"}
          </p>
        </div>
      </div>

      {/* Module Principal Interactif (Sélecteur d'onglets, Tables, Drawer et Modales) */}
      <ClientsManager
        clients={clients}
        passengers={passengers}
        allTrips={allTrips}
        pickupPoints={pickupPoints}
        locale={locale}
      />
    </div>
  );
}
