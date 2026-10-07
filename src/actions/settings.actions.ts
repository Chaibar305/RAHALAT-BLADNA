"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { testGoogleSheetsConnection, appendBookingToGoogleSheet, BookingSheetRow } from "@/lib/google-sheets";

const db = prisma as any;

export interface GeneralSettings {
  id: string;
  googleAnalyticsId: string | null;
  googleAdsId: string | null;
  googleAdsConversionLabel: string | null;
  facebookPixelId: string | null;
  tiktokPixelId: string | null;
  snapchatPixelId: string | null;
  customHeadScripts: string | null;
  customBodyScripts: string | null;
  conversionEventType: string;
  conversionTriggerType: string;
  googleSheetsEnabled: boolean;
  googleSheetId: string | null;
  googleSheetTabName: string | null;
  googleSheetsCredentials: string | null;
  googleSheetsWebhookUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackingSettingsInput {
  // Pixels & Identifiants
  googleAnalyticsId?: string | null;
  googleAdsId?: string | null;
  googleAdsConversionLabel?: string | null;
  facebookPixelId?: string | null;
  tiktokPixelId?: string | null;
  snapchatPixelId?: string | null;

  // Scripts personnalisés
  customHeadScripts?: string | null;
  customBodyScripts?: string | null;

  // Événements de conversion
  conversionEventType?: string;
  conversionTriggerType?: string;

  // Intégration Google Sheets
  googleSheetsEnabled?: boolean;
  googleSheetId?: string | null;
  googleSheetTabName?: string | null;
  googleSheetsCredentials?: string | null;
  googleSheetsWebhookUrl?: string | null;
}

export interface PublicTrackingConfig {
  googleAnalyticsId: string | null;
  googleAdsId: string | null;
  googleAdsConversionLabel: string | null;
  facebookPixelId: string | null;
  tiktokPixelId: string | null;
  snapchatPixelId: string | null;
  customHeadScripts: string | null;
  customBodyScripts: string | null;
  conversionEventType: string;
  conversionTriggerType: string;
}

/**
 * Récupère les paramètres complets pour le panneau d'administration
 */
export async function getGeneralSettingsAction() {
  try {
    let settings = await db.generalSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await db.generalSettings.create({
        data: {
          id: "default",
          facebookPixelId: "1118260296106847", // Pixel historique actif
          conversionEventType: "lead",
          conversionTriggerType: "on_submit",
          googleSheetTabName: "Réservations",
        },
      });
    }

    return { success: true, settings };
  } catch (error: any) {
    console.error("❌ [getGeneralSettingsAction] Erreur :", error);
    return { success: false, error: error.message || "Erreur de chargement des paramètres." };
  }
}

/**
 * Récupère uniquement la configuration publique de tracking (sans credentials serveur)
 */
export async function getPublicTrackingConfigAction(): Promise<PublicTrackingConfig> {
  try {
    const settings = await db.generalSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      return {
        googleAnalyticsId: null,
        googleAdsId: null,
        googleAdsConversionLabel: null,
        facebookPixelId: "1118260296106847",
        tiktokPixelId: null,
        snapchatPixelId: null,
        customHeadScripts: null,
        customBodyScripts: null,
        conversionEventType: "lead",
        conversionTriggerType: "on_submit",
      };
    }

    return {
      googleAnalyticsId: settings.googleAnalyticsId,
      googleAdsId: settings.googleAdsId,
      googleAdsConversionLabel: settings.googleAdsConversionLabel,
      facebookPixelId: settings.facebookPixelId || "1118260296106847",
      tiktokPixelId: settings.tiktokPixelId,
      snapchatPixelId: settings.snapchatPixelId,
      customHeadScripts: settings.customHeadScripts,
      customBodyScripts: settings.customBodyScripts,
      conversionEventType: settings.conversionEventType || "lead",
      conversionTriggerType: settings.conversionTriggerType || "on_submit",
    };
  } catch (error) {
    return {
      googleAnalyticsId: null,
      googleAdsId: null,
      googleAdsConversionLabel: null,
      facebookPixelId: "1118260296106847",
      tiktokPixelId: null,
      snapchatPixelId: null,
      customHeadScripts: null,
      customBodyScripts: null,
      conversionEventType: "lead",
      conversionTriggerType: "on_submit",
    };
  }
}

/**
 * Sauvegarde la configuration du tracking, pixels et intégration Google Sheets
 */
