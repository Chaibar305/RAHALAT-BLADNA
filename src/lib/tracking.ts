/**
 * Moteur universel de déclenchement d'événements de conversion publicitaire
 * Déclenche simultanément et de façon unifiée :
 * - Meta Pixel (Facebook / Instagram)
 * - TikTok Pixel
 * - Snapchat Pixel
 * - Google Analytics 4 (GA4) & Google Ads (avec Conversion Label)
 */

export interface ConversionPayload {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  currency?: string;
  value?: number;
  order_id?: string;
  num_items?: number;
  [key: string]: any;
}

declare global {
  interface Window {
    ttq?: {
      track: (eventName: string, params?: any) => void;
      page: () => void;
      [key: string]: any;
    };
    snaptr?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    __RB_TRACKING_CONFIG?: {
      googleAdsId?: string | null;
      googleAdsConversionLabel?: string | null;
      conversionEventType?: string;
      conversionTriggerType?: string;
    };
  }
}

/**
 * Mappage des événements standards multi-plateformes
 */
const EVENT_MAPPING: Record<string, { meta: string; tiktok: string; snap: string; google: string }> = {
  lead: {
    meta: "Lead",
    tiktok: "CompleteRegistration",
    snap: "SIGN_UP",
    google: "generate_lead",
  },
  purchase: {
    meta: "Purchase",
    tiktok: "PlaceAnOrder",
    snap: "PURCHASE",
    google: "purchase",
  },
  page_view: {
    meta: "PageView",
    tiktok: "ViewContent",
    snap: "PAGE_VIEW",
    google: "page_view",
  },
  contact: {
    meta: "Contact",
    tiktok: "Contact",
    snap: "CUSTOM",
    google: "contact",
  },
  custom: {
    meta: "CustomEvent",
    tiktok: "CustomEvent",
    snap: "CUSTOM",
    google: "custom_event",
  },
};

/**
 * Déclenche un événement de conversion sur tous les pixels actifs
 */
export function trackConversion(eventType: string = "lead", payload: ConversionPayload = {}): void {
  if (typeof window === "undefined") return;

  const normalizedType = (eventType || "lead").toLowerCase();
  const mapping = EVENT_MAPPING[normalizedType] || {
    meta: eventType,
    tiktok: eventType,
    snap: eventType,
    google: eventType,
  };

  const currency = payload.currency || "MAD";
  const value = payload.value !== undefined ? Number(payload.value) : undefined;

  console.log(`🎯 [Multi-Pixel Track] Déclenchement événement "${normalizedType}" :`, payload);

  // 1. Meta / Facebook Pixel
  try {
    if (typeof window.fbq === "function") {
      window.fbq("track", mapping.meta, {
        ...payload,
        currency,
        value,
      });
      console.log(`✅ [Meta Pixel] Événement "${mapping.meta}" envoyé.`);
    }
  } catch (err) {
    console.warn("⚠️ [Meta Pixel] Erreur de tracking :", err);
  }

  // 2. TikTok Pixel
  try {
    if (window.ttq && typeof window.ttq.track === "function") {
      window.ttq.track(mapping.tiktok, {
        contents: payload.content_ids?.map((id) => ({
          content_id: id,
          content_type: "product",
          content_name: payload.content_name,
        })),
        content_name: payload.content_name,
        currency,
        value,
        quantity: payload.num_items || 1,
      });
      console.log(`✅ [TikTok Pixel] Événement "${mapping.tiktok}" envoyé.`);
    }
  } catch (err) {
    console.warn("⚠️ [TikTok Pixel] Erreur de tracking :", err);
  }

  // 3. Snapchat Pixel
  try {
    if (typeof window.snaptr === "function") {
      window.snaptr("track", mapping.snap, {
        currency,
        price: value,
        item_category: payload.content_category || "Voyage",
        item_ids: payload.content_ids,
        description: payload.content_name,
        transaction_id: payload.order_id,
        number_items: payload.num_items || 1,
      });
      console.log(`✅ [Snapchat Pixel] Événement "${mapping.snap}" envoyé.`);
    }
  } catch (err) {
    console.warn("⚠️ [Snapchat Pixel] Erreur de tracking :", err);
  }

  // 4. Google Analytics 4 (GA4) & Google Ads
  try {
    if (typeof window.gtag === "function") {
      // Événement GA4
      window.gtag("event", mapping.google, {
        event_category: payload.content_category || "Booking",
        event_label: payload.content_name,
        currency,
        value,
        transaction_id: payload.order_id,
        items: payload.content_ids?.map((id) => ({
          item_id: id,
          item_name: payload.content_name,
          price: value,
        })),
      });
      console.log(`✅ [GA4] Événement "${mapping.google}" envoyé.`);

      // Conversion Google Ads dédiée si config présente
      const adsConfig = window.__RB_TRACKING_CONFIG;
      if (adsConfig?.googleAdsId && adsConfig?.googleAdsConversionLabel) {
        const sendTo = `${adsConfig.googleAdsId}/${adsConfig.googleAdsConversionLabel}`;
        window.gtag("event", "conversion", {
          send_to: sendTo,
          value,
          currency,
          transaction_id: payload.order_id,
        });
        console.log(`✅ [Google Ads] Conversion envoyée vers "${sendTo}".`);
      }
    }
  } catch (err) {
    console.warn("⚠️ [Google gtag] Erreur de tracking :", err);
  }
}
