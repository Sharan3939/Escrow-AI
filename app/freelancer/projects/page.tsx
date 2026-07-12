import { PageShell } from "@/src/components/layout/PageShell";
import { EscrowCard } from "@/src/components/ui/EscrowCard";
import { activeEscrows } from "@/src/constants/mockData";

export default function FreelancerProjectsPage() {
  return (
    <PageShell
      title="Assigned projects"
      subtitle="Review upcoming work, update milestones, and stay aligned with your client."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {activeEscrows.map((item) => (
          <EscrowCard key={item.id} item={item} />
        ))}
      </div>
    </PageShell>
  );
}
