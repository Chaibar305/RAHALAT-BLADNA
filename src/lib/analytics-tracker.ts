/**
 * Web Analytics Tracker Client-Side - Rahalat Bladna
 * Ultra-léger, asynchrone (sendBeacon) et sans blocage du thread principal.
 */

export function getClientSessionId(): string {
  if (typeof window === "undefined") return "server_session";
  try {
    const key = "rb_analytics_sid";
    let sid = localStorage.getItem(key);
    if (!sid) {
      sid = "sid_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(key, sid);
    }
    return sid;
  } catch {
    return "fallback_session_" + Date.now();
  }
}

export function detectDevice(): { device: string; os: string; browser: string } {
  if (typeof window === "undefined" || !navigator?.userAgent) {
    return { device: "mobile", os: "Android", browser: "Chrome" };
  }

  const ua = navigator.userAgent;

  // 1. Détection de l'appareil
  let device = "desktop";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    device = "tablet";
  } else if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(
      ua
    )
  ) {
    device = "mobile";
  }

  // 2. Détection du système d'exploitation
  let os = "Autre";
  if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Macintosh|Mac OS X/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  // 3. Détection du navigateur
  let browser = "Autre";
  if (/Edg/i.test(ua)) browser = "Edge";
  else if (/Chrome/i.test(ua) && !/Chromium|OPR|Edg/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua) && !/Chrome|Chromium|OPR|Edg/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/OPR|Opera/i.test(ua)) browser = "Opera";
  else if (/SamsungBrowser/i.test(ua)) browser = "Samsung Internet";

  return { device, os, browser };
}

function sendPayload(payload: any) {
  if (typeof window === "undefined") return;

  const endpoint = "/api/analytics/collect";
  const jsonStr = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([jsonStr], { type: "application/json" });
      const sent = navigator.sendBeacon(endpoint, blob);
      if (sent) return;
    }
  } catch {
    // Fallback silencieux vers fetch
  }

  try {
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jsonStr,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Échec sans impact
  }
}

/**
 * Envoie un événement de page vue
 */
export function trackPageView(path: string) {
  if (typeof window === "undefined") return;

  // Ignore l'espace admin
  if (path.includes("/admin")) return;

  const { device, os, browser } = detectDevice();
  const sessionId = getClientSessionId();
  const referrer = document.referrer || null;

  sendPayload({
    type: "pageview",
    path,
    sessionId,
    referrer,
    device,
    os,
    browser,
  });
}

/**
 * Envoie un événement personnalisé (clic WhatsApp, appel, formulaire...)
 */
export function trackCustomEvent(eventName: string, metadata?: Record<string, any>) {
  if (typeof window === "undefined") return;

  const path = window.location.pathname;
  if (path.includes("/admin")) return;

  const sessionId = getClientSessionId();

  sendPayload({
    type: "event",
    eventName,
    path,
    sessionId,
    metadata,
  });
}
