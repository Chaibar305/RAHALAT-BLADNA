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
};

// Alias de rétrocompatibilité
export const DEFAULT_STAFF_MISSIONS = DEFAULT_TEAM_MISSIONS;
