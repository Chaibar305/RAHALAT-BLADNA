import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const jobsToSeed = [
  {
    title: "Media Buyer / Responsable Publicité Digitale",
    slug: "media-buyer-publicite-digitale",
    role: "AUTRE" as const,
    department: "Marketing & Publicité",
    employmentType: "FREELANCE" as const,
    location: "Télétravail / Hybride (Maroc)",
    descriptionFr:
      "Nous recherchons un(e) Media Buyer pour gérer et optimiser nos campagnes publicitaires Facebook, Instagram et TikTok, afin de faire connaître nos circuits organisés au Maroc et générer des réservations.",
    descriptionAr:
      "نبحث عن مسؤول إعلانات رقمية (Media Buyer) لإدارة وتحسين حملاتنا الإعلانية على فيسبوك وإنستغرام وتيك توك، للترويج لرحلاتنا المنظمة بالمغرب وجلب الحجوزات.",
    descriptionEn:
      "We are looking for a Media Buyer to manage and optimize our advertising campaigns on Facebook, Instagram, and TikTok, boosting awareness and bookings for our organized tours in Morocco.",
    missions: [
      "Créer et lancer les campagnes Meta Ads (Facebook/Instagram) pour chaque nouveau circuit",
      "Optimiser les budgets, ciblages et enchères pour maximiser le ROAS et réduire le coût par réservation",
      "Tester différents formats créatifs (visuels, reels, carrousels) et angles publicitaires",
      "Configurer et suivre le Pixel Meta et l'API de Conversions (tracking des réservations)",
      "Analyser les performances (CPM, CPC, CPL, taux de conversion) et proposer des ajustements",
      "Collaborer avec l'équipe pour obtenir photos/vidéos des circuits à utiliser en publicité",
      "Reporting hebdomadaire clair sur les résultats et le budget dépensé",
    ],
    requirements: [
      "Expérience réelle en gestion de campagnes Meta Ads (comptes gérés, résultats obtenus)",
      "Certification Meta Blueprint ou équivalent est un plus",
      "À l'aise avec le tracking (Pixel, Conversions API, UTM)",
      "Maîtrise du français et de l'arabe (ciblage marché marocain)",
      "Autonomie, rigueur et sens de l'analyse chiffrée",
      "Une expérience dans le secteur tourisme/voyage est un plus, mais pas obligatoire",
    ],
    salaryMin: null,
    salaryMax: null,
    salaryType: "POURCENTAGE" as const,
    status: "PUBLIEE" as const,
    publishedAt: new Date(),
  },
  {
    title: "Agent(e) de Confirmation Téléphonique",
    slug: "agent-confirmation-telephonique",
    role: "AUTRE" as const,
    department: "Service Client & Ventes",
    employmentType: "TEMPS_PARTIEL" as const,
    location: "Télétravail / Rabat & Partout au Maroc",
    descriptionFr:
      "Nous recherchons un(e) agent(e) de confirmation pour contacter nos clients après leur réservation en ligne et sécuriser chaque départ.",
    descriptionAr:
      "نبحث عن مسؤول(ة) تأكيد الحجوزات عبر الهاتف للتواصل مع زبنائنا بعد الحجز عبر المنصة وتأكيد تفاصيل ومشاركتهم في الرحلات.",
    descriptionEn:
      "We are looking for a Booking Confirmation Agent to contact our customers following their online booking and secure each departure.",
    missions: [
      "Appeler les clients après réservation pour confirmer leur inscription au circuit",
      "Vérifier les informations (nom, CIN/passeport, téléphone, nombre de voyageurs)",
      "Rassurer le client sur le programme, les horaires et le point de départ",
      "Relancer poliment les clients dont l'acompte n'a pas encore été réglé",
      "Répondre aux questions simples par téléphone ou WhatsApp",
      "Mettre à jour le statut de la réservation (confirmée / en attente / annulée) dans le tableau de suivi",
    ],
    requirements: [
      "Très bonne élocution en darija et en français (arabe classique un plus)",
      "Voix posée, souriante, rassurante au téléphone",
      "À l'aise avec WhatsApp Business et un tableau de suivi simple (Excel/Google Sheets ou interface dédiée)",
      "Sérieux(se), ponctuel(le), organisé(e)",
      "Une expérience en centre d'appel, vente ou service client est un plus, mais pas obligatoire",
    ],
    salaryMin: 20,
    salaryMax: null,
    salaryType: "FORFAIT_MISSION" as const,
    status: "PUBLIEE" as const,
    publishedAt: new Date(),
  },
  {
    title: "Guide-Animateur / Accompagnateur de Circuit",
    slug: "guide-animateur-accompagnateur",
    role: "GUIDE_ANIMATEUR" as const,
    department: "Opérations & Terrain",
    employmentType: "MISSION_PONCTUELLE" as const,
    location: "Départs Rabat, Casablanca & Villes du Maroc",
    descriptionFr:
      "Nous recherchons un(e) guide-animateur pour encadrer nos groupes lors de circuits organisés à travers le Maroc (Nord, désert, montagnes, escapades week-end).",
    descriptionAr:
      "نبحث عن مرشد ومنشط رحلات (Guide-Animateur) لتأطير مجموعاتنا السياحية خلال الرحلات المنظمة في مختلف ربوع المملكة (الشمال، الصحراء، الجبال، وعطلات نهاية الأسبوع).",
    descriptionEn:
      "We are looking for a Tour Leader / Activity Guide to lead our groups during organized tours across Morocco (North, Desert, Mountains, Weekend Escapes).",
    missions: [
      "Animer le groupe pendant tout le circuit (ambiance, énergie, cohésion)",
      "Donner des explications culturelles, historiques et pratiques sur les sites visités",
      "Gérer le timing du programme (visites, repas, temps libre)",
      "Veiller au bien-être et à la sécurité des voyageurs",
      "Faire le lien entre les voyageurs, le chauffeur et l'organisateur",
      "Aider à la prise de photos souvenirs si besoin",
    ],
    requirements: [
      "Sens du contact, dynamisme, bon niveau d'expression en darija et en français (arabe classique un plus)",
      "Connaissance du Maroc, de son histoire et de sa culture",
      "Expérience en animation de groupe, encadrement ou guidage (une expérience touristique est un plus mais pas obligatoire si motivation forte)",
      "Disponible les week-ends et sur certaines dates de départ",
      "Sérieux, ponctuel, à l'aise pour gérer les imprévus",
    ],
    salaryMin: 250,
    salaryMax: 400,
    salaryType: "FORFAIT_MISSION" as const,
    status: "PUBLIEE" as const,
    publishedAt: new Date(),
  },
  {
    title: "Photographe / Vidéaste de Voyage",
    slug: "photographe-videaste-voyage",
    role: "AUTRE" as const,
    department: "Création de Contenu & Média",
    employmentType: "MISSION_PONCTUELLE" as const,
    location: "Départs Rabat, Casablanca (Sur le terrain)",
    descriptionFr:
      "Nous recherchons un(e) photographe/vidéaste passionné(e) pour accompagner nos circuits organisés à travers le Maroc et capturer l'expérience de nos voyageurs.",
    descriptionAr:
      "نبحث عن مصور(ة) ومعد(ة) فيديوهات رحلات شغوف لمرافقة رحلاتنا المنظمة عبر المغرب وتوثيق أجمل اللحظات والتجارب للمسافرين.",
    descriptionEn:
      "We are looking for a passionate Travel Photographer / Videographer to accompany our organized tours across Morocco and capture our travelers' experiences.",
    missions: [
      "Photographier les moments clés du circuit (départ, étapes, paysages, groupe)",
      "Filmer de courtes vidéos pour Instagram/TikTok/Facebook (reels, stories)",
      "Livrer les photos et vidéos retouchées dans un délai de 48h après le retour",
      "Créer une ambiance conviviale sans déranger le programme du guide",
      "Ponctuellement : portraits des voyageurs pour souvenirs personnalisés",
    ],
    requirements: [
      "Expérience en photo/vidéo mobile ou reflex (une expérience événementielle ou voyage est un plus)",
      "Bon relationnel, à l'aise pour photographier des groupes en mouvement",
      "Maîtrise du montage rapide (CapCut, Premiere Rush, ou équivalent)",
      "Disponible les week-ends et sur certaines dates de départ en semaine",
      "Véhicule ou disponibilité pour se déplacer au point de départ (Rabat/Casablanca)",
    ],
    salaryMin: 200,
    salaryMax: 400,
    salaryType: "FORFAIT_MISSION" as const,
    status: "PUBLIEE" as const,
    publishedAt: new Date(),
  },
];

