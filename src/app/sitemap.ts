import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.rahalatbladna.ma';

  try {
    // 1. Récupérer tous les circuits actifs en base
    const trips = await prisma.trip.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    // Récupérer les offres d'emploi publiées
    const jobs = await prisma.jobPosting.findMany({
      where: { status: "PUBLIEE" },
      select: { slug: true, updatedAt: true },
    });

    // 2. Pages statiques principales (bilingues FR & AR)
    const staticRoutes = ['', '/trips', '/about', '/contact', '/b2b', '/carrieres'].flatMap((route) => [
      {
        url: `${baseUrl}/fr${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1.0 : (route === '/carrieres' ? 0.7 : 0.8),
      },
      {
        url: `${baseUrl}/ar${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1.0 : (route === '/carrieres' ? 0.7 : 0.8),
      },
    ]);

    // 3. Pages dynamiques de chaque circuit
    const tripRoutes = trips.flatMap((trip) => [
      {
        url: `${baseUrl}/fr/trips/${trip.slug}`,
        lastModified: trip.updatedAt,
        changeFrequency: 'daily' as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/ar/trips/${trip.slug}`,
        lastModified: trip.updatedAt,
        changeFrequency: 'daily' as const,
        priority: 0.9,
      },
    ]);

    // 4. Pages dynamiques de chaque offre d'emploi
    const jobRoutes = jobs.flatMap((job) => [
      {
        url: `${baseUrl}/fr/carrieres/${job.slug}`,
        lastModified: job.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/ar/carrieres/${job.slug}`,
        lastModified: job.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
    ]);

    return [...staticRoutes, ...tripRoutes, ...jobRoutes];
  } catch (error) {
    console.error('❌ [sitemap] Erreur lors de la génération du sitemap :', error);
    // Repli de secours
    return [
      {
        url: `${baseUrl}/fr`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 1.0,
      },
      {
        url: `${baseUrl}/ar`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 1.0,
      },
      {
        url: `${baseUrl}/fr/trips`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/ar/trips`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
    ];
  }
}
