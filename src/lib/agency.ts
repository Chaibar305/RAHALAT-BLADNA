export interface AgencySettingsData {
  id: string;
  companyName: string;
  whatsappPhone: string;
  email: string;
  city: string;
  address: string | null;
  licenseNumber: string | null;
  ice: string | null;
  rc: string | null;
  taxId: string | null;
  bankRib: string | null;
  bankName: string | null;
  updatedAt?: Date;
}

export const DEFAULT_AGENCY_SETTINGS: AgencySettingsData = {
  id: "default_agency",
  companyName: "Rahalat Bladna",
  whatsappPhone: "+212681024758",
  email: "contact@rahalatbladna.ma",
  city: "Rabat",
  address: "Rabat & Casablanca, Maroc",
  licenseNumber: null,
  ice: null,
  rc: null,
  taxId: null,
  bankRib: "230810678459421100810080",
  bankName: "CIH Bank",
};

export interface UpdateAgencySettingsInput {
  // Champs conformes au modèle AgencySettings
  companyName?: string;
  whatsappPhone?: string;
  email?: string;
  city?: string;
  address?: string | null;
  licenseNumber?: string | null;
  ice?: string | null;
  rc?: string | null;
  taxId?: string | null;
  bankRib?: string | null;
  bankName?: string | null;

  // Rétrocompatibilité avec l'ancien formulaire
  name?: string;
  phone?: string;
  iceNumber?: string;
  rcNumber?: string;
  ribDetails?: string;
}

/**
 * Nettoie et normalise un numéro de téléphone marocain pour l'API wa.me
 * Ex: "+212 681-024758" -> "212681024758"
 * Ex: "0681024758" -> "212681024758"
 */
export function cleanMoroccanPhoneForWhatsApp(phone?: string | null): string {
  if (!phone) return "212681024758";
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = "212" + digits.slice(1);
  } else if (!digits.startsWith("212") && digits.length === 9) {
    digits = "212" + digits;
  }
  return digits || "212681024758";
}
