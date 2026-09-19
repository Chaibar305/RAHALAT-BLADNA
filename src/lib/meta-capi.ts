import crypto from "crypto";
import { headers, cookies } from "next/headers";

const GRAPH_API_VERSION = "v19.0";
const DEFAULT_PIXEL_ID = "1384107910546340";
const DEFAULT_ACCESS_TOKEN =
  "EAAZAxkCMvS0sBStiS0TBmw4TCzKTiNgsHowoCM9xFCPCND83w8A1E5MXhifr1zieryt5PaTS1wd7LEwK8Q3PLQjdV61JC7TN24yXCGqHtuNxUVZBY3I7oUSZCGKPxoPw6tpn7mbbUtV8SEzlZCEZAvZBVZCdZBv2cn7cFQcJr3jlq1ELhYO4gM0nlPH1Jbh5WgZDZD";
const DEFAULT_TEST_EVENT_CODE = "TEST30022";

export interface MetaUserDataInput {
  email?: string | null;
  phone?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  country?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}

export interface MetaCustomDataInput {
  currency?: string;
  value?: number;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  contents?: Array<{
    id: string;
    quantity?: number;
    item_price?: number;
  }>;
  num_items?: number;
  order_id?: string;
  [key: string]: any;
}

export interface MetaCapiEventPayload {
  eventName: "PageView" | "ViewContent" | "InitiateCheckout" | "Lead" | "Purchase" | string;
  eventId: string;
  eventTime?: number;
  eventSourceUrl?: string;
  userData?: MetaUserDataInput;
  customData?: MetaCustomDataInput;
}

/**
 * Hachage cryptographique standard SHA-256 requis par Meta Conversions API (minuscules, sans espaces).
 */
