"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import {
  AgencySettingsData,
  DEFAULT_AGENCY_SETTINGS,
  UpdateAgencySettingsInput,
} from "@/lib/agency";

export type { AgencySettingsData, UpdateAgencySettingsInput };

/**
 * Récupère les coordonnées de l'agence directement depuis PostgreSQL Supabase
 */
export async function getAgencySettingsAction(): Promise<AgencySettingsData> {
  try {
    const db = prisma as any;
    const settings = await db.agencySettings.findUnique({
      where: { id: "default_agency" },
    });

    if (settings) {
      return {
        id: settings.id,
        companyName: settings.companyName || DEFAULT_AGENCY_SETTINGS.companyName,
        whatsappPhone: settings.whatsappPhone || DEFAULT_AGENCY_SETTINGS.whatsappPhone,
        email: settings.email || DEFAULT_AGENCY_SETTINGS.email,
        city: settings.city || DEFAULT_AGENCY_SETTINGS.city,
        address: settings.address ?? DEFAULT_AGENCY_SETTINGS.address,
        licenseNumber: settings.licenseNumber ?? null,
        ice: settings.ice ?? DEFAULT_AGENCY_SETTINGS.ice,
        rc: settings.rc ?? null,
        taxId: settings.taxId ?? null,
        bankRib: settings.bankRib ?? DEFAULT_AGENCY_SETTINGS.bankRib,
        bankName: settings.bankName ?? DEFAULT_AGENCY_SETTINGS.bankName,
        updatedAt: settings.updatedAt,
      };
    }

    // Fallback : initialisation depuis l'ancien modèle Agency si existant
    const legacyAgency = await prisma.agency.findFirst({
      orderBy: { createdAt: "asc" },
    });

    const initialData = {
      id: "default_agency",
      companyName: legacyAgency?.name || DEFAULT_AGENCY_SETTINGS.companyName,
      whatsappPhone: legacyAgency?.phone || DEFAULT_AGENCY_SETTINGS.whatsappPhone,
      email: legacyAgency?.email || DEFAULT_AGENCY_SETTINGS.email,
      city: legacyAgency?.city || DEFAULT_AGENCY_SETTINGS.city,
      address: legacyAgency?.address || DEFAULT_AGENCY_SETTINGS.address,
      licenseNumber: legacyAgency?.licenseNumber || null,
      ice: legacyAgency?.iceNumber || DEFAULT_AGENCY_SETTINGS.ice,
      rc: legacyAgency?.rcNumber || null,
      taxId: null,
      bankRib: (legacyAgency?.bankAccounts as any)?.rib?.replace(/\s+/g, "") || DEFAULT_AGENCY_SETTINGS.bankRib,
      bankName: DEFAULT_AGENCY_SETTINGS.bankName,
    };

    const created = await db.agencySettings.create({
      data: initialData,
    });

    return created;
  } catch (error) {
    console.error("Erreur lecture getAgencySettingsAction:", error);
    return DEFAULT_AGENCY_SETTINGS;
  }
}

/**
 * Cache public revalidé instantanément lors des modifications de l'admin
 */
export const getPublicAgencySettingsAction = unstable_cache(
  async (): Promise<AgencySettingsData> => {
    return await getAgencySettingsAction();
  },
  ["agency-settings-cache"],
  {
    tags: ["agency-settings"],
    revalidate: 3600,
  }
);

/**
 * Met à jour les coordonnées officielles de l'agence avec revalidation temps réel
 */
export async function updateAgencySettingsAction(data: UpdateAgencySettingsInput) {
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

    // Normalisation des champs pour compatibilité totale
    const companyName = (data.companyName || data.name || "").trim();
    const whatsappPhone = (data.whatsappPhone || data.phone || "").trim();
    const email = (data.email || "").trim();
    const city = (data.city || "").trim() || "Rabat";
    const address = (data.address || "").trim() || null;
    const licenseNumber = (data.licenseNumber || "").trim() || null;
    const ice = (data.ice || data.iceNumber || "").trim() || null;
    const rc = (data.rc || data.rcNumber || "").trim() || null;
    const taxId = (data.taxId || "").trim() || null;
    const bankRib = (data.bankRib || data.ribDetails || "").trim().replace(/\s+/g, "") || null;
    const bankName = (data.bankName || "").trim() || "Attijariwafa / CIH Bank";

    if (!companyName || !whatsappPhone || !email) {
      return {
        success: false,
        error: "La raison sociale, le téléphone WhatsApp et l'email sont obligatoires.",
      };
    }

    const db = prisma as any;

    // 1. Mise à jour ou création du modèle singleton AgencySettings
    const settings = await db.agencySettings.upsert({
      where: { id: "default_agency" },
      update: {
        companyName,
        whatsappPhone,
        email,
        city,
        address,
        licenseNumber,
        ice,
        rc,
        taxId,
        bankRib,
        bankName,
      },
      create: {
        id: "default_agency",
        companyName,
        whatsappPhone,
        email,
        city,
        address,
        licenseNumber,
        ice,
        rc,
        taxId,
        bankRib,
        bankName,
      },
    });

    // 2. Synchronisation de sécurité avec le modèle historique Agency (pour les relations Trip / User)
    let legacyAgency = await prisma.agency.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (legacyAgency) {
      await prisma.agency.update({
        where: { id: legacyAgency.id },
        data: {
          name: companyName,
          phone: whatsappPhone,
          email,
          city,
          address,
          licenseNumber,
          iceNumber: ice,
          rcNumber: rc,
          bankAccounts: bankRib ? { rib: bankRib } : undefined,
        },
      });
    } else {
      legacyAgency = await prisma.agency.create({
        data: {
          name: companyName,
          slug: companyName.toLowerCase().replace(/[^a-z0-9]/g, "-") || "rahalat-bladna",
          phone: whatsappPhone,
          email,
          city,
          address,
          licenseNumber,
          iceNumber: ice,
          rcNumber: rc,
          bankAccounts: bankRib ? { rib: bankRib } : undefined,
          isActive: true,
        },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { agencyId: legacyAgency.id },
      });
    }

    // 3. Revalidation immédiate du cache de l'ensemble de la plateforme
    revalidateTag("agency-settings");
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");
    revalidatePath("/admin/finances");
    revalidatePath("/ar/admin/settings");
    revalidatePath("/fr/admin/settings");
    revalidatePath("/ar/admin/finances");
    revalidatePath("/fr/admin/finances");

    return {
      success: true,
      settings,
      agency: legacyAgency,
    };
  } catch (error: any) {
    console.error("Erreur updateAgencySettingsAction:", error);
    return {
      success: false,
      error: error.message || "Erreur lors de l'enregistrement des coordonnées",
    };
  }
}
