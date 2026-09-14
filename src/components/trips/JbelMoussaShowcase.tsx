"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { 
  MapPin, Calendar, Clock, CheckCircle2, XCircle, 
  Sparkles, ArrowRight, ShieldCheck, Waves, Mountain, 
  ChevronLeft, ChevronRight, MessageSquare, Compass, Fish
} from "lucide-react";
import { formatMAD } from "@/lib/utils";

interface JbelMoussaShowcaseProps {
  slug?: string;
  onBookClick?: () => void;
}

export const JBEL_MOUSSA_DATA = {
  title: "Ascension du Jbel Moussa & Paradis Aquatique de Belyounech",
  titleAr: "تسلق قمة جبل موسى والجنة البحرية لبليونش",
  tagline: "Entre sommet mythique, détroit de Gibraltar et eaux turquoise de la Méditerranée",
  taglineAr: "بين قمة أسطورية، مضيق جبل طارق ومياه البحر الأبيض المتوسط الفيروزية",
  slug: "ascension-jbel-moussa-belyounech",
  destination: "Belyounech - Jbel Moussa (851m) - Détroit de Gibraltar",
  destinationAr: "بليونش - قمة جبل موسى (851 م) - مضيق جبل طارق",
  duration: "3 Jours / 2 Nuitées",
  durationAr: "3 أيام / ليلتان",
  nextDate: "25 au 27 Septembre 2026",
  nextDateAr: "من 25 إلى 27 شتنبر 2026",
  price: 1150,
  deposit: 400,
  departures: [
    { city: "Casablanca", time: "19:00", location: "Gare Casa-Voyageurs", cityAr: "الدار البيضاء", locationAr: "محطة الدار البيضاء المسافرين" },
    { city: "Rabat", time: "20:45", location: "Gare Rabat-Ville", cityAr: "الرباط", locationAr: "محطة الرباط المدينة" }
  ],
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
      caption: "Immersion magique avec moniteur certifié dans les fonds marins du détroit (+350 DH)",
    },
    {
      url: "/images/jbel-moussa/coucher-soleil-detroit.jpg",
      title: "Crépuscule d'Or sur les Côtes du Détroit",
      titleAr: "غروب الشمس الذهبي بين المغرب وإسبانيا",
      caption: "Lumières féeriques au coucher du soleil face aux rivages espagnols",
    },
  ],
  itinerary: [
    {
      day: 1,
      dayName: "Vendredi",
      dayNameAr: "الجمعة",
      title: "Départ & Cap sur le Nord",
      titleAr: "الانطلاق ليلاً نحو الشمال",
      desc: "Regroupement à Casablanca (19h00, Gare Casa-Voyageurs) puis ramassage à Rabat (20h45, Gare Rabat-Ville). Trajet nocturne tout confort en autocar climatisé avec pauses café. Arrivée à l'hébergement, check-in et nuitée de repos.",
      descAr: "انطلاق من محطة الدار البيضاء (19:00) ثم محطة الرباط (20:45). سفر ليلي مريح بحافلة سياحية مكيفة، الوصول للإقامة والمبيت.",
      tags: ["Casa 19h00", "Rabat 20h45", "Trajet climatisé", "Nuitée repos"],
      tagsAr: ["البيضاء 19:00", "الرباط 20:45", "حافلة مكيفة", "مبيت بالإقامة"]
    },
    {
      day: 2,
      dayName: "Samedi",
      dayNameAr: "السبت",
      title: "Ascension du Jbel Moussa & Veillée Conviviale",
      titleAr: "تسلق جبل موسى وسهرة تعارف وألعاب",
      desc: "07h00 : Petit-déjeuner énergétique inclus. 08h00 : Début du trekking d'ascension (~4h de marche modérée). Au sommet (851m) : Vue spectaculaire 360° sur Gibraltar, les côtes espagnoles et l'îlot Leïla avec pause déjeuner pique-nique inclus. Descente, douche, dîner traditionnel complet inclus et veillée animée.",
      descAr: "07:00 : فطور صحي بالإقامة. 08:00 : بدء مسار الصعود المشوق (~4 ساعات صعود مؤطر). بالقمة (851 م): مشهد بانورامي 360 درجة على جبل طارق وإسبانيا وجزيرة ليلى مع غداء نزهة بالقمة. نزول، عشاء تقليدي مغربي مشمول وسهرة سمر وألعاب.",
      tags: ["Ascension 851m", "Vue 360° Gibraltar", "Déjeuner au sommet", "Dîner & Soirée"],
      tagsAr: ["علو 851 م", "إطلالة جبل طارق", "غداء بالقمة", "عشاء وسهرة"]
    },
    {
      day: 3,
      dayName: "Dimanche",
      dayNameAr: "الأحد",
      title: "Joyaux de Belyounech, Plongée & Retour",
      titleAr: "شاطئ بليونش، تجربة الغوص والعودة",
      desc: "07h30 : Petit-déjeuner marin inclus. Plage féerique de Belyounech avec 2 options : Option Aventure Baptême de plongée avec moniteur pro (+350 DH) ou Option Détente baignade dans les piscines naturelles. 14h00 : Déjeuner libre poisson frais. 15h00 : Retour vers Rabat (19h30) et Casablanca (21h00).",
      descAr: "07:30 : فطور الصباح. شاطئ بليونش الساحر مع خيارين: تجربة الغوص بالأسطوانة مع مدرب معتمد (+350 درهم) أو السباحة بالمسابح الصخرية. 14:00 : غداء سمك طازج. 15:00 : انطلاق رحلة العودة نحو الرباط (19:30) والبيضاء (21:00).",
      tags: ["Plage Belyounech", "Baptême Plongée (+350 DH)", "Déjeuner poisson", "Retour Casa/Rabat"],
      tagsAr: ["شاطئ بليونش", "غوص اختياري (+350 د)", "غداء سمك", "العودة المريحة"]
    }
  ],
  included: [
    "Transport touristique climatisé A/R agréé grand confort",
    "Assurance transport routier touristique",
    "Hébergement de 2 nuitées en structure chaleureuse",
    "Pension partielle : Repas du samedi (petit-déjeuner, déjeuner pique-nique au sommet, dîner) + petit-déjeuner du dimanche",
    "Accompagnement par des guides de montagne locaux certifiés",
    "Encadrement professionnel et logistique assurés par l'équipe Rahalat Bladna"
  ],
  includedAr: [
    "نقل سياحي مكيف ومريح ذهاباً وإياباً من البيضاء والرباط",
    "تأمين النقل السياحي الطرقي",
    "مبيت ليلتين في إقامة مريحة ودافئة",
    "نصف إقامة : وجبات السبت (فطور، غداء نزهة بالقمة، عشاء تقليدي) + فطور الأحد",
    "مرشدون ومرافقون جبليون محليون معتمدون",
    "تأطير لوجستي وإداري محترف طيلة أيام الرحلة"
  ],
  excluded: [
    "Déjeuner libre du dimanche (poisson frais au village de Belyounech)",
    "Activité baptême de plongée sous-marine (optionnelle : +350 DH)",
    "Dépenses personnelles et pourboires"
  ],
  excludedAr: [
    "غداء يوم الأحد الحر بقرية بليونش (سمك طازج)",
    "نشاط الغوص تحت الماء برفقة مدرب معتمد (+350 درهم)",
    "المصاريف الشخصية والإكراميات"
  ],
  checklist: [
    "Bonnes chaussures de marche ou de randonnée (semelle crantée)",
    "Maillot de bain, serviette microfibre et chaussures aquatiques",
    "Petit sac à dos d'appoint (15 à 25L) pour gourde et effets personnels",
    "Protection solaire : lunettes polarisées, chapeau/casquette et crème solaire",
    "Veste coupe-vent légère pour le sommet (851 m)"
  ],
  checklistAr: [
    "حذاء مشي أو تسلق جبلي مريح ومضاد للانزلاق",
    "لباس سباحة، منشفة وحذاء مائي للمشي على الصخور",
    "حقيبة ظهر صغيرة (15 إلى 25 لتر) للماء واللوازم الشخصية",
    "واقي الشمس، نظارات شمسية وقبعة",
    "سترة واقية من الرياح لأعالي القمة (علو 851 م)"
  ]
};

