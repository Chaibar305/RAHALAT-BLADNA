"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateInvoicePdfBuffer, InvoicePdfData, InvoiceItem } from "@/lib/pdf/generateInvoice";
import { uploadBufferToR2 } from "@/lib/r2";
import { requireAdminSession } from "@/lib/adminAuth";

/**
 * Récupère les données d'une facture ou devis depuis Supabase
 */
export async function getInvoiceData(
  invoiceIdOrNumber: string,
  isPartnerDocument?: boolean
): Promise<InvoicePdfData> {
  try {
    const inv = await prisma.invoice.findFirst({
      where: {
        OR: [{ id: invoiceIdOrNumber }, { number: invoiceIdOrNumber }],
      },
      include: {
        booking: {
          include: {
            user: true,
            trip: true,
            travelers: true,
            departureDate: true,
          },
        },
      },
    });

    if (inv) {
      const tripTitle = inv.booking?.trip?.titleFr || "Circuit Organisé";
      const travelDates = inv.booking?.departureDate
        ? `${new Date(inv.booking.departureDate.startDate).toLocaleDateString("fr-FR")} au ${new Date(inv.booking.departureDate.endDate).toLocaleDateString("fr-FR")}`
        : "Date à confirmer";
      const passengerCount = inv.booking?.travelers?.length || 1;

      const items: InvoiceItem[] = [
        {
          description: `Forfait Circuit : ${tripTitle}`,
          quantity: passengerCount,
          unitPrice: Math.round(Number(inv.totalTTC) / passengerCount),
          total: Number(inv.totalTTC),
        },
      ];

      return {
        documentType: inv.status === "PAYEE" ? "FACTURE_SOLDE" : "FACTURE_ACOMPTE",
        documentNumber: inv.number,
        bookingNumber: inv.booking?.reference || "RB-2026",
        issuedAt: new Date(inv.issuedAt).toLocaleDateString("fr-FR"),
        isPartnerDocument: isPartnerDocument !== undefined ? isPartnerDocument : false,
        clientName: inv.booking?.user?.fullName || inv.booking?.user?.name || "Client Voyageur",
        clientCin: inv.booking?.user?.cinOrPassport || "",
        clientPhone: inv.booking?.user?.phone || "",
        clientEmail: inv.booking?.user?.email || "",
        tripTitle,
        travelDates,
        passengerCount,
        items,
        totalTtc: Number(inv.totalTTC),
        depositPaid: Number(inv.depositPaid),
        remainingBalance: Number(inv.balanceDue),
        verificationUrl: `https://rahalatbladna.ma/verify/${inv.number}`,
      };
    }

    // Vérification dans la table Quote (Devis)
    const quote = await prisma.quote.findFirst({
      where: {
        OR: [{ id: invoiceIdOrNumber }, { number: invoiceIdOrNumber }],
      },
      include: {
        booking: {
          include: {
            user: true,
            trip: true,
            travelers: true,
          },
        },
      },
    });

    if (quote) {
      const tripTitle = quote.booking?.trip?.titleFr || "Devis Voyage";
      const items: InvoiceItem[] = [
        {
          description: `Forfait Devis : ${tripTitle}`,
          quantity: quote.booking?.travelers?.length || 1,
          unitPrice: Number(quote.totalTTC),
          total: Number(quote.totalTTC),
        },
      ];

      return {
        documentType: "DEVIS",
        documentNumber: quote.number,
        bookingNumber: quote.booking?.reference || "RB-DEV",
        issuedAt: new Date(quote.createdAt).toLocaleDateString("fr-FR"),
        isPartnerDocument: isPartnerDocument !== undefined ? isPartnerDocument : true,
        clientName: quote.booking?.user?.fullName || "Client Pro",
        tripTitle,
        travelDates: "Sur mesure 2026",
        passengerCount: quote.booking?.travelers?.length || 1,
        items,
        totalTtc: Number(quote.totalTTC),
        depositPaid: 0,
        remainingBalance: Number(quote.totalTTC),
        verificationUrl: `https://rahalatbladna.ma/verify/${quote.number}`,
      };
    }
  } catch (err) {
    console.warn("DB fetch error in getInvoiceData:", err);
  }

  // Aucun document trouvé en base de données
  throw new Error(`Document financier introuvable : ${invoiceIdOrNumber}`);
}

