"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/adminAuth";
import { 
  generatePassengerManifestExcel, 
  generateFinancialReportExcel, 
  generatePassengerImportTemplate, 
  parsePassengersExcel 
} from "@/lib/excel/excelService";
import { getInvoicesListAction } from "@/actions/invoice.actions";
import { ManifestTransportInfo, ManifestPassengerRow } from "@/types";
import { BookingStatus, PaymentStatus, QuoteStatus, InvoiceStatus, PaymentType, PaymentMethod } from "@prisma/client";

/**
 * Exporte le Manifeste des Passagers d'un circuit en fichier Excel (.xlsx)
 */
export async function exportManifestExcelAction(tripId: string) {
  await requireAdminSession("EXPORT_MANIFEST_EXCEL");

  try {
    const trip = await prisma.trip.findFirst({
      where: { OR: [{ id: tripId }, { slug: tripId }] },
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

    if (!trip) {
      return { success: false, error: "Circuit introuvable." };
    }

    const transportAssignment = trip.partnerAssignments[0];
    const transportPartner = transportAssignment?.partner;
    const chauffeurStaff = trip.staffAssignments.find((s: any) => s.assignedRole === "DRIVER" || (s as any).role === "DRIVER")?.teamMember;
    const driverName = chauffeurStaff?.fullName || transportAssignment?.driverAssigned || null;
    const driverPhone = chauffeurStaff?.phone || transportPartner?.phone || null;

    const firstDep = trip.departureDates[0];

    const agency = await prisma.agency.findFirst({
      orderBy: { createdAt: "asc" },
    });

    const transportInfo: ManifestTransportInfo = {
      tripId: trip.id,
      tripSlug: trip.slug,
      tripTitle: trip.titleFr,
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

    const passengers: ManifestPassengerRow[] = [];
    trip.bookings.forEach((b) => {
      const remaining = Number(b.totalAmount) - Number(b.amountPaid);
      b.travelers.forEach((tr) => {
        passengers.push({
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

    const buffer = generatePassengerManifestExcel({ transportInfo, passengers });
    const base64 = buffer.toString("base64");
    const safeTripSlug = trip.slug.replace(/[^a-z0-9_-]/gi, "_");
    const filename = `manifeste_passagers_${safeTripSlug}_${Date.now()}.xlsx`;

    return {
      success: true,
      filename,
      base64,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  } catch (error: any) {
    console.error("Erreur exportManifestExcelAction:", error);
    return { success: false, error: error.message || "Erreur lors de l'export Excel." };
  }
}

/**
 * Exporte la Gestion Financière & Facturation en fichier Excel (.xlsx)
 */
export async function exportFinancesExcelAction() {
  await requireAdminSession("EXPORT_FINANCES_EXCEL");

  try {
    const reportData = await getInvoicesListAction();
    if (!reportData.success) {
      return { success: false, error: "Impossible de récupérer les données financières." };
    }

    const buffer = generateFinancialReportExcel({
      summary: reportData.summary,
      invoices: reportData.invoices,
      quotes: reportData.quotes,
    });

    const base64 = buffer.toString("base64");
    const filename = `grand_livre_financier_rahalat_bladna_${Date.now()}.xlsx`;

    return {
      success: true,
      filename,
      base64,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  } catch (error: any) {
    console.error("Erreur exportFinancesExcelAction:", error);
    return { success: false, error: error.message || "Erreur lors de l'export Excel financier." };
  }
}

/**
 * Télécharge le modèle Excel vierge pour l'import de voyageurs
 */
export async function getPassengerImportTemplateAction() {
  await requireAdminSession("GET_IMPORT_TEMPLATE");

  try {
    const buffer = generatePassengerImportTemplate();
    const base64 = buffer.toString("base64");
    const filename = `modele_import_voyageurs_rahalat_bladna.xlsx`;

    return {
      success: true,
      filename,
      base64,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  } catch (error: any) {
    console.error("Erreur getPassengerImportTemplateAction:", error);
    return { success: false, error: error.message || "Erreur lors de la génération du modèle." };
  }
}

/**
 * Importe en masse une liste de voyageurs depuis un fichier Excel/CSV téléversé
 */
export async function importPassengersExcelAction(
  tripId: string,
  departureDateId: string | null,
  base64File: string
) {
  await requireAdminSession("IMPORT_PASSENGERS_EXCEL");

  try {
    const fileBuffer = Buffer.from(base64File, "base64");
    const parseResult = parsePassengersExcel(fileBuffer);

    if (!parseResult.success && parseResult.data.length === 0) {
      return {
        success: false,
        errors: parseResult.errors,
        count: 0,
      };
    }

    const trip = await prisma.trip.findFirst({
      where: { OR: [{ id: tripId }, { slug: tripId }] },
      include: { departureDates: true },
    });

    if (!trip) {
      return { success: false, error: "Circuit cible introuvable.", count: 0 };
    }

    const selectedDepId = departureDateId || trip.departureDates[0]?.id || null;
    const basePrice = Number(trip.basePrice || 1450);
    const depositPerPax = Number(trip.depositPerPerson || 500);

    let insertedCount = 0;
    const travelersToInsert = parseResult.data;

    // Création transactionnelle par passager ou groupe
    await prisma.$transaction(async (tx) => {
      // 1. Récupérer ou créer un compte voyageur générique pour le groupe importé
      const groupEmail = `groupe-import-${Date.now()}@rahalatbladna.ma`;
      const groupUser = await tx.user.create({
        data: {
          email: groupEmail,
          fullName: `Groupe Importé (${travelersToInsert[0].fullName} + ${travelersToInsert.length - 1})`,
          name: travelersToInsert[0].fullName,
          phone: travelersToInsert[0].phone || `+212 600-${Date.now().toString().slice(-6)}`,
          cinOrPassport: travelersToInsert[0].cinPassport,
          role: "CLIENT",
          isProfileComplete: true,
        },
      });

      const totalAmount = travelersToInsert.length * basePrice;
      const depositAmount = travelersToInsert.length * depositPerPax;
      const subtotalHt = Math.round((totalAmount / 1.2) * 100) / 100;
      const taxAmount = Math.round((totalAmount - subtotalHt) * 100) / 100;

      const bookingRef = `RB-IMP-${Date.now().toString().slice(-6)}`;
      const quoteNum = `DEV-IMP-${Date.now().toString().slice(-6)}`;
      const invoiceNum = `FAC-IMP-${Date.now().toString().slice(-6)}`;

      // 2. Création de la réservation avec tous les voyageurs
      await tx.booking.create({
        data: {
          reference: bookingRef,
          userId: groupUser.id,
          tripId: trip.id,
          departureDateId: selectedDepId,
          status: BookingStatus.CONFIRMEE,
          totalAmount,
          depositAmount,
          amountPaid: depositAmount,
          paymentStatus: PaymentStatus.ACOMPTE_VERSE,
          notes: `Import massif Excel (${travelersToInsert.length} passagers)`,
          travelers: {
            create: travelersToInsert.map((t) => ({
              fullName: t.fullName,
              cinPassport: t.cinPassport,
              phone: t.phone || null,
              category: t.category,
              emergencyContact: t.emergencyContact || null,
            })),
          },
          payments: {
            create: [
              {
                amount: depositAmount,
                type: PaymentType.ACOMPTE,
                method: PaymentMethod.AGENCE,
                status: PaymentStatus.VERIFIED,
              },
            ],
          },
          quote: {
            create: {
              number: quoteNum,
              subtotalHT: subtotalHt,
              taxAmount: taxAmount,
              totalTTC: totalAmount,
              validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              status: QuoteStatus.ACCEPTE,
              pdfUrl: `/api/invoices/${quoteNum}/download`,
            },
          },
          invoice: {
            create: {
              number: invoiceNum,
              subtotalHT: subtotalHt,
              taxAmount: taxAmount,
              totalTTC: totalAmount,
              depositPaid: depositAmount,
              balanceDue: totalAmount - depositAmount,
              status: InvoiceStatus.PARTIELLEMENT_PAYEE,
              pdfUrl: `/api/invoices/${invoiceNum}/download`,
            },
          },
        },
      });

      insertedCount = travelersToInsert.length;
    });

    revalidatePath("/admin/manifests");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/finances");
    revalidatePath("/admin");

    return {
      success: true,
      count: insertedCount,
      errors: parseResult.errors,
      totalRows: parseResult.totalRows,
    };
  } catch (error: any) {
    console.error("Erreur importPassengersExcelAction:", error);
    return { success: false, error: error.message || "Erreur lors de l'enregistrement de l'import." };
  }
}
