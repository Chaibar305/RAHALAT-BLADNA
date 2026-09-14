import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logSecurityAudit } from "@/lib/adminAuth";
import { redirect } from "next/navigation";
import { TeamRole } from "@/types/enums";

export interface TeamMemberPermissions {
  id?: string;
  userId?: string | null;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  role: TeamRole | "SUPER_ADMIN" | "ADMIN";
  canScanTickets: boolean;
  canViewManifest: boolean;
  canCollectCash: boolean;
  canEditTrips: boolean;
  isActive: boolean;
  isSuperAdmin: boolean;
  assignedTripIds: string[];
}

/**
 * Récupère le profil d'équipe et les permissions directes de l'utilisateur connecté
 */
export async function getCurrentTeamMemberPermissions(): Promise<TeamMemberPermissions | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const sessionUser = session.user as any;
  const userRole = (sessionUser.role || "").toUpperCase();

  // Si l'utilisateur est un SUPER_ADMIN dans le modèle User
  const isSuperAdmin = userRole === "SUPER_ADMIN" || userRole === "SUPERADMIN" || userRole === "ADMIN";

  // Chercher le TeamMember lié par userId ou par email
  const teamMember = await prisma.teamMember.findFirst({
    where: {
      OR: [
        ...(sessionUser.id ? [{ userId: sessionUser.id }] : []),
        ...(sessionUser.email ? [{ email: sessionUser.email }] : []),
      ],
    },
    include: {
      assignedTrips: {
        select: { tripId: true },
      },
    },
  });

  if (isSuperAdmin && !teamMember) {
    // Super-administrateur sans fiche d'équipe explicite -> tous droits accordés
    return {
      fullName: sessionUser.name || sessionUser.fullName || "Super Admin",
      email: sessionUser.email,
      phone: sessionUser.phone || null,
      role: "SUPER_ADMIN",
      canScanTickets: true,
      canViewManifest: true,
      canCollectCash: true,
      canEditTrips: true,
      isActive: true,
      isSuperAdmin: true,
      assignedTripIds: [], // Pas de restriction
    };
  }

  if (!teamMember) {
    return null;
  }

  const assignedTripIds = teamMember.assignedTrips.map((at: any) => at.tripId);

  return {
    id: teamMember.id,
    userId: teamMember.userId,
    fullName: teamMember.fullName,
    email: teamMember.email,
    phone: teamMember.phone,
    role: teamMember.role,
    canScanTickets: isSuperAdmin ? true : teamMember.canScanTickets,
    canViewManifest: isSuperAdmin ? true : teamMember.canViewManifest,
    canCollectCash: isSuperAdmin ? true : teamMember.canCollectCash,
    canEditTrips: isSuperAdmin ? true : teamMember.canEditTrips,
    isActive: teamMember.isActive,
    isSuperAdmin,
    assignedTripIds,
  };
}

/**
 * Garde d'accès strict pour le Scanner Mobile (/admin/scanner)
 */
export async function requireScannerAccess(locale: string = "fr") {
  const permissions = await getCurrentTeamMemberPermissions();

  if (!permissions) {
    logSecurityAudit({
      type: "UNAUTHORIZED_ACCESS_ATTEMPT",
      action: "SCANNER_ACCESS_NO_PROFILE",
      resource: "/admin/scanner",
    });
    redirect(`/${locale}/403?reason=no_team_profile`);
  }

  if (!permissions.isActive) {
    logSecurityAudit({
      type: "UNAUTHORIZED_ACCESS_ATTEMPT",
      email: permissions.email,
      action: "SCANNER_ACCESS_SUSPENDED_ACCOUNT",
      resource: "/admin/scanner",
    });
    redirect(`/${locale}/403?reason=account_suspended`);
  }

  if (!permissions.canScanTickets) {
    logSecurityAudit({
      type: "PRIVILEGE_ESCALATION_BLOCKED",
      email: permissions.email,
      role: permissions.role,
      action: "SCANNER_ACCESS_PERMISSION_DENIED",
      resource: "/admin/scanner",
    });
    redirect(`/${locale}/403?reason=cannot_scan`);
  }

  return permissions;
}

/**
 * Garde d'accès strict pour la gestion de l'équipe (/admin/team)
 */
export async function requireTeamManagementAccess(locale: string = "fr") {
  const permissions = await getCurrentTeamMemberPermissions();

  if (!permissions || !permissions.isActive) {
    redirect(`/${locale}/403`);
  }

  // Seuls les SUPER_ADMIN ou ORGANIZER ont le droit de gérer l'équipe et les permissions
  if (!permissions.isSuperAdmin && permissions.role !== "ORGANIZER") {
    logSecurityAudit({
      type: "PRIVILEGE_ESCALATION_BLOCKED",
      email: permissions.email,
      role: permissions.role,
      action: "MANAGE_TEAM_DENIED",
      resource: "/admin/team",
    });
    redirect(`/${locale}/403?reason=team_admin_required`);
  }

  return permissions;
}
