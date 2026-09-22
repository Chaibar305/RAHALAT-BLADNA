"use server";

import { prisma } from "@/lib/prisma";
import { 
  verifyCvExistsOnR2, 
  getPresignedCvDownloadUrl, 
  deleteCvFromR2 
} from "@/lib/r2";
import { 
  sendApplicationConfirmationEmail, 
  sendAdminNewApplicationNotification 
} from "@/lib/mail";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ALLOWED_ADMIN_ROLES } from "@/auth.config";
import { 
  JobStatus, 
  EmploymentType, 
  SalaryType, 
  StaffRole, 
  ApplicationStatus, 
  TeamRole 
} from "@prisma/client";

// ====================================================
// VÉRIFICATION D'AUTHENTIFICATION ADMIN
// ====================================================

async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  const role = ((session?.user as any)?.role as string) || "";
  const isAuthorized = ALLOWED_ADMIN_ROLES.includes(role.toUpperCase());

  if (!session || !isAuthorized) {
    throw new Error("Accès non autorisé : Privilèges administrateur requis.");
  }

  return session;
}

// ====================================================
// ACTIONS PUBLIQUES (CANDIDATS)
// ====================================================

/**
 * Récupère les offres d'emploi publiques actives
 */
export async function getPublicJobPostingsAction(filters?: {
  department?: string;
  employmentType?: string;
  location?: string;
}) {
  try {
    const whereClause: any = {
      status: "PUBLIEE" as JobStatus,
    };

    if (filters?.department && filters.department !== "ALL") {
      whereClause.department = filters.department;
    }

    if (filters?.employmentType && filters.employmentType !== "ALL") {
      whereClause.employmentType = filters.employmentType as EmploymentType;
    }

    if (filters?.location && filters.location !== "ALL") {
      whereClause.location = { contains: filters.location, mode: "insensitive" };
    }

    const jobs = await prisma.jobPosting.findMany({
      where: whereClause,
      orderBy: [
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        title: true,
        slug: true,
        department: true,
        employmentType: true,
        location: true,
        descriptionFr: true,
        descriptionAr: true,
        descriptionEn: true,
        missions: true,
        requirements: true,
        salaryMin: true,
        salaryMax: true,
        salaryType: true,
        publishedAt: true,
        closingDate: true,
        role: true,
      },
    });

    // Extraire les listes uniques de filtres pour l'interface
    const allPublished = await prisma.jobPosting.findMany({
      where: { status: "PUBLIEE" },
      select: { department: true, location: true },
    });

    const departments = Array.from(
      new Set(allPublished.map((j: { department: string | null; location: string }) => j.department).filter(Boolean))
    ) as string[];

    const locations = Array.from(
      new Set(allPublished.map((j: { department: string | null; location: string }) => j.location).filter(Boolean))
    ) as string[];

    return {
      success: true,
      jobs: JSON.parse(JSON.stringify(jobs)),
      filterOptions: { departments, locations },
    };
  } catch (error: any) {
    console.error("❌ [getPublicJobPostingsAction] Erreur :", error);
    return { success: false, jobs: [], filterOptions: { departments: [], locations: [] }, error: error.message };
  }
}

/**
 * Récupère le détail complet d'une offre par son slug avec offres similaires
 */
export async function getPublicJobPostingBySlugAction(slug: string) {
  try {
    const job = await prisma.jobPosting.findUnique({
      where: { slug },
    });

    if (!job || job.status !== "PUBLIEE") {
      return { success: false, job: null, similarJobs: [] };
    }

    // Récupérer 3 postes similaires
    const similarJobs = await prisma.jobPosting.findMany({
      where: {
        status: "PUBLIEE",
        id: { not: job.id },
        OR: [
          { department: job.department || undefined },
          { employmentType: job.employmentType },
        ],
      },
      take: 3,
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        department: true,
        employmentType: true,
        location: true,
        salaryMin: true,
        salaryMax: true,
        salaryType: true,
      },
    });

    return {
      success: true,
      job: JSON.parse(JSON.stringify(job)),
      similarJobs: JSON.parse(JSON.stringify(similarJobs)),
    };
  } catch (error: any) {
    console.error("❌ [getPublicJobPostingBySlugAction] Erreur :", error);
    return { success: false, job: null, similarJobs: [], error: error.message };
  }
}

