"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CreateBookingSchema, CreateBookingInput } from "@/lib/validations/booking.schema";
import { BookingStatus, PaymentStatus, QuoteStatus, InvoiceStatus, PaymentType, PaymentMethod } from "@prisma/client";
import { updateBookingAction as updateBookingActionImpl } from "./admin-bookings";
import { sendMetaCapiEvent } from "@/lib/meta-capi";

/**
 * Server Action : Création d'une réservation atomique avec Devis et Facture
 */
export async function createBookingAction(input: CreateBookingInput) {
  console.log("🚀 [createBookingAction] Début du flux de réservation...", {
    tripId: input.tripId,
    travelersCount: input.travelers?.length,
    paymentOption: input.paymentOption,
  });

  try {
    // 1. Validation des données d'entrée avec Zod
    const parsed = CreateBookingSchema.safeParse(input);
    if (!parsed.success) {
      console.warn("⚠️ [createBookingAction] Erreur de validation Zod:", parsed.error.format());
      return { success: false, errors: parsed.error.format(), error: "Données de réservation invalides" };
    }

    const data = parsed.data;

    // 2. Récupération sécurisée du userId depuis la session active
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    const userEmail = session?.user?.email;

    if (!userId && userEmail) {
      const dbUser = await prisma.user.findUnique({ where: { email: userEmail } });
      if (dbUser) userId = dbUser.id;
    }

    if (!userId) {
      // Si aucun utilisateur en session, associer au premier client ou créer un compte voyageur
      const leadTraveler = data.travelers[0];
      const guestEmail = userEmail || `client-${Date.now()}@rahalatbladna.ma`;

      const newUser = await prisma.user.upsert({
        where: { email: guestEmail },
        update: {
          fullName: leadTraveler.fullName,
          phone: leadTraveler.phone || undefined,
          cinOrPassport: leadTraveler.cinPassport,
        },
        create: {
          email: guestEmail,
          fullName: leadTraveler.fullName,
          name: leadTraveler.fullName,
          phone: leadTraveler.phone || `+212 600-${Date.now().toString().slice(-6)}`,
          cinOrPassport: leadTraveler.cinPassport,
          role: "CLIENT",
          isProfileComplete: true,
        },
      });
      userId = newUser.id;
    }

    console.log("👤 [createBookingAction] Utilisateur identifié:", userId);

    // 3. Récupération du Circuit et de la Date de départ
    const trip = await prisma.trip.findFirst({
      where: { OR: [{ id: data.tripId }, { slug: data.tripId }] },
      include: {
        departureDates: true,
        addons: true,
      },
    });

    if (!trip) {
      return { success: false, error: "Circuit sélectionné introuvable." };
    }

    let selectedDeparture = data.departureDateId
      ? trip.departureDates.find((d) => d.id === data.departureDateId)
      : trip.departureDates[0];

    const paxCount = data.travelers.length;
    const basePrice = Number(trip.basePrice || 1450);
    const depositPerPax = Number(trip.depositPerPerson || 500);

    // Calcul du montant total
    let totalAmount = paxCount * basePrice;
    const depositAmount = paxCount * depositPerPax;
    const amountPaid = data.paymentOption === "FULL" ? totalAmount : depositAmount;

    const subtotalHt = Math.round((totalAmount / 1.2) * 100) / 100;
    const taxAmount = Math.round((totalAmount - subtotalHt) * 100) / 100;
    const balanceDue = totalAmount - amountPaid;

    const bookingRef = `RB-2026-${Date.now().toString().slice(-6)}`;
    const quoteNum = `DEV-2026-${Date.now().toString().slice(-6)}`;
    const invoiceNum = `FAC-2026-${Date.now().toString().slice(-6)}`;

    // Déclenchement Meta Conversions API (CAPI) pour InitiateCheckout avec déduplication stricte via eventId
    if (data.eventId) {
      const leadTraveler = data.travelers[0];
      sendMetaCapiEvent({
        eventName: "InitiateCheckout",
        eventId: data.eventId,
        eventSourceUrl: `${process.env.NEXTAUTH_URL || "https://rahalatbladna.ma"}/fr/trips/${trip.slug}`,
        userData: {
          email: userEmail || undefined,
          phone: leadTraveler?.phone || undefined,
          fullName: leadTraveler?.fullName,
        },
        customData: {
          currency: "MAD",
          value: totalAmount,
          content_name: trip.titleFr,
          content_category: trip.destinationRegion || "Circuit Touristique",
          content_ids: [trip.id],
          contents: [
            {
              id: trip.id,
              quantity: paxCount,
              item_price: basePrice,
            },
          ],
          num_items: paxCount,
        },
      }).catch((err) => {
        console.warn("⚠️ [createBookingAction] CAPI InitiateCheckout non-bloquant :", err);
      });
    }

    // 4. Transaction Prisma Atomique ($transaction)
    const result = await prisma.$transaction(async (tx) => {
      // Insertion de la réservation : STRICTEMENT PENDING_VERIFICATION et 0 DH comptabilisés tant que non validé par l'admin
      const booking = await tx.booking.create({
        data: {
          reference: bookingRef,
          userId,
          tripId: trip.id,
          departureDateId: selectedDeparture?.id || null,
          status: BookingStatus.PENDING_VERIFICATION, // ⚠️ Toujours PENDING_VERIFICATION par défaut !
          totalAmount,
          depositAmount,
          depositPaid: 0, // ⚠️ 0 tant que l'admin n'a pas validé !
          amountPaid: 0,  // Rétro-compatibilité : 0
          paymentStatus: PaymentStatus.PENDING,
          notes: data.notes || null,
          travelers: {
            create: data.travelers.map((t) => ({
              fullName: t.fullName,
              cinPassport: t.cinPassport,
              phone: t.phone || null,
              category: t.category,
              emergencyContact: t.emergencyContact || null,
            })),
          },
          payments: {
            create: [
              {
                amount: amountPaid,
                type: data.paymentOption === "FULL" ? PaymentType.PAIEMENT_COMPLET : PaymentType.ACOMPTE,
                method: data.paymentMethod as PaymentMethod,
                status: PaymentStatus.PENDING, // ⚠️ PENDING tant que non validé par l'admin !
                receiptUrl: data.receiptUrl || null,
                proofUrl: data.receiptUrl || null,
              },
            ],
          },
          quote: {
            create: {
              number: quoteNum,
              subtotalHT: subtotalHt,
              taxAmount: taxAmount,
              totalTTC: totalAmount,
              validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Validité 7 jours
              status: QuoteStatus.ACCEPTE,
              pdfUrl: `/api/invoices/${quoteNum}/download`,
            },
          },
          invoice: {
            create: {
              number: invoiceNum,
              subtotalHT: subtotalHt,
              taxAmount: taxAmount,
              totalTTC: totalAmount,
              depositPaid: 0, // ⚠️ Aucun acompte comptabilisé avant vérification
              balanceDue: totalAmount,
              status: InvoiceStatus.EMISE,
              pdfUrl: `/api/invoices/${invoiceNum}/download`,
            },
          },
        },
        include: {
          travelers: true,
          payments: true,
          quote: true,
          invoice: true,
        },
      });

      return booking;
    });

    console.log("✅ [createBookingAction] Réservation créée avec succès:", result.reference);

    // Déclenchement Meta Conversions API (CAPI) pour l'événement Lead (ou Purchase)
    const leadTraveler = data.travelers[0];
    const leadEventId = `lead_${result.reference}`;
    sendMetaCapiEvent({
      eventName: "Lead",
      eventId: leadEventId,
      eventSourceUrl: `${process.env.NEXTAUTH_URL || "https://rahalatbladna.ma"}/fr/trips/${trip.slug}`,
      userData: {
        email: userEmail || undefined,
        phone: leadTraveler?.phone || undefined,
        fullName: leadTraveler?.fullName,
      },
      customData: {
        currency: "MAD",
        value: totalAmount,
        content_name: trip.titleFr,
        order_id: result.reference,
        num_items: paxCount,
      },
    }).catch((err) => {
      console.warn("⚠️ [createBookingAction] CAPI Lead non-bloquant :", err);
    });

    revalidatePath("/mon-compte/reservations");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin");

    return {
      success: true,
      bookingId: result.id,
      reference: result.reference,
      quoteNumber: quoteNum,
      invoiceNumber: invoiceNum,
      totalAmount,
      amountPaid,
      balanceDue,
    };
  } catch (error: any) {
    console.error("❌ [createBookingAction] Erreur lors de la création de la réservation:", error);
    return {
      success: false,
      error: error.message || "Une erreur est survenue lors de l'enregistrement de votre réservation.",
    };
  }
}

