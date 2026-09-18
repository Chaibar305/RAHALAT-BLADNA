import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { locales, defaultLocale } from "./lib/i18n";
import { ALLOWED_ADMIN_ROLES } from "./auth.config";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
});

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Détecter la langue actuelle (fr, ar, en)
  const pathnameSegments = pathname.split("/").filter(Boolean);
  const currentLocale = locales.includes(pathnameSegments[0] as any)
    ? pathnameSegments[0]
    : defaultLocale;

  // 1. Détection des routes protégées
  const isAdminRoute =
    pathname.startsWith("/admin") ||
    locales.some((loc) => pathname.startsWith(`/${loc}/admin`));

  const isAccountRoute =
    pathname.startsWith("/mon-compte") ||
    locales.some((loc) => pathname.startsWith(`/${loc}/mon-compte`));

  if (isAdminRoute || isAccountRoute) {
    const secret =
      process.env.AUTH_SECRET ||
      process.env.NEXTAUTH_SECRET;

    // Récupérer le token de session JWT
    const token = await getToken({
      req,
      secret,
    });

    // A. Utilisateur non connecté -> Redirection vers la page de connexion
    if (!token) {
      const loginUrl = new URL(`/${currentLocale}/connexion`, req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // B. Route d'administration -> Vérification stricte du rôle
    if (isAdminRoute) {
      const userRole = ((token.role as string) || "").toUpperCase();
      const isAuthorized = ALLOWED_ADMIN_ROLES.includes(userRole);

      if (!isAuthorized) {
        const forbiddenUrl = new URL(`/${currentLocale}/403`, req.url);
        return NextResponse.redirect(forbiddenUrl);
      }
    }
  }

  // Traitement standard internationalisation next-intl
  const response = intlMiddleware(req);

  // -------------------------------------------------------------
  // EN-TÊTES DE SÉCURITÉ CYBERSÉCURITÉ HTTP (OWASP / Best Practices)
  // -------------------------------------------------------------
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=(), payment=()"
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|favicon.png|logo-icon-transparent.png|images|manifest.json|sw.js).*)",
  ],
};
