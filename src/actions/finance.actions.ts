"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { DocumentType, DocumentStatus, FinancialDocumentModel } from "@/types/finance";
import { generateInvoicePdfBuffer, InvoicePdfData, InvoiceItem } from "@/lib/pdf/generateInvoice";
import { uploadBufferToR2 } from "@/lib/r2";
import { requireAdminSession } from "@/lib/adminAuth";

export interface CreateFinancialDocumentInput {
  type: DocumentType;
  clientName: string;
  companyName?: string;
  ice?: string; // 15 chiffres
  taxId?: string;
  rcNumber?: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress?: string;

  tripTitle: string;
  tripDate?: string | null;
  participantsCount: number;

  items: Array<{
    description: string;
    quantity: number;
    unitPriceMAD: number;
    totalMAD: number;
  }>;

  subtotalHT: number;
  vatRate: number; // 0 ou 20
  vatAmount: number;
  totalTTC: number;
  depositAmount: number;
  remainingAmount: number;

  validUntil?: string | null;
  notes?: string;
  status?: DocumentStatus;
  bookingId?: string | null;
}

/**
 * Génère le numéro séquentiel unique du document (Ex: DEV-2026-0001 ou FAC-2026-0001)
 */
async function generateDocumentNumber(type: DocumentType): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = type === DocumentType.QUOTE_B2B ? `DEV-${currentYear}` : `FAC-${currentYear}`;

  const count = await (prisma as any).financialDocument.count({
    where: { type },
  });

  let seq = count + 1;
  let candidate = `${prefix}-${String(seq).padStart(4, "0")}`;

  // Vérification d'unicité stricte
  while (await (prisma as any).financialDocument.findUnique({ where: { documentNumber: candidate } })) {
    seq += 1;
    candidate = `${prefix}-${String(seq).padStart(4, "0")}`;
  }

  return candidate;
}

/**
 * Crée un Devis B2B ou une Facture Officielle et génère son PDF sur Cloudflare R2
 */
