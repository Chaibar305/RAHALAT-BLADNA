"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { captureAndStoreAttribution } from "@/lib/attribution";

function AttributionCaptureInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    captureAndStoreAttribution();
  }, [searchParams]);

  return null;
}

export function AttributionTracker() {
  return (
    <Suspense fallback={null}>
      <AttributionCaptureInner />
    </Suspense>
  );
}

export default AttributionTracker;
