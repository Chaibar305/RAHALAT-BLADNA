import React from "react";
import { requireTeamManagementAccess } from "@/lib/teamPermissions";
import { getTeamMembersAction, getAvailableUsersAction } from "@/actions/team.actions";
import { TeamManagementDashboard } from "@/components/admin/team/TeamManagementDashboard";

export default async function AdminTeamPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireTeamManagementAccess(locale);

  const [teamRes, usersRes] = await Promise.all([
    getTeamMembersAction(),
    getAvailableUsersAction(),
  ]);

  const members = teamRes.success ? (teamRes.members as any) : [];
  const stats = teamRes.success
    ? teamRes.stats
    : {
        totalMembers: 0,
        activeMembers: 0,
        tourLeadersAndGuides: 0,
        drivers: 0,
        authorizedScanners: 0,
        cashCollectors: 0,
      };
  const availableUsers = usersRes.success ? (usersRes.users as any) : [];

  return (
    <TeamManagementDashboard
      initialMembers={members}
      stats={stats}
      availableUsers={availableUsers}
    />
  );
}
