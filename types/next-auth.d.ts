import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

export type AppUserRole = "SUPER_ADMIN" | "SUPERADMIN" | "ADMIN" | "AGENCY_ADMIN" | "AGENCY_STAFF" | "TOUR_LEADER" | "CLIENT";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    fullName?: string | null;
    role: AppUserRole | string;
    phone?: string | null;
    cinOrPassport?: string | null;
    isProfileComplete?: boolean;
  }

  interface Session {
    user: {
      id: string;
      fullName?: string | null;
      role: AppUserRole | string;
      phone?: string | null;
      cinOrPassport?: string | null;
      isProfileComplete?: boolean;
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
  }
}
