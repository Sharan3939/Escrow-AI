import { PageShell } from "@/src/components/layout/PageShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";

export default function CreateProjectPage() {
  return (
    <PageShell
      title="Create a new escrow"
      subtitle="Define the scope, set the ADA amount, and launch a milestone-based freelance contract."
      action={<Button variant="secondary">Preview contract</Button>}
    >
      <Card className="mx-auto max-w-3xl space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span>Project title</span>
            <input className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0" placeholder="Web3 analytics dashboard" />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>ADA amount</span>
            <input className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0" placeholder="2400" />
          </label>
        </div>
        <label className="space-y-2 text-sm text-slate-300">
          <span>Description</span>
          <textarea className="min-h-32 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0" placeholder="Describe the expected deliverables, acceptance criteria, and timeline." />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span>Deadline</span>
            <input type="date" className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0" />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Category</span>
            <select className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0">
              <option>Design</option>
              <option>Development</option>
              <option>Research</option>
            </select>
          </label>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary">Save draft</Button>
          <Button>Launch escrow</Button>
        </div>
      </Card>
    </PageShell>
  );
}