/**
 * Soumission sécurisée d'une candidature avec validation et vérification du CV sur R2
 */
export async function submitJobApplicationAction(data: {
  jobPostingId: string;
  fullName: string;
  email: string;
  phone: string;
  city?: string;
  coverMessage?: string;
  cvFileUrl: string; // Clé R2
  cvFileName: string;
  cvFileSize: number;
  portfolioLinks?: string[];
  availability?: string;
  locale?: string;
}) {
  try {
    // 1. Validation de présence
    if (!data.jobPostingId || !data.fullName || !data.email || !data.phone || !data.cvFileUrl) {
      return { success: false, error: "Tous les champs obligatoires doivent être renseignés." };
    }

    // 2. Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      return { success: false, error: "Adresse email invalide." };
    }

    // 3. Validation format téléphone marocain (+212 ou 0X)
    const phoneClean = data.phone.trim().replace(/\s+/g, "");
    const phoneRegex = /^(?:\+212|00212|0)([5-7]\d{8})$/;
    if (!phoneRegex.test(phoneClean)) {
      return { success: false, error: "Numéro de téléphone marocain invalide (ex: +212 661 000000 ou 0661000000)." };
    }

    // 4. Rate-Limiting : maximum 3 candidatures par email sur les dernières 24 heures
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSubmissionsCount = await prisma.jobApplication.count({
      where: {
        email: data.email.trim().toLowerCase(),
        createdAt: { gte: oneDayAgo },
      },
    });

    if (recentSubmissionsCount >= 3) {
      return { 
        success: false, 
        error: "Limite atteinte : Vous avez déjà soumis 3 candidatures au cours des dernières 24 heures. Veuillez patienter avant de postuler à nouveau." 
      };
    }

    // 5. Vérifier que l'offre est bien ouverte
    const job = await prisma.jobPosting.findUnique({
      where: { id: data.jobPostingId },
      select: { id: true, title: true, status: true, closingDate: true },
    });

    if (!job || job.status !== "PUBLIEE") {
      return { success: false, error: "Cette offre d'emploi n'est plus disponible." };
    }

    if (job.closingDate && new Date(job.closingDate) < new Date()) {
      return { success: false, error: "La date limite pour cette offre est dépassée." };
    }

    // 6. Vérifier la présence physique réelle du CV sur Cloudflare R2
    const r2Check = await verifyCvExistsOnR2(data.cvFileUrl);
    if (!r2Check.exists) {
      return { 
        success: false, 
        error: "Le fichier CV n'a pas été reçu correctement par le serveur de stockage. Veuillez réessayer de téléverser votre fichier PDF." 
      };
    }

    // 7. Enregistrement transactionnel en base de données
    const application = await prisma.jobApplication.create({
      data: {
        jobPostingId: data.jobPostingId,
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: phoneClean,
        city: data.city?.trim() || null,
        coverMessage: data.coverMessage?.trim() || null,
        cvFileUrl: data.cvFileUrl,
        cvFileName: data.cvFileName,
        cvFileSize: r2Check.size || data.cvFileSize,
        portfolioLinks: data.portfolioLinks ? data.portfolioLinks.filter((l) => Boolean(l.trim())) : [],
        availability: data.availability?.trim() || null,
        status: "NOUVELLE" as ApplicationStatus,
      },
    });

    // 8. Notifications emails (asynchrones non-bloquantes)
    sendApplicationConfirmationEmail({
      to: application.email,
      fullName: application.fullName,
      jobTitle: job.title,
      locale: data.locale || "fr",
    }).catch((err) => console.error("Erreur envoi accusé candidat :", err));

    sendAdminNewApplicationNotification({
      jobTitle: job.title,
      candidateName: application.fullName,
      candidateEmail: application.email,
      candidatePhone: application.phone,
      applicationId: application.id,
    }).catch((err) => console.error("Erreur envoi alerte admin :", err));

    revalidatePath("/[locale]/carrieres", "page");
    revalidatePath("/admin/recrutement/candidatures", "page");

    return {
      success: true,
      applicationId: application.id,
    };
  } catch (error: any) {
    console.error("❌ [submitJobApplicationAction] Erreur :", error);
    return { success: false, error: error.message || "Erreur lors de l'enregistrement de votre candidature." };
  }
}

