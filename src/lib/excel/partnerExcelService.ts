import * as XLSX from "xlsx";
import { PartnerType } from "@prisma/client";

export interface PartnerExportItem {
  id: string;
  type: PartnerType;
  companyName: string;
  contactName: string;
  phone: string;
  city: string;
  email?: string | null;
  notes?: string | null;
  rateDetails?: string | null;
  capacity?: number | null;
  vehicleType?: string | null;
  plateNumber?: string | null;
  activityType?: string | null;
}

export interface ImportPartnerRecord {
  type: PartnerType;
  companyName: string;
  contactName: string;
  phone: string;
  city: string;
  email?: string;
  notes?: string;
  rateDetails?: string;
  capacity?: number;
  vehicleType?: string;
  plateNumber?: string;
  activityType?: string;
}

/**
 * Formate le type de partenaire en libellé lisible pour l'export Excel
 */
export function formatPartnerTypeLabel(type: PartnerType): string {
  if (type === "LEISURE_ACTIVITY" || type === "ACTIVITE_LOISIR") {
    return "Activité & Loisir";
  }
  if (type === "HOTEL_AUBERGE" || type === "HOTEL_BIVOUAC") {
    return "Hôtel & Bivouac";
  }
  return "Transporteur TIST";
}

/**
 * Normalise une chaîne de texte pour déterminer le PartnerType Prisma
 */
export function normalizePartnerType(rawType: string): PartnerType {
  const lower = (rawType || "").toLowerCase().trim();

  if (
    lower.includes("activité") ||
    lower.includes("activite") ||
    lower.includes("loisir") ||
    lower.includes("plongée") ||
    lower.includes("plongee") ||
    lower.includes("quad") ||
    lower.includes("buggy") ||
    lower.includes("jet ski") ||
    lower.includes("jetski") ||
    lower.includes("barque") ||
    lower.includes("bateau") ||
    lower.includes("dromadaire") ||
    lower.includes("parapente") ||
    lower.includes("excursion") ||
    lower.includes("nautique")
  ) {
    return "LEISURE_ACTIVITY";
  }

  if (
    lower.includes("transport") ||
    lower.includes("tist") ||
    lower.includes("autocar") ||
    lower.includes("minibus") ||
    lower.includes("chauffeur") ||
    lower.includes("bus")
  ) {
    return "TRANSPORTER_TIST";
  }

  return "HOTEL_BIVOUAC";
}

/**
 * Extrait une valeur numérique de coût depuis une chaîne tarifaire (ex: "350 MAD")
 */
function extractNumberFromRate(rateText?: string | null): number | null {
  if (!rateText) return null;
  const match = rateText.match(/\d+([.,]\d+)?/);
  if (!match) return null;
  const val = parseFloat(match[0].replace(",", "."));
  return isNaN(val) ? null : val;
}

/**
 * Exporte la liste des partenaires au format Excel (.xlsx) avec styling et colonnes auto-dimensionnées
 */
