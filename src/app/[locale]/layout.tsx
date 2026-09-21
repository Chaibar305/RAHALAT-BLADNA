import { ReactNode } from "react";
import { Tajawal, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { FacebookPixel } from "@/components/analytics/FacebookPixel";
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

  return (
    <html
      lang={locale}
      dir={isRtl ? "rtl" : "ltr"}
      className={`${tajawal.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="facebook-domain-verification" content="ztmjvrdrcuao4ixbo2nhfaxrvroxde" />
        {/* Facebook Pixel Code */}
        <script
          id="facebook-pixel-base"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window,document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1384107910546340');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1384107910546340&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* End Facebook Pixel Code */}
      </head>
      <body
        className={`min-h-screen ${
          isRtl ? "font-arabic" : "font-sans"
        } antialiased selection:bg-tp-cyan-soft selection:text-tp-midnight`}
      >
        <FacebookPixel />
        <AuthProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
              <PublicLayout>
                {children}
              </PublicLayout>
            </ThemeProvider>
          </NextIntlClientProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

