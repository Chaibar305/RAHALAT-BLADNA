import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { 
  generateCvStorageKey, 
  sanitizeCvFileName, 
  uploadToR2 
} from "@/lib/r2";

const MAX_CV_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

/**
 * Route API de téléversement direct du CV candidat (Server-Side).
 * Évite tout problème de CORS, pare-feu ou restriction de navigateur tiers en transitant par le serveur Next.js.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const jobPostingId = formData.get("jobPostingId") as string | null;
    const applicationId = formData.get("applicationId") as string | null;

    if (!file || !jobPostingId || !applicationId) {
      return NextResponse.json(
        { success: false, error: "Le fichier CV, l'identifiant du poste et l'identifiant de candidature sont requis." },
        { status: 400 }
      );
    }

    // 1. Validation de l'extension et du format PDF
    const fileName = file.name || "cv.pdf";
    if (!fileName.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, error: "Seuls les fichiers au format PDF sont autorisés." },
        { status: 400 }
      );
    }

    // 2. Validation de la taille maximale (5 Mo)
    if (file.size > MAX_CV_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "La taille du fichier ne doit pas dépasser 5 Mo." },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        { success: false, error: "Le fichier sélectionné est vide ou corrompu." },
        { status: 400 }
      );
    }

    // 3. Vérifier que l'offre d'emploi est valide et ouverte
    const job = await (prisma as any).jobPosting.findUnique({
      where: { id: jobPostingId },
      select: { id: true, status: true, closingDate: true },
    });

    if (!job || job.status !== "PUBLIEE") {
      return NextResponse.json(
        { success: false, error: "Cette offre d'emploi n'est plus ouverte aux candidatures." },
        { status: 400 }
      );
    }

    if (job.closingDate && new Date(job.closingDate) < new Date()) {
      return NextResponse.json(
        { success: false, error: "La date limite de candidature pour cette offre est dépassée." },
        { status: 400 }
      );
    }

    // 4. Conversion en Buffer et téléversement direct vers Cloudflare R2
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const key = generateCvStorageKey(jobPostingId, applicationId);
    const sanitizedFileName = sanitizeCvFileName(fileName);

    const uploadResult = await uploadToR2(fileBuffer, key, "application/pdf");

    console.log(`✅ [Upload CV Direct] Fichier ${sanitizedFileName} téléversé avec succès vers R2 (${uploadResult.url})`);

    return NextResponse.json({
      success: true,
      key,
      sanitizedFileName,
      url: uploadResult.url,
    });
  } catch (error: any) {
    console.error("❌ [API Upload CV Direct] Erreur :", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur lors du téléversement du CV." },
      { status: 500 }
    );
  }
}
