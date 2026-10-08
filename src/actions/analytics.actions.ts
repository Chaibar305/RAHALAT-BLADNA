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

// ====================================================
// NATIVE WEB ANALYTICS & VISITOR EVENTS (VERCEL STYLE)
// ====================================================

export interface WebAnalyticsSummary {
  period: "24h" | "7d" | "30d" | "all";
  overview: {
    uniqueVisitors: number;
    totalPageViews: number;
    bounceRate: number; // en %
    liveVisitors: number; // 15 dernières minutes
    avgViewsPerSession: number;
  };
  timeline: Array<{
    date: string;
    views: number;
    visitors: number;
  }>;
  topPages: Array<{
    path: string;
    views: number;
    percentage: number;
  }>;
  topReferrers: Array<{
    host: string;
    views: number;
    percentage: number;
  }>;
  countries: Array<{
    code: string;
    name: string;
    flag: string;
    views: number;
    percentage: number;
  }>;
  devices: Array<{
    device: string;
    views: number;
    percentage: number;
  }>;
  osList: Array<{
    name: string;
    views: number;
    percentage: number;
  }>;
  browsers: Array<{
    name: string;
    views: number;
    percentage: number;
  }>;
  events: Array<{
    eventName: string;
    count: number;
    lastTriggered: string;
  }>;
}

const COUNTRY_LOOKUP: Record<string, { name: string; flag: string }> = {
  MA: { name: "Maroc", flag: "🇲🇦" },
  FR: { name: "France", flag: "🇫🇷" },
  ES: { name: "Espagne", flag: "🇪🇸" },
  BE: { name: "Belgique", flag: "🇧🇪" },
  DE: { name: "Allemagne", flag: "🇩🇪" },
  US: { name: "États-Unis", flag: "🇺🇸" },
  GB: { name: "Royaume-Uni", flag: "🇬🇧" },
  CA: { name: "Canada", flag: "🇨🇦" },
  IT: { name: "Italie", flag: "🇮🇹" },
  NL: { name: "Pays-Bas", flag: "🇳🇱" },
  AE: { name: "Émirats Arabes Unis", flag: "🇦🇪" },
  SA: { name: "Arabie Saoudite", flag: "🇸🇦" },
  QA: { name: "Qatar", flag: "🇶🇦" },
  CH: { name: "Suisse", flag: "🇨🇭" },
  DZ: { name: "Algérie", flag: "🇩🇿" },
  TN: { name: "Tunisie", flag: "🇹🇳" },
};