export async function createFinancialDocumentAction(input: CreateFinancialDocumentInput) {
  await requireAdminSession("CREATE_FINANCIAL_DOCUMENT");

  try {
    if (!input.clientName?.trim()) {
      return { success: false, error: "Le nom du contact ou client est obligatoire." };
    }
    if (!input.clientEmail?.trim() && !input.clientPhone?.trim()) {
      return { success: false, error: "Un numéro de téléphone ou un email est obligatoire." };
    }
    if (!input.tripTitle?.trim()) {
      return { success: false, error: "L'intitulé de la prestation ou circuit est requis." };
    }
    if (!input.items || input.items.length === 0) {
      return { success: false, error: "Veuillez renseigner au moins une ligne de prestation." };
    }

    const documentNumber = await generateDocumentNumber(input.type);
    const issueDate = new Date();
    const tripDate = input.tripDate ? new Date(input.tripDate) : null;
    const validUntil = input.validUntil
      ? new Date(input.validUntil)
      : input.type === DocumentType.QUOTE_B2B
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 jours par défaut
      : null;

    // Préparation des données pour le moteur jsPDF
    const pdfItems: InvoiceItem[] = input.items.map((it) => ({
      description: it.description,
      quantity: Number(it.quantity) || 1,
      unitPrice: Number(it.unitPriceMAD) || 0,
      total: Number(it.totalMAD) || 0,
    }));

    const pdfData: InvoicePdfData = {
      documentType: input.type === DocumentType.QUOTE_B2B
        ? "DEVIS"
        : input.depositAmount >= input.totalTTC
        ? "FACTURE_SOLDE"
        : "FACTURE_ACOMPTE",
      documentNumber,
      bookingNumber: input.bookingId || documentNumber,
      issuedAt: issueDate.toLocaleDateString("fr-FR"),
      dueDate: validUntil ? validUntil.toLocaleDateString("fr-FR") : undefined,
      isPartnerDocument: input.type === DocumentType.QUOTE_B2B,

      clientName: input.clientName,
      clientCompany: input.companyName || undefined,
      ice: input.ice?.trim() || undefined,
      taxId: input.taxId?.trim() || undefined,
      rcNumber: input.rcNumber?.trim() || undefined,
      clientPhone: input.clientPhone,
      clientEmail: input.clientEmail,
      clientAddress: input.clientAddress || undefined,

      tripTitle: input.tripTitle,
      travelDates: tripDate ? tripDate.toLocaleDateString("fr-FR") : "Date à confirmer",
      passengerCount: Number(input.participantsCount) || 1,

      items: pdfItems,
      subtotalHt: Number(input.subtotalHT),
      vatRate: Number(input.vatRate),
      vatAmount: Number(input.vatAmount),
      totalTtc: Number(input.totalTTC),
      depositPaid: Number(input.depositAmount),
      remainingBalance: Number(input.remainingAmount),
      notes: input.notes || undefined,
      verificationUrl: `https://rahalatbladna.ma/verify/${documentNumber}`,
    };

    // Génération du PDF
    let pdfUrl = `/api/invoices/${documentNumber}/download`;
    try {
      const pdfBuffer = await generateInvoicePdfBuffer(pdfData);
      const folder = input.type === DocumentType.QUOTE_B2B ? "quotes" : "invoices";
      const r2Key = `documents/${folder}/${documentNumber}.pdf`;
      const uploadRes = await uploadBufferToR2(pdfBuffer, r2Key, "application/pdf");
      if (uploadRes?.url) {
        pdfUrl = uploadRes.url;
      }
    } catch (r2Err) {
      console.warn("Notice R2 upload during document creation:", r2Err);
    }

    // Persistance en base de données PostgreSQL Supabase
    const initialStatus = input.status || (input.type === DocumentType.QUOTE_B2B ? DocumentStatus.SENT : DocumentStatus.DRAFT);

    const doc: FinancialDocumentModel = await (prisma as any).financialDocument.create({
      data: {
        documentNumber,
        type: input.type,
        status: initialStatus,
        clientName: input.clientName.trim(),
        companyName: input.companyName?.trim() || null,
        ice: input.ice?.trim() || null,
        taxId: input.taxId?.trim() || null,
        rcNumber: input.rcNumber?.trim() || null,
        clientEmail: input.clientEmail.trim(),
        clientPhone: input.clientPhone.trim(),
        clientAddress: input.clientAddress?.trim() || null,
        tripTitle: input.tripTitle.trim(),
        tripDate,
        participantsCount: Number(input.participantsCount) || 1,
        items: input.items,
        subtotalHT: Number(input.subtotalHT),
        vatRate: Number(input.vatRate),
        vatAmount: Number(input.vatAmount),
        totalTTC: Number(input.totalTTC),
        depositAmount: Number(input.depositAmount),
        remainingAmount: Number(input.remainingAmount),
        issueDate,
        validUntil,
        pdfUrl,
        notes: input.notes?.trim() || null,
        bookingId: input.bookingId || null,
      },
    });

    revalidatePath("/admin/finances");
    revalidatePath("/fr/admin/finances");
    revalidatePath("/ar/admin/finances");
    revalidatePath("/en/admin/finances");

    return {
      success: true,
      documentNumber: doc.documentNumber,
      documentId: doc.id,
      pdfUrl: doc.pdfUrl,
      document: doc,
    };
  } catch (error: any) {
    console.error("Error creating financial document:", error);
    return {
      success: false,
      error: error.message || "Une erreur est survenue lors de la création du document.",
    };
  }
}

/**
 * Met à jour le statut d'un document (DRAFT, SENT, PAID, ACCEPTED, REJECTED, CANCELLED)
 */
