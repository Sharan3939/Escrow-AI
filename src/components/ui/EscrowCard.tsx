import Link from "next/link";
import { Card } from "@/src/components/ui/Card";
import { ArrowUpRight, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";

export function EscrowCard({ item }: { item: any }) {
  const title = item.projectTitle || item.title || "Freelance Escrow";
  const clientName =
    typeof item.client === "string"
      ? item.client
      : item.client?.username || "Client";

  const amountStr =
    typeof item.amount === "string" || typeof item.amount === "number"
      ? `${item.amount} ADA`
      : "Pending";

  const status = (item.status || "CREATED").toUpperCase();
  const projectId = item.projectId || item.id;

  const getStatusBadge = () => {
    switch (status) {
      case "LOCKED":
        return (
          <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> LOCKED
          </span>
        );
      case "RELEASED":
        return (
          <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> SETTLED
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium">
            <Clock className="w-3.5 h-3.5" /> {status}
          </span>
        );
    }
  };

  const progress =
    status === "RELEASED" ? 100 : status === "LOCKED" ? 60 : 25;

  return (
    <Card className="space-y-4 hover:border-cyan-500/40 transition-all group">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="mb-1">{getStatusBadge()}</div>
          <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
            {title}
          </h3>
        </div>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 shrink-0">
          {amountStr}
        </span>
      </div>

      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400 pt-1 border-t border-white/5">
        <span>Client: {clientName}</span>
        {projectId && (
          <Link
            href={`/projects/${projectId}`}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs font-medium transition-colors"
          >
            <span>View Contract</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </Card>
  );
}
