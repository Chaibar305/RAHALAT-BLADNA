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
} as const;

export type TeamRole = (typeof TeamRole)[keyof typeof TeamRole];
