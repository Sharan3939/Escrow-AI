"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/src/components/layout/PageShell";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { apiClient } from "@/src/services/api";
import { LockFundsButton } from "@/src/components/Escrow/LockFundsButton";
import { ReleasePaymentButton } from "@/src/components/Escrow/ReleasePaymentButton";
import { AIReport } from "@/src/components/AIReport";
import { ProtectedRoute } from "@/src/components/layout/ProtectedRoute";
import { getEscrowScriptAddress } from "@/src/utils/cardano";
import {
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Clock,
  CheckCircle2,
  FileCode,
  Code2,
  Wallet,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Submission Form State
  const [submissionDesc, setSubmissionDesc] = useState("");
  const [submissionGithub, setSubmissionGithub] = useState("");
  const [submissionFile, setSubmissionFile] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // AI Verification State
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>(`/projects/${projectId}`);
      setProject(res.data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load project:", err);
      setError(err.message || "Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const handleCreateSubmission = async () => {
    if (!submissionDesc) {
      alert("Please enter a submission description.");
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post("/submissions", {
        projectId,
        description: submissionDesc,
        githubUrl: submissionGithub || undefined,
        fileUrl: submissionFile || undefined,
      });
      alert("Milestone work submitted successfully!");
      setSubmissionDesc("");
      setSubmissionGithub("");
      setSubmissionFile("");
      await fetchProject();
    } catch (err: any) {
      console.error("Submission failed:", err);
      alert(err.message || "Failed to submit milestone");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunAiAnalysis = async (submissionId: string) => {
    try {
      setAiAnalyzing(true);
      setAiError(null);
      await apiClient.post("/ai/analyze", { submissionId });
      await fetchProject();
    } catch (err: any) {
      console.error("AI Analysis error:", err);
      setAiError(
        err.message ||
          "Gemini verification requires a valid GEMINI_API_KEY in backend/.env."
      );
    } finally {
      setAiAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <PageShell title="Loading Escrow..." subtitle="Fetching smart contract state">
          <div className="flex items-center justify-center p-16 text-cyan-300">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </PageShell>
      </ProtectedRoute>
    );
  }

  if (error || !project) {
    return (
      <ProtectedRoute>
        <PageShell title="Project Not Found" subtitle="Error loading contract">
          <Card className="max-w-xl mx-auto text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
            <p className="text-slate-300">{error || "Contract not found"}</p>
            <Link href="/client/projects" className="inline-block text-cyan-400 hover:underline">
              Back to Projects
            </Link>
          </Card>
        </PageShell>
      </ProtectedRoute>
    );
  }

  const escrow = project.escrow;
  const scriptAddress = getEscrowScriptAddress(0);
  const submissions = project.submissions || [];
  const latestSubmission = submissions[0] || null;

  let aiParsedReport: any = null;
  if (latestSubmission?.aiReport) {
    try {
      aiParsedReport = JSON.parse(latestSubmission.aiReport);
    } catch (_) {}
  }

  const escrowStatus = (escrow?.status || "CREATED").toUpperCase();
  const isLocked = escrowStatus === "LOCKED" || escrowStatus === "RELEASED";
  const isReleased = escrowStatus === "RELEASED";

  return (
    <ProtectedRoute>
      <PageShell
        title={project.title}
        subtitle="Manage Cardano Aiken Escrow, milestone deliveries, and AI verification."
        action={
          <Link
            href="/client/projects"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Projects</span>
          </Link>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left Column: Escrow Lifecycle & Contract Actions */}
          <div className="space-y-6">
            {/* Escrow Status Overview Card */}
            <Card className="space-y-5 border-cyan-500/20 bg-slate-900/80">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold">
                  Aiken Plutus V3 Escrow Contract
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isReleased
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : isLocked
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {escrowStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950/60 border border-white/5">
                <div>
                  <p className="text-xs text-slate-400">Escrow Amount</p>
                  <p className="text-xl font-bold text-white">{project.budget} ADA</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Network</p>
                  <p className="text-sm font-semibold text-cyan-300">Cardano Preview</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Deadline</p>
                  <p className="text-sm font-medium text-slate-300">
                    {new Date(project.deadline).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400">
                <p className="font-semibold text-slate-300">Contract Script Address:</p>
                <p className="font-mono bg-black/40 p-2.5 rounded-lg text-[11px] text-cyan-300 break-all border border-white/5 select-all">
                  {scriptAddress}
                </p>
              </div>

              {escrow?.transactionHash && (
                <div className="space-y-1.5 text-xs text-slate-400">
                  <p className="font-semibold text-slate-300">Lock Transaction Hash:</p>
                  <a
                    href={`https://preview.cardanoscan.io/transaction/${escrow.transactionHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 font-mono text-cyan-400 hover:underline break-all"
                  >
                    <span>{escrow.transactionHash}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              )}

              {/* Action Trigger Buttons */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                {!isLocked && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">
                      Step 1: Lock project ADA into the smart contract before work starts.
                    </p>
                    <LockFundsButton
                      projectId={projectId}
                      escrowId={escrow?.id || projectId}
                      amount={Number(project.budget)}
                      freelancerAddress={project.freelancer?.walletAddress}
                      onSuccess={() => fetchProject()}
                    />
                  </div>
                )}

                {isLocked && !isReleased && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">
                      Step 2: When milestone is reviewed and AI verification is satisfactory, release payment to freelancer.
                    </p>
                    <ReleasePaymentButton
                      projectId={projectId}
                      escrowId={escrow?.id || projectId}
                      amount={Number(project.budget)}
                      freelancerAddress={
                        project.freelancer?.walletAddress ||
                        project.client?.walletAddress ||
                        ""
                      }
                      escrowAddress={scriptAddress}
                      onSuccess={() => fetchProject()}
                    />
                  </div>
                )}

                {isReleased && (
                  <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-semibold">Payment Released & Settled</p>
                      <p className="text-xs text-slate-400">
                        Funds have been deterministically released from the Aiken Plutus V3 contract.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Scope / Description Card */}
            <Card className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Project Scope & Deliverables</h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {project.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-white/5">
                <span>Client: {project.client?.username || "Verified"}</span>
                {project.freelancer && (
                  <span>Freelancer: {project.freelancer.username}</span>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Freelancer Deliverables & AI Verification */}
          <div className="space-y-6">
            {/* Submit Milestone Form */}
            {!isReleased && (
              <Card className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-semibold text-white">Submit Milestone Work</h3>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs text-slate-300">
                    <span>Deliverable Notes & Summary</span>
                    <textarea
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/70 p-3 text-sm text-white placeholder-slate-500 outline-none ring-0"
                      placeholder="Completed frontend smart contract hooks, integrated Mesh SDK, and verified Aiken spend validator."
                      value={submissionDesc}
                      onChange={(e) => setSubmissionDesc(e.target.value)}
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs text-slate-300">
                      <span>GitHub Pull Request / Repo URL</span>
                      <input
                        type="url"
                        className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/70 p-2.5 text-sm text-white placeholder-slate-500 outline-none ring-0"
                        placeholder="https://github.com/..."
                        value={submissionGithub}
                        onChange={(e) => setSubmissionGithub(e.target.value)}
                      />
                    </label>
                    <label className="block text-xs text-slate-300">
                      <span>Demo or Asset URL (Optional)</span>
                      <input
                        type="url"
                        className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/70 p-2.5 text-sm text-white placeholder-slate-500 outline-none ring-0"
                        placeholder="https://..."
                        value={submissionFile}
                        onChange={(e) => setSubmissionFile(e.target.value)}
                      />
                    </label>
                  </div>

                  <Button
                    onClick={handleCreateSubmission}
                    disabled={submitting}
                    className="w-full"
                  >
                    {submitting ? "Uploading Submission..." : "Submit Deliverable"}
                  </Button>
                </div>
              </Card>
            )}

            {/* Submissions & AI Analysis Status */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  <h3 className="text-lg font-semibold text-white">Gemini AI Verification</h3>
                </div>
                {latestSubmission && (
                  <Button
                    variant="secondary"
                    onClick={() => handleRunAiAnalysis(latestSubmission.id)}
                    disabled={aiAnalyzing}
                    className="text-xs py-1.5 px-3"
                  >
                    {aiAnalyzing ? "Analyzing..." : "Trigger AI Review"}
                  </Button>
                )}
              </div>

              {aiError && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300">
                  {aiError}
                </div>
              )}

              {latestSubmission ? (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Latest Submission</span>
                      <span className="text-cyan-300 font-mono">
                        {new Date(latestSubmission.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-200">{latestSubmission.description}</p>
                    {latestSubmission.githubUrl && (
                      <a
                        href={latestSubmission.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-400 hover:underline"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>{latestSubmission.githubUrl}</span>
                      </a>
                    )}
                  </div>

                  {aiParsedReport ? (
                    <AIReport
                      report={aiParsedReport}
                      analyzedAt={latestSubmission.aiAnalyzedAt}
                    />
                  ) : (
                    <div className="p-6 rounded-xl border border-dashed border-white/10 text-center space-y-2 text-slate-400">
                      <Sparkles className="w-8 h-8 text-violet-400/50 mx-auto" />
                      <p className="text-sm">No AI report generated yet.</p>
                      <p className="text-xs text-slate-500">
                        Click "Trigger AI Review" above to evaluate requirements and code quality with Gemini.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 rounded-xl border border-dashed border-white/10 text-center text-sm text-slate-400">
                  No deliverables submitted yet. The freelancer must upload milestone work before AI review.
                </div>
              )}
            </Card>
          </div>
        </div>
      </PageShell>
    </ProtectedRoute>
  );
}
