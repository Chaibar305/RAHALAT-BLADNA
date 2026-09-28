import { PrismaClient, TripType, TripPublishStatus, DepartureStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Insertion automatique du circuit : 🌄 رحلة إمليل – أكفاي – مراكش...");

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

  const slug = "escapade-imlil-agafay-marrakech";

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
      titleAr: "سحر الأطلس والصحراء : رحلة إمليل، صحراء أكفاي ومراكش الحمراء",
      titleFr: "Échappée Magique : Imlil, Désert d'Agafay & Marrakech la Ville Rouge",
      titleEn: "Magic Escape: Imlil Cascades, Agafay Desert & Red City Marrakech",
      slug: slug,
      tripType: TripType.WEEKEND_BREAK,
      publishStatus: TripPublishStatus.PUBLISHED,
      durationDays: 3,
      durationNights: 2,
      destinationRegion: "Haut Atlas & Marrakech (Imlil - Tahannaout - Agafay - Marrakech)",
      departureCity: "Rabat, Casablanca",
      basePrice: 1300.00,
      depositPerPerson: 400.00,
      singleSupplement: 250.00,
      totalSeats: 38,
      minSeatsRequired: 10,
      isFeatured: true,
      isScheduledThisWeek: true,
      featuredWeekMessage: "الإنطلاقة كل يوم الجمعة مساء | رحلة مضمونة ومميزة بـ 1300 درهم فقط عوض 1900 درهم !",
      isActive: true,
      coverImageUrl: "/images/imlil-agafay-marrakech/cover-imlil-agafay.jpg",
      galleryImages: [
        "/images/imlil-agafay-marrakech/cover-imlil-agafay.jpg",
        "/images/imlil-agafay-marrakech/cascades-imlil.jpg",
        "/images/imlil-agafay-marrakech/soiree-agafay.jpg",
        "/images/imlil-agafay-marrakech/montgolfiere-marrakech.jpg",
        "/images/imlil-agafay-marrakech/quad-palmeraie.jpg",
        "/images/imlil-agafay-marrakech/marrakech-nuit.jpg",
      ],
      shortDescriptionAr: "استعدّ لعيش تجربة تجمع بين سحر الجبال الشاهقة، هدوء صحراء أكفاي الساحرة ومتعة المدينة الحمراء مراكش (3 أيام / ليلتان) بـ 1300 درهم فقط عوض 1900 درهم مع مبيت برياض بإمليل وفندق مصنف بمراكش.",
      shortDescriptionFr: "Évadez-vous pendant 3 jours et 2 nuits entre les cascades vivifiantes d'Imlil, la soirée lunaire féerique du désert d'Agafay et les trésors de Marrakech. Une formule complète au tarif préférentiel de 1300 DH au lieu de 1900 DH.",
      
      longDescriptionAr: `🌄 رحلة إمليل – أكفاي – مراكش (3 أيام / ليلتان)
استعدّ لعيش تجربة استثنائية تجمع بين سحر الجبال وهدوء الصحراء ومتعة المدينة الحمراء ❤️

انطلاقة أسبوعية مضمونة كل يوم جمعة مساء من الرباط (18:00) والدار البيضاء (20:00) في أجواء عائلية مفعمة بالحيوية والترفيه والتأطير الاحترافي.

برنامج متكامل صُمم بعناية فائقة :
• الليلة الأولى : الوصول إلى وادي إمليل الساحر بالهواء الطلق للأطلس الكبير، الاستقرار في رياض تقليدي والاستمتاع بنوم هادئ بين أحضان الجبال.
• اليوم الثاني : فطور تقليدي شهي، جولة استكشافية خفيفة نحو شلالات إمليل العذبة، غداء محلي بدار الفلاح بتحناوت، الاستقرار بفندق مصنف بمراكش، ثم التوجه نحو صحراء أكفاي لحضور السهرة القمرية الأسطورية مع عشاء شاعري، يعقبها جولة ليلية مميزة بمراكش (الكوتشي، جامع الفنا، الكتبية).
• اليوم الثالث : تجربة المنطاد الملكي عند شروق الشمس (اختيارية)، فطور بوفيه فاخر بالفندق، جولة استجمامية بمنطقة النخيل Palmeraie، تجربة كواد ممتعة واستراحة شاي صحراوي، ثم رحلة العودة المريحة نحو الدار البيضاء والرباط.

💰 عرض خاص وحصري : 1300 درهم فقط للشخص عوض 1900 درهم شامل الإقامة والنقل والتأطير والأنشطة الرئيسية !`,

      longDescriptionFr: `🌄 Échappée Magique : Imlil, Désert d'Agafay & Marrakech (3 Jours / 2 Nuits)
Préparez-vous à vivre une aventure inoubliable combinant la majesté des sommets de l'Atlas, le calme lunaire du désert d'Agafay et la magie vibrante de Marrakech ❤️

Départs garantis chaque vendredi soir au départ de Rabat (18h00) et Casablanca (20h00) avec transport grand confort climatisé et équipe d'animation professionnelle.

Un itinéraire pensé pour l'émerveillement et la déconnexion totale :
• Nuit 1 : Traversée vers la mythique vallée d'Imlil au pied du Toubkal, accueil chaleureux et nuitée paisible en Riad traditionnel.
• Jour 2 : Petit-déjeuner montagnard, randonnée douce et accessible vers les cascades d'Imlil au milieu des noyers centenaires, halte gastronomique à Tahannaout (Dar Al Falah), check-in en hôtel de standing à Marrakech, suivie d'une soirée lunaire féerique dans le désert d'Agafay autour d'un grand feu de camp avec dîner sous les étoiles, puis balade nocturne à Marrakech (calèche, place Jemaa el-Fna et Koutoubia).
• Jour 3 : Pour les amateurs de sensations fortes, vol panoramique en Montgolfière au lever du soleil (2000m d'altitude), copieux petit-déjeuner buffet à l'hôtel, virée dans la Palmeraie, safari quad 2h, thé traditionnel sahraoui à la menthe et retour serein vers Casablanca et Rabat.

💰 Tarif d'exception : 1300 DH au lieu de 1900 DH tout inclus (transport, Riad Imlil, Hôtel Marrakech, petits-déjeuners et encadrement) !`,

      overviewAr: "توليفة فريدة تجمع بين خضرة وهواء الأطلس النقي بشلالات إمليل، وسحر الصحراء بأكفاي، وأصالة أسواق وقصور مراكش في عطلة نهاية أسبوع مثالية مناسبة للشباب، العائلات والمبتدئين.",
      overviewFr: "La combinaison parfaite entre la nature préservée de l'Atlas, la poésie mystique du désert d'Agafay et l'ambiance impériale de Marrakech. Une formule idéale pour se ressourcer sans contrainte.",
      showOverview: true,

      includedServicesAr: [
        "النقل بحافلة سياحية مُكَيَّفَة ومُريحَة من الرباط والدار البيضاء",
        "المبيت بالرياض التقليدي الأصيل بإمليل (الليلة الأولى)",
        "المبيت في فندق مصنف وراقٍ بمدينة مراكش (الليلة الثانية)",
        "وجبة الفطور التقليدية يوم السبت بإمليل",
        "وجبة الفطور بوفيه مفتوح (Buffet) يوم الأحد بالفندق بمراكش",
        "زيارة شلالات إمليل وجولة مشي خفيفة مع مرشد محلي",
        "جولة ليلية استعراضية بمراكش (الكوتشي، ساحة جامع الفنا، الكتبية)",
        "جولة استجمام بمنطقة النخيل (Palmeraie) واستراحة شاي صحراوي أصيل",
        "تنشيط وتأطير احترافي ومرافقة سياحية طيلة الرحلة"
      ],
      includedServicesFr: [
        "Transport touristique aller-retour en autocar grand confort climatisé (Départs Rabat & Casablanca)",
        "1 nuitée en Riad traditionnel de charme à Imlil",
        "1 nuitée en hôtel classé de standing à Marrakech",
        "Petit-déjeuner traditionnel le samedi matin à Imlil",
        "Petit-déjeuner Buffet copieux le dimanche matin à l'hôtel à Marrakech",
        "Randonnée pédestre accessible et guidée vers les cascades d'Imlil",
        "Visite nocturne et immersion à Marrakech (Place Jemaa el-Fna, Koutoubia, calèche)",
        "Excursion dans la Palmeraie de Marrakech avec pause thé traditionnel à la menthe",
        "Animation, accompagnement et encadrement complets par l'équipe Rahalat Bladna"
      ],

      excludedServicesAr: [
        "وجبة الغداء يوم السبت بتحناوت (دار الفلاح) ويوم الأحد",
        "السهرة القمرية والعشاء بالهواء الطلق بصحراء أكفاي (150 درهم اختيارية)",
        "تجربة ركوب المنطاد ومشاهدة الشروق من ارتفاع 2000 متر (1640 درهم اختيارية)",
        "تجربة الدراجات الرباعية Quad بالنخيل لمدة ساعتين (300 درهم لشخصين اختيارية)",
        "المصاريف الشخصية والمقتنيات الخاصة"
      ],
      excludedServicesFr: [
        "Déjeuner du samedi à Tahannaout (Dar Al Falah) et déjeuner du dimanche",
        "Soirée lunaire & dîner en plein air au désert d'Agafay (Optionnel : 150 DH)",
        "Vol en Montgolfière au lever du soleil à 2000m (Optionnel : 1640 DH)",
        "Session Quad 2h dans la Palmeraie pour 2 personnes (Optionnel : 300 DH)",
        "Dépenses personnelles et pourboires"
      ],

      checklistItemsAr: [
        "بطاقة التعريف الوطنية (CIN) أو جواز السفر",
        "حذاء رياضي مريح مناسب للمشي نحو شلالات إمليل",
        "سترة دافئة أو ملابس مناسبة لنسيم الجبل وصحراء أكفاي ليلاً",
        "قبعة شمسية، نظارات شمسية وواقي من الشمس",
        "كاميرا أو هاتف مشحون مع شاحن متنقل (Powerbank) لالتقاط أحلى الذكريات"
      ],
      checklistItemsFr: [
        "Pièce d'identité originale (CIN ou Passeport valide)",
        "Baskets ou chaussures de marche adaptées aux sentiers d'Imlil",
        "Veste chaude ou pull pour la fraîcheur de la montagne et d'Agafay en soirée",
        "Casquette, lunettes de soleil et crème solaire",
        "Smartphone ou appareil photo avec batterie externe"
      ],

      // Points de ramassage
      pickupPoints: {
        create: [
          {
            cityName: "Rabat",
            city: "Rabat",
            locationNameFr: "Gare Rabat-Agdal",
            locationNameAr: "محطة الرباط أكدال",
            departureTime: "18:00",
            googleMapsUrl: "https://maps.google.com/?q=Gare+Rabat+Agdal",
            orderIndex: 1,
          },
          {
            cityName: "Casablanca",
            city: "Casablanca",
            locationNameFr: "Gare Routière Bab El Bouraq (Casa-Voyageurs)",
            locationNameAr: "محطة المسافرين باب البراق (الدار البيضاء)",
            departureTime: "20:00",
            googleMapsUrl: "https://maps.google.com/?q=Gare+Casa+Voyageurs",
            orderIndex: 2,
          },
        ],
      },

      // Étapes d'itinéraire par jour
      itineraryDays: {
        create: [
          {
            dayNumber: 1,
            titleAr: "الانطلاقة من الرباط والدار البيضاء والتوجه نحو إمليل",
            titleFr: "Départ en soirée de Rabat & Casablanca vers la vallée d'Imlil",
            timeSlot: "18h00 - 01h30",
            location: "Imlil - Haut Atlas",
            locationName: "Riad traditionnel à Imlil",
            featuredImage: "/images/imlil-agafay-marrakech/cover-imlil-agafay.jpg",
            meals: ["Accueil & Nuitée"],
            descriptionAr: `18:00 الانطلاقة من الرباط (محطة أكدال)
20:00 الانطلاقة من الدار البيضاء (محطة المسافرين باب البراق)
01:00 التوجه مباشرة نحو منطقة إمليل الساحرة في قلب الأطلس الكبير
استقبال المشاركين وتوزيع الغرف بالرياض التقليدي
أخذ قسط من الراحة والمبيت وسط السكون الجبلي المنعش.`,
            descriptionFr: `18h00 : Rassemblement et départ de Rabat (Gare Agdal).
20h00 : Départ de Casablanca (Gare routière Bab El Bouraq / Casa-Voyageurs).
Trajet panoramique vers les contreforts du Haut Atlas.
01h00 : Arrivée dans la féerique vallée d'Imlil. Accueil chaleureux des voyageurs, remise des clés et installation dans les chambres au Riad. Nuitée calme et réparatrice au grand air montagnard.`,
            activityTags: ["Départ Rabat 18h", "Départ Casa 20h", "Arrivée Imlil", "Riad traditionnel", "Repos & Nuitée"],
          },
          {
            dayNumber: 2,
            titleAr: "شلالات إمليل، غداء بتحناوت، سهرة أكفاي القمرية وجولة ليلية بمراكش",
            titleFr: "Cascades d'Imlil, Déjeuner Tahannaout, Soirée Agafay & Nuit à Marrakech",
            timeSlot: "09h00 - 23h30",
            location: "Imlil - Tahannaout - Agafay - Marrakech",
            locationName: "Désert d'Agafay & Marrakech",
            featuredImage: "/images/imlil-agafay-marrakech/cascades-imlil.jpg",
            meals: ["Petit-déjeuner inclus", "Déjeuner Tahannaout (libre)", "Dîner Agafay (optionnel)"],
            descriptionAr: `🍳 09:00 وجبة الفطور اللذيذة بالرياض بإمليل.
🌿 زيارة شلالات إمليل الطبيعية وجولة مشي خفيفة ممتعة (ذهاباً وإياباً – مناسبة للمبتدئين ولجميع الأعمار) بين حقول الجوز والجبال.
🚐 33 km التوجه نحو مدينة مراكش مع توقف لتناول وجبة الغداء اللذيذة بتحناوت (دار الفلاح) وسط الطبيعة.
🏨 الوصول للفندق المصنف بمراكش، توزيع الغرف ووقت حر للراحة والاستحمام.
🌙 التوجه نحو صحراء أكفاي الساحرة لحضور السهرة القمرية وسط أجواء موسيقية استثنائية وعشاء بالهواء الطلق تحت أضواء الفوانيس والنجوم (150 درهم اختيارية).
🐴 جولة ليلية بالمدينة الحمراء : ركوب الكوتشي (الحنطور)، استكشاف ساحة جامع الفنا التاريخية والتقاط صور لصومعة الكتبية.`,
            descriptionFr: `09h00 : Savoureux petit-déjeuner traditionnel au Riad face aux sommets.
Randonnée pédestre accessible vers les splendides cascades d'Imlil, au milieu des noyers centenaires et des vergers en terrasses.
Trajet de 33 km en autocar vers Marrakech avec escale gourmande à Tahannaout (Dar Al Falah) pour déguster des spécialités locales au vert.
Check-in et installation à l'hôtel classé à Marrakech, temps libre pour se rafraîchir.
Direction le désert minéral d'Agafay pour une soirée lunaire d'anthologie : ambiance bohème chic, lampions marocains, feu de camp et dîner typique sous un ciel étoilé spectaculaire (Optionnel : 150 DH).
Escapade nocturne féerique au cœur de Marrakech : promenade en calèche (Koutchi), animation vivante de la place Jemaa el-Fna et illumination de la Koutoubia.`,
            activityTags: ["Cascades Imlil", "Tahannaout Dar Al Falah", "Hôtel Marrakech", "Désert Agafay", "Soirée Lunaire", "Place Jemaa el-Fna", "Calèche Koutchi"],
          },
          {
            dayNumber: 3,
            titleAr: "شروق المنطاد الملكي، فطور الفندق، كواد النخيل ورحلة العودة",
            titleFr: "Montgolfière au lever du soleil, Palmeraie, Safari Quad & Retour",
            timeSlot: "06h00 - 20h00",
            location: "Palmeraie de Marrakech - Casablanca - Rabat",
            locationName: "Palmeraie de Marrakech",
            featuredImage: "/images/imlil-agafay-marrakech/montgolfiere-marrakech.jpg",
            meals: ["Petit-déjeuner Buffet inclus", "Pause thé sahraoui"],
            descriptionAr: `للمهتمين بتجربة المنطاد الملكية الفريدة (غير متضمنة - اختيارية) :
⏰ 06:00 الانطلاق نحو موقع الإقلاع (أولاد بن رحمون).
🎈 ركوب المنطاد ومشاهدة شروق الشمس الساحر من ارتفاع 2000 متر تقريباً مع إطلالة خلابة على سهول مراكش وسلسلة الأطلس (1640 درهم اختيارية) مع التقاط صور وفيديوهات وفطور محلي بالموقع.
بعدها :
🍽 09:30 وجبة الفطور Buffet مفتوح وشهي بالفندق بمراكش.
🧳 تسليم الغرف والاستعداد ليوم مليء بالنشاط.
🏜 جولة استكشافية بمنطقة النخيل التاريخية (Palmeraie).
🛻 تجربة الدراجات الرباعية (Quad – ساعتان) بين الكثبان والنخيل بـ 300 درهم للشخصين (اختيارية).
☕ استراحة شاي صحراوي أصيل بالنعناع وسط واحات النخيل.
🚐 16:00 الانطلاق في رحلة العودة المريحة إلى الدار البيضاء ثم الرباط مع أجمل الذكريات.`,
            descriptionFr: `Expérience Premium en option pour les lève-tôt :
06h00 : Transfert vers la zone d'envol d'Ouled Ben Rahmoun.
Survol féerique en Montgolfière pour assister au lever du soleil à près de 2000 mètres d'altitude avec panorama grandiose sur l'Atlas enneigé (1640 DH), avec certificat de vol, photos et collation matinale.
Pour tous :
09h30 : Copieux petit-déjeuner Buffet à l'hôtel à Marrakech.
Check-out des chambres.
Immersion dans la mythique Palmeraie de Marrakech.
Safari Quad de 2 heures à travers les dunes et sentiers bordés de palmiers (300 DH pour 2 personnes en quad biplace).
Pause conviviale et dégustation d'un thé traditionnel à la menthe à l'ombre des palmiers.
16h00 : Départ pour le trajet de retour tout confort vers Casablanca puis Rabat, riches de souvenirs inoubliables.`,
            activityTags: ["Montgolfière 2000m", "Petit-déj Buffet", "Palmeraie Marrakech", "Quad 2h", "Thé à la menthe", "Retour Casa & Rabat"],
          },
        ],
      },

      // Dates de départ chaque vendredi soir
      departureDates: {
        create: [
          {
            startDate: new Date("2026-10-02T18:00:00.000Z"),
            endDate: new Date("2026-10-04T20:00:00.000Z"),
            status: DepartureStatus.GUARANTEED,
            totalCapacity: 38,
            occupiedSeats: 26,
            basePriceDouble: 1300.00,
            priceTriple: 1300.00,
            singleRoomSupplement: 250.00,
            depositAmount: 400.00,
          },
          {
            startDate: new Date("2026-10-09T18:00:00.000Z"),
            endDate: new Date("2026-10-11T20:00:00.000Z"),
            status: DepartureStatus.GUARANTEED,
            totalCapacity: 38,
            occupiedSeats: 18,
            basePriceDouble: 1300.00,
            priceTriple: 1300.00,
            singleRoomSupplement: 250.00,
            depositAmount: 400.00,
          },
          {
            startDate: new Date("2026-10-16T18:00:00.000Z"),
            endDate: new Date("2026-10-18T20:00:00.000Z"),
            status: DepartureStatus.OPEN_FOR_BOOKING,
            totalCapacity: 38,
            occupiedSeats: 10,
            basePriceDouble: 1300.00,
            priceTriple: 1300.00,
            singleRoomSupplement: 250.00,
            depositAmount: 400.00,
          },
          {
            startDate: new Date("2026-10-23T18:00:00.000Z"),
            endDate: new Date("2026-10-25T20:00:00.000Z"),
            status: DepartureStatus.OPEN_FOR_BOOKING,
            totalCapacity: 38,
            occupiedSeats: 4,
            basePriceDouble: 1300.00,
            priceTriple: 1300.00,
            singleRoomSupplement: 250.00,
            depositAmount: 400.00,
          },
          {
            startDate: new Date("2026-10-30T18:00:00.000Z"),
            endDate: new Date("2026-11-01T20:00:00.000Z"),
            status: DepartureStatus.OPEN_FOR_BOOKING,
            totalCapacity: 38,
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
            nameAr: "السهرة القمرية وعشاء بالهواء الطلق في صحراء أكفاي",
            nameFr: "Soirée lunaire & Dîner en plein air dans le désert d'Agafay",
            price: 150.00,
            isPerPerson: true,
            descriptionAr: "حضور السهرة القمرية وسط أجواء موسيقية وعشاء تقليدي بالهواء الطلق بصحراء أكفاي الساحرة.",
            descriptionFr: "Vivez la magie nocturne du désert minéral d'Agafay autour d'un grand feu de camp avec dîner savoureux sous les étoiles.",
          },
          {
            nameAr: "ركوب المنطاد ومشاهدة شروق الشمس (2000 متر)",
            nameFr: "Vol en Montgolfière au lever du soleil (2000m d'altitude)",
            price: 1640.00,
            isPerPerson: true,
            descriptionAr: "تجربة استثنائية لمشاهدة شروق الشمس من ارتفاع 2000 متر مع إطلالة بانورامية وفطور محلي وصور وفيديوهات.",
            descriptionFr: "Survol inoubliable des plaines de Marrakech et de l'Atlas au lever du jour à 2000m d'altitude, incluant collation, photos et diplôme de vol.",
          },
          {
            nameAr: "تجربة الدراجات الرباعية (Quad - ساعتان) لشخصين",
            nameFr: "Session Quad 2h dans la Palmeraie (Pour 2 personnes)",
            price: 300.00,
            isPerPerson: false,
            descriptionAr: "جولة مغامرة لمدة ساعتين بالدراجات الرباعية وسط أشجار النخيل والكثبان (300 درهم لشخصين).",
            descriptionFr: "Randonnée dynamique de 2 heures en quad biplace dans la Palmeraie avec équipement complet et guide de piste.",
          },
          {
            nameAr: "غرفة فردية خاصة (Single) في الفندق والرياض",
            nameFr: "Chambre Individuelle Privée (Supplément Single)",
            price: 250.00,
            isPerPerson: true,
            descriptionAr: "غرفة مستقلة خاصة لك وحدك طيلة ليلتي المبيت بالرياض والفندق.",
            descriptionFr: "Profitez d'une chambre privée pour vous seul(e) durant les 2 nuits du voyage.",
          },
        ],
      },
    },
  });

  console.log(`🎉 Circuit Imlil - Agafay - Marrakech inséré avec succès ! ID: ${trip.id}, Slug: ${trip.slug}`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors de l'insertion :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
