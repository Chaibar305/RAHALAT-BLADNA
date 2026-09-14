import { redirect } from "next/navigation";

export default function MesReservationsRedirect({
  params: { locale },
}: {
  params: { locale: string };
}) {
  redirect(`/${locale}/mon-compte/reservations`);
}
