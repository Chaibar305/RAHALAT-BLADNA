/**
 * Types & Enums pour le module financier (Facturation & Devis B2B)
 * Permet une indépendance totale vis-à-vis du cache de déclaration TSServer
 */

export type DocumentType = "INVOICE" | "QUOTE_B2B";
export const DocumentType = {
  INVOICE: "INVOICE" as const,
  QUOTE_B2B: "QUOTE_B2B" as const,
};

export type DocumentStatus = "DRAFT" | "SENT" | "PAID" | "ACCEPTED" | "REJECTED" | "CANCELLED";
export const DocumentStatus = {
  DRAFT: "DRAFT" as const,
  SENT: "SENT" as const,
  PAID: "PAID" as const,
  ACCEPTED: "ACCEPTED" as const,
  REJECTED: "REJECTED" as const,
  CANCELLED: "CANCELLED" as const,
};

export interface FinancialDocumentModel {
  id: string;
  documentNumber: string;
  type: DocumentType;
  status: DocumentStatus;
  clientName: string;
  companyName: string | null;
  ice: string | null;
  taxId: string | null;
  rcNumber: string | null;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string | null;
  tripTitle: string;
  tripDate: Date | null;
  participantsCount: number;
  items: any;
  subtotalHT: number;
  vatRate: number;
  vatAmount: number;
  totalTTC: number;
  depositAmount: number;
  remainingAmount: number;
  issueDate: Date;
  validUntil: Date | null;
  pdfUrl: string | null;
  notes: string | null;
  bookingId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