export function exportPartnersToExcel(partners: PartnerExportItem[], customFilename?: string) {
  const wb = XLSX.utils.book_new();

  const headers = [
    "ID / Réf",
    "Type de Partenaire",
    "Nom de l'Établissement / Société",
    "Spécialité / Catégorie",
    "Ville / Spot",
    "Responsable / Contact",
    "Téléphone WhatsApp",
    "Email",
    "Tarif Négocié B2B (MAD)",
    "Prix Public Vente (MAD)",
    "Marge / Commission (MAD)",
    "Statut",
    "Notes & Conventions",
  ];

  const rows = partners.map((p, idx) => {
    const typeLabel = formatPartnerTypeLabel(p.type);

    let specialty = "";
    if (p.type === "LEISURE_ACTIVITY" || p.type === "ACTIVITE_LOISIR") {
      specialty = p.activityType || "Activités & Loisirs";
    } else if (p.type === "TRANSPORT_TOURISTIQUE" || p.type === "TRANSPORTER_TIST") {
      specialty = p.vehicleType || (p.capacity ? `Autocar ${p.capacity} places` : "Transport TIST");
    } else {
      specialty = p.capacity ? `${p.capacity} places / lits` : "Hôtel / Bivouac";
    }

    const b2bCost = extractNumberFromRate(p.rateDetails);
    const publicPrice = b2bCost ? Math.round(b2bCost * 1.25) : null;
    const margin = b2bCost && publicPrice ? publicPrice - b2bCost : null;

    return [
      p.id.slice(-8).toUpperCase() || `PRT-${idx + 1}`,
      typeLabel,
      p.companyName || "",
      specialty,
      p.city || "",
      p.contactName || "",
      p.phone || "",
      p.email || "",
      b2bCost ? `${b2bCost} MAD` : p.rateDetails || "Sur devis",
      publicPrice ? `${publicPrice} MAD` : "Selon package",
      margin ? `${margin} MAD` : "Standard",
      "Actif",
      p.notes || p.rateDetails || "",
    ];
  });

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Ajustement automatique des largeurs de colonnes (!cols)
  ws["!cols"] = [
    { wch: 12 }, // ID / Réf
    { wch: 22 }, // Type
    { wch: 32 }, // Société
    { wch: 28 }, // Spécialité
    { wch: 18 }, // Ville
    { wch: 24 }, // Contact
    { wch: 20 }, // Téléphone
    { wch: 26 }, // Email
    { wch: 22 }, // Tarif B2B
    { wch: 22 }, // Prix Public
    { wch: 22 }, // Marge
    { wch: 12 }, // Statut
    { wch: 36 }, // Notes
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Partenaires");

  const today = new Date().toISOString().split("T")[0];
  const filename = customFilename || `Partenaires_Rahalat_Bladna_${today}.xlsx`;

  XLSX.writeFile(wb, filename);
}

/**
 * Télécharge un modèle Excel vierge pré-rempli avec des lignes d'exemples réalistes
 */
export function downloadPartnersImportTemplate() {
  const wb = XLSX.utils.book_new();

  const headers = [
    "Type de Partenaire (Hôtel / Transport / Activité)",
    "Nom de l'Établissement / Société *",
    "Spécialité / Type d'activité ou Véhicule",
    "Ville / Spot *",
    "Responsable / Contact *",
    "Téléphone WhatsApp *",
    "Email",
    "Capacité (places/lits/machines)",
    "Tarif Négocié B2B (MAD)",
    "Immatriculation ou N° Agrément",
    "Notes & Conventions",
  ];

  const sampleRows = [
    [
      "Activité & Loisir",
      "Dunes Quad Merzouga",
      "Quad & Buggy Désert",
      "Merzouga",
      "Hassan Amraoui",
      "+212 661-889900",
      "contact@dunesquad.ma",
      25,
      "350 MAD / heure avec guide et essence",
      "RC Pro AXA 982104",
      "Tarif préférentiel groupe à partir de 10 personnes. Casques inclus.",
    ],
    [
      "Hôtel & Bivouac",
      "Kasbah Hotel Yasmina",
      "Chambres climatisées & Tentes VIP",
      "Merzouga",
      "Fatima Zahra",
      "+212 662-112233",
      "reservation@kasbahyasmina.com",
      80,
      "450 MAD / personne demi-pension",
      "Classement 4 étoiles",
      "Petit déjeuner buffet marocain et dîner traditionnel inclus.",
    ],
    [
      "Transporteur TIST",
      "Trans Atlas Voyages SARL",
      "Autocar Grand Tourisme 48 places",
      "Casablanca",
      "Rachid El Alami",
      "+212 663-445566",
      "direction@transatlas.ma",
      48,
      "4 500 MAD / forfait 3 jours",
      "45210|A|6",
      "Carburant, autoroute et hébergement du chauffeur pris en charge.",
    ],
  ];

  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!cols"] = [
    { wch: 28 }, // Type
    { wch: 30 }, // Nom Société
    { wch: 32 }, // Spécialité
    { wch: 18 }, // Ville
    { wch: 22 }, // Contact
    { wch: 20 }, // Téléphone
    { wch: 26 }, // Email
    { wch: 16 }, // Capacité
    { wch: 28 }, // Tarif
    { wch: 24 }, // Immat / Agrément
    { wch: 40 }, // Notes
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Modèle Partenaires");

  XLSX.writeFile(wb, "Modele_Import_Partenaires_Rahalat_Bladna.xlsx");
}

/**
 * Analyse et valide un fichier Excel téléversé côté client
 */
export async function parsePartnersExcelFile(file: File): Promise<{
  validRecords: ImportPartnerRecord[];
  errors: string[];
  totalRows: number;
}> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return { validRecords: [], errors: ["Le classeur Excel ne contient aucune feuille."], totalRows: 0 };
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (rawRows.length <= 1) {
    return { validRecords: [], errors: ["Le fichier est vide ou ne contient que la ligne d'en-tête."], totalRows: 0 };
  }

  // Première ligne = en-têtes
  const headerRow = (rawRows[0] || []).map((h) => String(h || "").toLowerCase().trim());

  // Indexation tolérante des colonnes
  const findColIndex = (candidates: string[]) => {
    return headerRow.findIndex((h) => candidates.some((c) => h.includes(c)));
  };

  const idxType = findColIndex(["type", "catégorie", "categorie"]);
  const idxName = findColIndex(["nom", "société", "societe", "établissement", "etablissement", "entreprise"]);
  const idxSpecialty = findColIndex(["spécialité", "specialite", "activité", "activite", "véhicule", "vehicule"]);
  const idxCity = findColIndex(["ville", "spot", "région", "region", "adresse"]);
  const idxContact = findColIndex(["responsable", "contact", "gérant", "gerant", "nom contact"]);
  const idxPhone = findColIndex(["téléphone", "telephone", "phone", "whatsapp", "gsm", "tel"]);
  const idxEmail = findColIndex(["email", "e-mail", "courriel", "mail"]);
  const idxCapacity = findColIndex(["capacité", "capacite", "places", "lits", "machines"]);
  const idxRate = findColIndex(["tarif", "prix", "b2b", "conditions"]);
  const idxPlate = findColIndex(["immatriculation", "immat", "agrément", "agrement", "police", "assurance"]);
  const idxNotes = findColIndex(["note", "convention", "accord", "remarque"]);

  const validRecords: ImportPartnerRecord[] = [];
  const errors: string[] = [];
  const dataRows = rawRows.slice(1);

  dataRows.forEach((row, index) => {
    const rowNum = index + 2; // 1-indexé + en-tête
    if (!row || row.length === 0 || row.every((c) => c === undefined || c === null || String(c).trim() === "")) {
      return; // Ligne vide ignorée
    }

    const companyName = idxName !== -1 && row[idxName] ? String(row[idxName]).trim() : "";
    const phone = idxPhone !== -1 && row[idxPhone] ? String(row[idxPhone]).trim() : "";
    const city = idxCity !== -1 && row[idxCity] ? String(row[idxCity]).trim() : "Maroc";
    const contactName = idxContact !== -1 && row[idxContact] ? String(row[idxContact]).trim() : companyName;
    const rawType = idxType !== -1 && row[idxType] ? String(row[idxType]) : "";
    const specialty = idxSpecialty !== -1 && row[idxSpecialty] ? String(row[idxSpecialty]).trim() : "";
    const email = idxEmail !== -1 && row[idxEmail] ? String(row[idxEmail]).trim() : undefined;
    const rateDetails = idxRate !== -1 && row[idxRate] ? String(row[idxRate]).trim() : undefined;
    const plateNumber = idxPlate !== -1 && row[idxPlate] ? String(row[idxPlate]).trim() : undefined;
    const notes = idxNotes !== -1 && row[idxNotes] ? String(row[idxNotes]).trim() : undefined;
    const rawCapacity = idxCapacity !== -1 ? row[idxCapacity] : undefined;
    const capacity = rawCapacity ? parseInt(String(rawCapacity).replace(/\D/g, ""), 10) || undefined : undefined;

    // Validation minimale
    if (!companyName) {
      errors.push(`Ligne ${rowNum} : Nom de l'établissement / société manquant.`);
      return;
    }
    if (!phone) {
      errors.push(`Ligne ${rowNum} (${companyName}) : Numéro de téléphone / WhatsApp manquant.`);
      return;
    }

    const type = normalizePartnerType(rawType || specialty || companyName);

    const record: ImportPartnerRecord = {
      type,
      companyName,
      contactName,
      phone,
      city,
      email: email || undefined,
      rateDetails: rateDetails || undefined,
      notes: notes || undefined,
      capacity: capacity || (type === "LEISURE_ACTIVITY" ? 20 : type === "TRANSPORTER_TIST" ? 48 : 50),
      vehicleType: type === "TRANSPORTER_TIST" ? (specialty || "Autocar Tourisme") : undefined,
      plateNumber: plateNumber || undefined,
      activityType: type === "LEISURE_ACTIVITY" ? (specialty || "Activité & Loisir") : undefined,
    };

    validRecords.push(record);
  });

  return {
    validRecords,
    errors,
    totalRows: dataRows.length,
  };
}