export function hashSha256(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Normalisation stricte des numéros de téléphone marocains au format international sans signe + (ex: 212612345678).
 */
export function normalizeMoroccanPhone(phone: string | undefined | null): string | undefined {
  if (!phone) return undefined;

  // Supprimer tous les espaces, tirets, parenthèses et points
  let digits = phone.replace(/[^\d+]/g, "").trim();
  if (digits.startsWith("+")) {
    digits = digits.substring(1);
  }

  // Si numéro marocain local commençant par 0 (ex: 06..., 07..., 05...)
  if (digits.startsWith("0") && digits.length >= 10) {
    digits = "212" + digits.substring(1);
  } else if ((digits.startsWith("6") || digits.startsWith("7") || digits.startsWith("5")) && digits.length === 9) {
    // Si format sans 0 (ex: 612345678)
    digits = "212" + digits;
  }

  return digits.length >= 9 ? digits : undefined;
}

/**
 * Extraction et normalisation du prénom (première chaîne avant l'espace, minuscules).
 */
export function normalizeFirstName(name: string | undefined | null): string | undefined {
  if (!name) return undefined;
  const parts = name.trim().split(/\s+/);
  const first = parts[0];
  return first ? first.toLowerCase().trim() : undefined;
}

/**
 * Normalisation de la ville (minuscules, suppression des accents et caractères spéciaux).
 */
export function normalizeCity(city: string | undefined | null): string | undefined {
  if (!city) return undefined;
  return city
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents (ex: Casablanca, Kénitra -> kenitra)
    .replace(/[^a-z0-9]/g, ""); // Supprime espaces et symboles
}

/**
 * Extraction dynamique des métadonnées réseau et cookies depuis next/headers.
 */
function getClientRequestContext() {
  let clientIp = "";
  let clientUserAgent = "";
  let fbp = "";
  let fbc = "";

  try {
    const reqHeaders = headers();
    const forwardedFor = reqHeaders.get("x-forwarded-for");
    if (forwardedFor) {
      clientIp = forwardedFor.split(",")[0].trim();
    } else {
      clientIp = reqHeaders.get("x-real-ip") || "";
    }
    clientUserAgent = reqHeaders.get("user-agent") || "";
  } catch {
    // Hors contexte de requête serveur
  }

  try {
    const reqCookies = cookies();
    fbp = reqCookies.get("_fbp")?.value || "";
    fbc = reqCookies.get("_fbc")?.value || "";
  } catch {
    // Hors contexte de cookies
  }

  return { clientIp, clientUserAgent, fbp, fbc };
}

/**
 * Moteur Serveur Meta Conversions API (CAPI).
 * Envoie un événement structuré à Meta Graph API v19.0 avec hachage SHA-256 et déduplication d'eventId.
 */
export async function sendMetaCapiEvent(payload: MetaCapiEventPayload): Promise<{
  success: boolean;
  eventsReceived?: number;
  fbTraceId?: string;
  error?: any;
}> {
  const pixelId = (
    process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || DEFAULT_PIXEL_ID
  ).trim();

  const accessToken = (
    process.env.FACEBOOK_ACCESS_TOKEN || DEFAULT_ACCESS_TOKEN
  ).trim();

  const testEventCode = (
    process.env.FACEBOOK_TEST_EVENT_CODE || DEFAULT_TEST_EVENT_CODE
  )?.trim();

  if (!pixelId || !accessToken) {
    console.warn("⚠️ [Meta CAPI] Configuration manquante (PIXEL_ID ou ACCESS_TOKEN non défini).");
    return { success: false, error: "Configuration manquante" };
  }

  const { clientIp, clientUserAgent, fbp, fbc } = getClientRequestContext();

  // 1. Normalisation et Hachage SHA-256 systématique des données utilisateur
  const rawEmail = payload.userData?.email;
  const rawPhone = payload.userData?.phone;
  const rawFullName = payload.userData?.fullName;
  const rawFirstName = payload.userData?.firstName || (rawFullName ? normalizeFirstName(rawFullName) : undefined);
  const rawCity = payload.userData?.city;
  const rawCountry = payload.userData?.country || "ma";

  const hashedEmail = hashSha256(rawEmail);
  const normalizedPhone = normalizeMoroccanPhone(rawPhone);
  const hashedPhone = hashSha256(normalizedPhone);
  const hashedFirstName = hashSha256(rawFirstName);
  const hashedCity = hashSha256(normalizeCity(rawCity));
  const hashedCountry = hashSha256(rawCountry);

  const finalIp = payload.userData?.clientIpAddress || clientIp;
  const finalUserAgent = payload.userData?.clientUserAgent || clientUserAgent;
  const finalFbp = payload.userData?.fbp || fbp;
  const finalFbc = payload.userData?.fbc || fbc;

  const userDataFormatted: Record<string, any> = {};

  if (hashedEmail) userDataFormatted.em = [hashedEmail];
  if (hashedPhone) userDataFormatted.ph = [hashedPhone];
  if (hashedFirstName) userDataFormatted.fn = [hashedFirstName];
  if (hashedCity) userDataFormatted.ct = [hashedCity];
  if (hashedCountry) userDataFormatted.country = [hashedCountry];

  if (finalIp) userDataFormatted.client_ip_address = finalIp;
  if (finalUserAgent) userDataFormatted.client_user_agent = finalUserAgent;
  if (finalFbp) userDataFormatted.fbp = finalFbp;
  if (finalFbc) userDataFormatted.fbc = finalFbc;

  // 2. Construction de l'événement CAPI unifié
  const eventTime = payload.eventTime || Math.floor(Date.now() / 1000);
  const eventSourceUrl =
    payload.eventSourceUrl ||
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    "https://rahalatbladna.ma";

  const singleEventData: Record<string, any> = {
    event_name: payload.eventName,
    event_time: eventTime,
    event_id: payload.eventId,
    event_source_url: eventSourceUrl,
    action_source: "website",
    user_data: userDataFormatted,
  };

  if (payload.customData) {
    singleEventData.custom_data = {
      currency: payload.customData.currency || "MAD",
      ...payload.customData,
    };
  }

  const requestBody: Record<string, any> = {
    data: [singleEventData],
  };

  // Code de test Meta Events Manager (si activé)
  if (testEventCode) {
    requestBody.test_event_code = testEventCode;
  }

  const endpoint = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${accessToken}`;

  console.log(`📡 [Meta CAPI] Envoi événement "${payload.eventName}" (Event ID: ${payload.eventId})...`, {
    test_event_code: testEventCode || "désactivé",
    has_email: !!hashedEmail,
    has_phone: !!hashedPhone,
    has_ip: !!finalIp,
  });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ [Meta CAPI] Erreur Graph API :", result);
      return { success: false, error: result };
    }

    console.log(`✅ [Meta CAPI] Succès ! Événements reçus : ${result.events_received || 1}, FB Trace : ${result.fbtrace_id}`);
    return {
      success: true,
      eventsReceived: result.events_received,
      fbTraceId: result.fbtrace_id,
    };
  } catch (err: any) {
    console.error("❌ [Meta CAPI] Exception réseau lors de l'appel :", err?.message || err);
    return { success: false, error: err?.message || err };
  }
}
