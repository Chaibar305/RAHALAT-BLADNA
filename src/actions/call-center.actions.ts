'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { CallStatus, BookingStatus, PaymentStatus } from '@prisma/client';
import { sendMetaCrmLeadEvent } from '@/lib/meta-capi';

export interface UpdateCallData {
  callStatus?: CallStatus | string;
  callNotes?: string;
  nextCallbackDate?: string | null;
  pickupCity?: string;
  pickupPoint?: string;
  roomPreference?: string;
  confirmedByMemberId?: string | null;
  incrementAttempts?: boolean;
}

/**
 * Met à jour le suivi d'appel complet d'une réservation (Call Center CRM)
 */
export async function updateCallStatusAction(
  bookingId: string,
  data: UpdateCallData
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Non autorisé' };
  }

  try {
    const existing = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { travelers: true },
    });

    if (!existing) {
      return { success: false, error: 'Réservation introuvable' };
    }

    const updatePayload: any = {
      contactedAt: new Date(),
      lastCallDate: new Date(),
    };

    if (data.incrementAttempts) {
      updatePayload.callAttemptsCount = (existing.callAttemptsCount || 0) + 1;
    }

    if (data.callStatus) {
      updatePayload.callStatus = data.callStatus as CallStatus;

      // Synchronisations automatiques selon le statut d'appel
      if (data.callStatus === CallStatus.CONFIRMED_PHONE) {
        if (existing.status === BookingStatus.PENDING_VERIFICATION) {
          updatePayload.status = BookingStatus.PENDING_VERIFICATION;
        }
      } else if (data.callStatus === CallStatus.DEPOSIT_RECEIVED) {
        updatePayload.status = BookingStatus.DEPOSIT_PAID;
        updatePayload.paymentStatus = PaymentStatus.VERIFIED;
        if (Number(existing.amountPaid) === 0) {
          const depAmt = Number(existing.depositAmount) > 0 ? Number(existing.depositAmount) : 500;
          updatePayload.amountPaid = depAmt;
          updatePayload.depositPaid = depAmt;
        }
      } else if (data.callStatus === CallStatus.CANCELLED_REFUSED || data.callStatus === CallStatus.WRONG_NUMBER) {
        updatePayload.status = BookingStatus.CANCELLED_BY_ADMIN;
      }
    }

    if (data.callNotes !== undefined) {
      updatePayload.callNotes = data.callNotes?.trim() || null;
    }

    if (data.nextCallbackDate !== undefined) {
      updatePayload.nextCallbackDate = data.nextCallbackDate ? new Date(data.nextCallbackDate) : null;
    }

    if (data.pickupCity !== undefined) {
      updatePayload.pickupCity = data.pickupCity?.trim() || null;
    }

    if (data.pickupPoint !== undefined) {
      updatePayload.pickupPoint = data.pickupPoint?.trim() || null;
    }

    if (data.roomPreference !== undefined) {
      updatePayload.roomPreference = data.roomPreference?.trim() || null;
    }

    if (data.confirmedByMemberId !== undefined) {
      updatePayload.confirmedByMemberId = data.confirmedByMemberId || null;
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: updatePayload,
      include: {
        confirmedByMember: true,
        user: true,
        trip: true,
      },
    });

    // Mettre à jour les voyageurs si ville de ramassage ou préférence chambre modifiée
    if (data.pickupCity || data.roomPreference) {
      await prisma.traveler.updateMany({
        where: { bookingId },
        data: {
          ...(data.pickupCity ? { pickupCity: data.pickupCity } : {}),
          ...(data.roomPreference ? { roomType: data.roomPreference } : {}),
        },
      });
    }

    // Déclenchement Meta Conversions API (CRM Conversion Leads) lors d'un changement d'étape CRM
    if (data.callStatus === CallStatus.CONFIRMED_PHONE || data.callStatus === CallStatus.DEPOSIT_RECEIVED) {
      const isDeposit = data.callStatus === CallStatus.DEPOSIT_RECEIVED;
      const customerEmail = updated.user?.email || null;
      const customerPhone = existing.travelers?.[0]?.phone || updated.user?.phone || null;
      const customerName = existing.travelers?.[0]?.fullName || updated.user?.name || null;
      const eventAmount = isDeposit
        ? Number(updated.depositPaid) || Number(updated.totalAmount) || 0
        : Number(updated.totalAmount) || 0;

      sendMetaCrmLeadEvent({
        eventName: isDeposit ? "Purchase" : "Lead",
        eventId: `crm_${isDeposit ? "deposit" : "confirmed"}_${updated.id}_${Date.now()}`,
        email: customerEmail,
        phone: customerPhone,
        fullName: customerName,
        city: updated.pickupCity || undefined,
        leadEventSource: "Rahalat Bladna CRM",
        customData: {
          event_source: "crm",
          lead_event_source: "Rahalat Bladna CRM",
          booking_reference: updated.reference,
          trip_id: updated.tripId,
          trip_title: updated.trip?.titleFr,
          currency: "MAD",
          value: eventAmount,
          crm_stage: isDeposit ? "Deposit Received" : "Phone Confirmed",
        },
      }).catch((err) => {
        console.warn("⚠️ [updateCallStatusAction] Meta CRM Lead non-bloquant :", err);
      });
    }

    // Revalidation des routes
    revalidatePath('/[locale]/admin', 'layout');
    revalidatePath('/admin/bookings');
    revalidatePath('/admin');
    revalidatePath('/admin/dashboard');

    return {
      success: true,
      message: 'Fiche d\'appel et statut mis à jour avec succès.',
      booking: {
        id: updated.id,
        callStatus: updated.callStatus,
        callAttemptsCount: updated.callAttemptsCount,
        lastCallDate: updated.lastCallDate,
        nextCallbackDate: updated.nextCallbackDate,
        callNotes: updated.callNotes,
        confirmedByMemberId: updated.confirmedByMemberId,
        confirmedByMemberName: updated.confirmedByMember?.fullName || null,
        pickupCity: updated.pickupCity,
        pickupPoint: updated.pickupPoint,
        roomPreference: updated.roomPreference,
        status: updated.status,
      },
    };
  } catch (error: any) {
    console.error('Erreur updateCallStatusAction :', error);
    return { success: false, error: error.message || 'Erreur lors de la mise à jour de l\'appel.' };
  }
}

