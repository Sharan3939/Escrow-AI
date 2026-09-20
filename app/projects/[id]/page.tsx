"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/src/components/layout/PageShell";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { apiClient } from "@/src/services/api";
import { LockFundsButton } from "@/src/components/Escrow/LockFundsButton";
import { ReleaseMilestoneButton } from "@/src/components/Escrow/ReleaseMilestoneButton";
import { RateFreelancerModal } from "@/src/components/Escrow/RateFreelancerModal";
import { AIReport } from "@/src/components/AIReport";
import { ProtectedRoute } from "@/src/components/layout/ProtectedRoute";
import { useAuthStore } from "@/src/store/useAuthStore";
import { getEscrowScriptAddress } from "@/src/utils/cardano";
import {
  reviewMilestone,
  checkMilestoneCanRelease,
  submitMilestoneWork,
} from "@/src/services/milestoneService";
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
  XCircle,
  MessageSquare,
  ShieldAlert,
  RotateCcw,
  Check,
  X,
  Lock,
  Layers,
  HelpCircle,
  UserCheck,
  Loader2,
  Star,
  DollarSign,
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
  const { user } = useAuthStore();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Milestone for active review / submission
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>("");

  // Submission Form State (for freelancers)
  const [submissionDesc, setSubmissionDesc] = useState("");
  const [submissionGithub, setSubmissionGithub] = useState("");
  const [submissionFile, setSubmissionFile] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // AI Verification State
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Modal Dialogs State (for client actions)
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [actionFeedback, setActionFeedback] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [acceptingProject, setAcceptingProject] = useState(false);

  // Milestone release eligibility state
  const [milestoneEligibility, setMilestoneEligibility] = useState<any>(null);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>(`/projects/${projectId}`);
      const projData = res.data;
      setProject(projData);
      setError(null);

      // Set active milestone
      const ms = projData?.milestones || [];
      if (ms.length > 0) {
        // Default to first non-released milestone or first one
        const activeM =
          ms.find((m: any) => m.status !== "RELEASED") || ms[0];
        setSelectedMilestoneId((prev) =>
          prev && ms.some((m: any) => m.id === prev) ? prev : activeM.id
        );
      }
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

  // Check eligibility for selected milestone
  useEffect(() => {
    if (!selectedMilestoneId) return;
    checkMilestoneCanRelease(selectedMilestoneId)
      .then((res) => {
        setMilestoneEligibility(res.data);
      })
      .catch((_) => {});
  }, [selectedMilestoneId, project]);

  const handleAcceptProject = async () => {
    if (!user?.walletAddress) {
      alert("Please connect your freelancer Cardano wallet before accepting this project.");
      return;
    }

    try {
      setAcceptingProject(true);
      await apiClient.post(`/projects/${projectId}/accept`, {});
      alert("Project accepted! Your freelancer Cardano wallet is bound for escrow release.");
      await fetchProject();
    } catch (err: any) {
      console.error("Accept project error:", err);
      alert(err.message || "Failed to accept project.");
    } finally {
      setAcceptingProject(false);
    }
  };

  const handleCreateSubmission = async () => {
    if (!selectedMilestoneId) {
      alert("Please select an active milestone to submit deliverables.");
      return;
    }

    if (!submissionDesc || submissionDesc.trim().length < 10) {
      alert("Please enter a deliverable description of at least 10 characters.");
      return;
    }

    try {
      setSubmitting(true);
      await submitMilestoneWork(selectedMilestoneId, {
        description: submissionDesc,
        githubUrl: submissionGithub || undefined,
        fileUrl: submissionFile || undefined,
      });
      alert("Milestone work submitted successfully for Gemini AI review!");
      setSubmissionDesc("");
      setSubmissionGithub("");
      setSubmissionFile("");
      await fetchProject();
    } catch (err: any) {
      console.error("Submission failed:", err);
      alert(err.message || "Failed to submit milestone work.");
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

  const handleClientMilestoneReview = async (
    action: "APPROVE" | "REQUEST_REVISION" | "DISPUTE"
  ) => {
    if (!selectedMilestoneId) return;

    try {
      setActionLoading(true);
      setActionError(null);

      await reviewMilestone(selectedMilestoneId, action, actionFeedback);

      setShowApproveModal(false);
      setShowRevisionModal(false);
      setShowDisputeModal(false);
      setActionFeedback("");

      await fetchProject();
    } catch (err: any) {
      console.error("Review action error:", err);
      setActionError(err.message || "Failed to submit review action");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !project) {
    return (
      <ProtectedRoute>
        <PageShell title="Loading Escrow..." subtitle="Fetching Cardano smart contract & milestone state">
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
  const milestones: any[] = project.milestones || [];
  const activeMilestone =
    milestones.find((m) => m.id === selectedMilestoneId) || milestones[0] || null;

  const activeMilestoneSubmissions = activeMilestone?.submissions || [];
  const latestSubmission = activeMilestoneSubmissions[0] || null;

  const isClient = user?.id ? project.clientId === user.id : true;
  const isFreelancer = user?.id ? project.freelancerId === user.id : false;

  let aiParsedReport: any = null;
  if (latestSubmission?.aiReport) {
    try {
      aiParsedReport = JSON.parse(latestSubmission.aiReport);
    } catch (_) {}
  }

  const escrowStatus = (escrow?.status || "CREATED").toUpperCase();
  const isLocked = escrowStatus === "LOCKED" || escrowStatus === "FUNDED" || escrowStatus === "PARTIALLY_RELEASED" || escrowStatus === "RELEASED";
  const isProjectCompleted = project.status === "COMPLETED";

  // Financial statistics
  const totalBudget = Number(project.budget);
  const releasedAmount = milestones
    .filter((m) => m.status === "RELEASED")
    .reduce((sum, m) => sum + Number(m.amount), 0);
  const remainingAmount = Math.max(0, totalBudget - releasedAmount);

  const activeMilestoneStatus = (activeMilestone?.status || "PENDING").toUpperCase();
  const isMilestoneReleased = activeMilestoneStatus === "RELEASED";
  const isMilestoneDisputed =
    activeMilestoneStatus === "DISPUTED" ||
    latestSubmission?.clientReviewStatus === "DISPUTED";

  const aiStatus = (latestSubmission?.aiVerificationStatus || "PENDING").toUpperCase();
  const clientReviewStatus = (latestSubmission?.clientReviewStatus || "PENDING").toUpperCase();
  const isAiPass = aiStatus === "PASS";
  const isClientApproved = clientReviewStatus === "APPROVED" || activeMilestoneStatus === "APPROVED";
  const isRevisionRequested = clientReviewStatus === "REVISION_REQUESTED" || activeMilestoneStatus === "REVISION_REQUESTED";

  return (
    <ProtectedRoute>
      <PageShell
        title={project.title}
        subtitle="Cardano Aiken Plutus V3 Milestone Escrow — Dual Approval Settlement"
        action={
          <div className="flex items-center gap-3">
            {isProjectCompleted && isClient && !project.review && (
              <button
                type="button"
                onClick={() => setShowRateModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
              >
                <Star className="w-4 h-4 fill-slate-950" />
                <span>Rate Freelancer</span>
              </button>
            )}
            <Link
              href="/client/projects"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All Projects</span>
            </Link>
          </div>
        }
      >
        {/* TOP SUMMARY: Financials & Visual Milestone Progress Pipeline */}
        <div className="space-y-6 mb-6">
          <Card className="border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 shadow-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">
                  Escrow Financial Overview
                </span>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{project.title}</h2>
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                      isProjectCompleted
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : isLocked
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {isProjectCompleted ? "COMPLETED" : isLocked ? "ESCROW FUNDED" : "UNFUNDED"}
                  </span>
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-white/5 text-xs">
                <div className="text-center px-2">
                  <p className="text-[10px] text-slate-400 uppercase">Project Total</p>
                  <p className="font-bold text-white text-sm">{totalBudget} ADA</p>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div className="text-center px-2">
                  <p className="text-[10px] text-emerald-400 uppercase">Released</p>
                  <p className="font-bold text-emerald-400 text-sm">{releasedAmount} ADA</p>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div className="text-center px-2">
                  <p className="text-[10px] text-cyan-400 uppercase">Remaining</p>
                  <p className="font-bold text-cyan-400 text-sm">{remainingAmount} ADA</p>
                </div>
              </div>
            </div>

            {/* Visual Milestone Progress Indicator */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Milestone Progress Pipeline</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {milestones.map((m, idx) => {
                  const isMReleased = m.status === "RELEASED";
                  const isSelected = m.id === selectedMilestoneId;
                  const isMInProgress = m.status === "IN_PROGRESS" || m.status === "SUBMITTED" || m.status === "AI_REVIEW" || m.status === "CLIENT_REVIEW" || m.status === "APPROVED";

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMilestoneId(m.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-cyan-950/40 border-cyan-400/80 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/50"
                          : isMReleased
                          ? "bg-emerald-950/20 border-emerald-500/30 hover:bg-emerald-950/40"
                          : "bg-slate-950/50 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {isMReleased ? "[✓]" : isMInProgress ? "[●]" : "[ ]"} Milestone {m.order || idx + 1}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isMReleased
                              ? "bg-emerald-500/20 text-emerald-300"
                              : m.status === "DISPUTED"
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white truncate mt-1">{m.title}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span className="font-mono text-cyan-300 font-bold">{m.amount} ADA</span>
                        <span>{new Date(m.deadline).toLocaleDateString()}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Smart contract details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-white/5">
              <div>
                <span className="text-slate-400">Aiken Plutus V3 Script Address:</span>
                <p className="font-mono text-[11px] text-cyan-300 truncate select-all mt-0.5">
                  {scriptAddress}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Freelancer Payout Wallet:</span>
                <p className="font-mono text-[11px] text-emerald-300 truncate select-all mt-0.5">
                  {project.freelancerWalletAddress || project.freelancer?.walletAddress || "Pending Assignment"}
                </p>
              </div>
            </div>

            {/* Initial Escrow Funding Button if Unfunded */}
            {!isLocked && (
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-3">
                <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span>Lock {totalBudget} ADA Total Project Escrow</span>
                </div>
                <p className="text-xs text-slate-300">
                  Lock the total project budget on Cardano Preview Testnet into the Aiken smart contract. Individual milestone payouts will be released deterministically as each milestone passes Dual Approval.
                </p>
                <LockFundsButton
                  projectId={projectId}
                  escrowId={escrow?.id || projectId}
                  amount={totalBudget}
                  freelancerAddress={project.freelancerWalletAddress || project.freelancer?.walletAddress}
                  onSuccess={() => fetchProject()}
                />
              </div>
            )}

            {/* Submitted Client Review Display if present */}
            {project.review && (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>Client Review ({project.review.rating} / 5 Stars)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(project.review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {project.review.comment && (
                  <p className="text-xs text-amber-200/90 italic">
                    &ldquo;{project.review.comment}&rdquo;
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* MAIN ACTIVE MILESTONE WORKSPACE: Dual Approval & Deliverables */}
        {activeMilestone && (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            {/* LEFT COLUMN: Active Milestone Dual Approval Pipeline & Release */}
            <div className="space-y-6">
              <Card className="space-y-5 border-cyan-500/30 bg-slate-900/95 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">
                        Milestone {activeMilestone.order} Dual Approval
                      </span>
                      <h3 className="text-base font-bold text-white">{activeMilestone.title}</h3>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isMilestoneReleased
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : isMilestoneDisputed
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    }`}
                  >
                    {activeMilestoneStatus}
                  </span>
                </div>

                <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-white/5 leading-relaxed">
                  {activeMilestone.description}
                </p>

                {/* Protocol 3-step checklist */}
                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-white/5 text-center">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">1. Smart Contract</p>
                    <p className={`text-xs font-bold ${isLocked ? "text-emerald-400" : "text-amber-400"}`}>
                      {isLocked ? "✓ FUNDED" : "UNFUNDED"}
                    </p>
                  </div>
                  <div className="space-y-1 border-x border-white/10 px-2">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">2. Gemini AI</p>
                    <p
                      className={`text-xs font-bold ${
                        isAiPass
                          ? "text-emerald-400"
                          : aiStatus === "NEEDS_REVISION"
                          ? "text-amber-400"
                          : aiStatus === "FAIL"
                          ? "text-rose-400"
                          : "text-slate-400"
                      }`}
                    >
                      {isAiPass ? "✓ PASS" : aiStatus}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">3. Client Approval</p>
                    <p
                      className={`text-xs font-bold ${
                        isClientApproved
                          ? "text-emerald-400"
                          : isRevisionRequested
                          ? "text-amber-400"
                          : isMilestoneDisputed
                          ? "text-rose-400"
                          : "text-slate-400"
                      }`}
                    >
                      {isClientApproved ? "✓ APPROVED" : clientReviewStatus}
                    </p>
                  </div>
                </div>

                {/* Milestone Release Execution */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  {isMilestoneReleased ? (
                    <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <p className="font-semibold text-xs text-white">
                          Milestone {activeMilestone.order} Released & Settled!
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {activeMilestone.amount} ADA released to freelancer wallet.
                        </p>
                        {activeMilestone.releaseTxHash && (
                          <a
                            href={`https://preview.cardanoscan.io/transaction/${activeMilestone.releaseTxHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block text-[11px] text-cyan-400 hover:underline pt-1 font-mono"
                          >
                            Tx: {activeMilestone.releaseTxHash.slice(0, 16)}... →
                          </a>
                        )}
                      </div>
                    </div>
                  ) : isAiPass && isClientApproved ? (
                    <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2.5">
                      <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Dual Approval Complete for Milestone {activeMilestone.order}</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Gemini AI and Client Satisfaction are both verified. Click below to sign with Lace and release {activeMilestone.amount} ADA on Cardano Preview.
                      </p>
                      <ReleaseMilestoneButton
                        projectId={projectId}
                        milestoneId={activeMilestone.id}
                        milestoneTitle={activeMilestone.title}
                        amount={Number(activeMilestone.amount)}
                        freelancerAddress={
                          project.freelancerWalletAddress ||
                          project.freelancer?.walletAddress ||
                          ""
                        }
                        escrowAddress={scriptAddress}
                        onSuccess={(_txHash, completed) => {
                          fetchProject();
                          if (completed && isClient) {
                            setTimeout(() => setShowRateModal(true), 1500);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 space-y-1 text-xs">
                      <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                        <Lock className="w-4 h-4 text-cyan-400" />
                        <span>Milestone Escrow Locked ({activeMilestone.amount} ADA)</span>
                      </div>
                      <p className="text-slate-400 leading-relaxed text-[11px]">
                        Release unlocks after both <strong>Gemini AI (PASS)</strong> and <strong>Client Satisfaction (APPROVED)</strong>.
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Client Satisfaction Review Actions for Active Milestone */}
              {latestSubmission && !isMilestoneReleased && isClient && (
                <Card className="space-y-4 border-violet-500/30 bg-slate-900/90 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-violet-400" />
                      <h3 className="text-base font-semibold text-white">Client Satisfaction Review</h3>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                        isClientApproved
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : isRevisionRequested
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : isMilestoneDisputed
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                      }`}
                    >
                      {clientReviewStatus}
                    </span>
                  </div>

                  {latestSubmission.clientFeedback && (
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 text-xs">
                      <p className="text-slate-400 font-semibold uppercase text-[10px]">Feedback Notes:</p>
                      <p className="text-slate-200 mt-0.5">{latestSubmission.clientFeedback}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActionFeedback("");
                        setShowApproveModal(true);
                      }}
                      disabled={!isAiPass || isClientApproved || isMilestoneDisputed}
                      className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Milestone</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActionFeedback("");
                        setShowRevisionModal(true);
                      }}
                      disabled={isMilestoneReleased || isMilestoneDisputed}
                      className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 font-semibold text-xs cursor-pointer disabled:opacity-40"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Request Revision</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActionFeedback("");
                        setShowDisputeModal(true);
                      }}
                      disabled={isMilestoneReleased || isMilestoneDisputed}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 font-semibold text-xs cursor-pointer disabled:opacity-40"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Dispute</span>
                    </button>
                  </div>

                  {!isAiPass && (
                    <p className="text-[11px] text-amber-300/90 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Client approval unlocks once Gemini AI Verification returns <strong>PASS</strong>.</span>
                    </p>
                  )}
                </Card>
              )}
            </div>

            {/* RIGHT COLUMN: Milestone Submission & Gemini AI Report */}
            <div className="space-y-6">
              {/* Freelancer Accept Project Banner if not bound */}
              {!project.freelancerWalletAddress && !isMilestoneReleased && (
                <Card className="space-y-3 border-emerald-500/30 bg-emerald-950/20">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <UserCheck className="w-4 h-4" />
                    <span>Freelancer Cardano Wallet Assignment</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Connect your freelancer Lace wallet to register your Cardano payout address.
                  </p>
                  <button
                    type="button"
                    onClick={handleAcceptProject}
                    disabled={acceptingProject}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer disabled:opacity-50"
                  >
                    {acceptingProject ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Accept Project & Bind Cardano Wallet</span>
                    )}
                  </button>
                </Card>
              )}

              {/* Freelancer Submit / Resubmit Milestone Form */}
              {!isMilestoneReleased && (
                <Card className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-base font-semibold text-white">
                        {latestSubmission ? "Resubmit Milestone Work" : "Submit Milestone Deliverable"}
                      </h3>
                    </div>
                    {latestSubmission && (
                      <span className="text-xs text-slate-400 font-mono">
                        Rev #{latestSubmission.revisionCount}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs text-slate-300">
                      <span>Deliverable Notes & Summary for Milestone {activeMilestone.order} *</span>
                      <textarea
                        rows={3}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/70 p-3 text-xs text-white placeholder-slate-500 outline-none ring-0"
                        placeholder={`Describe how you met the requirements for "${activeMilestone.title}"...`}
                        value={submissionDesc}
                        onChange={(e) => setSubmissionDesc(e.target.value)}
                      />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-xs text-slate-300">
                        <span>GitHub Repository / PR URL</span>
                        <input
                          type="url"
                          className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/70 p-2 text-xs text-white placeholder-slate-500 outline-none ring-0 font-mono"
                          placeholder="https://github.com/..."
                          value={submissionGithub}
                          onChange={(e) => setSubmissionGithub(e.target.value)}
                        />
                      </label>
                      <label className="block text-xs text-slate-300">
                        <span>Live Demo URL (Optional)</span>
                        <input
                          type="url"
                          className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/70 p-2 text-xs text-white placeholder-slate-500 outline-none ring-0 font-mono"
                          placeholder="https://..."
                          value={submissionFile}
                          onChange={(e) => setSubmissionFile(e.target.value)}
                        />
                      </label>
                    </div>

                    <Button
                      onClick={handleCreateSubmission}
                      disabled={submitting}
                      className="w-full text-xs py-2.5"
                    >
                      {submitting
                        ? "Uploading Deliverable..."
                        : latestSubmission
                        ? "Resubmit Deliverable for AI Review"
                        : "Submit Deliverable for AI Review"}
                    </Button>
                  </div>
                </Card>
              )}

              {/* Gemini AI Verification Section */}
              <div className="space-y-4">
                {latestSubmission && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-violet-400" />
                      <h3 className="text-base font-semibold text-white">Gemini AI Verification</h3>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => handleRunAiAnalysis(latestSubmission.id)}
                      disabled={aiAnalyzing}
                      className="text-xs py-1.5 px-3"
                    >
                      {aiAnalyzing ? "Analyzing..." : "Re-trigger AI Review"}
                    </Button>
                  </div>
                )}

                {aiError && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300">
                    {aiError}
                  </div>
                )}

                {latestSubmission ? (
                  <div className="space-y-3">
                    {/* Latest submission metadata */}
                    <div className="p-3.5 bg-slate-950/70 rounded-xl border border-white/5 text-xs space-y-2">
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Submitted: {new Date(latestSubmission.createdAt).toLocaleString()}</span>
                        <span className="text-cyan-300 font-mono">Rev #{latestSubmission.revisionCount}</span>
                      </div>
                      <p className="text-slate-200 text-xs leading-relaxed">{latestSubmission.description}</p>
                      {latestSubmission.githubUrl && (
                        <a
                          href={latestSubmission.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-cyan-400 hover:underline font-mono text-[11px]"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span className="break-all">{latestSubmission.githubUrl}</span>
                        </a>
                      )}
                    </div>

                    {/* AI Report Breakdown */}
                    {aiParsedReport ? (
                      <AIReport
                        report={aiParsedReport}
                        analyzedAt={latestSubmission.aiAnalyzedAt}
                        revisionCount={latestSubmission.revisionCount}
                      />
                    ) : (
                      <div className="p-6 rounded-xl border border-dashed border-white/10 text-center space-y-2 text-slate-400">
                        <Sparkles className="w-6 h-6 text-violet-400/50 mx-auto" />
                        <p className="text-xs">No AI report generated yet.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 rounded-xl border border-dashed border-white/10 text-center text-xs text-slate-400">
                    No deliverables submitted yet for Milestone {activeMilestone.order}.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1: Client Approval Confirmation Dialog */}
        {showApproveModal && activeMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md animate-in fade-in">
            <Card className="w-full max-w-lg space-y-5 border-emerald-500/30 bg-slate-900/95 shadow-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Approve Milestone {activeMilestone.order}: {activeMilestone.title}?
                    </h3>
                    <p className="text-xs text-slate-400">Confirm satisfactory delivery</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  disabled={actionLoading}
                  className="rounded-lg p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 rounded-xl bg-slate-950/60 p-3 border border-white/5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Milestone Payout:</span>
                  <strong className="text-white">{activeMilestone.amount} ADA</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gemini AI Status:</span>
                  <strong className="text-emerald-400">PASS</strong>
                </div>
              </div>

              <label className="block text-xs text-slate-300">
                <span>Client Satisfaction Feedback (Optional):</span>
                <textarea
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/70 p-2.5 text-xs text-white placeholder-slate-500 outline-none ring-0"
                  placeholder="e.g., Deliverables meet all specifications."
                  value={actionFeedback}
                  onChange={(e) => setActionFeedback(e.target.value)}
                />
              </label>

              {actionError && (
                <p className="text-xs text-rose-400 bg-rose-950/30 p-2.5 rounded-lg border border-rose-500/20">
                  {actionError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowApproveModal(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs"
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={() => handleClientMilestoneReview("APPROVE")}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Approving..." : "Confirm Approval"}
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* MODAL 2: Request Revision Dialog */}
        {showRevisionModal && activeMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md animate-in fade-in">
            <Card className="w-full max-w-lg space-y-5 border-amber-500/30 bg-slate-900/95 shadow-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Request Milestone Revision
                    </h3>
                    <p className="text-xs text-slate-400">Milestone funds remain locked</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  disabled={actionLoading}
                  className="rounded-lg p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <label className="block text-xs text-slate-300">
                <span className="font-semibold">Revision Instructions:</span>
                <textarea
                  rows={4}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/70 p-3 text-xs text-white placeholder-slate-500 outline-none ring-0"
                  placeholder="Specify exact changes needed before approval..."
                  value={actionFeedback}
                  onChange={(e) => setActionFeedback(e.target.value)}
                />
              </label>

              {actionError && (
                <p className="text-xs text-rose-400 bg-rose-950/30 p-2.5 rounded-lg border border-rose-500/20">
                  {actionError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowRevisionModal(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs"
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={() => handleClientMilestoneReview("REQUEST_REVISION")}
                  disabled={actionLoading || !actionFeedback.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-lg shadow-amber-600/30 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Submitting..." : "Submit Revision Request"}
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* MODAL 3: Raise Dispute Dialog */}
        {showDisputeModal && activeMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md animate-in fade-in">
            <Card className="w-full max-w-lg space-y-5 border-rose-500/30 bg-slate-900/95 shadow-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-rose-500/10 p-2 text-rose-400 border border-rose-500/20">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Raise Milestone Dispute</h3>
                    <p className="text-xs text-slate-400">Milestone funds remain frozen</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  disabled={actionLoading}
                  className="rounded-lg p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <label className="block text-xs text-slate-300">
                <span className="font-semibold">Dispute Reason:</span>
                <textarea
                  rows={4}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/70 p-3 text-xs text-white placeholder-slate-500 outline-none ring-0"
                  placeholder="Explain the unresolved disagreement..."
                  value={actionFeedback}
                  onChange={(e) => setActionFeedback(e.target.value)}
                />
              </label>

              {actionError && (
                <p className="text-xs text-rose-400 bg-rose-950/30 p-2.5 rounded-lg border border-rose-500/20">
                  {actionError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowDisputeModal(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs"
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={() => handleClientMilestoneReview("DISPUTE")}
                  disabled={actionLoading || !actionFeedback.trim()}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Submitting..." : "Raise Dispute"}
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* MODAL 4: Rate Freelancer Modal */}
        {showRateModal && (
          <RateFreelancerModal
            projectId={projectId}
            freelancerName={project.freelancer?.username || "Freelancer"}
            isOpen={showRateModal}
            onClose={() => setShowRateModal(false)}
            onSuccess={() => fetchProject()}
          />
        )}
      </PageShell>
    </ProtectedRoute>
  );
}
