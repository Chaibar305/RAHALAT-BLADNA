"use client";

import React, { createContext, useContext, useMemo } from "react";
import { SessionProvider, useSession, signOut as nextAuthSignOut } from "next-auth/react";

export interface AuthContextType {
  user: {
    id: string;
    name?: string | null;
    fullName?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
    phone?: string | null;
    cinOrPassport?: string | null;
    isProfileComplete?: boolean;
    isStaff?: boolean;
    teamRole?: string | null;
    permissions?: {
      canScanTickets: boolean;
      canViewManifest: boolean;
      canCollectCash: boolean;
      canEditTrips: boolean;
    } | null;
  } | null;
  role: string;
  isStaff: boolean;
  teamRole: string | null;
  permissions: {
    canScanTickets: boolean;
    canViewManifest: boolean;
    canCollectCash: boolean;
    canEditTrips: boolean;
  } | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isClient: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: (options?: { callbackUrl?: string }) => Promise<void>;
  updateUser: (data: any) => Promise<any>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: "CLIENT",
  isStaff: false,
  teamRole: null,
  permissions: null,
  isAdmin: false,
  isSuperAdmin: false,
  isClient: true,
  isAuthenticated: false,
  isLoading: true,
  signOut: async () => {},
  updateUser: async () => {},
});

function AuthContextConsumer({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();

  const value = useMemo<AuthContextType>(() => {
    const isLoading = status === "loading";
    const isAuthenticated = status === "authenticated" && !!session?.user;

    const rawRole = ((session?.user as any)?.role || "CLIENT").toUpperCase();
    const isStaff = !!(session?.user as any)?.isStaff;
    const teamRole = ((session?.user as any)?.teamRole as string) || null;
    const permissions = (session?.user as any)?.permissions || null;

    const isSuperAdmin = rawRole === "SUPER_ADMIN" || rawRole === "SUPERADMIN" || teamRole === "SUPER_ADMIN";
    const isAdmin = isSuperAdmin || ["ADMIN", "AGENCY_ADMIN", "ORGANIZER"].includes(rawRole) || isStaff;
    const isClient = !isAdmin && !isStaff;

    const user = session?.user
      ? {
          id: (session.user as any).id || "",
          name: session.user.name || null,
          fullName: (session.user as any).fullName || session.user.name || null,
          email: session.user.email || null,
          image: session.user.image || null,
          role: rawRole,
          phone: (session.user as any).phone || null,
          cinOrPassport: (session.user as any).cinOrPassport || null,
          isProfileComplete: (session.user as any).isProfileComplete ?? false,
          isStaff,
          teamRole,
          permissions,
        }
      : null;

    return {
      user,
      role: rawRole,
      isStaff,
      teamRole,
      permissions,
      isAdmin,
      isSuperAdmin,
      isClient,
      isAuthenticated,
      isLoading,
      signOut: async (options) => {
        await nextAuthSignOut({ callbackUrl: options?.callbackUrl || "/" });
      },
      updateUser: async (data: any) => {
        return await update(data);
      },
    };
  }, [session, status, update]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={true} refetchInterval={0}>
      <AuthContextConsumer>{children}</AuthContextConsumer>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