import { requireAdminSession } from "@/lib/adminAuth";
import { generateBookingsListExcel, BookingExportItem } from "@/lib/excel/excelService";

/**
 * Server Action : Téléversement du reçu bancaire de réservation
 */
export async function uploadBookingReceiptAction(formData: {
  bookingId: string;
  bankName: string;
  receiptUrl: string;
  notes?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return { success: false, error: "Vous devez être connecté." };
    }

    const booking = await prisma.booking.findUnique({
      where: { id: formData.bookingId },
      include: { user: true },
    });

    if (!booking) {
      return { success: false, error: "Réservation introuvable." };
    }

    if (booking.user.email !== session.user.email) {
      return { success: false, error: "Action non autorisée." };
    }

    const total = Number(booking.totalAmount);
    const paid = Number(booking.amountPaid);
    const remaining = total - paid;

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: remaining > 0 ? remaining : booking.depositAmount,
        type: paid > 0 ? "SOLDE" : "ACOMPTE",
        method: "VIREMENT",
        status: PaymentStatus.PENDING,
        receiptUrl: formData.receiptUrl,
        proofUrl: formData.receiptUrl,
      },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.PENDING_VERIFICATION,
        notes: `${booking.notes ? booking.notes + "\n" : ""}[Reçu virement ${formData.bankName}: ${formData.receiptUrl}] ${formData.notes || ""}`,
      },
    });

    revalidatePath("/mon-compte/reservations");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/finances");
    return { success: true };
  } catch (error: any) {
    console.error("uploadBookingReceiptAction error:", error);
    return { success: false, error: error.message || "Erreur lors de l'enregistrement du reçu." };
  }
}

