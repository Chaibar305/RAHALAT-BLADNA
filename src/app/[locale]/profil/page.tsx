import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export default async function ProfilRedirect({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect(`/${locale}/connexion?callbackUrl=/${locale}/profil`);
  }

  if (!(session.user as any).isProfileComplete) {
    redirect(`/${locale}/completer-profil`);
  } else {
    redirect(`/${locale}/mon-compte/profil`);
  }
}
