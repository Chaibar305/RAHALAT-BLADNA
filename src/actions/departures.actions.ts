'use server';

import { prisma } from '@/lib/prisma';

export interface DepartureDateItem {
  dateKey: string;          // "2026-09-25"
  dayNum: string;           // "25"
  monthShort: string;       // "Sep"
  dayOfWeek: string;        // "vendredi"
  monthYearGroup: string;   // "septembre 2026"
  destinationsCount: number;
  dayOfWeekAr?: string;
  monthShortAr?: string;
  monthYearGroupAr?: string;
}

/**
 * Récupère les dates de départ disponibles et actives depuis la base de données PostgreSQL,
 * filtrées à partir d'aujourd'hui, agrégées par date calendaire unique et groupées par mois/année.
 */
export async function getAvailableDepartureDates(): Promise<Record<string, DepartureDateItem[]>> {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Inclure les départs du jour même

    // Interrogation de la table DepartureDate dans Prisma
    const departures = await prisma.departureDate.findMany({
      where: {
        startDate: { gte: now },
        status: { in: ['OPEN_FOR_BOOKING', 'GUARANTEED', 'ALMOST_FULL'] },
        trip: { 
          isActive: true,
          publishStatus: 'PUBLISHED',
        },
      },
      select: {
        id: true,
        startDate: true,
        tripId: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    // Agrégation par date calendaire unique (YYYY-MM-DD)
    const dateMap = new Map<string, { date: Date; tripIds: Set<string> }>();

    departures.forEach((dep) => {
      const year = dep.startDate.getUTCFullYear();
      const month = String(dep.startDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(dep.startDate.getUTCDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: dep.startDate, tripIds: new Set() });
      }
      dateMap.get(dateKey)!.tripIds.add(dep.tripId);
    });

    const grouped: Record<string, DepartureDateItem[]> = {};

    dateMap.forEach(({ date, tripIds }, dateKey) => {
      // Formatage en Français
      const monthYearGroup = date.toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      });

      const dayOfWeek = date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        timeZone: 'UTC' 
      });
      const dayNum = date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        timeZone: 'UTC' 
      });
      const rawMonth = date.toLocaleDateString('fr-FR', { 
        month: 'short', 
        timeZone: 'UTC' 
      });
      const monthShort = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1).replace('.', '');

      // Formatage en Arabe pour le support RTL
      const monthYearGroupAr = date.toLocaleDateString('ar-MA', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      });
      const dayOfWeekAr = date.toLocaleDateString('ar-MA', { 
        weekday: 'long', 
        timeZone: 'UTC' 
      });
      const monthShortAr = date.toLocaleDateString('ar-MA', { 
        month: 'short', 
        timeZone: 'UTC' 
      });

      const item: DepartureDateItem = {
        dateKey,
        dayNum,
        monthShort,
        dayOfWeek,
        monthYearGroup,
        destinationsCount: tripIds.size,
        dayOfWeekAr,
        monthShortAr,
        monthYearGroupAr,
      };

      if (!grouped[monthYearGroup]) {
        grouped[monthYearGroup] = [];
      }
      grouped[monthYearGroup].push(item);
    });

    return grouped;
  } catch (error) {
    console.error('❌ [getAvailableDepartureDates] Erreur récupération départs:', error);
    return {};
  }
}
