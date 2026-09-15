import { PrismaClient, TeamRole, PartnerType, PartnerStatus, BookingStatus, PaymentStatus, TravelerCategory, QuoteStatus, InvoiceStatus, PaymentType, PaymentMethod } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du Seed - Base de Données Rahalat Bladna...");

  // 1. Agence Officielle
  const agency = await prisma.agency.upsert({
    where: { slug: "atlas-sahara-voyages" },
    update: {},
    create: {
      name: "Atlas & Sahara Voyages SARL",
      slug: "atlas-sahara-voyages",
      licenseNumber: "LIC-MAR-2024/889",
      phone: "+212 681-024758",
      email: "machaibare@gmail.com",
      city: "Casablanca",
      address: "Angle Boulevard Zerktouni et Rue Anfa, Casablanca",
      iceNumber: "002891048000034",
      rcNumber: "RC-CASA-489201",
      isActive: true,
    },
  });

  console.log(`✅ Agence: ${agency.name}`);

  // 2. Super Administrateur
  const adminPasswordHash = await bcrypt.hash("Amine305+", 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: "machaibare@gmail.com" },
    update: {
      role: "SUPER_ADMIN",
      passwordHash: adminPasswordHash,
      fullName: "Mohammed Amine Chaibar",
      name: "Mohammed Amine Chaibar",
      phone: "+212603660658",
      cinOrPassport: "BK239014",
      isVerified: true,
      isProfileComplete: true,
      agencyId: agency.id,
    },
    create: {
      email: "machaibare@gmail.com",
      passwordHash: adminPasswordHash,
      name: "Mohammed Amine Chaibar",
      fullName: "Mohammed Amine Chaibar",
      phone: "+212603660658",
      cinOrPassport: "BK239014",
      role: "SUPER_ADMIN",
      isVerified: true,
      isProfileComplete: true,
      emailVerified: new Date(),
      agencyId: agency.id,
    },
  });

  console.log(`✅ Super Admin: ${superAdmin.email}`);

  // 3. Membres de l'Équipe
  const staffOrganisateur = await prisma.teamMember.upsert({
    where: { email: "machaibare@gmail.com" },
    update: {},
    create: {
      fullName: "Mohammed Amine Chaibar",
      phone: "+212 603-660658",
      email: "machaibare@gmail.com",
      role: TeamRole.SUPER_ADMIN,
      canScanTickets: true,
      canViewManifest: true,
      canCollectCash: true,
      canEditTrips: true,
      notes: "Directeur des Opérations & Chef de convoi agréé.",
    },
  });

  const staffGuide = await prisma.teamMember.upsert({
    where: { email: "hassan.alami@rahalatbladna.ma" },
    update: {},
    create: {
      fullName: "Hassan Alami",
      phone: "+212 661-112233",
      email: "hassan.alami@rahalatbladna.ma",
      role: TeamRole.OFFICIAL_GUIDE,
      canScanTickets: true,
      canViewManifest: true,
      canCollectCash: false,
      notes: "Guide culturel assermenté trilingue (Arabe, Français, Anglais).",
    },
  });

  const staffChauffeur = await prisma.teamMember.upsert({
    where: { email: "mohamed.bakkali@trans-voyages.ma" },
    update: {},
    create: {
      fullName: "Mohamed El Bakkali",
      phone: "+212 661-554433",
      email: "mohamed.bakkali@trans-voyages.ma",
      role: TeamRole.DRIVER,
      canScanTickets: true,
      canViewManifest: false,
      canCollectCash: false,
      notes: "Chauffeur professionnel TIST 15 ans d'expérience grands circuits.",
    },
  });

  const staffSurveillant = await prisma.teamMember.upsert({
    where: { email: "yassine.bennani@rahalatbladna.ma" },
    update: {},
    create: {
      fullName: "Yassine Bennani",
      phone: "+212 663-778899",
      email: "yassine.bennani@rahalatbladna.ma",
      role: TeamRole.TOUR_LEADER,
      canScanTickets: true,
      canViewManifest: true,
      canCollectCash: true,
      notes: "Chef de voyage et secouriste certifié Croissant-Rouge.",
    },
  });

  console.log("✅ 4 Membres de l'Équipe créés.");

  // 4. Partenaires (Hôtels / Bivouacs et Transporteurs)
  const partnerHotelMerzouga = await prisma.partner.create({
    data: {
      type: PartnerType.HOTEL_AUBERGE,
      companyName: "Bivouac de Luxe Merzouga Stars",
      contactName: "Brahim Oubassou",
      phone: "+212 662-889900",
      city: "Merzouga (Erg Chebbi)",
      rateDetails: "450 MAD / nuitée par personne en demi-pension + soirée feu de camp Gnawa",
      capacity: 50,
    },
  });

  const partnerHotelChefchaouen = await prisma.partner.create({
    data: {
      type: PartnerType.HOTEL_AUBERGE,
      companyName: "Hôtel Riad Akchour & Chefchaouen",
      contactName: "Mme Noura Tazi",
      phone: "+212 661-445566",
      city: "Chefchaouen",
      rateDetails: "350 MAD / nuitée par personne avec petit déjeuner buffet marocain",
      capacity: 36,
    },
  });

  const partnerTransportCasablanca = await prisma.partner.create({
    data: {
      type: PartnerType.TRANSPORT_TOURISTIQUE,
      companyName: "Trans Touristique Al Baraka SARL",
      contactName: "Haj Larbi Bakkali",
      phone: "+212 661-332211",
      city: "Casablanca",
      rateDetails: "Forfait autocar 4500 MAD (3 jours) carburant et péages inclus",
      capacity: 48,
      vehicleType: "Autocar 48 places Mercedes Travego",
      plateNumber: "45210|A|6",
    },
  });

  const partnerTransportRabat = await prisma.partner.create({
    data: {
      type: PartnerType.TRANSPORT_TOURISTIQUE,
      companyName: "Atlas Minibus Express SARL",
      contactName: "Kamal Sefrioui",
      phone: "+212 663-114477",
      city: "Rabat",
      rateDetails: "Forfait minibus 3200 MAD (2 jours) pour le Nord",
      capacity: 17,
      vehicleType: "Minibus 17 places Mercedes Sprinter",
      plateNumber: "12890|B|1",
    },
  });

  console.log("✅ 4 Partenaires créés (2 Hôtels & 2 Transporteurs).");

  // 5. Circuits (Merzouga & Chefchaouen)
  const tripMerzouga = await prisma.trip.create({
    data: {
      agencyId: agency.id,
      titleFr: "Magie du Désert : Dunes de Merzouga & Gorges du Todra (3J/2N)",
      titleAr: "سحر الصحراء : رمال مرزوكة ومضايق تودغى (3 أيام / ليلتان)",
      titleEn: "Desert Magic: Merzouga Dunes & Todra Gorges (3D/2N)",
      slug: "magie-desert-merzouga-todra-3j",
      tripType: "SAHARA_SPECIAL",
      durationDays: 3,
      durationNights: 2,
      destinationRegion: "Drâa-Tafilalet (Merzouga)",
      departureCity: "Casablanca, Rabat, Meknès, Fès",
      basePrice: 1450.00,
      depositPerPerson: 500.00,
      singleSupplement: 350.00,
      totalSeats: 48,
      minSeatsRequired: 15,
      shortDescriptionFr: "Immersion féerique dans les plus hautes dunes de l'Erg Chebbi avec bivouac de luxe.",
      shortDescriptionAr: "رحلة ساحرة في قلب الكثبان الرملية الذهبية ومضايق تودغى مع مبيت في مخيم فاخر.",
      longDescriptionFr: "Partez à la découverte des splendeurs du Sahara marocain : traversée de l'Atlas, canyons majestueux de Todra, coucher de soleil à dos de dromadaire et veillée sous les étoiles.",
      longDescriptionAr: "استكشف سحر الصحراء المغربية الشاسعة مع أنشطة ترفيهية متكاملة وسهرة كناوية حية.",
      includedServicesFr: ["Transport en autocar touristique grand confort", "Hébergement en bivouac de luxe", "Demi-pension", "Balade à dos de dromadaire", "Soirée feu de camp"],
      includedServicesAr: ["نقل سياحي مريح ومكيف", "مبيت في مخيم صحراوي فاخر", "نصف إقامة (عشاء + فطور)", "جولة بالجمال عند الغروب", "سهرة موسيقية حول النار"],
      excludedServicesFr: ["Déjeuners libres en cours de route", "Boissons et dépenses personnelles", "Activités optionnelles Quad/Buggy"],
      excludedServicesAr: ["وجبات الغداء الحرة", "المشروبات والمصاريف الشخصية", "الأنشطة الاختيارية (كواد / بوغي)"],
      checklistItemsFr: ["Carte Nationale CIN originale ou Passeport", "Lunettes de soleil et crème solaire", "Vêtements chauds pour la nuitée au désert", "Chaussures de marche confortables"],
      checklistItemsAr: ["بطاقة التعريف الوطنية الأصلية أو جواز السفر", "نظارات شمسية وواقي من الشمس", "ملابس دافئة لليل الصحراء", "أحذية مريحة للمشي"],
      coverImageUrl: "/images/merzouga/cover-merzouga.jpg",
      galleryImages: [
        "/images/merzouga/cover-merzouga.jpg",
        "/images/merzouga/bivouac-luxe.jpg",
        "/images/merzouga/caravane-dromadaires.jpg",
        "/images/merzouga/quad-dunes.jpg",
        "/images/merzouga/khamlia-gnawa.jpg",
      ],
      isFeatured: true,
      isActive: true,
      pickupPoints: {
        create: [
          { cityName: "Casablanca", locationNameFr: "Gare Casa-Voyageurs (Devant l'Ibis)", locationNameAr: "محطة الدار البيضاء المسافرين", departureTime: "05:30", orderIndex: 1 },
          { cityName: "Rabat", locationNameFr: "Gare Rabat-Agdal (Côté Rue Chari)", locationNameAr: "محطة الرباط أكدال", departureTime: "06:45", orderIndex: 2 },
          { cityName: "Meknès", locationNameFr: "Gare Meknès-Ville", locationNameAr: "محطة مكناس المدينة", departureTime: "08:30", orderIndex: 3 },
          { cityName: "Fès", locationNameFr: "Gare Fès-Ville", locationNameAr: "محطة فاس المدينة", departureTime: "09:30", orderIndex: 4 },
        ],
      },
      departureDates: {
        create: [
          { startDate: new Date("2026-09-15"), endDate: new Date("2026-09-17"), totalCapacity: 48, minSeatsForGuaranteed: 15, basePriceDouble: 1450, depositAmount: 500, status: "GUARANTEED" },
          { startDate: new Date("2026-09-22"), endDate: new Date("2026-09-24"), totalCapacity: 48, minSeatsForGuaranteed: 15, basePriceDouble: 1450, depositAmount: 500, status: "OPEN_FOR_BOOKING" },
          { startDate: new Date("2026-09-29"), endDate: new Date("2026-10-01"), totalCapacity: 48, minSeatsForGuaranteed: 15, basePriceDouble: 1450, depositAmount: 500, status: "OPEN_FOR_BOOKING" },
        ],
      },
      staffAssignments: {
        create: [
          {
            teamMemberId: staffOrganisateur.id,
            assignedRole: TeamRole.SUPER_ADMIN,
            assignedMissions: ["coordination globale", "relation clients", "gestion des imprévus", "validation du programme", "liaison avec les fournisseurs"],
            remuneration: 1200.00,
          },
          {
            teamMemberId: staffGuide.id,
            assignedRole: TeamRole.OFFICIAL_GUIDE,
            assignedMissions: ["animation du groupe", "explications culturelles/historiques", "gestion du timing des visites", "photos souvenirs"],
            remuneration: 900.00,
          },
          {
            teamMemberId: staffChauffeur.id,
            assignedRole: TeamRole.DRIVER,
            assignedMissions: ["conduite sécurisée", "respect des horaires", "entretien du véhicule", "gestion du carburant et péages", "détails du trajet"],
            remuneration: 1000.00,
          },
          {
            teamMemberId: staffSurveillant.id,
            assignedRole: TeamRole.TOUR_LEADER,
            assignedMissions: ["sécurité du groupe", "comptage des présents à chaque étape", "gestion des incidents", "premiers secours de base", "périmètre de surveillance"],
            remuneration: 600.00,
          },
        ],
      },
      // Partenaires Associés (Chantier 1)
      partnerAssignments: {
        create: [
          { partnerId: partnerHotelMerzouga.id, status: PartnerStatus.ACCEPTE, negotiatedCost: 450.00, notes: "Bivouac de luxe validé pour 48 pax" },
          { partnerId: partnerTransportCasablanca.id, status: PartnerStatus.ACCEPTE, negotiatedCost: 4500.00, driverAssigned: "Mohamed El Bakkali", notes: "Autocar Mercedes Travego climatisé" },
        ],
      },
      // Coûts Fixes pour Moteur de Rentabilité (Chantier 1)
      fixedCosts: {
        create: [
          { label: "Transport Autocar 48p (3 jours)", amount: 4500.00 },
          { label: "Rémunérations Staff & Encadrement", amount: 3700.00 },
          { label: "Frais logistiques & Péages autoroute", amount: 1200.00 },
        ],
      },
      // Coûts Variables par personne pour Moteur de Rentabilité (Chantier 1)
      variableCosts: {
        create: [
          { label: "Bivouac de Luxe & Nuitée désert", amount: 450.00 },
          { label: "Restauration & Demi-pension", amount: 150.00 },
          { label: "Dromadaires & Soirée Gnawa", amount: 100.00 },
        ],
      },
    },
  });

  const tripChefchaouen = await prisma.trip.create({
    data: {
      agencyId: agency.id,
      titleFr: "Escapade Bleue : Chefchaouen & Cascades d'Akchour (2J/1N)",
      titleAr: "الجوهرة الزرقاء : شفشاون وشلالات أقشور (يومان / ليلة)",
      titleEn: "Blue Pearl: Chefchaouen & Akchour Waterfalls (2D/1N)",
      slug: "perle-bleue-chefchaouen-akchour",
      tripType: "WEEKEND_BREAK",
      durationDays: 2,
      durationNights: 1,
      destinationRegion: "Tanger-Tétouan-Al Hoceïma",
      departureCity: "Casablanca, Rabat, Kénitra",
      basePrice: 890.00,
      depositPerPerson: 300.00,
      singleSupplement: 250.00,
      totalSeats: 48,
      minSeatsRequired: 12,
      shortDescriptionFr: "Week-end ressourçant entre les ruelles bleues et les cascades cristallines d'Akchour.",
      shortDescriptionAr: "عطلة نهاية أسبوع ممتعة بين أزقة شفشاون الزرقاء وشلالات أقشور العذراء.",
      longDescriptionFr: "Évadez-vous dans le Rif marocain : randonnée au Pont de Dieu, baignade naturelle et immersion culturelle dans la médina bleue de Chefchaouen.",
      longDescriptionAr: "استمتع بالطبيعة الخلابة لجبال الريف وجولات تسوق تقليدية بالمدينة العتيقة.",
      includedServicesFr: ["Transport touristique climatisé", "Nuitée en Riad de charme", "Petit-déjeuner", "Randonnée guidée à Akchour"],
      includedServicesAr: ["نقل سياحي مكيف ومريح", "مبيت في رياض تقليدي", "فطور مغربي متكامل", "جولة إرشادية في شلالات أقشور"],
      excludedServicesFr: ["Déjeuners et dîners", "Dépenses personnelles"],
      excludedServicesAr: ["وجبات الغداء والعشاء", "المصاريف الشخصية"],
      checklistItemsFr: ["Carte CIN originale", "Chaussures de randonnée / aquatiques", "Vêtements de rechange"],
      coverImageUrl: "/images/chefchaouen/cover-chefchaouen.jpg",
      galleryImages: [
        "/images/chefchaouen/cover-chefchaouen.jpg",
        "/images/chefchaouen/ruelles-bleues.jpg",
        "/images/chefchaouen/fontaine-andalouse.jpg",
        "/images/chefchaouen/cascades-akchour.jpg",
        "/images/chefchaouen/place-outa-el-hammam.jpg",
      ],
      isFeatured: true,
      isActive: true,
      pickupPoints: {
        create: [
          { cityName: "Casablanca", locationNameFr: "Gare Casa-Voyageurs", locationNameAr: "محطة الدار البيضاء المسافرين", departureTime: "06:00", orderIndex: 1 },
          { cityName: "Rabat", locationNameFr: "Gare Rabat-Agdal", locationNameAr: "محطة الرباط أكدال", departureTime: "07:15", orderIndex: 2 },
          { cityName: "Kénitra", locationNameFr: "Gare Kénitra", locationNameAr: "محطة القنيطرة", departureTime: "08:00", orderIndex: 3 },
        ],
      },
      departureDates: {
        create: [
          { startDate: new Date("2026-09-12"), endDate: new Date("2026-09-13"), totalCapacity: 48, minSeatsForGuaranteed: 12, basePriceDouble: 890, depositAmount: 300, status: "GUARANTEED" },
        ],
      },
      staffAssignments: {
        create: [
          { teamMemberId: staffOrganisateur.id, assignedRole: TeamRole.SUPER_ADMIN, assignedMissions: ["coordination globale", "relation clients", "gestion des imprévus"], remuneration: 900.00 },
          { teamMemberId: staffGuide.id, assignedRole: TeamRole.OFFICIAL_GUIDE, assignedMissions: ["animation du groupe", "explications culturelles/historiques", "photos souvenirs"], remuneration: 700.00 },
          { teamMemberId: staffChauffeur.id, assignedRole: TeamRole.DRIVER, assignedMissions: ["conduite sécurisée", "respect des horaires", "entretien du véhicule"], remuneration: 800.00 },
        ],
      },
      partnerAssignments: {
        create: [
          { partnerId: partnerHotelChefchaouen.id, status: PartnerStatus.ACCEPTE, negotiatedCost: 350.00, notes: "Riad réservé en exclusivité" },
          { partnerId: partnerTransportRabat.id, status: PartnerStatus.ACCEPTE, negotiatedCost: 3200.00, notes: "Minibus grand tourisme" },
        ],
      },
      fixedCosts: {
        create: [
          { label: "Transport Minibus (2 jours)", amount: 3200.00 },
          { label: "Staff & Encadrement", amount: 2400.00 },
          { label: "Frais logistiques & Péages", amount: 600.00 },
        ],
      },
      variableCosts: {
        create: [
          { label: "Hébergement en Riad", amount: 350.00 },
          { label: "Petit déjeuner & Pauses thé", amount: 80.00 },
          { label: "Guide local Akchour", amount: 50.00 },
        ],
      },
    },
  });

  const tripAsfalou = await prisma.trip.create({
    data: {
      agencyId: agency.id,
      titleFr: "☀️ BARRAGE ASFALOU · GHADIR HAMMA · SESSION KAYAK ☀️",
      titleAr: "☀️ سد أسفالو · غدير حامة · جولة الكاياك والمسابح الطبيعية ☀️",
      titleEn: "☀️ Asfalou Dam · Ghadir Hamma · Kayak Adventure ☀️",
      slug: "barrage-asfalou-ghadir-hamma-kayak",
      tripType: "WEEKEND_BREAK",
      publishStatus: "PUBLISHED",
      durationDays: 3,
      durationNights: 2,
      destinationRegion: "Rif / Taher Souk (Marnissa - Barrage Asfalou)",
      departureCity: "Casablanca, Rabat, Fès",
      basePrice: 1300.00,
      depositPerPerson: 400.00,
      singleSupplement: 250.00,
      totalSeats: 30,
      minSeatsRequired: 12,
      shortDescriptionFr: "Une escapade estivale rafraîchissante au cœur de joyaux naturels préservés : lac du barrage Asfalou, balades en kayak, baignade en piscines naturelles cristallines à Ghadir Hamma et veillée sous les étoiles.",
      shortDescriptionAr: "مغامرة صيفية منعشة في قلب الطبيعة العذراء: بحيرة سد أسفالو، جولة بقوارب الكاياك، سباحة في المسابح الطبيعية لغدير حامة وسهرة ممتعة تحت النجوم.",
      longDescriptionFr: "Une escapade estivale rafraîchissante au cœur de joyaux naturels préservés. Au programme : paysages panoramiques, balades en kayak, baignade en piscines naturelles cristallines et veillée conviviale autour d'un feu de camp sous les étoiles.",
      longDescriptionAr: "رحلة صيفية منعشة في قلب الطبيعة العذراء لجبال الريف وتاونات. يشمل البرنامج: مناظر بانورامية ساحرة، جولات التجديف بقوارب الكاياك، سباحة في المسابح الطبيعية لغدير حامة وسهرة حول نار المخيم.",
      includedServicesFr: [
        "Transport touristique climatisé et confortable (A/R)",
        "Assurance liée au transport touristique",
        "Hébergement (2 nuitées) en tentes doubles équipées (matelas et couvertures fournis)",
        "Pension complète le samedi (petit-déjeuner, déjeuner traditionnel, dîner)",
        "Repas du dimanche (petit-déjeuner au camp et déjeuner au bord de l'eau)",
        "Matériel et session de kayak sur le lac du barrage",
        "Gilets de sauvetage certifiés pour tous les niveaux de nage",
        "Accompagnement et services des guides locaux expérimentés",
        "Toutes les visites, randonnées et activités mentionnées",
      ],
      includedServicesAr: [
        "نقل سياحي مريح ومكيف ذهاباً وإياباً",
        "تأمين النقل السياحي المعتمد",
        "الإقامة ليلتين في خيام مجهزة (مراتب وأغطية متوفرة)",
        "إقامة كاملة يوم السبت (فطور، غداء تقليدي، عشاء جماعي)",
        "وجبات يوم الأحد (فطور في المخيم وغداء على ضفاف الماء)",
        "معدات وجلسة تجديف بقوارب الكاياك على البحيرة",
        "سترات نجاة معتمدة للسباحة الآمنة لجميع المستويات",
        "مرافقة وتأطير من طرف مرشدين محليين متمرسين",
        "جميع الزيارات والأنشطة والجولات المبرمجة",
      ],
      excludedServicesFr: [
        "Dîner libre sur l'aire de repos du vendredi soir",
        "Boissons et dépenses personnelles",
        "Assurance responsabilité civile individuelle / plein air recommandée",
      ],
      excludedServicesAr: [
        "وجبة عشاء التوقف في باحة الاستراحة ليلة الجمعة",
        "المشروبات والمصاريف الشخصية",
        "التأمين الفردي للمسؤولية المدنية والأنشطة الخارجية",
      ],
      checklistItemsFr: [
        "Carte d'Identité Nationale (CIN) originale",
        "Chaussures de marche / randonnée légères",
        "Chaussures aquatiques fermées (obligatoires pour marcher dans l'eau)",
        "Maillots de bain, serviette microfibre et chapeau / casquette",
        "Crème solaire et lunettes de soleil",
        "Petit sac à dos d'appoint (pour eau, téléphone, snacks)",
        "En-cas énergétiques (fruits secs, dattes)",
        "Trousse à pharmacie personnelle",
      ],
      checklistItemsAr: [
        "بطاقة التعريف الوطنية الأصلية (CIN)",
        "أحذية مشي / مشي خفيف مريحة",
        "أحذية مائية مغلقة (إلزامية للمشي في الماء)",
        "ملابس سباحة، منشفة مايكروفايبر وقبعة",
        "واقي شمسي ونظارات شمسية",
        "حقيبة ظهر صغيرة للأغراض الشخصية والماء",
        "وجبات طاقة خفيفة (فواكه جافة، تمر)",
        "صيدلية شخصية ومستلزمات فردية",
      ],
      coverImageUrl: "/images/asfalou/cover-asfalou.jpg",
      galleryImages: [
        "/images/asfalou/cover-asfalou.jpg",
        "/images/asfalou/session-kayak.jpg",
        "/images/asfalou/ghadir-hamma-baignade.jpg",
        "/images/asfalou/kayak-grotte.jpg",
        "/images/asfalou/dejeuner-panorama.jpg",
      ],
      isFeatured: true,
      isActive: true,
      pickupPoints: {
        create: [
          { cityName: "Casablanca", locationNameFr: "Devant la gare Casa-Voyageurs", locationNameAr: "أمام محطة القطار الدار البيضاء المسافرين", departureTime: "18:30", orderIndex: 1 },
          { cityName: "Rabat", locationNameFr: "Devant la gare Rabat-Ville", locationNameAr: "أمام محطة القطار الرباط المدينة", departureTime: "20:00", orderIndex: 2 },
          { cityName: "Fès", locationNameFr: "Devant la gare ferroviaire Fès-Ville", locationNameAr: "أمام محطة القطار فاس المدينة", departureTime: "23:00", orderIndex: 3 },
        ],
      },
      departureDates: {
        create: [
          { startDate: new Date("2026-09-18"), endDate: new Date("2026-09-20"), totalCapacity: 30, minSeatsForGuaranteed: 12, basePriceDouble: 1300.0, depositAmount: 400.0, status: "GUARANTEED" },
          { startDate: new Date("2026-09-25"), endDate: new Date("2026-09-27"), totalCapacity: 30, minSeatsForGuaranteed: 12, basePriceDouble: 1300.0, depositAmount: 400.0, status: "OPEN_FOR_BOOKING" },
          { startDate: new Date("2026-10-02"), endDate: new Date("2026-10-04"), totalCapacity: 30, minSeatsForGuaranteed: 12, basePriceDouble: 1300.0, depositAmount: 400.0, status: "OPEN_FOR_BOOKING" },
          { startDate: new Date("2026-10-09"), endDate: new Date("2026-10-11"), totalCapacity: 30, minSeatsForGuaranteed: 12, basePriceDouble: 1300.0, depositAmount: 400.0, status: "OPEN_FOR_BOOKING" },
        ],
      },
      staffAssignments: {
        create: [
          { teamMemberId: staffOrganisateur.id, assignedRole: TeamRole.SUPER_ADMIN, assignedMissions: ["coordination globale", "accueil voyageurs", "gestion du campement"], remuneration: 1000.00 },
          { teamMemberId: staffGuide.id, assignedRole: TeamRole.OFFICIAL_GUIDE, assignedMissions: ["encadrement randonnée aquatique", "animation feu de camp", "sécurité kayak"], remuneration: 800.00 },
          { teamMemberId: staffChauffeur.id, assignedRole: TeamRole.DRIVER, assignedMissions: ["conduite sécurisée", "respect des horaires"], remuneration: 900.00 },
          { teamMemberId: staffSurveillant.id, assignedRole: TeamRole.TOUR_LEADER, assignedMissions: ["surveillance baignade", "distribution gilets sauvetage", "premiers secours"], remuneration: 600.00 },
        ],
      },
      partnerAssignments: {
        create: [
          { partnerId: partnerTransportCasablanca.id, status: PartnerStatus.ACCEPTE, negotiatedCost: 3800.00, notes: "Minibus / Autocar climatisé A/R" },
          { partnerId: partnerHotelChefchaouen.id, status: PartnerStatus.ACCEPTE, negotiatedCost: 400.00, notes: "Campement de tentes doubles équipées à Bab Asfalou" },
        ],
      },
      fixedCosts: {
        create: [
          { label: "Transport Touristique Climatisé A/R", amount: 3800.00 },
          { label: "Staff & Encadrement", amount: 3300.00 },
          { label: "Péages & Carburant A/R", amount: 950.00 },
          { label: "Autorisations locales & Guides régionaux", amount: 600.00 },
        ],
      },
      variableCosts: {
        create: [
          { label: "Campement Bab Asfalou (2 nuitées / pers)", amount: 300.00 },
          { label: "Pension complète Samedi + Repas Dimanche", amount: 260.00 },
          { label: "Location Kayak & Gilets de sauvetage", amount: 120.00 },
          { label: "Navettes locales Taher Souk - Ghadir Hamma", amount: 60.00 },
        ],
      },
    },
  });

  console.log("✅ 3 Circuits créés avec Staff, Partenaires et Coûts de Rentabilité.");

  // 6. Création de Vrais Clients & Réservations avec Devis et Factures
  const clientUser1 = await prisma.user.create({
    data: {
      email: "youssef.bennani@gmail.com",
      fullName: "Youssef Bennani",
      name: "Youssef Bennani",
      phone: "+212 661-889900",
      cinOrPassport: "AB890123",
      role: "CLIENT",
      isVerified: true,
      isProfileComplete: true,
      agencyId: agency.id,
    },
  });

  const clientUser2 = await prisma.user.create({
    data: {
      email: "salma.idrissi@yahoo.fr",
      fullName: "Salma El Idrissi",
      name: "Salma El Idrissi",
      phone: "+212 663-445566",
      cinOrPassport: "CD782310",
      role: "CLIENT",
      isVerified: true,
      isProfileComplete: true,
      agencyId: agency.id,
    },
  });

  const depMerzouga = await prisma.departureDate.findFirst({ where: { tripId: tripMerzouga.id } });

  if (depMerzouga) {
    // Réservation 1 : Merzouga (2 pax, Acompte payé)
    const booking1 = await prisma.booking.create({
      data: {
        reference: "RB-2026-000125",
        userId: clientUser1.id,
        tripId: tripMerzouga.id,
        departureDateId: depMerzouga.id,
        status: BookingStatus.CONFIRMEE,
        totalAmount: 2900.00,
        depositAmount: 1000.00,
        amountPaid: 1000.00,
        paymentStatus: PaymentStatus.ACOMPTE_VERSE,
        travelers: {
          create: [
            { fullName: "Youssef Bennani", cinPassport: "AB890123", phone: "+212 661-889900", category: TravelerCategory.ADULTE },
            { fullName: "Salma Bennani", cinPassport: "AB890124", phone: "+212 661-889901", category: TravelerCategory.ADULTE },
          ],
        },
        payments: {
          create: [
            {
              amount: 1000.00,
              type: PaymentType.ACOMPTE,
              method: PaymentMethod.VIREMENT,
              status: PaymentStatus.VERIFIED,
              proofUrl: "https://pub-a7e412da142148a89892728e019eb7e2.r2.dev/receipts/rec-00125.jpg",
            },
          ],
        },
        quote: {
          create: {
            number: "DEV-2026-000125",
            subtotalHT: 2416.67,
            taxAmount: 483.33,
            totalTTC: 2900.00,
            validUntil: new Date("2026-09-20"),
            status: QuoteStatus.ACCEPTE,
          },
        },
        invoice: {
          create: {
            number: "FAC-2026-000125",
            subtotalHT: 2416.67,
            taxAmount: 483.33,
            totalTTC: 2900.00,
            depositPaid: 1000.00,
            balanceDue: 1900.00,
            status: InvoiceStatus.PARTIELLEMENT_PAYEE,
          },
        },
      },
    });

    console.log(`✅ Réservation 1 créée: ${booking1.reference}`);
  }

  const depChefchaouen = await prisma.departureDate.findFirst({ where: { tripId: tripChefchaouen.id } });

  if (depChefchaouen) {
    // Réservation 2 : Chefchaouen (1 pax, Payé intégralement)
    const booking2 = await prisma.booking.create({
      data: {
        reference: "RB-2026-000126",
        userId: clientUser2.id,
        tripId: tripChefchaouen.id,
        departureDateId: depChefchaouen.id,
        status: BookingStatus.CONFIRMEE,
        totalAmount: 890.00,
        depositAmount: 300.00,
        amountPaid: 890.00,
        paymentStatus: PaymentStatus.PAYE_INTEGRALEMENT,
        travelers: {
          create: [
            { fullName: "Salma El Idrissi", cinPassport: "CD782310", phone: "+212 663-445566", category: TravelerCategory.ADULTE },
          ],
        },
        payments: {
          create: [
            {
              amount: 890.00,
              type: PaymentType.PAIEMENT_COMPLET,
              method: PaymentMethod.CARTE,
              status: PaymentStatus.VERIFIED,
            },
          ],
        },
        quote: {
          create: {
            number: "DEV-2026-000126",
            subtotalHT: 741.67,
            taxAmount: 148.33,
            totalTTC: 890.00,
            validUntil: new Date("2026-09-18"),
            status: QuoteStatus.ACCEPTE,
          },
        },
        invoice: {
          create: {
            number: "FAC-2026-000126",
            subtotalHT: 741.67,
            taxAmount: 148.33,
            totalTTC: 890.00,
            depositPaid: 890.00,
            balanceDue: 0.00,
            status: InvoiceStatus.PAYEE,
          },
        },
      },
    });

    console.log(`✅ Réservation 2 créée: ${booking2.reference}`);
  }

  console.log("🎉 Seed terminé avec succès !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur pendant le seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
