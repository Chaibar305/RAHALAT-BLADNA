/**
 * Système d'attribution & de suivi des canaux d'acquisition publicitaires
 * Gère la détection, la normalisation et la persistance des canaux :
 * - meta_ads (Facebook / Instagram Ads, fbclid)
 * - tiktok_ads (TikTok Ads, ttclid)
 * - google_ads (Google Search / Ads, gclid)
 * - whatsapp_direct (WhatsApp Direct)
 * - direct (Trafic Direct / Organique)
 */

export interface TrafficAttribution {
  source: string; // e.g. "meta_ads", "tiktok_ads", "google_ads", "whatsapp_direct", "direct"
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
}

const STORAGE_KEY = "rb_traffic_attribution";

/**
 * Normalise n'importe quelle chaîne de source ou UTM en canal standardisé
 */
export function normalizeTrafficSource(source?: string | null, utmSource?: string | null): string {
  const raw = (source || utmSource || "").trim().toLowerCase();

  if (!raw) return "direct";

  // 1. Meta (Facebook / Instagram)
  if (
    raw.includes("meta") ||
    raw.includes("facebook") ||
    raw.includes("fb") ||
    raw.includes("instagram") ||
    raw.includes("ig") ||
    raw === "fbclid"
  ) {
    return "meta_ads";
  }

  // 2. TikTok
  if (raw.includes("tiktok") || raw.includes("ttclid")) {
    return "tiktok_ads";
  }

  // 3. Snapchat
  if (raw.includes("snapchat") || raw.includes("snap") || raw === "scclid") {
    return "snapchat_ads";
  }

  // 3. Google
  if (raw.includes("google") || raw.includes("adwords") || raw.includes("gclid")) {
    return "google_ads";
  }

  // 4. WhatsApp
  if (raw.includes("whatsapp") || raw.includes("wa")) {
    return "whatsapp_direct";
  }

  // 5. Direct / Organique
  if (raw === "direct" || raw === "organic" || raw === "organique" || raw === "web_form") {
    return "direct";
  }

  // Autre canal spécifique passé explicitement
  return raw;
}

/**
 * Analyse l'URL et le document.referrer côté client pour déterminer l'attribution
 */
export function detectClientAttribution(): TrafficAttribution {
  if (typeof window === "undefined") {
    return { source: "direct" };
  }

  try {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;

    const utmSource = searchParams.get("utm_source");
    const utmMedium = searchParams.get("utm_medium");
    const utmCampaign = searchParams.get("utm_campaign");
    const utmContent = searchParams.get("utm_content");
    const utmTerm = searchParams.get("utm_term");
    const rawSource = searchParams.get("source");

    const fbclid = searchParams.get("fbclid");
    const ttclid = searchParams.get("ttclid");
    const gclid = searchParams.get("gclid");

    let referrer = "";
    try {
      referrer = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : "";
    } catch {
      // Ignorer erreur URL referrer
    }

    let detectedSource = "direct";

    if (rawSource) {
      detectedSource = normalizeTrafficSource(rawSource, utmSource);
    } else if (utmSource) {
      detectedSource = normalizeTrafficSource(undefined, utmSource);
    } else if (fbclid || referrer.includes("facebook") || referrer.includes("instagram")) {
      detectedSource = "meta_ads";
    } else if (ttclid || referrer.includes("tiktok")) {
      detectedSource = "tiktok_ads";
    } else if (searchParams.get("scclid") || referrer.includes("snapchat")) {
      detectedSource = "snapchat_ads";
    } else if (gclid || referrer.includes("google")) {
      detectedSource = "google_ads";
    } else if (referrer.includes("whatsapp") || referrer.includes("wa.me")) {
      detectedSource = "whatsapp_direct";
    }

    return {
      source: detectedSource,
      utmSource: utmSource || (detectedSource !== "direct" ? detectedSource : null),
      utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null,
      utmContent: utmContent || null,
      utmTerm: utmTerm || null,
    };
  } catch (e) {
    console.warn("⚠️ [Attribution] Erreur lors de la détection de la source :", e);
    return { source: "direct" };
  }
}

/**
 * Enregistre l'attribution en session (si non vide) pour préserver le canal
 * tout au long du parcours du visiteur sur le site.
 */
export function captureAndStoreAttribution(): TrafficAttribution {
  if (typeof window === "undefined") {
    return { source: "direct" };
  }

  try {
    const detected = detectClientAttribution();

    // Si on a une source publicitaire détectée sur l'URL actuelle, elle prend priorité
    if (detected.source !== "direct") {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(detected));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(detected));
      } catch {}
      return detected;
    }

    // Sinon, on vérifie si une source avait déjà été mémorisée plus tôt dans la session
    const stored = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as TrafficAttribution;
      } catch {}
    }

    // Si rien n'est mémorisé, on stocke "direct"
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(detected));
    return detected;
  } catch (e) {
    return { source: "direct" };
  }
}

/**
 * Récupère l'attribution actuelle (mémorisée ou fraîche)
 */
export function getStoredTrafficAttribution(): TrafficAttribution {
  if (typeof window === "undefined") {
    return { source: "direct" };
  }

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as TrafficAttribution;
    }
  } catch {}

  return captureAndStoreAttribution();
}
