import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

// Moteur de mise en forme arabe cursif (Shaping) et réordonnancement bidirectionnel (BiDi UAX #9)
import { ArabicShaper } from "arabic-persian-reshaper";
import bidiFactory from "bidi-js";

const bidi = bidiFactory();

const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoicePdfData {
  documentType: "FACTURE" | "DEVIS" | "FACTURE_ACOMPTE" | "FACTURE_SOLDE";
  documentNumber: string; // Ex: FAC-2026-000125 ou DEV-2026-000125
  bookingNumber?: string;
  issuedAt: string; // Ex: "02 Septembre 2026"
  dueDate?: string;

  // Condition B2B / Partenaires & Contrôles Routiers
  isPartnerDocument?: boolean;

  // Client Info
  clientName: string;
  clientCin?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientCompany?: string;
  clientAddress?: string;

  // Trip Info
  tripTitle: string;
  travelDates: string;
  passengerCount: number;
  pickupPointName?: string;

  // Financial Items (Net de taxe pour Auto-Entrepreneur)
  items: InvoiceItem[];
  totalTtc: number; // Montant Total de la Prestation (MAD)
  depositPaid: number; // Acompte Réglé
  remainingBalance: number; // Solde Dû au Départ
  paymentMethod?: string;

  // Verification QR
  verificationUrl?: string;
  notes?: string;

  // Compatibilité optionnelle
  totalHt?: number;
  tvaRate?: number;
  tvaAmount?: number;
  agencyName?: string;
}

// Mise en cache des polices en mémoire
let amiriRegularBase64: string | null = null;
let amiriBoldBase64: string | null = null;

function loadAmiriFonts() {
  if (!amiriRegularBase64) {
    const regPath = path.join(process.cwd(), "public", "fonts", "Amiri-Regular.ttf");
    amiriRegularBase64 = fs.readFileSync(regPath).toString("base64");
  }
  if (!amiriBoldBase64) {
    const boldPath = path.join(process.cwd(), "public", "fonts", "Amiri-Bold.ttf");
    amiriBoldBase64 = fs.readFileSync(boldPath).toString("base64");
  }
  return { amiriRegularBase64, amiriBoldBase64 };
}

let logoEmblemBase64: string | null = null;

function loadLogoEmblem(): string | null {
  if (!logoEmblemBase64) {
    const p = path.join(process.cwd(), "public", "images", "logo", "logo-emblem-opt.png");
    if (fs.existsSync(p)) {
      logoEmblemBase64 = "data:image/png;base64," + fs.readFileSync(p).toString("base64");
    }
  }
  return logoEmblemBase64;
}

/**
 * Formate et applique le shaping contextuel et l'algorithme bidirectionnel (BiDi)
 * sur le texte arabe pour un affichage cursif fluide de droite à gauche dans jsPDF.
 */
export function formatArabic(text: string): string {
  if (!text) return "";
  if (!ARABIC_REGEX.test(text)) {
    return text;
  }

  // Traitement ligne par ligne si le texte contient des sauts de ligne
  if (text.includes("\n")) {
    return text
      .split("\n")
      .map((line) => formatArabic(line))
      .join("\n");
  }

  try {
    // 1. Mise en forme contextuelle des glyphes arabes (lettres cursives liées + ligatures lam-alef)
    const reshaped = ArabicShaper.convertArabic(text);

    // 2. Algorithme Bidirectionnel (UBA / BiDi) pour réordonner visuellement les caractères LTR pour jsPDF
    const embeddingLevels = bidi.getEmbeddingLevels(reshaped);
    return bidi.getReorderedString(reshaped, embeddingLevels);
  } catch (error) {
    console.warn("formatArabic fallback notice:", error);
    return text;
  }
}

/**
 * Moteur officiel de génération PDF des Devis et Factures "Rahalat Bladna"
 * Statut : Auto-Entrepreneur au Maroc (Loi 114-13), Franchise de TVA (Net de Taxe)
 */
