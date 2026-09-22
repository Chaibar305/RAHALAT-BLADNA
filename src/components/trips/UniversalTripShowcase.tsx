"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { 
  MapPin, Calendar, Clock, CheckCircle2, XCircle, 
  Sparkles, ArrowRight, ShieldCheck, Waves, BedDouble, Trees, 
  ChevronLeft, ChevronRight, MessageSquare, Compass, Hotel, Mountain,
  Tent, Sun, Camera
} from "lucide-react";
import { formatMAD } from "@/lib/utils";

// Données enrichies spécifiques pour chacun des circuits phares du Maroc
const CURATED_TRIPS_METADATA: Record<string, any> = {
  "voyage-azrou-zaouiat-ifrane": {
    categoryBadge: "Moyen Atlas Confort",
    categoryBadgeAr: "الأطلس المتوسط كونفور",
    highlightBadge: "2 Piscines · Auberge Jomana Park",
    highlightBadgeAr: "2 مسابح (مسبح خاص بالنساء)",
    frequency: "Chaque vendredi",
    frequencyAr: "كل يوم جمعة",
    accommodation: {
      name: "Auberge Jomana Park",
      nameAr: "نزل جمانة بارك (Auberge Jomana Park)",
      subtitle: "Hébergement de charme & 2 Piscines",
      subtitleAr: "مستوى راحة ممتاز ومسابح خاصة",
      nights: 2,
      roomTypes: ["Chambre Double", "Chambre Triple"],
      roomTypesAr: ["غرفة مزدوجة", "غرفة ثلاثية"],
      amenities: [
        "2 Grandes Piscines (dont une piscine 100% privée femmes)",
        "Espaces verts & jardins de montagne",
        "Aire de jeux pour enfants",
        "Salons traditionnels & vue panoramique",
      ],
      amenitiesAr: [
        "مسبحان كبيران (منهما مسبح خاص ومستقل 100% للنساء)",
        "مساحات خضراء وحدائق جبلية شاسعة",
        "فضاء وألعاب مخصصة للأطفال",
        "صالونات مغربية وإطلالات بانورامية",
      ],
    },
    photos: [
      {
        url: "/images/moyen-atlas/facade-jomana.jpg",
        title: "Façade & Parvis de l'Auberge Jomana Park",
        titleAr: "واجهة وحدائق نزل جمانة بارك",
        caption: "Architecture chaleureuse au pied des collines verdoyantes",
      },
      {
        url: "/images/moyen-atlas/piscine-jomana.jpg",
        title: "Le Grand Bassin de Baignade & Piscine Privée Femmes",
        titleAr: "المسبح الكبير والمسبح الخاص بالنساء",
        caption: "Eau turquoise et transats pour un ressourcement total",
      },
      {
        url: "/images/moyen-atlas/sources-oum-er-rbia.jpg",
        title: "Les Féeriques Sources & Cascades d'Oum Er-Rbia",
        titleAr: "شلالات ومنابع أم الربيع الساحرة",
        caption: "Eau pure jaillissant de la roche calcaire et terrasses ombragées",
      },
      {
        url: "/images/moyen-atlas/chambre-jomana.jpg",
        title: "Chambre Confort avec Balcon Panoramique",
        titleAr: "غرف فندقية مريحة مع شرفة مطلة على الطبيعة",
        caption: "Literie hôtelière haut de gamme, parquet et vue sur la nature",
      },
      {
        url: "/images/moyen-atlas/salon-jomana.jpg",
        title: "Salon Marocain Moderne & Espace Détente",
        titleAr: "صالون مغربي عصري وجلسات مريحة",
        caption: "Convivialité, espace thé et soirées chaleureuses",
      },
    ],
  },
  "ascension-jbel-moussa-belyounech": {
    categoryBadge: "Nord Aventure & Mer",
    categoryBadgeAr: "مغامرة الشمال والبحر",
    highlightBadge: "Sommet 851m & Plongée Belyounech",
    highlightBadgeAr: "قمة 851 م وغوص ببليونش",
    frequency: "Départs bimensuels",
    frequencyAr: "انطلاقات منتظمة",
    accommodation: {
      name: "Hôtel & Résidence du Détroit",
      nameAr: "فندق وإقامة مضيق جبل طارق",
      subtitle: "Confort, vue mer & proximité des criques",
      subtitleAr: "راحة وإطلالة بحرية قريبة من الشاطئ",
      nights: 2,
      roomTypes: ["Chambre Double", "Chambre Triple"],
      roomTypesAr: ["غرفة مزدوجة", "غرفة ثلاثية"],
      amenities: [
        "Hébergement sélectionné pour son calme et sa propreté",
        "Chambres avec sanitaires privés et eau chaude",
        "Repas du terroir marin et petits-déjeuners inclus",
        "Proximité immédiate des sentiers et de la baie",
      ],
      amenitiesAr: [
        "إقامة منتقاة بعناية لنظافتها وهدوئها التام",
        "غرف مجهزة بحمام خاص وماء ساخن",
        "وجبات بحرية محلية طازجة وفطور الصباح",
        "قرب مباشر من مسارات التسلق وشاطئ بليونش",
      ],
    },
    photos: [
      {
        url: "/images/jbel-moussa/sommet-jbel-moussa.jpg",
        title: "Sommet Historique du Jbel Moussa (851 m)",
        titleAr: "قمة جبل موسى الأسطورية (علو 851 م)",
        caption: "Victoire au sommet devant le célèbre panneau bleu avec vue panoramique à 360°",
      },
      {
        url: "/images/jbel-moussa/ilot-leila-vue-sommet.jpg",
        title: "Vue Plongeante sur l'Îlot Leïla & le Détroit",
        titleAr: "إطلالة ساحرة على جزيرة ليلى ومضيق جبل طارق",
        caption: "Les falaises vertigineuses surplombant les eaux cobalt de la Méditerranée",
      },
      {
        url: "/images/jbel-moussa/baie-turquoise-belyounech.jpg",
        title: "La Baie Turquoise & Criques Sauvages de Belyounech",
        titleAr: "الخليج الفيروزي والمسابح الصخرية لبليونش",
        caption: "Piscines naturelles d'eau cristalline idéales pour la baignade",
      },
      {
        url: "/images/jbel-moussa/plongee-sous-marine-belyounech.jpg",
        title: "Baptême de Plongée Sous-Marine Accompagnée",
        titleAr: "تجربة الغوص واستكشاف أعماق البحر المتوسط",
        caption: "Immersion magique avec moniteur certifié dans les fonds marins du détroit",
      },
      {
        url: "/images/jbel-moussa/coucher-soleil-detroit.jpg",
        title: "Crépuscule d'Or sur les Côtes du Détroit",
        titleAr: "غروب الشمس الذهبي بين المغرب وإسبانيا",
        caption: "Lumières féeriques au coucher du soleil face aux rivages espagnols",
      },
    ],
  },
  "magie-desert-merzouga-todra-3j": {
    categoryBadge: "Sahara & Dunes Dorées",
    categoryBadgeAr: "سحر الصحراء وكثبان مرزوكة",
    highlightBadge: "Bivouac de Luxe & Dromadaires",
    highlightBadgeAr: "مخيم فاخر وجولة جمال بالرمال",
    frequency: "Chaque vendredi",
    frequencyAr: "كل نهاية أسبوع",
    accommodation: {
      name: "Bivouac Nomade de Luxe Erg Chebbi",
      nameAr: "مخيم صحراوي فاخر بعرق الشبي",
      subtitle: "Tentes Khaïma de luxe avec sanitaires privés",
      subtitleAr: "خيام ملكية مجهزة بحمام خاص وكهرباء",
      nights: 2,
      roomTypes: ["Tente Double Luxe", "Tente Triple Luxe"],
      roomTypesAr: ["خيمة ملكية مزدوجة", "خيمة ملكية ثلاثية"],
      amenities: [
        "Tentes spacieuses avec lit king size et couettes chaudes",
        "Salle de bain privée dans chaque tente avec douche chaude",
        "Soirée animée feu de camp & musique Gnawa sous les étoiles",
        "Restauration gastronomique marocaine (dîner & petit-déjeuner)",
      ],
      amenitiesAr: [
        "خيام واسعة بأسرة فندقية مريحة وأغطية دافئة",
        "حمام خاص ومرحاض ودوش بالماء الساخن داخل كل خيمة",
        "سهرة حول النار وموسيقى كناوة تحت أضواء النجوم",
        "عشاء بلدي صحراوي فاخر وفطور صباح متكامل",
      ],
    },
    photos: [
      {
        url: "/images/merzouga/cover-merzouga.jpg",
        title: "Les Dunes Majestueuses de l'Erg Chebbi",
        titleAr: "كثبان عرق الشبي الذهبية الساحرة",
        caption: "Immersion au cœur des plus hautes dunes du Sahara marocain",
      },
      {
        url: "/images/merzouga/bivouac-luxe.jpg",
        title: "Bivouac de Luxe au Pied des Dunes",
        titleAr: "المخيم الفاخر بين الرمال",
        caption: "Confort hôtelier 5 étoiles sous la voûte céleste du désert",
      },
      {
        url: "/images/merzouga/caravane-dromadaires.jpg",
        title: "Caravane à Dos de Dromadaire au Coucher du Soleil",
        titleAr: "رحلة على ظهور الجمال وقت الغروب",
        caption: "Traversée des crêtes de sable aux lumières dorées",
      },
      {
        url: "/images/merzouga/quad-dunes.jpg",
        title: "Sensations Fortes en Quad & Buggy",
        titleAr: "إثارة ومغامرة الكواد بالصحراء",
        caption: "Session sportive palpitante sur les sommets dunaires",
      },
      {
        url: "/images/merzouga/khamlia-gnawa.jpg",
        title: "Tradition & Rythmes Gnawa à Khamlia",
        titleAr: "إيقاعات كناوة الأصيلة بقرية خملية",
        caption: "Accueil chaleureux et mélodies ancestrales des nomades",
      },
    ],
  },
  "perle-bleue-chefchaouen-akchour": {
    categoryBadge: "Escapade Rif & Nature",
    categoryBadgeAr: "سحر الريف والمدينة الزرقاء",
    highlightBadge: "Médina Bleue & Cascades d'Akchour",
    highlightBadgeAr: "شفشاون وشلالات أقشور الساحرة",
    frequency: "Chaque week-end",
    frequencyAr: "كل عطلة نهاية أسبوع",
    accommodation: {
      name: "Riad Traditionnel Andalou à Chefchaouen",
      nameAr: "رياض أندلسي أصيل بشفشاون",
      subtitle: "Hébergement de charme au cœur de la médina",
      subtitleAr: "إقامة ساحرة بأزقة المدينة القديمة",
      nights: 1,
      roomTypes: ["Chambre Double", "Chambre Triple"],
      roomTypesAr: ["غرفة مزدوجة", "غرفة ثلاثية"],
      amenities: [
        "Architecture andalouse authentique et décoration artisanale",
        "Terrasse panoramique sur les montagnes du Rif",
        "Petit-déjeuner montagnard beldi complet",
        "Emplacement idéal à quelques pas de la place Outa el-Hammam",
      ],
      amenitiesAr: [
        "معمار أندلسي مغربي وديكور تقليدي راقٍ",
        "شرفة بانورامية تطل على سفوح جبال الريف",
        "فطور الصباح الجبلي بالمنتجات المحلية الطازجة",
        "موقع استراتيجي وسط الأزقة الزرقاء وساحة وطاء الحمام",
      ],
    },
    photos: [
      {
        url: "/images/chefchaouen/cover-chefchaouen.jpg",
        title: "Les Ruelles Mythiques de la Cité Bleue",
        titleAr: "أزقة شفشاون الزرقاء الساحرة",
        caption: "Balade poétique dans l'une des plus belles médinas du monde",
      },
      {
        url: "/images/chefchaouen/cascades-akchour.jpg",
        title: "Les Vasques Émeraudes des Cascades d'Akchour",
        titleAr: "شلالات ومسابح أقشور الصافية",
        caption: "Randonnée aquatique rafraîchissante au Pont de Dieu",
      },
      {
        url: "/images/chefchaouen/place-outa-el-hammam.jpg",
        title: "Ambiance Chaleureuse de la Place Outa el-Hammam",
        titleAr: "أجواء ساحة وطاء الحمام الحيوية",
        caption: "Pause thé à la menthe face à la Grande Kasbah",
      },
      {
        url: "/images/chefchaouen/ruelles-bleues.jpg",
        title: "Contrastes Uniques & Portes Sculptées",
        titleAr: "جمالية الأبواب الأندلسية العريقة",
        caption: "Un véritable musée à ciel ouvert pour les passionnés de photos",
      },
      {
        url: "/images/chefchaouen/fontaine-andalouse.jpg",
        title: "Fraîcheur des Fontaines de Ras El Maa",
        titleAr: "عذوبة مياه رأس الماء",
        caption: "Les sources naturelles jaillissant des falaises calcaires",
      },
    ],
  },
  "odyssee-du-sud-merzouga-dades-ouarzazate": {
    categoryBadge: "Grand Tour Prestige",
    categoryBadgeAr: "رحلة الجنوب الكبرى (برستيج)",
    highlightBadge: "Vols RAM Inclus · Hôtels 4* & Bivouac",
    highlightBadgeAr: "طيران لارام وفنادق فاخرة",
    frequency: "Départs garantis",
    frequencyAr: "انطلاق مضمون",
    accommodation: {
      name: "Hôtels 4*, Riads de Charme & Bivouac Royal",
      nameAr: "فنادق 4 نجوم، رياضات فخمة ومخيم ملكي",
      subtitle: "Une sélection hôtelière haut de gamme tout au long du circuit",
      subtitleAr: "إقامات راقية ومريحة طيلة مراحل الرحلة",
      nights: 4,
      roomTypes: ["Chambre Double Deluxe", "Chambre Triple Deluxe"],
      roomTypesAr: ["غرفة فاخرة مزدوجة", "غرفة فاخرة ثلاثية"],
      amenities: [
        "Hôtel 4* à Errachidia & Riad de Charme à Boumalne Dadès",
        "Nuitée en Bivouac de Luxe au pied des dunes de Merzouga",
        "Riad de Prestige aux portes des studios d'Ouarzazate",
        "Demi-pension gastronomique et assistance continue",
      ],
      amenitiesAr: [
        "فندق 4 نجوم بالرشيدية ورياض ساحر بمضايق دادس",
        "مبيت بمخيم ملكي فاخر وسط كثبان مرزوكة",
        "رياض برستيج تاريخي بمدينة ورزازات",
        "وجبات عشاء وفطور راقية ومرافقة شاملة",
      ],
    },
    photos: [
      {
        url: "/images/odyssee-du-sud/cover-merzouga-sunset.jpg",
        title: "Coucher de Soleil Féerique sur l'Erg Chebbi",
        titleAr: "غروب الشمس الساحر فوق كثبان الرمال",
        caption: "Les nuances d'or et de pourpre au cœur du désert",
      },
      {
        url: "/images/odyssee-du-sud/gorges-du-todgha.jpg",
        title: "Les Gigantesques Falaises des Gorges du Todgha",
        titleAr: "مضايق تودغى المهيبة بارتفاع 300 متر",
        caption: "Canyon vertigineux traversé par une rivière cristalline",
      },
      {
        url: "/images/odyssee-du-sud/ksar-ait-ben-haddou.jpg",
        title: "Le Joyau UNESCO du Ksar d'Aït Ben Haddou",
        titleAr: "قصر آيت بن حدو التاريخي العالمي",
        caption: "Chef-d'œuvre d'architecture en terre cuite et décor de films mythiques",
      },
      {
        url: "/images/odyssee-du-sud/oasis-skoura-dades.jpg",
        title: "L'Oasis Verdoyante de Skoura & la Route des Kasbahs",
        titleAr: "واحات النخيل وقصبات سكورة ودادس",
        caption: "Palmeraies luxuriantes contrastant avec les crêtes de l'Atlas",
      },
      {
        url: "/images/odyssee-du-sud/ouarzazate-kasbah.jpg",
        title: "La Majestueuse Kasbah de Taourirt à Ouarzazate",
        titleAr: "قصبة تاوريرت العريقة بورزازات",
        caption: "Forteresse de légende aux portes du désert marocain",
      },
    ],
  },
  "barrage-asfalou-ghadir-hamma-kayak": {
    categoryBadge: "Rif Secret & Eaux Émeraude",
    categoryBadgeAr: "ريف تاونات وبحيرة أسفالو",
    highlightBadge: "Session Kayak & Jacuzzis Naturels",
    highlightBadgeAr: "كاياك ومسابح غدير حامة الطبيعية",
    frequency: "Chaque semaine",
    frequencyAr: "كل أسبوع",
    accommodation: {
      name: "Campement Aménagé Bab Asfalou",
      nameAr: "مخيم منظم على ضفاف بحيرة أسفالو",
      subtitle: "Bivouac étoilé au bord de l'eau & veillée feu de camp",
      subtitleAr: "تخييم منظم ومريح في الطبيعة تحت النجوم",
      nights: 2,
      roomTypes: ["Tente Double Équipée", "Tente Triple Équipée"],
      roomTypesAr: ["خيمة مجهزة لشخصين", "خيمة مجهزة لثلاثة أشخاص"],
      amenities: [
        "Tentes spacieuses avec matelas épais et couvertures fournies",
        "Emplacement panoramique exclusif au bord du lac",
        "Matériel complet de kayak et gilets de sauvetage certifiés",
        "Soirées feu de camp conviviales et cuisine du terroir",
      ],
      amenitiesAr: [
        "خيام واسعة مجهزة بأفرشة مريحة وأغطية دافئة",
        "موقع بانورامي هادئ ومباشر على ضفاف البحيرة",
        "معدات كاياك احترافية وسترات نجاة لجميع المستويات",
        "سهرات نار المخيم وتذوق الأطباق الجبلية التقليدية",
      ],
    },
  },
  "taghia-passage-berbere-zaouiat-ahansal": {
    categoryBadge: "Haut Atlas Sauvage",
    categoryBadgeAr: "مضايق تاغية والأطلس الكبير",
    highlightBadge: "Passage Berbère & Gorges Vertigineuses",
    highlightBadgeAr: "المسار الأمازيغي المعلق والشلالات",
    frequency: "Départs réguliers",
    frequencyAr: "رحلات مؤطرة",
    accommodation: {
      name: "Gîte Berbère Traditionnel de Taghia",
      nameAr: "مأوى جبلي أصيل بقرية تاغية",
      subtitle: "Hospitalité montagnarde au pied des parois calcaires",
      subtitleAr: "ضيافة أمازيغية دافئة في قلب الجبال الشاهقة",
      nights: 2,
      roomTypes: ["Chambre Confort Montagne", "Dortoir Aménagé"],
      roomTypesAr: ["غرفة جبلية مريحة", "فضاء إقامة مشترك"],
      amenities: [
        "Gîte chaleureux au cœur du cirque spectaculaire de Taghia",
        "Repas traditionnels berbères complets cuisinés sur place",
        "Eau chaude et sanitaires propres",
        "Déconnexion totale et immersion au sein de la communauté locale",
      ],
      amenitiesAr: [
        "مأوى دافئ في موقع أسطوري بين أجراف تاغية العالمية",
        "وجبات جبلية لذيذة محضرة من خيرات المنطقة",
        "ماء ساخن ونظافة تامة",
        "استرخاء تام وانفصال إيجابي عن صخب المدينة",
      ],
    },
  },
};

