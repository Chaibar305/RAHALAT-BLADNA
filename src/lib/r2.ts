import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  GetObjectCommand 
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
