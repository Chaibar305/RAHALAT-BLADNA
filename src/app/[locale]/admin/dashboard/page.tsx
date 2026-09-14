import { redirect } from "next/navigation";

export default function AdminDashboardRedirect({
  params: { locale },
}: {
  params: { locale: string };
}) {
  redirect(`/${locale}/admin`);
}