/**
 * Admin Action : Valide l'acompte d'une réservation (Place garantie & Billet d'embarquement généré)
 */
export async function validateBookingDepositAction(
  bookingId: string,
  customAmount?: number,
  notes?: string
) {
  const adminSession = await requireAdminSession("VALIDATE_BOOKING_DEPOSIT");
  const adminName = adminSession.user?.name || adminSession.user?.email || "Administrateur";

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payments: true, invoice: true },
    });

    if (!booking) {
      return { success: false, error: "Dossier de réservation introuvable." };
    }

    const depositToCredit = customAmount ?? Number(booking.depositAmount);
    const total = Number(booking.totalAmount);
    const isFull = depositToCredit >= total;

    const newStatus = isFull ? BookingStatus.FULLY_PAID : BookingStatus.DEPOSIT_PAID;
    const newPaymentStatus = PaymentStatus.VERIFIED;

    // Transaction pour tout valider de manière atomique
    await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour la réservation
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: newStatus,
          paymentStatus: newPaymentStatus,
          depositPaid: depositToCredit,
          amountPaid: depositToCredit,
          notes: notes
            ? `${booking.notes ? booking.notes + "\n" : ""}[Validation Acompte ${adminName} ${new Date().toLocaleDateString("fr-FR")}]: ${notes}`
            : booking.notes,
        },
      });

      // 2. Valider le paiement en attente ou le mettre à jour
      const pendingPayment = booking.payments.find(
        (p) => p.status === PaymentStatus.PENDING
      );
      if (pendingPayment) {
        await tx.payment.update({
          where: { id: pendingPayment.id },
          data: {
            status: PaymentStatus.VERIFIED,
            amount: depositToCredit,
            verifiedAt: new Date(),
            verifiedBy: adminName,
          },
        });
      } else {
        await tx.payment.create({
          data: {
            bookingId,
            amount: depositToCredit,
            status: PaymentStatus.VERIFIED,
            type: isFull ? PaymentType.PAIEMENT_COMPLET : PaymentType.ACOMPTE,
            method: PaymentMethod.VIREMENT,
            verifiedAt: new Date(),
            verifiedBy: adminName,
          },
        });
      }

      // 3. Mettre à jour la facture si existante
      if (booking.invoice) {
        const balanceDue = Math.max(0, total - depositToCredit);
        await tx.invoice.update({
          where: { id: booking.invoice.id },
          data: {
            depositPaid: depositToCredit,
            balanceDue,
            status: balanceDue === 0 ? InvoiceStatus.PAYEE : InvoiceStatus.PARTIELLEMENT_PAYEE,
          },
        });
      }
    });

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/clients");
    revalidatePath("/mon-compte/reservations");
    revalidatePath("/admin");

    return {
      success: true,
      message: "Acompte validé avec succès. Le billet d'embarquement officiel est maintenant émis.",
    };
  } catch (error: any) {
    console.error("validateBookingDepositAction error:", error);
    return { success: false, error: error.message || "Erreur lors de la validation de l'acompte." };
  }
}

