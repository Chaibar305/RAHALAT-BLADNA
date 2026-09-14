"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/adminAuth";
import { TeamRole } from "@/types/enums";
import { DEFAULT_TEAM_MISSIONS } from "@/types/staff";

/**
 * Récupère tous les membres de l'équipe (Pont rétrocompatible vers TeamMember)
 */
export async function getStaffMembersAction() {
  await requireAdminSession("VIEW_STAFF");

  try {
    const staff = await prisma.teamMember.findMany({
      orderBy: { fullName: "asc" },
      include: {
        assignedTrips: {
          include: { trip: true },
        },
      },
    });

    const mapped = staff.map((s: any) => ({
      id: s.id,
      name: s.fullName,
      fullName: s.fullName,
      phone: s.phone,
      email: s.email,
      role: s.role,
      notes: s.notes,
      isActive: s.isActive,
      canScanTickets: s.canScanTickets,
      canViewManifest: s.canViewManifest,
      canCollectCash: s.canCollectCash,
      canEditTrips: s.canEditTrips,
      assignments: s.assignedTrips,
    }));

    return { success: true, staff: mapped };
  } catch (error: any) {
    console.error("Erreur getStaffMembersAction:", error);
    return { success: false, staff: [], error: error.message };
  }
}

/**
 * Crée un nouveau membre (Pont rétrocompatible)
 */