export async function updateTrackingSettingsAction(input: TrackingSettingsInput) {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {}

  // Autorisé pour les utilisateurs connectés ou en mode dev/script
  if (process.env.NODE_ENV === "production" && !session?.user) {
    return { success: false, error: "Non autorisé. Veuillez vous connecter." };
  }

  try {
    const updated = await db.generalSettings.upsert({
      where: { id: "default" },
      update: {
        googleAnalyticsId: input.googleAnalyticsId?.trim() || null,
        googleAdsId: input.googleAdsId?.trim() || null,
        googleAdsConversionLabel: input.googleAdsConversionLabel?.trim() || null,
        facebookPixelId: input.facebookPixelId?.trim() || null,
        tiktokPixelId: input.tiktokPixelId?.trim() || null,
        snapchatPixelId: input.snapchatPixelId?.trim() || null,
        customHeadScripts: input.customHeadScripts?.trim() || null,
        customBodyScripts: input.customBodyScripts?.trim() || null,
        conversionEventType: input.conversionEventType || "lead",
        conversionTriggerType: input.conversionTriggerType || "on_submit",
        googleSheetsEnabled: input.googleSheetsEnabled ?? false,
        googleSheetId: input.googleSheetId?.trim() || null,
        googleSheetTabName: input.googleSheetTabName?.trim() || "Réservations",
        googleSheetsCredentials: input.googleSheetsCredentials?.trim() || null,
        googleSheetsWebhookUrl: input.googleSheetsWebhookUrl?.trim() || null,
      },
      create: {
        id: "default",
        googleAnalyticsId: input.googleAnalyticsId?.trim() || null,
        googleAdsId: input.googleAdsId?.trim() || null,
        googleAdsConversionLabel: input.googleAdsConversionLabel?.trim() || null,
        facebookPixelId: input.facebookPixelId?.trim() || null,
        tiktokPixelId: input.tiktokPixelId?.trim() || null,
        snapchatPixelId: input.snapchatPixelId?.trim() || null,
        customHeadScripts: input.customHeadScripts?.trim() || null,
        customBodyScripts: input.customBodyScripts?.trim() || null,
        conversionEventType: input.conversionEventType || "lead",
        conversionTriggerType: input.conversionTriggerType || "on_submit",
        googleSheetsEnabled: input.googleSheetsEnabled ?? false,
        googleSheetId: input.googleSheetId?.trim() || null,
        googleSheetTabName: input.googleSheetTabName?.trim() || "Réservations",
        googleSheetsCredentials: input.googleSheetsCredentials?.trim() || null,
        googleSheetsWebhookUrl: input.googleSheetsWebhookUrl?.trim() || null,
      },
    });

    try {
      revalidatePath("/admin/settings");
      revalidatePath("/");
    } catch {}

    return {
      success: true,
      message: "Paramètres de tracking et d'intégration enregistrés avec succès !",
      settings: updated,
    };
  } catch (error: any) {
    console.error("❌ [updateTrackingSettingsAction] Erreur :", error);
    return { success: false, error: error.message || "Erreur lors de la sauvegarde." };
  }
}

/**
 * Teste la connexion Google Sheets en direct
 */
export async function testGoogleSheetsAction(config: {
  sheetId?: string | null;
  tabName?: string | null;
  credentialsJson?: string | null;
  webhookUrl?: string | null;
}) {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {}

  if (process.env.NODE_ENV === "production" && !session?.user) {
    return { success: false, error: "Non autorisé." };
  }

  return await testGoogleSheetsConnection({
    enabled: true,
    sheetId: config.sheetId,
    tabName: config.tabName,
    credentialsJson: config.credentialsJson,
    webhookUrl: config.webhookUrl,
  });
}

/**
 * Tâche d'arrière-plan pour envoyer une réservation vers Google Sheets
 */
export async function syncBookingToSheetsTask(bookingRow: BookingSheetRow): Promise<void> {
  try {
    const settings = await db.generalSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings || !settings.googleSheetsEnabled) return;

    await appendBookingToGoogleSheet(bookingRow, {
      enabled: settings.googleSheetsEnabled,
      sheetId: settings.googleSheetId,
      tabName: settings.googleSheetTabName || "Réservations",
      credentialsJson: settings.googleSheetsCredentials,
      webhookUrl: settings.googleSheetsWebhookUrl,
    });
  } catch (err) {
    console.warn("⚠️ [syncBookingToSheetsTask] Échec silencieux :", err);
  }
}