/**
 * Admin Action : Valide le paiement intégral (Solde 100% réglé)
 */
export async function validateBookingFullPaymentAction(bookingId: string, notes?: string) {
  const adminSession = await requireAdminSession("VALIDATE_BOOKING_FULL_PAYMENT");
  const adminName = adminSession.user?.name || adminSession.user?.email || "Administrateur";

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { invoice: true, payments: true },
    });

    if (!booking) {
      return { success: false, error: "Dossier de réservation introuvable." };
    }

    const total = Number(booking.totalAmount);

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.FULLY_PAID,
          paymentStatus: PaymentStatus.VERIFIED,
          depositPaid: total,
          amountPaid: total,
          notes: notes
            ? `${booking.notes ? booking.notes + "\n" : ""}[Validation Solde Total ${adminName} ${new Date().toLocaleDateString("fr-FR")}]: ${notes}`
            : booking.notes,
        },
      });

      // Valider tous les paiements en attente
      await tx.payment.updateMany({
        where: {
          bookingId,
          status: { in: [PaymentStatus.PENDING] },
        },
        data: {
          status: PaymentStatus.VERIFIED,
          verifiedAt: new Date(),
          verifiedBy: adminName,
        },
      });

      // Mettre à jour facture en soldée
      if (booking.invoice) {
        await tx.invoice.update({
          where: { id: booking.invoice.id },
          data: {
            depositPaid: total,
            balanceDue: 0,
            status: InvoiceStatus.PAYEE,
          },
        });
      }
    });

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/clients");
    revalidatePath("/mon-compte/reservations");
    revalidatePath("/admin");

    return { success: true, message: "Paiement intégral validé. Dossier soldé à 100%." };
  } catch (error: any) {
    console.error("validateBookingFullPaymentAction error:", error);
    return { success: false, error: error.message || "Erreur lors de la validation du solde." };
  }
}

/**
 * Admin Action : Rejette un reçu bancaire non conforme
 */
export async function rejectBookingReceiptAction(bookingId: string, reason: string) {
  const adminSession = await requireAdminSession("REJECT_BOOKING_RECEIPT");
  const adminName = adminSession.user?.name || adminSession.user?.email || "Administrateur";

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return { success: false, error: "Dossier introuvable." };
    }

    const trimmedReason = reason?.trim() || "Reçu non conforme ou illisible";

    await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour la réservation : remise à 0 de depositPaid, statut PENDING_VERIFICATION et motif
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.PENDING_VERIFICATION,
          paymentStatus: PaymentStatus.REJECTED,
          depositPaid: 0,
          amountPaid: 0,
          cancellationReason: trimmedReason,
          notes: `${booking.notes ? booking.notes + "\n" : ""}[REJET REÇU ${adminName} ${new Date().toLocaleDateString("fr-FR")}]: ${trimmedReason}`,
        },
      });

      // 2. Mettre à jour les paiements en attente (sans valeur EN_ATTENTE qui crash Postgres)
      await tx.payment.updateMany({
        where: {
          bookingId,
          status: { in: [PaymentStatus.PENDING] },
        },
        data: {
          status: PaymentStatus.REJECTED,
          verifiedAt: new Date(),
          verifiedBy: adminName,
        },
      });
    });

    revalidatePath("/admin");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/clients");
    revalidatePath("/mon-compte/reservations");

    return { success: true, message: "Preuve de paiement rejetée avec motif." };
  } catch (error: any) {
    console.error("rejectBookingReceiptAction error:", error);
    return { success: false, error: error.message || "Erreur lors du rejet du reçu." };
  }
}