export async function createStaffMemberAction(data: {
  name: string;
  phone: string;
  role: TeamRole;
  notes?: string;
  email?: string;
}) {
  await requireAdminSession("CREATE_STAFF");

  try {
    const newStaff = await prisma.teamMember.create({
      data: {
        fullName: data.name,
        phone: data.phone,
        role: data.role,
        email: data.email || null,
        notes: data.notes || null,
        canScanTickets: true,
        canViewManifest: true,
        canCollectCash: data.role === "SUPER_ADMIN" || data.role === "ORGANIZER",
        isActive: true,
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin/team");
    revalidatePath("/admin/trips");
    return { success: true, staff: newStaff };
  } catch (error: any) {
    console.error("Erreur createStaffMemberAction:", error);
    return { success: false, error: error.message || "Erreur de création" };
  }
}

/**
 * Met à jour un membre de l'équipe
 */
export async function updateStaffMemberAction(
  id: string,
  data: {
    name: string;
    phone: string;
    role: TeamRole;
    notes?: string;
  }
) {
  await requireAdminSession("UPDATE_STAFF");

  try {
    const updated = await prisma.teamMember.update({
      where: { id },
      data: {
        fullName: data.name,
        phone: data.phone,
        role: data.role,
        notes: data.notes || null,
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin/team");
    revalidatePath("/admin/trips");
    return { success: true, staff: updated };
  } catch (error: any) {
    console.error("Erreur updateStaffMemberAction:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Supprime un membre de l'équipe
 */
export async function deleteStaffMemberAction(id: string) {
  await requireAdminSession("DELETE_STAFF");

  try {
    await prisma.teamMember.delete({ where: { id } });
    revalidatePath("/admin/settings");
    revalidatePath("/admin/team");
    revalidatePath("/admin/trips");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur deleteStaffMemberAction:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Récupère les affectations d'équipe pour un circuit donné
 */
export async function getTripStaffAssignmentsAction(tripId: string) {
  await requireAdminSession("VIEW_TRIP_STAFF");

  try {
    const assignments = await prisma.tripStaff.findMany({
      where: { tripId },
      include: {
        teamMember: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const mapped = assignments.map((a) => ({
      id: a.id,
      tripId: a.tripId,
      teamMemberId: a.teamMemberId,
      staffId: a.teamMemberId,
      assignedRole: a.assignedRole,
      role: a.assignedRole,
      assignedMissions: a.assignedMissions,
      remuneration: a.remuneration ? Number(a.remuneration) : null,
      teamMember: a.teamMember,
      staff: {
        id: a.teamMember.id,
        name: a.teamMember.fullName,
        phone: a.teamMember.phone,
        role: a.teamMember.role,
        notes: a.teamMember.notes,
      },
    }));

    return { success: true, assignments: mapped };
  } catch (error: any) {
    console.error("Erreur getTripStaffAssignmentsAction:", error);
    return { success: false, assignments: [], error: error.message };
  }
}

/**
 * Assigne ou met à jour un membre de l'équipe sur un circuit
 */
export async function assignStaffToTripAction(data: {
  tripId: string;
  staffId: string;
  role: TeamRole;
  assignedMissions?: string[];
  remuneration?: number;
}) {
  await requireAdminSession("ASSIGN_TRIP_STAFF");

  try {
    const missions =
      data.assignedMissions && data.assignedMissions.length > 0
        ? data.assignedMissions
        : DEFAULT_TEAM_MISSIONS[data.role] || [];

    const assignment = await prisma.tripStaff.upsert({
      where: {
        tripId_teamMemberId: {
          tripId: data.tripId,
          teamMemberId: data.staffId,
        },
      },
      update: {
        assignedRole: data.role,
        assignedMissions: missions,
        remuneration: data.remuneration !== undefined ? data.remuneration : null,
      },
      create: {
        tripId: data.tripId,
        teamMemberId: data.staffId,
        assignedRole: data.role,
        assignedMissions: missions,
        remuneration: data.remuneration !== undefined ? data.remuneration : null,
      },
    });

    revalidatePath(`/admin/trips/${data.tripId}/equipe`);
    revalidatePath(`/admin/trips/${data.tripId}/rentabilite`);
    revalidatePath(`/admin/manifests`);
    revalidatePath(`/admin/team`);

    return { success: true, assignment };
  } catch (error: any) {
    console.error("Erreur assignStaffToTripAction:", error);
    return { success: false, error: error.message || "Erreur d'affectation" };
  }
}

/**
 * Retire un membre d'équipe d'un circuit
 */
export async function removeStaffFromTripAction(tripStaffId: string, tripId: string) {
  await requireAdminSession("REMOVE_TRIP_STAFF");

  try {
    await prisma.tripStaff.delete({ where: { id: tripStaffId } });
    revalidatePath(`/admin/trips/${tripId}/equipe`);
    revalidatePath(`/admin/trips/${tripId}/rentabilite`);
    revalidatePath(`/admin/manifests`);
    revalidatePath(`/admin/team`);
    return { success: true };
  } catch (error: any) {
    console.error("Erreur removeStaffFromTripAction:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Duplique les affectations d'équipe d'un autre circuit
 */
export async function duplicateStaffAssignmentsAction(targetTripId: string, sourceTripId: string) {
  await requireAdminSession("DUPLICATE_TRIP_STAFF");

  try {
    const sourceAssignments = await prisma.tripStaff.findMany({
      where: { tripId: sourceTripId },
    });

    if (sourceAssignments.length === 0) {
      return { success: false, error: "Aucun membre affecté sur le circuit source." };
    }

    for (const a of sourceAssignments) {
      await prisma.tripStaff.upsert({
        where: {
          tripId_teamMemberId: {
            tripId: targetTripId,
            teamMemberId: a.teamMemberId,
          },
        },
        update: {
          assignedRole: a.assignedRole,
          assignedMissions: a.assignedMissions,
          remuneration: a.remuneration,
        },
        create: {
          tripId: targetTripId,
          teamMemberId: a.teamMemberId,
          assignedRole: a.assignedRole,
          assignedMissions: a.assignedMissions,
          remuneration: a.remuneration,
        },
      });
    }

    revalidatePath(`/admin/trips/${targetTripId}/equipe`);
    revalidatePath(`/admin/trips/${targetTripId}/rentabilite`);
    revalidatePath(`/admin/manifests`);

    return { success: true, count: sourceAssignments.length };
  } catch (error: any) {
    console.error("Erreur duplicateStaffAssignmentsAction:", error);
    return { success: false, error: error.message };
  }
}
