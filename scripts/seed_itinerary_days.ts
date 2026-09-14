import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding real ItineraryDays for existing trips...");

  // 1. Barrage Asfalou
  const asfalou = await prisma.trip.findFirst({
    where: {
      OR: [
        { slug: "barrage-asfalou-ghadir-hamma-kayak" },
        { titleFr: { contains: "ASFALOU" } },
      ],
    },
  });

  if (asfalou) {
    console.log(`Found Asfalou trip: ${asfalou.id}`);
    await prisma.itineraryDay.deleteMany({ where: { tripId: asfalou.id } });
    await prisma.itineraryDay.createMany({
      data: [
        {
          tripId: asfalou.id,
          dayNumber: 1,
          titleFr: "Départ des Gares & Installation au Campement de Bab Asfalou",
          titleAr: "الانطلاق من محطات القطار والمبيت تحت نجوم باب أسفالو",
          location: "Campement de Bab Asfalou, Taher Souk",
          featuredImage: "/images/asfalou/cover-asfalou.jpg",
          meals: ["DINNER"],
          descriptionFr:
            "Départs confortables depuis Casa-Voyageurs (18h30), Rabat-Ville (20h00) et Fès (23h00). Pause libre pour dîner en route. Arrivée au campement aménagé de Bab Asfalou, installation dans les tentes équipées et première nuit sous les étoiles.",
          descriptionAr:
            "انطلاق مريح من محطات الدار البيضاء (18:30)، الرباط (20:00) وفاس (23:00). توقف حر للعشاء ثم الوصول للمخيم بباب أسفالو والمبيت في الخيام المجهزة.",
          activityTags: ["Départs Casa/Rabat/Fès", "Campement aménagé", "Bivouac étoilé"],
        },
        {
          tripId: asfalou.id,
          dayNumber: 2,
          titleFr: "Session Kayak sur le Lac du Barrage Asfalou & Veillée Feu de Camp",
          titleAr: "مغامرة الكاياك في بحيرة أسفالو وسهرة نار المخيم",
          location: "Lac du Barrage Asfalou",
          featuredImage: "/images/asfalou/session-kayak.jpg",
          meals: ["BREAKFAST", "LUNCH", "DINNER"],
          descriptionFr:
            "Petit-déjeuner complet face au panorama du lac. Marche d'approche vers les criques, baignade surveillée et session kayak inoubliable avec équipement certifié. Déjeuner traditionnel au campement, shooting photos et veillée festive autour d'un grand feu de camp sous les étoiles.",
          descriptionAr:
            "فطور كامل أمام مشهد السد، مسار مشي سهل نحو الخلجان، سباحة مؤطرة وجولة كاياك ممتعة مع سترات النجاة. غداء تقليدي شهي بالمخيم، وسهرة ممتعة حول نار المخيم تحت النجوم.",
          activityTags: ["Kayak", "Baignade", "Feu de camp", "Shooting photos"],
        },
        {
          tripId: asfalou.id,
          dayNumber: 3,
          titleFr: "Randonnée Aquatique aux Vasques & Jacuzzis de Ghadir Hamma",
          titleAr: "مشي مائي واستكشاف جاكوزي وشلالات غدير حامة",
          location: "Ghadir Hamma (Taher Souk - Marnissa)",
          featuredImage: "/images/asfalou/ghadir-hamma-baignade.jpg",
          meals: ["BREAKFAST", "LUNCH"],
          descriptionFr:
            "Transfert vers Taher Souk, randonnée aquatique accessible (~30 min), baignade revigorante dans les cascades et vasques rocheuses naturelles de Ghadir Hamma. Déjeuner convivial au bord de l'eau puis retour confortable.",
          descriptionAr:
            "تنقل نحو طهر السوق، مشي مائي ممتع (~30 دقيقة)، سباحة في المياه العذبة والشلالات الطبيعية لغدير حامة، غداء على ضفاف الوادي قبل العودة.",
          activityTags: ["Ghadir Hamma", "Jacuzzis naturels", "Cascades", "Baignade"],
        },
      ],
    });
    console.log("Seeded Asfalou itinerary days successfully!");
  }

  // 2. Merzouga
  const merzouga = await prisma.trip.findFirst({
    where: {
      OR: [
        { slug: "magie-desert-merzouga-todra-3j" },
        { titleFr: { contains: "Merzouga" } },
      ],
    },
  });

  if (merzouga) {
    console.log(`Found Merzouga trip: ${merzouga.id}`);
    await prisma.itineraryDay.deleteMany({ where: { tripId: merzouga.id } });
    await prisma.itineraryDay.createMany({
      data: [
        {
          tripId: merzouga.id,
          dayNumber: 1,
          titleFr: "Traversée du Moyen Atlas & Arrivée aux Gorges du Todra",
          titleAr: "عبور الأطلس المتوسط والوصول إلى مضايق تودغى",
          location: "Gorges du Todra / Tinghir",
          featuredImage: "/images/merzouga/gorges-todra.jpg",
          meals: ["BREAKFAST", "DINNER"],
          descriptionFr:
            "Départ matinal, halte panoramique dans la cédraie d'Ifrane et découverte pédestre des vertigineuses Gorges du Todra.",
          descriptionAr:
            "انطلاق صباحي، توقف بأزرو ثم استكشاف مضايق تودغى.",
          activityTags: ["Gorges du Todra", "Cédraie d'Ifrane"],
        },
        {
          tripId: merzouga.id,
          dayNumber: 2,
          titleFr: "Caravane de Dromadaires, Coucher de Soleil & Bivouac de Luxe",
          titleAr: "قافلة الجمال، غروب الشمس والمبيت في مخيم صحراوي فاخر",
          location: "Dunes Erg Chebbi / Merzouga",
          featuredImage: "/images/merzouga/bivouac-luxe.jpg",
          meals: ["BREAKFAST", "DINNER"],
          descriptionFr:
            "Balade à dos de dromadaire au coucher du soleil, dîner traditionnel sous les étoiles et soirée feu de camp Gnawa.",
          descriptionAr:
            "جولة بالجمال فوق الرمال وسهرة كناوية حول النار.",
          activityTags: ["Erg Chebbi", "Dromadaires", "Bivouac"],
        },
        {
          tripId: merzouga.id,
          dayNumber: 3,
          titleFr: "Lever de Soleil sur les Dunes, Visite de Khamlia & Retour",
          titleAr: "شروق الشمس، زيارة قرية خملية والعودة",
          location: "Village Khamlia / Rissani",
          featuredImage: "/images/merzouga/khamlia-gnawa.jpg",
          meals: ["BREAKFAST"],
          descriptionFr:
            "Spectacle du lever de soleil sur les crêtes, immersion culturelle au village Khamlia et retour confortable en autocar TIST.",
          descriptionAr:
            "مشاهدة شروق الشمس، زيارة قرية خملية والعودة.",
          activityTags: ["Lever de soleil", "Khamlia Gnawa"],
        },
      ],
    });
    console.log("Seeded Merzouga itinerary days successfully!");
  }

  // 3. Chefchaouen
  const chefchaouen = await prisma.trip.findFirst({
    where: {
      OR: [
        { slug: "perle-bleue-chefchaouen-akchour" },
        { titleFr: { contains: "Chefchaouen" } },
      ],
    },
  });

  if (chefchaouen) {
    console.log(`Found Chefchaouen trip: ${chefchaouen.id}`);
    await prisma.itineraryDay.deleteMany({ where: { tripId: chefchaouen.id } });
    await prisma.itineraryDay.createMany({
      data: [
        {
          tripId: chefchaouen.id,
          dayNumber: 1,
          titleFr: "Ruelles Bleues & Coucher de Soleil à la Mosquée Espagnole",
          titleAr: "أزقة شفشاون الزرقاء وغروب الشمس من المسجد الإسباني",
          location: "Médina de Chefchaouen",
          featuredImage: "/images/chefchaouen/ruelles-bleues.jpg",
          meals: ["BREAKFAST", "DINNER"],
          descriptionFr:
            "Départ matinal, arrivée et installation à Chefchaouen. Exploration pédestre des venelles bleues, artisanat local, place Outa el-Hammam et montée sur la colline de Bouzafar pour assister au coucher du soleil.",
          descriptionAr:
            "انطلاق صباحي، الوصول والاستقرار بشفشاون. جولة راجلة في الأزقة الزرقاء، ساحة وطاء الحمام وصعود هضبة بوزعافار لمشاهدة الغروب.",
          activityTags: ["Médina Bleue", "Outa el-Hammam", "Bouzafar"],
        },
        {
          tripId: chefchaouen.id,
          dayNumber: 2,
          titleFr: "Randonnée aux Cascades d'Akchour & Pont de Dieu",
          titleAr: "مشي طبيعي إلى شلالات أقشور وقنطرة ربي",
          location: "Parc National de Talassemtane, Akchour",
          featuredImage: "/images/chefchaouen/cascades-akchour.jpg",
          meals: ["BREAKFAST", "LUNCH"],
          descriptionFr:
            "Randonnée rafraîchissante le long de la rivière cristalline d'Akchour, baignade dans les bassins naturels, découverte de l'arche rocheuse du Pont de Dieu et tajine au bord de l'eau.",
          descriptionAr:
            "مسار مشي وسط الطبيعة بمحاذاة وادي أقشور، سباحة في المسابح الطبيعية، زيارة قنطرة ربي وتناول طاجين لذيذ بجانب المياه قبل العودة.",
          activityTags: ["Akchour", "Pont de Dieu", "Cascades", "Baignade"],
        },
      ],
    });
    console.log("Seeded Chefchaouen itinerary days successfully!");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
