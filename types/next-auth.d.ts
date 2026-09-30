import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

export type AppUserRole = "SUPER_ADMIN" | "SUPERADMIN" | "ADMIN" | "AGENCY_ADMIN" | "AGENCY_STAFF" | "TOUR_LEADER" | "STAFF" | "CLIENT";

export interface TeamMemberPermissions {
  canScanTickets: boolean;
  canViewManifest: boolean;
  canCollectCash: boolean;
  canEditTrips: boolean;
  canManageBookings?: boolean;
  canViewAnalytics?: boolean;
  canManageBlog?: boolean;
  canManageFinances?: boolean;
  list?: string[];
  includes?: (perm: string) => boolean;
}

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    fullName?: string | null;
    role: AppUserRole | string;
    phone?: string | null;
    cinOrPassport?: string | null;
    isProfileComplete?: boolean;
    isStaff?: boolean;
    teamRole?: string | null;
    teamMemberId?: string | null;
    permissions?: TeamMemberPermissions | null;
  }

  interface Session {
    user: {
      id: string;
      fullName?: string | null;
      role: AppUserRole | string;
      phone?: string | null;
      cinOrPassport?: string | null;
      isProfileComplete?: boolean;
      isStaff?: boolean;
      teamRole?: string | null;
      teamMemberId?: string | null;
      permissions?: TeamMemberPermissions | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: AppUserRole | string;
    phone?: string | null;
    cinOrPassport?: string | null;
    isProfileComplete?: boolean;
    isStaff?: boolean;
    teamRole?: string | null;
    teamMemberId?: string | null;
    permissions?: TeamMemberPermissions | null;
  }
}
