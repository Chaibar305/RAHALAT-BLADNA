import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPromoCodes, getTripsForPromoSelect } from "@/actions/promo.actions";
import { PromoCodesManager } from "@/components/admin/promos/PromoCodesManager";

export const metadata = {
  title: "Codes Promo & Réductions | Admin Rahalat Bladna",
  description: "Gestion des codes promotionnels, remises et coupons sur les circuits",
};

export default async function AdminPromosPage({
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

  const hasTripsPerm =
    perms?.canEditTrips ||
    (Array.isArray(perms) && perms.includes("EDIT_TRIPS")) ||
    (Array.isArray(perms?.list) && perms.list.includes("EDIT_TRIPS"));

  const isAuthorized =
    ["SUPER_ADMIN", "SUPERADMIN", "ADMIN", "AGENCY_ADMIN", "MEDIA_BUYER"].includes(userRole) ||
    ["SUPER_ADMIN", "MEDIA_BUYER", "ORGANIZER"].includes(teamRole) ||
    hasTripsPerm;

  if (!isAuthorized) {
    redirect(`/${locale}/admin`);
  }

  const [promosRes, trips] = await Promise.all([
    getPromoCodes(),
    getTripsForPromoSelect(),
  ]);

  return (
    <PromoCodesManager
      initialPromos={promosRes.promos || []}
      trips={trips}
    />
  );
}
