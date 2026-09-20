import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { 
  MapPin, Calendar, Clock, ChevronRight, Compass, Sparkles
} from "lucide-react";
import { BookingCard } from "@/components/booking/BookingCard";
import { MerzougaInteractiveDetail, ProgramStep } from "@/components/trips/MerzougaInteractiveDetail";
import { GalleryItem } from "@/components/shared/TripGallery";
import { formatMAD } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { ScheduledWeekBanner } from "@/components/trips/ScheduledWeekBanner";
import { getScheduledThisWeekTripsAction } from "@/actions/trip.actions";
import { TripFaqAccordion } from "@/components/trips/TripFaqAccordion";
import { TripReviewsCarousel } from "@/components/trips/TripReviewsCarousel";
import { MobileFloatingBookingBar } from "@/components/trips/MobileFloatingBookingBar";
import { MoyenAtlasConfortShowcase } from "@/components/trips/MoyenAtlasConfortShowcase";
import { JbelMoussaShowcase } from "@/components/trips/JbelMoussaShowcase";
import { MetaViewContent } from "@/components/analytics/MetaViewContent";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const trip = await prisma.trip.findUnique({
    where: { slug: params.slug },
  });

  if (!trip) {
    return {
      title: "Circuit Non Trouvé | Rahalat Bladna",
      description: "Découvrez nos circuits et voyages organisés au Maroc avec Rahalat Bladna.",
    };
  }

  const isAr = params.locale === "ar";
  const title = isAr
    ? `${trip.titleAr || trip.titleFr} | رحلات بلادنا`
    : `${trip.titleFr} - Voyage Organisé au Maroc | Rahalat Bladna`;

  const rawDescription = isAr
    ? (trip.overviewAr || trip.shortDescriptionAr || trip.shortDescriptionFr || "")
    : (trip.overviewFr || trip.shortDescriptionFr || trip.shortDescriptionAr || "");

  const description = rawDescription.trim().slice(0, 160);
  const baseUrl = "https://www.rahalatbladna.ma";
  const imageUrl = trip.coverImageUrl || "/images/hero-banner.jpg";
  const fullImageUrl = imageUrl.startsWith("http") ? imageUrl : `${baseUrl}${imageUrl}`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${params.locale}/trips/${trip.slug}`,
      languages: {
        "fr-MA": `${baseUrl}/fr/trips/${trip.slug}`,
        "ar-MA": `${baseUrl}/ar/trips/${trip.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${params.locale}/trips/${trip.slug}`,
      siteName: "Rahalat Bladna",
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: trip.titleFr,
        },
      ],
      locale: isAr ? "ar_MA" : "fr_MA",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [fullImageUrl],
    },
  };
}

export default async function TripDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const t = await getTranslations({ locale, namespace: "booking" });
  const isAr = locale === "ar";

  const dbTrip = await prisma.trip.findFirst({
    where: { slug },
    include: {
      pickupPoints: { orderBy: { orderIndex: "asc" } },
      itineraryDays: { orderBy: { dayNumber: "asc" } },
      addons: true,
      departureDates: { orderBy: { startDate: "asc" } },
    },
  });

  const scheduledTripsRes = await getScheduledThisWeekTripsAction();
  const scheduledTrips = scheduledTripsRes.trips || [];

  const isChefchaouen = slug.includes("chefchaouen") || slug.includes("akchour");
  const isAsfalou = slug.includes("asfalou") || slug.includes("ghadir");
  const isMoyenAtlas = slug.includes("moyen-atlas") || slug.includes("azrou") || slug.includes("ifrane") || slug.includes("jomana");
  const isJbelMoussa = slug.includes("jbel-moussa") || slug.includes("belyounech") || slug.includes("moussa");

  // Tourist sites images & details for Jbel Moussa & Belyounech
  const jbelMoussaTouristSites: GalleryItem[] = [
    {
      id: "moussa-1",
      title: "Vue Majestueuse sur l'Îlot Leïla & le Détroit de Gibraltar",
      titleAr: "المشهد البانورامي لجزيرة ليلى ومضيق جبل طارق",
      location: "Jbel Moussa, Belyounech",
      locationAr: "جبل موسى، بليونش",
      description: "Panorama époustouflant plongeant dans les eaux cobalt de la Méditerranée depuis les falaises de la colonne d'Hercule marocaine.",
      descriptionAr: "إطلالة ساحرة تحبس الأنفاس على مياه البحر الأبيض المتوسط الزرقاء وجزيرة ليلى التاريخية من سفوح جبل موسى.",
      imageUrl: "/images/jbel-moussa/ilot-leila-vue-sommet.jpg",
      tag: "Panorama & Mythologie",
      tagAr: "بانوراما وأساطير",
    },
    {
      id: "moussa-2",
      title: "Sommet Historique du Jbel Moussa (851 m)",
      titleAr: "قمة جبل موسى التاريخية (علو 851 متر)",
      location: "Sommet du Jbel Moussa",
      locationAr: "قمة جبل موسى",
      description: "Triomphe au sommet face au panneau mythique, vue panoramique à 360° sur Gibraltar, les côtes ibériques et les montagnes du Rif.",
      descriptionAr: "الوصول الملحمي للقمة عند اللوحة الأيقونية بارتفاع 851 م، وإطلالة شاملة على سواحل إسبانيا وجبل طارق.",
      imageUrl: "/images/jbel-moussa/sommet-jbel-moussa.jpg",
      tag: "Ascension & Défi",
      tagAr: "تحدي وتسلق",
    },
    {
      id: "moussa-3",
      title: "Baie Turquoise & Eaux Cristallines de Belyounech",
      titleAr: "الخليج الفيروزي والمياه البلورية لقرية بليونش",
      location: "Plage de Belyounech",
      locationAr: "شاطئ بليونش",
      description: "Piscines naturelles couleur émeraude au pied de falaises calcaires géantes, idéales pour la baignade et la déconnexion marine.",
      descriptionAr: "مسابح طبيعية زمردية صافية عند أقدام الأجراف الصخرية المهيبة، مثالية للسباحة والاستجمام البحري.",
      imageUrl: "/images/jbel-moussa/baie-turquoise-belyounech.jpg",
      tag: "Baignade & Détente",
      tagAr: "سباحة واستجمام",
    },
    {
      id: "moussa-4",
      title: "Baptême de Plongée Sous-Marine dans le Détroit",
      titleAr: "تجربة الغوص واستكشاف أعماق مضيق جبل طارق",
      location: "Fonds Marins du Détroit, Belyounech",
      locationAr: "أعماق مضيق جبل طارق، بليونش",
      description: "Immersion sous-marine magique avec équipement complet et moniteurs certifiés pour explorer la faune et la flore méditerranéenne.",
      descriptionAr: "غوص استثنائي بالأسطوانة ومعدات احترافية برفقة مدربين معتمدين لاكتشاف الكائنات البحرية والشعاب الصخرية.",
      imageUrl: "/images/jbel-moussa/plongee-sous-marine-belyounech.jpg",
      tag: "Aventure Sous-Marine",
      tagAr: "مغامرة بحرية",
    },
    {
      id: "moussa-5",
      title: "Coucher de Soleil Doré sur les Eaux du Détroit",
      titleAr: "غروب الشمس الذهبي فوق مياه المضيق",
      location: "Cap Belyounech",
      locationAr: "رأس بليونش",
      description: "Dernières lueurs embrasant l'horizon maritime entre l'Afrique et l'Europe, ambiance paisible et contemplative.",
      descriptionAr: "لحظات الغروب الساحرة بين القارتين الإفريقية والأوروبية وأجواء مسائية مريحة للروح.",
      imageUrl: "/images/jbel-moussa/coucher-soleil-detroit.jpg",
      tag: "Magie Crépusculaire",
      tagAr: "غروب ساحر",
    },
  ];

  const jbelMoussaProgramSteps: ProgramStep[] = [
    {
      id: "prog-moussa-1",
      siteId: "moussa-5",
      dayLabel: "Vendredi soir — Départ & Cap sur le Nord",
      dayLabelAr: "الجمعة مساءً — الانطلاق نحو الشمال",
      title: "Départs de Casablanca (19h00) & Rabat (20h45) vers Belyounech",
      titleAr: "الانطلاق من محطات القطار بالبيضاء والرباط نحو الشمال",
      timing: "19h00 - 02h00",
      timingAr: "19:00 - 02:00",
      desc: "Regroupement à Casa-Voyageurs (19h00) puis Rabat-Ville (20h45). Trajet de nuit confortable en transport touristique climatisé, arrivée, check-in et nuitée de repos.",
      descAr: "انطلاق مريح من محطات الدار البيضاء والرباط، سفر ليلي مريح، الوصول والاستقرار بالإقامة وأخذ قسط من الراحة.",
      highlights: ["Casa 19h / Rabat 20h45", "Transport climatisé A/R", "Nuitée repos"],
      highlightsAr: ["انطلاق البيضاء/الرباط", "نقل سياحي مريح", "مبيت بالإقامة"],
      iconType: "bivouac",
    },
    {
      id: "prog-moussa-2",
      siteId: "moussa-2",
      dayLabel: "Samedi — Ascension du Jbel Moussa (851m)",
      dayLabelAr: "السبت — صعود قمة جبل موسى وسهرة تعارف",
      title: "Ascension Guidée (~4h), Déjeuner au Sommet & Veillée Conviviale",
      titleAr: "مسار التسلق الجبلي، غداء بالقمة وسهرة سمر ممتعة",
      timing: "07h00 - 22h30",
      timingAr: "07:00 - 22:30",
      desc: "Petit-déjeuner énergétique inclus. Randonnée d'ascension avec guides locaux certifiés. Vue 360° sur Gibraltar, l'Espagne et l'îlot Leïla. Pique-nique au sommet face à la mer, descente, dîner traditionnel inclus et veillée conviviale.",
      descAr: "فطور الصباح، بدء التسلق رفقة مرشدين محليين، وصول للقمة وتناول وجبة الغداء أمام مشهد بانورامي عالمي. نزول، عشاء تقليدي وسهرة عائلية مسلية.",
      highlights: ["Sommet 851m", "Vue 360° Gibraltar & Espagne", "Pique-nique inclus", "Dîner & Veillée"],
      highlightsAr: ["علو 851 م", "إطلالة جبل طارق وإسبانيا", "غداء بالقمة", "عشاء وسهرة"],
      iconType: "gorges",
    },
    {
      id: "prog-moussa-3",
      siteId: "moussa-3",
      dayLabel: "Dimanche — Plage de Belyounech, Plongée & Retour",
      dayLabelAr: "الأحد — شاطئ بليونش، الغوص والعودة",
      title: "Matinée Féerique à Belyounech, Option Baptême de Plongée & Retour",
      titleAr: "استجمام بشاطئ بليونش، تجربة الغوص ورحلة العودة",
      timing: "07h30 - 21h00",
      timingAr: "07:30 - 21:00",
      desc: "Petit-déjeuner face à la mer inclus. Deux options : Baptême de plongée avec moniteur pro (+350 DH) ou baignade dans les piscines naturelles. Déjeuner libre poisson frais au village, puis retour vers Rabat (19h30) et Casablanca (21h00).",
      descAr: "فطور الصباح، وقت حر بشاطئ بليونش (سباحة بالمياه البلورية أو خيار تجربة الغوص +350 درهم)، غداء سمك طازج، ثم رحلة العودة نحو الرباط والبيضاء.",
      highlights: ["Eaux turquoise", "Option Plongée (+350 DH)", "Déjeuner poisson", "Retour Casa/Rabat"],
      highlightsAr: ["مياه فيروزية", "غوص اختياري (+350 د)", "غداء سمك", "العودة المريحة"],
      iconType: "dunes",
    },
  ];

  // Tourist sites images & details for Moyen Atlas (Auberge Jomana Park, Oum Er-Rbia, Zaouiat Ifrane)
  const moyenAtlasTouristSites: GalleryItem[] = [
    {
      id: "jomana-1",
      title: "Façade Élégante & Jardins de l'Auberge Jomana Park",
      titleAr: "واجهة وحدائق نزل جمانة بارك الأنيقة",
      location: "Azrou - Auberge Jomana Park",
      locationAr: "أزرو - نزل جمانة بارك",
      description: "Architecture de caractère au cœur de la nature rifo-atlasique, vaste esplanade avec grand escalier d'accueil et jardins paysagers.",
      descriptionAr: "معمار جبلي أصيل في أحضان الطبيعة الهادئة، بهو ومدخل واسع مع حدائق خضراء منسقة بعناية.",
      imageUrl: "/images/moyen-atlas/facade-jomana.jpg",
      tag: "Hébergement & Confort",
      tagAr: "إقامة وراحة",
    },
    {
      id: "jomana-2",
      title: "2 Grandes Piscines (dont 1 Piscine Privée Femmes)",
      titleAr: "مسبحان كبيران (منهما مسبح خاص ومستقل للنساء)",
      location: "Auberge Jomana Park",
      locationAr: "نزل جمانة بارك",
      description: "Deux grands bassins d'eau cristalline avec transats et vue panoramique, garantissant confort, fraîcheur et totale intimité pour les femmes.",
      descriptionAr: "مسبحان شاسعان بمياه عذبة نقية مع كراسي استجمام وإطلالة جبلية، مع مسبح خاص يضمن الخصوصية التامة للنساء.",
      imageUrl: "/images/moyen-atlas/piscine-jomana.jpg",
      tag: "Détente & Aquatique",
      tagAr: "سباحة واستجمام",
    },
    {
      id: "jomana-3",
      title: "Sources & Cascades d'Oum Er-Rbia",
      titleAr: "شلالات ومنابع أم الربيع الساحرة",
      location: "Sources Oum Er-Rbia",
      locationAr: "شلالات ومنابع أم الربيع",
      description: "47 sources jaillissant spectaculairement de la montagne rocheuse, déjeuners berbères traditionnels sous les tonnelles au bord de l'eau.",
      descriptionAr: "47 عيناً طبيعية تنبثق بغزارة من الجبال الصخرية، وجلسات غداء تقليدية تحت العرائش على ضفاف المياه العذبة.",
      imageUrl: "/images/moyen-atlas/sources-oum-er-rbia.jpg",
      tag: "Merveille Naturelle",
      tagAr: "معلم طبيعي ساحر",
    },
    {
      id: "jomana-4",
      title: "Chambres Doubles & Triples avec Balcon Panoramique",
      titleAr: "غرف فندقية مزدوجة وثلاثية مع شرفة بانورامية",
      location: "Auberge Jomana Park",
      locationAr: "نزل جمانة بارك",
      description: "Chambres lumineuses et spacieuses, literie haut de gamme, parquet en bois chaleureux, chauffage et balcon ouvrant sur les collines.",
      descriptionAr: "غرف فندقية فسيحة ومشرقة، أفرشة مريحة، أرضية خشبية دافئة، تدفئة مركزية وشرفة تطل على الطبيعة الخلابة.",
      imageUrl: "/images/moyen-atlas/chambre-jomana.jpg",
      tag: "Confort Hôtelier",
      tagAr: "راحة فندقية",
    },
    {
      id: "jomana-5",
      title: "Salons Marocains Conviviaux & Espaces de Vie",
      titleAr: "صالونات مغربية عصرية وجلسات عائلية مريحة",
      location: "Auberge Jomana Park",
      locationAr: "نزل جمانة بارك",
      description: "Espaces salon raffinés habillés de banquettes bleu azur et bois clair, idéals pour partager le thé à la menthe et se détendre le soir.",
      descriptionAr: "فضاءات جلوس مغربية راقية بألوان هادئة وديكور خشبي عصري، مثالية لجلسات الشاي والسمر العائلي.",
      imageUrl: "/images/moyen-atlas/salon-jomana.jpg",
      tag: "Convivialité & Ambiance",
      tagAr: "أصالة وضيافة",
    },
  ];

  const moyenAtlasProgramSteps: ProgramStep[] = [
    {
      id: "prog-moyen-1",
      siteId: "jomana-1",
      dayLabel: "Vendredi — Départ & Installation",
      dayLabelAr: "الجمعة — الانطلاق والاستقرار",
      title: "Départ (Casa 10h00 / Rabat 11h30), Check-in & Piscines à Jomana Park",
      titleAr: "الانطلاق من البيضاء والرباط، الاستقرار بنزل جمانة بارك والسباحة",
      timing: "10h00 - 22h00",
      timingAr: "10:00 - 22:00",
      desc: "Départ en autocar grand confort depuis Casablanca (10h00) et Rabat (11h30). Arrivée à l'Auberge Jomana Park, installation, baignade dans les 2 piscines (dont piscine privée femmes), balade à Azrou et dîner inclus.",
      descAr: "انطلاق بحافلة سياحية مريحة من الدار البيضاء (10:00) والرباط (11:30). الاستقرار بنزل جمانة بارك، سباحة بالمسابح، جولة بأزرو وعشاء ترحيبي لذيذ.",
      highlights: ["Casa 10h / Rabat 11h30", "2 Piscines & Détente", "Dîner inclus"],
      highlightsAr: ["انطلاق البيضاء/الرباط", "مسبح خاص بالنساء", "عشاء بلدي مشمول"],
      iconType: "bivouac",
    },
    {
      id: "prog-moyen-2",
      siteId: "jomana-3",
      dayLabel: "Samedi — Sources Oum Er-Rbia & Zaouiat Ifrane",
      dayLabelAr: "السبت — منابع أم الربيع وزاوية إفران",
      title: "Cascades d'Oum Er-Rbia, Déjeuner Berbère à Zaouiat Ifrane & Soirée Ifrane",
      titleAr: "شلالات أم الربيع، غداء تقليدي بزاوية إفران وسهرة إفران",
      timing: "08h30 - 22h30",
      timingAr: "08:30 - 22:30",
      desc: "Petit-déjeuner à l'auberge. Découverte des 47 sources jaillissantes d'Oum Er-Rbia. Déjeuner traditionnel au bord de l'eau à Zaouiat Ifrane et randonnée le long des cascades. Sortie nocturne festive à Ifrane.",
      descAr: "فطور بالنزل، جولة بمنابع أم الربيع وشلالاتها الطبيعية، غداء تقليدي بزاوية إفران، مشي مائي بين الوديان وسهرة مسائية ممتعة بمدينة إفران.",
      highlights: ["Sources Oum Er-Rbia", "Déjeuner Zaouiat Ifrane", "Soirée Ifrane"],
      highlightsAr: ["منابع أم الربيع", "غداء بزاوية إفران", "سهرة إفران"],
      iconType: "gorges",
    },
    {
      id: "prog-moyen-3",
      siteId: "jomana-2",
      dayLabel: "Dimanche — Piscine, Forêt des Cèdres & Retour",
      dayLabelAr: "الأحد — سباحة، غابة الأرز غورو والعودة",
      title: "Matinée Farniente Piscine, Cèdre Gouraud & Macaques de Barbarie",
      titleAr: "استجمام بالمسبح، غابة الأرز ومداعبة قردة المكاك والعودة",
      timing: "09h00 - 19h30",
      timingAr: "09:00 - 19:30",
      desc: "Matinée libre au bord des piscines de l'auberge. Après le check-out, arrêt au mythique Cèdre Gouraud dans la Forêt des Cèdres pour observer les singes magots. Pause déjeuner libre et retour vers Rabat et Casablanca.",
      descAr: "صباح حر للسباحة والاستجمام بمسابح النزل، زيارة غابة أرز غورو ومداعبة قردة المكاك البربرية بالهواء الطلق، ثم رحلة العودة نحو الرباط والدار البيضاء.",
      highlights: ["Piscine matinale", "Cèdre Gouraud & Singes", "Retour Casa/Rabat"],
      highlightsAr: ["سباحة صباحية", "أرز غورو والمكاك", "العودة المريحة"],
      iconType: "dunes",
    },
  ];

  // Tourist sites images & details for Barrage Asfalou & Ghadir Hamma
  const asfalouTouristSites: GalleryItem[] = [
    {
      id: "asfalou-1",
      title: "Vue Panoramique & Criques du Barrage Asfalou",
      titleAr: "المشهد البانورامي وخليج سد أسفالو",
      location: "Barrage Asfalou, Taher Souk",
      locationAr: "سد أسفالو، طهر السوق",
      description:
        "Un vaste miroir d'eau turquoise lové au creux des collines du Rif, entouré de pins d'Alep et d'eucalyptus avec une vue panoramique imprenable.",
      descriptionAr:
        "بحيرة مائية فيروزية هادئة في أحضان جبال الريف وتاونات، محاطة بغابات الصنوبر وإطلالات بانورامية تسحر العيون.",
      imageUrl: "/images/asfalou/cover-asfalou.jpg",
      tag: "Panorama & Nature",
      tagAr: "طبيعة وبانوراما",
    },
    {
      id: "asfalou-2",
      title: "Session Kayak & Exploration des Eaux Turquoises",
      titleAr: "جولة الكاياك واستكشاف المياه الفيروزية",
      location: "Lac du Barrage Asfalou",
      locationAr: "بحيرة سد أسفالو",
      description:
        "Navigation en kayak sur les eaux calmes du lac, accessible aux débutants comme aux initiés avec gilets de sauvetage certifiés.",
      descriptionAr:
        "تجربة تجديف ساحرة بقوارب الكاياك في المياه الهادئة، مناسبة للجميع مع سترات نجاة وتأطير محترف.",
      imageUrl: "/images/asfalou/session-kayak.jpg",
      tag: "Aventure Aquatique",
      tagAr: "مغامرة مائية",
    },
    {
      id: "asfalou-3",
      title: "Passage Secret & Grotte d'Émeraude",
      titleAr: "المعبر الصخري ومغارة المياه الزمردية",
      location: "Criques Sauvages d'Asfalou",
      locationAr: "المضايق العذراء لأسفالو",
      description:
        "Traversée sensationnelle en kayak sous les formations rocheuses et les voûtes naturelles de pierre taillées par l'eau cristalline.",
      descriptionAr:
        "عبور استثنائي بقوارب الكاياك تحت التجاويف والتشكيلات الصخرية المنحوتة بالمياه النقية العذبة.",
      imageUrl: "/images/asfalou/kayak-grotte.jpg",
      tag: "Exploration & Frissons",
      tagAr: "استكشاف وتحدي",
    },
    {
      id: "asfalou-4",
      title: "Piscines & Jacuzzis Naturels de Ghadir Hamma",
      titleAr: "المسابح والجاكوزي الصخري الطبيعي لغدير حامة",
      location: "Ghadir Hamma (Taher Souk - Marnissa)",
      locationAr: "غدير حامة (طهر السوق - مرنيسة)",
      description:
        "Sources pures alimentant l'Oued Ouergha, vasques sculptées dans la roche calcaire, cascades rafraîchissantes et jacuzzis naturels exceptionnels.",
      descriptionAr:
        "ينابيع عذبة نقية تغذي واد ورغة، مسابح صخرية طبيعية منحوتة، شلالات مياه باردة وجاكوزي طبيعي فريد.",
      imageUrl: "/images/asfalou/ghadir-hamma-baignade.jpg",
      tag: "Baignade Eau Vive",
      tagAr: "سباحة في المياه الحية",
    },
    {
      id: "asfalou-5",
      title: "Déjeuner Panoramique & Saveurs du Terroir Rifain",
      titleAr: "غداء بانورامي وتذوق أطباق جبال الريف",
      location: "Campement de Bab Asfalou",
      locationAr: "مخيم باب أسفالو",
      description:
        "Repas conviviaux face au lac et aux montagnes au coucher du soleil, tajines traditionnels au feu de bois et veillée autour du feu de camp.",
      descriptionAr:
        "وجبات تقليدية شهية فوق هضبة مطلة على البحيرة والغروب، طواجن على الحطب وسهرات حية تحت النجوم.",
      imageUrl: "/images/asfalou/dejeuner-panorama.jpg",
      tag: "Convivialité & Terroir",
      tagAr: "ضيافة وأصالة",
    },
  ];

  const asfalouProgramSteps: ProgramStep[] = [
    {
      id: "prog-asf-1",
      siteId: "asfalou-1",
      dayLabel: "Vendredi soir — Départ & Installation",
      dayLabelAr: "الجمعة مساءً — الانطلاق والاستقرار",
      title: "Départs des Gares & Nuitée sous les Étoiles à Bab Asfalou",
      titleAr: "الانطلاق من محطات القطار والمبيت تحت نجوم باب أسفالو",
      timing: "18h30 - 23h30",
      timingAr: "18:30 - 23:30",
      desc: "Départs confortables depuis Casa-Voyageurs (18h30), Rabat-Ville (20h00) et Fès (23h00). Pause dîner libre et arrivée au campement pour une nuit sous les tentes équipées.",
      descAr: "انطلاق مريح من محطات الدار البيضاء (18:30)، الرباط (20:00) وفاس (23:00). توقف للعشاء ثم الوصول للمخيم بباب أسفالو والمبيت في الخيام المجهزة.",
      highlights: ["Départs Casa/Rabat/Fès", "Campement aménagé", "Ambiance nocturne"],
      highlightsAr: ["انطلاق من كازا/الرباط/فاس", "مخيم مجهز", "هدوء الليل"],
      iconType: "bivouac",
    },
    {
      id: "prog-asf-2",
      siteId: "asfalou-2",
      dayLabel: "Samedi matin — Lac d'Asfalou",
      dayLabelAr: "السبت صباحاً — بحيرة أسفالو",
      title: "Randonnée Douce & Aventure en Kayak sur le Lac",
      titleAr: "مشي خفيف ومغامرة الكاياك على مياه البحيرة",
      timing: "08h30 - 13h00",
      timingAr: "08:30 - 13:00",
      desc: "Petit-déjeuner complet face au panorama du barrage, marche d'approche (~45 min) vers les criques, baignade surveillée et session kayak inoubliable.",
      descAr: "فطور كامل أمام مشهد السد، مسار مشي سهل نحو الخلجان، سباحة مؤطرة وسترات نجاة متوفرة مع جولة كاياك ممتعة.",
      highlights: ["Session Kayak", "Panorama lac", "Baignade surveillée"],
      highlightsAr: ["جولة كاياك", "إطلالة البحيرة", "سباحة مؤطرة"],
      iconType: "quad",
    },
    {
      id: "prog-asf-3",
      siteId: "asfalou-3",
      dayLabel: "Samedi après-midi — Exploration",
      dayLabelAr: "السبت بعد الزوال — استكشاف التجاويف",
      title: "Passages Aquatiques Secrets & Déjeuner Traditionnel",
      titleAr: "استكشاف الممرات الصخرية وغداء تقليدي لذيذ",
      timing: "13h30 - 16h30",
      timingAr: "13:30 - 16:30",
      desc: "Déjeuner traditionnel copieux, détente sur les berges et navigation en kayak le long des falaises et grottes creusées par l'eau.",
      descAr: "وجبة غداء تقليدية شهية، راحة على ضفاف البحيرة وتجديف بمحاذاة الممرات الصخرية والكهوف المنحوتة.",
      highlights: ["Passages secrets", "Déjeuner traditionnel", "Shooting photos"],
      highlightsAr: ["ممرات صخرية", "غداء تقليدي", "جلسات تصوير"],
      iconType: "gorges",
    },
    {
      id: "prog-asf-4",
      siteId: "asfalou-5",
      dayLabel: "Samedi soir — Feu de Camp",
      dayLabelAr: "السبت مساءً — نار المخيم",
      title: "Jeux Collectifs, Dîner Convivial & Veillée Étoilée",
      titleAr: "ألعاب جماعية، عشاء لذيذ وسهرة حول النار",
      timing: "17h30 - 23h00",
      timingAr: "17:30 - 23:00",
      desc: "Retour au campement, douches, jeux collectifs et dîner savoureux autour du grand feu de camp à la belle étoile.",
      descAr: "عودة للمخيم، استراحة، ألعاب جماعية ترفيهية وعشاء حول نار المخيم وسهرة ممتعة تحت السماء الصافية.",
      highlights: ["Feu de camp", "Dîner convivial", "Ciel étoilé"],
      highlightsAr: ["نار المخيم", "عشاء جماعي", "سماء النجوم"],
      iconType: "khamlia",
    },
    {
      id: "prog-asf-5",
      siteId: "asfalou-4",
      dayLabel: "Dimanche — Ghadir Hamma",
      dayLabelAr: "الأحد — غدير حامة",
      title: "Randonnée Aquatique aux Vasques & Jacuzzis de Ghadir Hamma",
      titleAr: "مشي مائي واستكشاف جاكوزي وشلالات غدير حامة",
      timing: "09h00 - 15h00",
      timingAr: "09:00 - 15:00",
      desc: "Transfert vers Taher Souk, randonnée aquatique (~30 min), baignade dans les cascades et piscines rocheuses naturelles, déjeuner au bord de l'eau puis retour.",
      descAr: "تنقل نحو طهر السوق، مشي مائي ممتع (~30 دقيقة)، سباحة في المياه العذبة والشلالات الطبيعية وغداء على ضفاف الوادي قبل العودة.",
      highlights: ["Jacuzzis naturels", "Cascades d'eau vive", "Déjeuner au bord de l'eau"],
      highlightsAr: ["جاكوزي طبيعي", "شلالات عذبة", "غداء على ضفاف الوادي"],
      iconType: "dunes",
    },
  ];

  // Tourist sites images & details for Chefchaouen & Akchour
  const chefchaouenTouristSites: GalleryItem[] = [
    {
      id: "chef-1",
      title: "Ruelles Bleues & Artisanat Rifain d'El Kharrazine",
      titleAr: "أزقة شفشاون الزرقاء وحرفيو حي الخرازين",
      location: "Médina de Chefchaouen",
      locationAr: "المدينة العتيقة، شفشاون",
      description:
        "Labyrinthe féerique de venelles peintes à la chaux bleue indigo, lanternes traditionnelles suspendues, tapis rifains tissés main et échoppes d'artisans locaux.",
      descriptionAr:
        "أزقة ساحرة ملونة بالجير والنيلي، فوانيس نحاسية ومظلات معلقة، منسوجات صوفية يدوية وتذكارات أصيلة تعكس هوية جبال الريف.",
      imageUrl: "/images/chefchaouen/ruelles-bleues.jpg",
      tag: "Cœur de la Médina",
      tagAr: "قلب المدينة الزرقاء",
    },
    {
      id: "chef-2",
      title: "Panorama de la Médina & Mosquée Espagnole (Bouzafar)",
      titleAr: "المشهد البانورامي من هضبة بوزعافار والمسجد الإسباني",
      location: "Colline de Bouzafar, Chefchaouen",
      locationAr: "هضبة بوزعافار، شفشاون",
      description:
        "Vue panoramique spectaculaire sur toute la cité bleue adossée aux monts Kelaa et Meggou. Spot incontournable pour admirer le coucher du soleil embrasant les toits de tuiles.",
      descriptionAr:
        "إطلالة بانورامية ساحرة تحبس الأنفاس للمدينة الزرقاء الممتدة على سفوح الجبال، وموقع أسطوري لتأمل غروب الشمس بين القمم.",
      imageUrl: "/images/chefchaouen/panoramique-medina.jpg",
      tag: "Vue Panoramique",
      tagAr: "إطلالة بانورامية",
    },
    {
      id: "chef-3",
      title: "Fontaine Andalouse & Architecture Historique",
      titleAr: "السقاية الأندلسية والمعمار الموريسكي الأصيل",
      location: "Quartier Souika, Médina",
      locationAr: "حي السويقة، شفشاون",
      description:
        "Fontaines murales historiques d'inspiration andalouse, alimentées par la source cristalline de Ras El Maa, ornées de zelliges et de briques rouges centenaires.",
      descriptionAr:
        "سقايات تاريخية بديعة بروافد أندلسية عريقة من مياه رأس الماء العذبة، مزينة بالزليج والآجر التقليدي الموروث عن الموريسكيين.",
      imageUrl: "/images/chefchaouen/fontaine-andalouse.jpg",
      tag: "Patrimoine & Histoire",
      tagAr: "تراث وتاريخ",
    },
    {
      id: "chef-4",
      title: "Cascades d'Akchour & Arche Naturelle du Pont de Dieu",
      titleAr: "شلالات أقشور العذراء وقنطرة ربي الطبيعية",
      location: "Parc National de Talassemtane, Akchour",
      locationAr: "المنتزه الوطني لتلاسمطان، أقشور",
      description:
        "Randonnée revigorante le long de la rivière turquoise d'Akchour, bassins de baignade naturels et découverte de l'impressionnante arche calcaire du Pont de Dieu.",
      descriptionAr:
        "مسار مشي طبيعي ممتع بين الغابات الخضراء بمحاذاة مياه وادي أقشور الفيروزية العذبة، مسابح طبيعية وقنطرة ربي الصخرية المعلقة.",
      imageUrl: "/images/chefchaouen/cascades-akchour.jpg",
      tag: "Merveille Naturelle",
      tagAr: "معلم طبيعي عذري",
    },
    {
      id: "chef-5",
      title: "Place Outa el-Hammam & Kasbah Historique",
      titleAr: "ساحة وطاء الحمام وقصبة شفشاون الأثرية",
      location: "Place Outa el-Hammam, Chefchaouen",
      locationAr: "ساحة وطاء الحمام، شفشاون",
      description:
        "Le cœur battant de la médina avec ses cafés aux terrasses animées sous les grands mûriers, face aux remparts ocre de la Kasbah bâtie en 1471 et sa tour d'art.",
      descriptionAr:
        "المركز الحيوي والاجتماعي للمدينة بمقاهيه الشعبية العريقة تحت أشجار التوت، قبالة القصبة الأثرية بأسوارها الدفاعية وحدائقها الأندلسية.",
      imageUrl: "/images/chefchaouen/place-outa-el-hammam.jpg",
      tag: "Art de Vivre & Culture",
      tagAr: "ثقافة وأصالة",
    },
  ];

  const chefchaouenProgramSteps: ProgramStep[] = [
    {
      id: "prog-chef-1",
      siteId: "chef-1",
      dayLabel: "Jour 1 — Matin & Arrivée",
      dayLabelAr: "اليوم الأول — الصباح والوصول",
      title: "Arrivée à Chefchaouen & Immersion dans les Ruelles Bleues",
      titleAr: "الوصول لمدينة شفشاون وجولة استكشافية في الأزقة الزرقاء",
      timing: "10h30 - 13h30",
      timingAr: "10:30 - 13:30",
      desc: "Accueil chaleureux, installation au riad et balade guidée au cœur des venelles indigo d'El Kharrazine et Souika à la découverte des artisans locaux.",
      descAr: "استقبال بالرياض التقليدي، ثم الانطلاق في جولة إرشادية بين دروب المدينة الزرقاء الساحرة واكتشاف إبداعات الصناع التقليديين.",
      highlights: ["Ruelles indigo", "Artisanat rifain", "Photos souvenirs uniques"],
      highlightsAr: ["أزقة زرقاء ساحرة", "صناعة تقليدية", "صور تذكارية"],
      iconType: "dunes",
    },
    {
      id: "prog-chef-2",
      siteId: "chef-5",
      dayLabel: "Jour 1 — Après-midi",
      dayLabelAr: "اليوم الأول — بعد الزوال",
      title: "Détente à la Place Outa el-Hammam & Visite de la Kasbah",
      titleAr: "استراحة بساحة وطاء الحمام وزيارة معالم القصبة التاريخية",
      timing: "14h30 - 17h00",
      timingAr: "14:30 - 17:00",
      desc: "Déjeuner typique rifain, pause thé à la menthe sous les arbres de la place historique et visite du musée ethnographique de la Kasbah.",
      descAr: "غداء بوجبات جبلية شهية، جلسة شاي منعش بساحة وطاء الحمام وزيارة المتحف الإثنوغرافي وبرج المراقبة التاريخي.",
      highlights: ["Place Outa el-Hammam", "Thé à la menthe", "Kasbah du XVe siècle"],
      highlightsAr: ["ساحة وطاء الحمام", "شاي مغربي", "قصبة القرن 15"],
      iconType: "bivouac",
    },
    {
      id: "prog-chef-3",
      siteId: "chef-2",
      dayLabel: "Jour 1 — Coucher de Soleil",
      dayLabelAr: "اليوم الأول — قبيل الغروب",
      title: "Coucher de Soleil Panoramique depuis la Mosquée Espagnole",
      titleAr: "مشاهدة غروب الشمس البانورامي من هضبة المسجد الإسباني",
      timing: "17h30 - 19h30",
      timingAr: "17:30 - 19:30",
      desc: "Montée facile vers la colline de Bouzafar pour contempler le soleil disparaître derrière les crêtes du Rif et la ville bleue s'illuminer à la tombée de la nuit.",
      descAr: "صعود ممتع نحو هضبة بوزعافار لالتقاط أروع المشاهد لغروب الشمس ومشاهدة أضواء المدينة الزرقاء وهي تتلألأ ليلاً.",
      highlights: ["Coucher de soleil", "Vue panoramique 360°", "Mosquée Bouzafar"],
      highlightsAr: ["غروب أسطوري", "مشهد بانورامي 360°", "هضبة بوزعافار"],
      iconType: "gorges",
    },
    {
      id: "prog-chef-4",
      siteId: "chef-3",
      dayLabel: "Jour 1 — Soirée",
      dayLabelAr: "اليوم الأول — الأمسية",
      title: "Soirée Conviviale & Halte aux Fontaines de Ras El Maa",
      titleAr: "أمسية هادئة وجولة عند ينابيع وسقايات رأس الماء",
      timing: "20h00 - 22h30",
      timingAr: "20:00 - 22:30",
      desc: "Dîner savoureux au Riad, dégustation de fromage de chèvre frais du Rif et balade nocturne au murmure des cascades de Ras El Maa.",
      descAr: "عشاء مغربي لذيذ بالرياض، تذوق جبن الماعز الطري الذي تشتهر به المنطقة، وجولة ليلية هادئة برأس الماء.",
      highlights: ["Dîner au Riad", "Fromage de chèvre rifain", "Ambiance nocturne apaisante"],
      highlightsAr: ["عشاء بالرياض", "جبن بلدي طازج", "أجواء ليلية مميزة"],
      iconType: "khamlia",
    },
    {
      id: "prog-chef-5",
      siteId: "chef-4",
      dayLabel: "Jour 2 — Matinée Randonnée",
      dayLabelAr: "اليوم الثاني — الصباح والمغامرة",
      title: "Expédition Aquatique aux Cascades d'Akchour & Pont de Dieu",
      titleAr: "مغامرة طبيعية واستكشاف شلالات أقشور وقنطرة ربي",
      timing: "08h30 - 14h00",
      timingAr: "08:30 - 14:00",
      desc: "Départ matinal pour Akchour. Randonnée guidée vivifiante au bord des eaux émeraude, baignade dans les vasques naturelles et contemplation du gigantesque Pont de Dieu.",
      descAr: "انطلاق مبكر نحو وادي أقشور، جولة مشي مؤطرة بين الشلالات والمسابح الصخرية الطبيعية وقنطرة ربي قبل وجبة غداء تاجينية على ضفاف النهر.",
      highlights: ["Cascades féeriques", "Pont de Dieu", "Déjeuner tajine au bord de l'eau"],
      highlightsAr: ["شلالات عذبة", "قنطرة ربي الصخرية", "طاجين فوق ماء النهر"],
      iconType: "quad",
    },
  ];

  // Tourist sites images & details for Merzouga
  const merzougaTouristSites: GalleryItem[] = [
    {
      id: "site-1",
      title: "Dunes de l'Erg Chebbi & Caravane de Dromadaires",
      titleAr: "كثبان عرق الشبي وجولة قوافل الجمال",
      location: "Erg Chebbi, Merzouga",
      locationAr: "عرق الشبي، مرزوكة",
      description:
        "Les plus spectaculaires dunes dorées du Sahara marocain culminant à plus de 150m de hauteur. Balade inoubliable à dos de dromadaire au coucher de soleil.",
      descriptionAr:
        "أعلى وأجمل الكثبان الرملية الذهبية في الصحراء المغربية بارتفاع يفوق 150 متراً. جولة ساحرة على ظهور الجمال عند غروب الشمس.",
      imageUrl: "/images/merzouga/caravane-dromadaires.jpg",
      tag: "Site Incontournable",
      tagAr: "وجهة أساسية",
    },
    {
      id: "site-2",
      title: "Bivouac de Luxe & Ciel Étoilé du Sahara",
      titleAr: "المخيم الصحراوي الفاخر وسماء النجوم",
      location: "Cœur des Dunes, Merzouga",
      locationAr: "قلب الكثبان، مرزوكة",
      description:
        "Nuit féerique sous des tentes nomades grand confort, dîner gastronomique marocain, folklore traditionnel et observation de la Voie Lactée autour du feu de camp.",
      descriptionAr:
        "ليلة ساحرة في خيام فاخرة، عشاء تقليدي مغربي، فلكلور محلي وتأمل مجرة درب التبانة والنجوم حول نار المخيم.",
      imageUrl: "/images/merzouga/bivouac-luxe.jpg",
      tag: "Expérience Nuitée",
      tagAr: "تجربة المبيت",
    },
    {
      id: "site-3",
      title: "Gorges du Todra & Falaises de Tinghir",
      titleAr: "مضايق تودغى الشاهقة بتنغير",
      location: "Tinghir, Haut Atlas Oriental",
      locationAr: "تنغير، الأطلس الكبير الشرقي",
      description:
        "Gigantesques parois rocheuses vertigineuses de 300 mètres de hauteur bordant un cours d'eau cristallin, haut lieu mondial d'escalade et de randonnée.",
      descriptionAr:
        "جدران صخرية عملاقة بارتفاع 300 متر بمحاذاة وادي بمياه عذبة نقية، موقع عالمي شهير لتسلق الجبال والمشي الطبيعي.",
      imageUrl: "/images/merzouga/gorges-todra.jpg",
      tag: "Merveille Naturelle",
      tagAr: "معلم طبيعي",
    },
    {
      id: "site-4",
      title: "Village de Khamlia & Musique Gnawa du Désert",
      titleAr: "قرية خملية وموسيقى كناوة الأصيلة",
      location: "Khamlia, 7km de Merzouga",
      locationAr: "قرية خملية، 7 كلم عن مرزوكة",
      description:
        "Village habité par les descendants des peuples subsahariens qui perpétuent la musique et les rythmes spirituels Gnawa avec karkabous et guembri.",
      descriptionAr:
        "قرية تاريخية حافظ سكانها على التراث الروحي لموسيقى كناوة الصحراوية عبر آلات القراقب والكمبري والضيافة الأصيلة.",
      imageUrl: "/images/merzouga/khamlia-gnawa.jpg",
      tag: "Culture & Patrimoine",
      tagAr: "ثقافة وتراث",
    },
    {
      id: "site-5",
      title: "Aventure en Quad & Buggy sur les Crêtes",
      titleAr: "مغامرة الكواد والدفع الرباعي على الكثبان",
      location: "Pistes Sahariennes, Merzouga",
      locationAr: "مسارات الصحراء، مرزوكة",
      description:
        "Sensations fortes et adrénaline sur les dunes avec circuits guidés en quad puissant et franchissement des crêtes au coucher de soleil.",
      descriptionAr:
        "حماس وإثارة وسط الرمال عبر جولات مؤطرة بدراجات الكواد القوية والسيارات رباعية الدفع عند الغروب.",
      imageUrl: "/images/merzouga/quad-dunes.jpg",
      tag: "Activité & Adrénaline",
      tagAr: "مغامرة وأنشطة",
    },
  ];

  const merzougaProgramSteps: ProgramStep[] = [
    {
      id: "prog-1",
      siteId: "site-1",
      dayLabel: "Jour 1 — Après-midi",
      dayLabelAr: "اليوم الأول — بعد الزوال",
      title: "Arrivée aux Dunes de l'Erg Chebbi & Coucher de Soleil",
      titleAr: "الوصول إلى عرق الشبي وغروب الشمس فوق الرمال الذهبية",
      timing: "17h00 - 19h30",
      timingAr: "17:00 - 19:30",
      desc: "Accueil chaleureux avec thé à la menthe traditionnel et départ à dos de dromadaire pour une traversée mémorable des dunes au soleil couchant.",
      descAr: "استقبال تقليدي بالشاي المنعش والانطلاق على ظهور الجمال لمشاهدة مشهد الغروب الأسطوري فوق الكثبان الذهبية.",
      highlights: ["Caravane nomade", "Coucher de soleil doré", "Thé de bienvenue"],
      highlightsAr: ["قافلة الجمال", "غروب الشمس الذهبي", "شاي الضيافة"],
      iconType: "dunes",
    },
    {
      id: "prog-2",
      siteId: "site-2",
      dayLabel: "Jour 1 — Soirée & Nuitée",
      dayLabelAr: "اليوم الأول — الأمسية والمبيت",
      title: "Veillée Saharienne, Dîner sous les Étoiles & Bivouac de Luxe",
      titleAr: "سهرة صحراوية، عشاء تحت النجوم ومبيت فاخر",
      timing: "20h00 - 23h30",
      timingAr: "20:00 - 23:30",
      desc: "Installation dans vos tentes nomades équipées (douches et sanitaires privés), grand dîner marocain et soirée conviviale autour du feu de camp.",
      descAr: "استقرار في الخيام المجهزة بأرقى وسائل الراحة (حمامات خاصة)، عشاء تقليدي وسهرة موسيقية حية حول النار تحت سماء النجوم.",
      highlights: ["Dîner traditionnel", "Feu de camp", "Ciel étoilé du Sahara"],
      highlightsAr: ["عشاء مغربي فاخر", "نار المخيم", "سماء النجوم الصحراوية"],
      iconType: "bivouac",
    },
    {
      id: "prog-3",
      siteId: "site-3",
      dayLabel: "Jour 2 — Matin",
      dayLabelAr: "اليوم الثاني — الصباح",
      title: "Randonnée Spectaculaire dans les Canyons des Gorges du Todra",
      titleAr: "جولة استكشافية مذهلة بين جدران مضايق تودغى الشاهقة",
      timing: "10h00 - 13h00",
      timingAr: "10:00 - 13:00",
      desc: "Balade vivifiante au pied des parois rocheuses de 300 mètres longeant la rivière Todra, véritable joyau géologique du Sud marocain.",
      descAr: "جولة ممتعة بمحاذاة الوادي العذب بين الجدران الصخرية العملاقة التي ترتفع لأكثر من 300 متر في منظر طبيعي فريد.",
      highlights: ["Falaises de 300m", "Oued cristallin", "Palmeraie de Tinghir"],
      highlightsAr: ["جدران 300 متر", "وادي عذب نقي", "واحة تنغير"],
      iconType: "gorges",
    },
    {
      id: "prog-4",
      siteId: "site-4",
      dayLabel: "Jour 2 — Après-midi",
      dayLabelAr: "اليوم الثاني — بعد الزوال",
      title: "Immersion Culturelle à Khamlia & Rythmes Spirituels Gnawa",
      titleAr: "زيارة تراثية لقرية خملية والإنصات لإيقاعات كناوة الروحية",
      timing: "15h30 - 18h00",
      timingAr: "15:30 - 18:00",
      desc: "Découverte des traditions séculaires des musiciens de Khamlia, dégustation de thé et immersion dans l'héritage musical d'Afrique subsaharienne.",
      descAr: "اكتشاف تاريخ وتراث سكان قرية خملية والاستمتاع بموسيقى كناوة الأصيلة مع ضيافة الشاي والتمر الصحراوي.",
      highlights: ["Musique Gnawa", "Guembri & Qraqeb", "Partage culturel"],
      highlightsAr: ["موسيقى كناوة", "الكمبري والقراقب", "كرم الضيافة"],
      iconType: "khamlia",
    },
    {
      id: "prog-5",
      siteId: "site-5",
      dayLabel: "Jour 3 — Matin",
      dayLabelAr: "اليوم الثالث — الصباح",
      title: "Lever de Soleil Magique & Option Quad / Buggy sur les Crêtes",
      titleAr: "شروق الشمس الأسطوري وجولة اختيارية بالكواد على الرمال",
      timing: "06h30 - 09h00",
      timingAr: "06:30 - 09:00",
      desc: "Réveil matinal pour contempler les premières lueurs sur le désert, suivi pour les amateurs d'aventure d'une virée en quad sur les crêtes.",
      descAr: "مشاهدة شروق الشمس الساحر فوق الكثبان يليه لعشاق الحماس جولة ممتعة بدراجات الكواد قبل بدء رحلة العودة.",
      highlights: ["Lever de soleil", "Option Quad 4x4", "Photos panoramiques"],
      highlightsAr: ["شروق الشمس الساحر", "كواد اختياري", "صور بانورامية"],
      iconType: "quad",
    },
  ];

  const dbTripAny = dbTrip as any;

  const dbProgramSteps: ProgramStep[] = dbTrip?.itineraryDays && dbTrip.itineraryDays.length > 0
    ? dbTrip.itineraryDays.map((d: any, i: number) => {
        const timing = d.timeSlot || (isAr ? "طيلة اليوم" : "09h00 - 18h00");
        return {
          id: d.id,
          siteId: `day-site-${d.id}`,
          dayLabel: isAr
            ? `اليوم ${d.dayNumber}${d.locationName || d.location ? ` — ${d.locationName || d.location}` : ""}`
            : `Jour ${d.dayNumber}${d.locationName || d.location ? ` — ${d.locationName || d.location}` : ""}`,
          dayLabelAr: `اليوم ${d.dayNumber}${d.locationName || d.location ? ` — ${d.locationName || d.location}` : ""}`,
          title: isAr && d.titleAr ? d.titleAr : d.titleFr,
          titleAr: d.titleAr || d.titleFr,
          timing: timing,
          timingAr: timing.replace(/h/g, ":"),
          desc: isAr && d.descriptionAr ? d.descriptionAr : d.descriptionFr,
          descAr: d.descriptionAr || d.descriptionFr,
          highlights: d.activityTags && d.activityTags.length > 0 ? d.activityTags : [d.location, "Visite guidée"],
          highlightsAr: d.activityTags && d.activityTags.length > 0 ? d.activityTags : [d.location, "جولة مؤطرة"],
          iconType: (i % 2 === 0 ? "dunes" : "bivouac") as any,
        };
      })
    : [];

  const dbGalleryItems: GalleryItem[] = dbTrip?.itineraryDays && dbTrip.itineraryDays.length > 0
    ? dbTrip.itineraryDays.map((d: any) => ({
        id: `day-site-${d.id}`,
        title: d.titleFr,
        titleAr: d.titleAr || d.titleFr,
        location: d.locationName || d.location,
        locationAr: d.locationName || d.location,
        description: d.descriptionFr,
        descriptionAr: d.descriptionAr || d.descriptionFr,
        imageUrl: d.featuredImage || dbTrip.coverImageUrl || "/images/merzouga/cover-merzouga.jpg",
        tag: `Étape Jour ${d.dayNumber}`,
        tagAr: `برنامج اليوم ${d.dayNumber}`,
      }))
    : [];

  const galleryItems = isJbelMoussa
    ? jbelMoussaTouristSites
    : (isMoyenAtlas
        ? moyenAtlasTouristSites
        : (dbGalleryItems.length > 0
            ? dbGalleryItems
            : (isAsfalou ? asfalouTouristSites : (isChefchaouen ? chefchaouenTouristSites : merzougaTouristSites))));

  const programSteps = isJbelMoussa
    ? jbelMoussaProgramSteps
    : (isMoyenAtlas
        ? moyenAtlasProgramSteps
        : (dbProgramSteps.length > 0
            ? dbProgramSteps
            : (isAsfalou ? asfalouProgramSteps : (isChefchaouen ? chefchaouenProgramSteps : merzougaProgramSteps))));

  // Dynamic trip object matching DTO interfaces
  const trip = {
    id: dbTrip?.id || (isAsfalou ? "barrage-asfalou-ghadir-hamma-kayak" : (isChefchaouen ? "trip-chefchaouen-akchour-2j" : "trip-merzouga-todra-3j")),
    title: isAr && dbTrip?.titleAr ? dbTrip.titleAr : (dbTrip?.titleFr || (isAsfalou ? "☀️ BARRAGE ASFALOU · GHADIR HAMMA · SESSION KAYAK ☀️" : (isChefchaouen ? "Escapade Bleue : Chefchaouen & Cascades d'Akchour (2J/1N)" : "Magie du Désert : Dunes de Merzouga & Gorges du Todra (3J/2N)"))),
    duration: `${dbTrip?.durationDays || (isChefchaouen ? 2 : 3)} ${isAr ? "أيام" : "Jours"} / ${dbTrip?.durationNights || (isChefchaouen ? 1 : 2)} ${isAr ? "ليالي" : "Nuits"}`,
    region: dbTrip?.destinationRegion || (isAsfalou ? "Rif / Taher Souk (Marnissa - Barrage Asfalou)" : (isChefchaouen ? "Tanger-Tétouan-Al Hoceïma (Chefchaouen & Akchour)" : "Drâa-Tafilalet (Merzouga & Tinghir)")),
    basePrice: Number(dbTrip?.basePrice || (isAsfalou ? 1300 : (isChefchaouen ? 890 : 1450))),
    depositPerPerson: Number(dbTrip?.depositPerPerson || (isAsfalou ? 400 : (isChefchaouen ? 300 : 500))),
    singleSupplement: Number(dbTrip?.singleSupplement || (isAsfalou ? 250 : (isChefchaouen ? 250 : 350))),
    coverImage: dbTrip?.coverImageUrl || (isAsfalou ? "/images/asfalou/cover-asfalou.jpg" : (isChefchaouen ? "/images/chefchaouen/cover-chefchaouen.jpg" : "/images/merzouga/cover-merzouga.jpg")),
    included: (() => {
      if (isAr) {
        if (dbTripAny?.includedServicesAr && dbTripAny.includedServicesAr.length > 0) return dbTripAny.includedServicesAr;
        if (dbTripAny?.includedServices && dbTripAny.includedServices.length > 0) return dbTripAny.includedServices;
        if (dbTripAny?.includedServicesFr && dbTripAny.includedServicesFr.length > 0) return dbTripAny.includedServicesFr;
      } else {
        if (dbTripAny?.includedServices && dbTripAny.includedServices.length > 0) return dbTripAny.includedServices;
        if (dbTripAny?.includedServicesFr && dbTripAny.includedServicesFr.length > 0) return dbTripAny.includedServicesFr;
        if (dbTripAny?.includedServicesAr && dbTripAny.includedServicesAr.length > 0) return dbTripAny.includedServicesAr;
      }
      return isAr
        ? ["نقل سياحي مكيف ومريح مطابق لمعايير TIST", "ليلة مبيت بفندق 4 نجوم بنصف إقامة", "مبيت بمخيم مجهز", "أنشطة التجديف والسباحة المؤطرة", "أمسية حول النار", "مرشد ومرافق سياحي معتمد"]
        : ["Transport touristique climatisé grand confort (TIST)", "Hébergement en tentes équipées", "Pension complète", "Session Kayak et gilets de sauvetage", "Soirée feu de camp sous les étoiles", "Guides locaux accompagnateurs"];
    })(),
    excluded: (() => {
      if (isAr) {
        if (dbTripAny?.excludedServicesAr && dbTripAny.excludedServicesAr.length > 0) return dbTripAny.excludedServicesAr;
        if (dbTripAny?.excludedServices && dbTripAny.excludedServices.length > 0) return dbTripAny.excludedServices;
        if (dbTripAny?.excludedServicesFr && dbTripAny.excludedServicesFr.length > 0) return dbTripAny.excludedServicesFr;
      } else {
        if (dbTripAny?.excludedServices && dbTripAny.excludedServices.length > 0) return dbTripAny.excludedServices;
        if (dbTripAny?.excludedServicesFr && dbTripAny.excludedServicesFr.length > 0) return dbTripAny.excludedServicesFr;
        if (dbTripAny?.excludedServicesAr && dbTripAny.excludedServicesAr.length > 0) return dbTripAny.excludedServicesAr;
      }
      return isAr
        ? ["وجبات الغداء الحرة أثناء محطات التوقف", "المصاريف الشخصية والإكراميات", "الأنشطة الإضافية الاختيارية"]
        : ["Déjeuners libres lors des escales", "Dépenses personnelles et pourboires", "Activités optionnelles"];
    })(),
    checklist: (() => {
      if (isAr) {
        if (dbTripAny?.checklistItemsAr && dbTripAny.checklistItemsAr.length > 0) return dbTripAny.checklistItemsAr;
        if (dbTripAny?.checklistItemsFr && dbTripAny.checklistItemsFr.length > 0) return dbTripAny.checklistItemsFr;
        if (dbTripAny?.whatToBring && dbTripAny.whatToBring.length > 0) return dbTripAny.whatToBring;
      } else {
        if (dbTripAny?.checklistItemsFr && dbTripAny.checklistItemsFr.length > 0) return dbTripAny.checklistItemsFr;
        if (dbTripAny?.whatToBring && dbTripAny.whatToBring.length > 0) return dbTripAny.whatToBring;
        if (dbTripAny?.checklistItemsAr && dbTripAny.checklistItemsAr.length > 0) return dbTripAny.checklistItemsAr;
      }
      return isAr
        ? ["بطاقة التعريف الوطنية (CIN) أو جواز السفر الأصلي إلزامي", "أحذية مائية مغلقة للمشي في الماء", "ملابس سباحة، منشفة وقبعة", "واقي شمسي ونظارات شمسية"]
        : ["Carte d'Identité Nationale (CIN) originale obligatoire", "Chaussures aquatiques fermées pour l'eau", "Maillots de bain, serviette et casquette", "Crème solaire et lunettes de soleil"];
    })(),
    pickupPoints: dbTrip?.pickupPoints && dbTrip.pickupPoints.length > 0
      ? dbTrip.pickupPoints.map((p: any) => ({
          id: p.id,
          cityName: p.cityName || p.city || "",
          locationName: isAr ? (p.locationNameAr || p.locationName || p.locationNameFr) : (p.locationNameFr || p.locationName || p.cityName),
          departureTime: p.departureTime || p.meetingTime || "",
          googleMapsUrl: p.googleMapsUrl || undefined,
        }))
      : (isChefchaouen
          ? [
              { id: "p1", cityName: "Casablanca", locationName: isAr ? "محطة الدار البيضاء المسافرين" : "Gare Casa-Voyageurs", departureTime: "06:00" },
              { id: "p2", cityName: "Rabat", locationName: isAr ? "محطة الرباط أكدال" : "Gare Rabat-Agdal", departureTime: "07:15" },
              { id: "p3", cityName: "Kénitra", locationName: isAr ? "محطة القنيطرة" : "Gare Kénitra", departureTime: "08:00" },
            ]
          : (isAsfalou
              ? [
                  { id: "p1", cityName: "Casablanca", locationName: isAr ? "محطة الدار البيضاء المسافرين" : "Gare Casa-Voyageurs", departureTime: "18:30" },
                  { id: "p2", cityName: "Rabat", locationName: isAr ? "محطة الرباط المدينة" : "Gare Rabat-Ville", departureTime: "20:00" },
                  { id: "p3", cityName: "Fès", locationName: isAr ? "محطة فاس المدينة" : "Gare Fès-Ville", departureTime: "23:00" },
                ]
              : [
                  { id: "p1", cityName: "Casablanca", locationName: isAr ? "محطة الدار البيضاء المسافرين (أمام إيبيس)" : "Gare Casa-Voyageurs (Devant l'Ibis)", departureTime: "05:30" },
                  { id: "p2", cityName: "Rabat", locationName: isAr ? "محطة الرباط أكدال" : "Gare Rabat-Agdal", departureTime: "06:45" },
                ]
            )
        ),
    addons: dbTrip?.addons && dbTrip.addons.length > 0
      ? dbTrip.addons.map((a) => ({
          id: a.id,
          name: isAr ? a.nameAr : a.nameFr,
          price: Number(a.price),
          description: isAr ? (a.descriptionAr || "") : (a.descriptionFr || ""),
          isPerPerson: a.isPerPerson,
        }))
      : (isAsfalou
          ? [
              { id: "a1", name: isAr ? "تأجير حزمة معدات مائية وحافظة هاتف مقاومة للماء" : "Pack Équipement Aquatique & Pochette Étanche", price: 50, description: isAr ? "حافظة مقاومة للماء ومنشفة" : "Pochette étanche IPX8 et serviette", isPerPerson: true },
              { id: "a2", name: isAr ? "جلسة تصوير احترافية وفيديو درون تذكاري" : "Shooting Photo Pro & Drone Souvenir", price: 150, description: isAr ? "صور عالية الدقة وفيديو درون" : "Photos HD individuelles et vidéo drone", isPerPerson: true },
            ]
          : [
              { id: "a1", name: isAr ? "جولة كواد في الكثبان الذهبية (ساعة)" : "Session Quad 1h dans les dunes", price: 350, description: isAr ? "مغامرة كواد ممتعة ومؤطرة" : "Randonnée sportive guidée sur quad puissant", isPerPerson: true },
              { id: "a2", name: isAr ? "جولة 4x4 في الكثبان وقرية خملية" : "Excursion 4x4 Tour des Dunes & Village Khamlia", price: 200, description: isAr ? "زيارة الرحل وموسيقى كناوة" : "Visite des nomades et découverte Gnawa", isPerPerson: true },
            ]
        ),
    showOverview: (dbTrip as any)?.showOverview !== false,
    overviewFr: (dbTrip as any)?.overviewFr || "",
    overviewAr: (dbTrip as any)?.overviewAr || "",
  };

  // Récupère le texte de l'aperçu selon la langue (priorité au champ overview, repli sur descriptions existantes)
  const rawOverview = locale === "ar"
    ? ((dbTrip as any)?.overviewAr?.trim() || (dbTrip as any)?.overviewFr?.trim())
    : ((dbTrip as any)?.overviewFr?.trim() || (dbTrip as any)?.overviewAr?.trim());

  const fallbackOverview = locale === "ar"
    ? (dbTrip?.longDescriptionAr || dbTrip?.shortDescriptionAr || "")
    : (dbTrip?.longDescriptionFr || dbTrip?.shortDescriptionFr || "");

  const overviewText = rawOverview || fallbackOverview;

  // Condition stricte : N'afficher la carte QUE si la section est active ET qu'un texte existe
  const shouldShowOverview = (dbTrip as any)?.showOverview !== false && Boolean(overviewText?.trim());

  // Données Structurées Schema.org (TouristTrip & TravelAgency) pour Rich Snippets Google
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: isAr ? (dbTrip?.titleAr || trip.title) : (dbTrip?.titleFr || trip.title),
    description: isAr
      ? (dbTrip?.overviewAr || dbTrip?.shortDescriptionAr || trip.title)
      : (dbTrip?.overviewFr || dbTrip?.shortDescriptionFr || trip.title),
    touristType: "Aventure, Découverte, Weekend, Randonnée",
    offers: {
      "@type": "Offer",
      price: Number(trip.basePrice),
      priceCurrency: "MAD",
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString().split("T")[0],
      url: `https://www.rahalatbladna.ma/${locale}/trips/${slug}`,
    },
    provider: {
      "@type": "TravelAgency",
      name: "Rahalat Bladna",
      url: "https://www.rahalatbladna.ma",
      telephone: "+212603660658",
      priceRange: "MAD",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Casablanca",
        addressCountry: "MA",
      },
    },
  };

  return (
    <div className="bg-tp-ivory min-h-screen pb-28 lg:pb-16">
      {/* DONNÉES STRUCTURÉES SCHEMA.ORG (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MetaViewContent
        id={dbTrip?.id || slug}
        title={trip.title}
        category={dbTrip?.destinationRegion || "Circuit & Aventure"}
        price={Number(dbTrip?.basePrice || 1250)}
        currency="MAD"
      />
      {/* IMMERSIVE HEADER BANNER */}
      <div className="relative min-h-[400px] sm:min-h-[480px] bg-tp-midnight text-white flex items-end overflow-hidden">
        <img
          src={trip.coverImage}
          alt={trip.title}
          className="absolute inset-0 w-full h-full object-cover opacity-65"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-tp-midnight via-tp-midnight/60 to-black/30" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-20 w-full space-y-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-bold text-tp-ivory/70">
            <Link href={`/${locale}`} className="hover:text-white transition">
              {isAr ? "الرئيسية" : "Accueil"}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            <Link href={`/${locale}/trips`} className="hover:text-white transition">
              {isAr ? "برامجنا" : "Nos Circuits"}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            <span className="text-tp-cyan-soft truncate max-w-xs">{trip.title}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-pill bg-tp-ok-bg text-tp-ok-fg text-xs font-extrabold shadow-sm">
              {isAr ? "انطلاق مضمون" : "Départ Garanti"}
            </span>
            <span className="px-3 py-1 rounded-pill bg-white/15 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-tp-cyan" />
              {trip.region}
            </span>
            <span className="px-3 py-1 rounded-pill bg-white/15 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-tp-cyan" />
              {trip.duration}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight max-w-4xl">
            {trip.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <div>
              <span className="text-xs text-tp-ivory/80 block">{isAr ? "ابتداءً من" : "À partir de"}</span>
              <div className="text-2xl sm:text-3xl font-black text-tp-gold">
                {formatMAD(trip.basePrice)}
                <span className="text-xs font-medium text-tp-ivory/70 ml-1 font-sans">{isAr ? "/ شخص" : "/ pers"}</span>
              </div>
            </div>
            <div className="h-8 w-px bg-white/20 hidden sm:block" />
            <div>
              <span className="text-xs text-tp-ivory/80 block">{isAr ? "الدفعة الأولى (التسبيق)" : "Acompte requis"}</span>
              <div className="text-lg font-bold text-white">
                {formatMAD(trip.depositPerPerson)}
                <span className="text-xs font-normal text-tp-ivory/70 ml-1 font-sans">{isAr ? "/ شخص" : "/ pers"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT & BOOKING SIDEBAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        {/* BANNIÈRE VEDETTE DE LA SEMAINE / REDIRECTION INTELLIGENTE */}
        <ScheduledWeekBanner
          currentTripSlug={slug}
          isCurrentTripScheduled={Boolean((dbTrip as any)?.isScheduledThisWeek)}
          currentTripFeaturedMessage={(dbTrip as any)?.featuredWeekMessage}
          scheduledTrips={scheduledTrips as any}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Rich Interactive Presentation */}
          <div className="lg:col-span-8 space-y-8">
            {/* Aperçu du Voyage & Storytelling */}
            {shouldShowOverview && overviewText && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-tp-line shadow-tp-sm space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-tp-cyan-hover">
                  <Compass className="w-4 h-4" />
                  <span>{isAr ? "نظرة عامة على التجربة وفلسفة السفر" : "Aperçu du Voyage & Philosophie"}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-tp-midnight">
                  {isAr 
                    ? (dbTrip?.titleAr || "سحر التجربة وأناقة السفر") 
                    : (dbTrip?.titleFr || "L’Odyssée du Sud : Une Élégance Aérienne")}
                </h2>
                <div className="space-y-4 text-xs sm:text-sm text-tp-slate leading-relaxed">
                  {overviewText.split("\n\n").map((paragraph: string, idx: number) => (
                    <p
                      key={idx}
                      className={
                        idx === 0
                          ? "font-medium text-tp-midnight text-sm sm:text-[15px] border-l-4 border-tp-gold pl-3.5 py-1 rtl:border-l-0 rtl:border-r-4 rtl:pr-3.5 bg-amber-50/50 rounded-r-xl rtl:rounded-r-none rtl:rounded-l-xl p-2.5"
                          : ""
                      }
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* COMPOSANT SPÉCIAL CHARTE MOYEN ATLAS (Bleu Atlantique #073B5C, Terracotta #D9683A, Vert Atlas #2E6B57) */}
            {isMoyenAtlas && (
              <MoyenAtlasConfortShowcase slug={slug} />
            )}

            {/* COMPOSANT SPÉCIAL JBEL MOUSSA & BELYOUNECH (Ascension & Plongée) */}
            {isJbelMoussa && (
              <JbelMoussaShowcase slug={slug} />
            )}

            <MerzougaInteractiveDetail
              galleryItems={galleryItems}
              programSteps={programSteps}
              pickupPoints={trip.pickupPoints}
              included={trip.included}
              excluded={trip.excluded}
              checklist={trip.checklist}
            />
          </div>

          {/* RIGHT: Booking Card Sidebar (Design System V5) */}
          <div id="booking-card-section" className="lg:col-span-4 scroll-mt-24">
            <div id="booking-widget">
              <BookingCard
                tripId={trip.id}
                tripTitle={trip.title}
                basePrice={trip.basePrice}
                singleSupplement={trip.singleSupplement}
                depositPerPerson={trip.depositPerPerson || 400}
                pickupPoints={trip.pickupPoints}
                availableAddons={trip.addons}
                addons={trip.addons}
                dates={
                  dbTrip?.departureDates && dbTrip.departureDates.length > 0
                    ? dbTrip.departureDates.map((d) => ({
                        id: d.id,
                        startDate: d.startDate.toISOString().split("T")[0],
                        endDate: d.endDate.toISOString().split("T")[0],
                        status: d.status,
                        availableSeats: d.totalCapacity,
                        price: trip.basePrice,
                        priceOverride: null,
                      }))
                    : [
                        {
                          id: "d1",
                          startDate: "2026-09-18",
                          endDate: "2026-09-20",
                          status: "GUARANTEED" as const,
                          availableSeats: 24,
                          price: trip.basePrice,
                          priceOverride: null,
                        },
                        {
                          id: "d2",
                          startDate: "2026-09-25",
                          endDate: "2026-09-27",
                          status: "OPEN_FOR_BOOKING" as const,
                          availableSeats: 30,
                          price: trip.basePrice,
                          priceOverride: null,
                        },
                      ]
                }
              />
            </div>
          </div>

        </div>

        {/* FULL WIDTH SECTIONS UNDER GRID (Avis puis FAQ) */}
        <div className="space-y-12 mt-12">
          {/* 1. CARROUSEL DES AVIS VÉRIFIÉS ("Ils parlent de nous") */}
          <TripReviewsCarousel />

          {/* 2. QUESTIONS FRÉQUENTES / FAQ DU CIRCUIT */}
          <TripFaqAccordion />
        </div>
      </div>

      {/* BARRE MOBILE FLOTTANTE TYPE WILDLY */}
      <MobileFloatingBookingBar
        basePrice={trip.basePrice}
        depositAmount={trip.depositPerPerson}
        targetId="booking-card-section"
      />
    </div>
  );
}
