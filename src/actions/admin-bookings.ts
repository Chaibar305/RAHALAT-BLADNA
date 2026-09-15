'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { BookingStatus, PaymentStatus, InvoiceStatus } from '@prisma/client';

export interface UpdateBookingData {
  status?: string;
  financialStatus?: string;
  paymentStatus?: string;
  depositPaid?: number;
  amountPaid?: number;
  totalAmount?: number;
  depositAmount?: number;
  notes?: string;
}

export async function updateBookingAction(
  bookingId: string,
  formData: UpdateBookingData
) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Non autorisé' };

  try {
    const rawPaid = formData.depositPaid ?? formData.amountPaid ?? 0;
    const isUnpaid =
      formData.financialStatus === 'UNPAID' ||
      formData.financialStatus === 'NON_PAYE' ||
      formData.paymentStatus === 'NON_PAYE' ||
      Number(rawPaid) === 0;

    const finalDepositPaid = isUnpaid ? 0 : Number(rawPaid);

    // Déterminer le statut cohérent
    let finalStatus = formData.status || 'PENDING_VERIFICATION';
    if (
      isUnpaid &&
      (finalStatus === 'DEPOSIT_PAID' ||
        finalStatus === 'DEPOSIT_CONFIRMED' ||
        finalStatus === 'FULLY_PAID')
    ) {
      finalStatus = 'PENDING_VERIFICATION';
    } else if (!isUnpaid && formData.financialStatus === 'FULLY_PAID') {
      finalStatus = 'FULLY_PAID';
    } else if (
      !isUnpaid &&
      (formData.financialStatus === 'DEPOSIT_PAID' || formData.financialStatus === 'ACOMPTE_VERSE') &&
      finalStatus === 'PENDING_VERIFICATION'
    ) {
      finalStatus = 'DEPOSIT_PAID';
    }

    const adminName = session.user.name || session.user.email || 'Administrateur';

    await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour la réservation
      const updateData: any = {
        status: finalStatus as BookingStatus,
        depositPaid: finalDepositPaid,
        amountPaid: finalDepositPaid,
        paymentStatus: isUnpaid ? PaymentStatus.REJECTED : PaymentStatus.VERIFIED,
      };

      if (formData.notes !== undefined) {
        updateData.notes = formData.notes?.trim() || null;
      }
      if (formData.totalAmount !== undefined && Number(formData.totalAmount) >= 0) {
        updateData.totalAmount = Number(formData.totalAmount);
      }
      if (formData.depositAmount !== undefined && Number(formData.depositAmount) >= 0) {
        updateData.depositAmount = Number(formData.depositAmount);
      }

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: updateData,
        include: { invoice: true },
      });

      // 2. Synchroniser la table Payment
      if (isUnpaid) {
        // Si non payé : marquer les paiements existants en REJECTED avec montant 0
        await tx.payment.updateMany({
          where: { bookingId: bookingId },
          data: {
            status: PaymentStatus.REJECTED,
            amount: 0,
            verifiedAt: new Date(),
            verifiedBy: adminName,
          },
        });
      } else {
        // Si un acompte ou solde est validé, s'assurer qu'un paiement VERIFIED existe
        const existingPayment = await tx.payment.findFirst({
          where: { bookingId: bookingId },
        });

        if (existingPayment) {
          await tx.payment.update({
            where: { id: existingPayment.id },
            data: {
              status: PaymentStatus.VERIFIED,
              amount: finalDepositPaid,
              verifiedAt: new Date(),
              verifiedBy: adminName,
            },
          });
        } else {
          await tx.payment.create({
            data: {
              bookingId: bookingId,
              amount: finalDepositPaid,
              status: PaymentStatus.VERIFIED,
              verifiedAt: new Date(),
              verifiedBy: adminName,
            },
          });
        }
      }

      // 3. Synchroniser la facture si existante
      if (updatedBooking.invoice) {
        const total = Number(updatedBooking.totalAmount);
        const subtotalHt = Math.round((total / 1.2) * 100) / 100;
        const taxAmount = Math.round((total - subtotalHt) * 100) / 100;
        const balanceDue = Math.max(0, total - finalDepositPaid);

        let invStatus: InvoiceStatus = InvoiceStatus.EMISE;
        if (finalStatus.startsWith('CANCELLED') || finalStatus === 'ANNULEE') {
          invStatus = InvoiceStatus.ANNULEE;
        } else if (finalDepositPaid >= total && total > 0) {
          invStatus = InvoiceStatus.PAYEE;
        } else if (finalDepositPaid > 0) {
          invStatus = InvoiceStatus.PARTIELLEMENT_PAYEE;
        }

        await tx.invoice.update({
          where: { id: updatedBooking.invoice.id },
          data: {
            totalTTC: total,
            subtotalHT: subtotalHt,
            taxAmount: taxAmount,
            depositPaid: finalDepositPaid,
            balanceDue,
            status: invStatus,
          },
        });
      }
    });

    // 4. Revalidation immédiate de tout le portail d'administration
    revalidatePath('/admin');
    revalidatePath('/admin/bookings');
    revalidatePath('/admin/clients');
    revalidatePath('/mon-compte/reservations');

    return { success: true, message: 'Dossier de réservation mis à jour avec succès.' };
  } catch (error: any) {
    console.error('Erreur mise à jour dossier :', error);
    return { success: false, error: error.message || 'Erreur lors de la mise à jour du dossier.' };
  }
}
