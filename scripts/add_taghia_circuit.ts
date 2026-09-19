import { PrismaClient, TripType, TripPublishStatus, DepartureStatus } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const prisma = new PrismaClient();

// Configuration Cloudflare R2
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "3f34309d88ce1f243e9b386553f5a920";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "7ca8a24ccab19c0500c39fc872c8e1c1";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "68c43e7123c88701b4aaa2be80d26a0be8bf46aaa84c3cd8c1a27ede3bbf287a";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "rahalat-bladna";
const R2_PUBLIC_DOMAIN = 
  process.env.NEXT_PUBLIC_R2_URL || 
  process.env.R2_PUBLIC_DOMAIN || 
  "https://pub-a7e412da142148a89892728e019eb7e2.r2.dev";

async function uploadImageToR2IfPossible(localRelativePath: string, r2Key: string): Promise<string> {
  const fullLocalPath = path.join(process.cwd(), "public", localRelativePath.replace(/^\//, ""));
  if (!fs.existsSync(fullLocalPath)) {
    console.log(`Fichier local non trouvé pour R2: ${fullLocalPath}, utilisation du chemin local.`);
    return localRelativePath;
  }

  try {
    const fileBuffer = fs.readFileSync(fullLocalPath);
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });

    const putCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: "image/jpeg",
      CacheControl: "public, max-age=31536000",
    });

    await client.send(putCommand);
    const r2Url = `${R2_PUBLIC_DOMAIN}/${r2Key}`;
    console.log(`✅ Uploadé sur R2 : ${r2Url}`);
    return r2Url;
  } catch (err) {
    console.warn(`⚠️ Échec upload R2 pour ${r2Key}, repli sur chemin public local:`, err);
    return localRelativePath;
  }
}

