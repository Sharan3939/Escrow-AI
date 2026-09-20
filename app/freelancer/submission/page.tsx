"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageShell } from "@/src/components/layout/PageShell";
import { apiClient } from "@/src/services/api";
import { submitMilestoneWork } from "@/src/services/milestoneService";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { ProtectedRoute } from "@/src/components/layout/ProtectedRoute";
import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Send,
  Loader2,
} from "lucide-react";

function SubmissionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("projectId") || "";
  const initialMilestoneId = searchParams.get("milestoneId") || "";

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(initialMilestoneId);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        const res: any = await apiClient.get("/projects");
        const list = res.data || res || [];
        setProjects(Array.isArray(list) ? list : []);
        if (!selectedProjectId && list.length > 0) {
          setSelectedProjectId(list[0].id);
        }
      } catch (err) {
        console.warn("Could not load projects for submission selector:", err);
      }
    }
    loadProjects();
  }, [selectedProjectId]);

  useEffect(() => {
    async function loadProjectDetails() {
      if (!selectedProjectId) {
        setSelectedProject(null);
        return;
      }
      try {
        const res: any = await apiClient.get(`/projects/${selectedProjectId}`);
        const p = res.data || res;
        setSelectedProject(p);

        // Auto-select milestone if not provided in URL
        if (p?.milestones && p.milestones.length > 0) {
          if (!selectedMilestoneId || !p.milestones.find((m: any) => m.id === selectedMilestoneId)) {
            // Pick first non-released or in-progress milestone
            const activeM = p.milestones.find((m: any) => m.status !== "RELEASED") || p.milestones[0];
            setSelectedMilestoneId(activeM.id);
          }
        }
      } catch (err) {
        console.warn("Could not load selected project details:", err);
      }
    }
    loadProjectDetails();
  }, [selectedProjectId]);

  const milestones: any[] = selectedProject?.milestones || [];
  const selectedMilestone = milestones.find((m) => m.id === selectedMilestoneId) || null;

  const latestSubmission = selectedProject?.submissions?.[0] || null;
  const isRevisionRequested =
    selectedMilestone?.status === "REVISION_REQUESTED" ||
    latestSubmission?.clientReviewStatus === "REVISION_REQUESTED" ||
    latestSubmission?.aiVerificationStatus === "NEEDS_REVISION";

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
      if (selectedMilestoneId) {
        // Milestone-specific submission
        await submitMilestoneWork(selectedMilestoneId, {
          description,
          githubUrl: githubUrl || undefined,
          fileUrl: fileUrl || undefined,
        });
      } else {
        // Legacy project-level fallback
        await apiClient.post("/submissions", {
          projectId: selectedProjectId,
          description,
          githubUrl: githubUrl || undefined,
          fileUrl: fileUrl || undefined,
        });
      }

      alert(
        "Deliverable submitted successfully! Gemini AI verification is analyzing requirements against deliverables."
      );
      router.push(`/projects/${selectedProjectId}`);
    } catch (err: any) {
      console.error("Submission error:", err);
      const msg = err.response?.data?.error || err.message || "Failed to submit milestone work.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Upload Milestone Deliverable"
      subtitle="Submit repository links, milestone notes, and trigger Cardano Escrow AI dual verification."
      action={
        selectedProjectId ? (
          <Link
            href={`/projects/${selectedProjectId}`}
            className="flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Smart Contract View</span>
          </Link>
        ) : undefined
      }
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <Card className="space-y-4 border-cyan-500/20 bg-slate-900/90">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span>Milestone Dual Approval Checklist</span>
            </h2>
            <ul className="space-y-3 text-xs leading-6 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span><strong>Milestone Scope:</strong> Explain how this milestone&apos;s specific goals and requirements were fulfilled.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span><strong>Verifiable Code:</strong> Provide a public GitHub PR, branch, or repository URL.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span><strong>Gemini AI Verification:</strong> Structured analysis compares code against project + milestone specs.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span><strong>Client Release:</strong> Client reviews Gemini report and executes Lace on-chain transaction for this milestone.</span>
              </li>
            </ul>
          </Card>

          {/* Selected Milestone Information */}
          {selectedMilestone && (
            <Card className="space-y-3 bg-slate-950/70 border border-white/5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-slate-400 flex items-center gap-1.5 font-semibold text-slate-200">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Target Milestone #{selectedMilestone.order}
                </span>
                <span className="font-bold text-emerald-400 font-mono">
                  {selectedMilestone.amount} ADA
                </span>
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{selectedMilestone.title}</p>
                <p className="text-slate-400 mt-1 leading-relaxed">{selectedMilestone.description}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                <span className="text-slate-400">Current Status:</span>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20">
                  {selectedMilestone.status}
                </span>
              </div>
              {selectedMilestone.deadline && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Target Deadline:</span>
                  <span className="text-slate-200">
                    {new Date(selectedMilestone.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
            </Card>
          )}
        </div>

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

          {/* Milestone Selector if multiple exist */}
          {milestones.length > 0 && (
            <label className="space-y-2 text-sm text-slate-300 block">
              <span className="flex items-center gap-1.5 font-medium text-cyan-300">
                <Layers className="w-4 h-4" /> Select Milestone to Submit
              </span>
              <select
                value={selectedMilestoneId}
                onChange={(e) => setSelectedMilestoneId(e.target.value)}
                className="w-full rounded-2xl border border-cyan-500/30 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0 font-medium"
              >
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    Milestone {m.order}: {m.title} ({m.amount} ADA) — [{m.status}]
                  </option>
                ))}
              </select>
            </label>
          )}

          {isRevisionRequested && (
            <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Resubmitting this milestone will trigger fresh Gemini AI evaluation and notify the client.</span>
            </div>
          )}

          <label className="space-y-2 text-sm text-slate-300 block">
            <span>Milestone Deliverable Summary</span>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0 text-sm"
              placeholder="Explain how this milestone was implemented, testing done, and architecture (minimum 10 characters)."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300 block">
            <span>GitHub Repository or PR URL</span>
            <input
              type="url"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0 font-mono text-xs"
              placeholder="https://github.com/..."
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300 block">
            <span>Live Demo / Artifact URL (Optional)</span>
            <input
              type="url"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0 font-mono text-xs"
              placeholder="https://..."
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
            />
          </label>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSubmit}
              disabled={loading || !selectedProjectId}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Deliverables...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    {isRevisionRequested
                      ? "Resubmit Milestone for AI Review"
                      : "Submit Milestone for AI Review"}
                  </span>
                </>
              )}
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