export async function updateFinancialDocumentStatusAction(id: string, status: DocumentStatus) {
  await requireAdminSession("UPDATE_FINANCIAL_DOCUMENT");

  try {
    const existing = await (prisma as any).financialDocument.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Document introuvable." };
    }

    const updateData: any = { status };

    // Si une facture est marquée comme payée (PAID), on solde l'acompte/solde
    if (status === DocumentStatus.PAID && existing.type === DocumentType.INVOICE) {
      updateData.depositAmount = existing.totalTTC;
      updateData.remainingAmount = 0;
    }

    const updated = await (prisma as any).financialDocument.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/finances");
    revalidatePath("/fr/admin/finances");
    revalidatePath("/ar/admin/finances");
    revalidatePath("/en/admin/finances");

    return { success: true, document: updated };
  } catch (error: any) {
    console.error("Error updating document status:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Convertit un devis accepté en facture officielle
 */
export async function convertQuoteToInvoiceAction(quoteId: string) {
  await requireAdminSession("CONVERT_QUOTE_TO_INVOICE");

  try {
    const quote = await (prisma as any).financialDocument.findUnique({ where: { id: quoteId } });
    if (!quote) {
      return { success: false, error: "Devis introuvable." };
    }

    // 1. Marquer le devis comme accepté
    await (prisma as any).financialDocument.update({
      where: { id: quoteId },
      data: { status: DocumentStatus.ACCEPTED },
    });

    // 2. Créer la facture officielle
    const invoiceNumber = await generateDocumentNumber(DocumentType.INVOICE);
    const issueDate = new Date();

    const pdfData: InvoicePdfData = {
      documentType: "FACTURE_ACOMPTE",
      documentNumber: invoiceNumber,
      bookingNumber: quote.bookingId || invoiceNumber,
      issuedAt: issueDate.toLocaleDateString("fr-FR"),
      isPartnerDocument: true,

      clientName: quote.clientName,
      clientCompany: quote.companyName || undefined,
      ice: quote.ice || undefined,
      taxId: quote.taxId || undefined,
      rcNumber: quote.rcNumber || undefined,
      clientPhone: quote.clientPhone,
      clientEmail: quote.clientEmail,
      clientAddress: quote.clientAddress || undefined,

      tripTitle: quote.tripTitle,
      travelDates: quote.tripDate ? new Date(quote.tripDate).toLocaleDateString("fr-FR") : "Date à convenir",
      passengerCount: quote.participantsCount,

      items: (quote.items as any[]) || [],
      subtotalHt: quote.subtotalHT,
      vatRate: quote.vatRate,
      vatAmount: quote.vatAmount,
      totalTtc: quote.totalTTC,
      depositPaid: quote.depositAmount,
      remainingBalance: quote.remainingAmount,
      notes: `Facture émise suite à la validation du devis réf. ${quote.documentNumber}. ${quote.notes || ""}`.trim(),
      verificationUrl: `https://rahalatbladna.ma/verify/${invoiceNumber}`,
    };

    let pdfUrl = `/api/invoices/${invoiceNumber}/download`;
    try {
      const pdfBuffer = await generateInvoicePdfBuffer(pdfData);
      const r2Key = `documents/invoices/${invoiceNumber}.pdf`;
      const uploadRes = await uploadBufferToR2(pdfBuffer, r2Key, "application/pdf");
      if (uploadRes?.url) pdfUrl = uploadRes.url;
    } catch (e) {
      console.warn("R2 upload notice during conversion:", e);
    }

    const createdInvoice = await (prisma as any).financialDocument.create({
      data: {
        documentNumber: invoiceNumber,
        type: DocumentType.INVOICE,
        status: DocumentStatus.SENT,
        clientName: quote.clientName,
        companyName: quote.companyName,
        ice: quote.ice,
        taxId: quote.taxId,
        rcNumber: quote.rcNumber,
        clientEmail: quote.clientEmail,
        clientPhone: quote.clientPhone,
        clientAddress: quote.clientAddress,
        tripTitle: quote.tripTitle,
        tripDate: quote.tripDate,
        participantsCount: quote.participantsCount,
        items: quote.items as any,
        subtotalHT: quote.subtotalHT,
        vatRate: quote.vatRate,
        vatAmount: quote.vatAmount,
        totalTTC: quote.totalTTC,
        depositAmount: quote.depositAmount,
        remainingAmount: quote.remainingAmount,
        issueDate,
        pdfUrl,
        notes: `Facture issue du devis ${quote.documentNumber}.`,
        bookingId: quote.bookingId,
      },
    });

    revalidatePath("/admin/finances");
    revalidatePath("/fr/admin/finances");
    revalidatePath("/ar/admin/finances");
    revalidatePath("/en/admin/finances");

    return {
      success: true,
      invoiceNumber: createdInvoice.documentNumber,
      invoiceId: createdInvoice.id,
      pdfUrl: createdInvoice.pdfUrl,
    };
  } catch (error: any) {
    console.error("Error converting quote to invoice:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Supprime un document financier (brouillon ou annulé)
 */
export async function deleteFinancialDocumentAction(id: string) {
  await requireAdminSession("DELETE_FINANCIAL_DOCUMENT");

  try {
    await (prisma as any).financialDocument.delete({ where: { id } });

    revalidatePath("/admin/finances");
    revalidatePath("/fr/admin/finances");
    revalidatePath("/ar/admin/finances");
    revalidatePath("/en/admin/finances");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting financial document:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Récupère les circuits disponibles pour le sélecteur du formulaire de devis
 */
export async function getAvailableTripsForDocumentAction() {
  try {
    const trips = await prisma.trip.findMany({
      where: { isActive: true },
      select: {
        id: true,
        titleFr: true,
        titleAr: true,
        titleEn: true,
        basePrice: true,
        destinationRegion: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return trips.map((t) => ({
      id: t.id,
      title: t.titleFr,
      titleAr: t.titleAr,
      titleEn: t.titleEn || t.titleFr,
      basePrice: Number(t.basePrice),
      region: t.destinationRegion,
    }));
  } catch (err) {
    console.error("Error fetching trips for documents:", err);
    return [];
  }
}
