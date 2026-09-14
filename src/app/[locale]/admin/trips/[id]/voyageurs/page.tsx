import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/adminAuth";
import { formatMAD } from "@/lib/utils";
import { TripAdminTabs } from "@/components/admin/trips/TripAdminTabs";
import Link from "next/link";
import { 
  Users, Search, ShieldCheck, Mail, Phone, 
  Calendar, CheckCircle2, AlertCircle, Printer, Download, Camera, QrCode
} from "lucide-react";
import { PassengerManifestTable } from "@/components/admin/PassengerManifestTable";
import { ManifestTransportInfo, ManifestPassengerRow } from "@/types";

export default async function TripTravelersPage({
  params: { id, locale },
}: {
  params: { id: string; locale: string };
}) {
  await requireAdminSession("VIEW_TRIP_TRAVELERS", locale);
  const isAr = locale === "ar";

  const trip = await prisma.trip.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      agency: true,
      departureDates: { orderBy: { startDate: "asc" } },
      pickupPoints: { orderBy: { orderIndex: "asc" } },
      partnerAssignments: {
        where: { partner: { type: "TRANSPORT_TOURISTIQUE" } },
        include: { partner: true },
      },
      staffAssignments: {
        include: { teamMember: true },
      },
      bookings: {
        include: {
          travelers: true,
          user: true,
          payments: true,
          departureDate: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!trip) {
    notFound();
  }

  // Aplatissement des passagers
  const travelersList: Array<{
    id: string;
    fullName: string;
    cinPassport: string;
    category: string;
    phone: string;
    bookingReference: string;
    bookingStatus: string;
    paymentStatus: string;
    totalAmount: number;
    amountPaid: number;
    balanceDue: number;
    clientEmail: string;
    isCheckedIn: boolean;
    checkedInAt: string | null;
    createdAt: string;
  }> = [];

  let checkedInCount = 0;

  trip.bookings.forEach((b) => {
    const total = Number(b.totalAmount);
    const paid = Number(b.amountPaid);
    const balance = total - paid;

    b.travelers.forEach((tr) => {
      if (tr.isCheckedIn) checkedInCount += 1;

      travelersList.push({
        id: tr.id,
        fullName: tr.fullName,
        cinPassport: tr.cinPassport,
        category: tr.category,
        phone: tr.phone || b.user?.phone || "+212 600-000000",
        bookingReference: b.reference,
        bookingStatus: b.status,
        paymentStatus: b.paymentStatus,
        totalAmount: total,
        amountPaid: paid,
        balanceDue: balance > 0 ? balance : 0,
        clientEmail: b.user?.email || "",
        isCheckedIn: tr.isCheckedIn,
        checkedInAt: tr.checkedInAt
          ? new Date(tr.checkedInAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
          : null,
        createdAt: new Date(b.createdAt).toLocaleDateString("fr-FR"),
      });
    });
  });

  const transportAssignment = trip.partnerAssignments[0];
  const transportPartner = transportAssignment?.partner;
  const chauffeurStaff = trip.staffAssignments.find((s: any) => s.assignedRole === "DRIVER" || (s as any).role === "DRIVER")?.teamMember;
  const driverName = chauffeurStaff?.fullName || transportAssignment?.driverAssigned || null;
  const driverPhone = chauffeurStaff?.phone || transportPartner?.phone || null;
  const firstDep = trip.departureDates[0];

  const departureInfo: ManifestTransportInfo = {
    tripId: trip.id,
    tripSlug: trip.slug,
    tripTitle: isAr ? trip.titleAr : trip.titleFr,
    departureDate: firstDep ? new Date(firstDep.startDate).toLocaleDateString("fr-FR") : "Date à définir",
    transporterName: transportPartner?.companyName || null,
    tistNumber: transportPartner?.rateDetails || null,
    plateNumber: transportPartner?.plateNumber || null,
    driverName,
    driverPhone,
    driverCard: chauffeurStaff ? `Permis Pro (${chauffeurStaff.phone})` : null,
    agencyName: trip.agency?.name || "",
    agencyLicense: trip.agency?.licenseNumber || "",
    hasTransportAssigned: !!transportPartner,
    hasDriverAssigned: !!driverName,
  };

  // Déterminer le point de ramassage principal du circuit
  const defaultPickup = trip.pickupPoints?.[0];
  const pickupLocationLabel = defaultPickup
    ? `${defaultPickup.cityName} (${isAr ? defaultPickup.locationNameAr : defaultPickup.locationNameFr})`
    : null;

  const manifestRows: ManifestPassengerRow[] = travelersList.map((tr) => ({
    id: tr.id,
    fullName: tr.fullName,
    cinOrPassport: tr.cinPassport,
    nationality: "",
    phone: tr.phone,
    pickupLocation: pickupLocationLabel || "",
    roomType: "Double Twin",
    bookingNumber: tr.bookingReference,
    isCheckedIn: tr.isCheckedIn,
    paymentStatus: tr.paymentStatus === "PAYE_INTEGRALEMENT" ? "FULLY_PAID" : "DEPOSIT_PAID",
    remainingBalance: tr.balanceDue,
  }));

  return (
    <div className="space-y-6">
      <TripAdminTabs
        tripId={trip.id}
        tripSlug={trip.slug}
        tripTitle={isAr ? trip.titleAr : trip.titleFr}
      />

      {/* Top Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-1">
          <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase">
            {isAr ? "إجمالي المسافرين المسجلين" : "Passagers Inscrits"}
          </span>
          <p className="text-slate-900 dark:text-white font-black text-2xl">
            {travelersList.length} / {trip.totalSeats} {isAr ? "مقعد" : "Places"}
          </p>
          <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold">
            Taux de remplissage : {Math.round((travelersList.length / (trip.totalSeats || 48)) * 100)}%
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-1">
          <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase">
            {isAr ? "الصعود الميداني إلى الحافلة" : "Pointage Embarquement"}
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {checkedInCount} / {travelersList.length} {isAr ? "ركبوا" : "À bord"}
          </p>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-bold">
            {travelersList.length > 0 ? Math.round((checkedInCount / travelersList.length) * 100) : 0}% des passagers pointés
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-1">
          <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase">
            {isAr ? "الملفات المؤكدة" : "Dossiers Réservés"}
          </span>
          <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
            {trip.bookings.length} {isAr ? "حجوزات" : "Dossiers"}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isAr ? "مع بطاقة تعريف وهوية محددة" : "CIN & Catégories vérifiées"}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-1">
          <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase">
            {isAr ? "حالة الانطلاق القانوني" : "Statut Départ Garanti"}
          </span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {travelersList.length >= (trip.minSeatsRequired || 15) ? (isAr ? "مضمون TIST" : "Garanti TIST") : (isAr ? "قيد التعبئة" : "En cours")}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Seuil minimum : {trip.minSeatsRequired || 15} passagers
          </p>
        </div>
      </div>

      {/* Travelers Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-slate-900 dark:text-white font-bold text-base">
              {isAr ? "البيانات التفصيلية للمسافرين" : "Liste Nominative des Voyageurs Inscrits"}
            </h2>
          </div>

          {/* Bouton Scanner CTA Direct */}
          <Link
            href={`/${locale}/admin/scanner?tripId=${trip.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/20 transition active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>{isAr ? "مسح QR Code وصعود الحافلة" : "Scanner & Embarquement Direct"}</span>
          </Link>
        </div>

        {travelersList.length === 0 ? (
          <div className="text-slate-400 dark:text-slate-500 py-10 text-center text-sm">
            {isAr ? "لا يوجد أي مسافر مسجل لهذه الرحلة حتى الآن" : "Aucun voyageur inscrit pour le moment"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-start">{isAr ? "المسافر" : "Voyageur"}</th>
                  <th className="px-6 py-4 text-center">{isAr ? "بطاقة التعريف" : "CIN / Passeport"}</th>
                  <th className="px-6 py-4 text-center">{isAr ? "الفئة" : "Catégorie"}</th>
                  <th className="px-6 py-4 text-start">{isAr ? "الهاتف" : "Contact"}</th>
                  <th className="px-6 py-4 text-start">{isAr ? "رقم الحجز" : "Réf. Dossier"}</th>
                  <th className="px-6 py-4 text-end">{isAr ? "المدفوع / الباقي" : "Acompte / Solde"}</th>
                  <th className="px-6 py-4 text-center">{isAr ? "حالة الدفع" : "Statut"}</th>
                  <th className="px-6 py-4 text-center">{isAr ? "الصعود" : "Embarquement"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {travelersList.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-white">{tr.fullName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{tr.clientEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-slate-900 dark:text-slate-200">
                      <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {tr.cinPassport}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 rounded-pill bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {tr.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-700 dark:text-slate-300">
                      {tr.phone}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {tr.bookingReference}
                    </td>
                    <td className="px-6 py-4 text-end font-mono">
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {isAr ? "المؤدى :" : "Payé :"} {formatMAD(tr.amountPaid, locale)}
                      </p>
                      {tr.balanceDue > 0 ? (
                        <p className="text-amber-600 dark:text-amber-400 text-[10px]">
                          {isAr ? "الباقي :" : "Dû :"} {formatMAD(tr.balanceDue, locale)}
                        </p>
                      ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-[10px]">Soldé</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-pill text-[10px] font-black uppercase font-mono ${
                          tr.paymentStatus === "PAYE_INTEGRALEMENT"
                            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30"
                            : "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/30"
                        }`}
                      >
                        {tr.paymentStatus === "PAYE_INTEGRALEMENT" ? (isAr ? "مدفوع بالكامل" : "Soldé") : (isAr ? "تسبيق مؤكد" : "Acompte")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {tr.isCheckedIn ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 text-[10px] font-black">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>{isAr ? "صعد" : "À bord"}</span>
                          {tr.checkedInAt && (
                            <span className="font-mono text-[9px] opacity-80 ms-0.5">({tr.checkedInAt})</span>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
                          <span>{isAr ? "في الانتظار" : "En attente"}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manifeste Passagers A4 Imprimable */}
      <PassengerManifestTable
        departureInfo={departureInfo}
        passengersList={manifestRows}
      />
    </div>
  );
}
