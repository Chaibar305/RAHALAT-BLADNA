import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { ALLOWED_ADMIN_ROLES } from "@/auth.config";

export default async function DashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect(`/${locale}/connexion?callbackUrl=/${locale}/dashboard`);
  }

  const role = (((session.user as any).role as string) || "CLIENT").toUpperCase();
  const isAdmin = ALLOWED_ADMIN_ROLES.includes(role);

  if (isAdmin) {
    redirect(`/${locale}/admin`);
  } else {
    redirect(`/${locale}/mon-compte/reservations`);
  }
}
