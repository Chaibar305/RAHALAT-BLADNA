"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeamRole, UserRole } from "@/types/enums";
import { requireTeamManagementAccess } from "@/lib/teamPermissions";
import { DEFAULT_TEAM_MISSIONS } from "@/types/staff";

/**
 * Fonction utilitaire de sécurité stricte : vérifie que l'utilisateur connecté est bien SUPER_ADMIN
 */
async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Non authentifié");
  }

  const sessionUser = session.user as any;
  const sessionRole = (sessionUser.role || "").toUpperCase();

  // 1. Vérification dans la session et le modèle User
  let isSuperAdmin = sessionRole === "SUPER_ADMIN" || sessionRole === "SUPERADMIN" || sessionRole === "ADMIN";

  if (!isSuperAdmin) {
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(sessionUser.id ? [{ id: sessionUser.id }] : []),
          { email: session.user.email },
        ],
      },
      select: { role: true },
    });
    if (dbUser && (dbUser.role === UserRole.SUPER_ADMIN || (dbUser.role as string) === "ADMIN")) {
      isSuperAdmin = true;
    }
  }

  // 2. Vérification dans la table TeamMember
  const currentUserTeam = await prisma.teamMember.findFirst({
    where: {
      OR: [
        ...(sessionUser.id ? [{ userId: sessionUser.id }] : []),
        { email: session.user.email },
      ],
      isActive: true,
    },
    select: { role: true, id: true },
  });

  if (currentUserTeam?.role === TeamRole.SUPER_ADMIN || (currentUserTeam?.role as string) === "SUPER_ADMIN") {
    isSuperAdmin = true;
  }

  if (!isSuperAdmin) {
    throw new Error("Action non autorisée : Privilèges Super Admin requis.");
  }

  return session.user;
}

/**
 * Mappe un rôle d'équipe et son statut d'activité vers le rôle de compte utilisateur User
 */
function getEffectiveUserRole(teamRole: TeamRole, isActive: boolean): UserRole {
  if (!isActive) return UserRole.CLIENT;
  if (teamRole === TeamRole.SUPER_ADMIN) return UserRole.SUPER_ADMIN;
  if (teamRole === TeamRole.ORGANIZER) return UserRole.AGENCY_ADMIN;
  if (teamRole === TeamRole.TOUR_LEADER) return UserRole.TOUR_LEADER;
  return UserRole.STAFF;
}

export interface TeamMemberInput {
  fullName: string;
  phone: string;
  email?: string | null;
  role: TeamRole;
  cinNumber?: string | null;
  cin?: string | null;
  guideCardNumber?: string | null;
  notes?: string | null;
  canScanTickets?: boolean;
  canViewManifest?: boolean;
  canCollectCash?: boolean;
  canEditTrips?: boolean;
  isActive?: boolean;
  userId?: string | null;
  permissions?: string[];
}

/**
 * 1. Récupère la liste complète des membres de l'équipe et les compteurs KPI
 */
export async function getTeamMembersAction() {
  await requireTeamManagementAccess();

  try {
    const members = await prisma.teamMember.findMany({
      orderBy: [
        { isActive: "desc" },
        { fullName: "asc" },
      ],
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            name: true,
            avatarUrl: true,
            image: true,
          },
        },
        assignedTrips: {
          include: {
            trip: {
              select: {
                id: true,
                titleFr: true,
                titleAr: true,
                slug: true,
                durationDays: true,
              },
            },
          },
        },
      },
    });

    // Statistiques & KPIs
    const totalMembers = members.length;
    const activeMembers = members.filter((m: any) => m.isActive).length;
    const tourLeadersAndGuides = members.filter(
      (m: any) => m.role === "TOUR_LEADER" || m.role === "OFFICIAL_GUIDE"
    ).length;
    const drivers = members.filter((m: any) => m.role === "DRIVER" || m.role === "PRO_DRIVER").length;
    const authorizedScanners = members.filter(
      (m: any) => m.isActive && m.canScanTickets
    ).length;
    const cashCollectors = members.filter(
      (m: any) => m.isActive && m.canCollectCash
    ).length;

    return {
      success: true,
      members,
      stats: {
        totalMembers,
        activeMembers,
        tourLeadersAndGuides,
        drivers,
        authorizedScanners,
        cashCollectors,
      },
    };
  } catch (error: any) {
    console.error("Erreur getTeamMembersAction:", error);
    return {
      success: false,
      members: [],
      stats: {
        totalMembers: 0,
        activeMembers: 0,
        tourLeadersAndGuides: 0,
        drivers: 0,
        authorizedScanners: 0,
        cashCollectors: 0,
      },
      error: error.message || "Impossible de charger l'équipe",
    };
  }
}

