export type Locale = 'fr' | 'ar' | 'en';

export interface PickupPointDto {
  id: string;
  cityName: string;
  locationName: string;
  departureTime: string;
  googleMapsUrl?: string;
}

export interface AddonDto {
  id: string;
  name: string;
  price: number;
  description: string;
  isPerPerson: boolean;
}

export interface DepartureDateDto {
  id: string;
  tripId: string;
  startDate: string;
  endDate: string;
  basePriceDouble: number;
  priceTriple?: number;
  singleRoomSupplement: number;
  depositAmount: number;
  totalCapacity: number;
  availableSeats: number;
  status: 'GUARANTEED' | 'OPEN_FOR_BOOKING' | 'ALMOST_FULL' | 'SOLD_OUT';
}

export interface TripDto {
  id: string;
  title: string;
  slug: string;
  tripType: string;
  durationDays: number;
  durationNights: number;
  destinationRegion: string;
  departureCity: string;
  shortDescription: string;
  longDescription: string;
  includedServices: string[];
  excludedServices: string[];
  checklistItems: string[];
  coverImageUrl: string;
  galleryImages: string[];
  pickupPoints: PickupPointDto[];
  addons: AddonDto[];
  departureDates: DepartureDateDto[];
}

export interface PassengerSubmission {
  fullName: string;
  cinOrPassport: string;
  nationality: string;
  phone: string;
  email?: string;
  gender: 'M' | 'F';
  roomType: 'DOUBLE_TWIN' | 'DOUBLE_MATRIMONIAL' | 'TRIPLE' | 'SINGLE';
  pickupPointId: string;
}

export interface BookingSubmission {
  tripId: string;
  departureDateId: string;
  passengerCount: number;
  passengers: PassengerSubmission[];
  selectedAddons: Record<string, number>;
  paymentOption: 'DEPOSIT' | 'FULL';
  paymentMethod: 'CMI_CARD' | 'BANK_TRANSFER' | 'CASH_AT_AGENCY';
  receiptImageBase64?: string;
  notes?: string;
}

export interface ManifestPassengerRow {
  id: string;
  seatNumber?: number;
  fullName: string;
  cinOrPassport: string;
  nationality: string;
  phone: string;
  pickupLocation: string;
  roomType: string;
  bookingNumber: string;
  isCheckedIn: boolean;
  paymentStatus: 'FULLY_PAID' | 'DEPOSIT_PAID' | 'UNPAID';
  remainingBalance: number;
}

export interface ManifestTransportInfo {
  tripId?: string;
  tripSlug?: string;
  tripTitle: string;
  departureDate: string;
  transporterName: string | null;
  tistNumber: string | null;
  plateNumber: string | null;
  driverName: string | null;
  driverPhone: string | null;
  driverCard: string | null;
  agencyName: string;
  agencyLicense: string;
  hasTransportAssigned: boolean;
  hasDriverAssigned: boolean;
}

export interface BreakEvenAnalysis {
  departureDateId: string;
  tripTitle: string;
  totalSeats: number;
  bookedSeats: number;
  fixedCosts: {
    transportCost: number;
    tourLeaderFee: number;
    permitsAndRoadTolls: number;
    totalFixed: number;
  };
  variableCostsPerPassenger: {
    hotelRoomPerPerson: number;
    mealsAndActivities: number;
    totalVariable: number;
  };
  sellingPricePerSeat: number;
  breakEvenPassengerCount: number;
  currentRevenue: number;
  currentGrossMargin: number;
  isProfitable: boolean;
}
