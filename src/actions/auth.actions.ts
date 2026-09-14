"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

/**
 * Inscription par formulaire email/mot de passe.
 * Crée un compte User avec passwordHash (bcrypt), fullName, phone, cinOrPassport.
 * Compatible avec le CredentialsProvider de NextAuth (authorize recherche par email/phone).
 */
export async function registerUserAction(data: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  cinOrPassport?: string;
}) {
  try {
    // 1. Validation côté serveur
    if (!data.fullName?.trim()) {
      return { success: false, error: "Le nom complet est obligatoire." };
    }
    if (!data.email?.trim()) {
      return { success: false, error: "L'adresse email est obligatoire." };
    }
    if (!data.phone?.trim()) {
      return { success: false, error: "Le numéro de téléphone est obligatoire." };
    }
    if (!data.password || data.password.length < 8) {
      return { success: false, error: "Le mot de passe doit contenir au moins 8 caractères." };
    }
    if (data.password !== data.confirmPassword) {
      return { success: false, error: "Les mots de passe ne correspondent pas." };
    }

    // Normalisation email
    const email = data.email.trim().toLowerCase();
    const phone = data.phone.trim();

    // 2. Vérification unicité email
    const existingByEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingByEmail) {
      return {
        success: false,
        error: "Cette adresse email est déjà associée à un compte. Veuillez vous connecter.",
      };
    }

    // 3. Vérification unicité téléphone
    const existingByPhone = await prisma.user.findUnique({
      where: { phone },
    });
    if (existingByPhone) {
      return {
        success: false,
        error: "Ce numéro de téléphone est déjà utilisé. Veuillez vous connecter.",
      };
    }

    // 4. Hachage du mot de passe (bcrypt, coût 12)
    const passwordHash = await bcrypt.hash(data.password, 12);

    // 5. Création du compte voyageur
    const newUser = await prisma.user.create({
      data: {
        email,
        name: data.fullName.trim(),
        fullName: data.fullName.trim(),
        phone,
        cinOrPassport: data.cinOrPassport?.trim().toUpperCase() || null,
        passwordHash,
        role: "CLIENT",
        isVerified: false,
        isProfileComplete: !!(phone && data.cinOrPassport?.trim()),
      },
    });

    revalidatePath("/fr");
    revalidatePath("/ar");

    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.fullName,
      },
    };
  } catch (error: any) {
    console.error("[registerUserAction] Erreur:", error);
    // Prisma unique constraint
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0];
      if (field === "email") {
        return { success: false, error: "Cette adresse email est déjà utilisée." };
      }
      if (field === "phone") {
        return { success: false, error: "Ce numéro de téléphone est déjà utilisé." };
      }
    }
    return {
      success: false,
      error: error.message || "Une erreur est survenue lors de la création du compte.",
    };
  }
}

/**
 * Demande de réinitialisation de mot de passe.
 * Accepte une adresse email ou un numéro de téléphone.
 * Génère un jeton temporaire (1 heure) et expédie l'email via Nodemailer.
 */
export async function requestPasswordResetAction(
  identifier: string,
  locale: string = "fr"
): Promise<{ success: boolean; message?: string; error?: string; resetUrlDev?: string }> {
  try {
    const rawId = identifier?.trim();
    if (!rawId) {
      return {
        success: false,
        error: locale === "ar" ? "يرجى إدخال البريد الإلكتروني أو رقم الهاتف." : "Veuillez saisir votre email ou numéro de téléphone.",
      };
    }

    const cleanId = rawId.toLowerCase();
    const isAr = locale === "ar";

    // Recherche de l'utilisateur par email ou par téléphone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanId },
          { phone: rawId },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        fullName: true,
        isBlocked: true,
        passwordHash: true,
      },
    });

    // Pour des raisons de sécurité (anti-énumération), on renvoie toujours un message de succès
    // même si aucun compte n'est trouvé.
    if (!user) {
      return {
        success: true,
        message: isAr
          ? "إذا كان هذا الحساب مسجلاً لدينا، فستصلك رسالة تحتوي على رابط إعادة التعيين."
          : "Si un compte est associé à ces informations, un email de réinitialisation a été envoyé.",
      };
    }

    // Vérification du statut de blocage
    if (user.isBlocked) {
      return {
        success: false,
        error: isAr
          ? "هذا الحساب معلق حالياً. يرجى التواصل مع إدارة المنصة."
          : "Ce compte est actuellement suspendu. Veuillez contacter le support.",
      };
    }

    // Nettoyage des anciens jetons pour cet utilisateur
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Génération d'un token sécurisé hexadécimal
    const crypto = await import("crypto");
    const token = crypto.randomBytes(32).toString("hex");

    // Expiration à 1 heure
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Sauvegarde en base de données
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        isUsed: false,
        ...( { email: user.email } as any ),
      },
    });

    // Construction de l'URL absolue de réinitialisation
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.AUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.URL ? process.env.URL : "") ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
      "http://localhost:3000";

    const cleanBaseUrl = baseUrl.replace(/\/$/, "");
    const resetUrl = `${cleanBaseUrl}/${locale}/reset-password?token=${token}`;

    // Import dynamique du service email
    const { sendPasswordResetEmail } = await import("@/lib/mail");
    await sendPasswordResetEmail({
      to: user.email,
      name: user.fullName || user.name,
      resetUrl,
      locale,
    });

    return {
      success: true,
      message: isAr
        ? `تم إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني المرتبط (${user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")}).`
        : `Un lien de réinitialisation a été envoyé à l'adresse associée (${user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")}).`,
      resetUrlDev: process.env.NODE_ENV === "development" ? resetUrl : undefined,
    };
  } catch (error: any) {
    console.error("[requestPasswordResetAction] Erreur:", error);
    return {
      success: false,
      error: error.message || "Une erreur est survenue lors de la demande de réinitialisation.",
    };
  }
}

