/**
 * Enums locaux qui reflètent exactement les enums Prisma.
 * Utiliser ces imports dans les composants client et actions
 * pour éviter les problèmes de cache du serveur TypeScript de l'IDE.
 *
 * Ces valeurs sont en parfaite correspondance avec prisma/schema.prisma.
 */

export const TeamRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ORGANIZER: "ORGANIZER",
  TOUR_LEADER: "TOUR_LEADER",
  OFFICIAL_GUIDE: "OFFICIAL_GUIDE",
  DRIVER: "DRIVER",
  PRO_DRIVER: "PRO_DRIVER",
  CONFIRMATION_AGENT: "CONFIRMATION_AGENT",
  MEDIA_BUYER: "MEDIA_BUYER",
  PHOTOGRAPHER_VIDEOGRAPHER: "PHOTOGRAPHER_VIDEOGRAPHER",
} as const;

export type TeamRole = (typeof TeamRole)[keyof typeof TeamRole];

export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  AGENCY_ADMIN: "AGENCY_ADMIN",
  AGENCY_STAFF: "AGENCY_STAFF",
  TOUR_LEADER: "TOUR_LEADER",
  STAFF: "STAFF",
  CLIENT: "CLIENT",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const CallStatus = {
  PENDING_CALL: "PENDING_CALL",
  NO_ANSWER_1: "NO_ANSWER_1",
  NO_ANSWER_2: "NO_ANSWER_2",
  CALLBACK_SCHEDULED: "CALLBACK_SCHEDULED",
  CONFIRMED_PHONE: "CONFIRMED_PHONE",
  DEPOSIT_RECEIVED: "DEPOSIT_RECEIVED",
  CANCELLED_REFUSED: "CANCELLED_REFUSED",
  WRONG_NUMBER: "WRONG_NUMBER",
} as const;

export type CallStatus = (typeof CallStatus)[keyof typeof CallStatus];

