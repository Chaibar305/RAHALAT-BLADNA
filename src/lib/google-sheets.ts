import crypto from "crypto";

export interface GoogleSheetsConfig {
  enabled: boolean;
  sheetId?: string | null;
  tabName?: string | null;
  credentialsJson?: string | null;
  webhookUrl?: string | null;
}

export interface BookingSheetRow {
  reference: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  tripTitle: string;
  departureDate: string;
  passengersCount: number;
  totalAmount: number;
  depositAmount: number;
  status: string;
  callStatus: string;
  source: string;
  pickupCity?: string;
  pickupPoint?: string;
  roomPreference?: string;
  notes?: string;
  createdAt?: string;
}

const DEFAULT_HEADERS = [
  "Date Création",
  "Référence",
  "Nom Complet",
  "Téléphone",
  "Email",
  "Circuit Touristique",
  "Date de Départ",
  "Nombre Pax",
  "Total TTC (MAD)",
  "Acompte Versé (MAD)",
  "Statut Réservation",
  "Statut Appel (CRM)",
  "Canal d'Acquisition",
  "Ville de Départ",
  "Point de Ramassage",
  "Type de Chambre",
  "Notes / Remarques",
];

/**
 * Génère un access_token Google OAuth2 via JWT Bearer avec la clé privée du Service Account
 */
async function getGoogleServiceAccountToken(credentialsJson: string): Promise<string> {
  const credentials = JSON.parse(credentialsJson);
  const clientEmail = credentials.client_email;
  const privateKey = credentials.private_key;

  if (!clientEmail || !privateKey) {
    throw new Error("Clé de compte de service invalide : client_email ou private_key manquant.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodeBase64Url = (obj: any) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const encodedHeader = encodeBase64Url(header);
  const encodedClaim = encodeBase64Url(claim);
  const signInput = `${encodedHeader}.${encodedClaim}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signInput);
  const signature = signer
    .sign(privateKey, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${signInput}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || tokenData.error || "Impossible d'obtenir l'access token Google.");
  }

  return tokenData.access_token;
}

/**
 * Teste la connexion Google Sheets ou le Webhook configuré
 */
export async function testGoogleSheetsConnection(config: GoogleSheetsConfig): Promise<{
  success: boolean;
  message?: string;
  sheetTitle?: string;
  error?: string;
}> {
  try {
    // 1. Test via Webhook si renseigné
    if (config.webhookUrl && config.webhookUrl.trim().startsWith("http")) {
      const webhookRes = await fetch(config.webhookUrl.trim(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "TEST_CONNECTION",
          message: "Test de connexion Rahalat Bladna",
          timestamp: new Date().toISOString(),
        }),
      });

      if (!webhookRes.ok) {
        return {
          success: false,
          error: `Le Webhook a répondu avec le statut HTTP ${webhookRes.status}.`,
        };
      }

      return {
        success: true,
        message: "Connexion Webhook validée avec succès (HTTP 200 OK) !",
      };
    }

    // 2. Test via Service Account JSON & Sheet ID
    if (!config.sheetId || !config.sheetId.trim()) {
      return { success: false, error: "Veuillez renseigner l'ID de la feuille Google Sheets." };
    }

    if (!config.credentialsJson || !config.credentialsJson.trim()) {
      return {
        success: false,
        error: "Veuillez coller le JSON du compte de service Google (ou une URL de Webhook).",
      };
    }

    const token = await getGoogleServiceAccountToken(config.credentialsJson);
    const sheetId = config.sheetId.trim();

    // Vérifier l'accès à la feuille
    const getRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=properties.title,sheets.properties.title`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const sheetData = await getRes.json();
    if (!getRes.ok) {
      return {
        success: false,
        error: sheetData.error?.message || "Erreur d'accès à la feuille. Vérifiez que le compte de service est bien partagé en Éditeur sur le Google Sheet.",
      };
    }

    const title = sheetData.properties?.title || "Feuille Google Sheets";
    const availableTabs = (sheetData.sheets || []).map((s: any) => s.properties?.title);

    const targetTab = config.tabName?.trim() || "Réservations";
    const tabExists = availableTabs.includes(targetTab);

    return {
      success: true,
      sheetTitle: title,
      message: tabExists
        ? `Connecté avec succès au document "${title}" (Onglet "${targetTab}").`
        : `Connecté à "${title}". L'onglet "${targetTab}" sera créé automatiquement lors de la première réservation.`,
    };
  } catch (err: any) {
    console.error("❌ [Google Sheets Test] Erreur :", err);
    return {
      success: false,
      error: err.message || "Erreur inattendue lors du test de connexion.",
    };
  }
}

/**
 * Envoie une réservation vers Google Sheets (asynchrone, non-bloquant)
 */
export async function appendBookingToGoogleSheet(
  row: BookingSheetRow,
  config: GoogleSheetsConfig
): Promise<void> {
  if (!config.enabled) return;

  try {
    // 1. Envoi Webhook si configuré
    if (config.webhookUrl && config.webhookUrl.trim().startsWith("http")) {
      await fetch(config.webhookUrl.trim(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "NEW_BOOKING",
          ...row,
          timestamp: new Date().toISOString(),
        }),
      });
      console.log(`✅ [Google Sheets Webhook] Réservation ${row.reference} transmise avec succès.`);
      return;
    }

    // 2. Envoi direct via API Google Sheets v4
    if (!config.sheetId || !config.credentialsJson) {
      console.warn("⚠️ [Google Sheets] Synchronisation activée mais paramètres incomplets.");
      return;
    }

    const token = await getGoogleServiceAccountToken(config.credentialsJson);
    const sheetId = config.sheetId.trim();
    const tabName = config.tabName?.trim() || "Réservations";

    // Vérifier si des en-têtes existent déjà
    const checkHeaderRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tabName)}!A1:Q1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const headerData = await checkHeaderRes.json();
    const hasHeaders = headerData.values && headerData.values.length > 0 && headerData.values[0].length > 0;

    // Si la feuille est vide, insérer la ligne d'en-tête
    if (!hasHeaders) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tabName)}!A1:append?valueInputOption=USER_ENTERED`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: [DEFAULT_HEADERS],
          }),
        }
      );
    }

    // Formatage de la ligne de données
    const rowValues = [
      row.createdAt || new Date().toLocaleString("fr-FR"),
      row.reference,
      row.clientName,
      row.clientPhone,
      row.clientEmail || "—",
      row.tripTitle,
      row.departureDate,
      row.passengersCount,
      row.totalAmount,
      row.depositAmount,
      row.status,
      row.callStatus,
      row.source,
      row.pickupCity || "Casablanca",
      row.pickupPoint || "—",
      row.roomPreference || "DOUBLE_TWIN",
      row.notes || "",
    ];

    // Ajout de la nouvelle ligne
    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tabName)}!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [rowValues],
        }),
      }
    );

    if (!appendRes.ok) {
      const errBody = await appendRes.json();
      console.warn("⚠️ [Google Sheets] Échec append API :", errBody);
    } else {
      console.log(`✅ [Google Sheets API] Réservation ${row.reference} synchronisée avec succès dans la feuille !`);
    }
  } catch (error) {
    console.warn("⚠️ [Google Sheets] Erreur non-bloquante lors de la synchronisation :", error);
  }
}