/**
 * Vérification de la validité d'un token de réinitialisation.
 */
export async function verifyResetTokenAction(token: string): Promise<{
  valid: boolean;
  email?: string;
  name?: string;
  error?: string;
}> {
  try {
    if (!token?.trim()) {
      return { valid: false, error: "Jeton manquant ou invalide." };
    }

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token: token.trim() },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            name: true,
            isBlocked: true,
          },
        },
      },
    });

    if (!resetRecord) {
      return {
        valid: false,
        error: "Ce lien de réinitialisation est introuvable ou a déjà été utilisé.",
      };
    }

    if (resetRecord.isUsed) {
      return {
        valid: false,
        error: "Ce lien de réinitialisation a déjà été utilisé. Veuillez effectuer une nouvelle demande.",
      };
    }

    if (new Date() > resetRecord.expiresAt) {
      return {
        valid: false,
        error: "Ce lien de réinitialisation a expiré (validité 60 minutes). Veuillez demander un nouveau lien.",
      };
    }

    if (resetRecord.user?.isBlocked) {
      return {
        valid: false,
        error: "Ce compte utilisateur est actuellement suspendu.",
      };
    }

    return {
      valid: true,
      email: resetRecord.user?.email,
      name: resetRecord.user?.fullName || resetRecord.user?.name || undefined,
    };
  } catch (error: any) {
    console.error("[verifyResetTokenAction] Erreur:", error);
    return { valid: false, error: "Erreur technique lors de la vérification du jeton." };
  }
}

/**
 * Réinitialise le mot de passe de l'utilisateur après validation du jeton.
 */
export async function resetPasswordAction(data: {
  token: string;
  password: string;
  confirmPassword: string;
  locale?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const isAr = data.locale === "ar";

    if (!data.token?.trim()) {
      return {
        success: false,
        error: isAr ? "رمز التحقق غير صالح أو مفقود." : "Jeton de sécurité manquant.",
      };
    }

    if (!data.password || data.password.length < 8) {
      return {
        success: false,
        error: isAr
          ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل."
          : "Le nouveau mot de passe doit comporter au moins 8 caractères.",
      };
    }

    if (data.password !== data.confirmPassword) {
      return {
        success: false,
        error: isAr
          ? "كلمتا المرور غير متطابقتين."
          : "Les deux mots de passe ne correspondent pas.",
      };
    }

    // Recherche et validation du jeton
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token: data.token.trim() },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.isUsed || new Date() > resetRecord.expiresAt) {
      return {
        success: false,
        error: isAr
          ? "انتهت صلاحية هذا الرابط أو تم استخدامه بالفعل. يرجى طلب رابط جديد."
          : "Ce lien est invalide ou a expiré. Veuillez refaire une demande de réinitialisation.",
      };
    }

    if (resetRecord.user?.isBlocked) {
      return {
        success: false,
        error: isAr ? "هذا الحساب معلق." : "Ce compte utilisateur est suspendu.",
      };
    }

    // Hachage du nouveau mot de passe (bcrypt)
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Transaction atomique : mise à jour du mot de passe + marquage/suppression du jeton
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: {
          passwordHash,
          // Si le profil n'était pas vérifié, on le marque vérifié après reset
          isVerified: true,
        },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: resetRecord.userId },
      }),
    ]);

    revalidatePath("/fr");
    revalidatePath("/ar");

    return {
      success: true,
      message: isAr
        ? "تم تحديث كلمة المرور الخاصة بك بنجاح! يمكنك الآن تسجيل الدخول."
        : "Votre mot de passe a été modifié avec succès ! Vous pouvez maintenant vous connecter.",
    };
  } catch (error: any) {
    console.error("[resetPasswordAction] Erreur:", error);
    return {
      success: false,
      error: error.message || "Une erreur est survenue lors de la réinitialisation du mot de passe.",
    };
  }
}