/**
 * Inscription aux alertes emploi
 */
export async function subscribeJobAlertAction(email: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: "Adresse email invalide." };
    }

    await prisma.jobAlertSubscription.upsert({
      where: { email: cleanEmail },
      update: {},
      create: { email: cleanEmail },
    });

    return { success: true };
  } catch (error: any) {
    console.error("❌ [subscribeJobAlertAction] Erreur :", error);
    return { success: false, error: "Une erreur est survenue lors de l'inscription." };
  }
}

// ====================================================
// ACTIONS ADMIN (GESTION DES OFFRES & CANDIDATURES)
// ====================================================

/**
 * Récupère toutes les offres d'emploi pour l'administration
 */
export async function getAdminJobPostingsAction(filters?: {
  status?: string;
  department?: string;
}) {
  try {
    await checkAdminAuth();

    const where: any = {};
    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status as JobStatus;
    }
    if (filters?.department && filters.department !== "ALL") {
      where.department = filters.department;
    }

    const jobs = await prisma.jobPosting.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    return {
      success: true,
      jobs: JSON.parse(JSON.stringify(jobs)),
    };
  } catch (error: any) {
    return { success: false, jobs: [], error: error.message };
  }
}

/**
 * Création d'une nouvelle offre d'emploi
 */
export async function createJobPostingAction(data: {
  title: string;
  slug?: string;
  role?: StaffRole | null;
  department?: string | null;
  employmentType: EmploymentType;
  location: string;
  descriptionFr: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  missions: string[];
  requirements: string[];
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryType?: SalaryType | null;
  status?: JobStatus;
  closingDate?: string | null;
}) {
  try {
    await checkAdminAuth();

    if (!data.title || !data.location || !data.descriptionFr) {
      return { success: false, error: "Titre, localisation et description sont requis." };
    }

    // Générer un slug unique
    let generatedSlug = (data.slug?.trim() || data.title)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    let existing = await prisma.jobPosting.findUnique({ where: { slug: generatedSlug } });
    if (existing) {
      generatedSlug = `${generatedSlug}-${Date.now().toString().slice(-4)}`;
    }

    const isPublished = data.status === "PUBLIEE";

    const job = await prisma.jobPosting.create({
      data: {
        title: data.title.trim(),
        slug: generatedSlug,
        role: data.role || null,
        department: data.department?.trim() || null,
        employmentType: data.employmentType,
        location: data.location.trim(),
        descriptionFr: data.descriptionFr.trim(),
        descriptionAr: data.descriptionAr?.trim() || null,
        descriptionEn: data.descriptionEn?.trim() || null,
        missions: data.missions ? data.missions.filter((m) => Boolean(m.trim())) : [],
        requirements: data.requirements ? data.requirements.filter((r) => Boolean(r.trim())) : [],
        salaryMin: data.salaryMin !== undefined && data.salaryMin !== null ? data.salaryMin : null,
        salaryMax: data.salaryMax !== undefined && data.salaryMax !== null ? data.salaryMax : null,
        salaryType: data.salaryType || null,
        status: data.status || "BROUILLON",
        publishedAt: isPublished ? new Date() : null,
        closingDate: data.closingDate ? new Date(data.closingDate) : null,
      },
    });

    revalidatePath("/[locale]/carrieres", "page");
    revalidatePath("/admin/recrutement/offres", "page");

    return { success: true, job: JSON.parse(JSON.stringify(job)) };
  } catch (error: any) {
    console.error("❌ [createJobPostingAction] Erreur :", error);
    return { success: false, error: error.message };
  }
}

