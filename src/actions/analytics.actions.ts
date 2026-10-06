"use server";

import { prisma } from "@/lib/prisma";

export interface AnalyticsData {
  overview: {
    totalRevenue: number;         // Chiffre d'affaires total (réservations confirmées) en MAD
    totalDeposits: number;        // Acomptes encaissés en MAD
    totalBookings: number;        // Nombre total de réservations (leads + confirmés)
    confirmedBookings: number;    // Réservations confirmées
    conversionRate: number;       // Taux de confirmation téléphonique (%)
    averageCart: number;          // Panier moyen en MAD
  };
  trafficSources: Array<{
    source: string;               // "Meta Ads (Facebook / Instagram)", "TikTok Ads", "Snapchat Ads", "Google Ads (Search)", "WhatsApp Direct", "Direct / Organique"
    leadsCount: number;
    bookingsCount: number;
    conversionRate: number;
    estimatedRevenue: number;
    pixelConfigured?: boolean;    // Indique si le Pixel est actif dans Paramètres Généraux
    pixelId?: string | null;      // ID du pixel configuré
  }>;
  topTrips: Array<{
    id: string;
    title: string;
    bookingsCount: number;
    revenue: number;
    fillRate: number;             // Taux d'occupation réel calculé (%)
  }>;
  teamPerformance: {
    confirmationAgents: Array<{
      name: string;
      callsHandled: number;
      confirmedCount: number;
      rate: number;
      revenueMAD?: number;
    }>;
  };
  recentTrend: Array<{
    date: string;
    bookings: number;
    revenue: number;
  }>;
}

const KNOWN_CONFIRMED_STATUSES = new Set([
  "DEPOSIT_PAID",
  "FULLY_PAID",
  "DEPOSIT_CONFIRMED",
  "CONFIRMEE",
  "CONFIRMED",
  "PAID",
]);