/**
 * 2. Crée un nouveau membre d'équipe avec permissions granulaires
 * Seul un SUPER_ADMIN peut créer un compte avec le rôle SUPER_ADMIN.
 */
export async function createTeamMemberAction(data: TeamMemberInput) {
  if (data.role === TeamRole.SUPER_ADMIN || (data.role as string) === "SUPER_ADMIN") {
    await requireSuperAdmin();
  } else {
    await requireTeamManagementAccess();
  }

  try {
    if (!data.fullName || !data.phone) {
      return { success: false, error: "Le nom complet et le numéro de téléphone sont obligatoires." };
    }

    const cleanedEmail = data.email?.trim().toLowerCase() || null;
    if (cleanedEmail) {
      const existing = await prisma.teamMember.findUnique({
        where: { email: cleanedEmail },
      });
      if (existing) {
        return { success: false, error: `Un membre avec l'adresse email "${cleanedEmail}" existe déjà.` };
      }
    }

    let resolvedUserId: string | null = (data.userId && data.userId.trim() !== "" && data.userId !== "none") ? data.userId.trim() : null;
    if (resolvedUserId) {
      const userExists = await prisma.user.findUnique({ where: { id: resolvedUserId } });
      if (!userExists) {
        resolvedUserId = null;
      }
    }
    if (!resolvedUserId && cleanedEmail) {
      const matchedUser = await prisma.user.findUnique({
        where: { email: cleanedEmail },
      });
      if (matchedUser) {
        const alreadyLinked = await prisma.teamMember.findUnique({
          where: { userId: matchedUser.id },
        });
        if (!alreadyLinked) {
          resolvedUserId = matchedUser.id;
        }
      }
    }
    if (resolvedUserId) {
      const alreadyLinked = await prisma.teamMember.findUnique({
        where: { userId: resolvedUserId },
      });
      if (alreadyLinked) {
        return { success: false, error: `Ce compte utilisateur est déjà lié à ${alreadyLinked.fullName}.` };
      }
    }

    const isFieldScannerRole = ["SUPER_ADMIN", "ORGANIZER", "TOUR_LEADER", "OFFICIAL_GUIDE", "DRIVER", "PRO_DRIVER"].includes(data.role as string);
    const canScan = data.canScanTickets ?? isFieldScannerRole;
    const canManifest = data.canViewManifest ?? !["DRIVER", "PRO_DRIVER", "MEDIA_BUYER"].includes(data.role as string);
    const canCash = data.canCollectCash ?? (data.role === "SUPER_ADMIN" || data.role === "ORGANIZER" || data.role === "TOUR_LEADER");
    const canEdit = data.canEditTrips ?? (data.role === "SUPER_ADMIN" || data.role === "ORGANIZER");

    const permissionsList = Array.isArray(data.permissions) ? data.permissions : [];

    const newMember = await prisma.teamMember.create({
      data: {
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        email: cleanedEmail,
        role: data.role as any,
        cinNumber: (data.cinNumber || data.cin)?.trim() || null,
        guideCardNumber: data.guideCardNumber?.trim() || null,
        notes: data.notes?.trim() || null,
        canScanTickets: canScan,
        canViewManifest: canManifest,
        canCollectCash: canCash,
        canEditTrips: canEdit,
        permissions: permissionsList,
        isActive: data.isActive ?? true,
        userId: resolvedUserId,
      },
    });

    if (newMember.userId) {
      try {
        await prisma.user.update({
          where: { id: newMember.userId },
          data: {
            role: getEffectiveUserRole(newMember.role, newMember.isActive) as any,
          },
        });
      } catch (userSyncErr) {
        console.warn("Notice: user role auto-sync on createTeamMember:", userSyncErr);
      }
    }

    revalidatePath("/admin/team");
    revalidatePath("/admin/settings");
    revalidatePath("/admin/scanner");

    return { success: true, member: newMember };
  } catch (error: any) {
    console.error("Erreur createTeamMemberAction:", error);
    return { success: false, error: error.message || "Erreur lors de la création du membre." };
  }
}

