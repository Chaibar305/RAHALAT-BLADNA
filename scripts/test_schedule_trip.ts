import { prisma } from "../src/lib/prisma";

async function main() {
  const trip = await prisma.trip.findFirst({
    where: { slug: "odyssee-du-sud-merzouga-dades-ouarzazate" },
  });

  if (trip) {
    await prisma.trip.updateMany({
      where: { id: { not: trip.id } },
      data: { isScheduledThisWeek: false },
    });

    const updated = await prisma.trip.update({
      where: { id: trip.id },
      data: {
        isScheduledThisWeek: true,
        featuredWeekMessage: "🔥 Il ne reste que 6 places pour ce week-end ! Départ garanti.",
      },
    });

    console.log("✅ Circuit activé comme départ vedette de la semaine :", updated.titleFr);
    console.log("Message :", updated.featuredWeekMessage);
  } else {
    console.log("Trip not found");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
