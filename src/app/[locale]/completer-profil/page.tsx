import React from "react";
import { CompleteProfileForm } from "@/components/auth/CompleteProfileForm";

export default function CompleteProfilePage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-900/40">
      <CompleteProfileForm />
    </div>
  );
}
