import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { ALLOWED_ADMIN_ROLES } from "@/auth.config";

export interface AdminSessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
  phone?: string | null;
  cinOrPassport?: string | null;
  isProfileComplete?: boolean;
}

/**
 * Journalise les tentatives d'accès non autorisées (Audit de sécurité)
 */
export function logSecurityAudit(event: {
  type: "UNAUTHORIZED_ACCESS_ATTEMPT" | "PRIVILEGE_ESCALATION_BLOCKED" | "ADMIN_LOGIN_SUCCESS";
  userId?: string | null;
  email?: string | null;
  role?: string | null;
  action?: string;
  resource?: string;
  ip?: string;
}) {
  const timestamp = new Date().toISOString();
  console.warn(
    `🚨 [SECURITY AUDIT] [${timestamp}] [${event.type}] User: ${event.email || "Anonymous"} (Role: ${event.role || "None"}) Action: ${event.action || "Read"} Resource: ${event.resource || "/admin"}`
  );
}

/**
 * Helper serveur vérifiant que l'utilisateur connecté possède les privilèges Administrateur.
 * Utilisable dans les Server Actions, Route Handlers et Server Components.
 */
export async function requireAdminSession(resourceName: string = "ADMIN_AREA", locale: string = "fr") {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    logSecurityAudit({
      type: "UNAUTHORIZED_ACCESS_ATTEMPT",
      action: "UNAUTHENTICATED_ACCESS",
      resource: resourceName,
    });
    redirect(`/${locale}/connexion?callbackUrl=/${locale}/admin`);
  }

  const user = session.user as AdminSessionUser;
  const userRole = (user.role || "").toUpperCase();

  const isAllowed = ALLOWED_ADMIN_ROLES.includes(userRole);

  if (!isAllowed) {
    logSecurityAudit({
      type: "PRIVILEGE_ESCALATION_BLOCKED",
      userId: user.id,
      email: user.email,
      role: userRole,
      action: "FORBIDDEN_ROLE_ACCESS",
      resource: resourceName,
    });
    redirect(`/${locale}/403`);
  }

  return {
    session,
    user,
  };
}

/**
 * Helper serveur vérifiant qu'un utilisateur est authentifié (pour l'espace voyageur /mon-compte)
 */
export async function requireAuthSession(callbackUrl: string = "/mon-compte/reservations", locale: string = "fr") {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect(`/${locale}/connexion?callbackUrl=/${locale}${callbackUrl.startsWith('/') ? callbackUrl : '/' + callbackUrl}`);
  }

  return {
    session,
    user: session.user,
  };
}
