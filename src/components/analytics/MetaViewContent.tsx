"use client";

import { useEffect, useRef } from "react";
import { trackClientMetaEvent, generateMetaEventId } from "@/lib/meta-client";
import { trackViewContentCapiAction } from "@/actions/meta-analytics.actions";

interface MetaViewContentProps {
  id: string;
  title: string;
  category?: string;
  price?: number;
  currency?: string;
}

export function MetaViewContent({
  id,
  title,
  category = "Circuit & Aventure",
  price = 1250,
  currency = "MAD",
}: MetaViewContentProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    const eventId = generateMetaEventId("vc");

    // 1. Déclenchement Meta Pixel côté client avec eventId pour déduplication
    trackClientMetaEvent(
      "ViewContent",
      {
        content_name: title,
        content_category: category,
        content_ids: [id],
        content_type: "product",
        value: price,
        currency: currency,
      },
      eventId
    );

    // 2. Déclenchement redondant CAPI côté serveur avec le même eventId
    trackViewContentCapiAction({
      eventId,
      tripId: id,
      tripTitle: title,
      category,
      price,
      currency,
      pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
    }).catch((err) => {
      console.warn("⚠️ [Meta CAPI] Erreur silencieuse sur ViewContent:", err);
    });
  }, [id, title, category, price, currency]);

  return null;
}

export default MetaViewContent;
