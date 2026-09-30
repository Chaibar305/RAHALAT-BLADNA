import { prisma } from "../src/lib/prisma";

async function main() {
  const trips = await prisma.trip.findMany({
    include: {
      itineraryDays: {
        orderBy: { dayNumber: "asc" },
      },
    },
  });
  console.log("Total trips:", trips.length);
  for (const t of trips) {
    console.log(`\n========================================`);
    console.log(`Trip: [${t.slug}]`);
    console.log(`  titleFr: ${t.titleFr}`);
    console.log(`  titleEn: ${t.titleEn}`);
    console.log(`  overviewEn (len): ${((t as any).overviewEn || "").length}`);
    console.log(`  includedServicesEn: ${((t as any).includedServicesEn || []).length} items`);
    console.log(`  itineraryDays: ${t.itineraryDays.length} days`);
    for (const d of t.itineraryDays) {
      console.log(`    Day ${d.dayNumber}:`);
      console.log(`      titleFr: ${d.titleFr}`);
      console.log(`      titleEn: ${(d as any).titleEn}`);
      console.log(`      descEn: ${(d as any).descriptionEn}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
