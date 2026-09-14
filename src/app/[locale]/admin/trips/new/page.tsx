import React from "react";
import { TripForm } from "@/components/admin/trips/TripForm";

export default function NewTripPage() {
  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      <TripForm isEditing={false} />
    </div>
  );
}