export async function getWebAnalyticsData(
  period: "24h" | "7d" | "30d" | "all" = "7d"
): Promise<WebAnalyticsSummary> {
  const db = prisma as any;
  const now = new Date();
  let startDate = new Date();

  if (period === "24h") {
    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else if (period === "7d") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "30d") {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else {
    startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  }

  // 1. Récupération des PageViews sur la période
  const pageViews = await db.pageView.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    orderBy: { createdAt: "asc" },
  });

  // 2. Récupération des AnalyticsEvents sur la période
  const events = await db.analyticsEvent.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    orderBy: { createdAt: "desc" },
  });

  // Visiteurs actifs en direct (15 dernières minutes)
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
  const liveSessions = new Set(
    pageViews.filter((p: any) => new Date(p.createdAt) >= fifteenMinutesAgo).map((p: any) => p.sessionId)
  );

  const totalPageViews = pageViews.length;
  const sessionsMap = new Map<string, number>();

  pageViews.forEach((pv: any) => {
    sessionsMap.set(pv.sessionId, (sessionsMap.get(pv.sessionId) || 0) + 1);
  });

  const uniqueVisitors = sessionsMap.size;

  // Calcul du taux de rebond (sessions avec 1 seule page vue)
  let singlePageSessions = 0;
  sessionsMap.forEach((count) => {
    if (count === 1) singlePageSessions += 1;
  });
  const bounceRate = uniqueVisitors > 0 ? (singlePageSessions / uniqueVisitors) * 100 : 0;
  const avgViewsPerSession = uniqueVisitors > 0 ? totalPageViews / uniqueVisitors : 0;

  // 3. Construction de la Timeline chronologique
  const timelineMap = new Map<string, { views: number; visitors: Set<string> }>();

  if (period === "24h") {
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      const label = `${String(d.getHours()).padStart(2, "0")}:00`;
      timelineMap.set(label, { views: 0, visitors: new Set() });
    }
    pageViews.forEach((pv: any) => {
      const pvDate = new Date(pv.createdAt);
      const label = `${String(pvDate.getHours()).padStart(2, "0")}:00`;
      if (timelineMap.has(label)) {
        const item = timelineMap.get(label)!;
        item.views += 1;
        item.visitors.add(pv.sessionId);
      }
    });
  } else {
    const daysCount = period === "7d" ? 7 : period === "30d" ? 30 : 60;
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("fr-MA", { day: "2-digit", month: "short" });
      timelineMap.set(label, { views: 0, visitors: new Set() });
    }
    pageViews.forEach((pv: any) => {
      const pvDate = new Date(pv.createdAt);
      const label = pvDate.toLocaleDateString("fr-MA", { day: "2-digit", month: "short" });
      if (timelineMap.has(label)) {
        const item = timelineMap.get(label)!;
        item.views += 1;
        item.visitors.add(pv.sessionId);
      }
    });
  }

  const timeline = Array.from(timelineMap.entries()).map(([date, val]) => ({
    date,
    views: val.views,
    visitors: val.visitors.size,
  }));

  // 4. Top Pages
  const pagesMap = new Map<string, number>();
  pageViews.forEach((pv: any) => {
    pagesMap.set(pv.path, (pagesMap.get(pv.path) || 0) + 1);
  });
  const topPages = Array.from(pagesMap.entries())
    .map(([path, views]) => ({
      path,
      views,
      percentage: totalPageViews > 0 ? Math.round((views / totalPageViews) * 100) : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // 5. Top Référents
  const referrersMap = new Map<string, number>();
  pageViews.forEach((pv: any) => {
    const host = pv.referrerHost || "Direct / Organique";
    referrersMap.set(host, (referrersMap.get(host) || 0) + 1);
  });
  const topReferrers = Array.from(referrersMap.entries())
    .map(([host, views]) => ({
      host,
      views,
      percentage: totalPageViews > 0 ? Math.round((views / totalPageViews) * 100) : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // 6. Pays
  const countriesMap = new Map<string, number>();
  pageViews.forEach((pv: any) => {
    const c = (pv.country || "MA").toUpperCase();
    countriesMap.set(c, (countriesMap.get(c) || 0) + 1);
  });
  const countries = Array.from(countriesMap.entries())
    .map(([code, views]) => {
      const meta = COUNTRY_LOOKUP[code] || { name: code, flag: "🌍" };
      return {
        code,
        name: meta.name,
        flag: meta.flag,
        views,
        percentage: totalPageViews > 0 ? Math.round((views / totalPageViews) * 100) : 0,
      };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  // 7. Appareils
  const devicesMap = new Map<string, number>();
  pageViews.forEach((pv: any) => {
    const d = pv.device || "mobile";
    devicesMap.set(d, (devicesMap.get(d) || 0) + 1);
  });
  const devices = Array.from(devicesMap.entries())
    .map(([device, views]) => ({
      device,
      views,
      percentage: totalPageViews > 0 ? Math.round((views / totalPageViews) * 100) : 0,
    }))
    .sort((a, b) => b.views - a.views);

  // 8. Systèmes d'exploitation
  const osMap = new Map<string, number>();
  pageViews.forEach((pv: any) => {
    const o = pv.os || "Autre";
    osMap.set(o, (osMap.get(o) || 0) + 1);
  });
  const osList = Array.from(osMap.entries())
    .map(([name, views]) => ({
      name,
      views,
      percentage: totalPageViews > 0 ? Math.round((views / totalPageViews) * 100) : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  // 9. Navigateurs
  const browsersMap = new Map<string, number>();
  pageViews.forEach((pv: any) => {
    const b = pv.browser || "Autre";
    browsersMap.set(b, (browsersMap.get(b) || 0) + 1);
  });
  const browsers = Array.from(browsersMap.entries())
    .map(([name, views]) => ({
      name,
      views,
      percentage: totalPageViews > 0 ? Math.round((views / totalPageViews) * 100) : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  // 10. Événements personnalisés
  const eventsMap = new Map<string, { count: number; lastDate: Date }>();
  events.forEach((ev: any) => {
    const current = eventsMap.get(ev.eventName) || { count: 0, lastDate: new Date(ev.createdAt) };
    current.count += 1;
    if (new Date(ev.createdAt) > current.lastDate) {
      current.lastDate = new Date(ev.createdAt);
    }
    eventsMap.set(ev.eventName, current);
  });

  const formattedEvents = Array.from(eventsMap.entries())
    .map(([eventName, val]) => ({
      eventName,
      count: val.count,
      lastTriggered: val.lastDate.toLocaleDateString("fr-MA", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    period,
    overview: {
      uniqueVisitors,
      totalPageViews,
      bounceRate: Number(bounceRate.toFixed(1)),
      liveVisitors: liveSessions.size,
      avgViewsPerSession: Number(avgViewsPerSession.toFixed(1)),
    },
    timeline,
    topPages,
    topReferrers,
    countries,
    devices,
    osList,
    browsers,
    events: formattedEvents,
  };
}

/**
 * Action de génération d'un échantillon de données réalistes
 * si la base de données est neuve afin d'illustrer le module en direct
 */
export async function seedAnalyticsDemoDataAction() {
  const db = prisma as any;
  const samplePaths = [
    "/fr",
    "/fr/trips",
    "/fr/trips/escapade-merzouga-dunes-sahara",
    "/fr/trips/ascension-jbel-toubkal-refuge",
    "/fr/trips/moyen-atlas-lacs-foret-cedres",
    "/fr/carrieres",
    "/fr/blog",
    "/ar",
    "/ar/trips",
  ];

  const sampleReferrers = [
    { ref: "https://m.facebook.com/", host: "facebook.com" },
    { ref: "https://www.instagram.com/", host: "instagram.com" },
    { ref: "https://www.google.com/search?q=voyage+organise+maroc", host: "google.com" },
    { ref: "https://tiktok.com/", host: "tiktok.com" },
    { ref: null, host: "Direct / Organique" },
  ];

  const sampleCountries = ["MA", "MA", "MA", "MA", "FR", "FR", "ES", "BE", "US"];
  const sampleDevices = ["mobile", "mobile", "mobile", "desktop", "tablet"];
  const sampleOS = ["Android", "Android", "iOS", "Windows", "macOS"];
  const sampleBrowsers = ["Chrome", "Safari", "Samsung Internet", "Chrome", "Firefox"];

  const viewsToCreate = [];
  const eventsToCreate = [];
  const now = Date.now();

  for (let i = 0; i < 85; i++) {
    const randomTime = new Date(now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000));
    const sessionId = "demo_session_" + (i % 25);
    const ref = sampleReferrers[Math.floor(Math.random() * sampleReferrers.length)];

    viewsToCreate.push({
      sessionId,
      path: samplePaths[Math.floor(Math.random() * samplePaths.length)],
      referrer: ref.ref,
      referrerHost: ref.host,
      country: sampleCountries[Math.floor(Math.random() * sampleCountries.length)],
      device: sampleDevices[Math.floor(Math.random() * sampleDevices.length)],
      os: sampleOS[Math.floor(Math.random() * sampleOS.length)],
      browser: sampleBrowsers[Math.floor(Math.random() * sampleBrowsers.length)],
      createdAt: randomTime,
    });

    if (i % 3 === 0) {
      const eventNames = ["whatsapp_click", "phone_call_click", "trip_booking_started"];
      eventsToCreate.push({
        sessionId,
        eventName: eventNames[Math.floor(Math.random() * eventNames.length)],
        path: samplePaths[Math.floor(Math.random() * samplePaths.length)],
        metadata: { source: "demo_tracker" },
        createdAt: randomTime,
      });
    }
  }

  for (const item of viewsToCreate) {
    await db.pageView.create({ data: item });
  }

  for (const ev of eventsToCreate) {
    await db.analyticsEvent.create({ data: ev });
  }

  return { success: true, count: viewsToCreate.length };
}

