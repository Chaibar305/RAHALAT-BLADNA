"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let sid = sessionStorage.getItem("rb_session_id");
    if (!sid) {
      sid = "sess_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      sessionStorage.setItem("rb_session_id", sid);
    }
    return sid;
  } catch {
    return "sess_anonymous";
  }
}

export function WebAnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    // Ne pas tracer les pages internes d'administration
    if (!pathname || pathname.includes("/admin")) return;

    const search = searchParams?.toString();
    const fullUrl = `${pathname}${search ? `?${search}` : ""}`;
    if (lastPath.current === fullUrl) return;
    lastPath.current = fullUrl;

    const payload = {
      type: "pageview",
      sessionId: getOrCreateSessionId(),
      path: fullUrl,
      referrer: typeof document !== "undefined" ? document.referrer : "",
    };

    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/track", blob);
    } else {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname, searchParams]);

  return null;
}

export default WebAnalyticsTracker;

// Fonction utilitaire globale à utiliser sur les boutons (ex: Clic WhatsApp, Appel, etc.)
export function trackClientEvent(eventName: string, metadata?: Record<string, any>) {
  if (typeof window === "undefined") return;
  const payload = {
    type: "event",
    sessionId: getOrCreateSessionId(),
    eventName,
    path: window.location.pathname,
    metadata,
  };

  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/track", blob);
  } else {
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }
}
