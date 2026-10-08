import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseUserAgent(ua: string) {
  let device = "desktop";
  if (/mobile|iphone|ipod|android.*mobile|blackberry/i.test(ua)) {
    device = "mobile";
  } else if (/ipad|tablet|android(?!.*mobile)/i.test(ua)) {
    device = "tablet";
  }

  let os = "Autre";
  if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/windows nt/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "Mac OS";
  else if (/linux/i.test(ua)) os = "Linux";

  return { device, os };
}

function extractHost(referrer?: string | null): string | null {
  if (!referrer || referrer.trim() === "") return "Direct / Aucun";
  try {
    const url = new URL(referrer);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return referrer;
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      const text = await req.text();
      body = JSON.parse(text);
    }

    const { type, sessionId, path, referrer, eventName, metadata } = body;

    // Ignorer les requêtes d'admin ou robots évidents
    if (path && (path.includes("/admin") || path.includes("/api/"))) {
      return NextResponse.json({ success: true, ignored: true });
    }

    // Détection du pays via en-tête Vercel (ou Cloudflare fallback)
    const country =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      "MA";
    const userAgent = req.headers.get("user-agent") || "";
    const { device, os } = parseUserAgent(userAgent);

    const db = prisma as any;

    if (type === "pageview") {
      await db.pageView.create({
        data: {
          sessionId: sessionId || "anonymous",
          path: path || "/",
          referrer: referrer || null,
          referrerHost: extractHost(referrer),
          country,
          device,
          os,
        },
      });
    } else if (type === "event" && eventName) {
      await db.analyticsEvent.create({
        data: {
          sessionId: sessionId || "anonymous",
          eventName,
          path: path || "/",
          metadata: metadata || {},
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur tracking analytics:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
