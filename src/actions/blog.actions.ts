'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Interface BlogPost découplée pour garantir une compatibilité TypeScript parfaite
 * avec l'IDE et les composants du Blog.
 */
export interface BlogPost {
  id: string;
  slug: string;
  titleFr: string;
  titleAr?: string | null;
  titleEn?: string | null;
  excerptFr?: string | null;
  excerptAr?: string | null;
  excerptEn?: string | null;
  contentFr: string;
  contentAr?: string | null;
  contentEn?: string | null;
  coverImage?: string | null;
  youtubeUrl?: string | null;
  category: string;
  authorName: string;
  isPublished: boolean;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Instance typée pour garantir l'absence d'erreurs de cache TypeScript de l'IDE
const db = prisma as any;

export interface CreateBlogPostInput {
  titleFr: string;
  titleAr?: string;
  titleEn?: string;
  slug?: string;
  excerptFr?: string;
  excerptAr?: string;
  excerptEn?: string;
  contentFr: string;
  contentAr?: string;
  contentEn?: string;
  coverImage?: string;
  youtubeUrl?: string;
  category?: string;
  authorName?: string;
  isPublished?: boolean;
}

export interface UpdateBlogPostInput {
  titleFr?: string;
  titleAr?: string;
  titleEn?: string;
  slug?: string;
  excerptFr?: string;
  excerptAr?: string;
  excerptEn?: string;
  contentFr?: string;
  contentAr?: string;
  contentEn?: string;
  coverImage?: string;
  youtubeUrl?: string;
  category?: string;
  authorName?: string;
  isPublished?: boolean;
}

/**
 * Génère un slug URL propre et unique à partir d'un titre
 */
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9 -]/g, '')     // Supprime caractères non-alphanumériques
    .replace(/\s+/g, '-')            // Remplace espaces par des tirets
    .replace(/-+/g, '-')             // Supprime les tirets consécutifs
    .replace(/^-+|-+$/g, '');        // Supprime tirets début/fin
}

/**
 * Récupère la liste des articles avec pagination et filtres
 */
export async function getBlogPostsAction(params?: {
  category?: string;
  search?: string;
  isPublished?: boolean;
  page?: number;
  limit?: number;
}) {
  try {
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 12);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params?.isPublished !== undefined) {
      where.isPublished = params.isPublished;
    }

    if (params?.category && params.category !== 'all' && params.category !== 'Toutes') {
      where.category = params.category;
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { titleFr: { contains: q, mode: 'insensitive' } },
        { titleAr: { contains: q, mode: 'insensitive' } },
        { titleEn: { contains: q, mode: 'insensitive' } },
        { excerptFr: { contains: q, mode: 'insensitive' } },
        { excerptEn: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [posts, total, categoriesCount] = await Promise.all([
      db.blogPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.blogPost.count({ where }),
      db.blogPost.groupBy({
        by: ['category'],
        where: params?.isPublished !== undefined ? { isPublished: params.isPublished } : {},
        _count: true,
      }),
    ]);

    const categories = (categoriesCount as any[]).map((c: any) => ({
      name: c.category,
      count: c._count,
    }));

    return {
      success: true,
      posts: posts as BlogPost[],
      total: Number(total),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      categories,
    };
  } catch (error: any) {
    console.error('❌ [getBlogPostsAction] Erreur:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la récupération des articles.',
      posts: [] as BlogPost[],
      total: 0,
      totalPages: 0,
      currentPage: 1,
      categories: [],
    };
  }
}

/**
 * Récupère un article par son slug (et incrémente les vues)
 */
