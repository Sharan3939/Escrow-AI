"use client";

import { PageShell } from "@/src/components/layout/PageShell";
import { ProjectCard } from "@/src/components/ui/ProjectCard";
import { useProjects } from "@/src/hooks/useProjects";
import { ProtectedRoute } from "@/src/components/layout/ProtectedRoute";

export default function ClientProjectsPage() {
  const { projects, loading, error } = useProjects();

  if (loading) return <div className="p-8 text-white">Loading projects...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <ProtectedRoute>
    <PageShell
      title="Client project workspace"
      subtitle="Manage active briefs, review freelancers, and keep every milestone on track."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {projects.length > 0 ? projects.map((project: any) => (
          <ProjectCard key={project.id} item={project} />
        )) : <div className="text-slate-400">No projects found.</div>}
      </div>
    </PageShell>
    </ProtectedRoute>
  );
}
