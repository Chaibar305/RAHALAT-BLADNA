import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  GetObjectCommand,
  HeadObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const R2_ACCOUNT_ID =
  process.env.R2_ACCOUNT_ID || "3f34309d88ce1f243e9b386553f5a920";
export const R2_ACCESS_KEY_ID =
  process.env.R2_ACCESS_KEY_ID || "7ca8a24ccab19c0500c39fc872c8e1c1";
export const R2_SECRET_ACCESS_KEY =
  process.env.R2_SECRET_ACCESS_KEY ||
  "68c43e7123c88701b4aaa2be80d26a0be8bf46aaa84c3cd8c1a27ede3bbf287a";
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "rahalat-bladna";
export const R2_PUBLIC_DOMAIN =
  process.env.NEXT_PUBLIC_R2_URL ||
  process.env.R2_PUBLIC_DOMAIN ||
  "https://pub-a7e412da142148a89892728e019eb7e2.r2.dev";

/**
 * Client AWS SDK S3 configuré pour Cloudflare R2
 */
export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Génère l'URL publique directe d'un objet stocké dans le bucket R2
 */
export function getR2PublicUrl(key: string): string {
  const cleanKey = key.startsWith("/") ? key.substring(1) : key;
  return `${R2_PUBLIC_DOMAIN.replace(/\/$/, "")}/${cleanKey}`;
}

/**
 * Nettoie et normalise le nom d'un fichier avec timestamp et UUID court
 */
export function sanitizeFileName(fileName: string): string {
  const parts = fileName.split(".");
  const ext = parts.pop()?.toLowerCase() || "";
  const baseName = parts.join(".");
  
  const cleanName = baseName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-");

  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  return `${cleanName}-${uniqueSuffix}.${ext}`;
}

/**
 * Téléverse un Buffer vers Cloudflare R2 et retourne l'URL publique directe
 */
export async function uploadToR2(
  fileBuffer: Buffer | Uint8Array,
  key: string,
  mimeType: string
): Promise<{ url: string; key: string }> {
  const cleanKey = key.startsWith("/") ? key.substring(1) : key;
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: cleanKey,
    Body: fileBuffer,
    ContentType: mimeType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  await r2Client.send(command);

  return {
    url: getR2PublicUrl(cleanKey),
    key: cleanKey,
  };
}

// Alias pour rétrocompatibilité
export const uploadBufferToR2 = uploadToR2;

/**
 * Supprime un fichier physique du bucket Cloudflare R2
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  try {
    const cleanKey = key.startsWith("/") ? key.substring(1) : key;
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: cleanKey,
    });
    await r2Client.send(command);
    return true;
  } catch (error) {
    console.error("Error deleting file from Cloudflare R2:", error);
    return false;
  }
}

// Alias pour rétrocompatibilité
export const deleteFileFromR2 = deleteFromR2;

/**
 * Génère une URL présignée (Presigned URL) pour un upload direct côté client vers R2
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds: number = 3600
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const cleanKey = key.startsWith("/") ? key.substring(1) : key;
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: cleanKey,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  const uploadUrl = await getSignedUrl(r2Client, command, {
    expiresIn: expiresInSeconds,
  });

  return {
    uploadUrl,
    publicUrl: getR2PublicUrl(cleanKey),
    key: cleanKey,
  };
}

// ====================================================
// GESTION SÉCURISÉE DES CV DE RECRUTEMENT (CONFIDENTIEL)
// ====================================================

const MAX_CV_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

/**
 * Génère la clé de stockage standardisée pour un CV candidat
 */
export function generateCvStorageKey(jobPostingId: string, applicationId: string): string {
  const cleanJobId = jobPostingId.trim().replace(/[^a-zA-Z0-9-_]/g, "");
  const cleanAppId = applicationId.trim().replace(/[^a-zA-Z0-9-_]/g, "");
  return `recruitment/cv/${cleanJobId}/${cleanAppId}.pdf`;
}

/**
 * Nettoie le nom de fichier d'un CV
 */
export function sanitizeCvFileName(fileName: string): string {
  const base = fileName.replace(/\.pdf$/i, "");
  const cleanBase = base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
  return `${cleanBase || "cv"}.pdf`;
}

/**
 * Valide et génère une URL présignée PUT pour le téléversement direct du CV vers Cloudflare R2
 */
export async function getPresignedCvUploadUrl({
  jobPostingId,
  applicationId,
  fileName,
  fileSize,
  mimeType,
}: {
  jobPostingId: string;
  applicationId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}): Promise<{ uploadUrl: string; key: string; sanitizedFileName: string }> {
  // 1. Validation stricte du type MIME
  if (mimeType !== "application/pdf") {
    throw new Error("Format invalide : Seuls les fichiers PDF sont acceptés.");
  }

  // 2. Validation de l'extension
  if (!fileName.toLowerCase().endsWith(".pdf")) {
    throw new Error("Extension invalide : Le fichier doit se terminer par .pdf.");
  }

  // 3. Validation de la taille maximale (5 Mo)
  if (fileSize > MAX_CV_FILE_SIZE) {
    throw new Error("Taille excessive : Le fichier CV ne doit pas dépasser 5 Mo.");
  }

  if (fileSize <= 0) {
    throw new Error("Fichier vide ou corrompu.");
  }

  const key = generateCvStorageKey(jobPostingId, applicationId);
  const sanitizedFileName = sanitizeCvFileName(fileName);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: "application/pdf",
    Metadata: {
      originalName: sanitizedFileName,
      uploadedAt: new Date().toISOString(),
    },
  });

  const uploadUrl = await getSignedUrl(r2Client, command, {
    expiresIn: 600, // 10 minutes
  });

  return {
    uploadUrl,
    key,
    sanitizedFileName,
  };
}

/**
 * Génère une URL signée temporaire (15 minutes) pour consulter ou télécharger un CV (Admin uniquement)
 * Jamais d'URL publique permanente pour préserver les données personnelles du candidat.
 */
export async function getPresignedCvDownloadUrl(
  key: string,
  expiresInSeconds: number = 900,
  downloadName?: string
): Promise<string> {
  const cleanKey = key.startsWith("/") ? key.substring(1) : key;
  const fileName = downloadName ? sanitizeCvFileName(downloadName) : "cv-candidat.pdf";

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: cleanKey,
    ResponseContentType: "application/pdf",
    ResponseContentDisposition: `inline; filename="${fileName}"`,
  });

  return await getSignedUrl(r2Client, command, {
    expiresIn: expiresInSeconds, // 15 minutes par défaut
  });
}

/**
 * Vérifie l'existence effective et les métadonnées d'un CV sur R2
 */
export async function verifyCvExistsOnR2(key: string): Promise<{ exists: boolean; size?: number }> {
  try {
    const cleanKey = key.startsWith("/") ? key.substring(1) : key;
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: cleanKey,
    });
    const response = await r2Client.send(command);
    return {
      exists: true,
      size: response.ContentLength,
    };
  } catch (error) {
    return { exists: false };
  }
}

/**
 * Supprime physiquement un CV de Cloudflare R2
 */
export async function deleteCvFromR2(key: string): Promise<boolean> {
  return await deleteFromR2(key);
}

