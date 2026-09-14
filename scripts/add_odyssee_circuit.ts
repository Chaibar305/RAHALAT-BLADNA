import { PrismaClient, TripType, TripPublishStatus, DepartureStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Insertion automatique du circuit : Merzouga - Boumalne Dadès - Ouarzazate...");

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
        address: "Casablanca Finance City & Aéroport Mohammed V",
        isActive: true,
      },
    });
  }

  console.log(`🏢 Agence sélectionnée : ${agency.name} (ID: ${agency.id})`);

  const slug = "odyssee-du-sud-merzouga-dades-ouarzazate";

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
      titleFr: "Merzouga - Boumalne Dadès - Ouarzazate : L’Odyssée du Sud",
      titleAr: "مرزوكة - بومالن دادس - ورزازات : ملحمة الجنوب والأناقة الجوية",
      titleEn: "Merzouga - Boumalne Dades - Ouarzazate: The Southern Odyssey by Flight",
      slug: slug,
      tripType: TripType.SAHARA_SPECIAL,
      publishStatus: TripPublishStatus.PUBLISHED,
      durationDays: 5,
      durationNights: 4,
      destinationRegion: "Drâa-Tafilalet (Merzouga, Dadès, Ouarzazate)",
      departureCity: "Casablanca (Aéroport Mohammed V - Vol Royal Air Maroc Inclus)",
      basePrice: 5900.00,
      depositPerPerson: 1500.00,
      singleSupplement: 950.00,
      totalSeats: 24,
      minSeatsRequired: 4,
      isFeatured: true,
      isActive: true,
      coverImageUrl: "/images/odyssee-du-sud/cover-merzouga-sunset.jpg",
      galleryImages: [
        "/images/odyssee-du-sud/cover-merzouga-sunset.jpg",
        "/images/odyssee-du-sud/gorges-du-todgha.jpg",
        "/images/odyssee-du-sud/oasis-skoura-dades.jpg",
        "/images/odyssee-du-sud/ksar-ait-ben-haddou.jpg",
        "/images/odyssee-du-sud/ouarzazate-kasbah.jpg",
      ],
      shortDescriptionFr: "Circuit de prestige combinant vols directs Royal Air Maroc (Casablanca → Errachidia / Ouarzazate → Casablanca), dunes géantes de Merzouga en bivouac de luxe, canyons du Dadès et merveilles de l'UNESCO.",
      shortDescriptionAr: "رحلة فاخرة حصرية تجمع بين الطيران المباشر للخطوط الملكية المغربية (الدار البيضاء ← الرشيدية / ورزازات ← الدار البيضاء)، كثبان مرزوكة، مبيت في مخيم فخم، مضايق دادس وتودغى، وقصر آيت بن حدو العالمي.",
      longDescriptionFr: `L’Odyssée du Sud : Une Élégance Aérienne

Pourquoi choisir entre l'aventure sauvage et le confort absolu ? Rahalat Bladna Experience redéfinit les codes du voyage saharien avec son circuit exclusif : "Oasis et Désert : La Grande Traversée par Avion". En supprimant les dix heures de route fatigantes entre Casablanca et les dunes, nous vous offrons un luxe rare : le temps. Envolez-vous depuis l'aéroport Mohammed V et atterrissez en un peu plus d'une heure au cœur du Tafilalet. Ce périple "en ligne droite", avec une arrivée à Errachidia et un retour depuis Ouarzazate, vous garantit une immersion totale sans jamais revenir sur vos pas, optimisant chaque instant de votre découverte.

Des Oasis Sacrées aux Dunes Géantes
Votre voyage s'ouvre sur la sérénité du Palais Meski et sa source bleue légendaire, véritable miroir d'eau niché dans une falaise ocre. Après une première nuit étoilée à Errachidia, la route vous mène vers les terres géologiques d'Erfoud, capitale mondiale des fossiles, puis vers l'effervescence historique d'Er-Rissani. Le moment sacré arrive en fin de journée : une méharée silencieuse au coucher du soleil pour rejoindre l'Erg Chebbi. À Merzouga, vous vivrez l'expérience ultime d'une nuit en bivouac de luxe, où le confort moderne rencontre l'infini du ciel saharien, au pied des plus hautes dunes du Maroc.

Ingéniosité Ancestrale et Canyons Vertigineux
Le réveil face au lever du soleil sur le sable laisse place à une exploration fascinante du génie humain. Vous découvrirez le secret des Khattarat, ces systèmes d’irrigation souterrains millénaires qui irriguent les palmeraies depuis des siècles. Votre périple se poursuit par la visite du Ksar El Khorbat, un modèle de vie communautaire préservé, avant de pénétrer dans la majesté des Gorges du Todgha. Là, des parois calcaires de 300 mètres de haut dessinent un couloir naturel spectaculaire. Votre étape à Boumalne Dadès vous offrira un panorama lunaire saisissant, point de départ idéal pour explorer les courbes de la vallée.

La Route des Mille Kasbahs et le Retour Privilège
La dernière partie de votre traversée vous conduit à travers la parfumée Vallée des Roses à Kelaat M'Gouna, où l'air embaume la fleur de Damas. À Skoura, la Kasbah Amridil se dresse comme un chef-d’œuvre de l'architecture en pisé, offrant un voyage dans le temps au XVIIe siècle. L'apothéose culturelle vous attend au Ksar d'Aït Ben Haddou, joyau de l'UNESCO et décor mythique du cinéma mondial. Après une immersion dans l'ambiance hollywoodienne de Ouarzazate, vous rejoindrez l'aéroport pour votre vol retour. En moins de 90 minutes, vous retrouverez Casablanca, le corps reposé et l'esprit encore baigné par la lumière dorée du grand Sud.

Réservez votre place sous les étoiles
Ne laissez pas ce rêve s'envoler sans vous : rejoignez l'élite des voyageurs et réservez dès maintenant votre siège pour cette traversée exclusive du Grand Sud. Les places pour ce voyage de luxe sont limitées ; contactez Rahalat Bladna Experience aujourd'hui pour transformer votre désir d'évasion en une réalité inoubliable.`,
      longDescriptionAr: `ملحمة الجنوب : أناقة جوية وتجربة استثنائية

لماذا تختار بين المغامرة الساحرة والراحة المطلقة؟ تُعيد رحلات بلادنا صياغة تجربة السفر الصحراوي الفاخر مع برنامجها الحصري: "الواحات والصحراء: العبور الكبير عبر الطيران". من خلال اختصار أكثر من عشر ساعات من السفر الطرقي المرهق بين الدار البيضاء والكثبان الرملية، نمنحكم ترفاً نادراً: الوقت. انطلقوا في رحلة جوية من مطار محمد الخامس لتحطوا في غضون ساعة ونيف بقلب تافيلالت. هذا المسار "في خط مباشر" بدون رجوع على الأعقاب، بوصول إلى الرشيدية وعودة من ورزازات، يضمن لكم متعة كاملة واستثماراً أمثل لكل لحظة من استكشافكم.

من الواحات العذبة إلى رمال مرزوكة الذهبية
تبدأ الرحلة بهدوء قصر مسكي وعينه الزرقاء الشهيرة، واحة عذبة بين الصخور الحجرية. وبعد ليلة هادئة بالرشيدية، تتجه الرحلة نحو أرفود عاصمة المستحاثات والجيولوجيا العالمية، ثم إلى ريصاني مهد الدولة العلوية وأسواقها التراثية. ثم تحين اللحظة الأيقونية: جولة بالجمال على رمال عرق الشبي عند غروب الشمس، وصولاً إلى مخيم فاخر تتناغم فيه الفخامة مع سكون وسحر الصحراء تحت النجوم.

عبقرية الهندسة الأجدادية ومضايق تودغى المهيبة
شروق شمس لا يُنسى يليه اكتشاف هندسة الخطارات المائية التقليدية، وقصر الخربات التراثي الأصيل، ثم الدخول في مهابة مضايق تودغى بجدرانها الصخرية الشاهقة بارتفاع 300 متر، وصولاً إلى بومالن دادس بتشكيلاتها الجيولوجية الرائعة وطريق تيسدرين الشهيرة.

طريق الألف قصبة والعودة المريحة
عبور وادي الورود المعطر بقلعة مكونة، ثم واحة سكورة وزيارة قصبة أمريديل التاريخية من القرن السابع عشر، تتويجاً بزيارة قصر آيت بن حدو المصنف تراثاً عالمياً لليونسكو ومهد السينما العالمية في ورزازات، قبل التوجه لمطار ورزازات لرحلة العودة السريعة والمريحة إلى الدار البيضاء.`,
      includedServicesFr: [
        "Billet d’avion A/R avec Royal Air Maroc pour le trajet : CMN – ERH / OZZ - CMN",
        "Transport Touristique climatisé grand confort pour l'ensemble des déplacements sur place",
        "1 Nuitée dans un hôtel 3*/4* (Errachidia) en chambre double ou triple selon disponibilité",
        "1 Nuitée dans un Bivouac de luxe (Merzouga / Erg Chebbi) avec sanitaires privés",
        "1 Nuitée dans une Auberge de luxe / Riad de charme (Boumalne Dadès)",
        "1 Nuitée dans un Riad de Charme (Ouarzazate)",
        "Repas selon programme (Pension quasi-complète avec petits-déjeuners et dîners gastronomiques)",
        "Visites guidées des Kasbahs et sites historiques (Aït Ben Haddou, Taourirt, Amridil, Khattarat, Khourbat)",
        "Frais d'accès à l'ensemble des Kasbahs et musées mentionnés",
        "Excursion et Safari en 4x4 dans les dunes de Merzouga (2h)",
        "Balade à dos de dromadaire au lever/coucher du soleil (1h)",
        "Soirée traditionnelle Tam-Tam au coin du feu de camp à Merzouga",
        "Assistance permanente et encadrement VIP durant tout le voyage"
      ],
      includedServicesAr: [
        "تذكرة طيران ذهاباً وإياباً مع الخطوط الملكية المغربية (الدار البيضاء ← الرشيدية / ورزازات ← الدار البيضاء)",
        "نقل سياحي مريح ومكيف لجميع التنقلات والزيارات طوال الرحلة",
        "ليلة مبيت في فندق 4 نجوم بالرشيدية في غرفة مزدوجة أو ثلاثية",
        "ليلة مبيت في مخيم صحراوي ملكي فاخر بكثبان مرزوكة (عرق الشبي)",
        "ليلة مبيت في نزل فخم / رياض راقٍ ببومالن دادس",
        "ليلة مبيت في رياض أصيل بمدينة ورزازات",
        "الوجبات وفق البرنامج (إفطار وعشاء فاخر بمذاقات محلية)",
        "جولات إرشادية في القصبات (قصر آيت بن حدو، أمريديل، قصر تاوريرت، الخطارات، قصر الخربات)",
        "رسوم الدخول لكافة القصبات والمتاحف المذكورة بالبرنامج",
        "جولة سفاري بسيارات الدفع الرباعي 4x4 في رمال مرزوكة (ساعتان)",
        "جولة على ظهور الجمال لمشاهدة الشروق والغروب (ساعة)",
        "سهرة تقليدية 'طام طام' حية حول نار المخيم بالصحراء",
        "تأطير ومرافقة سياحية VIP متواصلة طوال أيام الرحلة"
      ],
      excludedServicesFr: [
        "Transfert vers l’Aéroport Mohammed V de Casablanca (A/R)",
        "Dépenses personnelles et pourboires",
        "Dîner du premier jour à l'arrivée",
        "Boissons durant les repas",
        "Assurance voyage individuelle optionnelle"
      ],
      excludedServicesAr: [
        "التنقل من وإلى مطار محمد الخامس بالدار البيضاء",
        "المصاريف الشخصية والإكراميات",
        "عشاء اليوم الأول عند الوصول للرشيدية",
        "المشروبات الإضافية أثناء الوجبات",
        "التأمين الفردي التكميلي"
      ],
      checklistItemsFr: [
        "Vêtements et Amplitude Thermique : Prévoyez des vêtements légers en coton pour les journées ensoleillées, et une veste chaude ou pull pour les nuits en bivouac à Merzouga où les températures chutent.",
        "Protection et Bien-être : Crème solaire haute protection, lunettes de soleil, chapeau/chèche et chaussures de marche confortables pour le Ksar d'Aït Ben Haddou et les Gorges du Todgha.",
        "Bagages et Vols Nationaux : Bagages souples limités à 23 kg par personne recommandés pour faciliter les transferts 4x4 et respecter les franchises Royal Air Maroc.",
        "Respect et Photographie : Demandez toujours l'autorisation aux habitants avant de les photographier par courtoisie et respect mutuel.",
        "Achats et Artisanat : Prévoyez des dirhams en espèces pour les escales à Erfoud (fossiles), Rissani (épices) et Kelaat M'Gouna (eau de rose).",
        "Fréquence des départs : Un départ organisé chaque Mercredi au départ de l'aéroport de Casablanca.",
        "Confirmation garantie : Départ garanti et confirmé à partir d'un minimum de 4 participants."
      ],
      checklistItemsAr: [
        "الملابس وفوارق درجات الحرارة : ملابس قطنية خفيفة للنهار وسترة دافئة أو معطف للمبيت بالصحراء حيث تنخفض درجات الحرارة ليلاً.",
        "الوقاية والحماية : واقي شمس عالي الحماية، نظارات شمسية، قبعة وأحذية مشي مريحة ومقاومة لزيارة القصبات ومضايق تودغى.",
        "الأمتعة ورحلات الطيران : يفضل اصطحاب حقائب مرنة بوزن لا يتجاوز 23 كلغ للشخص احتراماً لمعايير الخطوط الملكية وتسهيلاً للنقل بمركبات 4x4.",
        "احترام التقاليد والتصوير : يُرجى الاستئذان بلطف قبل التقاط صور للساكنة المحلية تقديراً لخصوصيتهم وعاداتهم الأصيلة.",
        "التسوق والمنتجات المحلية : توفير مبالغ نقدية بالدرهم المغربي لاقتناء المستحاثات بأرفود، التمور والتوابل بالريصاني، ومنتجات الورد بقلعة مكونة.",
        "مواعيد الانطلاق : رحلة أسبوعية منتظمة تنطلق كل يوم أربعاء من مطار محمد الخامس بالدار البيضاء.",
        "تأكيد الرحلة : انطلاق مؤكد ومضمون ابتداءً من 4 مشاركين كحد أدنى."
      ],
      includedServices: [
        "Billet d’avion A/R avec Royal Air Maroc (CMN – ERH / OZZ - CMN)",
        "Transport Touristique climatisé grand confort",
        "1 Nuitée Hôtel 3*/4* (Errachidia)",
        "1 Nuitée Bivouac de luxe (Merzouga)",
        "1 Nuitée Auberge de luxe (Boumalne Dadès)",
        "1 Nuitée Riad de Charme (Ouarzazate)",
        "Pension quasi-complète",
        "Visites guidées et frais d'accès aux Kasbahs et musées",
        "Excursion Safari 4x4 (2h)",
        "Balade Chameaux (1h)",
        "Soirée Tam-Tam à Merzouga",
        "Assistance durant le voyage"
      ],
      excludedServices: [
        "Transfert vers Aéroport Mohammed V (A/R)",
        "Dépenses personnelles et Pourboires",
        "Dîner du premier jour",
        "Boissons durant les repas"
      ],
      whatToBring: [
        "Carte CNI originale ou Passeport (Obligatoire pour les vols)",
        "Vêtements légers et veste chaude pour le désert",
        "Chaussures de marche confortables",
        "Protection solaire (crème, lunettes, chapeau)",
        "Bagage souple (23 kg max)",
        "Espèces (Dirhams) pour l'artisanat"
      ],

      // Points de ramassage (Aéroport CMN)
      pickupPoints: {
        create: [
          {
            cityName: "Casablanca",
            locationNameFr: "Aéroport Mohammed V (Terminal 1 - Zone Enregistrement Royal Air Maroc)",
            locationNameAr: "مطار محمد الخامس (المحطة 1 - منطقة تسجيل الخطوط الملكية المغربية)",
            locationName: "Aéroport Mohammed V (Terminal 1 - RAM)",
            departureTime: "20:30",
            meetingTime: "20:30",
            orderIndex: 1,
            googleMapsUrl: "https://maps.app.goo.gl/CasablancaAirport",
          },
        ],
      },

      // Dates de départs hebdomadaires (Chaque Mercredi)
      departureDates: {
        create: [
          {
            startDate: new Date("2026-09-16T20:30:00.000Z"),
            endDate: new Date("2026-09-20T10:00:00.000Z"),
            totalCapacity: 24,
            minSeatsForGuaranteed: 4,
            basePriceDouble: 5900.00,
            priceTriple: 5600.00,
            singleRoomSupplement: 950.00,
            depositAmount: 1500.00,
            occupiedSeats: 8,
            status: DepartureStatus.GUARANTEED,
          },
          {
            startDate: new Date("2026-09-23T20:30:00.000Z"),
            endDate: new Date("2026-09-27T10:00:00.000Z"),
            totalCapacity: 24,
            minSeatsForGuaranteed: 4,
            basePriceDouble: 5900.00,
            priceTriple: 5600.00,
            singleRoomSupplement: 950.00,
            depositAmount: 1500.00,
            occupiedSeats: 4,
            status: DepartureStatus.GUARANTEED,
          },
          {
            startDate: new Date("2026-09-30T20:30:00.000Z"),
            endDate: new Date("2026-10-04T10:00:00.000Z"),
            totalCapacity: 24,
            minSeatsForGuaranteed: 4,
            basePriceDouble: 5900.00,
            priceTriple: 5600.00,
            singleRoomSupplement: 950.00,
            depositAmount: 1500.00,
            occupiedSeats: 2,
            status: DepartureStatus.OPEN_FOR_BOOKING,
          },
          {
            startDate: new Date("2026-10-07T20:30:00.000Z"),
            endDate: new Date("2026-10-11T10:00:00.000Z"),
            totalCapacity: 24,
            minSeatsForGuaranteed: 4,
            basePriceDouble: 5900.00,
            priceTriple: 5600.00,
            singleRoomSupplement: 950.00,
            depositAmount: 1500.00,
            occupiedSeats: 0,
            status: DepartureStatus.OPEN_FOR_BOOKING,
          },
          {
            startDate: new Date("2026-10-14T20:30:00.000Z"),
            endDate: new Date("2026-10-18T10:00:00.000Z"),
            totalCapacity: 24,
            minSeatsForGuaranteed: 4,
            basePriceDouble: 5900.00,
            priceTriple: 5600.00,
            singleRoomSupplement: 950.00,
            depositAmount: 1500.00,
            occupiedSeats: 0,
            status: DepartureStatus.OPEN_FOR_BOOKING,
          },
          {
            startDate: new Date("2026-10-21T20:30:00.000Z"),
            endDate: new Date("2026-10-25T10:00:00.000Z"),
            totalCapacity: 24,
            minSeatsForGuaranteed: 4,
            basePriceDouble: 5900.00,
            priceTriple: 5600.00,
            singleRoomSupplement: 950.00,
            depositAmount: 1500.00,
            occupiedSeats: 0,
            status: DepartureStatus.OPEN_FOR_BOOKING,
          },
        ],
      },

      // Les 5 étapes détaillées du programme
      itineraryDays: {
        create: [
          {
            dayNumber: 1,
            titleFr: "Envol Casablanca → Errachidia & Accueil au Tafilalet",
            titleAr: "رحلة الطيران الدار البيضاء ← الرشيدية والاستقبال بتافيلالت",
            timeSlot: "20h30 - 00h30",
            location: "Casablanca - Errachidia",
            locationName: "Aéroport Mohammed V (CMN) → Errachidia (ERH)",
            featuredImage: "/images/odyssee-du-sud/cover-merzouga-sunset.jpg",
            meals: ["Collation à bord RAM"],
            activityTags: ["Vol Direct Royal Air Maroc", "Accueil VIP", "Hôtel 4* Errachidia"],
            descriptionFr: "20h30 : Rendez-vous à l’Aéroport Mohammed V (Casablanca), zone d’enregistrement (présenter CNI/Passeport). Assistance à l’embarquement, remise des cartes d’embarquement et rappel du programme.\n23h00 : Décollage Casablanca → Errachidia.\n23h59 : Atterrissage à Errachidia. Assistance à la sortie (bagages, contrôle) et transfert vers votre hôtel (≈ 15–25 min).\n00h30 : Check-in à votre hôtel à Errachidia (catégorie 3/4*), briefing rapide pour le lendemain, temps de repos réparateur.\nHébergement : Hôtel 4* à Errachidia.",
            descriptionAr: "20:30 : اللقاء بمطار محمد الخامس (الدار البيضاء) بمنطقة التسجيل مع تقديم بطاقة التعريف أو جواز السفر. مساعدة خاصة في إنهاء إجراءات السفر وتسليم بطاقات الركوب ومراجعة البرنامج.\n23:00 : إقلاع طائرة الخطوط الملكية المغربية نحو الرشيدية.\n23:59 : الهبوط بمطار الرشيدية واستلام الأمتعة والمساعدة في الخروج.\nنقل مريح نحو الفندق (حوالي 15 إلى 25 دقيقة).\n00:30 : تسجيل الدخول بفندق 4 نجوم بالرشيدية، وتقديم توجيهات مختصرة لليوم الموالي وأخذ قسط من الراحة.\nالإقامة : فندق 4 نجوم بالرشيدية.",
          },
          {
            dayNumber: 2,
            titleFr: "Oasis de Meski, Terres de Fossiles & Bivouac Étoilé de Merzouga",
            titleAr: "واحة مسكي، مهد المستحاثات بأرفود وسحر مخيم مرزوكة الفاخر",
            timeSlot: "08h30 - 23h00",
            location: "Errachidia - Erfoud - Rissani - Merzouga",
            locationName: "Palais Meski, Musée Fossiles Erfoud, Rissani, Dunes Erg Chebbi",
            featuredImage: "/images/odyssee-du-sud/cover-merzouga-sunset.jpg",
            meals: ["Petit-déjeuner local", "Déjeuner du terroir", "Dîner gastronomique saharien"],
            activityTags: ["Source Bleue Meski", "Musée des Fossiles", "Safari 4x4 Dunes", "Village Gnawa Khamlia", "Bivouac de Luxe", "Soirée Tam-Tam"],
            descriptionFr: "Après un petit-déjeuner local à Errachidia, votre exploration débute par la sérénité du Palais Meski et sa célèbre Source Bleue, véritable émeraude nichée au creux d'une falaise. Votre route s'élève ensuite vers Erfoud, la capitale des fossiles, où vous visiterez le Musée des Macros et Micros fossiles ainsi que la source de Aïn Ati, témoins fascinants de l'histoire géologique de la région. L'immersion culturelle se poursuit à Rissani, berceau de la dynastie Alaouite, pour une visite solennelle du Mausolée de Moulay Ali Cherif suivie d'une balade sensorielle dans son célèbre souk aux dattes.\n\nL'aventure prend une dimension spectaculaire à votre arrivée à Merzouga. Là, vous embarquerez à bord de nos véhicules 4x4 pour une expédition palpitante au cœur des dunes de l'Erg Chebbi. Ce safari désertique vous mènera à la rencontre des musiciens Gnaoua au village de Khamlia, aux mines historiques de Mifis, ainsi qu'auprès des familles nomades pour partager un moment hors du temps. Après une halte paisible à l'Oasis de Hassi Labied, vous assisterez au spectacle grandiose du coucher de soleil embrasant les crêtes de sable. Votre journée s'achèvera en apothéose dans un bivouac de luxe, où un dîner raffiné sera suivi d'une soirée traditionnelle 'Tam-Tam' autour d'un feu de camp, sous l'un des ciels étoilés les plus purs au monde.\nHébergement : Bivouac de Luxe à Merzouga.",
            descriptionAr: "بعد إفطار محلي شهي بالرشيدية، تبدأ الجولة بالهدوء الساحر لقصر مسكي وعينه الزرقاء الشهيرة، واحة خضراء خلابة بين الصخور. تتواصل الرحلة نحو أرفود عاصمة المستحاثات والجيولوجيا العالمية لزيارة متحف المستحاثات الكبرى والصغرى ونبع عين العاطي. ثم نتجه إلى مدينة الريصاني مهد الدولة العلوية الشريفة، لزيارة ضريح المولى علي الشريف وجولة تراثية في سوق التمور التقليدي.\n\nتصل المغامرة ذروتها عند الوصول إلى مرزوكة : ركوب سيارات الدفع الرباعي 4x4 في رحلة سفاري مثيرة بين كثبان عرق الشبي العملاقة، وزيارة قرية كناوة بخملية والاستمتاع بإيقاعاتهم الروحية، ومناجم ميفيس القديمة وخيام البدو الرحل، مع استراحة في واحة حاسي لبيض. الاستمتاع بمشهد غروب الشمس الأسطوري وهو يصبغ الكثبان باللون الذهبي. المبيت بمخيم صحراوي ملكي فاخر، عشاء راقٍ وسهرة كناوية تقليدية 'طام طام' حول نار المخيم تحت أصفى سماء مرصعة بالنجوم.\nالإقامة : مخيم فاخر بمرزوكة.",
          },
          {
            dayNumber: 3,
            titleFr: "Lever de Soleil Saharien, Ingéniosité des Khattarat & Canyons du Dadès",
            titleAr: "شروق الشمس الصحراوي، خطارات الري التاريخية ومضايق دادس وتودغى",
            timeSlot: "06h00 - 20h30",
            location: "Merzouga - Tinjdad - Tinghir - Boumalne Dadès",
            locationName: "Dunes Erg Chebbi, Khattarat, Ksar El Khorbat, Gorges du Todgha, Doigts de Singe",
            featuredImage: "/images/odyssee-du-sud/gorges-du-todgha.jpg",
            meals: ["Petit-déjeuner saharien", "Déjeuner aux Gorges", "Dîner au Riad"],
            activityTags: ["Balade à Dromadaire", "Khattarat Millénaires", "Ksar El Khorbat", "Gorges du Todgha 300m", "Doigts de Singe Dadès", "Coucher de Soleil Tissadrine"],
            descriptionFr: "Votre journée s'éveille par un instant de pure magie : le lever du soleil sur les crêtes de l'Erg Chebbi, suivi d'une balade à dos de dromadaire pour savourer le silence sacré du Sahara. Après ce moment suspendu, vous quitterez les sables pour découvrir l'ingéniosité humaine aux Khattarat, ces systèmes d'irrigation souterrains séculaires. L'immersion historique se poursuit au Ksar El Khorbat, un village fortifié d'une authenticité rare, où vous plongerez dans l'art de vivre des populations oasiennes.\n\nLe périple atteint une dimension monumentale lors de votre arrivée aux Gorges du Todgha ; vous déjeunerez au pied de ces falaises de calcaire s'élevant à plus de 300 mètres, une expérience saisissante au bord de l'oued. En après-midi, vous rejoindrez la haute vallée pour atteindre Boumalne Dadès. Vous y découvrirez les étonnantes formations géologiques des 'Doigts de Singe', véritables sculptures naturelles taillées par l'érosion. Pour clore cette journée en apothéose, vous emprunterez la célèbre route sinueuse de Tissadrine pour assister à un coucher de soleil spectaculaire, où la roche s'embrase d'un rouge intense. Votre soirée se déroulera dans la sérénité de Boumalne Dadès, pour une nuitée réparatrice au cœur de l'un des paysages les plus photographiés du Maroc.\nHébergement : Riad de Luxe à Boumalne Dadès.",
            descriptionAr: "تبدأ الصبيحة بلحظة ساحرة مع شروق الشمس فوق كثبان عرق الشبي، متبوعة بجولة هادئة على ظهور الجمال للاستمتاع بسكينة الصحراء الخالدة. بعد ذلك نودع الرمال لنكتشف عبقرية الإنسان في نظام 'الخطارات' المائي الجوفي التاريخي. تتواصل الجولة بزيارة قصر الخربات بتنجداد، القرية الطينية المحصنة ذات الأصالة النادرة للتعرف على نمط عيش الواحات.\n\nنصل بعدها إلى مضايق تودغى المهيبة، حيث نتناول وجبة الغداء عند أقدام الجدران الصخرية الكلسية الشاهقة بارتفاع يفوق 300 متر بمحاذاة الوادي الرقراق. في المساء نصل إلى أعالي وادي دادس ببومالن دادس، لنكتشف التشكيلات الصخرية العجيبة 'أصابع القرد' المنحوتة بفعل الطبيعة، ونختم اليوم بمشهد غروب الشمس الخلاب عند منعرجات تيسدرين الشهيرة. قضاء أمسية مريحة في رياض فخم ببومالن دادس.\nالإقامة : رياض فاخر ببومالن دادس.",
          },
          {
            dayNumber: 4,
            titleFr: "Route des Mille Kasbahs, Skoura & Joyau UNESCO d'Aït Ben Haddou",
            titleAr: "طريق الألف قصبة، قلعة مكونة، واحة سكورة وقصر آيت بن حدو العالمي",
            timeSlot: "08h30 - 21h30",
            location: "Dadès - Kelaat M'Gouna - Skoura - Aït Ben Haddou - Ouarzazate",
            locationName: "Vallée des Roses, Kasbah Amridil, Ksar Aït Ben Haddou (UNESCO), Ouarzazate",
            featuredImage: "/images/odyssee-du-sud/ksar-ait-ben-haddou.jpg",
            meals: ["Petit-déjeuner", "Déjeuner Berbère", "Dîner de prestige"],
            activityTags: ["Vallée des Roses", "Kasbah Amridil XVIIe", "Ksar Aït Ben Haddou UNESCO", "Studios Ouarzazate", "Riad de Charme"],
            descriptionFr: "Cette étape finale de votre traversée terrestre vous transporte au cœur de l'histoire et des parfums du Sud. Après avoir quitté les hauteurs du Dadès, vous traverserez la pittoresque Vallée des Roses pour une halte à Kelaat M'Gouna, célèbre pour son artisanat local et ses produits à base de rose de Damas. Le voyage dans le temps se poursuit dans la palmeraie de Skoura avec la visite guidée de la Kasbah Amridil. Ce joyau architectural du XVIIe siècle, l'un des plus préservés du Maroc, vous révèlera tous les secrets de la vie traditionnelle dans les oasis.\n\nL'apothéose de votre journée vous attend au Ksar d'Aït Ben Haddou, site majestueux classé au patrimoine mondial de l'UNESCO. En parcourant les ruelles de ce village fortifié en terre, vous marcherez sur les traces des plus grandes productions cinématographiques mondiales (Gladiator, Game of Thrones). Votre périple s'achève à Ouarzazate, la 'Porte du Désert', où vous passerez votre dernière nuitée. Entre décors de films et palais de terre, cette soirée sera l'occasion de célébrer la fin de votre aventure saharienne avant votre envol le lendemain.\nHébergement : Riad de charme à Ouarzazate.",
            descriptionAr: "تنقلكم هذه المرحلة الأرضية الأخيرة إلى عمق تاريخ وعطور الجنوب المغربي. بعد مغادرة مرتفعات دادس، نعبر وادي الورود البديع مع توقف بقلعة مكونة المشهورة بمنتجات الورد الدمشقي العطري. نواصل السفر عبر الزمن في واحة نخيل سكورة بزيارة مؤطرة لقصبة أمريديل التاريخية، تحفة العمارة الطينية من القرن السابع عشر وأحد أكثر المعالم حفاظاً على أسرار الحياة الواحية.\n\nتصل الرحلة أوجها الثقافي بزيارة قصر آيت بن حدو التاريخي الأسطوري، المصنف تراثاً إنسانياً لليونسكو، حيث ستسيرون في الأزقة التي شهدت تصوير أعظم التحف السينمائية العالمية. نختم الجولة بمدينة ورزازات 'بوابة الصحراء وعاصمة السينما'، لقضاء ليلة ختامية راقية برياض أصيل تخليداً لذكريات هذه المغامرة الفريدة.\nالإقامة : رياض أصيل بورزازات.",
          },
          {
            dayNumber: 5,
            titleFr: "Vol Retour Ouarzazate → Casablanca & Fin de l'Odyssée",
            titleAr: "رحلة الطيران المباشرة ورزازات ← الدار البيضاء ونهاية الرحلة",
            timeSlot: "05h45 - 09h25",
            location: "Ouarzazate - Casablanca",
            locationName: "Aéroport d'Ouarzazate (OZZ) → Aéroport Mohammed V Casablanca (CMN)",
            featuredImage: "/images/odyssee-du-sud/ouarzazate-kasbah.jpg",
            meals: ["Petit-déjeuner matinal", "Service boisson à bord RAM"],
            activityTags: ["Check-out Express", "Vol Direct RAM OZZ-CMN", "Retour Grand Confort"],
            descriptionFr: "05h45 : Check-out de l’hôtel et transfert vers l’Aéroport d’Ouarzazate (OZZ).\n06h15 : Arrivée au terminal : enregistrement & dépôt bagages (présenter CNI/Passeport).\n07h55 : Décollage Ouarzazate → Casablanca (CMN) avec la Royal Air Maroc.\n09h25 : Atterrissage à Casablanca – Aéroport Mohammed V. Assistance à la sortie et fin de nos services.\nFIN DE SÉJOUR avec le corps reposé, l'esprit émerveillé et le souvenir inoubliable de la splendeur du Grand Sud.",
            descriptionAr: "05:45 : تسجيل الخروج من الفندق ونقل خاص إلى مطار ورزازات (OZZ).\n06:15 : الوصول إلى المطار لإنهاء إجراءات التسجيل وشحن الأمتعة (بطاقة التعريف/جواز السفر).\n07:55 : إقلاع رحلة الخطوط الملكية المغربية من ورزازات نحو الدار البيضاء.\n09:25 : الهبوط بمطار محمد الخامس بالدار البيضاء، المساعدة عند الخروج ونهاية خدماتنا بذكريات لا تُنسى عن بهاء وسحر الجنوب المغربي.",
          },
        ],
      },
    } as any,
  });

  console.log(`🎉 Circuit inséré avec succès !`);
  console.log(`ID: ${trip.id}`);
  console.log(`Slug: ${trip.slug}`);
  console.log(`Titre: ${trip.titleFr}`);
  console.log(`Durée: ${trip.durationDays} Jours / ${trip.durationNights} Nuits`);
  console.log(`Départs créés : 6 mercredis successifs`);
  console.log(`Étapes créées : 5 journées complètes`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors de l'insertion :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