/**
 * 3. Met à jour un membre de l'équipe et ses autorisations
 * SÉCURITÉ RBAC : Seul un Super Admin peut modifier un Super Admin ou modifier les rôles de l'équipe.
 */
export async function updateTeamMember(targetMemberId: string, data: any) {
  try {
    await requireSuperAdmin();

    const target = await prisma.teamMember.findUnique({
      where: { id: targetMemberId },
      select: {
        id: true,
        role: true,
        email: true,
        userId: true,
        fullName: true,
        phone: true,
        isActive: true,
      },
    });

    if (!target) return { success: false, error: "Membre introuvable" };

    const isTargetSuperAdmin =
      target.role === TeamRole.SUPER_ADMIN || (target.role as string) === "SUPER_ADMIN";

    // Empêcher de rétrograder le Super Admin si c'est le dernier
    if (
      isTargetSuperAdmin &&
      data.role &&
      data.role !== TeamRole.SUPER_ADMIN &&
      (data.role as string) !== "SUPER_ADMIN"
    ) {
      const superAdminCount = await prisma.teamMember.count({
        where: { role: TeamRole.SUPER_ADMIN, isActive: true },
      });
      if (superAdminCount <= 1) {
        return {
          success: false,
          error: "Impossible de rétrograder le compte Super Admin principal.",
        };
      }
    }

    // Le compte Super Admin reste TOUJOURS actif (isActive = true)
    const newIsActive = isTargetSuperAdmin
      ? true
      : data.isActive !== undefined
      ? Boolean(data.isActive)
      : target.isActive;

    const cleanedEmail =
      data.email !== undefined ? (data.email?.trim().toLowerCase() || null) : target.email;

    // Vérifier unicité email si changé
    if (cleanedEmail && cleanedEmail !== target.email) {
      const emailConflict = await prisma.teamMember.findUnique({
        where: { email: cleanedEmail },
      });
      if (emailConflict && emailConflict.id !== targetMemberId) {
        return { success: false, error: `L'adresse email "${cleanedEmail}" est déjà utilisée.` };
      }
    }

    // Résolution et validation sécurisée du userId
    let resolvedUserId: string | null = target.userId;
    if (data.userId !== undefined) {
      const candidateId =
        data.userId && data.userId !== "none" && String(data.userId).trim() !== ""
          ? String(data.userId).trim()
          : null;
      if (candidateId) {
        const userExists = await prisma.user.findUnique({ where: { id: candidateId } });
        if (!userExists) {
          return { success: false, error: "Le compte utilisateur sélectionné n'existe pas." };
        }
        const conflict = await prisma.teamMember.findUnique({ where: { userId: candidateId } });
        if (conflict && conflict.id !== targetMemberId) {
          return { success: false, error: `Ce compte utilisateur est déjà lié à ${conflict.fullName}.` };
        }
        resolvedUserId = candidateId;
      } else {
        resolvedUserId = null;
      }
    }

    const cinVal =
      (data.cinNumber || data.cin) !== undefined
        ? ((data.cinNumber || data.cin)?.trim() || null)
        : undefined;
    const permissionsList = Array.isArray(data.permissions) ? data.permissions : undefined;

    const updated = await prisma.teamMember.update({
      where: { id: targetMemberId },
      data: {
        fullName: data.fullName ? data.fullName.trim() : target.fullName,
        phone: data.phone ? data.phone.trim() : target.phone,
        email: cleanedEmail,
        cinNumber: cinVal,
        guideCardNumber:
          data.guideCardNumber !== undefined ? (data.guideCardNumber?.trim() || null) : undefined,
        notes: data.notes !== undefined ? (data.notes?.trim() || null) : undefined,
        role: (data.role ?? target.role) as any,
        canScanTickets: isTargetSuperAdmin
          ? true
          : data.canScanTickets !== undefined
          ? data.canScanTickets
          : undefined,
        canViewManifest: isTargetSuperAdmin
          ? true
          : data.canViewManifest !== undefined
          ? data.canViewManifest
          : undefined,
        canCollectCash: isTargetSuperAdmin
          ? true
          : data.canCollectCash !== undefined
          ? data.canCollectCash
          : undefined,
        canEditTrips: isTargetSuperAdmin
          ? true
          : data.canEditTrips !== undefined
          ? data.canEditTrips
          : undefined,
        permissions: permissionsList,
        isActive: newIsActive,
        userId: resolvedUserId,
      },
    });

    // Si l'ancien compte utilisateur a été délié
    if (target.userId && target.userId !== resolvedUserId) {
      try {
        const otherActive = await prisma.teamMember.findFirst({
          where: { userId: target.userId, id: { not: targetMemberId }, isActive: true },
        });
        if (!otherActive) {
          await prisma.user.update({
            where: { id: target.userId },
            data: { role: UserRole.CLIENT as any },
          });
        }
      } catch (err) {
        console.warn("Notice: unlinked user role reset:", err);
      }
    }

    // Synchronisation du rôle utilisateur pour le compte lié
    if (resolvedUserId) {
      try {
        await prisma.user.update({
          where: { id: resolvedUserId },
          data: {
            role: getEffectiveUserRole(updated.role, updated.isActive) as any,
          },
        });
      } catch (err) {
        console.warn("Notice: user role auto-sync on updateTeamMember:", err);
      }
    }

    revalidatePath("/admin/team");
    revalidatePath("/admin/settings");
    revalidatePath("/admin/scanner");

    return { success: true, member: updated };
  } catch (error: any) {
    console.error("Erreur updateTeamMember:", error);
    return { success: false, error: error.message || "Erreur lors de la mise à jour." };
  }
}

