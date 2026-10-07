"use client";

import React, { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackClientMetaEvent } from "@/lib/meta-client";

/**
 * Composant de suivi automatique des événements Meta Pixel
 * - Déclenche PageView automatiquement à chaque navigation client Next.js
 * - Détecte et suit automatiquement les interactions clés :
 *   • Clics vers WhatsApp (Contact)
 *   • Clics sur numéros de téléphone (Contact)
 *   • Clics sur boutons de réservation (InitiateCheckout)
 */
function PixelAutoEventsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  // 1. Suivi automatique de PageView lors des navigations entre les pages
  useEffect(() => {
    // Évite le double PageView au tout premier rendu (déjà envoyé par le script d'initialisation DynamicTracker)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      if (process.env.NODE_ENV !== "production") {
        console.log(`📊 [Meta Pixel Auto] Route PageView: ${pathname}`);
      }
      window.fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  // 2. Détection & Déclenchement automatique des événements au clic (WhatsApp, Téléphone, Réservation)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleAutoClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement)?.closest("a, button");
      if (!target) return;

      const href = (target as HTMLAnchorElement).href || "";
      const text = (target.textContent || "").toLowerCase().trim();

      // A. Clic automatique sur Contact (WhatsApp ou Téléphone)
      if (
        href.includes("wa.me") ||
        href.includes("api.whatsapp.com") ||
        href.includes("whatsapp://") ||
        href.startsWith("tel:")
      ) {
        const isPhone = href.startsWith("tel:");
        trackClientMetaEvent("Contact", {
          content_name: isPhone ? "Appel Téléphonique" : "Discussion WhatsApp",
          contact_type: isPhone ? "phone" : "whatsapp",
          page_path: window.location.pathname,
        });
        return;
      }

      // B. Clic automatique sur Début de réservation (InitiateCheckout)
      const isBookingCta =
        target.hasAttribute("data-booking-trigger") ||
        target.getAttribute("data-action") === "book" ||
        href.includes("#booking") ||
        href.includes("/book") ||
        text.includes("réserver") ||
        text.includes("حجز") ||
        text.includes("book now") ||
        text.includes("demande de devis");

      // Ignorer les boutons de l'espace administration (/admin)
      if (isBookingCta && !window.location.pathname.includes("/admin")) {
        trackClientMetaEvent("InitiateCheckout", {
          content_name: document.title || "Réservation Circuit",
          page_path: window.location.pathname,
        });
      }
    };

    document.addEventListener("click", handleAutoClick, { passive: true });
    return () => {
      document.removeEventListener("click", handleAutoClick);
    };
  }, []);

  return null;
}

export function FacebookPixel() {
  return (
    <Suspense fallback={null}>
      <PixelAutoEventsTracker />
    </Suspense>
  );
}

export default FacebookPixel;
