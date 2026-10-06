'use server';

import { prisma } from '@/lib/prisma';

const db = prisma as any;

export interface HomeCollectionItem {
  id: string;
  slug: string;
  scope: 'NATIONAL' | 'INTERNATIONAL';
  nameFr: string;
  nameAr: string | null;
  nameEn: string | null;
  descriptionFr: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  coverImage: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    trips: number;
  };
}

/**
 * Récupère les collections actives pour l'affichage vitrine sur la page d'accueil
 */
export async function getActiveCollectionsForHome(): Promise<HomeCollectionItem[]> {
  try {
    const collections = await db.tripCollection.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
      include: {
        _count: {
          select: {
            trips: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return JSON.parse(JSON.stringify(collections)) as HomeCollectionItem[];
  } catch (error) {
    console.error('Erreur getActiveCollectionsForHome:', error);
    return [];
  }
}