/**
 * Génère automatiquement la Facture d'Acompte et la stocke sur Cloudflare R2
 */
export async function generateInvoiceForBookingAction(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, trip: true, travelers: true, departureDate: true },
    });

    if (!booking) {
      return { success: false, error: "Réservation introuvable" };
    }

    const invoiceNumber = `FAC-2026-${Date.now().toString().slice(-6)}`;
    const totalTtc = Number(booking.totalAmount);
    const depositPaid = Number(booking.amountPaid);
    const balanceDue = totalTtc - depositPaid;
    // Auto-Entrepreneur est en franchise en base de TVA (Net de taxe)
    const subtotalHt = totalTtc;
    const taxAmount = 0;

    const pdfData: InvoicePdfData = {
      documentType: depositPaid >= totalTtc ? "FACTURE_SOLDE" : "FACTURE_ACOMPTE",
      documentNumber: invoiceNumber,
      bookingNumber: booking.reference,
      issuedAt: new Date().toLocaleDateString("fr-FR"),
      isPartnerDocument: false,
      clientName: booking.user?.fullName || booking.user?.name || "Client",
      clientCin: booking.user?.cinOrPassport || "",
      clientPhone: booking.user?.phone || "",
      clientEmail: booking.user?.email || "",
      tripTitle: booking.trip?.titleFr || "Circuit Maroc",
      travelDates: booking.departureDate
        ? `${new Date(booking.departureDate.startDate).toLocaleDateString("fr-FR")} au ${new Date(booking.departureDate.endDate).toLocaleDateString("fr-FR")}`
        : "Date à confirmer",
      passengerCount: booking.travelers.length || 1,
      items: [
        {
          description: `Forfait : ${booking.trip?.titleFr}`,
          quantity: booking.travelers.length || 1,
          unitPrice: Math.round(totalTtc / (booking.travelers.length || 1)),
          total: totalTtc,
        },
      ],
      totalTtc,
      depositPaid,
      remainingBalance: balanceDue,
    };

    const pdfBuffer = await generateInvoicePdfBuffer(pdfData);
    let pdfUrl = `/api/invoices/${invoiceNumber}/download`;

    try {
      const r2Key = `documents/invoices/${invoiceNumber}.pdf`;
      const uploadRes = await uploadBufferToR2(pdfBuffer, r2Key, "application/pdf");
      pdfUrl = uploadRes.url;
    } catch (r2Err) {
      console.warn("R2 storage notice for invoice PDF", r2Err);
    }

    const createdInvoice = await prisma.invoice.upsert({
      where: { bookingId: booking.id },
      update: {
        number: invoiceNumber,
        subtotalHT: subtotalHt,
        taxAmount: taxAmount,
        totalTTC: totalTtc,
        depositPaid,
        balanceDue,
        status: depositPaid >= totalTtc ? "PAYEE" : "PARTIELLEMENT_PAYEE",
        pdfUrl,
      },
      create: {
        number: invoiceNumber,
        bookingId: booking.id,
        subtotalHT: subtotalHt,
        taxAmount: taxAmount,
        totalTTC: totalTtc,
        depositPaid,
        balanceDue,
        status: depositPaid >= totalTtc ? "PAYEE" : "PARTIELLEMENT_PAYEE",
        pdfUrl,
      },
    });

    revalidatePath("/admin/finances");
    revalidatePath("/admin");

    return {
      success: true,
      invoiceNumber: createdInvoice.number,
      pdfUrl,
      invoice: createdInvoice,
    };
  } catch (error: any) {
    console.error("Error generating invoice:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Récupère la liste de toutes les factures et devis depuis Supabase pour l'espace finances admin
 */
export async function getInvoicesListAction() {
  await requireAdminSession("VIEW_FINANCES");

  try {
    const dbInvoices = await prisma.invoice.findMany({
      orderBy: { issuedAt: "desc" },
      include: {
        booking: {
          include: {
            user: true,
            trip: true,
            travelers: true,
            departureDate: true,
          },
        },
      },
    });

    const dbQuotes = await prisma.quote.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          include: {
            user: true,
            trip: true,
            travelers: true,
          },
        },
      },
    });

    const validPayments = await prisma.payment.findMany({
      where: {
        status: "VALIDE",
      },
    });

    // Formatage strict des Factures
    const formattedInvoices = dbInvoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.number,
      bookingId: inv.booking?.reference || null,
      type: inv.status === "PAYEE" ? ("FACTURE_SOLDE" as const) : ("FACTURE_ACOMPTE" as const),
      status: inv.status,
      clientName: inv.booking?.user?.fullName || inv.booking?.user?.name || "Client",
      clientPhone: inv.booking?.user?.phone || "",
      clientEmail: inv.booking?.user?.email || "",
      tripTitle: inv.booking?.trip?.titleFr || "Circuit Maroc",
      travelDates: inv.booking?.departureDate
        ? `${new Date(inv.booking.departureDate.startDate).toLocaleDateString("fr-FR")} au ${new Date(inv.booking.departureDate.endDate).toLocaleDateString("fr-FR")}`
        : "Date à confirmer",
      passengerCount: inv.booking?.travelers?.length || 1,
      totalHt: Number(inv.subtotalHT),
      tvaAmount: Number(inv.taxAmount),
      totalTtcMad: Number(inv.totalTTC),
      depositPaidMad: Number(inv.depositPaid),
      remainingBalanceMad: Number(inv.balanceDue),
      pdfUrl: inv.pdfUrl || `/api/invoices/${inv.number}/download`,
      issuedAt: new Date(inv.issuedAt).toLocaleDateString("fr-FR"),
    }));

    // Formatage strict des Devis
    const formattedQuotes = dbQuotes.map((q) => ({
      id: q.id,
      invoiceNumber: q.number,
      bookingId: q.booking?.reference || null,
      type: "DEVIS" as const,
      status: q.status,
      clientName: q.booking?.user?.fullName || "Prospect B2B",
      clientPhone: q.booking?.user?.phone || "",
      clientEmail: q.booking?.user?.email || "",
      tripTitle: q.booking?.trip?.titleFr || "Devis Sur-Mesure",
      travelDates: "Date à confirmer",
      passengerCount: q.booking?.travelers?.length || 1,
      totalHt: Number(q.subtotalHT),
      tvaAmount: Number(q.taxAmount),
      totalTtcMad: Number(q.totalTTC),
      depositPaidMad: 0,
      remainingBalanceMad: Number(q.totalTTC),
      pdfUrl: q.pdfUrl || `/api/invoices/${q.number}/download`,
      issuedAt: new Date(q.createdAt).toLocaleDateString("fr-FR"),
    }));

    // Calculs financiers stricts : UNIQUEMENT SUR LES FACTURES (invoices.status != ANNULEE)
    const activeInvoices = formattedInvoices.filter((i) => i.status !== "ANNULEE");
    const totalFactureTtc = activeInvoices.reduce((acc, i) => acc + i.totalTtcMad, 0);
    const totalAcomptesEncaisses = activeInvoices.reduce((acc, i) => acc + i.depositPaidMad, 0);
    const totalSoldesAEncaisser = activeInvoices.reduce((acc, i) => acc + i.remainingBalanceMad, 0);
    const totalQuotesTtc = formattedQuotes.reduce((acc, q) => acc + q.totalTtcMad, 0);

    return {
      success: true,
      invoices: formattedInvoices,
      quotes: formattedQuotes,
      allDocuments: [...formattedInvoices, ...formattedQuotes],
      summary: {
        totalFactureTtc,
        totalAcomptesEncaisses,
        totalSoldesAEncaisser,
        totalQuotesTtc,
        invoicesCount: formattedInvoices.length,
        quotesCount: formattedQuotes.length,
      },
    };
  } catch (error) {
    console.error("Erreur Prisma getInvoicesListAction:", error);
    return {
      success: false,
      invoices: [],
      quotes: [],
      allDocuments: [],
      summary: {
        totalFactureTtc: 0,
        totalAcomptesEncaisses: 0,
        totalSoldesAEncaisser: 0,
        totalQuotesTtc: 0,
        invoicesCount: 0,
        quotesCount: 0,
      },
    };
  }
}
