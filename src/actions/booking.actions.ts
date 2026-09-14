"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CreateBookingSchema, CreateBookingInput } from "@/lib/validations/booking.schema";
import { BookingStatus, PaymentStatus, QuoteStatus, InvoiceStatus, PaymentType, PaymentMethod } from "@prisma/client";

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

    // 4. Transaction Prisma Atomique ($transaction)
    const result = await prisma.$transaction(async (tx) => {
      // Insertion de la réservation
      const booking = await tx.booking.create({
        data: {
          reference: bookingRef,
          userId,
          tripId: trip.id,
          departureDateId: selectedDeparture?.id || null,
          status: data.receiptUrl
            ? BookingStatus.PENDING_VERIFICATION
            : data.paymentOption === "FULL"
            ? BookingStatus.FULLY_PAID
            : BookingStatus.DEPOSIT_CONFIRMED,
          totalAmount,
          depositAmount,
          amountPaid,
          paymentStatus:
            data.paymentOption === "FULL"
              ? PaymentStatus.PAYE_INTEGRALEMENT
              : PaymentStatus.ACOMPTE_VERSE,
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
                status: "VALIDE",
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
              depositPaid: amountPaid,
              balanceDue: balanceDue > 0 ? balanceDue : 0,
              status: balanceDue === 0 ? InvoiceStatus.PAYEE : InvoiceStatus.PARTIELLEMENT_PAYEE,
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
        status: "EN_ATTENTE",
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
  await requireAdminSession("VALIDATE_BOOKING_DEPOSIT");

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

    const newStatus = isFull ? BookingStatus.FULLY_PAID : BookingStatus.DEPOSIT_CONFIRMED;
    const newPaymentStatus = isFull ? PaymentStatus.PAYE_INTEGRALEMENT : PaymentStatus.ACOMPTE_VERSE;

    // Transaction pour tout valider de manière atomique
    await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour la réservation
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: newStatus,
          paymentStatus: newPaymentStatus,
          amountPaid: depositToCredit,
          notes: notes
            ? `${booking.notes ? booking.notes + "\n" : ""}[Validation Acompte Admin ${new Date().toLocaleDateString("fr-FR")}]: ${notes}`
            : booking.notes,
        },
      });

      // 2. Valider le dernier paiement en attente s'il existe
      const pendingPayment = booking.payments.find((p) => p.status === "EN_ATTENTE");
      if (pendingPayment) {
        await tx.payment.update({
          where: { id: pendingPayment.id },
          data: {
            status: "VALIDE",
            amount: depositToCredit,
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
  await requireAdminSession("VALIDATE_BOOKING_FULL_PAYMENT");

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
          paymentStatus: PaymentStatus.PAYE_INTEGRALEMENT,
          amountPaid: total,
          notes: notes
            ? `${booking.notes ? booking.notes + "\n" : ""}[Validation Solde Total ${new Date().toLocaleDateString("fr-FR")}]: ${notes}`
            : booking.notes,
        },
      });

      // Valider tous les paiements
      await tx.payment.updateMany({
        where: { bookingId, status: "EN_ATTENTE" },
        data: { status: "VALIDE" },
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
  await requireAdminSession("REJECT_BOOKING_RECEIPT");

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return { success: false, error: "Dossier introuvable." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.PENDING_PAYMENT,
          notes: `${booking.notes ? booking.notes + "\n" : ""}[REJET REÇU ${new Date().toLocaleDateString("fr-FR")}]: ${reason}`,
        },
      });

      await tx.payment.updateMany({
        where: { bookingId, status: "EN_ATTENTE" },
        data: { status: "ECHOUE" },
      });
    });

    revalidatePath("/admin/bookings");
    revalidatePath("/mon-compte/reservations");

    return { success: true, message: "Preuve de paiement rejetée avec motif." };
  } catch (error: any) {
    console.error("rejectBookingReceiptAction error:", error);
    return { success: false, error: error.message || "Erreur lors du rejet du reçu." };
  }
}

/**
 * Admin Action : Annule une réservation et libère les places
 */
export async function cancelBookingAdminAction(bookingId: string, reason?: string) {
  await requireAdminSession("CANCEL_BOOKING");

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { invoice: true },
    });

    if (!booking) {
      return { success: false, error: "Dossier introuvable." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          notes: reason
            ? `${booking.notes ? booking.notes + "\n" : ""}[ANNULATION ${new Date().toLocaleDateString("fr-FR")}]: ${reason}`
            : booking.notes,
        },
      });

      if (booking.invoice) {
        await tx.invoice.update({
          where: { id: booking.invoice.id },
          data: { status: InvoiceStatus.ANNULEE },
        });
      }
    });

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/clients");
    revalidatePath("/mon-compte/reservations");

    return { success: true, message: "Réservation annulée avec succès." };
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
      if (b.status === "PENDING_VERIFICATION") statusLabel = "À Vérifier (Reçu R2)";
      else if (b.status === "DEPOSIT_CONFIRMED") statusLabel = "Acompte Validé";
      else if (b.status === "FULLY_PAID") statusLabel = "Soldé 100%";
      else if (b.status === "CANCELLED") statusLabel = "Annulée";

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
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    totalAmount: number;
    depositAmount: number;
    amountPaid: number;
    notes?: string;
  }
) {
  await requireAdminSession("UPDATE_BOOKING_ADMIN");

  try {
    if (!bookingId) {
      return { success: false, error: "Identifiant de réservation manquant." };
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { invoice: true },
    });

    if (!booking) {
      return { success: false, error: "Dossier de réservation introuvable." };
    }

    const total = Number(data.totalAmount || 0);
    const deposit = Number(data.depositAmount || 0);
    const paid = Number(data.amountPaid || 0);
    const balance = Math.max(0, total - paid);

    await prisma.$transaction(async (tx) => {
      // 1. Mise à jour de la réservation
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: data.status,
          paymentStatus: data.paymentStatus,
          totalAmount: total,
          depositAmount: deposit,
          amountPaid: paid,
          notes: data.notes?.trim() || null,
        },
      });

      // 2. Synchronisation de la facture si existante
      if (booking.invoice) {
        const subtotalHt = Math.round((total / 1.2) * 100) / 100;
        const taxAmount = Math.round((total - subtotalHt) * 100) / 100;

        let invStatus: InvoiceStatus = InvoiceStatus.EMISE;
        if (data.status === BookingStatus.CANCELLED) {
          invStatus = InvoiceStatus.ANNULEE;
        } else if (paid >= total && total > 0) {
          invStatus = InvoiceStatus.PAYEE;
        } else if (paid > 0) {
          invStatus = InvoiceStatus.PARTIELLEMENT_PAYEE;
        }

        await tx.invoice.update({
          where: { id: booking.invoice.id },
          data: {
            totalTTC: total,
            subtotalHT: subtotalHt,
            taxAmount: taxAmount,
            depositPaid: paid,
            balanceDue: balance,
            status: invStatus,
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
      message: `Dossier ${booking.reference} mis à jour avec succès.`,
    };
  } catch (error: any) {
    console.error("[updateBookingAdminAction] Error:", error);
    return { success: false, error: error.message || "Erreur lors de la modification de la réservation." };
  }
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


