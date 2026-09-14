import { prisma } from "../src/lib/prisma";
import { PartnerType, PartnerStatus } from "@prisma/client";

async function main() {
  console.log("Seeding realistic partners directory...");

  // 1. Hôtels & Bivouacs
  const hotel1 = await prisma.partner.upsert({
    where: { id: "partner-asfalou-ecoland" },
    update: {
      type: PartnerType.HOTEL_AUBERGE,
      companyName: "Asfalou Eco-Land / Maâwa",
      contactName: "Abdessalam Rifai",
      phone: "+212 661-884422",
      city: "Taher Souk - Asfalou",
      rateDetails: "350 MAD / pers en demi-pension + tentes équipées",
      capacity: 60,
    },
    create: {
      id: "partner-asfalou-ecoland",
      type: PartnerType.HOTEL_AUBERGE,
      companyName: "Asfalou Eco-Land / Maâwa",
      contactName: "Abdessalam Rifai",
      phone: "+212 661-884422",
      city: "Taher Souk - Asfalou",
      rateDetails: "350 MAD / pers en demi-pension + tentes équipées",
      capacity: 60,
    },
  });

  const hotel2 = await prisma.partner.upsert({
    where: { id: "partner-merzouga-stars" },
    update: {
      type: PartnerType.HOTEL_AUBERGE,
      companyName: "Bivouac de Luxe Merzouga Stars",
      contactName: "Brahim Oubassou",
      phone: "+212 662-889900",
      city: "Merzouga (Erg Chebbi)",
      rateDetails: "450 MAD / nuitée en demi-pension + veillée Gnawa",
      capacity: 50,
    },
    create: {
      id: "partner-merzouga-stars",
      type: PartnerType.HOTEL_AUBERGE,
      companyName: "Bivouac de Luxe Merzouga Stars",
      contactName: "Brahim Oubassou",
      phone: "+212 662-889900",
      city: "Merzouga (Erg Chebbi)",
      rateDetails: "450 MAD / nuitée en demi-pension + veillée Gnawa",
      capacity: 50,
    },
  });

  const hotel3 = await prisma.partner.upsert({
    where: { id: "partner-hotel-chefchaouen" },
    update: {
      type: PartnerType.HOTEL_AUBERGE,
      companyName: "Hôtel Riad Akchour & Chefchaouen",
      contactName: "Mme Noura Tazi",
      phone: "+212 661-445566",
      city: "Chefchaouen",
      rateDetails: "380 MAD / pers avec petit déjeuner buffet",
      capacity: 40,
    },
    create: {
      id: "partner-hotel-chefchaouen",
      type: PartnerType.HOTEL_AUBERGE,
      companyName: "Hôtel Riad Akchour & Chefchaouen",
      contactName: "Mme Noura Tazi",
      phone: "+212 661-445566",
      city: "Chefchaouen",
      rateDetails: "380 MAD / pers avec petit déjeuner buffet",
      capacity: 40,
    },
  });

  // 2. Transporteurs TIST
  const transport1 = await prisma.partner.upsert({
    where: { id: "partner-transport-baraka" },
    update: {
      type: PartnerType.TRANSPORT_TOURISTIQUE,
      companyName: "Trans Touristique Al Baraka TIST SARL",
      contactName: "Haj Larbi Bakkali",
      phone: "+212 661-332211",
      city: "Casablanca / Rabat",
      rateDetails: "Forfait autocar 4500 MAD (3 jours) carburant et péages inclus",
      capacity: 48,
      vehicleType: "Autocar 48 places Mercedes Travego",
      plateNumber: "45210|A|6",
    },
    create: {
      id: "partner-transport-baraka",
      type: PartnerType.TRANSPORT_TOURISTIQUE,
      companyName: "Trans Touristique Al Baraka TIST SARL",
      contactName: "Haj Larbi Bakkali",
      phone: "+212 661-332211",
      city: "Casablanca / Rabat",
      rateDetails: "Forfait autocar 4500 MAD (3 jours) carburant et péages inclus",
      capacity: 48,
      vehicleType: "Autocar 48 places Mercedes Travego",
      plateNumber: "45210|A|6",
    },
  });

  const transport2 = await prisma.partner.upsert({
    where: { id: "partner-transport-minibus" },
    update: {
      type: PartnerType.TRANSPORT_TOURISTIQUE,
      companyName: "Atlas Minibus Express TIST SARL",
      contactName: "Kamal Sefrioui",
      phone: "+212 663-114477",
      city: "Fès / Tanger",
      rateDetails: "Forfait minibus 3200 MAD (2 jours) pour le Nord",
      capacity: 17,
      vehicleType: "Minibus 17 places Mercedes Sprinter",
      plateNumber: "12890|B|1",
    },
    create: {
      id: "partner-transport-minibus",
      type: PartnerType.TRANSPORT_TOURISTIQUE,
      companyName: "Atlas Minibus Express TIST SARL",
      contactName: "Kamal Sefrioui",
      phone: "+212 663-114477",
      city: "Fès / Tanger",
      rateDetails: "Forfait minibus 3200 MAD (2 jours) pour le Nord",
      capacity: 17,
      vehicleType: "Minibus 17 places Mercedes Sprinter",
      plateNumber: "12890|B|1",
    },
  });

  // 3. Activités & Loisirs
  const activity1 = await prisma.partner.upsert({
    where: { id: "partner-kayak-asfalou" },
    update: {
      type: PartnerType.LEISURE_ACTIVITY,
      companyName: "Club Nautique & Kayak Asfalou",
      contactName: "Youssef Amrani",
      phone: "+212 664-998877",
      city: "Taher Souk - Asfalou",
      activityType: "Session Kayak & Baignade Surveillée",
      rateDetails: "150 MAD / session kayak avec gilets de sauvetage et encadrement",
      capacity: 30,
    },
    create: {
      id: "partner-kayak-asfalou",
      type: PartnerType.LEISURE_ACTIVITY,
      companyName: "Club Nautique & Kayak Asfalou",
      contactName: "Youssef Amrani",
      phone: "+212 664-998877",
      city: "Taher Souk - Asfalou",
      activityType: "Session Kayak & Baignade Surveillée",
      rateDetails: "150 MAD / session kayak avec gilets de sauvetage et encadrement",
      capacity: 30,
    },
  });

  const activity2 = await prisma.partner.upsert({
    where: { id: "partner-quad-merzouga" },
    update: {
      type: PartnerType.LEISURE_ACTIVITY,
      companyName: "Désert Quad & Buggy Aventure",
      contactName: "Hamid Sahraoui",
      phone: "+212 665-334455",
      city: "Merzouga",
      activityType: "Quad & Buggy Dunes Erg Chebbi",
      rateDetails: "400 MAD / heure par quad avec casque et guide",
      capacity: 20,
    },
    create: {
      id: "partner-quad-merzouga",
      type: PartnerType.LEISURE_ACTIVITY,
      companyName: "Désert Quad & Buggy Aventure",
      contactName: "Hamid Sahraoui",
      phone: "+212 665-334455",
      city: "Merzouga",
      activityType: "Quad & Buggy Dunes Erg Chebbi",
      rateDetails: "400 MAD / heure par quad avec casque et guide",
      capacity: 20,
    },
  });

  console.log("✅ 7 partenaires créés ou mis à jour avec succès (Hôtels, Transports TIST, Activités & Loisirs).");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
