"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function completeProfileAction(formData: {
  phone: string;
  cinOrPassport: string;
  city?: string;
}) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return { 
        success: false, 
        error: "Vous devez être connecté pour modifier votre profil. / يجب تسجيل الدخول لتعديل الملف الشخصي." 
      };
    }

    const email = session.user.email;

    const updateData: {
      phone: string;
      cinOrPassport: string;
      city?: string;
      isProfileComplete: boolean;
    } = {
      phone: formData.phone.trim(),
      cinOrPassport: formData.cinOrPassport.trim().toUpperCase(),
      isProfileComplete: true,
    };

    if (formData.city?.trim()) {
      updateData.city = formData.city.trim();
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: updateData,
    });

    revalidatePath("/");
    revalidatePath("/fr");
    revalidatePath("/ar");
    revalidatePath("/mon-compte/profil");
    revalidatePath("/completer-profil");

    return {
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        cinOrPassport: updatedUser.cinOrPassport,
        city: updatedUser.city,
        isProfileComplete: updatedUser.isProfileComplete,
      },
    };
  } catch (error: any) {
    console.error("completeProfileAction error:", error);

    // Interception de l'erreur Prisma de contrainte unique (P2002)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      error?.code === "P2002"
    ) {
      return {
        success: false,
        error: "Ce numéro ou identifiant est déjà utilisé. / هذا الرقم أو المعرف مستخدم بالفعل.",
      };
    }

    // Message sécurisé non technique
    return {
      success: false,
      error: "Une erreur est survenue lors de la finalisation de votre profil. Veuillez réessayer.",
    };
  }
}

// Alias de compatibilité
export async function updateProfile(formData: {
  phone: string;
  cinOrPassport: string;
  city?: string;
}) {
  return completeProfileAction(formData);
}

export async function completeOnboarding(formData: {
  phone: string;
  cinOrPassport: string;
  city?: string;
}) {
  return completeProfileAction(formData);
}
