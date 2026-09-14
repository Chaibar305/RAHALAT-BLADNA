import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  uploadToR2, 
  getPresignedUploadUrl, 
  sanitizeFileName 
} from "@/lib/r2";

// Définition stricte des types MIME autorisés et limites de taille
const ALLOWED_MIME_TYPES: Record<string, { maxSize: number; category: "IMAGE" | "DOCUMENT" }> = {
  "image/webp": { maxSize: 5 * 1024 * 1024, category: "IMAGE" },
  "image/jpeg": { maxSize: 5 * 1024 * 1024, category: "IMAGE" },
  "image/jpg": { maxSize: 5 * 1024 * 1024, category: "IMAGE" },
  "image/png": { maxSize: 5 * 1024 * 1024, category: "IMAGE" },
  "application/pdf": { maxSize: 10 * 1024 * 1024, category: "DOCUMENT" },
};

// Organisation stricte des sous-dossiers dans le bucket Cloudflare R2
const ALLOWED_FOLDERS = [
  "trips",     // Photos des circuits et programmes journaliers
  "receipts",  // Justificatifs de virement bancaire client
  "invoices",  // Factures et devis générés
  "documents", // Documents administratifs divers
  "avatars",   // Photos de profil
];

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // -------------------------------------------------------------
    // OPTION A : DEMANDE D'URL PRÉSIGNÉE (JSON)
    // -------------------------------------------------------------
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { filename, fileType, folder = "trips" } = body;

      if (!filename || !fileType) {
        return NextResponse.json(
          { error: "Les champs 'filename' et 'fileType' sont obligatoires." },
          { status: 400 }
        );
      }

      if (!ALLOWED_MIME_TYPES[fileType]) {
        return NextResponse.json(
          { error: `Type de fichier non autorisé (${fileType}). Formats autorisés : WebP, JPEG, PNG, PDF.` },
          { status: 400 }
        );
      }

      const targetFolder = ALLOWED_FOLDERS.includes(folder) ? folder : "trips";
      const cleanName = sanitizeFileName(filename);
      const key = `${targetFolder}/${cleanName}`;

      const presigned = await getPresignedUploadUrl(key, fileType, 3600);

      return NextResponse.json({
        success: true,
        uploadUrl: presigned.uploadUrl,
        publicUrl: presigned.publicUrl,
        key: presigned.key,
      });
    }

    // -------------------------------------------------------------
    // OPTION B : TÉLÉVERSEMENT DIRECT MULTIPART FORMDATA
    // -------------------------------------------------------------
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const folder = (formData.get("folder") as string) || "trips";

      if (!file) {
        return NextResponse.json(
          { error: "Aucun fichier détecté dans la requête." },
          { status: 400 }
        );
      }

      const mimeType = file.type || "application/octet-stream";
      const fileConfig = ALLOWED_MIME_TYPES[mimeType];

      // 1. Validation stricte du Type MIME
      if (!fileConfig) {
        return NextResponse.json(
          { 
            error: `Format de fichier non autorisé (${mimeType}). Formats autorisés : WebP, JPEG, PNG, PDF.` 
          },
          { status: 400 }
        );
      }

      // 2. Validation de la Taille Maximale (5 Mo images, 10 Mo PDF)
      if (file.size > fileConfig.maxSize) {
        const maxMb = Math.round(fileConfig.maxSize / (1024 * 1024));
        return NextResponse.json(
          { 
            error: `Le fichier dépasse la taille maximale autorisée de ${maxMb} Mo (${(file.size / (1024 * 1024)).toFixed(2)} Mo détectés).` 
          },
          { status: 400 }
        );
      }

      // 3. Organisation automatique par sous-dossier & nom unique sécurisé
      const targetFolder = ALLOWED_FOLDERS.includes(folder) ? folder : "trips";
      const cleanName = sanitizeFileName(file.name);
      const key = `${targetFolder}/${cleanName}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 4. Téléversement vers Cloudflare R2
      try {
        const uploadResult = await uploadToR2(buffer, key, mimeType);

        return NextResponse.json({
          success: true,
          url: uploadResult.url,
          key: uploadResult.key,
          filename: cleanName,
          size: file.size,
          mimeType,
          category: fileConfig.category,
        });
      } catch (r2Error: any) {
        console.error("Cloudflare R2 Direct Upload error:", r2Error);
        return NextResponse.json(
          { error: `Échec du stockage Cloudflare R2 : ${r2Error.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Format de requête non pris en charge." },
      { status: 415 }
    );
  } catch (error: any) {
    console.error("API Upload error:", error);
    return NextResponse.json(
      { error: "Erreur interne lors du traitement du fichier." },
      { status: 500 }
    );
  }
}
