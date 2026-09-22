/**
 * Types et énumérations du module Recrutement & Candidatures
 * Définis explicitement pour garantir la cohérence TypeScript et éliminer
 * toute désynchronisation du cache IDE sur @prisma/client.
 */

export type JobStatus = "BROUILLON" | "PUBLIEE" | "FERMEE" | "ARCHIVEE";
export const JobStatus = {
  BROUILLON: "BROUILLON",
  PUBLIEE: "PUBLIEE",
  FERMEE: "FERMEE",
  ARCHIVEE: "ARCHIVEE",
} as const;

export type EmploymentType =
  | "FREELANCE"
  | "TEMPS_PARTIEL"
  | "TEMPS_PLEIN"
  | "MISSION_PONCTUELLE"
  | "STAGE";
export const EmploymentType = {
  FREELANCE: "FREELANCE",
  TEMPS_PARTIEL: "TEMPS_PARTIEL",
  TEMPS_PLEIN: "TEMPS_PLEIN",
  MISSION_PONCTUELLE: "MISSION_PONCTUELLE",
  STAGE: "STAGE",
} as const;

export type SalaryType =
  | "FORFAIT_MISSION"
  | "MENSUEL"
  | "POURCENTAGE"
  | "A_DISCUTER";
export const SalaryType = {
  FORFAIT_MISSION: "FORFAIT_MISSION",
  MENSUEL: "MENSUEL",
  POURCENTAGE: "POURCENTAGE",
  A_DISCUTER: "A_DISCUTER",
} as const;

export type StaffRole =
  | "ORGANISATEUR"
  | "GUIDE_ANIMATEUR"
  | "CHAUFFEUR"
  | "SURVEILLANT"
  | "AUTRE";
export const StaffRole = {
  ORGANISATEUR: "ORGANISATEUR",
  GUIDE_ANIMATEUR: "GUIDE_ANIMATEUR",
  CHAUFFEUR: "CHAUFFEUR",
  SURVEILLANT: "SURVEILLANT",
  AUTRE: "AUTRE",
} as const;

export type ApplicationStatus =
  | "NOUVELLE"
  | "EN_EXAMEN"
  | "ENTRETIEN_PROGRAMME"
  | "ACCEPTEE"
  | "REFUSEE"
  | "ARCHIVEE";
export const ApplicationStatus = {
  NOUVELLE: "NOUVELLE",
  EN_EXAMEN: "EN_EXAMEN",
  ENTRETIEN_PROGRAMME: "ENTRETIEN_PROGRAMME",
  ACCEPTEE: "ACCEPTEE",
  REFUSEE: "REFUSEE",
  ARCHIVEE: "ARCHIVEE",
} as const;
