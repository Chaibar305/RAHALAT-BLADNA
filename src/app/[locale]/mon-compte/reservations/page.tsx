import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookingsList, SerializedBooking } from "@/components/account/BookingsList";

interface PageProps {
  params: {
    locale: string;
  };
}

export default async function MyBookingsPage({ params: { locale } }: PageProps) {
  // 1. Protection de la route côté serveur
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect(`/${locale}/connexion?callbackUrl=/${locale}/mon-compte/reservations`);
  }

  const userEmail = session.user.email;
  const userId = (session.user as any)?.id;

  // 2. Récupération des réservations réelles de l'utilisateur avec Prisma
  const dbBookings = await prisma.booking.findMany({
    where: {
      OR: [
        ...(userId ? [{ userId }] : []),
        { user: { email: userEmail } },
      ],
    },
    include: {
      trip: true,
      departureDate: true,
      travelers: true,
      invoice: true,
      payments: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // 3. Sérialisation pour le composant client
  const serializedBookings: SerializedBooking[] = dbBookings.map((b) => {
    const total = Number(b.totalAmount);
    const paid = Number(b.amountPaid);
    const remaining = total - paid;

    return {
      id: b.id,
      bookingNumber: b.reference,
      totalAmount: total,
      paidAmount: paid,
      remainingBalance: remaining > 0 ? remaining : 0,
      bookingStatus: b.status,
      paymentStatus: b.paymentStatus,
      qrCodeToken: b.qrCodeToken || b.id,
      createdAt: b.createdAt.toISOString(),
      cancelledAt: b.cancelledAt ? b.cancelledAt.toISOString() : null,
      cancellationReason: b.cancellationReason || null,
      departure: {
        id: b.departureDate?.id || b.id,
        startDate: b.departureDate ? b.departureDate.startDate.toISOString() : new Date("2026-09-15").toISOString(),
        endDate: b.departureDate ? b.departureDate.endDate.toISOString() : new Date("2026-09-17").toISOString(),
        status: b.departureDate?.status || "GUARANTEED",
        trip: {
          id: b.trip.id,
          slug: b.trip.slug,
          titleFr: b.trip.titleFr,
          titleAr: b.trip.titleAr,
          coverImageUrl: b.trip.coverImageUrl || "/images/merzouga/cover-merzouga.jpg",
          durationDays: b.trip.durationDays,
          durationNights: b.trip.durationNights,
          departureCity: b.trip.departureCity,
        },
      },
      passengers: b.travelers.map((t) => ({
        id: t.id,
        fullName: t.fullName,
        cinOrPassport: t.cinPassport,
        phone: t.phone,
        roomTypePreference: "DOUBLE_TWIN",
        isCheckedIn: true,
      })),
      invoices: b.invoice
        ? [
            {
              id: b.invoice.id,
              invoiceNumber: b.invoice.number,
              type: b.invoice.status === "PAYEE" ? "FACTURE_SOLDE" : "FACTURE_ACOMPTE",
              status: b.invoice.status,
            },
          ]
        : [],
      payments: (b.payments || []).map((p) => ({
        id: p.id,
        status: p.status,
        amount: Number(p.amount),
        type: p.type,
        method: p.method,
        proofUrl: p.proofUrl,
      })),
    };
  });

  return (
    <div className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BookingsList
          bookings={serializedBookings}
          user={{
            name: session.user.name || "Voyageur",
            email: session.user.email,
            phone: (session.user as any).phone || "+212 600-000000",
          }}
        />
      </div>
    </div>
  );
}
