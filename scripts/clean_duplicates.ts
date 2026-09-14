import { prisma } from "../src/lib/prisma";

async function main() {
  const deleted = await prisma.tripPartner.deleteMany({
    where: {
      id: { in: ["cmtuirdqb000hk24korykil9r", "cmtuirdqb000ik24k7mpxqgyb"] },
    },
  });
  console.log(`Cleaned ${deleted.count} duplicate entries`);
}

main().finally(() => prisma.$disconnect());