/**
 * Modification d'une offre d'emploi
 */
export async function updateJobPostingAction(
  id: string,
  data: {
    title?: string;
    slug?: string;
    role?: StaffRole | null;
    department?: string | null;
    employmentType?: EmploymentType;
    location?: string;
    descriptionFr?: string;
    descriptionAr?: string | null;
    descriptionEn?: string | null;
    missions?: string[];
    requirements?: string[];
    salaryMin?: number | null;
    salaryMax?: number | null;
    salaryType?: SalaryType | null;
    status?: JobStatus;
    closingDate?: string | null;
  }
) {
  try {
    await checkAdminAuth();

    const existing = await prisma.jobPosting.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Offre introuvable." };
    }

    const updates: any = {};
    if (data.title !== undefined) updates.title = data.title.trim();
    if (data.role !== undefined) updates.role = data.role;
    if (data.department !== undefined) updates.department = data.department ? data.department.trim() : null;
    if (data.employmentType !== undefined) updates.employmentType = data.employmentType;
    if (data.location !== undefined) updates.location = data.location.trim();
    if (data.descriptionFr !== undefined) updates.descriptionFr = data.descriptionFr.trim();
    if (data.descriptionAr !== undefined) updates.descriptionAr = data.descriptionAr?.trim() || null;
    if (data.descriptionEn !== undefined) updates.descriptionEn = data.descriptionEn?.trim() || null;
    if (data.missions !== undefined) updates.missions = data.missions.filter((m) => Boolean(m.trim()));
    if (data.requirements !== undefined) updates.requirements = data.requirements.filter((r) => Boolean(r.trim()));
    if (data.salaryMin !== undefined) updates.salaryMin = data.salaryMin;
    if (data.salaryMax !== undefined) updates.salaryMax = data.salaryMax;
    if (data.salaryType !== undefined) updates.salaryType = data.salaryType;
    if (data.closingDate !== undefined) updates.closingDate = data.closingDate ? new Date(data.closingDate) : null;

    if (data.status !== undefined) {
      updates.status = data.status;
      if (data.status === "PUBLIEE" && !existing.publishedAt) {
        updates.publishedAt = new Date();
      }
    }

    if (data.slug && data.slug !== existing.slug) {
      const cleanSlug = data.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "-");
      const clash = await prisma.jobPosting.findUnique({ where: { slug: cleanSlug } });
      if (clash && clash.id !== id) {
        return { success: false, error: "Ce slug est déjà utilisé par une autre offre." };
      }
      updates.slug = cleanSlug;
    }

    const updated = await prisma.jobPosting.update({
      where: { id },
      data: updates,
    });

    revalidatePath("/[locale]/carrieres", "page");
    revalidatePath("/admin/recrutement/offres", "page");

    return { success: true, job: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    console.error("❌ [updateJobPostingAction] Erreur :", error);
    return { success: false, error: error.message };
  }
}

/**
 * Suppression sécurisée d'une offre (ou archivage si candidatures existantes)
 */
export async function deleteJobPostingAction(id: string) {
  try {
    await checkAdminAuth();

    const job = await prisma.jobPosting.findUnique({
      where: { id },
      include: { _count: { select: { applications: true } } },
    });

    if (!job) {
      return { success: false, error: "Offre introuvable." };
    }

    // S'il existe des candidatures, on archive au lieu de supprimer brutalement
    if (job._count.applications > 0) {
      await prisma.jobPosting.update({
        where: { id },
        data: { status: "ARCHIVEE" },
      });
      revalidatePath("/admin/recrutement/offres", "page");
      return { 
        success: true, 
        message: "L'offre contenait des candidatures associées et a été archivée en toute sécurité." 
      };
    }

    await prisma.jobPosting.delete({ where: { id } });
    revalidatePath("/admin/recrutement/offres", "page");

    return { success: true, message: "Offre supprimée avec succès." };
  } catch (error: any) {
    console.error("❌ [deleteJobPostingAction] Erreur :", error);
    return { success: false, error: error.message };
  }
}

