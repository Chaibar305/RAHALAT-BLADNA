import * as XLSX from "xlsx";
import { ManifestPassengerRow, ManifestTransportInfo } from "@/types";

/**
 * Génère le fichier Excel (.xlsx) du Manifeste Passagers (Feuille de route TIST / Gendarmerie)
 */
export function generatePassengerManifestExcel(data: {
  transportInfo: ManifestTransportInfo;
  passengers: ManifestPassengerRow[];
}): Buffer {
  const wb = XLSX.utils.book_new();

  // 1. Feuille Principale : Manifeste Passagers
  const headerData = [
    ["FEUILLE DE ROUTE OFFICIELLE - MANIFESTE PASSAGERS"],
    ["Plateforme : Rahalat Bladna (رحلات بلادنا)"],
    [""],
    ["INFORMATIONS CIRCUIT & LOGISTIQUE"],
    ["Circuit", data.transportInfo.tripTitle],
    ["Date de Départ", data.transportInfo.departureDate],
    ["Agence Organisatrice", data.transportInfo.agencyName || "Rahalat Bladna"],
    ["N° Agrément / Licence", data.transportInfo.agencyLicense || "LIC-AGREE-TIST"],
    ["Société de Transport", data.transportInfo.transporterName || "Non assigné"],
    ["N° TIST / Agrément", data.transportInfo.tistNumber || "TIST-AGRÉÉ-DGSN"],
    ["Immatriculation Autocar", data.transportInfo.plateNumber || "En attente"],
    ["Chauffeur Assigné", data.transportInfo.driverName || "Non assigné"],
    ["Téléphone Chauffeur", data.transportInfo.driverPhone || "N/A"],
    [""],
    ["LISTE NOMINATIVE DES PASSAGERS"],
    [
      "N°",
      "Nom & Prénom (Conforme CIN)",
      "N° CIN / Passeport",
      "Nationalité",
      "Téléphone",
      "Point de Ramassage",
      "Type de Chambre",
      "Réf. Dossier",
      "Statut Paiement",
      "Solde Restant (MAD)",
      "Présence / Embarqué",
    ],
  ];

  const passengerRows = data.passengers.map((p, idx) => [
    idx + 1,
    p.fullName,
    p.cinOrPassport,
    p.nationality || "Marocaine",
    p.phone,
    p.pickupLocation,
    p.roomType,
    p.bookingNumber,
    p.paymentStatus === "FULLY_PAID"
      ? "Payé Intégralement"
      : p.paymentStatus === "DEPOSIT_PAID"
      ? "Acompte Versé"
      : "Non Payé",
    p.remainingBalance,
    p.isCheckedIn ? "OUI" : "NON",
  ]);

  const wsData = [...headerData, ...passengerRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Définir la largeur des colonnes
  ws["!cols"] = [
    { wch: 5 },  // N°
    { wch: 30 }, // Nom
    { wch: 18 }, // CIN
    { wch: 15 }, // Nationalité
    { wch: 18 }, // Téléphone
    { wch: 32 }, // Ramassage
    { wch: 20 }, // Chambre
    { wch: 18 }, // Réf
    { wch: 20 }, // Statut
    { wch: 18 }, // Solde
    { wch: 18 }, // Embarqué
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Manifeste Passagers");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return buffer;
}

/**
 * Génère le fichier Excel (.xlsx) de la Synthèse Financière & Facturation
 */
export function generateFinancialReportExcel(data: {
  summary: {
    totalFactureTtc: number;
    totalAcomptesEncaisses: number;
    totalSoldesAEncaisser: number;
    totalQuotesTtc: number;
    invoicesCount: number;
    quotesCount: number;
  };
  invoices: any[];
  quotes: any[];
}): Buffer {
  const wb = XLSX.utils.book_new();

  // 1. Feuille Synthèse Globale
  const kpiData = [
    ["RAPPORT FINANCIER & GRAND LIVRE DE FACTURATION"],
    ["Rahalat Bladna - Direction Administrative & Financière"],
    ["Date d'export", new Date().toLocaleDateString("fr-FR")],
    [""],
    ["INDICATEURS CLÉS (KPI)"],
    ["Total Facturé Réel (TTC)", data.summary.totalFactureTtc],
    ["Acomptes Encaissés (MAD)", data.summary.totalAcomptesEncaisses],
    ["Soldes Restants à Encaisser (MAD)", data.summary.totalSoldesAEncaisser],
    ["Devis B2B en cours (MAD)", data.summary.totalQuotesTtc],
    ["Nombre de Factures Émises", data.summary.invoicesCount],
    ["Nombre de Devis Émis", data.summary.quotesCount],
  ];

  const wsKpi = XLSX.utils.aoa_to_sheet(kpiData);
  wsKpi["!cols"] = [{ wch: 35 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsKpi, "Synthèse KPIs");

  // 2. Feuille Factures
  const invoiceHeaders = [
    "N° Facture",
    "Réf. Dossier",
    "Type",
    "Statut",
    "Client",
    "Téléphone",
    "Circuit",
    "Dates de Voyage",
    "Passagers",
    "Total HT (MAD)",
    "TVA 20% (MAD)",
    "Total TTC (MAD)",
    "Acompte Versé (MAD)",
    "Solde Dû (MAD)",
    "Date d'Émission",
  ];

  const invoiceRows = data.invoices.map((inv) => [
    inv.invoiceNumber,
    inv.bookingId || "N/A",
    inv.type === "FACTURE_SOLDE" ? "Solde" : "Acompte",
    inv.status,
    inv.clientName,
    inv.clientPhone,
    inv.tripTitle,
    inv.travelDates,
    inv.passengerCount,
    inv.totalHt,
    inv.tvaAmount,
    inv.totalTtcMad,
    inv.depositPaidMad,
    inv.remainingBalanceMad,
    inv.issuedAt,
  ]);

  const wsInvoices = XLSX.utils.aoa_to_sheet([invoiceHeaders, ...invoiceRows]);
  wsInvoices["!cols"] = [
    { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 15 },
    { wch: 25 }, { wch: 18 }, { wch: 30 }, { wch: 20 },
    { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 18 }, { wch: 15 }, { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, wsInvoices, "Factures Officielles");

  // 3. Feuille Devis
  const quoteHeaders = [
    "N° Devis",
    "Réf. Dossier",
    "Statut",
    "Client B2B / Pro",
    "Téléphone",
    "Circuit / Prestation",
    "Passagers",
    "Total HT (MAD)",
    "TVA (MAD)",
    "Total TTC (MAD)",
    "Date de Création",
  ];

  const quoteRows = data.quotes.map((q) => [
    q.invoiceNumber,
    q.bookingId || "N/A",
    q.status,
    q.clientName,
    q.clientPhone,
    q.tripTitle,
    q.passengerCount,
    q.totalHt,
    q.tvaAmount,
    q.totalTtcMad,
    q.issuedAt,
  ]);

  const wsQuotes = XLSX.utils.aoa_to_sheet([quoteHeaders, ...quoteRows]);
  wsQuotes["!cols"] = [
    { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 25 },
    { wch: 18 }, { wch: 30 }, { wch: 10 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, wsQuotes, "Devis & Proformas");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return buffer;
}

/**
 * Génère le modèle Excel (.xlsx) téléchargeable pour l'import de voyageurs
 */
export function generatePassengerImportTemplate(): Buffer {
  const wb = XLSX.utils.book_new();

  const instructions = [
    ["MODÈLE OFFICIEL D'IMPORT DE VOYAGEURS - RAHALAT BLADNA"],
    ["Instructions :"],
    ["1. Remplissez les informations de chaque passager ci-dessous."],
    ["2. Les colonnes 'Nom Complet' et 'CIN ou Passeport' sont STRICTEMENT obligatoires."],
    ["3. Catégorie acceptée : ADULTE ou ENFANT."],
    ["4. Enregistrez le fichier au format .xlsx ou .csv avant de l'importer."],
    [""],
    [
      "Nom Complet (Obligatoire)",
      "CIN ou Passeport (Obligatoire)",
      "Téléphone (Optionnel)",
      "Catégorie (ADULTE / ENFANT)",
      "Contact d'Urgence (Nom & Tél)",
    ],
    [
      "Karim Bennani",
      "BE890123",
      "+212 661-123456",
      "ADULTE",
      "Fatima Bennani (+212 661-998877)",
    ],
    [
      "Salma Mansouri",
      "CD456789",
      "+212 662-654321",
      "ADULTE",
      "Omar Mansouri (+212 662-112233)",
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(instructions);
  ws["!cols"] = [
    { wch: 30 },
    { wch: 25 },
    { wch: 22 },
    { wch: 25 },
    { wch: 35 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Modèle Import");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return buffer;
}

export interface ParsedTravelerItem {
  fullName: string;
  cinPassport: string;
  phone?: string;
  category: "ADULTE" | "ENFANT";
  emergencyContact?: string;
}

/**
 * Parse et valide un fichier Excel/CSV téléversé pour l'import de voyageurs
 */
export function parsePassengersExcel(fileBuffer: Buffer | ArrayBuffer): {
  success: boolean;
  data: ParsedTravelerItem[];
  errors: string[];
  totalRows: number;
} {
  try {
    const wb = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];

    if (!ws) {
      return { success: false, data: [], errors: ["Le fichier Excel est vide ou illisible."], totalRows: 0 };
    }

    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

    // Trouver la ligne d'en-tête (cherche "Nom Complet" ou "Nom" ou "CIN")
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const rowStr = rows[i].map((c) => String(c).toLowerCase()).join(" ");
      if (rowStr.includes("nom") && (rowStr.includes("cin") || rowStr.includes("passeport"))) {
        headerRowIdx = i;
        break;
      }
    }

    if (headerRowIdx === -1) {
      return {
        success: false,
        data: [],
        errors: ["En-tête introuvable. Veuillez utiliser le modèle Excel officiel."],
        totalRows: 0,
      };
    }

    const header = rows[headerRowIdx].map((c) => String(c).trim().toLowerCase());

    const nameIdx = header.findIndex((h) => h.includes("nom"));
    const cinIdx = header.findIndex((h) => h.includes("cin") || h.includes("passeport"));
    const phoneIdx = header.findIndex((h) => h.includes("tél") || h.includes("phone") || h.includes("contact"));
    const categoryIdx = header.findIndex((h) => h.includes("catégorie") || h.includes("category"));
    const emergencyIdx = header.findIndex((h) => h.includes("urgence") || h.includes("emergency"));

    const data: ParsedTravelerItem[] = [];
    const errors: string[] = [];

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.every((c) => String(c).trim() === "")) continue; // Ligne vide

      const lineNum = i + 1;
      const fullName = nameIdx >= 0 ? String(row[nameIdx] || "").trim() : "";
      const cinPassport = cinIdx >= 0 ? String(row[cinIdx] || "").trim().toUpperCase() : "";
      const phone = phoneIdx >= 0 ? String(row[phoneIdx] || "").trim() : undefined;
      const rawCategory = categoryIdx >= 0 ? String(row[categoryIdx] || "").trim().toUpperCase() : "ADULTE";
      const emergencyContact = emergencyIdx >= 0 ? String(row[emergencyIdx] || "").trim() : undefined;

      if (!fullName || fullName.length < 2) {
        errors.push(`Ligne ${lineNum} : Le Nom Complet est manquant ou trop court.`);
        continue;
      }

      if (!cinPassport || cinPassport.length < 2) {
        errors.push(`Ligne ${lineNum} : Le N° CIN / Passeport est obligatoire (${fullName}).`);
        continue;
      }

      const category: "ADULTE" | "ENFANT" = rawCategory.includes("ENF") ? "ENFANT" : "ADULTE";

      data.push({
        fullName,
        cinPassport,
        phone: phone || undefined,
        category,
        emergencyContact: emergencyContact || undefined,
      });
    }

    return {
      success: errors.length === 0,
      data,
      errors,
      totalRows: data.length + errors.length,
    };
  } catch (err: any) {
    return {
      success: false,
      data: [],
      errors: [`Erreur lors de la lecture du fichier : ${err.message}`],
      totalRows: 0,
    };
  }
}

export interface ClientExportItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  bookingsCount: number;
  totalSpentMAD: number;
  registeredAt: string;
}

/**
 * Génère le fichier Excel (.xlsx) de la base de données Clients CRM
 */
export function generateClientsListExcel(clients: ClientExportItem[]): Buffer {
  const wb = XLSX.utils.book_new();

  const header = [
    ["BASE DE DONNÉES CLIENTS & CRM - RAHALAT BLADNA"],
    [`Date d'exportation : ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`],
    [`Total Clients : ${clients.length}`],
    [""],
    [
      "N°",
      "Nom Complet",
      "Email",
      "Téléphone (WhatsApp)",
      "Ville",
      "Nombre de Voyages",
      "Total Dépensé (MAD)",
      "Date d'Inscription",
    ],
  ];

  const rows = clients.map((c, idx) => [
    idx + 1,
    c.fullName,
    c.email,
    c.phone,
    c.city || "Casablanca",
    c.bookingsCount,
    c.totalSpentMAD,
    c.registeredAt,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);

  ws["!cols"] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 30 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Clients CRM");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

export interface PassengerRegistryExportItem {
  id: string;
  fullName: string;
  cinOrPassport: string;
  phone: string;
  tripTitle: string;
  departureDate: string;
  pickupCity: string;
  bookingReference: string;
  roomType: string;
  paymentStatus: string;
  isCheckedIn: boolean;
}

/**
 * Génère le Registre Passagers (.xlsx) conforme aux exigences de transport officiel
 */
export function generateAllPassengersRegistryExcel(
  passengers: PassengerRegistryExportItem[]
): Buffer {
  const wb = XLSX.utils.book_new();

  const header = [
    ["REGISTRE NOMINATIF DES PASSAGERS & VOYAGEURS - TIST"],
    ["Plateforme : Rahalat Bladna (رحلات بلادنا)"],
    [`Date d'édition : ${new Date().toLocaleDateString("fr-FR")}`],
    [`Total Voyageurs : ${passengers.length}`],
    [""],
    [
      "N°",
      "Nom & Prénom (Conforme CIN)",
      "N° CIN / Passeport",
      "Téléphone",
      "Circuit Associé",
      "Date de Départ",
      "Point de Ramassage",
      "Réf. Dossier",
      "Type de Chambre",
      "Statut Paiement",
      "Présence à Bord (Pointage)",
    ],
  ];

  const rows = passengers.map((p, idx) => [
    idx + 1,
    p.fullName,
    p.cinOrPassport,
    p.phone,
    p.tripTitle,
    p.departureDate,
    p.pickupCity,
    p.bookingReference,
    p.roomType || "Double Twin",
    p.paymentStatus,
    p.isCheckedIn ? "PRÉSENT À BORD" : "EN ATTENTE",
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);

  ws["!cols"] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 20 },
    { wch: 18 },
    { wch: 32 },
    { wch: 16 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 24 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Registre Passagers");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

export interface BookingExportItem {
  id: string;
  reference: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  tripTitle: string;
  departureDate: string;
  passengersCount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

/**
 * Génère le fichier Excel (.xlsx) de tous les dossiers de réservations
 */
export function generateBookingsListExcel(bookings: BookingExportItem[]): Buffer {
  const wb = XLSX.utils.book_new();

  const header = [
    ["RÉPERTOIRE DES RÉSERVATIONS & DOSSIERS - RAHALAT BLADNA"],
    [`Date d'extraction : ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`],
    [`Total Dossiers : ${bookings.length}`],
    [""],
    [
      "N°",
      "Réf. Dossier",
      "Client / Acheteur",
      "Téléphone",
      "Email",
      "Circuit",
      "Date Départ",
      "Nb Places",
      "Total TTC (MAD)",
      "Acompte / Payé (MAD)",
      "Solde Dû (MAD)",
      "Statut Réservation",
      "Statut Paiement",
      "Date Création",
    ],
  ];

  const rows = bookings.map((b, idx) => [
    idx + 1,
    b.reference,
    b.clientName,
    b.clientPhone,
    b.clientEmail,
    b.tripTitle,
    b.departureDate,
    b.passengersCount,
    b.totalAmount,
    b.amountPaid,
    b.balanceDue,
    b.status,
    b.paymentStatus,
    b.createdAt,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);

  ws["!cols"] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 25 },
    { wch: 18 },
    { wch: 25 },
    { wch: 30 },
    { wch: 15 },
    { wch: 10 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 22 },
    { wch: 18 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Réservations");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}


