import { Card } from "@/src/components/ui/Card";
import type { EscrowItem } from "@/src/types";

type EscrowCardProps = {
  item: EscrowItem;
};

export function EscrowCard({ item }: EscrowCardProps) {
  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-cyan-300">{item.status}</p>
          <h3 className="text-lg font-semibold text-white">{item.title}</h3>
        </div>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
          {item.amount}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-800">
        <div className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" style={{ width: `${item.progress}%` }} />
      </div>
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>Client: {item.client}</span>
        <span>{item.due}</span>
      </div>
    </Card>
  );
}
