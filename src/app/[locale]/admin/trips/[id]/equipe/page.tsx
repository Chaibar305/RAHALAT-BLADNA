import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/adminAuth";
import { TripAdminTabs } from "@/components/admin/trips/TripAdminTabs";
import { TripStaffManager } from "@/components/admin/trips/TripStaffManager";
import { TeamRole } from "@/types/enums";

type PrismaAny = {
  trip: { findFirst: (args: object) => Promise<unknown> };
  teamMember: { findMany: (args: object) => Promise<unknown> };
};

export default async function TripStaffPage({
  params: { id, locale },
}: {
  params: { id: string; locale: string };
}) {
  await requireAdminSession("VIEW_TRIP_STAFF", locale);
  const isAr = locale === "ar";

  const db = prisma as unknown as PrismaAny;

  const trip = await db.trip.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      staffAssignments: {
        include: {
          teamMember: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  }) as {
    id: string;
    slug: string;
    titleFr: string;
    titleAr: string;
    staffAssignments: Array<{
      id: string;
      tripId: string;
      teamMemberId: string;
      assignedRole: TeamRole;
      assignedMissions: string[];
      remuneration: { toNumber: () => number } | null;
      teamMember: {
        id: string;
        fullName: string;
        phone: string;
        role: TeamRole;
        notes: string | null;
      };
    }>;
  } | null;

  if (!trip) {
    notFound();
  }

  const allTeam = await db.teamMember.findMany({
    where: { isActive: true },
    orderBy: { fullName: "asc" },
  }) as Array<{
    id: string;
    fullName: string;
    phone: string;
    role: TeamRole;
    notes: string | null;
  }>;

  const otherTrips = await prisma.trip.findMany({
    where: { id: { not: trip.id } },
    select: { id: true, titleFr: true, titleAr: true },
    orderBy: { createdAt: "desc" },
  });

  const formattedAssignments = trip.staffAssignments.map((a) => ({
    id: a.id,
    tripId: a.tripId,
    staffId: a.teamMemberId,
    role: a.assignedRole,
    assignedMissions: a.assignedMissions,
    remuneration: a.remuneration ? a.remuneration.toNumber() : null,
    staff: {
      id: a.teamMember.id,
      name: a.teamMember.fullName,
      phone: a.teamMember.phone,
      role: a.teamMember.role,
      notes: a.teamMember.notes,
    },
  }));

  const availableStaff = allTeam.map((m) => ({
    id: m.id,
    name: m.fullName,
    phone: m.phone,
    role: m.role,
    notes: m.notes,
  }));

  return (
    <div className="space-y-6">
      <TripAdminTabs
        tripId={trip.id}
        tripSlug={trip.slug}
        tripTitle={isAr ? trip.titleAr : trip.titleFr}
      />

      <TripStaffManager
        tripId={trip.id}
        tripTitle={isAr ? trip.titleAr : trip.titleFr}
        initialAssignments={formattedAssignments}
        availableStaff={availableStaff}
        otherTrips={otherTrips}
      />
    </div>
  );
}