/**
 * Récupération globale des candidatures pour l'administration
 */
export async function getAdminJobApplicationsAction(filters?: {
  jobPostingId?: string;
  status?: string;
  search?: string;
}) {
  try {
    await checkAdminAuth();

    const where: any = {};
    if (filters?.jobPostingId && filters.jobPostingId !== "ALL") {
      where.jobPostingId = filters.jobPostingId;
    }
    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status as ApplicationStatus;
    }
    if (filters?.search) {
      const q = filters.search.trim();
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { city: { contains: q, mode: "insensitive" } },
      ];
    }

    const applications = await prisma.jobApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        jobPosting: {
          select: {
            id: true,
            title: true,
            role: true,
            department: true,
            employmentType: true,
          },
        },
      },
    });

    // Statistiques par statut
    const countsByStatus = await prisma.jobApplication.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    const statusCounts: Record<string, number> = {
      NOUVELLE: 0,
      EN_EXAMEN: 0,
      ENTRETIEN_PROGRAMME: 0,
      ACCEPTEE: 0,
      REFUSEE: 0,
      ARCHIVEE: 0,
    };

    countsByStatus.forEach((c: any) => {
      statusCounts[c.status] = c._count._all;
    });

    return {
      success: true,
      applications: JSON.parse(JSON.stringify(applications)),
      statusCounts,
    };
  } catch (error: any) {
    console.error("❌ [getAdminJobApplicationsAction] Erreur :", error);
    return { success: false, applications: [], statusCounts: {}, error: error.message };
  }
}

/**
 * Mise à jour du statut d'une candidature
 */
export async function updateJobApplicationStatusAction(
  id: string, 
  newStatus: ApplicationStatus
) {
  try {
    await checkAdminAuth();

    const application = await prisma.jobApplication.update({
      where: { id },
      data: { status: newStatus },
      select: { id: true, status: true, fullName: true },
    });

    revalidatePath("/admin/recrutement/candidatures", "page");
    return { success: true, application };
  } catch (error: any) {
    console.error("❌ [updateJobApplicationStatusAction] Erreur :", error);
    return { success: false, error: error.message };
  }
}

/**
 * Mise à jour des notes internes et de la notation (score 1-5)
 */
export async function updateJobApplicationNotesAndScoreAction(
  id: string,
  data: { internalNotes?: string; ratedScore?: number | null }
) {
  try {
    await checkAdminAuth();

    const application = await prisma.jobApplication.update({
      where: { id },
      data: {
        internalNotes: data.internalNotes !== undefined ? data.internalNotes.trim() : undefined,
        ratedScore: data.ratedScore !== undefined ? data.ratedScore : undefined,
      },
    });

    revalidatePath("/admin/recrutement/candidatures", "page");
    return { success: true, application: JSON.parse(JSON.stringify(application)) };
  } catch (error: any) {
    console.error("❌ [updateJobApplicationNotesAndScoreAction] Erreur :", error);
    return { success: false, error: error.message };
  }
}

/**
 * Génère une URL signée temporaire (15 minutes) pour télécharger ou consulter le CV
 * Reste inaccessible publiquement
 */
export async function getSignedCvUrlAction(applicationId: string) {
  try {
    await checkAdminAuth();

    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      select: { cvFileUrl: true, cvFileName: true, fullName: true },
    });

    if (!application || !application.cvFileUrl) {
      return { success: false, error: "Candidature ou CV introuvable." };
    }

    const signedUrl = await getPresignedCvDownloadUrl(
      application.cvFileUrl,
      900, // 15 minutes
      `${application.fullName.replace(/\s+/g, "-")}-${application.cvFileName}`
    );

    return { success: true, signedUrl };
  } catch (error: any) {
    console.error("❌ [getSignedCvUrlAction] Erreur :", error);
    return { success: false, error: error.message };
  }
}

