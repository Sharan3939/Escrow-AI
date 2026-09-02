"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageShell } from "@/src/components/layout/PageShell";
import { apiClient } from "@/src/services/api";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { ProtectedRoute } from "@/src/components/layout/ProtectedRoute";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function SubmissionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("projectId") || "";

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await apiClient.get<any>("/projects");
        const list = res.data || [];
        setProjects(list);
        if (!selectedProjectId && list.length > 0) {
          setSelectedProjectId(list[0].id);
        }
      } catch (err) {
        console.warn("Could not load projects for submission selector:", err);
      }
    }
    loadProjects();
  }, [selectedProjectId]);

  const handleSubmit = async () => {
    if (!selectedProjectId) {
      alert("Please select a project.");
      return;
    }
    if (!description || description.trim().length < 10) {
      alert("Please enter a deliverable description of at least 10 characters.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/submissions", {
        projectId: selectedProjectId,
        description,
        githubUrl: githubUrl || undefined,
        fileUrl: fileUrl || undefined,
      });
      alert("Milestone submitted successfully for AI verification!");
      router.push(`/projects/${selectedProjectId}`);
    } catch (err: any) {
      console.error("Submission error:", err);
      alert(err.message || "Failed to submit milestone work.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Upload milestone work"
      subtitle="Submit repository links, context, and trigger Cardano escrow AI verification before settlement."
      action={
        selectedProjectId ? (
          <Link
            href={`/projects/${selectedProjectId}`}
            className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Contract View</span>
          </Link>
        ) : undefined
      }
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Submission checklist</h2>
          <ul className="space-y-3 text-sm leading-7 text-slate-400">
            <li>• Include a clear summary of the completed requirements.</li>
            <li>• Attach verified GitHub repository or Pull Request link.</li>
            <li>• Gemini AI will evaluate code quality against escrow specifications.</li>
            <li>• Once approved, client will execute Plutus V3 payment release.</li>
          </ul>
        </Card>

        <Card className="space-y-5">
          <label className="space-y-2 text-sm text-slate-300 block">
            <span>Target Escrow Project</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0"
            >
              {projects.length === 0 && <option value="">No projects available</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.budget} ADA)
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-300 block">
            <span>Milestone Description</span>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0"
              placeholder="Explain the completed features, architectures, and testing results."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300 block">
            <span>GitHub Repository or PR URL</span>
            <input
              type="url"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0"
              placeholder="https://github.com/..."
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300 block">
            <span>Live Demo / Artifact URL (Optional)</span>
            <input
              type="url"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0"
              placeholder="https://preview.app..."
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
            />
          </label>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSubmit} disabled={loading || !selectedProjectId}>
              {loading ? "Submitting..." : "Submit for AI Review"}
            </Button>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

export default function SubmissionPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="p-8 text-white">Loading form...</div>}>
        <SubmissionForm />
      </Suspense>
    </ProtectedRoute>
  );
}
