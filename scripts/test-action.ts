import { createPartnerAction } from "../src/actions/partner.actions";
import { prisma } from "../src/lib/prisma";

async function testAction() {
  try {
    const payload = {
      type: "HOTEL_AUBERGE" as any,
      companyName: "Asfalou Eco-Land / Maawa",
      city: "Asfalou",
      contactName: "Said Daflaoui",
      phone: "+212 671-229572",
      email: "contact@dunesquad.ma",
      capacity: 58,
      rateDetails: "500 par p 3 jour",
      notes: "",
      vehicleType: "",
      plateNumber: "",
      activityType: "",
    };

    console.log("Calling createPartnerAction with payload:", payload);
    const result = await createPartnerAction(payload);
    console.log("Result:", result);

    if (result.success && result.partner) {
      console.log("Cleaning up partner:", result.partner.id);
      await prisma.partner.delete({ where: { id: result.partner.id } });
    }
  } catch (e: any) {
    console.error("Caught error in testAction:", e);
  } finally {
    await prisma.$disconnect();
  }
}

testAction();
