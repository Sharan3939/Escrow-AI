import Link from "next/link";
import { Card } from "@/src/components/ui/Card";
import { ArrowUpRight, Trash2, ShieldCheck, Lock, CheckCircle2, Circle, Clock } from "lucide-react";

interface ProjectCardProps {
  item: any;
  onDelete?: (project: any) => void;
  isDeleting?: boolean;
}

export function ProjectCard({ item, onDelete, isDeleting }: ProjectCardProps) {
  const clientName =
    typeof item.client === "string"
      ? item.client
      : item.client?.username || "Verified Client";

  const budgetNum = Number(item.budget) || 0;
  const budgetStr =
    typeof item.budget === "string" || typeof item.budget === "number"
      ? `${item.budget} ADA`
      : "Open";

  const tags = Array.isArray(item.tags) ? item.tags : ["Cardano", "Aiken Escrow"];
  const deadlineStr = item.deadline
    ? new Date(item.deadline).toLocaleDateString()
    : item.timeline || "Active";

  const escrowStatus = (item.escrow?.status || "CREATED").toUpperCase();
  const isOnChain =
    escrowStatus === "LOCKED" ||
    escrowStatus === "RELEASED" ||
    Boolean(item.escrow?.transactionHash) ||
    Boolean(item.escrow?.fundedAt);

  const milestones = Array.isArray(item.milestones) ? item.milestones : [];
  const releasedAmount = milestones
    .filter((m: any) => m.status === "RELEASED")
    .reduce((sum: number, m: any) => sum + Number(m.amount || 0), 0);
  const remainingAmount = Math.max(0, budgetNum - releasedAmount);
  const releasedCount = milestones.filter((m: any) => m.status === "RELEASED").length;

  return (
    <Card className="space-y-4 hover:border-cyan-500/40 transition-all group relative flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
                {item.title}
              </h3>
            </div>
            <p className="text-sm text-slate-400">Client: {clientName}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-sm font-medium text-cyan-300">
              {budgetStr}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider flex items-center gap-1 ${
                isOnChain
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {isOnChain ? (
                <>
                  <Lock className="w-2.5 h-2.5" /> On-Chain ({escrowStatus})
                </>
              ) : (
                <>
                  <ShieldCheck className="w-2.5 h-2.5" /> Draft Escrow
                </>
              )}
            </span>
          </div>
        </div>

        {/* Milestone summary & Progress if milestones exist */}
        {milestones.length > 0 && (
          <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-semibold text-slate-200">
                Milestones ({releasedCount}/{milestones.length} Released)
              </span>
              <span className="font-mono text-cyan-300">
                Released: {releasedAmount} ADA | Remaining: {remainingAmount} ADA
              </span>
            </div>

            {/* Quick Milestone Progress Dots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              {milestones.slice(0, 4).map((m: any, idx: number) => {
                const isRel = m.status === "RELEASED";
                const isAct = m.status === "IN_PROGRESS" || m.status === "SUBMITTED" || m.status === "APPROVED";
                return (
                  <div
                    key={m.id || idx}
                    className="flex items-center gap-1.5 text-[11px] truncate text-slate-300"
                  >
                    {isRel ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : isAct ? (
                      <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                    <span className="truncate">
                      M{m.order}: {m.title} ({m.amount} ADA)
                    </span>
                  </div>
                );
              })}
              {milestones.length > 4 && (
                <span className="text-[10px] text-slate-500 italic pl-1">
                  +{milestones.length - 4} more milestone(s)...
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {tags.map((tag: string) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300 bg-white/5"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400 pt-3 border-t border-white/5 mt-2">
        <span>Due: {deadlineStr}</span>
        <div className="flex items-center gap-3">
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(item)}
              disabled={isDeleting}
              title={
                isOnChain
                  ? "On-chain escrows cannot be deleted"
                  : "Delete this project"
              }
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isOnChain
                  ? "text-slate-500 hover:text-amber-400 bg-white/5 hover:bg-amber-500/10 cursor-pointer"
                  : "text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          <Link
            href={`/projects/${item.id}`}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            <span>Manage Escrow</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
}