export const updateTeamMemberAction = updateTeamMember;

/**
 * 4. Activation / Suspension immédiate d'un membre d'équipe (SWITCH STATUT)
 * SÉCURITÉ RBAC :
 * - Action réservée aux Super Admins.
 * - Le compte Super Admin ne peut JAMAIS être suspendu.
 */
export async function toggleTeamMemberStatus(targetMemberId: string) {
  try {
    await requireSuperAdmin();

    const target = await prisma.teamMember.findUnique({
      where: { id: targetMemberId },
      select: { role: true, isActive: true, userId: true },
    });

    if (!target) {
      return { success: false, error: "Membre introuvable" };
    }

    if (target.role === TeamRole.SUPER_ADMIN || (target.role as string) === "SUPER_ADMIN") {
      return {
        success: false,
        error: "Sécurité : Le compte Super Admin ne peut jamais être suspendu.",
      };
    }

    const updated = await prisma.teamMember.update({
      where: { id: targetMemberId },
      data: { isActive: !target.isActive },
    });

    // Synchronisation automatique du rôle utilisateur
    if (target.userId) {
      try {
        await prisma.user.update({
          where: { id: target.userId },
          data: {
            role: getEffectiveUserRole(target.role, updated.isActive) as any,
          },
        });
      } catch (err) {
        console.warn("Notice: user role auto-sync on toggleStatus:", err);
      }
    }

    revalidatePath("/admin/team");
    revalidatePath("/admin/settings");
    revalidatePath("/admin/scanner");

    return {
      success: true,
      isActive: updated.isActive,
      message: updated.isActive
        ? "Accès réactivé avec succès"
        : "Membre suspendu immédiatement (accès scanner bloqué)",
    };
  } catch (error: any) {
    console.error("Erreur toggleTeamMemberStatus:", error);
    return { success: false, error: error.message || "Erreur lors du changement de statut" };
  }
}

export const toggleTeamMemberStatusAction = toggleTeamMemberStatus;

/**
 * 5. Supprime un membre d'équipe
 * SÉCURITÉ RBAC :
 * - Action réservée aux Super Admins.
 * - Le compte Super Admin ne peut JAMAIS être supprimé.
 */