async function main() {
  console.log("🚀 Insertion du circuit : Taghia, Passage berbère & Zaouiat Ahansal...");

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

  console.log(`🏢 Agence : ${agency.name} (ID: ${agency.id})`);

  // 2. Upload des images sur R2 (ou conservation chemins locaux)
  console.log("📸 Traitement des photos du circuit Taghia...");
  const coverUrl = await uploadImageToR2IfPossible("/images/taghia/cover-taghia.jpg", "trips/taghia/cover-taghia.jpg");
  const escaladeUrl = await uploadImageToR2IfPossible("/images/taghia/escalade-gorges-taghia.jpg", "trips/taghia/escalade-gorges-taghia.jpg");
  const carteUrl = await uploadImageToR2IfPossible("/images/taghia/carte-montagnes-berberes.jpg", "trips/taghia/carte-montagnes-berberes.jpg");
  const giteUrl = await uploadImageToR2IfPossible("/images/taghia/gite-vallee-taghia.jpg", "trips/taghia/gite-vallee-taghia.jpg");
  const coquelicotsUrl = await uploadImageToR2IfPossible("/images/taghia/vallee-coquelicots-taghia.jpg", "trips/taghia/vallee-coquelicots-taghia.jpg");

  const galleryImages = [
    coverUrl,
    escaladeUrl,
    coquelicotsUrl,
    giteUrl,
    carteUrl,
  ];

  const slug = "taghia-passage-berbere-zaouiat-ahansal";

  // Supprimer l'ancien circuit s'il existe déjà
  const existingTrip = await prisma.trip.findUnique({
    where: { slug },
  });

  if (existingTrip) {
    console.log(`⚠️ Circuit existant avec le slug "${slug}". Nettoyage pour mise à jour complète...`);
    await prisma.trip.delete({
      where: { id: existingTrip.id },
    });
    console.log("✅ Ancien circuit nettoyé.");
  }

  // 3. Création du Circuit complet avec relations
  const trip = await prisma.trip.create({
    data: {
      agencyId: agency.id,
      titleFr: "Taghia, Passage berbère & Zaouiat Ahansal",
      titleAr: "تاغية، الممر الأمازيغي وزاوية أحنصال",
      titleEn: "Taghia, Berber Pass & Zaouiat Ahansal",
      slug: slug,
      tripType: TripType.TREKKING_HIKING,
      publishStatus: TripPublishStatus.PUBLISHED,
      durationDays: 3,
      durationNights: 2,
      destinationRegion: "Béni Mellal-Khénifra (Haut Atlas Central - Taghia, Zaouiat Ahansal)",
      departureCity: "Casablanca, Rabat",
      basePrice: 1250.00,
      depositPerPerson: 400.00,
      singleSupplement: 200.00,
      totalSeats: 26,
      minSeatsRequired: 10,
      isFeatured: true,
      isActive: true,
      coverImageUrl: coverUrl,
      galleryImages: galleryImages,

      shortDescriptionFr: "À Taghia tous les ingrédients sont là pour vivre une aventure inoubliable et quêter le sourire dans un village à un rythme de vie authentique, cerné de parois rocheuses spectaculaires et de sources vives.",
      shortDescriptionAr: "في تاغية، تكتمل جميع المقومات لخوض مغامرة لا تُنسى والبحث عن الابتسامة في قرية أصيلة بإيقاع حياة هادئ، محاطة بجدران صخرية شاهقة ومناظر طبيعية ساحرة في قلب الأطلس الكبير الأوسط.",

      longDescriptionFr: `Taghia, Passage berbère & Zaouiat Ahansal : L'Aventure Authentique au Cœur de l'Atlas

À Taghia tous les ingrédients sont là pour vivre une aventure inoubliable et quêter le sourire dans un village à un rythme de vie authentique.
Niché au cœur d’un cirque calcaire majestueux du Haut Atlas Central, le village préservé de Taghia est une destination mythique réputée dans le monde entier pour ses falaises spectaculaires, ses sources d'eau pure, ses passages berbères vertigineux façonnés par les bergers et la générosité légendaire de ses habitants.

Ce séjour complet de 3 jours vous propose :
- Traversée de paysages grandioses et immersion dans la culture berbère authentique.
- Randonnée spectaculaire à travers le célèbre passage berbère en bois et pierres (5h de marche en rythme moyen).
- Découverte des magnifiques cascades, des sources vives d'Oued Ahansal et détente au cœur des prairies fleuries.
- Possibilité unique de s'initier à l'escalade dans les gorges de Taghia encadrée par des moniteurs expérimentés.
- Hébergement chaleureux en gîte / maison d'hôte avec vue imprenable sur les parois du cirque calcaire.
- Soirées conviviales, jeux de société et observation des étoiles depuis la terrasse du gîte.`,

      longDescriptionAr: `تاغية، الممر الأمازيغي وزاوية أحنصال : مغامرة أصيلة في قلب الأطلس الشامخ

في تاغية، تكتمل جميع المقومات لخوض مغامرة استثنائية لا تُنسى والبحث عن الابتسامة في قرية جبلية أصيلة تنبض بالسكينة والبساطة.
تقع قرية تاغية في منخفض جبلي كلسي مهيب بالأطلس الكبير الأوسط قرب زاوية أحنصال، وتشتهر عالمياً بجدرانها الصخرية الشاهقة، وينابيعها العذبة المتدفقة، وممراتها التاريخية المعلقة على حافة الجروف التي شيدها الرعاة الأمازيغ بإتقان، فضلاً عن كرم وضيافة أهلها.

برنامج متكامل على مدى 3 أيام يشمل:
- مشي جبلي شيق عبر الممر الأمازيغي الشهير (حوالي 5 ساعات مشي بإيقاع متوازن ومناظر بانورامية خلابة).
- اكتشاف وادي تاغية، الشلالات الرائعة، وينابيع واد أحنصال العذبة.
- تجربة فريدة لتسلق الصخور في أحد أشهر المواقع العالمية بإشراف وتأطير احترافي.
- إقامة دافئة بنزل جبلي تقليدي (دار ضيافة) مع إطلالة تحبس الأنفاس على قمم الأطلس.
- سهرات سمر مسلية، ألعاب جماعية والاستمتاع بسماء الليل المرصعة بالنجوم من شرفة النزل.`,

      overviewFr: `3 Jours / 2 Nuitées d'émerveillement et de déconnexion totale en pleine montagne, encadrés par des professionnels passionnés.`,
      overviewAr: `3 أيام / ليلتان من الدهشة والراحة التامة في أحضان الطبيعة الجبلية العذراء.`,
      showOverview: true,

      includedServicesFr: [
        "Transport touristique climatisé et confortable A/R (Départs Casablanca et Rabat)",
        "Assurance de transport touristique",
        "Transport local et transferts nécessaires",
        "Hébergement en Gîte chaleureux (Maison d’hôte)",
        "Petit déjeuner, déjeuner et dîner du deuxième jour (inclus)",
        "Petit déjeuner et déjeuner du troisième jour (inclus)",
        "Service d’un guide local certifié et expérimenté",
        "Encadrement de qualité et assistance 24/7 par l'équipe Rahalat Bladna"
      ],

      includedServicesAr: [
        "نقل سياحي مريح ومكيف ذهاباً وإياباً من الدار البيضاء والرباط",
        "تأمين النقل السياحي الطرقي",
        "النقل المحلي والتنقلات الضرورية",
        "الإقامة في نزل جبلي دافئ وتقليدي (دار ضيافة)",
        "وجبات اليوم الثاني كاملة: فطور الصباح، الغداء والعشاء (متضمنة)",
        "وجبات اليوم الثالث: فطور الصباح والغداء (متضمنة)",
        "مرافقة وإرشاد من طرف دليل محلي جبلي معتمد",
        "تأطير محترف عالي الجودة ومساعدة مستمرة من فريق رحلات بلادنا"
      ],

      excludedServicesFr: [
        "Dépenses personnelles et extras non mentionnés",
        "Pourboires pour l'équipe locale et chauffeur",
        "Activité optionnelle d'escalade dans les gorges (100 DH)"
      ],

      excludedServicesAr: [
        "المصاريف الشخصية والمقتنيات الخاصة",
        "الإكراميات لطاقم الرحلة والسائق",
        "نشاط تسلق الصخور الاختياري في المضايق (100 درهم)"
      ],

      checklistItemsFr: [
        "Chaussures de randonnée montantes ou avec semelle crantée",
        "Sac à dos adapté à la marche",
        "Lunettes de soleil et protection solaire (chapeau / casquette, crème solaire)",
        "Pharmacie personnelle et trousse de toilette",
        "Sac à dos d'appoint de 10 à 20 litres pour les petits objets (bouteille d’eau, appareil photo, veste...)",
        "Votre patience, votre bonne humeur et un grand sourire !"
      ],

      checklistItemsAr: [
        "حذاء مشي جبلي متين ومريح مضاد للانزلاق",
        "حقيبة ظهر مناسبة للمشي الجبلي",
        "نظارات شمسية وواقي شمسي وقبعة للحماية من الشمس",
        "صيدلية شخصية ومستلزمات النظافة",
        "حقيبة ظهر صغيرة (10 إلى 20 لتر) لقنينة الماء والهاتف والسترة",
        "صبركم الجميل، ابتسامتكم العريضة وروح المغامرة !"
      ],

      // Points de ramassage
      pickupPoints: {
        create: [
          {
            cityName: "Rabat",
            city: "Rabat",
            locationNameFr: "Devant la gare de Rabat-Ville",
            locationNameAr: "أمام محطة قطار الرباط المدينة",
            departureTime: "19:00",
            googleMapsUrl: "https://maps.google.com/?q=Gare+Rabat+Ville",
            orderIndex: 1,
          },
          {
            cityName: "Casablanca",
            city: "Casablanca",
            locationNameFr: "Devant la gare de Casa-Voyageurs",
            locationNameAr: "أمام محطة قطار الدار البيضاء المسافرين",
            departureTime: "20:30",
            googleMapsUrl: "https://maps.google.com/?q=Gare+Casa+Voyageurs",
            orderIndex: 2,
          },
        ],
      },

      // Programme détaillé par jour
      itineraryDays: {
        create: [
          {
            dayNumber: 1,
            titleFr: "Départ Nocturne de Rabat & Casablanca — Cap sur Zaouiat Ahansal",
            titleAr: "الانطلاق ليلاً من الرباط والدار البيضاء — التوجه نحو زاوية أحنصال",
            timeSlot: "19h00 - 02h00",
            location: "Rabat - Casablanca - Zaouiat Ahansal",
            locationName: "Zaouiat Ahansal",
            featuredImage: carteUrl,
            meals: ["Collation libre en route"],
            activityTags: ["Départ Rabat 19h00", "Départ Casa 20h30", "Transport climatisé", "Arrivée nocturne"],
            descriptionFr: `19h00 : Départ de Rabat (devant la gare de Rabat ville).
20h30 : Départ de Casablanca (devant la gare de Casa voyageur).
Voyage de nuit en autocar touristique climatisé et grand confort avec pauses en route. Arrivée à destination, accueil et nuitée réparatrice pour démarrer l'aventure en pleine forme.`,
            descriptionAr: `19:00 : الانطلاق من مدينة الرباط (أمام محطة قطار الرباط المدينة).
20:30 : الانطلاق من مدينة الدار البيضاء (أمام محطة قطار كازا المسافرين).
رحلة ليلية مريحة في حافلة سياحية مكيفة مع محطات استراحة على الطريق. الوصول والاستقرار للمبيت استعداداً لانطلاق المغامرة بكل طاقة ونشاط.`,
          },
          {
            dayNumber: 2,
            titleFr: "Randonnée du Passage Berbère (5h), Cascades de Taghia & Soirée au Gîte",
            titleAr: "مسار الممر الأمازيغي (5 ساعات)، شلالات تاغية وسهرة النزل",
            timeSlot: "09h00 - 22h30",
            location: "Taghia & Passage Berbère",
            locationName: "Vallée de Taghia",
            featuredImage: coquelicotsUrl,
            meals: ["Petit-déjeuner inclus", "Déjeuner inclus", "Dîner inclus"],
            activityTags: ["Passage berbère (5h)", "Déjeuner au gîte", "Cascades de Taghia", "Dîner & Jeux de société"],
            descriptionFr: `Arrivée et nuitée.
09h00 : Petit déjeuner complet au gîte (inclus).
10h00 : Départ vers le mythique passage berbère (5h de randonnée en rythme moyen avec des panoramas vertigineux).
15h30 : Déjeuner savoureux au gîte à Taghia (inclus).
16h30 : Balade dans la magnifique vallée de Taghia et appréciation de sa nature généreuse et de ses cascades cristallines.
18h00 : Retour au gîte, douche et repos bien mérité.
20h30 : Dîner traditionnel complet (inclus).
Animation et jeux de société, profiter du temps de repos pour contempler la splendide vue nocturne étoilée depuis la terrasse du gîte.`,
            descriptionAr: `الوصول والاستقرار.
09:00 : تناول وجبة فطور الصباح المتكاملة بالنزل (متضمنة).
10:00 : انطلاق مسار المشي نحو الممر الأمازيغي الأسطوري (5 ساعات مشي جبلي بإيقاع متوسط وإطلالات تحبس الأنفاس).
15:30 : وجبة غداء تقليدية شهية بالنزل في تاغية (متضمنة).
16:30 : جولة استكشافية بوادي تاغية الساحر، الاستمتاع بخرير المياه والشلالات والطبيعة الأخاذة.
18:00 : العودة إلى النزل، دوش واستراحة منعشة.
20:30 : وجبة عشاء مغربية دافئة (متضمنة).
سهرة سمر وألعاب جماعية ممتعة، مع فرصة لتأمل السماء الصافية والنجوم البراقة من شرفة النزل.`,
          },
          {
            dayNumber: 3,
            titleFr: "Gorges de Taghia, Escalade ou Sources d'Oued Ahansal & Trajet Retour",
            titleAr: "مضايق تاغية، تجربة التسلق أو ينابيع واد أحنصال ورحلة العودة",
            timeSlot: "07h00 - 21h30",
            location: "Gorges de Taghia & Zaouiat Ahansal",
            locationName: "Gorges & Sources de Taghia",
            featuredImage: escaladeUrl,
            meals: ["Petit-déjeuner inclus", "Déjeuner inclus"],
            activityTags: ["Initiation Escalade", "Sources Oued Ahansal", "Déjeuner inclus", "Retour Casa & Rabat"],
            descriptionFr: `07h00 : Petit déjeuner (inclus).
07h30 : Départ vers les impressionnantes gorges et sources de Taghia pour l’activité d'escalade (100 DH : Exclusivement Rahalat Bladna avec matériel et encadrement) ou une magnifique balade le long des sources d’Oued Ahansal.
11h30 : Déjeuner convivial (inclus) et marche retour vers Zaouiat Ahansal (environ 2h30).
14h00 : Départ en autocar pour le trajet retour vers Casablanca et Rabat.
20h30 : Arrivée à Casablanca.
21h30 : Arrivée à Rabat.

N.B : En cas de force majeure, le club se réserve le droit de modifier le programme selon les circonstances du voyage en priorisant toujours la sécurité des voyageurs et le bon déroulement du programme.`,
            descriptionAr: `07:00 : فطور الصباح الصحي (متضمن).
07:30 : التوجه نحو مضايق وينابيع تاغية المهيبة لخوض تجربة تسلق الصخور العالمية (100 درهم : حصرياً مع رحلات بلادنا مع المعدات والتأطير الكامل) أو القيام بجولة ممتعة بجوار ينابيع واد أحنصال.
11:30 : وجبة غداء لذيذة (متضمنة) وبدء مسار العودة المشي نحو زاوية أحنصال (حوالي ساعتين ونصف).
14:00 : انطلاق رحلة العودة بالحافلة السياحية نحو الدار البيضاء والرباط.
20:30 : الوصول إلى الدار البيضاء.
21:30 : الوصول إلى الرباط.

ملاحظة : في حالة القوة القاهرة، يحتفظ النادي بالحق في تعديل البرنامج وفق ظروف الرحلة مع إعطاء الأولوية القصوى دائماً لسلامة المسافرين وحسن سير البرنامج.`,
          },
        ],
      },

      // Dates de départs programmées
      departureDates: {
        create: [
          {
            startDate: new Date("2026-10-02T19:00:00.000Z"),
            endDate: new Date("2026-10-04T21:30:00.000Z"),
            status: DepartureStatus.GUARANTEED,
            totalCapacity: 26,
            occupiedSeats: 14,
            basePriceDouble: 1250.00,
            priceTriple: 1250.00,
            singleRoomSupplement: 200.00,
            depositAmount: 400.00,
          },
          {
            startDate: new Date("2026-10-09T19:00:00.000Z"),
            endDate: new Date("2026-10-11T21:30:00.000Z"),
            status: DepartureStatus.OPEN_FOR_BOOKING,
            totalCapacity: 26,
            occupiedSeats: 8,
            basePriceDouble: 1250.00,
            priceTriple: 1250.00,
            singleRoomSupplement: 200.00,
            depositAmount: 400.00,
          },
          {
            startDate: new Date("2026-10-16T19:00:00.000Z"),
            endDate: new Date("2026-10-18T21:30:00.000Z"),
            status: DepartureStatus.OPEN_FOR_BOOKING,
            totalCapacity: 26,
            occupiedSeats: 4,
            basePriceDouble: 1250.00,
            priceTriple: 1250.00,
            singleRoomSupplement: 200.00,
            depositAmount: 400.00,
          },
          {
            startDate: new Date("2026-10-23T19:00:00.000Z"),
            endDate: new Date("2026-10-25T21:30:00.000Z"),
            status: DepartureStatus.OPEN_FOR_BOOKING,
            totalCapacity: 26,
            occupiedSeats: 0,
            basePriceDouble: 1250.00,
            priceTriple: 1250.00,
            singleRoomSupplement: 200.00,
            depositAmount: 400.00,
          },
        ],
      },

      // Options et suppléments (Activité Escalade)
      addons: {
        create: [
          {
            nameFr: "Activité d'escalade dans les gorges de Taghia",
            nameAr: "نشاط تسلق الصخور بمضايق تاغية",
            price: 100.00,
            isPerPerson: true,
            descriptionFr: "Initiation et grimpe encadrée sur les parois mythiques de Taghia. Matériel complet fourni (cordes, baudriers, casques, mousquetons) avec moniteur expérimenté (Exclusivement avec Rahalat Bladna).",
            descriptionAr: "تجربة تسلق فريدة ومؤطرة على جدران تاغية الصخرية الشهيرة عالمياً. المعدات الكاملة متوفرة (حبال، أحزمة، خوذات) برفقة مدربين محترفين (حصرياً مع رحلات بلادنا).",
          },
          {
            nameFr: "Supplément Chambre Individuelle (Single)",
            nameAr: "غرفة فردية خاصة (سعر السينغل)",
            price: 200.00,
            isPerPerson: true,
            descriptionFr: "Chambre privée individuelle au gîte pour l'ensemble du séjour.",
            descriptionAr: "غرفة خاصة مستقلة بالنزل طيلة فترة الإقامة.",
          },
        ],
      },
    },
  });

  console.log(`\n🎉 Circuit Taghia créé avec succès !`);
  console.log(`📌 ID : ${trip.id}`);
  console.log(`📌 Slug : ${trip.slug}`);
  console.log(`📌 Titre : ${trip.titleFr}`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors de l'insertion :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