export async function getBlogPostBySlugAction(slug: string, incrementViews = false) {
  try {
    const post = await db.blogPost.findUnique({
      where: { slug },
    });

    if (!post) {
      return { success: false, error: 'Article introuvable.', post: null, relatedPosts: [] };
    }

    // Incrémente le compteur de vues réelles
    if (incrementViews && post.isPublished) {
      db.blogPost
        .update({
          where: { id: post.id },
          data: { viewsCount: { increment: 1 } },
        })
        .catch((err: any) => console.error('Erreur incrément vues article:', err));
    }

    // Articles similaires dans la même catégorie
    const relatedPosts = await db.blogPost.findMany({
      where: {
        isPublished: true,
        id: { not: post.id },
        category: post.category,
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      post: post as BlogPost,
      relatedPosts: relatedPosts as BlogPost[],
    };
  } catch (error: any) {
    console.error('❌ [getBlogPostBySlugAction] Erreur:', error);
    return {
      success: false,
      error: error.message || "Erreur lors de l'accès à l'article.",
      post: null,
      relatedPosts: [],
    };
  }
}

/**
 * Récupère un article par ID pour l'administration
 */
export async function getBlogPostByIdAction(id: string) {
  try {
    const post = await db.blogPost.findUnique({
      where: { id },
    });

    if (!post) {
      return { success: false, error: 'Article introuvable.', post: null };
    }

    return { success: true, post: post as BlogPost };
  } catch (error: any) {
    console.error('❌ [getBlogPostByIdAction] Erreur:', error);
    return { success: false, error: error.message, post: null };
  }
}

/**
 * Crée un nouvel article de blog
 */
export async function createBlogPostAction(data: CreateBlogPostInput) {
  try {
    if (!data.titleFr || !data.titleFr.trim()) {
      return { success: false, error: 'Le titre en français est requis.' };
    }
    if (!data.contentFr || !data.contentFr.trim()) {
      return { success: false, error: 'Le contenu de l’article est requis.' };
    }

    // Génération ou validation du slug
    let baseSlug = data.slug?.trim() ? slugify(data.slug) : slugify(data.titleFr);
    if (!baseSlug) baseSlug = 'article-' + Date.now();

    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await db.blogPost.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const post = await db.blogPost.create({
      data: {
        titleFr: data.titleFr.trim(),
        titleAr: data.titleAr?.trim() || null,
        titleEn: data.titleEn?.trim() || null,
        slug: uniqueSlug,
        excerptFr: data.excerptFr?.trim() || null,
        excerptAr: data.excerptAr?.trim() || null,
        excerptEn: data.excerptEn?.trim() || null,
        contentFr: data.contentFr,
        contentAr: data.contentAr || null,
        contentEn: data.contentEn || null,
        coverImage: data.coverImage?.trim() || null,
        youtubeUrl: data.youtubeUrl?.trim() || null,
        category: data.category?.trim() || 'Conseils & Guides',
        authorName: data.authorName?.trim() || 'Équipe Rahalat Bladna',
        isPublished: Boolean(data.isPublished),
      },
    });

    revalidatePath('/blog');
    revalidatePath('/admin/blog');

    return { success: true, post: post as BlogPost };
  } catch (error: any) {
    console.error('❌ [createBlogPostAction] Erreur:', error);
    return { success: false, error: error.message || 'Impossible de créer l’article.' };
  }
}

/**
 * Met à jour un article de blog existant
 */
export async function updateBlogPostAction(id: string, data: UpdateBlogPostInput) {
  try {
    const existing = await db.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Article inexistant.' };
    }

    const updateData: any = {};

    if (data.titleFr !== undefined) updateData.titleFr = data.titleFr.trim();
    if (data.titleAr !== undefined) updateData.titleAr = data.titleAr?.trim() || null;
    if (data.titleEn !== undefined) updateData.titleEn = data.titleEn?.trim() || null;
    if (data.excerptFr !== undefined) updateData.excerptFr = data.excerptFr?.trim() || null;
    if (data.excerptAr !== undefined) updateData.excerptAr = data.excerptAr?.trim() || null;
    if (data.excerptEn !== undefined) updateData.excerptEn = data.excerptEn?.trim() || null;
    if (data.contentFr !== undefined) updateData.contentFr = data.contentFr;
    if (data.contentAr !== undefined) updateData.contentAr = data.contentAr || null;
    if (data.contentEn !== undefined) updateData.contentEn = data.contentEn || null;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage?.trim() || null;
    if (data.youtubeUrl !== undefined) updateData.youtubeUrl = data.youtubeUrl?.trim() || null;
    if (data.category !== undefined) updateData.category = data.category?.trim() || 'Conseils & Guides';
    if (data.authorName !== undefined) updateData.authorName = data.authorName?.trim() || 'Équipe Rahalat Bladna';
    if (data.isPublished !== undefined) updateData.isPublished = Boolean(data.isPublished);

    if (data.slug !== undefined && data.slug.trim()) {
      const cleanSlug = slugify(data.slug);
      if (cleanSlug !== existing.slug) {
        // Vérifier unicité
        const conflict = await db.blogPost.findUnique({ where: { slug: cleanSlug } });
        if (conflict && conflict.id !== id) {
          return { success: false, error: 'Ce slug URL est déjà utilisé par un autre article.' };
        }
        updateData.slug = cleanSlug;
      }
    }

    const post = await db.blogPost.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/blog');
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath('/admin/blog');

    return { success: true, post: post as BlogPost };
  } catch (error: any) {
    console.error('❌ [updateBlogPostAction] Erreur:', error);
    return { success: false, error: error.message || 'Impossible de mettre à jour l’article.' };
  }
}

/**
 * Supprime un article
 */
export async function deleteBlogPostAction(id: string) {
  try {
    const post = await db.blogPost.delete({
      where: { id },
    });

    revalidatePath('/blog');
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath('/admin/blog');

    return { success: true };
  } catch (error: any) {
    console.error('❌ [deleteBlogPostAction] Erreur:', error);
    return { success: false, error: error.message || 'Impossible de supprimer l’article.' };
  }
}

/**
 * Publie ou dépublie un article
 */
export async function togglePublishBlogPostAction(id: string) {
  try {
    const existing = await db.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Article inexistant.' };
    }

    const post = await db.blogPost.update({
      where: { id },
      data: { isPublished: !existing.isPublished },
    });

    revalidatePath('/blog');
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath('/admin/blog');

    return { success: true, isPublished: post.isPublished };
  } catch (error: any) {
    console.error('❌ [togglePublishBlogPostAction] Erreur:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Statistiques du blog pour le tableau de bord admin
 */
export async function getAdminBlogStatsAction() {
  try {
    const [totalPosts, publishedPosts, draftsPosts, totalViewsResult] = await Promise.all([
      db.blogPost.count(),
      db.blogPost.count({ where: { isPublished: true } }),
      db.blogPost.count({ where: { isPublished: false } }),
      db.blogPost.aggregate({
        _sum: { viewsCount: true },
      }),
    ]);

    return {
      success: true,
      totalPosts,
      publishedPosts,
      draftsPosts,
      totalViews: totalViewsResult._sum?.viewsCount || 0,
    };
  } catch (error: any) {
    console.error('❌ [getAdminBlogStatsAction] Erreur:', error);
    return {
      success: false,
      totalPosts: 0,
      publishedPosts: 0,
      draftsPosts: 0,
      totalViews: 0,
    };
  }
}
