"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export interface UpdatePersonalInfoInput {
  fullName: string;
  phone: string;
  cin?: string;
  city?: string;
}

export interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Récupère le profil complet de l'utilisateur connecté avec l'information de mot de passe
 */
export async function getProfileAction() {
  const session = await getServerSession(authOptions);
  const sessionUserId = (session?.user as any)?.id;
  const sessionEmail = session?.user?.email;

  if (!sessionUserId && !sessionEmail) {
    return { success: false, error: "Non authentifié" };
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(sessionUserId ? [{ id: sessionUserId }] : []),
          ...(sessionEmail ? [{ email: sessionEmail }] : []),
        ],
      },
      select: {
        id: true,
        name: true,
        fullName: true,
        email: true,
        phone: true,
        cinOrPassport: true,
        city: true,
        role: true,
        image: true,
        avatarUrl: true,
        passwordHash: true,
        createdAt: true,
      },
    });

    if (!user) {
      return { success: false, error: "Utilisateur introuvable" };
    }

    return {
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName || user.name || "",
        email: user.email,
        phone: user.phone || "",
        cin: user.cinOrPassport || "",
        city: user.city || "Casablanca",
        role: user.role,
        image: user.image || user.avatarUrl,
        hasPassword: Boolean(user.passwordHash),
        createdAt: user.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("getProfileAction error:", error);
    return { success: false, error: "Erreur lors de la récupération du profil." };
  }
}

/**
 * 1. Mise à jour des informations personnelles du client
 */
export async function updatePersonalInfoAction(data: UpdatePersonalInfoInput) {
  const session = await getServerSession(authOptions);
  const sessionUserId = (session?.user as any)?.id;
  const sessionEmail = session?.user?.email;

  if (!sessionUserId && !sessionEmail) {
    return { success: false, error: "Non authentifié" };
  }

  if (!data.fullName || data.fullName.trim().length < 3) {
    return { success: false, error: "Le nom complet doit comporter au moins 3 caractères." };
  }

  if (!data.phone || data.phone.trim().length < 8) {
    return { success: false, error: "Veuillez renseigner un numéro de téléphone valide." };
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(sessionUserId ? [{ id: sessionUserId }] : []),
          ...(sessionEmail ? [{ email: sessionEmail }] : []),
        ],
      },
    });

    if (!user) {
      return { success: false, error: "Compte utilisateur introuvable" };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.fullName.trim(),
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        cinOrPassport: data.cin?.trim().toUpperCase() || null,
        city: data.city?.trim() || "Casablanca",
        isProfileComplete: Boolean(data.phone && data.cin),
      },
    });

    revalidatePath("/mon-compte/profil");
    revalidatePath("/fr/mon-compte/profil");
    revalidatePath("/ar/mon-compte/profil");
    revalidatePath("/mon-compte/reservations");
    revalidatePath("/fr/mon-compte/reservations");
    revalidatePath("/ar/mon-compte/reservations");

    return { success: true, message: "Coordonnées mises à jour avec succès !" };
  } catch (error: any) {
    console.error("updatePersonalInfoAction error:", error);
    if (error?.code === "P2002") {
      return {
        success: false,
        error: "Ce numéro ou identifiant est déjà utilisé. / هذا الرقم أو المعرف مستخدم بالفعل.",
      };
    }
    return { success: false, error: "Erreur lors de l'enregistrement des coordonnées." };
  }
}

/**
 * 2. Modification sécurisée du mot de passe
 */
export async function updatePasswordAction(formData: UpdatePasswordInput) {
  const session = await getServerSession(authOptions);
  const sessionUserId = (session?.user as any)?.id;
  const sessionEmail = session?.user?.email;

  if (!sessionUserId && !sessionEmail) {
    return { success: false, error: "Non authentifié" };
  }

  if (formData.newPassword !== formData.confirmPassword) {
    return { success: false, error: "Les deux mots de passe ne correspondent pas." };
  }

  if (formData.newPassword.length < 8) {
    return { success: false, error: "Le nouveau mot de passe doit contenir au moins 8 caractères." };
  }

  // Vérification de complexité : au moins 1 chiffre
  if (!/\d/.test(formData.newPassword)) {
    return { success: false, error: "Le mot de passe doit contenir au moins un chiffre." };
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(sessionUserId ? [{ id: sessionUserId }] : []),
          ...(sessionEmail ? [{ email: sessionEmail }] : []),
        ],
      },
    });

    if (!user) {
      return { success: false, error: "Compte utilisateur introuvable." };
    }

    if (!user.passwordHash) {
      return {
        success: false,
        error: "Ce compte a été créé via Google. La modification de mot de passe n'est pas applicable.",
      };
    }

    const isMatch = await bcrypt.compare(formData.currentPassword, user.passwordHash);
    if (!isMatch) {
      return { success: false, error: "Le mot de passe actuel est incorrect." };
    }

    const hashedNewPassword = await bcrypt.hash(formData.newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedNewPassword },
    });

    revalidatePath("/mon-compte/profil");
    revalidatePath("/fr/mon-compte/profil");
    revalidatePath("/ar/mon-compte/profil");

    return { success: true, message: "Votre mot de passe a été modifié avec succès !" };
  } catch (error: any) {
    console.error("updatePasswordAction error:", error);
    return { success: false, error: "Erreur technique lors du changement de mot de passe." };
  }
}
