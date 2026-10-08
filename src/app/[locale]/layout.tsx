import { ReactNode } from "react";
import { Tajawal, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { FacebookPixel } from "@/components/analytics/FacebookPixel";
import { AttributionTracker } from "@/components/analytics/AttributionTracker";
import { WebAnalyticsTracker } from "@/components/analytics/WebAnalyticsTracker";
import { DynamicTracker } from "@/components/analytics/DynamicTracker";
import { getPublicTrackingConfigAction } from "@/actions/settings.actions";
import { getPublicAgencySettingsAction } from "@/actions/agency.actions";
import { AgencySettingsProvider } from "@/components/providers/AgencySettingsProvider";
import { Analytics } from "@vercel/analytics/next";
import "../globals.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-tajawal",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Rahalat Bladna (رحلات بلادنا) - Voyages Organisés & Escapades au Maroc",
  description: "Plateforme marocaine officielle de réservation de voyages organisés, escapades du week-end, bivouacs désert Sahara et circuits touristiques.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/images/logo/logo-emblem.png", type: "image/png" },
    ],
    apple: "/images/logo/logo-emblem.png",
  },
  verification: {
    other: {
      "facebook-domain-verification": ["ztmjvrdrcuao4ixbo2nhfaxrvroxde"],
    },
  },
};

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const isRtl = locale === "ar";
  const messages = await getMessages();
  const trackingConfig = await getPublicTrackingConfigAction();
  const agencySettings = await getPublicAgencySettingsAction();

  return (
    <html
      lang={locale}
      dir={isRtl ? "rtl" : "ltr"}
      className={`${tajawal.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="facebook-domain-verification" content="ztmjvrdrcuao4ixbo2nhfaxrvroxde" />
        <DynamicTracker config={trackingConfig} />
      </head>
      <body
        className={`min-h-screen ${
          isRtl ? "font-arabic" : "font-sans"
        } antialiased selection:bg-tp-cyan-soft selection:text-tp-midnight`}
      >
        <FacebookPixel />
        <AttributionTracker />
        <WebAnalyticsTracker />
        <AuthProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
              <AgencySettingsProvider initialSettings={agencySettings}>
                <PublicLayout>
                  {children}
                </PublicLayout>
              </AgencySettingsProvider>
            </ThemeProvider>
          </NextIntlClientProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

