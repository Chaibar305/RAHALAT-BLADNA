"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface UpdateAgencyInput {
  name: string;
  phone: string;
  email: string;
  city?: string;
  address?: string;
  licenseNumber?: string;
  iceNumber?: string;
  rcNumber?: string;
  ribDetails?: string;
}

export async function updateAgencySettingsAction(data: UpdateAgencyInput) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return { success: false, error: "Non autorisé" };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Accès réservé aux administrateurs." };
    }

    let agency = await prisma.agency.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (agency) {
      agency = await prisma.agency.update({
        where: { id: agency.id },
        data: {
          name: data.name.trim(),
          phone: data.phone.trim(),
          email: data.email.trim(),
          city: data.city?.trim() || "Casablanca",
          address: data.address?.trim() || null,
          licenseNumber: data.licenseNumber?.trim() || null,
          iceNumber: data.iceNumber?.trim() || null,
          rcNumber: data.rcNumber?.trim() || null,
          bankAccounts: data.ribDetails?.trim() ? { rib: data.ribDetails.trim() } : undefined,
        },
      });
    } else {
      agency = await prisma.agency.create({
        data: {
          name: data.name.trim(),
          slug: data.name.trim().toLowerCase().replace(/[^a-z0-9]/g, "-"),
          phone: data.phone.trim(),
          email: data.email.trim(),
          city: data.city?.trim() || "Casablanca",
          address: data.address?.trim() || null,
          licenseNumber: data.licenseNumber?.trim() || null,
          iceNumber: data.iceNumber?.trim() || null,
          rcNumber: data.rcNumber?.trim() || null,
          bankAccounts: data.ribDetails?.trim() ? { rib: data.ribDetails.trim() } : undefined,
          isActive: true,
        },
      });

      // Associer l'admin à l'agence
      await prisma.user.update({
        where: { id: user.id },
        data: { agencyId: agency.id },
      });
    }

    revalidatePath("/admin/settings");
    revalidatePath("/ar/admin/settings");
    revalidatePath("/fr/admin/settings");

    return { success: true, agency };
  } catch (error: any) {
    console.error("Erreur updateAgencySettingsAction:", error);
    return { success: false, error: error.message || "Erreur lors de l'enregistrement" };
  }
}
