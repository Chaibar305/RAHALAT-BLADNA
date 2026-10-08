import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Normalisation des hôtes référents
function cleanReferrerHost(refUrl?: string | null): string {
  if (!refUrl || refUrl === "direct" || refUrl === "") return "Direct / Organique";
  try {
    const url = new URL(refUrl);
    let host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host.includes("facebook.com") || host.includes("fb.me")) return "facebook.com";
    if (host.includes("instagram.com")) return "instagram.com";
    if (host.includes("google.com") || host.includes("google.co.ma")) return "google.com";
    if (host.includes("tiktok.com")) return "tiktok.com";
    if (host.includes("snapchat.com")) return "snapchat.com";
    if (host.includes("t.co") || host.includes("twitter.com") || host.includes("x.com")) return "x.com / twitter";
    if (host.includes("youtube.com")) return "youtube.com";
    if (host.includes("bing.com")) return "bing.com";
    if (host.includes("linkedin.com")) return "linkedin.com";
    return host;
  } catch {
    return refUrl.slice(0, 50);
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const text = await req.text();
      try {
        body = JSON.parse(text);
      } catch {
        return new NextResponse(null, { status: 400 });
      }
    }

    if (!body || !body.type) {
      return new NextResponse(null, { status: 400 });
    }

    const path = String(body.path || "/");

    // Ignorer les routes d'administration, internes ou assets pour ne pas fausser les métriques publiques
    if (
      path.startsWith("/admin") ||
      path.includes("/admin/") ||
      path.startsWith("/api") ||
      path.startsWith("/_next") ||
      path.startsWith("/favicon")
    ) {
      return new NextResponse(null, { status: 204 });
    }

    const sessionId = String(body.sessionId || "anonymous_session").slice(0, 100);

    // Détection du pays via les en-têtes Edge (Vercel ou Cloudflare)
    const country =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-country-code") ||
      body.country ||
      "MA";

    if (body.type === "pageview") {
      const referrer = body.referrer ? String(body.referrer).slice(0, 500) : null;
      const referrerHost = cleanReferrerHost(referrer);
      const device = ["mobile", "desktop", "tablet"].includes(body.device)
        ? body.device
        : "mobile";
      const os = body.os ? String(body.os).slice(0, 50) : "Android";
      const browser = body.browser ? String(body.browser).slice(0, 50) : "Chrome";

      await (prisma as any).pageView.create({
        data: {
          sessionId,
          path,
          referrer,
          referrerHost,
          country: country.toUpperCase().slice(0, 5),
          device,
          os,
          browser,
        },
      });

      return new NextResponse(null, { status: 204 });
    }

    if (body.type === "event") {
      const eventName = String(body.eventName || "custom_click").slice(0, 80);
      const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : null;

      await (prisma as any).analyticsEvent.create({
        data: {
          sessionId,
          eventName,
          path,
          metadata,
        },
      });

      return new NextResponse(null, { status: 204 });
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    // Le tracker ne doit jamais casser la navigation client
    console.warn("Notice collect analytics:", error);
    return new NextResponse(null, { status: 204 });
  }
}