export async function rejectPaymentReceiptAction(bookingId: string, reason: string) {
  return rejectBookingReceiptAction(bookingId, reason);
}

/**
 * Admin Action : Annule une réservation et libère les places
 */
/**
 * Admin Action : Annule une réservation par l'agence (Rejet/annulation administrative et libération des places)
 */
export async function cancelBookingAdminAction(bookingId: string, reason?: string) {
  const adminSession = await requireAdminSession("CANCEL_BOOKING");
  const adminName = adminSession.user?.name || adminSession.user?.email || "Administrateur";

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { invoice: true, travelers: true },
    });

    if (!booking) {
      return { success: false, error: "Dossier introuvable." };
    }

    const formattedReason = reason || "Annulé par l'administration";
    const passengerCount = booking.travelers.length || 1;

    await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour le booking avec statut strict CANCELLED_BY_ADMIN
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED_BY_ADMIN,
          cancelledAt: new Date(),
          cancellationReason: formattedReason,
          paymentStatus: PaymentStatus.REJECTED,
          notes: `${booking.notes ? booking.notes + "\n" : ""}[ANNULATION ADMIN ${adminName} ${new Date().toLocaleDateString("fr-FR")}]: ${formattedReason}`,
        },
      });

      // 2. Rejeter les paiements non encaissés
      await tx.payment.updateMany({
        where: {
          bookingId,
          status: { in: [PaymentStatus.PENDING] },
        },
        data: {
          status: PaymentStatus.REJECTED,
          verifiedAt: new Date(),
          verifiedBy: adminName,
        },
      });

      // 3. Annuler la facture liée
      if (booking.invoice) {
        await tx.invoice.update({
          where: { id: booking.invoice.id },
          data: { status: InvoiceStatus.ANNULEE },
        });
      }

      // 4. Libérer les places sur la date de départ
      if (booking.departureDateId) {
        const dep = await tx.departureDate.findUnique({
          where: { id: booking.departureDateId },
        });

        if (dep) {
          const newOccupied = Math.max(0, (dep.occupiedSeats || 0) - passengerCount);
          let newStatus = dep.status;
          if (dep.status === "SOLD_OUT") {
            newStatus =
              newOccupied >= dep.minSeatsForGuaranteed
                ? "GUARANTEED"
                : "OPEN_FOR_BOOKING";
          }

          await tx.departureDate.update({
            where: { id: booking.departureDateId },
            data: {
              occupiedSeats: newOccupied,
              status: newStatus,
            },
          });
        }
      }
    });

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/clients");
    revalidatePath("/mon-compte/reservations");

    return { success: true, message: "Réservation annulée par l'agence et places libérées." };
  } catch (error: any) {
    console.error("cancelBookingAdminAction error:", error);
    return { success: false, error: error.message || "Erreur lors de l'annulation." };
  }
}

/**
 * Admin Action : Exporte la liste des réservations en Excel
 */