/**
 * Suppression physique d'une candidature et de son CV sur Cloudflare R2
 */
export async function deleteJobApplicationAction(applicationId: string) {
  try {
    await checkAdminAuth();

    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      select: { id: true, cvFileUrl: true },
    });

    if (!application) {
      return { success: false, error: "Candidature introuvable." };
    }

    // Suppression physique sur R2
    if (application.cvFileUrl) {
      await deleteCvFromR2(application.cvFileUrl).catch((err) => {
        console.warn("Avertissement suppression R2 :", err);
      });
    }

    await prisma.jobApplication.delete({ where: { id: applicationId } });

    revalidatePath("/admin/recrutement/candidatures", "page");
    return { success: true, message: "Candidature et document supprimés définitivement." };
  } catch (error: any) {
    console.error("❌ [deleteJobApplicationAction] Erreur :", error);
    return { success: false, error: error.message };
  }
}

/**
 * Conversion d'une candidature acceptée en membre d'équipe (TeamMember)
 * Évite la ressaisie manuelle et associe les droits initiaux
 */
export async function convertApplicationToTeamMemberAction({
  applicationId,
  targetRole,
  notes,
}: {
  applicationId: string;
  targetRole: TeamRole;
  notes?: string;
}) {
  try {
    await checkAdminAuth();

    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: { jobPosting: true },
    });

    if (!application) {
      return { success: false, error: "Candidature introuvable." };
    }

    // Vérifier si un membre existe déjà avec le même téléphone ou email
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        OR: [
          { phone: application.phone },
          ...(application.email ? [{ email: application.email }] : []),
        ],
      },
    });

    if (existingMember) {
      return { 
        success: false, 
        error: `Un membre d'équipe avec ce numéro (${application.phone}) ou cet email existe déjà : ${existingMember.fullName}.` 
      };
    }

    // Définir les permissions adaptées au rôle
    const canScanTickets = ["SUPER_ADMIN", "TOUR_LEADER", "OFFICIAL_GUIDE"].includes(targetRole);
    const canViewManifest = ["SUPER_ADMIN", "ORGANIZER", "TOUR_LEADER", "OFFICIAL_GUIDE"].includes(targetRole);
    const canCollectCash = ["SUPER_ADMIN", "TOUR_LEADER"].includes(targetRole);
    const canEditTrips = ["SUPER_ADMIN", "ORGANIZER"].includes(targetRole);

    const mergedNotes = [
      `Recruté via l'offre : ${application.jobPosting.title}`,
      application.city ? `Ville : ${application.city}` : null,
      application.availability ? `Disponibilité : ${application.availability}` : null,
      notes ? `Note RH : ${notes}` : null,
    ].filter(Boolean).join(" | ");

    // Création du membre d'équipe et mise à jour de la candidature en transaction
    const [teamMember] = await prisma.$transaction([
      prisma.teamMember.create({
        data: {
          fullName: application.fullName,
          email: application.email,
          phone: application.phone,
          role: targetRole,
          notes: mergedNotes,
          canScanTickets,
          canViewManifest,
          canCollectCash,
          canEditTrips,
          isActive: true,
        },
      }),
      prisma.jobApplication.update({
        where: { id: applicationId },
        data: {
          status: "ACCEPTEE",
          internalNotes: `${application.internalNotes ? `${application.internalNotes}\n` : ""}[${new Date().toLocaleDateString("fr-FR")}] Converti en membre d'équipe (${targetRole}).`,
        },
      }),
    ]);

    revalidatePath("/admin/team", "page");
    revalidatePath("/admin/recrutement/candidatures", "page");

    return {
      success: true,
      teamMember: JSON.parse(JSON.stringify(teamMember)),
      message: `${application.fullName} a été converti avec succès en membre d'équipe (${targetRole}).`,
    };
  } catch (error: any) {
    console.error("❌ [convertApplicationToTeamMemberAction] Erreur :", error);
    return { success: false, error: error.message || "Erreur lors de la conversion du candidat." };
  }
}
