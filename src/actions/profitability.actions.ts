"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { BookingStatus, PaymentStatus } from "@prisma/client";
import { requireAdminSession } from "@/lib/adminAuth";

export interface TripProfitabilityResult {
  tripId: string;
  tripTitle: string;
  pricePerPerson: number;
  totalFixedCosts: number;
  unitVariableCost: number;
  breakEvenPassengers: number;
  totalCapacity: number;
  confirmedPassengers: number;
  confirmedBookingsCount: number;
  realCollectedRevenue: number;
  expectedRevenue: number;
  totalCostsCurrent: number;
  netMarginCurrent: number;
  marginRatePercentage: number;
  statusIndicator: "RED" | "ORANGE" | "GREEN";
  fixedCostsBreakdown: Array<{ label: string; amount: number }>;
  variableCostsBreakdown: Array<{ label: string; amount: number }>;
}

/**
 * Moteur de calcul de rentabilité réelle et seuil d'équilibre par circuit
 */
export async function calculateTripProfitability(tripId: string): Promise<{
  success: boolean;
  data?: TripProfitabilityResult;
  error?: string;
}> {
  await requireAdminSession("CALCULATE_TRIP_PROFITABILITY");

  try {
    const trip = await prisma.trip.findFirst({
      where: { OR: [{ id: tripId }, { slug: tripId }] },
      include: {
        fixedCosts: true,
        variableCosts: true,
        staffAssignments: true,
        partnerAssignments: {
          include: { partner: true },
        },
        departureDates: true,
        bookings: {
          where: {
            status: { in: [BookingStatus.DEPOSIT_PAID, BookingStatus.FULLY_PAID, BookingStatus.CONFIRMEE] },
          },
          include: {
            travelers: true,
            payments: {
              where: { status: PaymentStatus.VERIFIED },
            },
          },
        },
      },
    });

    if (!trip) {
      return { success: false, error: "Circuit introuvable" };
    }

    const pricePerPerson = Number(trip.basePrice || 0);
    const totalCapacity = trip.totalSeats || 18;

    // 1. Calcul des Coûts Fixes (Transport, Staff, Frais logistiques)
    let fixedCostsBreakdown: Array<{ label: string; amount: number }> = [];

    if (trip.fixedCosts.length > 0) {
      fixedCostsBreakdown = trip.fixedCosts.map((fc) => ({
        label: fc.label,
        amount: Number(fc.amount),
      }));
    } else {
      // Coûts dérivés réels des assignations partenaires et staff
      const transportPartner = trip.partnerAssignments.find(
        (p) => p.partner.type === "TRANSPORT_TOURISTIQUE" && p.status === "ACCEPTE"
      );
      if (transportPartner?.negotiatedCost) {
        fixedCostsBreakdown.push({
          label: `Transport (${transportPartner.partner.companyName})`,
          amount: Number(transportPartner.negotiatedCost),
        });
      }

      const staffWithRemun = trip.staffAssignments.filter((s) => s.remuneration && Number(s.remuneration) > 0);
      if (staffWithRemun.length > 0) {
        const totalRemun = staffWithRemun.reduce((acc, s) => acc + Number(s.remuneration), 0);
        fixedCostsBreakdown.push({
          label: `Rémunérations Équipe (${staffWithRemun.length} membres)`,
          amount: totalRemun,
        });
      }
    }

    const totalFixedCosts = fixedCostsBreakdown.reduce((acc, it) => acc + it.amount, 0);

    // 2. Calcul du Coût Variable Unitaire par personne (Hôtel, Repas, Billetterie)
    let variableCostsBreakdown: Array<{ label: string; amount: number }> = [];

    if (trip.variableCosts.length > 0) {
      variableCostsBreakdown = trip.variableCosts.map((vc) => ({
        label: vc.label,
        amount: Number(vc.amount),
      }));
    } else {
      const hotelPartner = trip.partnerAssignments.find(
        (p) => p.partner.type === "HOTEL_AUBERGE" && p.status === "ACCEPTE"
      );
      if (hotelPartner?.negotiatedCost) {
        variableCostsBreakdown.push({
          label: `Hébergement (${hotelPartner.partner.companyName})`,
          amount: Number(hotelPartner.negotiatedCost),
        });
      }
    }

    const unitVariableCost = variableCostsBreakdown.reduce((acc, it) => acc + it.amount, 0);

    // 3. Calcul du Seuil d'équilibre (Nombre minimum de passagers)
    // Seuil = Coûts Fixes / (Prix par passager - Coût variable unitaire)
    const unitContributionMargin = pricePerPerson - unitVariableCost;
    const breakEvenPassengers = totalFixedCosts > 0 && unitContributionMargin > 0
      ? Math.ceil(totalFixedCosts / unitContributionMargin)
      : 0;

    // 4. Inscriptions réelles et encaissements
    let confirmedPassengers = 0;
    let realCollectedRevenue = 0;

    trip.bookings.forEach((b) => {
      confirmedPassengers += b.travelers.length || 1;
      b.payments.forEach((p) => {
        realCollectedRevenue += Number(p.amount);
      });
    });

    const expectedRevenue = confirmedPassengers * pricePerPerson;
    const totalCostsCurrent = totalFixedCosts + confirmedPassengers * unitVariableCost;
    const netMarginCurrent = expectedRevenue - totalCostsCurrent;
    const marginRatePercentage = expectedRevenue > 0
      ? Math.round((netMarginCurrent / expectedRevenue) * 100)
      : 0;

    // 5. Indicateur visuel coloré
    let statusIndicator: "RED" | "ORANGE" | "GREEN" = "RED";
    if (confirmedPassengers >= breakEvenPassengers) {
      statusIndicator = marginRatePercentage >= 10 ? "GREEN" : "ORANGE";
    } else {
      statusIndicator = "RED";
    }

    return {
      success: true,
      data: {
        tripId: trip.id,
        tripTitle: trip.titleFr,
        pricePerPerson,
        totalFixedCosts,
        unitVariableCost,
        breakEvenPassengers,
        totalCapacity,
        confirmedPassengers,
        confirmedBookingsCount: trip.bookings.length,
        realCollectedRevenue,
        expectedRevenue,
        totalCostsCurrent,
        netMarginCurrent,
        marginRatePercentage,
        statusIndicator,
        fixedCostsBreakdown,
        variableCostsBreakdown,
      },
    };
  } catch (error: any) {
    console.error("Erreur calculateTripProfitability:", error);
    return { success: false, error: error.message || "Erreur de calcul" };
  }
}

/**
 * Met à jour les coûts fixes et variables d'un circuit
 */
export async function updateTripCostsAction(
  tripId: string,
  fixedCosts: Array<{ label: string; amount: number }>,
  variableCosts: Array<{ label: string; amount: number }>
) {
  await requireAdminSession("UPDATE_TRIP_COSTS");

  try {
    // Transaction atomique pour réécrire les coûts
    await prisma.$transaction([
      prisma.tripFixedCost.deleteMany({ where: { tripId } }),
      prisma.tripVariableCostPerPerson.deleteMany({ where: { tripId } }),
      prisma.tripFixedCost.createMany({
        data: fixedCosts.map((fc) => ({
          tripId,
          label: fc.label,
          amount: fc.amount,
        })),
      }),
      prisma.tripVariableCostPerPerson.createMany({
        data: variableCosts.map((vc) => ({
          tripId,
          label: vc.label,
          amount: vc.amount,
        })),
      }),
    ]);

    revalidatePath(`/admin/trips/${tripId}/rentabilite`);
    revalidatePath(`/admin/trips`);
    revalidatePath(`/admin`);

    return { success: true };
  } catch (error: any) {
    console.error("Erreur updateTripCostsAction:", error);
    return { success: false, error: error.message };
  }
}
