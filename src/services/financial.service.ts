import { BreakEvenAnalysis } from "@/types";

export class FinancialService {
  /**
   * Calcule le seuil de rentabilité (Point Mort) et la marge brute d'un départ
   */
  public static calculateDepartureBreakEven(params: {
    departureDateId: string;
    tripTitle: string;
    totalSeats: number;
    bookedSeats: number;
    sellingPricePerSeat: number;
    transportCost: number;
    tourLeaderFee: number;
    permitsAndRoadTolls?: number;
    hotelCostPerPersonPerNight: number;
    nightsCount: number;
    mealsAndActivitiesPerPerson?: number;
  }): BreakEvenAnalysis {
    const {
      departureDateId,
      tripTitle,
      totalSeats,
      bookedSeats,
      sellingPricePerSeat,
      transportCost,
      tourLeaderFee,
      permitsAndRoadTolls = 600,
      hotelCostPerPersonPerNight,
      nightsCount,
      mealsAndActivitiesPerPerson = 150,
    } = params;

    // 1. Coûts Fixes (indépendants du nombre de voyageurs)
    const totalFixed = transportCost + tourLeaderFee + permitsAndRoadTolls;

    // 2. Coûts Variables par voyageur (Hôtel, petits déjeuners, entrées sites)
    const hotelTotalPerPerson = hotelCostPerPersonPerNight * nightsCount;
    const totalVariable = hotelTotalPerPerson + mealsAndActivitiesPerPerson;

    // 3. Marge sur coût variable unitaire (M/CV unitaire)
    const contributionMarginPerSeat = sellingPricePerSeat - totalVariable;

    // 4. Seuil de rentabilité (Nombre de passagers requis pour amortir les coûts fixes)
    const breakEvenPassengerCount =
      contributionMarginPerSeat > 0
        ? Math.ceil(totalFixed / contributionMarginPerSeat)
        : totalSeats;

    // 5. Résultats actuels
    const currentRevenue = bookedSeats * sellingPricePerSeat;
    const currentTotalCosts = totalFixed + bookedSeats * totalVariable;
    const currentGrossMargin = currentRevenue - currentTotalCosts;
    const isProfitable = bookedSeats >= breakEvenPassengerCount;

    return {
      departureDateId,
      tripTitle,
      totalSeats,
      bookedSeats,
      fixedCosts: {
        transportCost,
        tourLeaderFee,
        permitsAndRoadTolls,
        totalFixed,
      },
      variableCostsPerPassenger: {
        hotelRoomPerPerson: hotelTotalPerPerson,
        mealsAndActivities: mealsAndActivitiesPerPerson,
        totalVariable,
      },
      sellingPricePerSeat,
      breakEvenPassengerCount,
      currentRevenue,
      currentGrossMargin,
      isProfitable,
    };
  }
}