export async function getAnalyticsMetrics(period: "7d" | "30d" | "month" | "all" = "30d"): Promise<AnalyticsData> {
  const now = new Date();
  let startDate = new Date();

  if (period === "7d") {
    startDate.setDate(now.getDate() - 7);
  } else if (period === "30d") {
    startDate.setDate(now.getDate() - 30);
  } else if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    startDate = new Date(2025, 0, 1);
  }

  // 1. Récupération des réservations réelles sur la période
  const bookings = await prisma.booking.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    include: {
      trip: true,
      departureDate: true,
      travelers: true,
      confirmedByMember: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const isConfirmed = (b: any) => KNOWN_CONFIRMED_STATUSES.has(b.status);

  const totalBookings = bookings.length;
  const confirmed = bookings.filter(isConfirmed);

  const getPrice = (b: any) => {
    if (b.totalAmount !== undefined && b.totalAmount !== null) return Number(b.totalAmount);
    if (b.totalPrice !== undefined && b.totalPrice !== null) return Number(b.totalPrice);
    return 0;
  };

  const getDeposit = (b: any) => {
    if (b.depositPaid !== undefined && Number(b.depositPaid) > 0) return Number(b.depositPaid);
    if (b.depositAmount !== undefined && b.depositAmount !== null) return Number(b.depositAmount);
    return 0;
  };

  const totalRevenue = confirmed.reduce((acc, b) => acc + getPrice(b), 0);
  const totalDeposits = confirmed.reduce((acc, b) => acc + getDeposit(b), 0);
  const conversionRate = totalBookings > 0 ? (confirmed.length / totalBookings) * 100 : 0;
  const averageCart = confirmed.length > 0 ? totalRevenue / confirmed.length : 0;

  // 2. Répartition réelle par canal d'acquisition (source / utmSource) & statut des Pixels
  const db = prisma as any;
  const settings = await db.generalSettings.findUnique({
    where: { id: "default" },
  });

  const defaultChannels = [
    "Meta Ads (Facebook / Instagram)",
    "TikTok Ads",
    "Snapchat Ads",
    "Google Ads (Search)",
    "WhatsApp Direct",
    "Direct / Organique",
  ];

  const sourceMap = new Map<string, { leads: number; confirmed: number; rev: number }>();
  defaultChannels.forEach((chan) => sourceMap.set(chan, { leads: 0, confirmed: 0, rev: 0 }));

  bookings.forEach((b) => {
    const rawSource = ((b as any).source || (b as any).utmSource || "").trim();
    let sourceKey = "Direct / Organique";

    if (rawSource) {
      const lower = rawSource.toLowerCase();
      if (lower.includes("meta") || lower.includes("facebook") || lower.includes("fb") || lower.includes("instagram") || lower.includes("ig")) {
        sourceKey = "Meta Ads (Facebook / Instagram)";
      } else if (lower.includes("tiktok")) {
        sourceKey = "TikTok Ads";
      } else if (lower.includes("snapchat") || lower.includes("snap") || lower === "scclid") {
        sourceKey = "Snapchat Ads";
      } else if (lower.includes("google") || lower.includes("adwords") || lower === "gclid") {
        sourceKey = "Google Ads (Search)";
      } else if (lower.includes("whatsapp") || lower.includes("wa")) {
        sourceKey = "WhatsApp Direct";
      } else if (lower.includes("direct") || lower.includes("organ") || lower.includes("web_form")) {
        sourceKey = "Direct / Organique";
      } else {
        sourceKey = rawSource;
      }
    }

    if (!sourceMap.has(sourceKey)) {
      sourceMap.set(sourceKey, { leads: 0, confirmed: 0, rev: 0 });
    }
    const current = sourceMap.get(sourceKey)!;
    current.leads += 1;
    if (isConfirmed(b)) {
      current.confirmed += 1;
      current.rev += getPrice(b);
    }
  });

  const getPixelStatus = (sourceName: string) => {
    if (sourceName.includes("Meta")) {
      return {
        configured: Boolean(settings?.facebookPixelId),
        id: settings?.facebookPixelId || null,
      };
    }
    if (sourceName.includes("TikTok")) {
      return {
        configured: Boolean(settings?.tiktokPixelId),
        id: settings?.tiktokPixelId || null,
      };
    }
    if (sourceName.includes("Snapchat")) {
      return {
        configured: Boolean(settings?.snapchatPixelId),
        id: settings?.snapchatPixelId || null,
      };
    }
    if (sourceName.includes("Google")) {
      return {
        configured: Boolean(settings?.googleAdsId || settings?.googleAnalyticsId),
        id: settings?.googleAdsId || settings?.googleAnalyticsId || null,
      };
    }
    return { configured: true, id: null };
  };

  const trafficSources = Array.from(sourceMap.entries()).map(([source, data]) => {
    const pixelInfo = getPixelStatus(source);
    return {
      source,
      leadsCount: data.leads,
      bookingsCount: data.confirmed,
      conversionRate: data.leads > 0 ? Number(((data.confirmed / data.leads) * 100).toFixed(1)) : 0,
      estimatedRevenue: data.rev,
      pixelConfigured: pixelInfo.configured,
      pixelId: pixelInfo.id,
    };
  });

  // 3. Top circuits avec taux de remplissage réel calculé
  const tripMap = new Map<string, { 
    id: string; 
    title: string; 
    count: number; 
    rev: number; 
    totalSeats: number; 
    bookedPassengers: number; 
  }>();

  confirmed.forEach((b) => {
    const tripId = b.tripId || b.trip?.id || "circuit-default";
    const title = b.trip?.titleFr || b.trip?.titleAr || "Circuit";
    const seats = Number(b.trip?.totalSeats || 0);
    const passCount = Array.isArray((b as any).travelers) && (b as any).travelers.length > 0 
      ? (b as any).travelers.length 
      : 1;

    if (!tripMap.has(tripId)) {
      tripMap.set(tripId, { 
        id: tripId, 
        title, 
        count: 0, 
        rev: 0, 
        totalSeats: seats, 
        bookedPassengers: 0 
      });
    }
    const t = tripMap.get(tripId)!;
    t.count += 1;
    t.rev += getPrice(b);
    t.bookedPassengers += passCount;
  });

  const topTrips = Array.from(tripMap.values())
    .map((t) => {
      const fillRate = t.totalSeats > 0 
        ? Math.min(100, Math.round((t.bookedPassengers / t.totalSeats) * 100))
        : 0;

      return {
        id: t.id,
        title: t.title,
        bookingsCount: t.count,
        revenue: t.rev,
        fillRate,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // 4. Performance réelle de l'équipe de confirmation téléphonique
  let confirmationAgents: Array<{
    name: string;
    callsHandled: number;
    confirmedCount: number;
    rate: number;
    revenueMAD?: number;
  }> = [];

  try {
    // Récupérer les membres de l'équipe ayant le rôle CONFIRMATION_AGENT ou ayant déjà validé des réservations
    const teamAgents = await prisma.teamMember.findMany({
      where: {
        isActive: true,
        OR: [
          { role: "CONFIRMATION_AGENT" },
          { confirmedBookings: { some: {} } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        role: true,
        confirmedBookings: {
          where: {
            createdAt: { gte: startDate },
          },
          select: {
            id: true,
            status: true,
            totalAmount: true,
            depositPaid: true,
            amountPaid: true,
            contactedAt: true,
          },
        },
      },
      orderBy: { fullName: "asc" },
    });

    confirmationAgents = teamAgents.map((agent) => {
      const agentBookings = agent.confirmedBookings || [];
      const confirmedList = agentBookings.filter(isConfirmed);
      const confirmedCount = confirmedList.length;
      const callsHandled = agentBookings.length;
      const rate = callsHandled > 0 ? Number(((confirmedCount / callsHandled) * 100).toFixed(1)) : 0;
      const revenueMAD = confirmedList.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

      return {
        name: agent.fullName,
        callsHandled,
        confirmedCount,
        rate,
        revenueMAD,
      };
    });

    // Trier par nombre de dossiers confirmés en premier
    confirmationAgents.sort((a, b) => b.confirmedCount - a.confirmedCount);
  } catch (err) {
    console.error("Erreur lors de la récupération des agents de confirmation:", err);
    confirmationAgents = [];
  }

  // 5. Tendance temporelle réelle (timeline)
  const trendMap = new Map<string, { bookings: number; revenue: number }>();
  
  const dayCount = period === "7d" ? 7 : period === "30d" ? 14 : period === "month" ? 15 : 10;
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateLabel = d.toLocaleDateString("fr-MA", { day: "2-digit", month: "short" });
    trendMap.set(dateLabel, { bookings: 0, revenue: 0 });
  }

  bookings.forEach((b) => {
    const bDate = new Date(b.createdAt);
    const dateLabel = bDate.toLocaleDateString("fr-MA", { day: "2-digit", month: "short" });
    if (trendMap.has(dateLabel)) {
      const cur = trendMap.get(dateLabel)!;
      cur.bookings += 1;
      if (isConfirmed(b)) {
        cur.revenue += getPrice(b);
      }
    }
  });

  const recentTrend = Array.from(trendMap.entries()).map(([date, val]) => ({
    date,
    bookings: val.bookings,
    revenue: val.revenue,
  }));

  return {
    overview: {
      totalRevenue,
      totalDeposits,
      totalBookings,
      confirmedBookings: confirmed.length,
      conversionRate: Number(conversionRate.toFixed(1)),
      averageCart: Math.round(averageCart),
    },
    trafficSources,
    topTrips,
    teamPerformance: {
      confirmationAgents,
    },
    recentTrend,
  };
}
