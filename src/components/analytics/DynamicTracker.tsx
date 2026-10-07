"use client";

import React, { useEffect, useRef } from "react";
import Script from "next/script";
import { PublicTrackingConfig } from "@/actions/settings.actions";

interface DynamicTrackerProps {
  config: PublicTrackingConfig;
}

export function DynamicTracker({ config }: DynamicTrackerProps) {
  const customScriptsInjected = useRef(false);

  // Exposition de la configuration pour le moteur de conversion window.__RB_TRACKING_CONFIG
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__RB_TRACKING_CONFIG = {
        googleAdsId: config.googleAdsId,
        googleAdsConversionLabel: config.googleAdsConversionLabel,
        conversionEventType: config.conversionEventType,
        conversionTriggerType: config.conversionTriggerType,
      };
    }
  }, [config]);

  // Injection sécurisée des scripts personnalisés Head & Body
  useEffect(() => {
    if (typeof window === "undefined" || customScriptsInjected.current) return;
    customScriptsInjected.current = true;

    // 1. Custom Head Scripts
    if (config.customHeadScripts && config.customHeadScripts.trim()) {
      try {
        const container = document.createElement("div");
        container.innerHTML = config.customHeadScripts.trim();
        Array.from(container.children).forEach((node) => {
          if (node.tagName.toLowerCase() === "script") {
            const script = document.createElement("script");
            Array.from(node.attributes).forEach((attr) => script.setAttribute(attr.name, attr.value));
            script.textContent = node.textContent;
            document.head.appendChild(script);
          } else {
            document.head.appendChild(node.cloneNode(true));
          }
        });
      } catch (e) {
        console.warn("⚠️ [Custom Head Scripts] Erreur d'injection :", e);
      }
    }

    // 2. Custom Body Scripts
    if (config.customBodyScripts && config.customBodyScripts.trim()) {
      try {
        const container = document.createElement("div");
        container.innerHTML = config.customBodyScripts.trim();
        Array.from(container.children).forEach((node) => {
          if (node.tagName.toLowerCase() === "script") {
            const script = document.createElement("script");
            Array.from(node.attributes).forEach((attr) => script.setAttribute(attr.name, attr.value));
            script.textContent = node.textContent;
            document.body.appendChild(script);
          } else {
            document.body.appendChild(node.cloneNode(true));
          }
        });
      } catch (e) {
        console.warn("⚠️ [Custom Body Scripts] Erreur d'injection :", e);
      }
    }
  }, [config.customHeadScripts, config.customBodyScripts]);

  const googleTagId = config.googleAnalyticsId || config.googleAdsId;
  const hasMetaInCustomHead = Boolean(
    config.customHeadScripts &&
    (config.customHeadScripts.includes("fbevents.js") || config.customHeadScripts.includes("fbq("))
  );
  const hasGoogleInCustomHead = Boolean(
    config.customHeadScripts &&
    (config.customHeadScripts.includes("googletagmanager.com/gtag/js") || config.customHeadScripts.includes("gtag('config'"))
  );

  return (
    <>
      {/* ==================================================== */}
      {/* 1. GOOGLE ANALYTICS 4 & GOOGLE ADS (gtag.js)        */}
      {/* ==================================================== */}
      {googleTagId && !hasGoogleInCustomHead && (
        <>
          <Script
            id="google-gtag-base"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`}
          />
          <Script
            id="google-gtag-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                ${config.googleAnalyticsId ? `gtag('config', '${config.googleAnalyticsId}');` : ""}
                ${config.googleAdsId ? `gtag('config', '${config.googleAdsId}');` : ""}
              `,
            }}
          />
        </>
      )}

      {/* ==================================================== */}
      {/* 2. META / FACEBOOK PIXEL (fbq)                      */}
      {/* ==================================================== */}
      {config.facebookPixelId && !hasMetaInCustomHead && (
        <Script
          id="meta-pixel-init"
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
              fbq('init', '${config.facebookPixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}

      {/* ==================================================== */}
      {/* 3. TIKTOK PIXEL (ttq)                               */}
      {/* ==================================================== */}
      {config.tiktokPixelId && (
        <Script
          id="tiktok-pixel-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
                var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
                ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
                ttq.load('${config.tiktokPixelId}');
                ttq.page();
              }(window, document, 'ttq');
            `,
          }}
        />
      )}

      {/* ==================================================== */}
      {/* 4. SNAPCHAT PIXEL (snaptr)                          */}
      {/* ==================================================== */}
      {config.snapchatPixelId && (
        <Script
          id="snap-pixel-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
              {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
              a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;
              r.src=n;var u=t.getElementsByTagName(s)[0];
              u.parentNode.insertBefore(r,u);})(window,document,
              'https://sc-static.net/scevent.min.js');
              snaptr('init', '${config.snapchatPixelId}');
              snaptr('track', 'PAGE_VIEW');
            `,
          }}
        />
      )}
    </>
  );
}

export default DynamicTracker;
