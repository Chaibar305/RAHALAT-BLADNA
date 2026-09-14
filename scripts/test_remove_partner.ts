import { removePartnerFromTrip } from "../src/actions/trip-partners";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Testing removePartnerFromTrip server action directly...");
  // Let's find one of the duplicate Asfalou Eco-Land trip partners
  const duplicate = await prisma.tripPartner.findFirst({
    where: {
      status: "EN_ATTENTE",
    },
  });

  if (!duplicate) {
    console.log("No duplicate found");
    return;
  }

  console.log(`Attempting to remove tripPartnerId: ${duplicate.id} from tripId: ${duplicate.tripId}`);
  const res = await removePartnerFromTrip(duplicate.id, duplicate.tripId);
  console.log("Result:", res);

  const check = await prisma.tripPartner.findUnique({ where: { id: duplicate.id } });
  console.log("Record exists in DB after deletion?:", !!check);
}

main().finally(() => prisma.$disconnect());
