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

/**
 * Server Action : Vider uniquement les réservations et paiements d'un client
 * Conserve le compte utilisateur actif et réinitialise son historique commercial
 */
export async function clearClientBookingsAction(clientId: string) {
  const session = await auth();
  const userRole = ((session?.user as any)?.role || "").toUpperCase();

  const isAuthorized =
    userRole === "SUPERADMIN" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    userRole === "AGENCY_ADMIN";

  if (!session?.user || !isAuthorized) {
    return { success: false, error: "Action non autorisée." };
  }

  try {
    if (!clientId) {
      return { success: false, error: "Identifiant client manquant." };
    }

    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true, fullName: true, name: true, email: true },
    });

    if (!client) {
      return { success: false, error: "Compte client introuvable." };
    }

    // 1. Récupérer les réservations du client pour ajuster les quotas de places
    const bookings = await prisma.booking.findMany({
      where: { userId: clientId },
      include: {
        departureDate: true,
        travelers: { select: { id: true } },
      },
    });

    if (bookings.length === 0) {
      return {
        success: true,
        message: "Ce client n'a aucun dossier de réservation ni paiement à vider.",
        clearedCount: 0,
      };
    }

    // 2. Restaurer les places occupées pour les départs actifs
    for (const booking of bookings) {
      if (booking.status !== "CANCELLED" && booking.departureDateId && booking.departureDate) {
        const paxCount = booking.travelers.length || 1;
        await prisma.departureDate.update({
          where: { id: booking.departureDateId },
          data: {
            occupiedSeats: {
              decrement: Math.min(booking.departureDate.occupiedSeats, paxCount),
            },
          },
        });
      }
    }

    // 3. Supprimer les paiements, factures, devis, passagers/voyageurs et réservations
    const bookingIds = bookings.map((b) => b.id);

    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { bookingId: { in: bookingIds } } }),
      prisma.invoice.deleteMany({ where: { bookingId: { in: bookingIds } } }),
      prisma.quote.deleteMany({ where: { bookingId: { in: bookingIds } } }),
      prisma.traveler.deleteMany({ where: { bookingId: { in: bookingIds } } }),
      prisma.booking.deleteMany({ where: { userId: clientId } }),
    ]);

    revalidatePath("/admin/clients");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/reservations");
    revalidatePath("/admin");
    revalidatePath("/mon-compte/reservations");

    return {
      success: true,
      message: `${bookings.length} dossier(s) de réservation et historiques de paiements supprimés avec succès pour ${client.fullName || client.name || client.email}. Le compte client a été conservé.`,
      clearedCount: bookings.length,
    };
  } catch (error: any) {
    console.error("[clearClientBookingsAction] Error:", error);
    return { success: false, error: error.message || "Erreur lors de la suppression des réservations." };
  }
}

/**
 * Server Action : Supprimer définitivement un compte client et tout son historique
 */
export async function deleteClientAccountAction(clientId: string) {
  const session = await auth();
  const userRole = ((session?.user as any)?.role || "").toUpperCase();

  const isAuthorized =
    userRole === "SUPERADMIN" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    userRole === "AGENCY_ADMIN";

  if (!session?.user || !isAuthorized) {
    return { success: false, error: "Action strictement réservée à l'administration." };
  }

  const currentAdmin = session.user as any;

  try {
    if (!clientId) {
      return { success: false, error: "Identifiant client manquant." };
    }

    // Protection : interdiction de supprimer son propre compte
    if (clientId === currentAdmin.id) {
      return { success: false, error: "Action interdite : vous ne pouvez pas supprimer votre propre compte." };
    }

    const client = await prisma.user.findUnique({
      where: { id: clientId },
      include: {
        bookings: {
          include: {
            departureDate: true,
            travelers: { select: { id: true } },
          },
        },
      },
    });

    if (!client) {
      return { success: false, error: "Compte client introuvable." };
    }

    // Protection Super Admin
    if (client.role === "SUPER_ADMIN" && currentAdmin.role !== "SUPER_ADMIN") {
      return { success: false, error: "Action interdite sur un compte Super-Administrateur." };
    }

    // 1. Restaurer les places occupées pour les départs correspondants
    for (const booking of client.bookings) {
      if (booking.status !== "CANCELLED" && booking.departureDateId && booking.departureDate) {
        const paxCount = booking.travelers.length || 1;
        await prisma.departureDate.update({
          where: { id: booking.departureDateId },
          data: {
            occupiedSeats: {
              decrement: Math.min(booking.departureDate.occupiedSeats, paxCount),
            },
          },
        });
      }
    }

    const bookingIds = client.bookings.map((b) => b.id);

    // 2. Nettoyage complet et suppression du compte utilisateur
    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { bookingId: { in: bookingIds } } }),
      prisma.invoice.deleteMany({ where: { bookingId: { in: bookingIds } } }),
      prisma.quote.deleteMany({ where: { bookingId: { in: bookingIds } } }),
      prisma.traveler.deleteMany({ where: { bookingId: { in: bookingIds } } }),
      prisma.booking.deleteMany({ where: { userId: clientId } }),
      prisma.session.deleteMany({ where: { userId: clientId } }),
      prisma.account.deleteMany({ where: { userId: clientId } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: clientId } }),
      prisma.notification.deleteMany({ where: { userId: clientId } }),
      prisma.user.delete({ where: { id: clientId } }),
    ]);

    revalidatePath("/admin/clients");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/reservations");
    revalidatePath("/admin");

    return {
      success: true,
      message: `Le compte client ${client.fullName || client.name || client.email} et son historique ont été définitivement supprimés.`,
    };
  } catch (error: any) {
    console.error("[deleteClientAccountAction] Error:", error);
    return { success: false, error: error.message || "Erreur lors de la suppression du compte." };
  }
}

// Alias de compatibilité
export const deleteClientAdminAction = deleteClientAccountAction;

