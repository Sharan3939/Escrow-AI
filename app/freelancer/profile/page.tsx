"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/src/components/layout/PageShell";
import { Card } from "@/src/components/ui/Card";
import { ProtectedRoute } from "@/src/components/layout/ProtectedRoute";
import { useAuthStore } from "@/src/store/useAuthStore";
import { getFreelancerProfile, FreelancerProfileData } from "@/src/services/reputationService";
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  Award,
  DollarSign,
  AlertTriangle,
  Briefcase,
  User,
  Wallet,
  MessageSquare,
  Loader2,
  Sparkles,
} from "lucide-react";

export default function FreelancerProfilePage() {
  const { user } = useAuthStore();
  const [profileData, setProfileData] = useState<FreelancerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    getFreelancerProfile(user.id)
      .then((res) => {
        setProfileData(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to load freelancer profile:", err);
        setError("Failed to load reputation profile.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.id]);

  if (loading) {
    return (
      <ProtectedRoute>
        <PageShell title="Freelancer Profile" subtitle="Loading on-chain reputation metrics...">
          <div className="flex items-center justify-center p-16 text-cyan-300">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </PageShell>
      </ProtectedRoute>
    );
  }

  const profile = profileData?.profile;
  const reviews = profileData?.reviews || [];
  const avgRating = profile ? Number(profile.averageRating) : 0;
  const ratingCount = profile?.ratingCount || 0;
  const completedProjects = profile?.completedProjects || 0;
  const successfulProjects = profile?.successfulProjects || 0;
  const disputedProjects = profile?.disputedProjects || 0;
  const totalAda = profile ? Number(profile.totalAdaEarned) : 0;

  return (
    <ProtectedRoute>
      <PageShell
        title="Freelancer Reputation Profile"
        subtitle="Verifiable on-chain track record, escrow completions, and authentic client satisfaction ratings."
      >
        <div className="space-y-6">
          {/* Main Reputation Hero Card */}
          <Card className="border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 shadow-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-cyan-500/20">
                  {user?.username ? user.username.slice(0, 2).toUpperCase() : "FL"}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-white">{user?.username || "Freelancer"}</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified Freelancer
                    </span>
                  </div>
                  <p className="font-mono text-xs text-slate-400 select-all">
                    {user?.walletAddress || "No wallet connected"}
                  </p>
                </div>
              </div>

              {/* Overall Star Rating Callout */}
              <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-2xl border border-white/10">
                <div className="space-y-0.5 text-right sm:text-left">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">Reputation Score</p>
                  <p className="text-2xl font-black text-amber-400 font-mono">
                    {avgRating > 0 ? avgRating.toFixed(1) : "5.0"}{" "}
                    <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(avgRating || 5)
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-600"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Reputation Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
              <div className="p-4 bg-slate-950/70 rounded-2xl border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                  <Briefcase className="w-4 h-4 text-cyan-400" />
                  <span>Completed Projects</span>
                </div>
                <p className="text-2xl font-bold text-white font-mono">{completedProjects}</p>
                <p className="text-[10px] text-slate-500">100% milestone settled</p>
              </div>

              <div className="p-4 bg-slate-950/70 rounded-2xl border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Successful Escrows</span>
                </div>
                <p className="text-2xl font-bold text-emerald-400 font-mono">{successfulProjects}</p>
                <p className="text-[10px] text-slate-500">Zero unresolved disputes</p>
              </div>

              <div className="p-4 bg-slate-950/70 rounded-2xl border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Projects Disputed</span>
                </div>
                <p className="text-2xl font-bold text-rose-400 font-mono">{disputedProjects}</p>
                <p className="text-[10px] text-slate-500">Dispute history</p>
              </div>

              <div className="p-4 bg-slate-950/70 rounded-2xl border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
                  <DollarSign className="w-4 h-4" />
                  <span>Total ADA Earned</span>
                </div>
                <p className="text-2xl font-bold text-cyan-300 font-mono">{totalAda.toLocaleString()} ADA</p>
                <p className="text-[10px] text-slate-500">On Cardano Preview</p>
              </div>
            </div>
          </Card>

          {/* Client Reviews Section */}
          <Card className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-semibold text-white">Client Reviews ({ratingCount})</h3>
              </div>
              <span className="text-xs text-slate-400">Authentic completed project reviews</span>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= rev.rating
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-slate-600"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-white">
                          {rev.project?.title || "Project Delivery"}
                        </span>
                        <span className="text-xs text-cyan-400 font-mono font-semibold">
                          ({rev.project?.budget} ADA)
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {rev.comment && (
                      <p className="text-xs text-slate-200 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5 italic">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    )}

                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>Reviewed by:</span>
                      <strong className="text-slate-300 font-medium">
                        {rev.client?.username || "Verified Client"}
                      </strong>
                      <span className="font-mono text-slate-500">
                        ({rev.client?.walletAddress?.slice(0, 10)}...{rev.client?.walletAddress?.slice(-4)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl space-y-2 text-slate-400">
                <Star className="w-8 h-8 text-amber-400/40 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No client reviews yet</p>
                <p className="text-xs text-slate-500">
                  Reviews are automatically unlocked for clients upon releasing all milestone deliverables.
                </p>
              </div>
            )}
          </Card>
        </div>
      </PageShell>
    </ProtectedRoute>
  );
}
