"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function completeProfileAction(formData: {
  phone: string;
  cinOrPassport: string;
  city?: string;
}) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return { success: false, error: "Vous devez être connecté pour modifier votre profil." };
    }

    const email = session.user.email;

    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        phone: formData.phone.trim(),
        cinOrPassport: formData.cinOrPassport.trim().toUpperCase(),
        isProfileComplete: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/fr");
    revalidatePath("/ar");

    return {
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        cinOrPassport: updatedUser.cinOrPassport,
        isProfileComplete: updatedUser.isProfileComplete,
      },
    };
  } catch (error: any) {
    console.error("completeProfileAction error:", error);
    return {
      success: false,
      error: error.message || "Impossible de mettre à jour votre profil.",
    };
  }
}
