import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProfileAction } from "@/actions/profile";
import { UserProfileSettings } from "@/components/account/UserProfileSettings";

interface PageProps {
  params: {
    locale: string;
  };
}

export const metadata = {
  title: "Mon Profil & Sécurité | Rahalat Bladna",
  description: "Mettez à jour vos coordonnées personnelles et sécurisez l'accès à votre compte Rahalat Bladna.",
};

export default async function UserProfilePage({ params: { locale } }: PageProps) {
  // 1. Protection de la route côté serveur
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect(`/${locale}/connexion?callbackUrl=/${locale}/mon-compte/profil`);
  }

  // 2. Récupération des données du profil
  const res = await getProfileAction();

  if (!res.success || !res.user) {
    redirect(`/${locale}/connexion`);
  }

  return (
    <div className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen py-10 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <UserProfileSettings initialUser={res.user} />
      </div>
    </div>
  );
}
