import { prisma } from "../src/lib/prisma";

async function run() {
  try {
    console.log("Testing prisma.partner.create...");
    const partner = await prisma.partner.create({
      data: {
        type: "LEISURE_ACTIVITY" as any,
        companyName: "Test Quad Merzouga",
        contactName: "Karim Benali",
        phone: "+212 661-123456",
        city: "Merzouga",
        rateDetails: "350 MAD / quad",
        capacity: 20,
        vehicleType: null,
        plateNumber: null,
        activityType: "Quad & Buggy Désert",
        email: "contact@quadmerzouga.ma",
        notes: "Tarif spécial 2026",
      },
    });
    console.log("Created successfully:", partner);

    // Clean up
    await prisma.partner.delete({ where: { id: partner.id } });
    console.log("Cleaned up test partner.");
  } catch (err: any) {
    console.error("Prisma error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
