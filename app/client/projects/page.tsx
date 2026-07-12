import { PageShell } from "@/src/components/layout/PageShell";
import { ProjectCard } from "@/src/components/ui/ProjectCard";
import { clientProjects } from "@/src/constants/mockData";

export default function ClientProjectsPage() {
  return (
    <PageShell
      title="Client project workspace"
      subtitle="Manage active briefs, review freelancers, and keep every milestone on track."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {clientProjects.map((project) => (
          <ProjectCard key={project.id} item={project} />
        ))}
      </div>
    </PageShell>
  );
}
