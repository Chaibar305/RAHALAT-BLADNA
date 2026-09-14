import React from "react";
import { requireScannerAccess } from "@/lib/teamPermissions";
import { getTripsForScannerAction } from "@/actions/scanner.actions";
import { LiveBoardingScanner } from "@/components/admin/scanner/LiveBoardingScanner";

interface ScannerPageProps {
  params: {
    locale: string;
  };
  searchParams: {
    tripId?: string;
  };
}

export const metadata = {
  title: "Scanner & Pointage Embarquement en Direct | Rahalat Bladna",
  description: "Module de scan QR code et de pointage d'embarquement autocar TIST pour guides et administrateurs.",
};

export default async function AdminScannerPage({ params: { locale }, searchParams }: ScannerPageProps) {
  const operator = await requireScannerAccess(locale);

  const { trips = [] } = await getTripsForScannerAction();

  return (
    <LiveBoardingScanner
      initialTrips={trips}
      preselectedTripId={searchParams.tripId}
      initialOperator={operator}
    />
  );
}