async function main() {
  console.log("🚀 Insertion automatique des offres d'emploi...");

  for (const job of jobsToSeed) {
    const result = await (prisma as any).jobPosting.upsert({
      where: { slug: job.slug },
      update: {
        title: job.title,
        role: job.role,
        department: job.department,
        employmentType: job.employmentType,
        location: job.location,
        descriptionFr: job.descriptionFr,
        descriptionAr: job.descriptionAr,
        descriptionEn: job.descriptionEn,
        missions: job.missions,
        requirements: job.requirements,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryType: job.salaryType,
        status: job.status,
        publishedAt: job.publishedAt,
      },
      create: {
        title: job.title,
        slug: job.slug,
        role: job.role,
        department: job.department,
        employmentType: job.employmentType,
        location: job.location,
        descriptionFr: job.descriptionFr,
        descriptionAr: job.descriptionAr,
        descriptionEn: job.descriptionEn,
        missions: job.missions,
        requirements: job.requirements,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryType: job.salaryType,
        status: job.status,
        publishedAt: job.publishedAt,
      },
    });

    console.log(`✅ Offre synchronisée : "${result.title}" (slug: ${result.slug})`);
  }

  console.log("🎉 Toutes les offres d'emploi ont été insérées et publiées avec succès !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors de l'insertion des offres :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
