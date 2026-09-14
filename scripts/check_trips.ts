import { prisma } from "../src/lib/prisma";

async function main() {
  const trips = await prisma.trip.findMany({
    select: {
      id: true,
      titleFr: true,
      slug: true,
      itineraryDays: {
        orderBy: { dayNumber: "asc" },
      },
    },
  });
  console.log("Total trips:", trips.length);
  for (const t of trips) {
    console.log(`Trip: [${t.id}] ${t.titleFr} (${t.slug}) - Itinerary days: ${t.itineraryDays.length}`);
    for (const d of t.itineraryDays) {
      console.log(`   Day ${d.dayNumber}: ${d.titleFr} (${d.location})`);
    }
  }
}

main().finally(() => prisma.$disconnect());
