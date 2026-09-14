import { prisma } from "../src/lib/prisma";

async function main() {
  const tripPartners = await prisma.tripPartner.findMany({
    include: {
      partner: true,
      trip: { select: { id: true, titleFr: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Total trip partners: ${tripPartners.length}`);
  for (const tp of tripPartners) {
    console.log(`- [${tp.id}] Trip: "${tp.trip.titleFr}" | Partner: "${tp.partner.companyName}" (${tp.partner.type}) | Status: ${tp.status}`);
  }

  const partners = await prisma.partner.findMany({
    orderBy: { companyName: "asc" },
  });
  console.log(`\nTotal partners: ${partners.length}`);
  for (const p of partners) {
    console.log(`- [${p.id}] ${p.companyName} (${p.type}, ${p.city})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