export async function exportBookingsExcelAction(filterStatus?: string) {
  await requireAdminSession("EXPORT_BOOKINGS_EXCEL");

  try {
    const whereClause: any = {};
    if (filterStatus && filterStatus !== "ALL") {
      whereClause.status = filterStatus as BookingStatus;
    }

    const dbBookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        user: true,
        trip: true,
        departureDate: true,
        travelers: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const exportRows: BookingExportItem[] = dbBookings.map((b) => {
      const total = Number(b.totalAmount);
      const paid = Number(b.amountPaid);
      const balance = Math.max(0, total - paid);

      const depDate = b.departureDate?.startDate
        ? new Date(b.departureDate.startDate).toLocaleDateString("fr-FR")
        : "À définir";

      let statusLabel = "En Attente Paiement";
      if (b.status === "PENDING_VERIFICATION") statusLabel = "En attente vérification";
      else if (b.status === "DEPOSIT_PAID" || b.status === "DEPOSIT_CONFIRMED") statusLabel = "Acompte Validé";
      else if (b.status === "FULLY_PAID") statusLabel = "Soldé 100%";
      else if (b.status === "CANCELLED_BY_CLIENT") statusLabel = "Annulée (Client)";
      else if (b.status === "CANCELLED_BY_ADMIN" || b.status === "CANCELLED") statusLabel = "Annulée (Agence)";

      return {
        id: b.id,
        reference: b.reference,
        clientName: b.user?.fullName || b.user?.name || "Client",
        clientEmail: b.user?.email || "",
        clientPhone: b.user?.phone || "—",
        tripTitle: b.trip?.titleFr || "Circuit",
        departureDate: depDate,
        passengersCount: b.travelers.length || 1,
        totalAmount: total,
        amountPaid: paid,
        balanceDue: balance,
        status: statusLabel,
        paymentStatus: b.paymentStatus === "PAYE_INTEGRALEMENT" ? "Soldé" : "Acompte",
        createdAt: new Date(b.createdAt).toLocaleDateString("fr-FR"),
      };
    });

    const buffer = generateBookingsListExcel(exportRows);
    const base64 = buffer.toString("base64");
    const dateStr = new Date().toISOString().split("T")[0];

    return {
      success: true,
      base64,
      filename: `reservations_rahalat_bladna_${dateStr}.xlsx`,
    };
  } catch (error: any) {
    console.error("exportBookingsExcelAction error:", error);
    return { success: false, error: error.message || "Erreur lors de l'exportation." };
  }
}

/**
 * Admin Action : Met à jour les détails d'un dossier de réservation (statuts, montants, notes)
 */
export async function updateBookingAdminAction(
  bookingId: string,
  data: {
    status?: string | BookingStatus;
    financialStatus?: string;
    paymentStatus?: string | PaymentStatus;
    totalAmount?: number;
    depositAmount?: number;
    depositPaid?: number;
    amountPaid?: number;
    notes?: string;
  }
) {
  return updateBookingActionImpl(bookingId, data);
}

export async function updateBookingAction(
  bookingId: string,
  data: {
    status?: string | BookingStatus;
    financialStatus?: string;
    paymentStatus?: string | PaymentStatus;
    totalAmount?: number;
    depositAmount?: number;
    depositPaid?: number;
    amountPaid?: number;
    notes?: string;
  }
) {
  return updateBookingActionImpl(bookingId, data);
}

/**
 * Admin Action : Supprime définitivement un dossier de réservation et libère les places
 */
export async function deleteBookingAdminAction(bookingId: string) {
  await requireAdminSession("DELETE_BOOKING_ADMIN");

  try {
    if (!bookingId) {
      return { success: false, error: "Identifiant de réservation manquant." };
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        departureDate: true,
        travelers: true,
      },
    });

    if (!booking) {
      return { success: false, error: "Dossier de réservation introuvable." };
    }

    // Si la réservation était active et liée à une date de départ, libérer les sièges
    if (booking.status !== BookingStatus.CANCELLED && booking.departureDateId && booking.departureDate) {
      const seatsToFree = booking.travelers.length || 1;
      await prisma.departureDate.update({
        where: { id: booking.departureDateId },
        data: {
          occupiedSeats: {
            decrement: Math.min(booking.departureDate.occupiedSeats, seatsToFree),
          },
        },
      });
    }

    // Suppression en cascade (Travelers, Payments, Quote, Invoice sont configurés avec onDelete: Cascade)
    await prisma.booking.delete({
      where: { id: bookingId },
    });

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/clients");
    revalidatePath("/mon-compte/reservations");
    revalidatePath("/admin");

    return {
      success: true,
      message: `Dossier ${booking.reference} supprimé définitivement.`,
    };
  } catch (error: any) {
    console.error("[deleteBookingAdminAction] Error:", error);
    return { success: false, error: error.message || "Erreur lors de la suppression de la réservation." };
  }
}


