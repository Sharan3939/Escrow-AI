import Link from "next/link";
import { Card } from "@/src/components/ui/Card";
import { ArrowUpRight } from "lucide-react";

export function ProjectCard({ item }: { item: any }) {
  const clientName =
    typeof item.client === "string"
      ? item.client
      : item.client?.username || "Verified Client";

  const budgetStr =
    typeof item.budget === "string" || typeof item.budget === "number"
      ? `${item.budget} ADA`
      : "Open";

  const tags = Array.isArray(item.tags) ? item.tags : ["Cardano", "Aiken Escrow"];
  const deadlineStr = item.deadline
    ? new Date(item.deadline).toLocaleDateString()
    : item.timeline || "Active";

  return (
    <Card className="space-y-4 hover:border-cyan-500/40 transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
            {item.title}
          </h3>
          <p className="text-sm text-slate-400">Client: {clientName}</p>
        </div>
        <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-sm font-medium text-cyan-300">
          {budgetStr}
        </span>
      </div>

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

      <div className="flex items-center justify-between text-sm text-slate-400 pt-2 border-t border-white/5">
        <span>Due: {deadlineStr}</span>
        <Link
          href={`/projects/${item.id}`}
          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
        >
          <span>Manage Escrow</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </Card>
  );
}
