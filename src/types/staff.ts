import { TeamRole } from "@/types/enums";

// Missions par défaut selon le cahier des charges pour les rôles d'encadrement & de terrain
export const DEFAULT_TEAM_MISSIONS: Record<TeamRole, string[]> = {
  SUPER_ADMIN: [
    "Supervision générale et gestion administrative",
    "Contrôle financier, validation des encaissements",
    "Audit de sécurité et conformité réglementaire",
  ],
  ORGANIZER: [
    "Coordination globale du voyage et respect du planning",
    "Relation clients et accueil personnalisé",
    "Gestion des imprévus et logistique sur le terrain",
    "Validation du programme avec les prestataires hôteliers & transporteurs",
    "Liaison directe avec la direction de l'agence",
  ],
  TOUR_LEADER: [
    "Coordination générale du groupe et respect des horaires",
    "Contrôle et pointage mobile des billets passagers (QR Code)",
    "Consultation du manifeste officiel des voyageurs",
    "Encaissement éventuel du solde restant sur le quai",
    "Animation et cohésion du groupe",
  ],
  OFFICIAL_GUIDE: [
    "Visites guidées officielles et explications culturelles & historiques",
    "Feuille de route TIST conforme réglementation Ministère du Tourisme",
    "Pointage et vérification d'accès aux monuments et réserves naturelles",
    "Sensibilisation au patrimoine et sécurité sur les sentiers de randonnée",
  ],
  DRIVER: [
    "Conduite sécurisée et respect strict du code de la route",
    "Pointage au ramassage des passagers aux points de départ",
    "Respect des horaires, pauses de repos réglementaires",
    "Entretien et propreté du véhicule autocar/minibus touristique",
    "Gestion des péages autoroutes (Jawaz) et stationnements",
  ],
  PRO_DRIVER: [
    "Conduite professionnelle sécurisée et respect du code de la route",
    "Pointage au ramassage des passagers aux points de départ",
    "Respect strict des temps de repos et sécurité des passagers",
    "Entretien et inspection pré-départ de l'autocar ou minibus",
    "Gestion des péages autoroutiers (Jawaz) et logistique de bord",
  ],
  CONFIRMATION_AGENT: [
    "Confirmation téléphonique proactive des réservations et validation des passagers",
    "Vérification des coordonnées, points de ramassage et besoins spécifiques",
    "Gestion des relances d'appels, suivis WhatsApp et assistance avant-départ",
    "Mise à jour des statuts de réservation et coordination avec l'équipe logistique",
    "Accompagnement client pour les modalités de paiement et documents requis",
  ],
  MEDIA_BUYER: [
    "Gestion, paramétrage et pilotage des campagnes publicitaires (Meta Ads, TikTok Ads, Google Ads)",
    "Optimisation continue du coût par acquisition (CPA) et du retour sur dépenses publicitaires (ROAS)",
    "A/B testing des créatifs visuels, formats vidéo et accroches marketing",
    "Analyse granulaire des tunnels de conversion et attribution des réservations",
    "Reporting hebdomadaire des performances d'acquisition et allocation budgétaire",
  ],
  PHOTOGRAPHER_VIDEOGRAPHER: [
    "Prise de vue photo et vidéo HD de l'expédition (paysages, portraits, moments forts)",
    "Production de reels et contenus dynamiques pour les réseaux sociaux (Instagram, TikTok)",
    "Pilotage de drone homologué pour les plans aériens panoramiques",
    "Tri, retouche express et mise à disposition des albums photos aux voyageurs",
    "Constitution de la banque d'images et vidéos pour l'équipe marketing",
  ],
};

// Alias de rétrocompatibilité
export const DEFAULT_STAFF_MISSIONS = DEFAULT_TEAM_MISSIONS;
