import { PrismaClient, TripType, TripPublishStatus, DepartureStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Insertion du circuit : Moyen Atlas Confort (Auberge Jomana Park)...");

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

  const slug = "voyage-azrou-zaouiat-ifrane";

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
      titleFr: "Moyen Atlas Confort : Séjour Évasion au Cœur du Moyen Atlas",
      titleAr: "الأطلس المتوسط المريح : رحلة الاستجمام والاستكشاف (أزرو، أم الربيع، زاوية إفران)",
      titleEn: "Middle Atlas Comfort: Escape in Azrou, Zaouiat Ifrane & Oum Er-Rbia",
      slug: slug,
      tripType: TripType.WEEKEND_BREAK,
      publishStatus: TripPublishStatus.PUBLISHED,
      durationDays: 3,
      durationNights: 2,
      destinationRegion: "Moyen Atlas (Azrou - Oum Er-Rbia - Zaouiat Ifrane - Ifrane)",
      departureCity: "Casablanca, Rabat",
      basePrice: 1300.00,
      depositPerPerson: 400.00,
      singleSupplement: 250.00,
      totalSeats: 30,
      minSeatsRequired: 8,
      isFeatured: true,
      isActive: true,
      coverImageUrl: "/images/moyen-atlas/cover-moyen-atlas.jpg",
      galleryImages: [
        "/images/moyen-atlas/facade-jomana.jpg",
        "/images/moyen-atlas/piscine-jomana.jpg",
        "/images/moyen-atlas/sources-oum-er-rbia.jpg",
        "/images/moyen-atlas/chambre-jomana.jpg",
        "/images/moyen-atlas/salon-jomana.jpg",
      ],
      shortDescriptionFr: "Échappée ressourçante de 3 jours / 2 nuits à l'Auberge Jomana Park avec ses 2 piscines, découverte des féeriques Sources d'Oum Er-Rbia, des cascades secrètes de Zaouiat Ifrane et de la forêt de cèdres.",
      shortDescriptionAr: "عطلة ساحرة لـ 3 أيام وليلتين بنزل جمانة بارك مع مسبحين (منهما مسبح خاص بالنساء)، جولة في منابع أم الربيع الخلابة، شلالات زاوية إفران وغابات الأرز العريقة بأزرو وإفران.",
      longDescriptionFr: `Séjour Évasion au Cœur du Moyen Atlas : Le Confort au Vert

Offrez-vous une parenthèse enchantée au grand air du Moyen Atlas, alliant la fraîcheur vivifiante des montagnes rifo-atlasiques, la splendeur des sources d'eau vive et le confort douillet de l'Auberge Jomana Park. Idéalement située entre Azrou et Ifrane, cette auberge de charme vous accueille dans un cadre verdoyant d'exception avec ses 2 piscines (dont un bassin privatif réservé aux femmes), ses espaces de détente et ses chambres tout confort.

Un programme équilibré entre détente aquatique et merveilles naturelles :
- Jour 1 : Départ depuis Casablanca (10h00) et Rabat (11h30). Arrivée et check-in à l'Auberge Jomana Park, après-midi farniente au bord de la piscine, promenade crépusculaire dans les ruelles artisanales d'Azrou et dîner convivial de terroir inclus.
- Jour 2 : Excursion majeure aux Sources d'Oum Er-Rbia avec ses cascades cristallines et ses déjeuners typiques les pieds dans l'eau. Randonnée rafraîchissante vers les cascades de Zaouiat Ifrane et soirée animée dans la 'Petite Suisse' marocaine à Ifrane.
- Jour 3 : Matinée détente à la piscine de l'auberge, immersion dans la Forêt des Cèdres millénaires à la rencontre des macaques de Barbarie au Cèdre Gouraud, avant un retour tout confort vers Rabat et Casablanca.`,
      longDescriptionAr: `رحلة استجمام ساحرة في قلب الأطلس المتوسط : راحة وطبيعة خلابة

استمتعوا بعطلة نهاية أسبوع مميزة تجمع بين روعة الطبيعة العذراء، شلالات المياه النقية، والراحة التامة في نزل "جمانة بارك" الفاخر. يتميز النزل بموقعه الاستراتيجي الهادئ بين أزرو وإفران، ويوفر مسبحين رائعين (أحدهما خاص ومستقل بالنساء للأمان والخصوصية)، مساحات خضراء، غرف مريحة، وأجواء عائلية ممتعة.

برنامج متكامل بين الاسترخاء والمغامرة :
- اليوم الأول: انطلاق من الدار البيضاء (10:00) والرباط (11:30)، الوصول والاستقرار بنزل جمانة بارك، وقت سباحة واسترخاء، جولة مسائية في أزرو وعشاء جماعي لذيذ.
- اليوم الثاني: استكشاف منابع أم الربيع وشلالاتها الطبيعية، غداء تقليدي بقرية زاوية إفران الساحرة ومسار مائي بين الوديان، ثم سهرة مسائية بمدينة إفران.
- اليوم الثالث: سباحة صباحية بالنزل، زيارة غابة أرز غورو ومداعبة قردة المكاك البربرية، ثم العودة المريحة إلى الرباط والدار البيضاء.`,
      includedServicesFr: [
        "Transport touristique climatisé grand confort A/R (Départs Casablanca & Rabat)",
        "2 nuits d'hébergement à l'Auberge Jomana Park (Chambres Double ou Triple)",
        "2 petits-déjeuners complets à l'auberge",
        "1 déjeuner local traditionnel le samedi à Zaouiat Ifrane",
        "1 dîner de bienvenue savoureux le vendredi soir",
        "Guide local passionné et accompagnement touristique Rahalat Bladna",
        "Accès libre aux 2 piscines (dont piscine privée femmes) et commodités du parc"
      ],
      includedServicesAr: [
        "نقل سياحي مكيف ومريح ذهاباً وإياباً من الدار البيضاء والرباط",
        "مبيت ليلتين بنزل جمانة بارك (غرف مزدوجة أو ثلاثية حسب الرغبة)",
        "وجبتا إفطار كاملتان بالنزل",
        "وجبة غداء محلية تقليدية يوم السبت بزاوية إفران",
        "وجبة عشاء ترحيبية يوم الجمعة مساءً",
        "مرشد ومرافق سياحي معتمد طيلة الرحلة",
        "استفادة مجانية من المسبحين (مسبح عام ومسبح خاص بالنساء) ومرافق النزل"
      ],
      excludedServicesFr: [
        "Dîner libre du samedi soir à Ifrane",
        "Déjeuner libre du dimanche",
        "Dépenses personnelles et pourboires"
      ],
      excludedServicesAr: [
        "عشاء يوم السبت الحر بمدينة إفران",
        "غداء يوم الأحد الحر",
        "المصاريف الشخصية والإكراميات"
      ],
      checklistItemsFr: [
        "Maillot et serviette de bain pour profiter des piscines de l'auberge",
        "Chaussures de marche légères et adhérentes pour Oum Er-Rbia et Zaouiat Ifrane",
        "Veste ou pull pour la fraîcheur des soirées à Ifrane et Azrou",
        "Casquette, lunettes de soleil et crème solaire",
        "Pochette étanche ou coque de protection pour le téléphone"
      ],
      checklistItemsAr: [
        "ملابس سباحة ومنشفة للاستمتاع بمسابح النزل",
        "حذاء مشي خفيف ومناسب للمسارات المائية بأم الربيع وزاوية إفران",
        "سترة أو لباس دافئ لنسيم المساء المنعش بإفران وأزرو",
        "قبعة شمسية، نظارات وواقي الشمس",
        "حافظة هاتف مقاومة للماء لالتقاط أروع الصور"
      ],

      // Points de ramassage
      pickupPoints: {
        create: [
          {
            cityName: "Casablanca",
            city: "Casablanca",
            locationNameFr: "Gare Casa-Voyageurs (Devant l'Ibis)",
            locationNameAr: "محطة الدار البيضاء المسافرين (أمام إيبيس)",
            departureTime: "10:00",
            googleMapsUrl: "https://maps.google.com/?q=Gare+Casa+Voyageurs",
            orderIndex: 1,
          },
          {
            cityName: "Rabat",
            city: "Rabat",
            locationNameFr: "Gare Rabat-Ville",
            locationNameAr: "محطة الرباط المدينة",
            departureTime: "11:30",
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
            titleFr: "Départ, Installation à l'Auberge Jomana Park & Soirée Azrou",
            titleAr: "الانطلاق، الاستقرار بنزل جمانة بارك وسهرة أزرو",
            timeSlot: "10h00 - 22h00",
            location: "Azrou - Auberge Jomana Park",
            locationName: "Auberge Jomana Park",
            featuredImage: "/images/moyen-atlas/facade-jomana.jpg",
            meals: ["Dîner inclus"],
            descriptionFr: "Départ depuis Casablanca (10h00) puis Rabat (11h30). Trajet panoramique vers le Moyen Atlas. Arrivée à l'Auberge Jomana Park, accueil chaleureux et check-in dans vos chambres confortables. Après-midi détente au bord des piscines (dont une privée femmes). En fin de journée, balade découverte dans la ville d'Azrou et ses coopératives de bois de cèdre. Dîner convivial de bienvenue inclus à l'auberge.",
            descriptionAr: "انطلاق الرحلة من الدار البيضاء (10:00) ثم الرباط (11:30). التوجه نحو جبال الأطلس المتوسط، الوصول لنزل جمانة بارك والاستقرار بالغرف. استرخاء وسباحة بالمسابح، جولة بمدينة أزرو وسوق الحرفيين، ثم عشاء ترحيبي لذيذ بالنزل.",
            activityTags: ["Check-in Auberge", "Piscines", "Balade Azrou", "Dîner inclus"],
          },
          {
            dayNumber: 2,
            titleFr: "Sources d'Oum Er-Rbia, Cascades de Zaouiat Ifrane & Soirée Ifrane",
            titleAr: "شلالات ومنابع أم الربيع، سحر زاوية إفران وسهرة إفران",
            timeSlot: "08h30 - 22h30",
            location: "Oum Er-Rbia & Zaouiat Ifrane",
            locationName: "Sources Oum Er-Rbia",
            featuredImage: "/images/moyen-atlas/sources-oum-er-rbia.jpg",
            meals: ["Petit-déjeuner", "Déjeuner local"],
            descriptionFr: "Petit-déjeuner copieux face à la nature. Excursion aux célèbres Sources d'Oum Er-Rbia jaillissant de la falaise (47 sources d'eau douce et salée). Déjeuner traditionnel les pieds dans l'eau à Zaouiat Ifrane, village berbère authentique réputé pour ses cascades en terrasses et ses maisons en pierre. En fin d'après-midi, virée nocturne dans la charmante ville d'Ifrane avant le retour à l'auberge.",
            descriptionAr: "فطور لذيذ بالنزل ثم التوجه نحو منابع أم الربيع الشهيرة وشلالاتها المنبثقة من أعماق الجبال. غداء بلدي شهي بقرية زاوية إفران العذراء، والتجول بين الشلالات والمسارات الطبيعية. سهرة مسائية بمدينة إفران ثم العودة للنزل.",
            activityTags: ["Sources Oum Er-Rbia", "Déjeuner local", "Randonnée cascades", "Sortie nocturne Ifrane"],
          },
          {
            dayNumber: 3,
            titleFr: "Matinée Farniente Piscine, Cèdre Gouraud & Retour",
            titleAr: "سباحة واستجمام، شجرة كورو التاريخية والعودة",
            timeSlot: "09h00 - 19h30",
            location: "Forêt des Cèdres - Cèdre Gouraud",
            locationName: "Cèdre Gouraud",
            featuredImage: "/images/moyen-atlas/piscine-jomana.jpg",
            meals: ["Petit-déjeuner"],
            descriptionFr: "Petit-déjeuner à l'auberge suivi d'une matinée détente complète : baignade dans les piscines, séances de bronzage et balade dans les espaces verts du parc. Après le check-out, immersion dans la splendide Forêt des Cèdres d'Azrou au site légendaire du Cèdre Gouraud pour observer les singes magots dans leur habitat naturel. Pause déjeuner libre sur la route et retour confortable en fin de journée à Rabat et Casablanca.",
            descriptionAr: "فطور الصباح بالنزل ثم وقت حر للاستجمام والسباحة بمسبح النزل والاستمتاع بالمساحات الخضراء. بعد إخلاء الغرف، زيارة المعلم التاريخي 'أرز غورو' والتفاعل مع قردة المكاك بالهواء الطلق. ثم رحلة العودة المريحة نحو الرباط والدار البيضاء.",
            activityTags: ["Matinée piscine", "Forêt des cèdres", "Cèdre Gouraud & Macaques", "Retour Casa/Rabat"],
          },
        ],
      },

      // Dates de départ garanties (Fréquence : Chaque vendredi)
      departureDates: {
        create: [
          {
            startDate: new Date("2026-09-18T10:00:00.000Z"),
            endDate: new Date("2026-09-20T19:30:00.000Z"),
            status: DepartureStatus.GUARANTEED,
            totalCapacity: 30,
            occupiedSeats: 14,
            basePriceDouble: 1300.00,
            priceTriple: 1300.00,
            singleRoomSupplement: 250.00,
            depositAmount: 400.00,
          },
          {
            startDate: new Date("2026-09-25T10:00:00.000Z"),
            endDate: new Date("2026-09-27T19:30:00.000Z"),
            status: DepartureStatus.GUARANTEED,
            totalCapacity: 30,
            occupiedSeats: 10,
            basePriceDouble: 1300.00,
            priceTriple: 1300.00,
            singleRoomSupplement: 250.00,
            depositAmount: 400.00,
          },
          {
            startDate: new Date("2026-10-02T10:00:00.000Z"),
            endDate: new Date("2026-10-04T19:30:00.000Z"),
            status: DepartureStatus.OPEN_FOR_BOOKING,
            totalCapacity: 30,
            occupiedSeats: 4,
            basePriceDouble: 1300.00,
            priceTriple: 1300.00,
            singleRoomSupplement: 250.00,
            depositAmount: 400.00,
          },
          {
            startDate: new Date("2026-10-09T10:00:00.000Z"),
            endDate: new Date("2026-10-11T19:30:00.000Z"),
            status: DepartureStatus.OPEN_FOR_BOOKING,
            totalCapacity: 30,
            occupiedSeats: 0,
            basePriceDouble: 1300.00,
            priceTriple: 1300.00,
            singleRoomSupplement: 250.00,
            depositAmount: 400.00,
          },
        ],
      },

      // Options et extras
      addons: {
        create: [
          {
            nameFr: "Chambre Individuelle Privée (Supplément Single)",
            nameAr: "غرفة فردية خاصة (سعر السينغل)",
            price: 250.00,
            isPerPerson: true,
            descriptionFr: "Bénéficiez d'une chambre privée pour vous seul(e) durant les 2 nuits à l'Auberge.",
            descriptionAr: "غرفة خاصة مستقلة طيلة ليلتي المبيت بالنزل.",
          },
          {
            nameFr: "Pack Remise Groupe (Dès 3 personnes)",
            nameAr: "عرض المجموعة (ابتداءً من 3 أشخاص)",
            price: 0.00,
            isPerPerson: false,
            descriptionFr: "Remise spéciale appliquée automatiquement pour toute réservation de 3 participants ou plus.",
            descriptionAr: "تخفيض استثنائي يطبق للمجموعات ابتداءً من 3 مسافرين.",
          },
        ],
      },
    },
  });

  console.log(`🎉 Circuit inséré avec succès ! ID: ${trip.id}, Slug: ${trip.slug}`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors de l'insertion :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
