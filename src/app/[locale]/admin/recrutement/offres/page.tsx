import React from "react";
import { getAdminJobPostingsAction } from "@/actions/recruitment.actions";
import { AdminJobPostingsManager } from "@/components/admin/recruitment/AdminJobPostingsManager";

export const dynamic = "force-dynamic";

export default async function AdminJobPostingsPage() {
  const { jobs } = await getAdminJobPostingsAction();

  return (
    <div className="space-y-6">
      <AdminJobPostingsManager initialJobs={jobs || []} />
    </div>
  );
}
