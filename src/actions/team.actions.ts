"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TeamRole } from "@/types/enums";
import { requireTeamManagementAccess } from "@/lib/teamPermissions";
import { DEFAULT_TEAM_MISSIONS } from "@/types/staff";

export interface TeamMemberInput {
  fullName: string;
  phone: string;
  email?: string | null;
  role: TeamRole;
  cinNumber?: string | null;
  guideCardNumber?: string | null;
  notes?: string | null;
  canScanTickets?: boolean;
  canViewManifest?: boolean;
  canCollectCash?: boolean;
  canEditTrips?: boolean;
  isActive?: boolean;
  userId?: string | null;
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
    const drivers = members.filter((m: any) => m.role === "DRIVER").length;
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
 */
export async function createTeamMemberAction(data: TeamMemberInput) {
  await requireTeamManagementAccess();

  try {
    if (!data.fullName || !data.phone) {
      return { success: false, error: "Le nom complet et le numéro de téléphone sont obligatoires." };
    }

    // Si un email est fourni, vérifier s'il est déjà lié
    const cleanedEmail = data.email?.trim().toLowerCase() || null;
    if (cleanedEmail) {
      const existing = await prisma.teamMember.findUnique({
        where: { email: cleanedEmail },
      });
      if (existing) {
        return { success: false, error: `Un membre avec l'adresse email "${cleanedEmail}" existe déjà.` };
      }
    }

    // Recherche automatique d'un compte User correspondant par email si userId non fourni
    let resolvedUserId = data.userId || null;
    if (!resolvedUserId && cleanedEmail) {
      const matchedUser = await prisma.user.findUnique({
        where: { email: cleanedEmail },
      });
      if (matchedUser) {
        resolvedUserId = matchedUser.id;
      }
    }

    // Définir des permissions par défaut adaptées au rôle si non spécifiées
    const canScan = data.canScanTickets ?? (data.role !== "DRIVER" || true);
    const canManifest = data.canViewManifest ?? (data.role !== "DRIVER");
    const canCash = data.canCollectCash ?? (data.role === "SUPER_ADMIN" || data.role === "ORGANIZER");
    const canEdit = data.canEditTrips ?? (data.role === "SUPER_ADMIN" || data.role === "ORGANIZER");

    const newMember = await prisma.teamMember.create({
      data: {
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        email: cleanedEmail,
        role: data.role,
        cinNumber: data.cinNumber?.trim() || null,
        guideCardNumber: data.guideCardNumber?.trim() || null,
        notes: data.notes?.trim() || null,
        canScanTickets: canScan,
        canViewManifest: canManifest,
        canCollectCash: canCash,
        canEditTrips: canEdit,
        isActive: data.isActive ?? true,
        userId: resolvedUserId,
      },
    });

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
 */
export async function updateTeamMemberAction(id: string, data: Partial<TeamMemberInput>) {
  await requireTeamManagementAccess();

  try {
    const existing = await prisma.teamMember.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Membre d'équipe introuvable." };
    }

    const cleanedEmail = data.email !== undefined ? (data.email?.trim().toLowerCase() || null) : existing.email;

    // Vérifier unicité email si changé
    if (cleanedEmail && cleanedEmail !== existing.email) {
      const emailConflict = await prisma.teamMember.findUnique({
        where: { email: cleanedEmail },
      });
      if (emailConflict && emailConflict.id !== id) {
        return { success: false, error: `L'adresse email "${cleanedEmail}" est déjà utilisée.` };
      }
    }

    const updated = await prisma.teamMember.update({
      where: { id },
      data: {
        fullName: data.fullName ? data.fullName.trim() : existing.fullName,
        phone: data.phone ? data.phone.trim() : existing.phone,
        email: cleanedEmail,
        role: data.role ?? existing.role,
        cinNumber: data.cinNumber !== undefined ? (data.cinNumber?.trim() || null) : existing.cinNumber,
        guideCardNumber: data.guideCardNumber !== undefined ? (data.guideCardNumber?.trim() || null) : existing.guideCardNumber,
        notes: data.notes !== undefined ? (data.notes?.trim() || null) : existing.notes,
        canScanTickets: data.canScanTickets !== undefined ? data.canScanTickets : existing.canScanTickets,
        canViewManifest: data.canViewManifest !== undefined ? data.canViewManifest : existing.canViewManifest,
        canCollectCash: data.canCollectCash !== undefined ? data.canCollectCash : existing.canCollectCash,
        canEditTrips: data.canEditTrips !== undefined ? data.canEditTrips : existing.canEditTrips,
        isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
        userId: data.userId !== undefined ? data.userId : existing.userId,
      },
    });

    revalidatePath("/admin/team");
    revalidatePath("/admin/settings");
    revalidatePath("/admin/scanner");

    return { success: true, member: updated };
  } catch (error: any) {
    console.error("Erreur updateTeamMemberAction:", error);
    return { success: false, error: error.message || "Erreur lors de la mise à jour." };
  }
}

/**
 * 4. Activation / Suspension immédiate d'un membre d'équipe
 */
export async function toggleTeamMemberStatusAction(id: string) {
  await requireTeamManagementAccess();

  try {
    const member = await prisma.teamMember.findUnique({ where: { id } });
    if (!member) {
      return { success: false, error: "Membre introuvable." };
    }

    const updated = await prisma.teamMember.update({
      where: { id },
      data: { isActive: !member.isActive },
    });

    revalidatePath("/admin/team");
    revalidatePath("/admin/settings");
    revalidatePath("/admin/scanner");

    return {
      success: true,
      isActive: updated.isActive,
      message: updated.isActive ? "Accès réactivé avec succès" : "Membre suspendu immédiatement (accès scanner bloqué)",
    };
  } catch (error: any) {
    console.error("Erreur toggleTeamMemberStatusAction:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 5. Supprime un membre d'équipe
 */
export async function deleteTeamMemberAction(id: string) {
  await requireTeamManagementAccess();

  try {
    await prisma.teamMember.delete({ where: { id } });

    revalidatePath("/admin/team");
    revalidatePath("/admin/settings");
    revalidatePath("/admin/scanner");

    return { success: true, message: "Membre supprimé avec succès." };
  } catch (error: any) {
    console.error("Erreur deleteTeamMemberAction:", error);
    return { success: false, error: error.message || "Erreur lors de la suppression." };
  }
}

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
        assignedRole: data.assignedRole,
        assignedMissions: missions,
        remuneration: data.remuneration !== undefined ? data.remuneration : null,
      },
      create: {
        tripId: data.tripId,
        teamMemberId: data.teamMemberId,
        assignedRole: data.assignedRole,
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
