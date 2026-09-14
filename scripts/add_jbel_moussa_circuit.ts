import { PrismaClient, TripType, TripPublishStatus, DepartureStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Insertion du circuit : Ascension du Jbel Moussa & Paradis Aquatique de Belyounech...");

  // 1. Récupération de l'agence principale
  let agency = await prisma.agency.findFirst({
    where: { isActive: true },
  });

  if (!agency) {
    console.log("Création de l'agence par défaut...");
    agency = await prisma.agency.create({
      data: {
        name: "Rahalat Bladna Experience",
        slug: "rahalat-bladna-experience",
        licenseNumber: "LIC-MAR-2024/889",
        phone: "+212 603-660658",
        email: "machaibare@gmail.com",
        city: "Casablanca",
        address: "Casablanca Finance City & Rabat",
        isActive: true,
      },
    });
  }

  console.log(`🏢 Agence sélectionnée : ${agency.name} (ID: ${agency.id})`);

  const slug = "ascension-jbel-moussa-belyounech";

  // Supprimer l'ancien circuit s'il existe déjà avec ce slug pour mise à jour propre
  const existingTrip = await prisma.trip.findUnique({
    where: { slug },
  });

  if (existingTrip) {
    console.log(`⚠️ Circuit existant trouvé avec le slug "${slug}". Nettoyage avant réinsertion...`);
    await prisma.trip.delete({
      where: { id: existingTrip.id },
    });
    console.log("✅ Ancien circuit supprimé avec succès.");
  }

  // 2. Création du Circuit complet avec relations
  const trip = await prisma.trip.create({
    data: {
      agencyId: agency.id,
      titleFr: "⛰️🌊 Ascension du Jbel Moussa & Paradis Aquatique de Belyounech",
      titleAr: "⛰️🌊 تسلق جبل موسى والجنة البحرية لبليونش (مضيق جبل طارق)",
      titleEn: "Ascent of Jbel Moussa & Aquatic Paradise of Belyounech",
      slug: slug,
      tripType: TripType.TREKKING_HIKING,
      publishStatus: TripPublishStatus.PUBLISHED,
      durationDays: 3,
      durationNights: 2,
      destinationRegion: "Tanger-Tétouan-Al Hoceïma (Belyounech, Détroit de Gibraltar)",
      departureCity: "Casablanca, Rabat",
      basePrice: 1150.00,
      depositPerPerson: 400.00,
      singleSupplement: 200.00,
      totalSeats: 28,
      minSeatsRequired: 10,
      isFeatured: true,
      isActive: true,
      coverImageUrl: "/images/jbel-moussa/cover-jbel-moussa.jpg",
      galleryImages: [
        "/images/jbel-moussa/sommet-jbel-moussa.jpg",
        "/images/jbel-moussa/ilot-leila-vue-sommet.jpg",
        "/images/jbel-moussa/baie-turquoise-belyounech.jpg",
        "/images/jbel-moussa/plongee-sous-marine-belyounech.jpg",
        "/images/jbel-moussa/coucher-soleil-detroit.jpg",
      ],
      shortDescriptionFr: "Entre sommet mythique, détroit de Gibraltar et eaux turquoise de la Méditerranée : ascension guidée du Jbel Moussa (851m), panorama sur l'îlot Leïla et baptême de plongée à Belyounech.",
      shortDescriptionAr: "بين قمة أسطورية ومياه البحر الأبيض المتوسط الفيروزية: تسلق قمة جبل موسى (851 م)، إطلالة 360 درجة على مضيق جبل طارق وجزيرة ليلى، مع تجربة الغوص في بليونش.",
      longDescriptionFr: `Ascension du Jbel Moussa & Paradis Aquatique de Belyounech : Entre Ciel et Mer

Partez pour une immersion dépaysante à la pointe nord du Royaume ! Ce séjour combine le dépassement de soi avec l’ascension du légendaire Jbel Moussa (la colonne d’Hercule marocaine culminant à 851 mètres et offrant un panorama grandiose à 360° sur Gibraltar, les côtes espagnoles et l’îlot Leïla) et la détente absolue au cœur du charmant village de pêcheurs de Belyounech, réputé pour ses eaux limpides et ses fonds marins d'exception.

Un programme complet et soigné :
- Jour 1 (Vendredi) : Regroupement et départs de Casablanca (19h00) et Rabat (20h45). Trajet nocturne tout confort vers le Nord, check-in à l'hébergement et nuitée réparatrice.
- Jour 2 (Samedi) : Petit-déjeuner énergétique inclus. Ascension guidée du Jbel Moussa (~4h de montée à rythme modéré). Au sommet (851m), déjeuner pique-nique face au Détroit de Gibraltar. Descente progressive, douche, dîner traditionnel complet inclus et veillée conviviale entre aventuriers.
- Jour 3 (Dimanche) : Petit-déjeuner face à la mer. Journée détente à la plage de Belyounech avec option Baptême de plongée sous-marine accompagnée par un moniteur certifié (+350 DH) ou baignade dans les piscines naturelles. Déjeuner libre au village (poisson frais) et retour vers Rabat et Casablanca.`,
      longDescriptionAr: `تسلق قمة جبل موسى والجنة البحرية لبليونش : سحر الشمال ومضيق جبل طارق

انطلقوا في مغامرة استثنائية عند أقصى نقطة شمالية للمملكة! رحلة متكاملة تجمع بين التحدي الرياضي وصعود قمة جبل موسى الأسطورية (إحدى أعمدة هرقل التاريخية بارتفاع 851 متراً وإطلالة 360 درجة تحبس الأنفاس على مضيق جبل طارق، السواحل الإسبانية وجزيرة ليلى)، مع الاسترخاء التام بقرية الصيادين بليونش الشهيرة بمياهها الفيروزية النقية وشواطئها العذراء.

برنامج الرحلة :
- الجمعة : انطلاق من الدار البيضاء (19:00) والرباط (20:45)، السفر بحافلة سياحية مكيفة، الوصول والاستقرار بنزل الإقامة والمبيت.
- السبت : فطور الصباح، بداية مسار تسلق جبل موسى رفقة مرشدين محليين (~4 ساعات صعود)، الوصول للقمة وتناول وجبة الغداء أمام مشهد بانورامي عالمي. النزول، استراحة وعشاء تقليدي مغربي مع سهرة تعارف وألعاب.
- الأحد : فطور أمام نسيم البحر، وقت حر بشاطئ بليونش مع خيار تجربة الغوص تحت الماء مع مدرب محترف (+350 درهم) أو السباحة والاستجمام، غداء سمك طازج، ثم رحلة العودة إلى الرباط والدار البيضاء.`,
      includedServicesFr: [
        "Transport touristique climatisé A/R agréé grand confort (Départs Casa & Rabat)",
        "Assurance transport routier touristique",
        "Hébergement de 2 nuitées en structure chaleureuse",
        "Pension partielle : Repas du samedi (petit-déjeuner, déjeuner pique-nique au sommet, dîner traditionnel) + petit-déjeuner du dimanche",
        "Accompagnement par des guides de montagne locaux certifiés",
        "Encadrement professionnel et logistique assurés par l'équipe Rahalat Bladna"
      ],
      includedServicesAr: [
        "نقل سياحي مكيف ومريح ذهاباً وإياباً من الدار البيضاء والرباط",
        "تأمين النقل السياحي الطرقي",
        "مبيت ليلتين في إقامة مريحة ودافئة",
        "نصف إقامة : وجبات السبت (فطور، غداء نزهة بقمة الجبل، عشاء تقليدي) + فطور الأحد",
        "مرافقة وإرشاد من طرف أدلاء جبليين محليين معتمدين",
        "تأطير لوجستي وإداري محترف طيلة أيام الرحلة من فريق رحلات بلادنا"
      ],
      excludedServicesFr: [
        "Déjeuner libre du dimanche (poisson frais au village de Belyounech)",
        "Activité baptême de plongée sous-marine avec moniteur pro (+350 DH)",
        "Dépenses personnelles et pourboires"
      ],
      excludedServicesAr: [
        "غداء يوم الأحد الحر بقرية بليونش (سمك طازج)",
        "نشاط الغوص تحت الماء برفقة مدرب معتمد (+350 درهم)",
        "المصاريف الشخصية والإكراميات"
      ],
      checklistItemsFr: [
        "Bonnes chaussures de marche ou de randonnée (semelle crantée obligatoire)",
        "Maillot de bain, serviette microfibre et chaussures aquatiques",
        "Petit sac à dos d'appoint (15 à 25L) pour la gourde, les collations et la veste",
        "Protection solaire : lunettes polarisées, chapeau/casquette et crème solaire haute protection",
        "Veste coupe-vent légère pour le sommet (851m) où l'air marin peut être vivifiant",
        "Carte d'Identité Nationale (CIN) originale obligatoire"
      ],
      checklistItemsAr: [
        "حذاء مشي أو تسلق جبلي مريح ومضاد للانزلاق",
        "لباس سباحة، منشفة وحذاء مائي للمشي على الصخور",
        "حقيبة ظهر صغيرة (15 إلى 25 لتر) للماء، الوجبة الخفيفة والسترة",
        "واقي الشمس، نظارات شمسية وقبعة",
        "سترة واقية من الرياح لأعالي القمة (علو 851 م)",
        "بطاقة التعريف الوطنية الأصلية إلزامية"
      ],

      // Points de ramassage
      pickupPoints: {
        create: [
          {
            cityName: "Casablanca",
            city: "Casablanca",
            locationNameFr: "Gare Casa-Voyageurs (Devant l'Ibis)",
            locationNameAr: "محطة الدار البيضاء المسافرين (أمام إيبيس)",
            departureTime: "19:00",
            googleMapsUrl: "https://maps.google.com/?q=Gare+Casa+Voyageurs",
            orderIndex: 1,
          },
          {
            cityName: "Rabat",
            city: "Rabat",
            locationNameFr: "Gare Rabat-Ville",
            locationNameAr: "محطة الرباط المدينة",
            departureTime: "20:45",
            googleMapsUrl: "https://maps.google.com/?q=Gare+Rabat+Ville",
            orderIndex: 2,
          },
        ],
      },

      // Étapes d'itinéraire par jour
      itineraryDays: {
        create: [
          {
            dayNumber: 1,
            titleFr: "Vendredi — Départ Nocturne & Cap sur le Nord",
            titleAr: "الجمعة — الانطلاق ليلاً نحو الشمال واستقرار الإقامة",
            timeSlot: "19h00 - 02h00",
            location: "Casablanca - Rabat - Belyounech",
            locationName: "Belyounech",
            featuredImage: "/images/jbel-moussa/coucher-soleil-detroit.jpg",
            meals: ["Collation libre en route"],
            descriptionFr: "19h00 : Regroupement et départ de Casablanca (Gare Casa-Voyageurs). 20h45 : Ramassage à Rabat (Gare Rabat-Ville). Trajet de nuit en autocar touristique climatisé et grand confort avec pauses café. Arrivée à l'hébergement, check-in et nuitée de repos bien méritée.",
            descriptionAr: "19:00: التجمع والانطلاق من الدار البيضاء (محطة المسافرين). 20:45: الانطلاق من الرباط (محطة المدينة). سفر ليلي مريح بحافلة سياحية مكيفة مع توقفات للاستراحة، الوصول للإقامة والمبيت.",
            activityTags: ["Départs Casa & Rabat", "Transport climatisé", "Check-in", "Repos"],
          },
          {
            dayNumber: 2,
            titleFr: "Samedi — Ascension du Jbel Moussa (851m) & Veillée Conviviale",
            titleAr: "السبت — صعود قمة جبل موسى (851 م) وسهرة سمر ممتعة",
            timeSlot: "07h00 - 22h30",
            location: "Jbel Moussa & Belyounech",
            locationName: "Sommet Jbel Moussa",
            featuredImage: "/images/jbel-moussa/sommet-jbel-moussa.jpg",
            meals: ["Petit-déjeuner inclus", "Déjeuner pique-nique inclus", "Dîner complet inclus"],
            descriptionFr: "07h00 : Petit-déjeuner énergétique inclus à l'hébergement. 08h00 : Départ vers le pied du Jbel Moussa. Début du trekking d'ascension : ~4h de montée à un rythme modéré, ponctué de pauses hydratation et shooting photos. Au sommet (851m) : Vue spectaculaire à 360° sur le détroit de Gibraltar, les côtes espagnoles, l'îlot Leïla et la baie turquoise de Belyounech. Pause déjeuner pique-nique face à la mer. Descente progressive. 17h00 : Retour hébergement, douche et repos. 20h00 : Dîner traditionnel complet inclus, veillée d'échange et jeux de société.",
            descriptionAr: "07:00: فطور الصباح الصحي بالإقامة. 08:00: التوجه نحو سفح جبل موسى وبدء مسار الصعود المشوق (~4 ساعات صعود بمرافقة مؤطرين ومحطات تصوير واستراحة). على القمة (851 م): مشهد بانورامي عالمي على مضيق جبل طارق، السواحل الإسبانية وجزيرة ليلى. تناول وجبة الغداء بالقمة. النزول نحو القرية، راحة واستحمام، ثم عشاء مغربي لذيذ وسهرة عائلية مسلية.",
            activityTags: ["Ascension 851m", "Vue 360° Gibraltar", "Déjeuner au sommet", "Dîner & Veillée"],
          },
          {
            dayNumber: 3,
            titleFr: "Dimanche — Paradis Aquatique de Belyounech, Plongée & Retour",
            titleAr: "الأحد — الجنة البحرية لبليونش، تجربة الغوص والعودة",
            timeSlot: "07h30 - 21h00",
            location: "Plage de Belyounech & Baie Turquoise",
            locationName: "Baie de Belyounech",
            featuredImage: "/images/jbel-moussa/baie-turquoise-belyounech.jpg",
            meals: ["Petit-déjeuner inclus"],
            descriptionFr: "07h30 : Réveil face à la brise marine et petit-déjeuner complet inclus. 08h30 : Installation sur la plage féerique de Belyounech avec deux options au choix : Option Aventure (Baptême de plongée sous-marine avec moniteur pro certifié pour explorer les fonds marins du détroit, supplément 350 DH) ou Option Détente (Baignade dans les piscines naturelles cristallines, bronzage et farniente). 14h00 : Déjeuner libre au village (poisson frais au choix). 15h00 : Départ retour. 19h30 : Arrivée à Rabat. 21h00 : Arrivée à Casablanca.",
            descriptionAr: "07:30: فطور الصباح المطل على زرقة البحر. 08:30: الاستقرار بشاطئ بليونش الرائع مع خيارين: خيار المغامرة (تجربة الغوص بالأسطوانة مع مدرب محترف لاكتشاف الأحياء البحرية، +350 درهم) أو خيار الاستجمام والسباحة في المسابح الصخرية الطبيعية. 14:00: غداء سمك طازج حر بالقرية. 15:00: انطلاق رحلة العودة. 19:30: الوصول للرباط، و21:00 بالدار البيضاء.",
            activityTags: ["Plage Belyounech", "Baptême Plongée", "Piscines naturelles", "Retour Casa/Rabat"],
          },
        ],
      },

      // Dates de départ garanties (Prochaine date : 25 au 27 Septembre 2026)
      departureDates: {
        create: [
          {
            startDate: new Date("2026-09-25T19:00:00.000Z"),
            endDate: new Date("2026-09-27T21:00:00.000Z"),
            status: DepartureStatus.GUARANTEED,
            totalCapacity: 28,
            occupiedSeats: 16,
            basePriceDouble: 1150.00,
            priceTriple: 1150.00,
            singleRoomSupplement: 200.00,
            depositAmount: 400.00,
          },
          {
            startDate: new Date("2026-10-02T19:00:00.000Z"),
            endDate: new Date("2026-10-04T21:00:00.000Z"),
            status: DepartureStatus.OPEN_FOR_BOOKING,
            totalCapacity: 28,
            occupiedSeats: 8,
            basePriceDouble: 1150.00,
            priceTriple: 1150.00,
            singleRoomSupplement: 200.00,
            depositAmount: 400.00,
          },
          {
            startDate: new Date("2026-10-09T19:00:00.000Z"),
            endDate: new Date("2026-10-11T21:00:00.000Z"),
            status: DepartureStatus.OPEN_FOR_BOOKING,
            totalCapacity: 28,
            occupiedSeats: 2,
            basePriceDouble: 1150.00,
            priceTriple: 1150.00,
            singleRoomSupplement: 200.00,
            depositAmount: 400.00,
          },
        ],
      },

      // Options et extras
      addons: {
        create: [
          {
            nameFr: "Baptême de Plongée Sous-Marine avec Moniteur Pro",
            nameAr: "تجربة الغوص تحت الماء بالأسطوانة مع مدرب معتمد",
            price: 350.00,
            isPerPerson: true,
            descriptionFr: "Combinaison, bouteille d'oxygène, briefing de sécurité et immersion accompagnée pour explorer les fonds marins exceptionnels du détroit.",
            descriptionAr: "معدات الغوص الكاملة، تأطير احترافي وجولة تحت الماء لاستكشاف أسرار قاع البحر بمضيق جبل طارق.",
          },
          {
            nameFr: "Chambre Individuelle Privée (Supplément Single)",
            nameAr: "غرفة فردية خاصة (سعر السينغل)",
            price: 200.00,
            isPerPerson: true,
            descriptionFr: "Bénéficiez d'une chambre privée pour vous seul(e) durant les 2 nuitées du séjour.",
            descriptionAr: "غرفة خاصة مستقلة طيلة ليلتي المبيت.",
          },
        ],
      },
    },
  });

  console.log(`🎉 Circuit Jbel Moussa inséré avec succès ! ID: ${trip.id}, Slug: ${trip.slug}`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors de l'insertion :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
