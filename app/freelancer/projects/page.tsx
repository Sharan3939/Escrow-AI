"use client";

import { PageShell } from "@/src/components/layout/PageShell";
import { EscrowCard } from "@/src/components/ui/EscrowCard";
import { useProjects } from "@/src/hooks/useProjects";
import { ProtectedRoute } from "@/src/components/layout/ProtectedRoute";

export default function FreelancerProjectsPage() {
  const { projects, loading, error } = useProjects();
  // For freelancer, we map project to active escrow format
  const escrows = projects.filter((p: any) => p.escrow).map((p: any) => ({
    ...p.escrow,
    projectTitle: p.title,
    role: "Development",
    client: "Client",
    deadline: "10/12/2026",
    amount: p.budget,
  }));

  if (loading) return <div className="p-8 text-white">Loading projects...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <ProtectedRoute>
      <PageShell
        title="Freelancer project board"
        subtitle="Track your active assignments, submit milestones, and monitor escrow releases."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {escrows.length > 0 ? escrows.map((item: any) => (
            <EscrowCard key={item.id} item={item} />
          )) : <div className="text-slate-400">No active projects found.</div>}
        </div>
      </PageShell>
    </ProtectedRoute>
  );
}
