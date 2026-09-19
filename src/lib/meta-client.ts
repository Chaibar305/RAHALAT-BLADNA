/**
 * Client-Side Meta Pixel Tracking Engine (Rahalat Bladna)
 * Supporte la déduplication stricte Pixel Client <-> Conversions API (CAPI) via eventId.
 */

declare global {
  interface Window {
    fbq?: {
      (action: "track" | "trackCustom" | "init", eventName: string, params?: Record<string, any>, options?: { eventID?: string }): void;
      loaded?: boolean;
      version?: string;
      queue?: any[];
      callMethod?: (...args: any[]) => void;
    };
    _fbq?: any;
  }
}

// Événements standards officiels Meta
const STANDARD_META_EVENTS = new Set([
  "PageView",
  "ViewContent",
  "Search",
  "AddToCart",
  "AddToWishlist",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Purchase",
  "Lead",
  "CompleteRegistration",
  "Contact",
  "CustomizeProduct",
  "Donate",
  "FindLocation",
  "Schedule",
  "StartTrial",
  "SubmitApplication",
  "Subscribe",
]);

/**
 * Génère un identifiant unique d'événement partagé entre le Pixel Client et la CAPI Serveur
 * pour garantir une déduplication 1:1 sans doublon dans Meta Events Manager.
 */
export function generateMetaEventId(prefix = "rb_evt"): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${randomStr}`;
}

/**
 * Envoie un événement Meta Pixel côté client avec support de l'eventID pour déduplication CAPI.
 * 
 * @param eventName Nom de l'événement (ex: "PageView", "ViewContent", "InitiateCheckout", "Lead")
 * @param params Paramètres de l'événement (ex: { content_name, value, currency, content_ids })
 * @param eventId Identifiant unique pour la déduplication CAPI (optionnel mais fortement recommandé)
 */
export function trackClientMetaEvent(
  eventName: string,
  params?: Record<string, any>,
  eventId?: string
): void {
  if (typeof window === "undefined") {
    return;
  }

  const options = eventId ? { eventID: eventId } : undefined;
  const isStandard = STANDARD_META_EVENTS.has(eventName);
  const actionType = isStandard ? "track" : "trackCustom";

  if (process.env.NODE_ENV !== "production") {
    console.log(`📊 [Meta Pixel Client] [${actionType}] ${eventName}`, {
      params: params || {},
      eventId,
    });
  }

  if (typeof window.fbq === "function") {
    try {
      if (options) {
        window.fbq(actionType, eventName, params || {}, options);
      } else {
        window.fbq(actionType, eventName, params || {});
      }
    } catch (err) {
      console.warn("⚠️ [Meta Pixel Client] Erreur lors de l'appel fbq:", err);
    }
  } else {
    // Si le script est en cours de chargement asynchrone, réessayer rapidement
    const retryTimeout = setTimeout(() => {
      if (typeof window.fbq === "function") {
        try {
          if (options) {
            window.fbq(actionType, eventName, params || {}, options);
          } else {
            window.fbq(actionType, eventName, params || {});
          }
        } catch (e) {
          // ignore
        }
      }
      clearTimeout(retryTimeout);
    }, 500);
  }
}
