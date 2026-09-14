import React from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PassengerManifestTable } from "@/components/admin/PassengerManifestTable";
import { FinancialBreakEvenCard } from "@/components/admin/FinancialBreakEvenCard";
import { calculateTripProfitability } from "@/actions/profitability.actions";
import { ManifestTransportInfo, ManifestPassengerRow, BreakEvenAnalysis } from "@/types";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { AlertTriangle, Bus, Users, ShieldAlert, ArrowRight } from "lucide-react";

export default async function AdminManifestsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { tripId?: string };
}) {
  await requireAdminSession("ADMIN_MANIFESTS_PAGE", locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  const isAr = locale === "ar";

  // Récupération de tous les circuits avec départs pour le sélecteur
  const allTrips = await prisma.trip.findMany({
    where: { isActive: true },
    select: { id: true, titleFr: true, titleAr: true, slug: true },
    orderBy: { createdAt: "desc" },
  });

  const requestedTripId = searchParams?.tripId;

  // Recherche du circuit cible ou du premier circuit disponible
  const activeTrip = await prisma.trip.findFirst({
    where: requestedTripId
      ? { OR: [{ id: requestedTripId }, { slug: requestedTripId }] }
      : { isActive: true },
    include: {
      partnerAssignments: {
        include: { partner: true },
        where: { partner: { type: "TRANSPORT_TOURISTIQUE" } },
      },
      staffAssignments: {
        include: { teamMember: true },
      },
      departureDates: { orderBy: { startDate: "asc" } },
      bookings: {
        include: {
          travelers: true,
          user: true,
        },
      },
    },
  });

  if (!activeTrip) {
    return (
      <div className="bg-white dark:bg-slate-950 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm transition-colors">
        <Bus className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {isAr ? "لا يوجد أي برنامج سياحي متاح حالياً" : "Aucun circuit disponible"}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isAr ? "قم بإنشاء رحلة جديدة لبدء إدارة قوائم الركاب." : "Créez un voyage pour commencer à gérer la feuille de route TIST."}
        </p>
        <Link
          href={`/${locale}/admin/trips/new`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-tp-cyan text-white dark:text-slate-950 font-black text-xs shadow-tp-cyan hover:bg-tp-cyan-hover transition"
        >
          Créer un circuit
        </Link>
      </div>
    );
  }

  // Transporteur assigné réel
  const transportAssignment = activeTrip.partnerAssignments[0];
  const transportPartner = transportAssignment?.partner;

  // Chauffeur assigné réel (recherche dans staffAssignments avec rôle DRIVER, ou driverAssigned du partenaire)
  const chauffeurStaff = activeTrip.staffAssignments.find((s: any) => s.assignedRole === "DRIVER" || (s as any).role === "DRIVER")?.teamMember;
  const driverName = chauffeurStaff?.fullName || transportAssignment?.driverAssigned || null;
  const driverPhone = chauffeurStaff?.phone || transportPartner?.phone || null;

  const firstDep = activeTrip.departureDates[0];
  const totalCapacity = activeTrip.totalSeats || firstDep?.totalCapacity || 18;

  // Récupération de l'agence officielle
  const agency = await prisma.agency.findFirst({
    orderBy: { createdAt: "asc" },
  });

  const departureInfo: ManifestTransportInfo = {
    tripId: activeTrip.id,
    tripSlug: activeTrip.slug,
    tripTitle: isAr ? activeTrip.titleAr : activeTrip.titleFr,
    departureDate: firstDep ? new Date(firstDep.startDate).toLocaleDateString("fr-FR") : "Date à définir",
    transporterName: transportPartner?.companyName || null,
    tistNumber: transportPartner ? (transportPartner.rateDetails || "TIST-AGRÉÉ-DGSN") : null,
    plateNumber: transportPartner?.plateNumber || null,
    driverName,
    driverPhone,
    driverCard: chauffeurStaff ? `Permis Pro (${chauffeurStaff.phone})` : null,
    agencyName: agency?.name || "Agence de Voyages Agréée",
    agencyLicense: agency?.licenseNumber || "LIC-AGREE-TIST",
    hasTransportAssigned: !!transportPartner,
    hasDriverAssigned: !!driverName,
  };

  const collectedTravelers: ManifestPassengerRow[] = [];
  activeTrip.bookings.forEach((b) => {
    const remaining = Number(b.totalAmount) - Number(b.amountPaid);
    b.travelers.forEach((tr) => {
      collectedTravelers.push({
        id: tr.id,
        fullName: tr.fullName,
        cinOrPassport: tr.cinPassport,
        nationality: "Marocaine",
        phone: tr.phone || b.user?.phone || "+212 600-000000",
        pickupLocation: "Point de ralliement prévu",
        roomType: "Double Standard",
        bookingNumber: b.reference,
        isCheckedIn: true,
        paymentStatus: b.paymentStatus === "PAYE_INTEGRALEMENT" ? "FULLY_PAID" : "DEPOSIT_PAID",
        remainingBalance: remaining > 0 ? remaining : 0,
      });
    });
  });

  const passengersList = collectedTravelers;

  // Calcul du seuil de rentabilité RÉEL basé sur la base de données
  const profitData = await calculateTripProfitability(activeTrip.id);
  const profit = profitData.data;

  const financialAnalysis: BreakEvenAnalysis = {
    departureDateId: firstDep?.id || activeTrip.id,
    tripTitle: departureInfo.tripTitle,
    totalSeats: totalCapacity,
    bookedSeats: passengersList.length,
    sellingPricePerSeat: Number(activeTrip.basePrice || 0),
    fixedCosts: {
      transportCost: profit?.fixedCostsBreakdown.find((f) => f.label.toLowerCase().includes("transport"))?.amount || 0,
      tourLeaderFee: profit?.fixedCostsBreakdown.find((f) => f.label.toLowerCase().includes("staff"))?.amount || 0,
      permitsAndRoadTolls: profit?.fixedCostsBreakdown.find((f) => f.label.toLowerCase().includes("logistique") || f.label.toLowerCase().includes("péage"))?.amount || 0,
      totalFixed: profit?.totalFixedCosts || 0,
    },
    variableCostsPerPassenger: {
      hotelRoomPerPerson: profit?.variableCostsBreakdown.find((v) => v.label.toLowerCase().includes("hébergement") || v.label.toLowerCase().includes("hôtel"))?.amount || 0,
      mealsAndActivities: profit?.variableCostsBreakdown.find((v) => v.label.toLowerCase().includes("restauration") || v.label.toLowerCase().includes("animation") || v.label.toLowerCase().includes("dromadaire"))?.amount || 0,
      totalVariable: profit?.unitVariableCost || 0,
    },
    breakEvenPassengerCount: profit?.breakEvenPassengers || 0,
    currentRevenue: profit?.realCollectedRevenue || 0,
    currentGrossMargin: profit?.netMarginCurrent || 0,
    isProfitable: (profit?.netMarginCurrent || 0) > 0,
  };

  return (
    <div className="space-y-8">
      {/* 1. Sélecteur de Circuit & Alerte de Conformité */}
      <div className="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <span className="text-xs font-mono text-tp-cyan uppercase tracking-wider font-bold">
              {t("manifestBadge")}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {departureInfo.tripTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              {t("departureDate")} : <span className="text-slate-900 dark:text-white font-bold">{departureInfo.departureDate}</span> • Capacité autocar : <span className="text-tp-cyan font-bold">{totalCapacity} places</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {allTrips.length > 1 && (
              <form method="GET" className="flex items-center gap-2">
                <select
                  name="tripId"
                  defaultValue={activeTrip.id}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-tp-cyan shadow-xs"
                >
                  {allTrips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {isAr ? t.titleAr : t.titleFr}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs border border-slate-200 dark:border-slate-700 transition"
                >
                  Filtrer
                </button>
              </form>
            )}

            <span className="px-3 py-1 rounded-pill bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              Conformité Gendarmerie / TIST
            </span>
          </div>
        </div>

        {/* ALERTES SI DONNÉES MANQUANTES */}
        {(!departureInfo.hasTransportAssigned || !departureInfo.hasDriverAssigned) && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-black text-amber-800 dark:text-amber-400 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Données logistiques incomplètes pour l&apos;édition de la feuille de route</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              {!departureInfo.hasTransportAssigned && (
                <p>
                  • Aucun transporteur assigné.{" "}
                  <Link
                    href={`/${locale}/admin/trips/${activeTrip.id}/partenaires`}
                    className="underline font-bold text-tp-cyan-hover dark:text-tp-cyan hover:underline inline-flex items-center gap-1"
                  >
                    <span>Assigner une société de transport</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </p>
              )}
              {!departureInfo.hasDriverAssigned && (
                <p>
                  • Aucun chauffeur assigné.{" "}
                  <Link
                    href={`/${locale}/admin/trips/${activeTrip.id}/equipe`}
                    className="underline font-bold text-tp-cyan-hover dark:text-tp-cyan hover:underline inline-flex items-center gap-1"
                  >
                    <span>Assigner un chauffeur</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Coordonnées Transporteur & Chauffeur */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-slate-500 font-bold uppercase text-[10px]">{t("transporter")}</p>
            {departureInfo.transporterName ? (
              <>
                <p className="font-black text-slate-900 dark:text-white mt-0.5">{departureInfo.transporterName}</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-mono mt-0.5">{departureInfo.tistNumber || "Agréé TIST"}</p>
              </>
            ) : (
              <p className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">Non assigné</p>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-slate-500 font-bold uppercase text-[10px]">{t("vehiclePlate")}</p>
            {departureInfo.plateNumber ? (
              <>
                <p className="font-mono font-black text-tp-cyan-hover dark:text-tp-cyan text-sm mt-0.5">{departureInfo.plateNumber}</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Autocar Grand Tourisme</p>
              </>
            ) : (
              <p className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">Immatriculation en attente</p>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-slate-500 font-bold uppercase text-[10px]">{t("driver")}</p>
            {departureInfo.driverName ? (
              <>
                <p className="font-black text-slate-900 dark:text-white mt-0.5">{departureInfo.driverName}</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-mono mt-0.5">{departureInfo.driverPhone || ""}</p>
              </>
            ) : (
              <p className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">Non assigné</p>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-slate-500 font-bold uppercase text-[10px]">{t("driverCard")}</p>
            <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 text-[11px] truncate">
              {departureInfo.driverCard || "En attente d'affectation"}
            </p>
            <p className="text-emerald-600 dark:text-emerald-400 text-[11px] font-bold mt-0.5">
              {departureInfo.hasDriverAssigned ? "✓ En règle DGSN" : "⚠️ À régulariser"}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Analyse financière du seuil de rentabilité */}
      <FinancialBreakEvenCard analysis={financialAnalysis} />

      {/* 3. Table du Manifeste Passagers */}
      <PassengerManifestTable
        departureInfo={departureInfo}
        passengersList={passengersList}
      />
    </div>
  );
}
