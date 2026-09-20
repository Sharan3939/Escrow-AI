"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/src/components/layout/PageShell";
import { apiClient } from "@/src/services/api";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { ProtectedRoute } from "@/src/components/layout/ProtectedRoute";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowLeft,
  Plus,
  Trash2,
  Star,
  Layers,
  Calendar,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

interface MilestoneFormItem {
  title: string;
  description: string;
  amount: string;
  deadline: string;
}

export default function CreateProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [selectedFreelancerId, setSelectedFreelancerId] = useState<string>("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "100",
    deadline: "",
    freelancerAddress: "",
  });

  const [milestones, setMilestones] = useState<MilestoneFormItem[]>([
    {
      title: "Milestone 1 - UI & Design",
      description: "Create responsive UI and frontend components.",
      amount: "25",
      deadline: "",
    },
    {
      title: "Milestone 2 - Development",
      description: "Implement backend logic and smart contract integration.",
      amount: "35",
      deadline: "",
    },
    {
      title: "Milestone 3 - Testing & Delivery",
      description: "Comprehensive testing, Gemini AI validation, and deployment.",
      amount: "40",
      deadline: "",
    },
  ]);

  useEffect(() => {
    apiClient
      .get<any>("/users/freelancers")
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          setFreelancers(res.data);
        }
      })
      .catch((err) => {
        console.warn("Could not load freelancers list:", err);
      });
  }, []);

  const totalMilestonesAmount = milestones.reduce((sum, m) => {
    const val = parseFloat(m.amount);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const budgetNum = parseFloat(formData.budget) || 0;
  const isBudgetMatching =
    budgetNum > 0 && Math.abs(budgetNum - totalMilestonesAmount) < 0.0001;

  const handleAddMilestone = () => {
    const nextOrder = milestones.length + 1;
    setMilestones([
      ...milestones,
      {
        title: `Milestone ${nextOrder} - Delivery`,
        description: "",
        amount: "",
        deadline: formData.deadline || "",
      },
    ]);
  };

  const handleRemoveMilestone = (index: number) => {
    if (milestones.length <= 1) {
      alert("A project must have at least one milestone.");
      return;
    }
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleMilestoneChange = (
    index: number,
    field: keyof MilestoneFormItem,
    value: string
  ) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side validations
    if (!formData.title || formData.title.trim().length < 5) {
      setError("Project title must be at least 5 characters.");
      return;
    }

    if (!formData.description || formData.description.trim().length < 20) {
      setError("Description must be at least 20 characters detailing deliverables.");
      return;
    }

    if (isNaN(budgetNum) || budgetNum <= 0) {
      setError("Please enter a valid total ADA budget greater than 0.");
      return;
    }

    if (!isBudgetMatching) {
      setError(
        `Milestone total (${totalMilestonesAmount} ADA) must exactly match the project budget (${budgetNum} ADA).`
      );
      return;
    }

    if (!formData.deadline) {
      setError("Please select a project deadline.");
      return;
    }

    // Validate milestones
    for (let i = 0; i < milestones.length; i++) {
      const m = milestones[i];
      if (!m.title.trim()) {
        setError(`Milestone ${i + 1} must have a title.`);
        return;
      }
      if (!m.description.trim() || m.description.trim().length < 10) {
        setError(`Milestone ${i + 1} must have a description of at least 10 characters.`);
        return;
      }
      const mAmount = parseFloat(m.amount);
      if (isNaN(mAmount) || mAmount <= 0) {
        setError(`Milestone ${i + 1} must have a valid positive ADA amount.`);
        return;
      }
    }

    setLoading(true);
    try {
      const deadlineDate = new Date(formData.deadline);

      const payload: Record<string, unknown> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        budget: formData.budget.trim(),
        deadline: deadlineDate.toISOString(),
        milestones: milestones.map((m, idx) => ({
          title: m.title.trim(),
          description: m.description.trim(),
          amount: m.amount.toString().trim(),
          deadline: m.deadline
            ? new Date(m.deadline).toISOString()
            : deadlineDate.toISOString(),
          order: idx + 1,
        })),
      };

      if (selectedFreelancerId) {
        payload.freelancerId = selectedFreelancerId;
      } else if (formData.freelancerAddress.trim()) {
        payload.freelancerAddress = formData.freelancerAddress.trim();
      }

      console.log("[Create Milestone Escrow] Submitting payload:", payload);
      const res: any = await apiClient.post("/projects", payload);

      const createdProject = res.data || res;
      setSuccess("Milestone escrow project created successfully! Redirecting to workspace...");

      setTimeout(() => {
        if (createdProject && createdProject.id) {
          router.push(`/projects/${createdProject.id}`);
        } else {
          router.push("/client/projects");
        }
      }, 1200);
    } catch (err: any) {
      console.error("[Create Escrow] Error:", err);
      const errMsg =
        err?.error ||
        err?.message ||
        "Failed to create milestone escrow. Please verify input parameters.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <PageShell
        title="Create Milestone Escrow"
        subtitle="Define project scope, break down milestone ADA releases, and enable Gemini AI dual approval."
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
        <Card className="mx-auto max-w-4xl space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Validation Error</p>
                <p className="text-xs text-red-300/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p>{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Project Overview */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>1. Project Overview & Total Budget</span>
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-300 block">
                  <span>Project Title *</span>
                  <input
                    type="text"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder-slate-500 outline-none ring-0 focus:border-cyan-400/50 transition-colors"
                    placeholder="e.g. Cardano Smart Contract Integration"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-300 block">
                  <span>Total Escrow Budget (ADA) *</span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder-slate-500 outline-none ring-0 focus:border-cyan-400/50 transition-colors font-mono"
                    placeholder="e.g. 100"
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData({ ...formData, budget: e.target.value })
                    }
                  />
                </label>
              </div>

              <label className="space-y-2 text-sm text-slate-300 block">
                <span>Scope & Deliverable Description *</span>
                <textarea
                  required
                  rows={3}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder-slate-500 outline-none ring-0 focus:border-cyan-400/50 transition-colors text-sm"
                  placeholder="Describe the overarching goals, Aiken smart contract specs, and acceptance criteria."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-300 block">
                  <span>Final Project Deadline *</span>
                  <input
                    type="date"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0 focus:border-cyan-400/50 transition-colors"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-300 block">
                  <span>Assign Freelancer</span>
                  {freelancers.length > 0 ? (
                    <select
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0 focus:border-cyan-400/50 transition-colors text-xs"
                      value={selectedFreelancerId}
                      onChange={(e) => {
                        const fId = e.target.value;
                        setSelectedFreelancerId(fId);
                        const f = freelancers.find((x) => x.id === fId);
                        if (f) {
                          setFormData({
                            ...formData,
                            freelancerAddress: f.walletAddress,
                          });
                        }
                      }}
                    >
                      <option value="">
                        -- Open for any Freelancer or specify below --
                      </option>
                      {freelancers.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.username} ({f.walletAddress.slice(0, 10)}...
                          {f.walletAddress.slice(-4)})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder-slate-500 outline-none ring-0 focus:border-cyan-400/50 transition-colors text-xs font-mono"
                      placeholder="addr_test1... (can be assigned later)"
                      value={formData.freelancerAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          freelancerAddress: e.target.value,
                        })
                      }
                    />
                  )}
                </label>
              </div>
            </div>

            {/* Section 2: Milestones Breakdown */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>2. Milestone Breakdown</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Divide your project into progressive payout milestones.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Milestone</span>
                </button>
              </div>

              {/* Real-time Budget Calculation Matcher Banner */}
              <div
                className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-4 transition-all ${
                  isBudgetMatching
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                    : "bg-amber-950/40 border-amber-500/40 text-amber-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isBudgetMatching ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span>
                    {isBudgetMatching
                      ? "✓ Milestone budget matches project budget"
                      : "✗ Milestone total must equal project budget"}
                  </span>
                </div>
                <div className="text-right font-mono shrink-0">
                  <span>
                    Sum: <strong>{totalMilestonesAmount} ADA</strong> / Target:{" "}
                    <strong>{budgetNum} ADA</strong>
                  </span>
                </div>
              </div>

              {/* Milestone Items List */}
              <div className="space-y-4">
                {milestones.map((milestone, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-950/70 rounded-2xl border border-white/10 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                        Milestone {idx + 1}
                      </span>
                      {milestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestone(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                          title="Remove milestone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-xs text-slate-300">
                        <span>Milestone Title *</span>
                        <input
                          type="text"
                          required
                          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none ring-0 focus:border-cyan-400/50"
                          placeholder="e.g. UI Design"
                          value={milestone.title}
                          onChange={(e) =>
                            handleMilestoneChange(idx, "title", e.target.value)
                          }
                        />
                      </label>

                      <label className="block text-xs text-slate-300">
                        <span>Payout Amount (ADA) *</span>
                        <input
                          type="number"
                          step="any"
                          min="1"
                          required
                          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none ring-0 focus:border-cyan-400/50 font-mono"
                          placeholder="e.g. 25"
                          value={milestone.amount}
                          onChange={(e) =>
                            handleMilestoneChange(idx, "amount", e.target.value)
                          }
                        />
                      </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-xs text-slate-300">
                        <span>Deliverable Requirements / Scope *</span>
                        <textarea
                          rows={2}
                          required
                          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none ring-0 focus:border-cyan-400/50"
                          placeholder="Specific acceptance criteria for this milestone..."
                          value={milestone.description}
                          onChange={(e) =>
                            handleMilestoneChange(
                              idx,
                              "description",
                              e.target.value
                            )
                          }
                        />
                      </label>

                      <label className="block text-xs text-slate-300">
                        <span>Milestone Deadline</span>
                        <input
                          type="date"
                          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none ring-0 focus:border-cyan-400/50"
                          value={milestone.deadline}
                          onChange={(e) =>
                            handleMilestoneChange(
                              idx,
                              "deadline",
                              e.target.value
                            )
                          }
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Non-custodial Aiken Plutus V3 contract</span>
              </div>
              <div className="flex gap-3 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => router.push("/client/projects")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !isBudgetMatching}
                  className="px-6 min-w-[170px]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Creating
                      Escrow...
                    </span>
                  ) : (
                    "Create Milestone Escrow"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </PageShell>
    </ProtectedRoute>
  );
}