/**
 * Enregistrement rapide d'une tentative d'appel en 1-clic (ex: Ne répond pas 1, Ne répond pas 2)
 */
export async function quickLogCallAttemptAction(
  bookingId: string,
  callStatus: CallStatus | string,
  note?: string
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Non autorisé' };
  }

  try {
    const existing = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { callAttemptsCount: true, callNotes: true },
    });

    if (!existing) {
      return { success: false, error: 'Réservation introuvable' };
    }

    const currentCount = existing.callAttemptsCount || 0;
    const now = new Date();
    const timestamp = now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    let updatedNotes = existing.callNotes || '';
    if (note) {
      updatedNotes = updatedNotes ? `${updatedNotes}\n[${timestamp}] ${note}` : `[${timestamp}] ${note}`;
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        callStatus: callStatus as CallStatus,
        callAttemptsCount: currentCount + 1,
        lastCallDate: now,
        contactedAt: now,
        callNotes: updatedNotes || undefined,
        ...(callStatus === CallStatus.CANCELLED_REFUSED || callStatus === CallStatus.WRONG_NUMBER
          ? { status: BookingStatus.CANCELLED_BY_ADMIN }
          : {}),
      },
    });

    revalidatePath('/[locale]/admin', 'layout');
    revalidatePath('/admin/bookings');

    return { success: true, message: 'Tentative d\'appel enregistrée.' };
  } catch (error: any) {
    console.error('Erreur quickLogCallAttemptAction :', error);
    return { success: false, error: error.message || 'Erreur d\'enregistrement.' };
  }
}

/**
 * Assigne un membre de l'équipe / agent de confirmation au dossier
 */
export async function assignBookingAgentAction(
  bookingId: string,
  teamMemberId: string | null
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Non autorisé' };
  }

  try {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        confirmedByMemberId: teamMemberId || null,
      },
    });

    revalidatePath('/[locale]/admin', 'layout');
    revalidatePath('/admin/bookings');

    return { success: true, message: 'Agent assigné avec succès.' };
  } catch (error: any) {
    console.error('Erreur assignBookingAgentAction :', error);
    return { success: false, error: error.message || 'Erreur lors de l\'assignation de l\'agent.' };
  }
}

/**
 * Récupère les membres actifs de l'équipe pour le Call Center
 */
export async function getCallCenterTeamMembersAction() {
  try {
    const members = await prisma.teamMember.findMany({
      where: { isActive: true },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
      },
      orderBy: { fullName: 'asc' },
    });

    return { success: true, members };
  } catch (error: any) {
    console.error('Erreur getCallCenterTeamMembersAction :', error);
    return { success: false, members: [] };
  }
}
