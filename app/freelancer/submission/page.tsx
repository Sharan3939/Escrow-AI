import { PageShell } from "@/src/components/layout/PageShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { FileUploader } from "@/src/components/ui/FileUploader";

export default function SubmissionPage() {
  return (
    <PageShell
      title="Upload your work"
      subtitle="Submit files, add context, and let AI verification review the delivery before settlement."
      action={<Button variant="secondary">Save draft</Button>}
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Submission checklist</h2>
          <ul className="space-y-3 text-sm leading-7 text-slate-400">
            <li>• Include a concise summary of the completed milestone.</li>
            <li>• Attach screenshots, build links, and supporting assets.</li>
            <li>• Mention any blockers or follow-up requests.</li>
          </ul>
        </Card>
        <Card className="space-y-5">
          <label className="space-y-2 text-sm text-slate-300">
            <span>Milestone note</span>
            <textarea className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0" placeholder="Explain what was completed and any implementation highlights." />
          </label>
          <FileUploader />
          <div className="flex justify-end">
            <Button>Submit for review</Button>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
