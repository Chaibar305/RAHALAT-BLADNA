export const ALLOWED_ADMIN_ROLES = [
  "SUPER_ADMIN",
  "SUPERADMIN",
  "ADMIN",
  "AGENCY_ADMIN",
  "AGENCY_STAFF",
  "ORGANIZER",
  "TOUR_LEADER",
  "OFFICIAL_GUIDE",
  "DRIVER",
];

export const authConfig = {
  pages: {
    signIn: "/fr/connexion",
    newUser: "/fr/completer-profil",
    error: "/fr/connexion",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }: { auth: any; request: { nextUrl: any } }) {
      const pathname = nextUrl.pathname;
      const isLoggedIn = !!auth?.user;
      const userRole = ((auth?.user?.role as string) || "").toUpperCase();

      const isAdminPath =
        pathname.startsWith("/admin") ||
        pathname.startsWith("/fr/admin") ||
        pathname.startsWith("/ar/admin") ||
        pathname.startsWith("/en/admin");

      const isAccountPath =
        pathname.startsWith("/mon-compte") ||
        pathname.startsWith("/fr/mon-compte") ||
        pathname.startsWith("/ar/mon-compte") ||
        pathname.startsWith("/en/mon-compte");

      if (isAdminPath) {
        if (!isLoggedIn) return false;
        return ALLOWED_ADMIN_ROLES.includes(userRole);
      }

      if (isAccountPath) {
        return isLoggedIn;
      }

      return true;
    },
  },
  providers: [],
};
