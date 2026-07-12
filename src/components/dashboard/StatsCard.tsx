import type { ReactNode } from "react";
import { Card } from "@/src/components/ui/Card";

type StatsCardProps = {
  title: string;
  value: string;
  icon: ReactNode;
};

export function StatsCard({ title, value, icon }: StatsCardProps) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <span className="text-cyan-300">{icon}</span>
      </div>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </Card>
  );
}