interface UniversalTripShowcaseProps {
  slug: string;
  dbTrip: any;
  locale: string;
}

export function UniversalTripShowcase({
  slug,
  dbTrip,
  locale,
}: UniversalTripShowcaseProps) {
  const isAr = locale === "ar";
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // 1. Récupération des métadonnées enrichies du circuit ou génération dynamique
  const curated = CURATED_TRIPS_METADATA[slug] || {};

  const title = isAr ? (dbTrip?.titleAr || dbTrip?.titleFr) : (dbTrip?.titleFr || dbTrip?.titleAr);
  const destination = isAr 
    ? (dbTrip?.destinationRegion || "المغرب") 
    : (dbTrip?.destinationRegion || "Maroc");

  // Photos de la galerie
  const rawPhotos: Array<{ url: string; title: string; titleAr?: string; caption?: string }> = 
    curated.photos ||
    (dbTrip?.galleryImages && dbTrip.galleryImages.length > 0
      ? dbTrip.galleryImages.map((img: string, idx: number) => ({
          url: img,
          title: isAr ? `${title} - صورة ${idx + 1}` : `${title} - Étape ${idx + 1}`,
          titleAr: `${title} - صورة ${idx + 1}`,
          caption: isAr ? "لقطة حية من معالم وبرنامج الرحلة" : "Aperçu authentique des étapes et paysages du circuit",
        }))
      : [
          {
            url: dbTrip?.coverImageUrl || "/images/hero-banner.jpg",
            title: title,
            caption: destination,
          },
        ]);

  const photos = rawPhotos.filter((p) => Boolean(p.url));

  const prevPhoto = () => {
    setActivePhotoIdx((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const nextPhoto = () => {
    setActivePhotoIdx((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  // Hébergement
  const accommodation = curated.accommodation || {
    name: isAr ? "إقامة فندقية ورياض معتمد" : "Hébergement de Charme & Confort",
    nameAr: "إقامة فندقية ورياض معتمد",
    subtitle: isAr ? "مستوى راحة ونظافة عالي" : "Confort, propreté et immersion locale",
    subtitleAr: "مستوى راحة ونظافة عالي",
    nights: dbTrip?.durationNights || 2,
    roomTypes: ["Chambre Double", "Chambre Triple"],
    roomTypesAr: ["غرفة مزدوجة", "غرفة ثلاثية"],
    amenities: [
      "Hébergement rigoureusement sélectionné par l'équipe Rahalat Bladna",
      "Chambres spacieuses avec literie confortable et sanitaires privés",
      "Espaces conviviaux pour se détendre après les activités",
      "Petits-déjeuners gourmands et accueil chaleureux",
    ],
    amenitiesAr: [
      "إقامة منتقاة بعناية فائقة من فريق رحلات بلادنا",
      "غرف واسعة بأفرشة مريحة ومرافق صحية خاصة",
      "فضاءات استرخاء ممتعة بعد الأنشطة اليومية",
      "فطور صباح كامل واستقبال دافئ",
    ],
  };

  // Points de ramassage
  const pickupPoints = (dbTrip?.pickupPoints && dbTrip.pickupPoints.length > 0)
    ? dbTrip.pickupPoints.map((p: any) => ({
        city: isAr ? (p.cityName || "المدينة") : (p.cityName || "Ville"),
        cityAr: p.cityName,
        location: isAr ? (p.locationNameAr || p.locationNameFr || p.cityName) : (p.locationNameFr || p.cityName),
        locationAr: p.locationNameAr || p.cityName,
        time: p.departureTime || "06:00",
      }))
    : [
        { city: "Casablanca", cityAr: "الدار البيضاء", location: "Gare Casa-Voyageurs", locationAr: "محطة الدار البيضاء المسافرين", time: "06:00" },
        { city: "Rabat", cityAr: "الرباط", location: "Gare Rabat-Ville", locationAr: "محطة الرباط المدينة", time: "07:15" },
      ];

  // Itinéraire Jour par Jour
  const itinerary = (dbTrip?.itineraryDays && dbTrip.itineraryDays.length > 0)
    ? dbTrip.itineraryDays.map((day: any) => {
        const dayNamesFr = ["Vendredi", "Samedi", "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi"];
        const dayNamesAr = ["الجمعة", "السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];
        const dayIdx = (day.dayNumber - 1) % 7;

        return {
          day: day.dayNumber,
          dayName: dayNamesFr[dayIdx],
          dayNameAr: dayNamesAr[dayIdx],
          title: isAr ? (day.titleAr || day.titleFr) : (day.titleFr || day.titleAr),
          desc: isAr ? (day.descriptionAr || day.descriptionFr) : (day.descriptionFr || day.descriptionAr),
          activities: day.activityTags && day.activityTags.length > 0 ? day.activityTags : [day.location || "Visite & Activités"],
        };
      })
    : [
        {
          day: 1,
          dayName: isAr ? "اليوم الأول" : "Jour 1",
          title: isAr ? "الانطلاق والاستقرار" : "Départ & Installation",
          desc: isAr ? "الانطلاق بالحافلة السياحية والوصول لمكان الإقامة والاسترخاء." : "Départ confortable, accueil et installation à l'hébergement.",
          activities: ["Départ", "Installation", "Repos"],
        },
      ];

  // Inclusions & Exclusions
  const includedList = isAr
    ? ((dbTrip?.includedServicesAr && dbTrip.includedServicesAr.length > 0) 
        ? dbTrip.includedServicesAr 
        : (dbTrip?.includedServicesFr || ["نقل سياحي مريح", "إقامة في النزل", "تأطير محترف"]))
    : ((dbTrip?.includedServicesFr && dbTrip.includedServicesFr.length > 0)
        ? dbTrip.includedServicesFr
        : ["Transport touristique climatisé grand confort A/R", "Hébergement sélectionné", "Encadrement professionnel"]);

  const excludedList = isAr
    ? ((dbTrip?.excludedServicesAr && dbTrip.excludedServicesAr.length > 0)
        ? dbTrip.excludedServicesAr
        : (dbTrip?.excludedServicesFr || ["المصاريف الشخصية", "الوجبات غير المذكورة"]))
    : ((dbTrip?.excludedServicesFr && dbTrip.excludedServicesFr.length > 0)
        ? dbTrip.excludedServicesFr
        : ["Dépenses personnelles et pourboires", "Repas libres non mentionnés"]);

  // Prix
  const basePrice = Number(dbTrip?.basePrice || 1200);
  const regularPrice = Math.round(basePrice * 1.12);
  const deposit = Number(dbTrip?.depositPerPerson || 400);

  const handleBooking = () => {
    const el = document.getElementById("booking-card-section") || document.getElementById("booking-widget");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.href = `/${locale}/trips/${slug}#booking-card-section`;
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Bonjour Rahalat Bladna, je souhaite réserver ou avoir des informations sur le circuit : "${dbTrip?.titleFr || title}"`
  );

  return (
    <section 
      aria-label="Présentation Officielle du Circuit"
      className="my-6 rounded-3xl overflow-hidden border border-[#073B5C]/20 bg-gradient-to-b from-white via-slate-50 to-white shadow-xl transition-all"
    >
      {/* 1. TOP BRAND HEADER (Bleu Atlantique #073B5C & Terracotta #D9683A) */}
      <div className="bg-[#073B5C] text-white px-6 py-7 sm:px-8 relative overflow-hidden">
        {/* Cercles d'ambiance en arrière-plan */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#2E6B57]/30 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-[#D9683A]/25 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-[#D9683A] text-white shadow-sm">
                {isAr ? (curated.categoryBadgeAr || "رحلة مميزة") : (curated.categoryBadge || "Circuit Coup de Cœur")}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#2E6B57] text-emerald-100 flex items-center gap-1 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                {isAr ? (curated.highlightBadgeAr || "تجربة متكاملة مضمونة") : (curated.highlightBadge || "Expérience Garantie")}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-sm text-white flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {isAr ? (curated.frequencyAr || "انطلاق نهاية الأسبوع") : (curated.frequency || "Départ Garanti")}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-snug">
              {title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-200 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D9683A] shrink-0" />
              <span>{destination}</span>
            </p>
          </div>

          {/* Badge Prix & Acompte Terracotta */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 flex flex-col items-start md:items-end justify-center shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              {isAr ? "سعر الرحلة المضمون" : "Tarif Évasion Garanti"}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-sm line-through text-slate-400 font-semibold">
                {formatMAD(regularPrice, locale)}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#D9683A] drop-shadow-sm">
                {formatMAD(basePrice, locale)}
              </span>
              <span className="text-xs text-slate-300">
                {isAr ? "/ مسافر" : "/ pers"}
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-300 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isAr 
                ? `التسبيق: ${formatMAD(deposit, locale)} فقط` 
                : `Acompte requis : ${formatMAD(deposit, locale)}`}
            </span>
            <span className="text-[10px] font-bold text-amber-300 mt-0.5">
              {isAr ? "تخفيض استثنائي ابتداءً من 3 أشخاص" : "Remise spéciale à partir de 3 personnes"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. CORPS DE PRÉSENTATION : GALERIE PHOTOS, HÉBERGEMENT & ITINÉRAIRE */}
      <div className="p-6 sm:p-8 space-y-8">
        
        {/* A. VISUAL CAROUSEL AVEC LES PHOTOS OFFICIELLES DU CIRCUIT */}
        {photos.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-[#073B5C] flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#2E6B57]" />
                <span>{isAr ? "ألبوم الصور الحصرية للرحلة والتجربة" : "Photos Officielles de l'Expérience & des Étapes"}</span>
              </h3>
              <span className="text-xs font-bold text-slate-500">
                {activePhotoIdx + 1} / {photos.length}
              </span>
            </div>

            {/* Grand écran de photo */}
            <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full rounded-2xl overflow-hidden bg-slate-900 shadow-md group">
              <Image
                src={photos[activePhotoIdx].url}
                alt={photos[activePhotoIdx].title || title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
                sizes="(max-width: 768px) 100vw, 1200px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

              {/* Légende de la photo */}
              <div className="absolute bottom-4 inset-x-4 sm:inset-x-6 z-10 text-white">
                <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#D9683A] text-white mb-1">
                  {isAr ? "معاينة حقيقية" : "Vue Réelle"}
                </span>
                <h4 className="text-base sm:text-xl font-black">
                  {isAr ? (photos[activePhotoIdx].titleAr || photos[activePhotoIdx].title) : photos[activePhotoIdx].title}
                </h4>
                {photos[activePhotoIdx].caption && (
                  <p className="text-xs sm:text-sm text-slate-300 font-medium">
                    {photos[activePhotoIdx].caption}
                  </p>
                )}
              </div>

              {/* Boutons de navigation */}
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevPhoto}
                    aria-label="Photo précédente"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-[#D9683A] text-white flex items-center justify-center backdrop-blur-sm transition z-20 cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={nextPhoto}
                    aria-label="Photo suivante"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-[#D9683A] text-white flex items-center justify-center backdrop-blur-sm transition z-20 cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                  </button>
                </>
              )}
            </div>

            {/* Vignettes miniatures */}
            {photos.length > 1 && (
              <div className="grid grid-cols-5 gap-2 sm:gap-3 pt-1">
                {photos.map((photo, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActivePhotoIdx(i)}
                    className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      activePhotoIdx === i
                        ? "border-[#D9683A] ring-2 ring-[#D9683A]/30 scale-95"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={photo.url}
                      alt={photo.title || `Vignette ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 20vw, 150px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* B. GRILLE HÉBERGEMENT & DÉPARTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Carte Hébergement */}
          <div className="bg-gradient-to-br from-[#2E6B57]/5 to-[#073B5C]/5 rounded-2xl p-5 sm:p-6 border border-[#2E6B57]/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#2E6B57] text-white flex items-center justify-center shadow-md shadow-[#2E6B57]/20">
                  <Hotel className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-[#073B5C]">
                    {isAr ? (accommodation.nameAr || accommodation.name) : accommodation.name}
                  </h4>
                  <span className="text-xs font-bold text-[#2E6B57]">
                    {isAr ? (accommodation.subtitleAr || accommodation.subtitle) : accommodation.subtitle}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#2E6B57]/15 text-[#2E6B57] border border-[#2E6B57]/30">
                {isAr ? `${accommodation.nights || 2} ليالي` : `${accommodation.nights || 2} Nuits`}
              </span>
            </div>

            {accommodation.roomTypes && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                  {isAr ? "أنواع الغرف المتاحة :" : "Configuration des Chambres :"}
                </span>
                <div className="flex flex-wrap gap-2">
                  {(isAr ? (accommodation.roomTypesAr || accommodation.roomTypes) : accommodation.roomTypes).map((rt: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">
                      <BedDouble className="w-3.5 h-3.5 text-[#D9683A]" />
                      {rt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {accommodation.amenities && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                  {isAr ? "مرافق وخدمات الإقامة :" : "Équipements & Atouts :" }
                </span>
                <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
                  {(isAr ? (accommodation.amenitiesAr || accommodation.amenities) : accommodation.amenities).map((am: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2E6B57] shrink-0 mt-0.5" />
                      <span>{am}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Carte Départs & Horaires */}
          <div className="bg-gradient-to-br from-[#D9683A]/5 to-[#073B5C]/5 rounded-2xl p-5 sm:p-6 border border-[#D9683A]/20 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#D9683A] text-white flex items-center justify-center shadow-md shadow-[#D9683A]/20">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-[#073B5C]">
                    {isAr ? "مواعيد ونقاط الانطلاق الرسمية" : "Horaires & Gares de Départ"}
                  </h4>
                  <span className="text-xs font-bold text-[#D9683A]">
                    {isAr ? "نقل سياحي معتمد ومريح ذهاباً وإياباً" : "Transport Touristique Climatisé A/R"}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                {pickupPoints.map((dep: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-[#073B5C] shrink-0" />
                      <div>
                        <span className="text-xs font-black text-[#073B5C] block">
                          {isAr ? (dep.cityAr || dep.city) : dep.city}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {isAr ? (dep.locationAr || dep.location) : dep.location}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-xs font-black bg-[#073B5C] text-white font-mono shrink-0">
                      {dep.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Note d'encadrement */}
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 font-semibold text-[#2E6B57]">
                <ShieldCheck className="w-4 h-4" />
                {isAr ? "مرافقة وتأطير محترف" : "Accompagnateur Rahalat Bladna"}
              </span>
              <span className="font-bold text-[#D9683A]">
                {isAr ? `${dbTrip?.durationDays || 3} أيام / ${dbTrip?.durationNights || 2} ليالي` : `${dbTrip?.durationDays || 3} Jours / ${dbTrip?.durationNights || 2} Nuits`}
              </span>
            </div>
          </div>

        </div>

        {/* C. PROGRAMME DÉTAILLÉ JOUR PAR JOUR */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-[#073B5C] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#D9683A]" />
            <span>{isAr ? "البرنامج المفصل للرحلة يوماً بعد يوم" : "Programme Chronologique du Séjour"}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {itinerary.map((step: any) => (
              <div 
                key={step.day}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-[#D9683A] transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-[#073B5C] text-white">
                      {isAr ? `اليوم ${step.day}` : `Jour ${step.day}`}
                    </span>
                    <span className="text-[11px] font-bold text-[#2E6B57]">
                      {isAr ? (step.dayNameAr || step.dayName) : step.dayName}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 leading-snug">
                    {step.title}
                  </h4>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {/* Tags d'activités */}
                {step.activities && step.activities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                    {step.activities.map((act: string, i: number) => (
                      <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {act}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* D. INCLUSIONS & NON-INCLUS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/80 rounded-2xl p-5 sm:p-6 border border-slate-200">
          {/* Ce qui est inclus */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-[#2E6B57] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAr ? "الخدمات والمصاريف المشمولة بالرحلة :" : "Ce qui est inclus dans le tarif :"}</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-700">
              {includedList.map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6B57] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Ce qui n'est pas inclus */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-[#D9683A] flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              <span>{isAr ? "غير مشمول في السعر :" : "Non inclus :"}</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              {excludedList.map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* E. CTA FINAL & BANDEAU DE RÉSERVATION */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#073B5C] via-[#073B5C] to-[#2E6B57] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-start">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#D9683A] block">
              {isAr ? "مقاعد محدودة · حجز فوري ومؤكد" : "Départs Garantis · Places Limitées"}
            </span>
            <h3 className="text-xl sm:text-2xl font-black">
              {isAr ? "هل أنت مستعد لخوض هذه المغامرة الساحرة ؟" : "Prêt pour une Évasion Inoubliable ?"}
            </h3>
            <p className="text-xs text-slate-200">
              {isAr
                ? `${formatMAD(basePrice, locale)} فقط عوض ${formatMAD(regularPrice, locale)} · تسبيق ${formatMAD(deposit, locale)} فقط لتأكيد المقعد`
                : `${formatMAD(basePrice, locale)} au lieu de ${formatMAD(regularPrice, locale)} · Acompte de ${formatMAD(deposit, locale)} seulement`}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleBooking}
              className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#D9683A] to-amber-600 hover:from-amber-600 hover:to-[#D9683A] text-white text-xs sm:text-sm font-black shadow-lg shadow-[#D9683A]/30 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{isAr ? "احجز مقعدك الآن" : "Réserver ma place"}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>

            <a
              href={`https://wa.me/212603660658?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? "استفسار واتساب" : "WhatsApp"}</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}

export default UniversalTripShowcase;
