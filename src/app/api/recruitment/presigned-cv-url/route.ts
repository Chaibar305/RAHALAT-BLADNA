import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPresignedCvUploadUrl } from "@/lib/r2";
import { z } from "zod";

const presignedUrlSchema = z.object({
  jobPostingId: z.string().min(1, "L'identifiant du poste est requis."),
  applicationId: z.string().min(1, "L'identifiant de la candidature est requis."),
  fileName: z.string().min(1, "Le nom du fichier est requis."),
  fileSize: z.number().int().positive().max(5 * 1024 * 1024, "La taille du fichier ne doit pas dépasser 5 Mo."),
  mimeType: z.string().refine((val) => val === "application/pdf", {
    message: "Seuls les fichiers au format PDF sont autorisés.",
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = presignedUrlSchema.safeParse(body);

    if (!parseResult.success) {
      const issues = (parseResult.error as any).issues || (parseResult.error as any).errors || [];
      const firstError = issues[0]?.message || "Données invalides.";
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const { jobPostingId, applicationId, fileName, fileSize, mimeType } = parseResult.data;

    // 1. Vérifier que l'offre existe et est bien publiée
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

    // Vérifier la date limite si elle est fixée
    if (job.closingDate && new Date(job.closingDate) < new Date()) {
      return NextResponse.json(
        { success: false, error: "La date limite de candidature pour cette offre est dépassée." },
        { status: 400 }
      );
    }

    // 2. Générer l'URL présignée Cloudflare R2
    const { uploadUrl, key, sanitizedFileName } = await getPresignedCvUploadUrl({
      jobPostingId,
      applicationId,
      fileName,
      fileSize,
      mimeType,
    });

    return NextResponse.json({
      success: true,
      uploadUrl,
      key,
      sanitizedFileName,
    });
  } catch (error: any) {
    console.error("❌ [API Presigned CV URL] Erreur :", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur lors de la préparation du téléversement." },
      { status: 500 }
    );
  }
}
