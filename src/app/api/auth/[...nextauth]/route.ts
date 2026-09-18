import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

const nextAuthHandler = NextAuth(authOptions);

async function handler(req: NextRequest, ctx: any) {
  const url = req.nextUrl?.toString() || req.url;
  const cookieHeader = req.headers.get("cookie") || "";
  const cookiesList = cookieHeader
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter(Boolean);

  console.log(`[NextAuth Debug] ${req.method} ${url}`);
  console.log(`[NextAuth Debug] Incoming Cookie names:`, cookiesList);

  const res = await nextAuthHandler(req, ctx);

  if (url.includes("signin") || url.includes("callback")) {
    const setCookieHeaders = res.headers.getSetCookie
      ? res.headers.getSetCookie()
      : [res.headers.get("set-cookie")];
    console.log(
      `[NextAuth Debug] Response Set-Cookie:`,
      setCookieHeaders.map((c: string | null) => (c ? c.split(";")[0] : null))
    );
  }

  return res;
}

export { handler as GET, handler as POST };
export const runtime = "nodejs";

