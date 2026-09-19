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
  const pixelId = (
    process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || DEFAULT_PIXEL_ID
  ).trim();

  if (!pixelId) {
    return null;
  }

  return (
    <>
      <Script
        id="facebook-pixel-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>

      <Suspense fallback={null}>
        <PixelRouteTracker />
      </Suspense>
    </>
  );
}

export default FacebookPixel;