export async function deleteTeamMember(targetMemberId: string) {
  try {
    await requireSuperAdmin();

    const target = await prisma.teamMember.findUnique({
      where: { id: targetMemberId },
      select: { role: true, email: true, userId: true },
    });

    if (!target) return { success: false, error: "Membre introuvable" };

    if (target.role === TeamRole.SUPER_ADMIN || (target.role as string) === "SUPER_ADMIN") {
      return {
        success: false,
        error: "Sécurité : Le compte Super Admin ne peut pas être supprimé.",
      };
    }

    // Réinitialisation du rôle de l'utilisateur en CLIENT s'il n'a pas d'autre affectation
    if (target.userId) {
      try {
        const otherActive = await prisma.teamMember.findFirst({
          where: { userId: target.userId, id: { not: targetMemberId }, isActive: true },
        });
        if (!otherActive) {
          await prisma.user.update({
            where: { id: target.userId },
            data: { role: UserRole.CLIENT as any },
          });
        }
      } catch (err) {
        console.warn("Notice: user role reset on deleteTeamMember:", err);
      }
    }

    await prisma.teamMember.delete({ where: { id: targetMemberId } });

    revalidatePath("/admin/team");
    revalidatePath("/admin/settings");
    revalidatePath("/admin/scanner");

    return { success: true, message: "Membre supprimé avec succès." };
  } catch (error: any) {
    console.error("Erreur deleteTeamMember:", error);
    return { success: false, error: error.message || "Erreur lors de la suppression." };
  }
}

export const deleteTeamMemberAction = deleteTeamMember;

/**
 * 6. Affecte un membre d'équipe à un circuit (TripStaff)
 */
export async function assignTeamMemberToTripAction(data: {
  tripId: string;
  teamMemberId: string;
  assignedRole: TeamRole;
  assignedMissions?: string[];
  remuneration?: number;
}) {
  await requireTeamManagementAccess();

  try {
    const missions =
      data.assignedMissions && data.assignedMissions.length > 0
        ? data.assignedMissions
        : DEFAULT_TEAM_MISSIONS[data.assignedRole] || [];

    const assignment = await prisma.tripStaff.upsert({
      where: {
        tripId_teamMemberId: {
          tripId: data.tripId,
          teamMemberId: data.teamMemberId,
        },
      },
      update: {
        assignedRole: data.assignedRole as any,
        assignedMissions: missions,
        remuneration: data.remuneration !== undefined ? data.remuneration : null,
      },
      create: {
        tripId: data.tripId,
        teamMemberId: data.teamMemberId,
        assignedRole: data.assignedRole as any,
        assignedMissions: missions,
        remuneration: data.remuneration !== undefined ? data.remuneration : null,
      },
    });

    revalidatePath(`/admin/trips/${data.tripId}/equipe`);
    revalidatePath(`/admin/trips/${data.tripId}/rentabilite`);
    revalidatePath(`/admin/team`);
    revalidatePath(`/admin/scanner`);

    return { success: true, assignment };
  } catch (error: any) {
    console.error("Erreur assignTeamMemberToTripAction:", error);
    return { success: false, error: error.message || "Erreur d'affectation au circuit." };
  }
}

/**
 * 7. Supprime une affectation circuit (TripStaff)
 */
export async function removeTeamMemberFromTripAction(tripStaffId: string, tripId: string) {
  await requireTeamManagementAccess();

  try {
    await prisma.tripStaff.delete({ where: { id: tripStaffId } });

    revalidatePath(`/admin/trips/${tripId}/equipe`);
    revalidatePath(`/admin/trips/${tripId}/rentabilite`);
    revalidatePath(`/admin/team`);

    return { success: true };
  } catch (error: any) {
    console.error("Erreur removeTeamMemberFromTripAction:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 8. Liste les utilisateurs disponibles pour liaison de compte
 */
export async function getAvailableUsersAction() {
  await requireTeamManagementAccess();

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        name: true,
        role: true,
        teamMember: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { email: "asc" },
    });

    return { success: true, users };
  } catch (error: any) {
    return { success: false, users: [], error: error.message };
  }
}