export async function generateInvoicePdfBuffer(data: InvoicePdfData): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Enregistrement de la police UTF-8 Amiri pour le support intégral français + arabe
  const { amiriRegularBase64: regFont, amiriBoldBase64: boldFont } = loadAmiriFonts();
  doc.addFileToVFS("Amiri-Regular.ttf", regFont);
  doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  doc.addFileToVFS("Amiri-Bold.ttf", boldFont);
  doc.addFont("Amiri-Bold.ttf", "Amiri", "bold");

  doc.setFont("Amiri", "normal");

  // Palette Chromatique Officielle Rahalat Bladna
  const COLOR_MIDNIGHT = [11, 34, 57] as [number, number, number];   // #0B2239
  const COLOR_CYAN = [27, 186, 202] as [number, number, number];     // #1BBACA
  const COLOR_DARK_CYAN = [8, 124, 137] as [number, number, number]; // #087C89
  const COLOR_SLATE = [51, 65, 85] as [number, number, number];      // #334155
  const COLOR_MUTED = [100, 116, 139] as [number, number, number];   // #64748B
  const COLOR_LIGHT_BG = [246, 243, 238] as [number, number, number];// #F6F3EE
  const COLOR_TERRACOTTA = [217, 120, 75] as [number, number, number];// #D9784B
  const COLOR_EMERALD = [16, 185, 129] as [number, number, number];  // #10B981

  const isPartner = data.isPartnerDocument === true || data.documentType === "DEVIS" || data.documentNumber.startsWith("DEV");
  const isDevis = data.documentType === "DEVIS";

  // -------------------------------------------------------------
  // 1. BANDEAU SUPÉRIEUR MIDNIGHT & EN-TÊTE OFFICIEL
  // -------------------------------------------------------------
  const headerHeight = 44;
  doc.setFillColor(...COLOR_MIDNIGHT);
  doc.rect(0, 0, pageWidth, headerHeight, "F");

  // Ligne d'accentuation Cyan
  doc.setFillColor(...COLOR_CYAN);
  doc.rect(0, headerHeight, pageWidth, 1.8, "F");

  // Emblème Officiel Rahalat Bladna (Palmier, Dunes & Soleil)
  const emblemBase64 = loadLogoEmblem();
  if (emblemBase64) {
    try {
      doc.addImage(emblemBase64, "PNG", 14, 6.5, 13, 12.6);
    } catch {
      // Fallback si chargement image échoue
      doc.setFillColor(...COLOR_CYAN);
      doc.roundedRect(14, 8, 10, 10, 2.5, 2.5, "F");
    }
  }

  // Nom de Marque et Calligraphie Arabe
  doc.setFont("Amiri", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("Rahalat Bladna", 30, 14);

  // Séparateur et Calligraphie Arabe (formatée sans bug)
  doc.setFontSize(14);
  doc.setTextColor(...COLOR_CYAN);
  const arabicBrand = formatArabic("رحلات بلادنا");
  doc.text(`•  ${arabicBrand}`, 72, 14);

  // Slogan & Mention de l'Émetteur
  doc.setFont("Amiri", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  doc.text("Voyages Organisés & Découverte du Maroc", 30, 20.5);

  doc.setFont("Amiri", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Émetteur : MOHAMMED AMINE CHAIBAR • Régime de l'Auto-Entrepreneur (Loi 114-13)", 30, 26);

  // Coordonnées de Contact Réelles
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text("Tél / WhatsApp : +212 603-660658  |  Email : contact@rahalatbladna.ma  |  Rabat, Maroc", 30, 31);

  // Badge Document (Cadre blanc à droite)
  const badgeWidth = 62;
  const badgeX = pageWidth - 14 - badgeWidth;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(badgeX, 9, badgeWidth, 26, 3, 3, "F");

  const docTitle = isDevis
    ? "DEVIS ESTIMATIF B2B"
    : data.documentType === "FACTURE_ACOMPTE"
    ? "FACTURE D'ACOMPTE"
    : data.documentType === "FACTURE_SOLDE"
    ? "FACTURE DE SOLDE"
    : "FACTURE OFFICIELLE";

  doc.setFont("Amiri", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...COLOR_MIDNIGHT);
  doc.text(docTitle, badgeX + badgeWidth / 2, 16.5, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(...COLOR_DARK_CYAN);
  doc.text(data.documentNumber, badgeX + badgeWidth / 2, 23, { align: "center" });

  doc.setFont("Amiri", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(`Date : ${data.issuedAt}`, badgeX + badgeWidth / 2, 29, { align: "center" });

  // -------------------------------------------------------------
  // 2. BLOCS D'INFORMATIONS : CLIENT & PRESTATION
  // -------------------------------------------------------------
  const startY = 52;
  const cardHeight = 36;
  const cardWidth = 88;

  // Cadre Client (Gauche)
  doc.setFillColor(...COLOR_LIGHT_BG);
  doc.roundedRect(14, startY, cardWidth, cardHeight, 3, 3, "F");
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.25);
  doc.roundedRect(14, startY, cardWidth, cardHeight, 3, 3, "D");

  doc.setFont("Amiri", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_MIDNIGHT);
  doc.text("DESTINATAIRE / CLIENT", 18, startY + 6.5);

  doc.setFontSize(8);
  doc.setTextColor(...COLOR_SLATE);
  const clientHeading = data.clientCompany
    ? `${data.clientCompany} (Attn: ${data.clientName})`
    : data.clientName;
  doc.text(formatArabic(clientHeading), 18, startY + 13);

  doc.setFont("Amiri", "normal");
  doc.setFontSize(7.5);
  let clientLineY = startY + 18.5;
  if (data.clientCin) {
    doc.text(`N° CIN / Passeport : ${data.clientCin}`, 18, clientLineY);
    clientLineY += 5;
  }
  if (data.clientPhone) {
    doc.text(`Téléphone : ${data.clientPhone}`, 18, clientLineY);
    clientLineY += 5;
  }
  if (data.clientEmail) {
    doc.text(`Email : ${data.clientEmail}`, 18, clientLineY);
    clientLineY += 5;
  }
  if (data.clientAddress && clientLineY <= startY + 33) {
    doc.text(formatArabic(`Adresse : ${data.clientAddress}`), 18, clientLineY);
  }

  // Cadre Prestation & Voyage (Droite)
  const rightCardX = pageWidth - 14 - cardWidth;
  doc.setFillColor(...COLOR_LIGHT_BG);
  doc.roundedRect(rightCardX, startY, cardWidth, cardHeight, 3, 3, "F");
  doc.setDrawColor(220, 225, 230);
  doc.roundedRect(rightCardX, startY, cardWidth, cardHeight, 3, 3, "D");

  doc.setFont("Amiri", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_MIDNIGHT);
  doc.text("DÉTAILS DE LA PRESTATION", rightCardX + 4, startY + 6.5);

  doc.setFontSize(8);
  doc.setTextColor(...COLOR_DARK_CYAN);
  const rawTripTitle = data.tripTitle || "";
  const truncatedRawTitle = rawTripTitle.length > 44
    ? rawTripTitle.substring(0, 42).trim() + "..."
    : rawTripTitle;
  doc.text(formatArabic(truncatedRawTitle), rightCardX + 4, startY + 13);

  doc.setFont("Amiri", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_SLATE);
  doc.text(`Dates du voyage : ${data.travelDates}`, rightCardX + 4, startY + 18.5);
  doc.text(`Nombre de voyageurs : ${data.passengerCount} personne(s)`, rightCardX + 4, startY + 23.5);
  if (data.pickupPointName) {
    doc.text(`Point de rassemblement : ${formatArabic(data.pickupPointName)}`, rightCardX + 4, startY + 28.5);
  }
  if (data.bookingNumber) {
    doc.text(`Réf. Dossier : ${data.bookingNumber}`, rightCardX + 4, startY + 33.5);
  }

  // -------------------------------------------------------------
  // 3. TABLEAU FINANCIER (Auto-Entrepreneur : Net de taxe)
  // -------------------------------------------------------------
  const itemsList = data.items && data.items.length > 0
    ? data.items
    : [
        {
          description: `Prestation Touristique : ${data.tripTitle}`,
          quantity: data.passengerCount || 1,
          unitPrice: Math.round(data.totalTtc / (data.passengerCount || 1)),
          total: data.totalTtc,
        },
      ];

  const tableRows = itemsList.map((item, idx) => [
    (idx + 1).toString(),
    formatArabic(item.description),
    item.quantity.toString(),
    `${item.unitPrice.toLocaleString("fr-FR")} DH`,
    `${item.total.toLocaleString("fr-FR")} DH`,
  ]);

  autoTable(doc, {
    startY: startY + cardHeight + 6,
    head: [["#", "Description de la Prestation Touristique", "Qté", "Prix Unitaire (MAD)", "Total Net (MAD)"]],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: COLOR_MIDNIGHT,
      textColor: [255, 255, 255],
      font: "Amiri",
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 106 },
      2: { cellWidth: 16, halign: "center" },
      3: { cellWidth: 26, halign: "right" },
      4: { cellWidth: 24, halign: "right", fontStyle: "bold" },
    },
    styles: {
      font: "Amiri",
      fontSize: 8,
      cellPadding: 2.8,
      textColor: COLOR_SLATE,
      lineColor: [225, 230, 235],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [250, 248, 245],
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 5;

  // -------------------------------------------------------------
  // 4. RÉCAPITULATIF FINANCIER & COORDONNÉES BANCAIRES CIH BANK
  // -------------------------------------------------------------
  const sectionHeight = 46;

  // Coordonnées bancaires réelles CIH Bank (Gauche)
  const bankBoxWidth = 104;
  doc.setFillColor(...COLOR_LIGHT_BG);
  doc.roundedRect(14, finalY, bankBoxWidth, sectionHeight, 3, 3, "F");
  doc.setDrawColor(220, 225, 230);
  doc.roundedRect(14, finalY, bankBoxWidth, sectionHeight, 3, 3, "D");

  doc.setFont("Amiri", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_MIDNIGHT);
  doc.text("COORDONNÉES BANCAIRES OFFICIELLES (CIH BANK)", 18, finalY + 6);

  doc.setFont("Amiri", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_SLATE);
  doc.text("• Banque : CIH Bank  |  Agence : 081", 18, finalY + 11.5);
  doc.text("• Bénéficiaire : MOHAMMED AMINE CHAIBAR", 18, finalY + 16.5);

  doc.setFont("Amiri", "bold");
  doc.setTextColor(...COLOR_MIDNIGHT);
  doc.text("• RIB (24 chiffres) : 230 810 6784594211008100 80", 18, finalY + 22);

  doc.setFont("Amiri", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLOR_SLATE);
  doc.text("• IBAN : MA64 2308 1067 8459 4211 0081 0080  |  Code SWIFT : CIHMMAMC", 18, finalY + 27.5);
  doc.text("• Règlement par virement bancaire, versement CIH Express ou Cash Plus.", 18, finalY + 33);

  doc.setFont("Amiri", "bold");
  doc.setTextColor(...COLOR_DARK_CYAN);
  doc.text(`• Indiquer obligatoirement la réf. dossier : ${data.bookingNumber || data.documentNumber}`, 18, finalY + 39);

  // Totaux Financiers Réels (Droite - Sans TVA)
  const totalsBoxWidth = 72;
  const totalsBoxX = pageWidth - 14 - totalsBoxWidth;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(totalsBoxX, finalY, totalsBoxWidth, sectionHeight, 3, 3, "F");
  doc.setDrawColor(220, 225, 230);
  doc.roundedRect(totalsBoxX, finalY, totalsBoxWidth, sectionHeight, 3, 3, "D");

  // 1. Montant Total de la Prestation (MAD)
  doc.setFont("Amiri", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_SLATE);
  doc.text("Total Prestation (MAD) :", totalsBoxX + 4, finalY + 8);
  doc.text(`${data.totalTtc.toLocaleString("fr-FR")} DH`, totalsBoxX + totalsBoxWidth - 4, finalY + 8, { align: "right" });

  // 2. Acompte Réglé
  doc.setFont("Amiri", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_DARK_CYAN);
  doc.text("Acompte Réglé :", totalsBoxX + 4, finalY + 16.5);
  doc.text(`${data.depositPaid.toLocaleString("fr-FR")} DH`, totalsBoxX + totalsBoxWidth - 4, finalY + 16.5, { align: "right" });

  // 3. Solde Dû au Départ (Bandeau de mise en valeur)
  doc.setFillColor(...COLOR_MIDNIGHT);
  doc.rect(totalsBoxX, finalY + 22, totalsBoxWidth, 11, "F");

  doc.setFont("Amiri", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("Solde Dû au Départ :", totalsBoxX + 4, finalY + 29.5);

  const balanceColor = data.remainingBalance > 0 ? COLOR_CYAN : [255, 255, 255];
  doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
  doc.text(`${data.remainingBalance.toLocaleString("fr-FR")} DH`, totalsBoxX + totalsBoxWidth - 4, finalY + 29.5, { align: "right" });

  // Statut du document
  doc.setFont("Amiri", "bold");
  doc.setFontSize(7.5);
  if (data.remainingBalance === 0) {
    doc.setTextColor(...COLOR_EMERALD);
    doc.text("✓ DOSSIER TOTALEMENT SOLDÉ", totalsBoxX + totalsBoxWidth / 2, finalY + 39, { align: "center" });
  } else {
    doc.setTextColor(...COLOR_TERRACOTTA);
    doc.text("ACOMPTE VALIDÉ • SOLDE AU DÉPART", totalsBoxX + totalsBoxWidth / 2, finalY + 39, { align: "center" });
  }

  // Mention Légale Obligatoire Franchise de TVA
  doc.setFont("Amiri", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(
    "* TVA non applicable conformément aux dispositions du Code Général des Impôts (Régime de l'Auto-Entrepreneur).",
    14,
    finalY + sectionHeight + 5.5
  );

  // -------------------------------------------------------------
  // 5. QR CODE DE VALIDATION & CACHET DIGITAL
  // -------------------------------------------------------------
  const bottomY = pageHeight - 48;

  // QR Code officiel
  try {
    const qrUrl = data.verificationUrl || `https://rahalatbladna.ma/verify/${data.documentNumber}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 100,
      margin: 1,
      color: { dark: "#0B2239", light: "#FFFFFF" },
    });
    doc.addImage(qrDataUrl, "PNG", 14, bottomY, 20, 20);

    doc.setFont("Amiri", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_MIDNIGHT);
    doc.text("Vérification Numérique", 37, bottomY + 6.5);

    doc.setFont("Amiri", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLOR_MUTED);
    doc.text("Scannez ce QR Code pour consulter le dossier", 37, bottomY + 11.5);
    doc.text("et le statut d'embarquement officiel en direct.", 37, bottomY + 15.5);
  } catch (qrErr) {
    console.warn("QR Code notice:", qrErr);
  }

  // Tampon Numérique Moderne de l'Agence
  const stampBoxWidth = 64;
  const stampBoxX = pageWidth - 14 - stampBoxWidth;
  doc.setFillColor(...COLOR_LIGHT_BG);
  doc.roundedRect(stampBoxX, bottomY, stampBoxWidth, 20, 2.5, 2.5, "F");
  doc.setDrawColor(27, 186, 202);
  doc.setLineWidth(0.4);
  doc.roundedRect(stampBoxX, bottomY, stampBoxWidth, 20, 2.5, 2.5, "D");

  doc.setFont("Amiri", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_MIDNIGHT);
  doc.text("Rahalat Bladna", stampBoxX + stampBoxWidth / 2, bottomY + 5.5, { align: "center" });

  doc.setFontSize(6.5);
  doc.setTextColor(...COLOR_DARK_CYAN);
  doc.text("Service Réservations & Opérations", stampBoxX + stampBoxWidth / 2, bottomY + 10, { align: "center" });

  doc.setFont("Amiri", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...COLOR_EMERALD);
  doc.text("✓ Document validé électroniquement", stampBoxX + stampBoxWidth / 2, bottomY + 14.5, { align: "center" });

  doc.setFontSize(5.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(`Réf : ${data.documentNumber}`, stampBoxX + stampBoxWidth / 2, bottomY + 18, { align: "center" });

  // -------------------------------------------------------------
  // 6. PIED DE PAGE LÉGAL CONDITIONNEL (isPartnerDocument)
  // -------------------------------------------------------------
  const footerHeight = 12;
  doc.setFillColor(...COLOR_MIDNIGHT);
  doc.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, "F");

  doc.setFont("Amiri", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(226, 232, 240);

  if (isPartner) {
    // Cartouche B2B / Partenaires & Contrôles Routiers TIST / Gendarmerie
    doc.text(
      "Mohammed Amine CHAIBAR — Guide de Tourisme & Auto-Entrepreneur | Identifiant Fiscal : 73169307 | Taxe Pro : 26311818 | N° Registre National AE : 004003997000036 | CNI : AA44480",
      pageWidth / 2,
      pageHeight - 6.5,
      { align: "center" }
    );
    doc.setFontSize(5.8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "Convention de prestation de services & transport touristique • Document commercial émis par voie électronique avec valeur juridique probante.",
      pageWidth / 2,
      pageHeight - 3,
      { align: "center" }
    );
  } else {
    // Pied de page épuré orienté Client Voyageur
    const brandText = `Rahalat Bladna (${formatArabic("رحلات بلادنا")}) — Voyages Organisés & Découverte du Maroc • Document émis par voie électronique avec valeur juridique probante.`;
    doc.text(
      brandText,
      pageWidth / 2,
      pageHeight - 6.5,
      { align: "center" }
    );
    doc.setFontSize(5.8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "Service Client & Assistance Départs : +212 603-660658 | Email : contact@rahalatbladna.ma | Rabat, Maroc",
      pageWidth / 2,
      pageHeight - 3,
      { align: "center" }
    );
  }

  // Conversion en Buffer Node.js
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
