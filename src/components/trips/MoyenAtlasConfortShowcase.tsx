"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { 
  MapPin, Calendar, Clock, CheckCircle2, XCircle, Users, 
  Sparkles, ArrowRight, ShieldCheck, Waves, BedDouble, Trees, 
  Utensils, ChevronLeft, ChevronRight, Phone, MessageSquare
} from "lucide-react";
import { formatMAD } from "@/lib/utils";

interface MoyenAtlasShowcaseProps {
  slug?: string;
  onBookClick?: () => void;
  showFullDetails?: boolean;
}

export const MOYEN_ATLAS_DATA = {
  trip_id: "moyen-atlas-jomana-park",
  title: "Séjour Évasion au Cœur du Moyen Atlas",
  titleAr: "إجازة ساحرة في قلب الأطلس المتوسط (نزل جمانة بارك)",
  slug: "voyage-azrou-zaouiat-ifrane",
  destination: "Azrou - Oum Er-Rbia - Zaouiat Ifrane - Ifrane",
  destinationAr: "أزرو - منابع أم الربيع - زاوية إفران - إفران",
  departures: [
    { city: "Casablanca", time: "10:00", location: "Gare Casa-Voyageurs", cityAr: "الدار البيضاء", locationAr: "محطة الدار البيضاء المسافرين" },
    { city: "Rabat", time: "11:30", location: "Gare Rabat-Ville", cityAr: "الرباط", locationAr: "محطة الرباط المدينة" }
  ],
  duration: "3 jours / 2 nuits",
  durationAr: "3 أيام / ليلتان",
  frequency: "Chaque vendredi",
  frequencyAr: "كل يوم جمعة",
  price: {
    regular: 1450,
    discounted: 1300,
    deposit: 400,
    currency: "MAD",
    group_discount: "Remise spéciale à partir de 3 personnes",
    group_discountAr: "تخفيض استثنائي ابتداءً من 3 أشخاص",
  },
  accommodation: {
    name: "Auberge Jomana Park",
    nameAr: "نزل جمانة بارك (Auberge Jomana Park)",
    room_types: ["Chambre Double", "Chambre Triple"],
    room_typesAr: ["غرفة مزدوجة", "غرفة ثلاثية"],
    amenities: [
      "2 Grandes Piscines (dont une piscine 100% privée femmes)",
      "Espaces verts & jardins de montagne",
      "Aire de jeux pour enfants",
      "Salons traditionnels & vue panoramique"
    ],
    amenitiesAr: [
      "مسبحان كبيران (منهما مسبح خاص ومستقل 100% للنساء)",
      "مساحات خضراء وحدائق جبلية شاسعة",
      "فضاء وألعاب مخصصة للأطفال",
      "صالونات مغربية وإطلالات بانورامية"
    ]
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
  itinerary: [
    {
      day: 1,
      title: "Départ & Soirée Azrou",
      titleAr: "الانطلاق، الاستقرار بنزل جمانة بارك وسهرة أزرو",
      desc: "Départs confortables (Casa 10h00, Rabat 11h30). Installation à l'auberge, baignade dans les 2 piscines, découverte du centre artisanal d'Azrou et dîner de bienvenue inclus.",
      descAr: "انطلاق من الدار البيضاء والرباط. الاستقرار بالغرف، سباحة بمسابح النزل، جولة بمدينة أزرو وعشاء بلدي ترحيبي بالنزل.",
      activities: ["Check-in Auberge", "Piscine", "Balade Azrou", "Dîner inclus"],
      activitiesAr: ["الاستقرار بالنزل", "سباحة بالمسابح", "جولة أزرو", "عشاء ترحيبي مشمول"]
    },
    {
      day: 2,
      title: "Sources Oum Er-Rbia & Zaouiat Ifrane",
      titleAr: "شلالات أم الربيع، سحر زاوية إفران وسهرة إفران",
      desc: "Excursion aux sources d'Oum Er-Rbia, déjeuner berbère les pieds dans l'eau à Zaouiat Ifrane, randonnée le long des cascades et soirée festive dans la station d'Ifrane.",
      descAr: "جولة بمنابع وشلالات أم الربيع، غداء تقليدي بزاوية إفران، مشي مائي بين الشلالات وسهرة مسائية ممتعة بمدينة إفران.",
      activities: ["Sources Oum Er-Rbia", "Déjeuner local Zaouiat Ifrane", "Randonnée cascades", "Sortie nocturne Ifrane"],
      activitiesAr: ["منابع أم الربيع", "غداء بلدي بزاوية إفران", "شلالات عذبة", "سهرة إفران"]
    },
    {
      day: 3,
      title: "Détente & Cèdre Gouraud",
      titleAr: "استجمام بالمسبح، غابة الأرز غورو والعودة",
      desc: "Matinée farniente au bord des piscines et jardins de Jomana Park. Immersion dans la majestueuse Forêt des Cèdres au Cèdre Gouraud avec les macaques de Barbarie, puis retour.",
      descAr: "استرخاء وسباحة صباحية بالنزل، زيارة غابة أرز غورو ومداعبة قردة المكاك البربرية، ثم رحلة العودة نحو الرباط والدار البيضاء.",
      activities: ["Matinée piscine", "Forêt des cèdres & macaques", "Retour Rabat et Casablanca"],
      activitiesAr: ["سباحة صباحية", "غابة الأرز والمكاك", "العودة للرباط والبيضاء"]
    }
  ],
  included: [
    "Transport touristique climatisé grand confort A/R",
    "2 nuits à l'Auberge Jomana Park (chambres Double / Triple)",
    "2 petits-déjeuners gourmands, 1 déjeuner local (samedi), 1 dîner de bienvenue (vendredi)",
    "Guide local et encadrement professionnel Rahalat Bladna",
    "Accès libre aux 2 piscines (dont piscine privée femmes) et commodités"
  ],
  includedAr: [
    "نقل سياحي مكيف ومريح ذهاباً وإياباً (كازا والرباط)",
    "مبيت ليلتين بنزل جمانة بارك (غرف مزدوجة أو ثلاثية)",
    "وجبتا فطور كاملتان، غداء يوم السبت بزاوية إفران، وعشاء الجمعة الترحيبي",
    "مرشد محلي ومرافق سياحي معتمد طيلة الرحلة",
    "ولوج مجاني للمسبحين (مسبح عام ومسبح خاص بالنساء) وفضاءات النزل"
  ],
  excluded: [
    "Dîner libre du samedi soir à Ifrane",
    "Déjeuner libre du dimanche lors du retour",
    "Dépenses individuelles et pourboires"
  ],
  excludedAr: [
    "عشاء يوم السبت الحر بمدينة إفران",
    "غداء يوم الأحد الحر أثناء طريق العودة",
    "المصاريف الشخصية والإكراميات"
  ]
};

export function MoyenAtlasConfortShowcase({
  slug = "voyage-azrou-zaouiat-ifrane",
  onBookClick,
  showFullDetails = true,
}: MoyenAtlasShowcaseProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const prevPhoto = () => {
    setActivePhotoIdx((prev) => (prev === 0 ? MOYEN_ATLAS_DATA.photos.length - 1 : prev - 1));
  };

  const nextPhoto = () => {
    setActivePhotoIdx((prev) => (prev === MOYEN_ATLAS_DATA.photos.length - 1 ? 0 : prev + 1));
  };

  const handleBooking = () => {
    if (onBookClick) {
      onBookClick();
      return;
    }
    const el = document.getElementById("booking-card-section") || document.getElementById("booking-widget");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.href = `/${locale}/trips/${slug}#booking-card-section`;
    }
  };

  return (
    <section 
      aria-label="Présentation Circuit Moyen Atlas Confort"
      className="my-10 rounded-3xl overflow-hidden border border-[#073B5C]/20 bg-gradient-to-b from-white via-slate-50 to-white shadow-xl transition-all"
    >
      {/* 1. TOP BRAND HEADER (Bleu Atlantique #073B5C & Terracotta #D9683A) */}
      <div className="bg-[#073B5C] text-white px-6 py-7 sm:px-8 relative overflow-hidden">
        {/* Cercles de fond esthétiques */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#2E6B57]/30 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-[#D9683A]/25 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-[#D9683A] text-white shadow-sm">
                {isAr ? "الأطلس المتوسط كونفور" : "Moyen Atlas Confort"}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#2E6B57] text-emerald-100 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {isAr ? "2 مسابح (مسبح خاص بالنساء)" : "2 Piscines · Auberge Jomana Park"}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-sm text-white flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {isAr ? MOYEN_ATLAS_DATA.frequencyAr : MOYEN_ATLAS_DATA.frequency}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isAr ? MOYEN_ATLAS_DATA.titleAr : MOYEN_ATLAS_DATA.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-200 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D9683A] shrink-0" />
              <span>{isAr ? MOYEN_ATLAS_DATA.destinationAr : MOYEN_ATLAS_DATA.destination}</span>
            </p>
          </div>

          {/* Badge Prix & Acompte Terracotta */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 flex flex-col items-start md:items-end justify-center shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              {isAr ? "سعر خاص للرحلة" : "Tarif Évasion Garanti"}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-sm line-through text-slate-400 font-semibold">
                {formatMAD(MOYEN_ATLAS_DATA.price.regular, locale)}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#D9683A] drop-shadow-sm">
                {formatMAD(MOYEN_ATLAS_DATA.price.discounted, locale)}
              </span>
              <span className="text-xs text-slate-300">
                {isAr ? "/ مسافر" : "/ pers"}
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-300 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isAr 
                ? `التسبيق: ${formatMAD(MOYEN_ATLAS_DATA.price.deposit, locale)} فقط` 
                : `Acompte requis : ${formatMAD(MOYEN_ATLAS_DATA.price.deposit, locale)}`}
            </span>
            <span className="text-[10px] font-bold text-amber-300 mt-0.5">
              {isAr ? MOYEN_ATLAS_DATA.price.group_discountAr : MOYEN_ATLAS_DATA.price.group_discount}
            </span>
          </div>
        </div>
      </div>

      {/* 2. CONTENU PRINCIPAL : GALERIE & HÉBERGEMENT JOMANA PARK */}
      <div className="p-6 sm:p-8 space-y-8">
        
        {/* A. VISUAL CAROUSEL AVEC LES 5 PHOTOS DU CLIENT */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-[#073B5C] flex items-center gap-2">
              <Trees className="w-5 h-5 text-[#2E6B57]" />
              <span>{isAr ? "ألبوم الصور الحصرية للرحلة والنزل" : "Photos Officielles de l'Expérience & de l'Auberge"}</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">
              {activePhotoIdx + 1} / {MOYEN_ATLAS_DATA.photos.length}
            </span>
          </div>

          {/* Grand écran de photo */}
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full rounded-2xl overflow-hidden bg-slate-900 shadow-md group">
            <Image
              src={MOYEN_ATLAS_DATA.photos[activePhotoIdx].url}
              alt={MOYEN_ATLAS_DATA.photos[activePhotoIdx].title}
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
                {isAr ? MOYEN_ATLAS_DATA.photos[activePhotoIdx].titleAr : MOYEN_ATLAS_DATA.photos[activePhotoIdx].title}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                {MOYEN_ATLAS_DATA.photos[activePhotoIdx].caption}
              </p>
            </div>

            {/* Boutons de navigation */}
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
          </div>

          {/* Vignettes miniatures */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3 pt-1">
            {MOYEN_ATLAS_DATA.photos.map((photo, i) => (
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
                  alt={photo.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 20vw, 150px"
                />
              </button>
            ))}
          </div>
        </div>

        {/* B. GRILLE HÉBERGEMENT (AUBERGE JOMANA PARK) & DÉPARTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Carte Hébergement Jomana Park */}
          <div className="bg-gradient-to-br from-[#2E6B57]/5 to-[#073B5C]/5 rounded-2xl p-5 sm:p-6 border border-[#2E6B57]/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#2E6B57] text-white flex items-center justify-center shadow-md shadow-[#2E6B57]/20">
                  <Waves className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-[#073B5C]">
                    {isAr ? MOYEN_ATLAS_DATA.accommodation.nameAr : MOYEN_ATLAS_DATA.accommodation.name}
                  </h4>
                  <span className="text-xs font-bold text-[#2E6B57]">
                    {isAr ? "مستوى راحة ممتاز ومسابح خاصة" : "Hébergement de charme & 2 Piscines"}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#2E6B57]/15 text-[#2E6B57] border border-[#2E6B57]/30">
                {isAr ? "2 ليالي" : "2 Nuits"}
              </span>
            </div>

            <div className="space-y-2 pt-1">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                {isAr ? "أنواع الغرف المتاحة :" : "Configuration des Chambres :"}
              </span>
              <div className="flex flex-wrap gap-2">
                {(isAr ? MOYEN_ATLAS_DATA.accommodation.room_typesAr : MOYEN_ATLAS_DATA.accommodation.room_types).map((rt, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">
                    <BedDouble className="w-3.5 h-3.5 text-[#D9683A]" />
                    {rt}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                {isAr ? "مرافق وخدمات النزل :" : "Équipements & Atouts du Parc :"}
              </span>
              <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
                {(isAr ? MOYEN_ATLAS_DATA.accommodation.amenitiesAr : MOYEN_ATLAS_DATA.accommodation.amenities).map((am, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2E6B57] shrink-0 mt-0.5" />
                    <span>{am}</span>
                  </li>
                ))}
              </ul>
            </div>
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
                    {isAr ? "مواعيد ونقاط الانطلاق (كل جمعة)" : "Horaires & Gares de Départ (Chaque Vendredi)"}
                  </h4>
                  <span className="text-xs font-bold text-[#D9683A]">
                    {isAr ? "انطلاق مضمون بحافلة سياحية مكيفة" : "Transport Touristique Climatisé A/R"}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                {MOYEN_ATLAS_DATA.departures.map((dep, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-[#073B5C] shrink-0" />
                      <div>
                        <span className="text-xs font-black text-[#073B5C] block">
                          {isAr ? dep.cityAr : dep.city}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {isAr ? dep.locationAr : dep.location}
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
                {isAr ? "3 أيام / 2 ليالي" : "3 Jours / 2 Nuits"}
              </span>
            </div>
          </div>

        </div>

        {/* C. PROGRAMME DÉTAILLÉ JOUR PAR JOUR */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-[#073B5C] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#D9683A]" />
            <span>{isAr ? "البرنامج المفصل للرحلة (3 أيام / ليلتان)" : "Programme Chronologique du Séjour"}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MOYEN_ATLAS_DATA.itinerary.map((step) => (
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
                      {step.day === 1 ? (isAr ? "الجمعة" : "Vendredi") : step.day === 2 ? (isAr ? "السبت" : "Samedi") : (isAr ? "الأحد" : "Dimanche")}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 leading-snug">
                    {isAr ? step.titleAr : step.title}
                  </h4>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isAr ? step.descAr : step.desc}
                  </p>
                </div>

                {/* Tags d'activités */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                  {(isAr ? step.activitiesAr : step.activities).map((act, i) => (
                    <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {act}
                    </span>
                  ))}
                </div>
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
              <span>{isAr ? "الخدمات والمصاريف المشمولة بالرحلة" : "Ce qui est inclus dans le tarif :"}</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-700">
              {(isAr ? MOYEN_ATLAS_DATA.includedAr : MOYEN_ATLAS_DATA.included).map((item, idx) => (
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
              <span>{isAr ? "غير مشمول في السعر" : "Non inclus :"}</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              {(isAr ? MOYEN_ATLAS_DATA.excludedAr : MOYEN_ATLAS_DATA.excluded).map((item, idx) => (
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
              {isAr ? "مقاعد محدودة لكل جمعة" : "Départs Garantis Chaque Vendredi"}
            </span>
            <h3 className="text-xl sm:text-2xl font-black">
              {isAr ? "احجز مكانك في رحلة الأطلس المتوسط الآن" : "Prêt pour une Évasion Rafraîchissante ?"}
            </h3>
            <p className="text-xs text-slate-200">
              {isAr
                ? `1300 درهم فقط عوض 1450 درهم · تسبيق 400 درهم فقط لتأكيد الحجز`
                : `1 300 MAD au lieu de 1 450 MAD · Acompte de 400 MAD seulement`}
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
              href="https://wa.me/212603660658?text=Bonjour,%20je%20souhaite%20des%20informations%20sur%20le%20circuit%20Moyen%20Atlas%20Confort%20(Auberge%20Jomana%20Park)"
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

export default MoyenAtlasConfortShowcase;
