"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageShell } from "@/src/components/layout/PageShell";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { ProtectedRoute } from "@/src/components/layout/ProtectedRoute";
import { apiClient } from "@/src/services/api";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useWallet } from "@meshsdk/react";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCode,
  Lock,
  MessageSquare,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wallet,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function FreelancerProjectsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { connected } = useWallet();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const fetchFreelancerProjects = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get("/projects/freelancer/projects");
      const list = res.data || res || [];
      setProjects(Array.isArray(list) ? list : []);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load freelancer projects:", err);
      // Fallback to all projects if specific endpoint has issue
      try {
        const fallbackRes: any = await apiClient.get("/projects");
        const list = fallbackRes.data || fallbackRes || [];
        setProjects(Array.isArray(list) ? list : []);
      } catch (fErr: any) {
        setError(fErr.message || "Failed to load assigned projects");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreelancerProjects();
  }, [user?.id]);

  const handleAcceptProject = async (projectId: string) => {
    if (!connected || !user?.walletAddress) {
      setActionNotice({
        msg: "Connect your freelancer Cardano wallet before accepting this project.",
        type: "error",
      });
      return;
    }

    try {
      setAcceptingId(projectId);
      setActionNotice(null);
      await apiClient.post(`/projects/${projectId}/accept`, {});
      setActionNotice({
        msg: "Project accepted! Your freelancer Cardano wallet is now registered for milestone payouts.",
        type: "success",
      });
      await fetchFreelancerProjects();
    } catch (err: any) {
      console.error("Accept project error:", err);
      setActionNotice({
        msg: err.message || "Failed to accept project. Please verify your connected wallet.",
        type: "error",
      });
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <PageShell
        title="Freelancer Project Board"
        subtitle="Manage assigned projects, bind your Cardano settlement wallet, submit deliverables, and track AI + Client approvals."
      >
        {/* Wallet check warning if wallet not connected */}
        {(!connected || !user?.walletAddress) && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-sm">
                <strong>Cardano Wallet Required:</strong> Connect your freelancer Cardano wallet before accepting projects or submitting deliverables.
              </p>
            </div>
          </div>
        )}

        {/* Action Notice */}
        {actionNotice && (
          <div
            className={`mb-6 p-4 rounded-2xl border text-sm flex items-center gap-3 ${
              actionNotice.type === "success"
                ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                : "bg-rose-950/40 border-rose-500/30 text-rose-300"
            }`}
          >
            {actionNotice.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <p>{actionNotice.msg}</p>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-cyan-300 flex items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading assigned briefs...</span>
          </div>
        ) : error && projects.length === 0 ? (
          <div className="p-8 text-rose-400 text-center">{error}</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl p-8 space-y-4">
            <Briefcase className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-lg font-semibold text-white">No Assigned Projects Yet</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              When clients create contracts and assign your freelancer address or profile, they will appear here for review and acceptance.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {projects.map((project: any) => {
              const escrow = project.escrow;
              const isEscrowLocked =
                escrow?.status === "LOCKED" ||
                escrow?.status === "FUNDED" ||
                escrow?.status === "RELEASED";
              const isReleased = escrow?.status === "RELEASED";
              const isDisputed =
                escrow?.status === "DISPUTED" ||
                project.submissions?.[0]?.clientReviewStatus === "DISPUTED";

              const isAssignedToMe =
                project.freelancerId === user?.id ||
                (user?.walletAddress &&
                  project.freelancerWalletAddress === user.walletAddress);

              const hasAcceptedWallet = Boolean(project.freelancerWalletAddress);

              const latestSub = project.submissions?.[0];
              const aiStatus = (latestSub?.aiVerificationStatus || "PENDING").toUpperCase();
              const clientStatus = (latestSub?.clientReviewStatus || "PENDING").toUpperCase();

              return (
                <Card
                  key={project.id}
                  className="space-y-5 border-white/10 bg-slate-900/90 shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header with Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">
                          {project.status}
                        </span>
                        <h3 className="text-lg font-semibold text-white mt-0.5">
                          {project.title}
                        </h3>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                          isReleased
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : isDisputed
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : isEscrowLocked
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {isReleased
                          ? "RELEASED"
                          : isEscrowLocked
                          ? "ESCROW LOCKED"
                          : "AWAITING FUNDING"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs">
                      <div>
                        <span className="text-slate-400">Budget:</span>
                        <p className="font-bold text-white mt-0.5">{project.budget} ADA</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Client:</span>
                        <p className="font-semibold text-cyan-300 truncate mt-0.5">
                          {project.client?.username || "Client"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Deadline:</span>
                        <p className="font-medium text-slate-200 mt-0.5">
                          {new Date(project.deadline).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Freelancer Wallet & Assignment Status */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Payout Freelancer Wallet:</span>
                        {hasAcceptedWallet ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Registered
                          </span>
                        ) : (
                          <span className="text-amber-400 text-[11px] font-semibold">
                            Pending Acceptance
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[11px] text-slate-300 break-all select-all">
                        {project.freelancerWalletAddress ||
                          (isAssignedToMe && user?.walletAddress
                            ? user.walletAddress
                            : "No wallet address registered yet")}
                      </p>
                    </div>

                    {/* Dual Approval Status Pills (if submission exists) */}
                    {latestSub && (
                      <div className="grid grid-cols-2 gap-2 text-center text-xs">
                        <div className="p-2 rounded-lg bg-slate-950 border border-white/5">
                          <span className="text-[10px] text-slate-400 uppercase">AI Review:</span>
                          <p
                            className={`font-bold mt-0.5 ${
                              aiStatus === "PASS"
                                ? "text-emerald-400"
                                : aiStatus === "NEEDS_REVISION"
                                ? "text-amber-400"
                                : "text-slate-400"
                            }`}
                          >
                            {aiStatus} {latestSub.aiScore ? `(${latestSub.aiScore}%)` : ""}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950 border border-white/5">
                          <span className="text-[10px] text-slate-400 uppercase">Client Review:</span>
                          <p
                            className={`font-bold mt-0.5 ${
                              clientStatus === "APPROVED"
                                ? "text-emerald-400"
                                : clientStatus === "REVISION_REQUESTED"
                                ? "text-amber-400"
                                : "text-slate-400"
                            }`}
                          >
                            {clientStatus}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Section */}
                  <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-3">
                    {!hasAcceptedWallet && !isReleased ? (
                      <button
                        type="button"
                        onClick={() => handleAcceptProject(project.id)}
                        disabled={acceptingId === project.id}
                        className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                      >
                        {acceptingId === project.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Registering Wallet...</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Accept Project & Bind Wallet</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <Link
                        href={`/projects/${project.id}`}
                        className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-cyan-600/20"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>{latestSub ? "Workspace & Feedback" : "Submit Deliverable"}</span>
                      </Link>
                    )}

                    <Link
                      href={`/projects/${project.id}`}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
                    >
                      Details →
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </PageShell>
    </ProtectedRoute>
  );
}