export function JbelMoussaShowcase({
  slug = "ascension-jbel-moussa-belyounech",
  onBookClick,
}: JbelMoussaShowcaseProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const prevPhoto = () => {
    setActivePhotoIdx((prev) => (prev === 0 ? JBEL_MOUSSA_DATA.photos.length - 1 : prev - 1));
  };

  const nextPhoto = () => {
    setActivePhotoIdx((prev) => (prev === JBEL_MOUSSA_DATA.photos.length - 1 ? 0 : prev + 1));
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
      aria-label="Présentation Circuit Jbel Moussa & Belyounech"
      className="my-10 rounded-3xl overflow-hidden border border-cyan-500/20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl transition-all"
    >
      {/* 1. TOP MARITIME & MOUNTAIN HERO HEADER */}
      <div className="relative px-6 py-8 sm:px-8 overflow-hidden bg-gradient-to-r from-slate-950 via-[#0B2A4A] to-[#005B66]">
        {/* Glows */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-cyan-500 text-slate-950 shadow-md">
                {isAr ? "قمة وبحر" : "Montagne & Mer Méditerranée"}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Mountain className="w-3.5 h-3.5" />
                {isAr ? "قمة 851 متر" : "Sommet 851m · Colonne d'Hercule"}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Waves className="w-3.5 h-3.5" />
                {isAr ? "بليونش والمضيق" : "Plage & Baptême Plongée"}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
              {isAr ? JBEL_MOUSSA_DATA.titleAr : JBEL_MOUSSA_DATA.title}
            </h2>

            <p className="text-xs sm:text-sm text-cyan-100/80 font-medium">
              {isAr ? JBEL_MOUSSA_DATA.taglineAr : JBEL_MOUSSA_DATA.tagline}
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-300 pt-1">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{isAr ? JBEL_MOUSSA_DATA.destinationAr : JBEL_MOUSSA_DATA.destination}</span>
            </div>
          </div>

          {/* Badge Tarif Tout Compris */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 flex flex-col items-start md:items-end justify-center shrink-0">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-cyan-200">
              {isAr ? "تاريخ الانطلاق المقبل" : "Prochaine Date"}
            </span>
            <span className="text-sm font-black text-amber-400 mb-1">
              {isAr ? JBEL_MOUSSA_DATA.nextDateAr : JBEL_MOUSSA_DATA.nextDate}
            </span>

            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-white drop-shadow">
                {formatMAD(JBEL_MOUSSA_DATA.price, locale)}
              </span>
              <span className="text-xs text-slate-300 font-sans">
                {isAr ? "/ فرد" : "/ pers"}
              </span>
            </div>

            <span className="text-[11px] font-semibold text-emerald-300 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isAr 
                ? `تسبيق: ${formatMAD(JBEL_MOUSSA_DATA.deposit, locale)} فقط` 
                : `Acompte : ${formatMAD(JBEL_MOUSSA_DATA.deposit, locale)}`}
            </span>
          </div>
        </div>
      </div>

      {/* 2. CORPS : CARROUSEL DES 5 PHOTOS VÉRIFIÉES */}
      <div className="p-6 sm:p-8 space-y-8">
        
        {/* A. VISUAL PHOTO GALLERY */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              <span>{isAr ? "ألبوم الصور الحقيقية للقمة وشاطئ بليونش" : "Photos Réelles : Ascension, Îlot Leïla & Plongée"}</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">
              {activePhotoIdx + 1} / {JBEL_MOUSSA_DATA.photos.length}
            </span>
          </div>

          {/* Grand écran de photo */}
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl group">
            <Image
              src={JBEL_MOUSSA_DATA.photos[activePhotoIdx].url}
              alt={JBEL_MOUSSA_DATA.photos[activePhotoIdx].title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
              sizes="(max-width: 768px) 100vw, 1200px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

            {/* Légende */}
            <div className="absolute bottom-4 inset-x-4 sm:inset-x-6 z-10 text-white">
              <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-cyan-500 text-slate-950 mb-1">
                {isAr ? "صورة حقيقية" : "Vue Réelle"}
              </span>
              <h4 className="text-base sm:text-xl font-black">
                {isAr ? JBEL_MOUSSA_DATA.photos[activePhotoIdx].titleAr : JBEL_MOUSSA_DATA.photos[activePhotoIdx].title}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                {JBEL_MOUSSA_DATA.photos[activePhotoIdx].caption}
              </p>
            </div>

            {/* Navigation fléchée */}
            <button
              type="button"
              onClick={prevPhoto}
              aria-label="Photo précédente"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-cyan-500 hover:text-slate-950 text-white flex items-center justify-center backdrop-blur-sm transition z-20 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
            </button>
            <button
              type="button"
              onClick={nextPhoto}
              aria-label="Photo suivante"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-cyan-500 hover:text-slate-950 text-white flex items-center justify-center backdrop-blur-sm transition z-20 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 rtl:rotate-180" />
            </button>
          </div>

          {/* Vignettes miniatures */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3 pt-1">
            {JBEL_MOUSSA_DATA.photos.map((photo, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActivePhotoIdx(i)}
                className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  activePhotoIdx === i
                    ? "border-cyan-400 ring-2 ring-cyan-500/40 scale-95"
                    : "border-transparent opacity-60 hover:opacity-100"
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

        {/* B. LES 2 EXPÉRIENCES MAJEURES (ASCENSION & PLONGÉE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Expérience 1 : L'Ascension */}
          <div className="bg-slate-900/90 rounded-2xl p-5 sm:p-6 border border-amber-500/30 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
                <Mountain className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">
                  {isAr ? "تحدي تسلق قمة جبل موسى (851 م)" : "Ascension du Jbel Moussa (851m)"}
                </h4>
                <span className="text-xs font-bold text-amber-400">
                  {isAr ? "عمود هرقل المغربي وبانوراما جبل طارق" : "La Colonne d'Hercule · Vue 360° sur Gibraltar"}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isAr
                ? "مسار مشي مشوق لنحو 4 ساعات بوتيرة متوازنة ومؤطرة بالكامل، ينتهي بالوصول لقمة 851 متراً لمشاهدة السواحل الإسبانية، جزيرة ليلى، ومضيق جبل طارق في مشهد أسطوري لا يُنسى."
                : "Randonnée sportive accessible (~4h de montée) encadrée par des guides locaux certifiés. Au sommet, savourez un pique-nique mémorable face à l'Espagne, Gibraltar et l'îlot Leïla."}
            </p>

            <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2 text-xs font-semibold text-amber-300">
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                {isAr ? "مرشدون محليون" : "Guides certifiés"}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                {isAr ? "غداء بالقمة" : "Déjeuner au sommet"}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                {isAr ? "صور تذكارية" : "Shooting 851m"}
              </span>
            </div>
          </div>

          {/* Expérience 2 : Paradis Aquatique & Plongée */}
          <div className="bg-slate-900/90 rounded-2xl p-5 sm:p-6 border border-cyan-500/30 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-cyan-500/20">
                <Fish className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">
                  {isAr ? "شاطئ بليونش & تجربة الغوص" : "Paradis Aquatique & Baptême de Plongée"}
                </h4>
                <span className="text-xs font-bold text-cyan-400">
                  {isAr ? "مياه فيروزية ومسابح طبيعية نقية" : "Eaux Cristallines & Fonds Marins du Détroit"}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isAr
                ? "الاستمتاع بمياه بليونش الشفافة والسباحة بين المسابح الصخرية، مع إمكانية خوض تجربة الغوص بالأسطوانة برفقة مدرب محترف معتمد لاكتشاف أعماق المضيق الساحرة (+350 درهم)."
                : "Détente sur les galets blancs et baignade dans des eaux limpides. Possibilité d'effectuer un baptême de plongée sous-marine certifié (+350 DH) avec moniteur professionnel."}
            </p>

            <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2 text-xs font-semibold text-cyan-300">
              <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                {isAr ? "مسابح طبيعية" : "Piscines naturelles"}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                {isAr ? "غوص اختياري (+350 د)" : "Option Plongée (+350 DH)"}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                {isAr ? "غداء سمك طازج" : "Poisson frais au village"}
              </span>
            </div>
          </div>

        </div>

        {/* C. ITINÉRAIRE JOUR PAR JOUR */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span>{isAr ? "برنامج الرحلة المفصل (3 أيام / ليلتان)" : "Programme Complet & Soigné (3 Jours / 2 Nuits)"}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {JBEL_MOUSSA_DATA.itinerary.map((step) => (
              <div 
                key={step.day}
                className="bg-slate-900 rounded-2xl p-5 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-cyan-500 text-slate-950">
                      {isAr ? `اليوم ${step.day}` : `Jour ${step.day}`}
                    </span>
                    <span className="text-[11px] font-bold text-amber-400">
                      {isAr ? step.dayNameAr : step.dayName}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-white leading-snug">
                    {isAr ? step.titleAr : step.title}
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isAr ? step.descAr : step.desc}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800">
                  {(isAr ? step.tagsAr : step.tags).map((tag, idx) => (
                    <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* D. INCLUSIONS & NON-INCLUS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/60 rounded-2xl p-5 sm:p-6 border border-slate-800">
          {/* Ce qui est inclus */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAr ? "الخدمات المشمولة في السعر (1150 درهم)" : "Inclus dans le prix (1 150 MAD tout compris) :"}</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {(isAr ? JBEL_MOUSSA_DATA.includedAr : JBEL_MOUSSA_DATA.included).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Ce qui n'est pas inclus */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-rose-400 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              <span>{isAr ? "غير مشمول في السعر" : "Non inclus :"}</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {(isAr ? JBEL_MOUSSA_DATA.excludedAr : JBEL_MOUSSA_DATA.excluded).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* E. CTA FINAL & BANDEAU */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-[#0B2A4A] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-1 text-center sm:text-start">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300 block">
              {isAr ? "الانطلاق القادم : 25 إلى 27 شتنبر 2026" : "Prochain Départ : 25 au 27 Septembre 2026"}
            </span>
            <h3 className="text-xl sm:text-2xl font-black">
              {isAr ? "هل أنت مستعد لمغامرة جبل موسى وبليونش ؟" : "Prêt pour le Défi du Jbel Moussa ?"}
            </h3>
            <p className="text-xs text-cyan-100">
              {isAr
                ? "1150 درهم فقط شامل النقل، المبيت، الوجبات، وتأطير التسلق الجبلي"
                : "1 150 MAD tout compris · Acompte de 400 MAD pour garantir votre place"}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleBooking}
              className="px-7 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{isAr ? "احجز مقعدك الآن" : "Réserver ma place"}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>

            <a
              href="https://wa.me/212603660658?text=Bonjour,%20je%20souhaite%20des%20informations%20sur%20le%20circuit%20Ascension%20du%20Jbel%20Moussa%20et%20Belyounech"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-emerald-300" />
              <span>{isAr ? "استفسار واتساب" : "WhatsApp"}</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}

export default JbelMoussaShowcase;
