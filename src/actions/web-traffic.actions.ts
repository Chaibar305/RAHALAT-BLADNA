"use server";

import { prisma } from "@/lib/prisma";

export interface WebTrafficData {
  overview: {
    visitors: number;
    pageViews: number;
    bounceRate: number;
  };
  timeline: Array<{
    date: string;
    views: number;
    visitors: number;
  }>;
  topPages: Array<{
    path: string;
    visitors: number;
  }>;
  topReferrers: Array<{
    referrer: string;
    visitors: number;
  }>;
  countries: Array<{
    country: string;
    visitors: number;
    percentage: number;
  }>;
  devices: Array<{
    device: string;
    percentage: number;
  }>;
  operatingSystems: Array<{
    os: string;
    percentage: number;
  }>;
  customEvents: Array<{
    name: string;
    total: number;
  }>;
}

interface TrafficViewItem {
  sessionId: string;
  path: string;
  referrerHost: string | null;
  country: string | null;
  device: string | null;
  os: string | null;
  createdAt: Date;
}

export async function getWebTrafficAnalytics(
  period: "7d" | "30d" | "month" = "7d"
): Promise<WebTrafficData> {
  const db = prisma as any;
  const now = new Date();
  let startDate = new Date();
  if (period === "7d") startDate.setDate(now.getDate() - 7);
  else if (period === "30d") startDate.setDate(now.getDate() - 30);
  else startDate = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Récupération des PageViews sur la période
  const views: TrafficViewItem[] = await db.pageView.findMany({
    where: { createdAt: { gte: startDate } },
    select: {
      sessionId: true,
      path: true,
      referrerHost: true,
      country: true,
      device: true,
      os: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const totalPageViews = views.length;
  const uniqueSessions = new Set(views.map((v) => v.sessionId));
  const totalVisitors = uniqueSessions.size;

  // Calcul du taux de rebond (sessions avec 1 seule page vue)
  const sessionCounts = new Map<string, number>();
  views.forEach((v) => {
    sessionCounts.set(v.sessionId, (sessionCounts.get(v.sessionId) || 0) + 1);
  });
  let singlePageSessions = 0;
  sessionCounts.forEach((count) => {
    if (count === 1) singlePageSessions++;
  });
  const bounceRate = totalVisitors > 0 ? Math.round((singlePageSessions / totalVisitors) * 100) : 0;

  // Groupement Timeline chronologique
  const daysCount = period === "7d" ? 7 : period === "30d" ? 30 : 31;
  const timelineMap = new Map<string, { views: number; visitors: Set<string> }>();
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("fr-MA", { day: "2-digit", month: "short" });
    timelineMap.set(label, { views: 0, visitors: new Set() });
  }

  views.forEach((v) => {
    const label = new Date(v.createdAt).toLocaleDateString("fr-MA", {
      day: "2-digit",
      month: "short",
    });
    if (timelineMap.has(label)) {
      const item = timelineMap.get(label)!;
      item.views++;
      item.visitors.add(v.sessionId);
    }
  });

  const timeline = Array.from(timelineMap.entries()).map(([date, val]) => ({
    date,
    views: val.views,
    visitors: val.visitors.size,
  }));

  // Groupement par Top Pages
  const pageMap = new Map<string, number>();
  views.forEach((v) => pageMap.set(v.path, (pageMap.get(v.path) || 0) + 1));
  const topPages = Array.from(pageMap.entries())
    .map(([path, visitors]) => ({ path, visitors }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 8);

  // Groupement par Référents
  const refMap = new Map<string, number>();
  views.forEach((v) => {
    const host = v.referrerHost || "Direct / Inconnu";
    refMap.set(host, (refMap.get(host) || 0) + 1);
  });
  const topReferrers = Array.from(refMap.entries())
    .map(([referrer, visitors]) => ({ referrer, visitors }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 8);

  // Groupement par Pays
  const countryMap = new Map<string, number>();
  views.forEach((v) => {
    const c = v.country || "MA";
    countryMap.set(c, (countryMap.get(c) || 0) + 1);
  });
  const countries = Array.from(countryMap.entries())
    .map(([country, visitors]) => ({
      country,
      visitors,
      percentage: totalPageViews > 0 ? Math.round((visitors / totalPageViews) * 100) : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Groupement par Appareils & OS
  const deviceMap = new Map<string, number>();
  const osMap = new Map<string, number>();
  views.forEach((v) => {
    if (v.device) deviceMap.set(v.device, (deviceMap.get(v.device) || 0) + 1);
    if (v.os) osMap.set(v.os, (osMap.get(v.os) || 0) + 1);
  });

  const devices = Array.from(deviceMap.entries()).map(([device, count]) => ({
    device,
    percentage: totalPageViews > 0 ? Math.round((count / totalPageViews) * 100) : 0,
  }));

  const operatingSystems = Array.from(osMap.entries()).map(([os, count]) => ({
    os,
    percentage: totalPageViews > 0 ? Math.round((count / totalPageViews) * 100) : 0,
  }));

  // Événements personnalisés
  const events: Array<{ eventName: string }> = await db.analyticsEvent.findMany({
    where: { createdAt: { gte: startDate } },
    select: { eventName: true },
  });
  const eventMap = new Map<string, number>();
  events.forEach((e) => eventMap.set(e.eventName, (eventMap.get(e.eventName) || 0) + 1));
  const customEvents = Array.from(eventMap.entries()).map(([name, total]) => ({
    name,
    total,
  }));

  return {
    overview: {
      visitors: totalVisitors,
      pageViews: totalPageViews,
      bounceRate,
    },
    timeline,
    topPages,
    topReferrers,
    countries,
    devices,
    operatingSystems,
    customEvents,
  };
}

/**
 * Seeder de démonstration pour injecter des données initiales représentatives
 */
export async function seedDemoTrafficAction() {
  const db = prisma as any;
  const samplePaths = [
    "/fr",
    "/fr/trips",
    "/fr/trips/escapade-imlil-agafay-marrakech",
    "/fr/trips/escapade-merzouga-dunes-sahara",
    "/fr/trips/ascension-jbel-toubkal-refuge",
    "/fr/blog",
    "/ar",
    "/ar/trips",
  ];

  const sampleRefs = [
    { ref: "https://m.facebook.com/", host: "m.facebook.com" },
    { ref: "https://www.instagram.com/", host: "instagram.com" },
    { ref: "https://www.google.com/", host: "google.com" },
    { ref: "https://tiktok.com/", host: "tiktok.com" },
    { ref: null, host: "Direct / Inconnu" },
  ];

  const sampleCountries = ["MA", "MA", "MA", "MA", "FR", "ES", "BE", "US"];
  const sampleDevices = ["mobile", "mobile", "mobile", "desktop", "tablet"];
  const sampleOS = ["Android", "iOS", "Android", "Windows", "Mac OS"];

  const viewsData = [];
  const eventsData = [];
  const now = Date.now();

  for (let i = 0; i < 75; i++) {
    const randomTime = new Date(now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000));
    const sessionId = "sess_demo_" + (i % 20);
    const ref = sampleRefs[Math.floor(Math.random() * sampleRefs.length)];

    viewsData.push({
      sessionId,
      path: samplePaths[Math.floor(Math.random() * samplePaths.length)],
      referrer: ref.ref,
      referrerHost: ref.host,
      country: sampleCountries[Math.floor(Math.random() * sampleCountries.length)],
      device: sampleDevices[Math.floor(Math.random() * sampleDevices.length)],
      os: sampleOS[Math.floor(Math.random() * sampleOS.length)],
      createdAt: randomTime,
    });

    if (i % 2 === 0) {
      const eventNames = ["whatsapp_click", "phone_call_click", "trip_booking_started", "receipt_uploaded"];
      eventsData.push({
        sessionId,
        eventName: eventNames[Math.floor(Math.random() * eventNames.length)],
        path: samplePaths[Math.floor(Math.random() * samplePaths.length)],
        createdAt: randomTime,
      });
    }
  }

  for (const item of viewsData) {
    await db.pageView.create({ data: item });
  }

  for (const ev of eventsData) {
    await db.analyticsEvent.create({ data: ev });
  }

  return { success: true, count: viewsData.length };
}
