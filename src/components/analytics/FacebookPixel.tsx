"use client";

import React, { useEffect, useRef, Suspense } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";

const DEFAULT_PIXEL_ID = "1384107910546340";

function PixelRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Évite le double PageView lors du premier chargement (déjà envoyé par le script d'initialisation)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      if (process.env.NODE_ENV !== "production") {
        console.log(`📊 [Meta Pixel] Route change PageView: ${pathname}`);
      }
      window.fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  return null;
}

export function FacebookPixel() {
  return (
    <Suspense fallback={null}>
      <PixelRouteTracker />
    </Suspense>
  );
}

export default FacebookPixel;

