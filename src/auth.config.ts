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
  "PRO_DRIVER",
  "CONFIRMATION_AGENT",
  "MEDIA_BUYER",
  "PHOTOGRAPHER_VIDEOGRAPHER",
  "STAFF",
];

export const authConfig = {
  trustHost: true,
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
      const isStaff = !!auth?.user?.isStaff;
      const teamRole = ((auth?.user?.teamRole as string) || "").toUpperCase();

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

      const isAnalyticsPath = pathname.includes("/admin/analytics");

      if (isAnalyticsPath) {
        if (!isLoggedIn) return false;
        const perms = auth?.user?.permissions;
        const hasAnalytics =
          perms?.canViewAnalytics ||
          (Array.isArray(perms) && perms.includes("VIEW_ANALYTICS")) ||
          (Array.isArray(perms?.list) && perms.list.includes("VIEW_ANALYTICS"));
        const isSuperAdminOrMediaBuyer =
          ["SUPER_ADMIN", "SUPERADMIN", "MEDIA_BUYER"].includes(userRole) ||
          ["SUPER_ADMIN", "MEDIA_BUYER"].includes(teamRole);
        return isSuperAdminOrMediaBuyer || !!hasAnalytics;
      }

      if (isAdminPath) {
        if (!isLoggedIn) return false;
        return (
          ALLOWED_ADMIN_ROLES.includes(userRole) ||
          isStaff ||
          (teamRole !== "" && ALLOWED_ADMIN_ROLES.includes(teamRole))
        );
      }

      if (isAccountPath) {
        return isLoggedIn;
      }

      return true;
    },
  },
  providers: [],
};
