import React from "react";
import { 
  getAdminJobApplicationsAction, 
  getAdminJobPostingsAction 
} from "@/actions/recruitment.actions";
import { AdminApplicationsManager } from "@/components/admin/recruitment/AdminApplicationsManager";

export const dynamic = "force-dynamic";

export default async function AdminJobApplicationsPage({
  searchParams,
}: {
  searchParams: { jobPostingId?: string; status?: string };
}) {
  const [appsRes, jobsRes] = await Promise.all([
    getAdminJobApplicationsAction({
      jobPostingId: searchParams.jobPostingId,
      status: searchParams.status,
    }),
    getAdminJobPostingsAction(),
  ]);

  const jobPostingsList = (jobsRes.jobs || []).map((j: any) => ({
    id: j.id,
    title: j.title,
  }));

  return (
    <div className="space-y-6">
      <AdminApplicationsManager
        initialApplications={appsRes.applications || []}
        initialJobPostings={jobPostingsList}
        initialStatusCounts={appsRes.statusCounts || {}}
      />
    </div>
  );
}
