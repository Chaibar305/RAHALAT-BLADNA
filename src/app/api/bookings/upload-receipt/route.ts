import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour soumettre un reçu." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { bookingId, receiptUrl, notes, bankName = "CIH Bank" } = body;

    if (!bookingId || !receiptUrl) {
      return NextResponse.json(
        { error: "L'identifiant de la réservation et l'URL du reçu sont obligatoires." },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation introuvable." },
        { status: 404 }
      );
    }

    if (booking.user.email !== session.user.email) {
      return NextResponse.json(
        { error: "Action non autorisée sur ce dossier." },
        { status: 403 }
      );
    }

    const total = Number(booking.totalAmount);
    const paid = Number(booking.amountPaid);
    const remaining = total - paid;
    const paymentAmount = remaining > 0 ? remaining : Number(booking.depositAmount);

    // Enregistrement du paiement en attente de vérification par la comptabilité
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: paymentAmount,
        type: paid > 0 ? "SOLDE" : "ACOMPTE",
        method: "VIREMENT",
        status: "PENDING",
        receiptUrl: receiptUrl,
        proofUrl: receiptUrl,
      },
    });

    // Mise à jour de la réservation en statut PENDING_VERIFICATION
    const updatedNotes = notes
      ? `${booking.notes ? booking.notes + "\n" : ""}[Reçu virement ${bankName}: ${receiptUrl}] ${notes}`
      : booking.notes;

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "PENDING_VERIFICATION",
        notes: updatedNotes,
      },
    });

    revalidatePath("/mon-compte/reservations");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/finances");

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      receiptUrl,
    });
  } catch (error: any) {
    console.error("API upload-receipt error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne lors de l'enregistrement du reçu." },
      { status: 500 }
    );
  }
}
