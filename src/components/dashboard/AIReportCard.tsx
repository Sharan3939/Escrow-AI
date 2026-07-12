import type { AIReportItem } from "@/src/types";
import { Card } from "@/src/components/ui/Card";

type AIReportCardProps = {
  item: AIReportItem;
};

export function AIReportCard({ item }: AIReportCardProps) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{item.title}</h3>
        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-sm font-semibold text-cyan-300">{item.score}/100</span>
      </div>
      <p className="text-sm leading-7 text-slate-400">{item.summary}</p>
    </Card>
  );
}
