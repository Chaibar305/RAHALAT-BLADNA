"use server";

import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Server Action pour tracker l'événement ViewContent via Meta Conversions API (CAPI)
 */
export async function trackViewContentCapiAction(params: {
  eventId: string;
  tripId: string;
  tripTitle: string;
  category?: string;
  price?: number;
  currency?: string;
  pageUrl?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    const userName = session?.user?.name;

    await sendMetaCapiEvent({
      eventName: "ViewContent",
      eventId: params.eventId,
      eventSourceUrl: params.pageUrl,
      userData: {
        email: userEmail,
        fullName: userName,
      },
      customData: {
        content_name: params.tripTitle,
        content_category: params.category || "Circuit & Aventure",
        content_ids: [params.tripId],
        content_type: "product",
        value: params.price || 0,
        currency: params.currency || "MAD",
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("❌ [trackViewContentCapiAction] Erreur :", error);
    return { success: false, error: error?.message };
  }
}
