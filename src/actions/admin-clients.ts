"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";

/**
 * Server Action : Modification d'un compte client par l'administrateur
 * Permet la mise à jour des coordonnées et l'attribution optionnelle d'un mot de passe
 */
export async function updateClientByAdmin(
  userId: string,
  data: {
    name: string;
    phone: string;
    cin?: string;
    city?: string;
    email: string;
    newPassword?: string; // Optionnel
    role?: UserRole;
  }
) {
  const session = await auth();
  const userRole = ((session?.user as any)?.role || "").toUpperCase();

  // Autorise les rôles administratifs (SUPERADMIN, SUPER_ADMIN, ADMIN, AGENCY_ADMIN)
  const isAuthorized =
    userRole === "SUPERADMIN" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    userRole === "AGENCY_ADMIN";

  if (!session?.user || !isAuthorized) {
    return {
      success: false,
      error: "Action strictement réservée à l'administration.",
    };
  }

  try {
    if (!userId) {
      return { success: false, error: "Identifiant utilisateur manquant." };
    }

    if (!data.name || data.name.trim().length < 2) {
      return { success: false, error: "Le nom complet est obligatoire (min 2 caractères)." };
    }

    if (!data.email || !data.email.includes("@")) {
      return { success: false, error: "Adresse email invalide." };
    }

    // Vérifier si un autre utilisateur utilise déjà cet email
    const emailConflict = await prisma.user.findFirst({
      where: {
        email: { equals: data.email.trim(), mode: "insensitive" },
        id: { not: userId },
      },
    });

    if (emailConflict) {
      return { success: false, error: "Cette adresse email est déjà associée à un autre compte." };
    }

    // Vérifier conflit éventuel sur le numéro de téléphone si renseigné
    if (data.phone && data.phone.trim()) {
      const phoneConflict = await prisma.user.findFirst({
        where: {
          phone: data.phone.trim(),
          id: { not: userId },
        },
      });
      if (phoneConflict) {
        return { success: false, error: "Ce numéro de téléphone est déjà associé à un autre compte." };
      }
    }

    const updateData: any = {
      name: data.name.trim(),
      fullName: data.name.trim(),
      phone: data.phone?.trim() || null,
      cinOrPassport: data.cin?.trim().toUpperCase() || null,
      city: data.city?.trim() || null,
      email: data.email.trim().toLowerCase(),
    };

    if (data.role) {
      updateData.role = data.role;
    }

    // Si un nouveau mot de passe est renseigné, le hacher avec bcrypt
    if (data.newPassword && data.newPassword.trim().length >= 6) {
      updateData.passwordHash = await bcrypt.hash(data.newPassword.trim(), 12);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        accounts: { select: { provider: true } },
      },
    });

    revalidatePath("/admin/clients");
    revalidatePath("/admin/bookings");
    revalidatePath("/mon-compte/profil");

    return {
      success: true,
      message: data.newPassword
        ? "Coordonnées et nouveau mot de passe enregistrés avec succès !"
        : "Coordonnées mises à jour avec succès.",
      client: {
        id: updated.id,
        fullName: updated.fullName || updated.name || "Client",
        email: updated.email,
        phone: updated.phone || "—",
        cinOrPassport: updated.cinOrPassport || "",
        city: updated.city || "Casablanca",
        role: updated.role,
        isBlocked: updated.isBlocked,
        blockedReason: updated.blockedReason,
        hasPassword: !!updated.passwordHash,
        isGoogleAuth: !updated.passwordHash || updated.accounts.some((a) => a.provider === "google"),
      },
    };
  } catch (error: any) {
    console.error("[updateClientByAdmin] Error:", error);
    return { success: false, error: error.message || "Erreur lors de l'enregistrement." };
  }
}
