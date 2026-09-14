-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_STAFF', 'TOUR_LEADER', 'CLIENT');

-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('WEEKEND_BREAK', 'MULTI_DAY_TOUR', 'DAY_TRIP', 'TREKKING_HIKING', 'SAHARA_SPECIAL');

-- CreateEnum
CREATE TYPE "DepartureStatus" AS ENUM ('DRAFT', 'OPEN_FOR_BOOKING', 'GUARANTEED', 'ALMOST_FULL', 'SOLD_OUT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'DEPOSIT_PAID', 'FULLY_PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('DOUBLE_TWIN', 'DOUBLE_MATRIMONIAL', 'TRIPLE', 'QUADRUPLE', 'SINGLE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CMI_CARD', 'STRIPE_CARD', 'BANK_TRANSFER', 'CASH_AT_AGENCY', 'CASH_AT_DEPARTURE', 'WAFA_CASH_CASH_PLUS');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING_VALIDATION', 'APPROVED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('HIGHWAY_TOLL', 'FUEL_DIESEL', 'PARKING_GUARDING', 'LOCAL_GUIDE_FEE', 'MEAL_INCIDENTAL', 'POLICE_FORMALITY', 'EMERGENCY_REPAIR');

-- CreateTable
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "logoUrl" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL DEFAULT 'Casablanca',
    "iceNumber" TEXT,
    "rcNumber" TEXT,
    "bankAccounts" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "cinOrPassport" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "titleFr" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT,
    "slug" TEXT NOT NULL,
    "tripType" "TripType" NOT NULL DEFAULT 'MULTI_DAY_TOUR',
    "durationDays" INTEGER NOT NULL DEFAULT 3,
    "durationNights" INTEGER NOT NULL DEFAULT 2,
    "destinationRegion" TEXT NOT NULL,
    "departureCity" TEXT NOT NULL,
    "shortDescriptionFr" TEXT NOT NULL,
    "shortDescriptionAr" TEXT NOT NULL,
    "longDescriptionFr" TEXT NOT NULL,
    "longDescriptionAr" TEXT NOT NULL,
    "includedServicesFr" TEXT[],
    "includedServicesAr" TEXT[],
    "excludedServicesFr" TEXT[],
    "excludedServicesAr" TEXT[],
    "checklistItemsFr" TEXT[],
    "checklistItemsAr" TEXT[],
    "coverImageUrl" TEXT NOT NULL,
    "galleryImages" TEXT[],
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripPickupPoint" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "cityName" TEXT NOT NULL,
    "locationNameFr" TEXT NOT NULL,
    "locationNameAr" TEXT NOT NULL,
    "googleMapsUrl" TEXT,
    "departureTime" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TripPickupPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartureDate" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "totalCapacity" INTEGER NOT NULL DEFAULT 48,
    "minSeatsForGuaranteed" INTEGER NOT NULL DEFAULT 15,
    "basePriceDouble" DECIMAL(10,2) NOT NULL,
    "priceTriple" DECIMAL(10,2),
    "singleRoomSupplement" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "depositAmount" DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    "status" "DepartureStatus" NOT NULL DEFAULT 'OPEN_FOR_BOOKING',
    "tourLeaderId" TEXT,
    "transportContractId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartureDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripAddon" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "descriptionFr" TEXT,
    "descriptionAr" TEXT,
    "isPerPerson" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TripAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "bookingNumber" TEXT NOT NULL,
    "departureDateId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "remainingBalance" DECIMAL(10,2) NOT NULL,
    "bookingStatus" "BookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "qrCodeToken" TEXT NOT NULL,
    "notes" TEXT,
    "specialRequests" TEXT,
    "source" TEXT NOT NULL DEFAULT 'WEB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Passenger" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "cinOrPassport" TEXT NOT NULL,
    "nationality" TEXT NOT NULL DEFAULT 'Marocaine',
    "phone" TEXT,
    "birthDate" DATE,
    "gender" TEXT NOT NULL,
    "pickupPointId" TEXT,
    "roomTypePreference" "RoomType" NOT NULL DEFAULT 'DOUBLE_TWIN',
    "roomShareNotes" TEXT,
    "isCheckedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" TIMESTAMP(3),
    "seatNumber" INTEGER,
    "emergencyContact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Passenger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAddon" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "addonId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "BookingAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING_VALIDATION',
    "gatewayRef" TEXT,
    "receiptImageUrl" TEXT,
    "bankName" TEXT,
    "validatedById" TEXT,
    "validatedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportContract" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "transporterName" TEXT NOT NULL,
    "tistRegistrationNo" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "driverPhone" TEXT NOT NULL,
    "driverCardNumber" TEXT NOT NULL,
    "costAgreed" DECIMAL(10,2) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelPartner" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "categoryStars" INTEGER NOT NULL DEFAULT 4,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelAllocation" (
    "id" TEXT NOT NULL,
    "departureDateId" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "checkInDate" DATE NOT NULL,
    "checkOutDate" DATE NOT NULL,
    "roomsDoubleTwin" INTEGER NOT NULL DEFAULT 0,
    "roomsDoubleMatrimonial" INTEGER NOT NULL DEFAULT 0,
    "roomsTriple" INTEGER NOT NULL DEFAULT 0,
    "roomsSingle" INTEGER NOT NULL DEFAULT 0,
    "costPerNight" DECIMAL(10,2) NOT NULL,
    "confirmationCode" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourLeaderExpense" (
    "id" TEXT NOT NULL,
    "departureDateId" TEXT NOT NULL,
    "tourLeaderId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "receiptPhotoUrl" TEXT,
    "description" TEXT NOT NULL,
    "spentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isReimbursed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourLeaderExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agency_slug_key" ON "Agency"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_agencyId_idx" ON "User"("agencyId");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_slug_key" ON "Trip"("slug");

-- CreateIndex
CREATE INDEX "Trip_agencyId_idx" ON "Trip"("agencyId");

-- CreateIndex
CREATE INDEX "Trip_slug_idx" ON "Trip"("slug");

-- CreateIndex
CREATE INDEX "TripPickupPoint_tripId_idx" ON "TripPickupPoint"("tripId");

-- CreateIndex
CREATE INDEX "DepartureDate_tripId_idx" ON "DepartureDate"("tripId");

-- CreateIndex
CREATE INDEX "DepartureDate_startDate_idx" ON "DepartureDate"("startDate");

-- CreateIndex
CREATE INDEX "DepartureDate_tourLeaderId_idx" ON "DepartureDate"("tourLeaderId");

-- CreateIndex
CREATE INDEX "TripAddon_tripId_idx" ON "TripAddon"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingNumber_key" ON "Booking"("bookingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_qrCodeToken_key" ON "Booking"("qrCodeToken");

-- CreateIndex
CREATE INDEX "Booking_departureDateId_idx" ON "Booking"("departureDateId");

-- CreateIndex
CREATE INDEX "Booking_clientId_idx" ON "Booking"("clientId");

-- CreateIndex
CREATE INDEX "Booking_bookingNumber_idx" ON "Booking"("bookingNumber");

-- CreateIndex
CREATE INDEX "Booking_qrCodeToken_idx" ON "Booking"("qrCodeToken");

-- CreateIndex
CREATE INDEX "Passenger_bookingId_idx" ON "Passenger"("bookingId");

-- CreateIndex
CREATE INDEX "Passenger_cinOrPassport_idx" ON "Passenger"("cinOrPassport");

-- CreateIndex
CREATE INDEX "BookingAddon_bookingId_idx" ON "BookingAddon"("bookingId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_bookingId_idx" ON "PaymentTransaction"("bookingId");

-- CreateIndex
CREATE INDEX "TransportContract_agencyId_idx" ON "TransportContract"("agencyId");

-- CreateIndex
CREATE INDEX "HotelPartner_agencyId_idx" ON "HotelPartner"("agencyId");

-- CreateIndex
CREATE INDEX "HotelAllocation_departureDateId_idx" ON "HotelAllocation"("departureDateId");

-- CreateIndex
CREATE INDEX "HotelAllocation_hotelId_idx" ON "HotelAllocation"("hotelId");

-- CreateIndex
CREATE INDEX "TourLeaderExpense_departureDateId_idx" ON "TourLeaderExpense"("departureDateId");

-- CreateIndex
CREATE INDEX "TourLeaderExpense_tourLeaderId_idx" ON "TourLeaderExpense"("tourLeaderId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPickupPoint" ADD CONSTRAINT "TripPickupPoint_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartureDate" ADD CONSTRAINT "DepartureDate_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartureDate" ADD CONSTRAINT "DepartureDate_tourLeaderId_fkey" FOREIGN KEY ("tourLeaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartureDate" ADD CONSTRAINT "DepartureDate_transportContractId_fkey" FOREIGN KEY ("transportContractId") REFERENCES "TransportContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripAddon" ADD CONSTRAINT "TripAddon_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_departureDateId_fkey" FOREIGN KEY ("departureDateId") REFERENCES "DepartureDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passenger" ADD CONSTRAINT "Passenger_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passenger" ADD CONSTRAINT "Passenger_pickupPointId_fkey" FOREIGN KEY ("pickupPointId") REFERENCES "TripPickupPoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAddon" ADD CONSTRAINT "BookingAddon_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAddon" ADD CONSTRAINT "BookingAddon_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "TripAddon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportContract" ADD CONSTRAINT "TransportContract_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelPartner" ADD CONSTRAINT "HotelPartner_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelAllocation" ADD CONSTRAINT "HotelAllocation_departureDateId_fkey" FOREIGN KEY ("departureDateId") REFERENCES "DepartureDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelAllocation" ADD CONSTRAINT "HotelAllocation_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "HotelPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourLeaderExpense" ADD CONSTRAINT "TourLeaderExpense_departureDateId_fkey" FOREIGN KEY ("departureDateId") REFERENCES "DepartureDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourLeaderExpense" ADD CONSTRAINT "TourLeaderExpense_tourLeaderId_fkey" FOREIGN KEY ("tourLeaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
