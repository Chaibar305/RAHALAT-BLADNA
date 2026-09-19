import { z } from "zod";

export const TravelerInputSchema = z.object({
  fullName: z.string().min(2, "Le nom complet est obligatoire"),
  cinPassport: z.string().min(3, "N° CIN ou Passeport requis"),
  phone: z.string().optional().nullable(),
  category: z.enum(["ADULTE", "ENFANT"]).default("ADULTE"),
  emergencyContact: z.string().optional().nullable(),
});

export const CreateBookingSchema = z.object({
  tripId: z.string().min(1, "Identifiant du circuit obligatoire"),
  departureDateId: z.string().optional().nullable(),
  travelers: z.array(TravelerInputSchema).min(1, "Au moins 1 voyageur requis"),
  selectedAddons: z.record(z.string(), z.number()).optional().default({}),
  paymentOption: z.enum(["DEPOSIT", "FULL"]).default("DEPOSIT"),
  paymentMethod: z.enum(["CARTE", "VIREMENT", "ESPECES", "AGENCE"]).default("VIREMENT"),
  receiptUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  eventId: z.string().optional().nullable(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
