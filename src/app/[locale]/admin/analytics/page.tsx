import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAnalyticsMetrics } from "@/actions/analytics.actions";
import { AnalyticsDashboardClient } from "@/components/admin/analytics/AnalyticsDashboardClient";

export const metadata = {
  title: "Analytics & Performances | Admin Rahalat Bladna",
  description: "Tableau de bord analytics, acquisition publicitaire et performances de l'équipe",
};

export default async function AdminAnalyticsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/connexion`);
  }

  const user = session.user as any;
  const userRole = (user.role || "").toUpperCase();
  const teamRole = (user.teamRole || "").toUpperCase();
  const perms = user.permissions;

  const hasAnalyticsPerm =
    perms?.canViewAnalytics ||
    (Array.isArray(perms) && perms.includes("VIEW_ANALYTICS")) ||
    (Array.isArray(perms?.list) && perms.list.includes("VIEW_ANALYTICS"));

  const isSuperAdminOrMediaBuyer =
    ["SUPER_ADMIN", "SUPERADMIN", "ADMIN", "AGENCY_ADMIN", "MEDIA_BUYER"].includes(userRole) ||
    ["SUPER_ADMIN", "MEDIA_BUYER", "ORGANIZER"].includes(teamRole);

  if (!isSuperAdminOrMediaBuyer && !hasAnalyticsPerm) {
    redirect(`/${locale}/admin`);
  }

  const initialData = await getAnalyticsMetrics("30d");

  return (
    <AnalyticsDashboardClient
      initialData={initialData}
      initialPeriod="30d"
    />
  );
}
