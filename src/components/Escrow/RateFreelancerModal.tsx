"use client";

import { useState } from "react";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Star, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { submitFreelancerReview } from "@/src/services/reputationService";

interface RateFreelancerModalProps {
  projectId: string;
  freelancerName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RateFreelancerModal({
  projectId,
  freelancerName,
  isOpen,
  onClose,
  onSuccess,
}: RateFreelancerModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5 stars.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await submitFreelancerReview(projectId, rating, comment);
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Submit review error:", err);
      setError(
        err?.error ||
          err?.message ||
          "Failed to submit freelancer review. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md animate-in fade-in">
      <Card className="w-full max-w-lg space-y-5 border-amber-500/30 bg-slate-900/95 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
              <Star className="w-6 h-6 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Rate & Review Freelancer
              </h3>
              <p className="text-xs text-slate-400">
                Performance feedback for {freelancerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold">Review Submitted!</p>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                Thank you. Freelancer reputation updated on EscrowAI.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Interactive 5-Star Rating */}
            <div className="space-y-2 text-center py-2 bg-slate-950/60 rounded-xl border border-white/5">
              <span className="text-xs text-slate-400">Select Overall Rating</span>
              <div className="flex items-center justify-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= (hoverRating || rating)
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs font-bold text-amber-300 mt-1">
                {rating === 5
                  ? "5 / 5 — Excellent Delivery"
                  : rating === 4
                  ? "4 / 5 — Very Good Work"
                  : rating === 3
                  ? "3 / 5 — Satisfactory"
                  : rating === 2
                  ? "2 / 5 — Needs Improvement"
                  : "1 / 5 — Unsatisfactory"}
              </p>
            </div>

            <label className="block space-y-1 text-xs text-slate-300">
              <span className="font-semibold">Written Review (Optional):</span>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 p-3 text-xs text-white placeholder-slate-500 outline-none ring-0"
                placeholder="e.g. Excellent communication, delivered all Cardano smart contract milestones on schedule!"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs"
              >
                Cancel
              </Button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting Review...</span>
                  </>
                ) : (
                  <>
                    <Star className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Submit Rating</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
