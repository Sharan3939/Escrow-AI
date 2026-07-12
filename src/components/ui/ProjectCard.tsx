import { Card } from "@/src/components/ui/Card";
import type { ProjectItem } from "@/src/types";

type ProjectCardProps = {
  item: ProjectItem;
};

export function ProjectCard({ item }: ProjectCardProps) {
  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{item.title}</h3>
          <p className="text-sm text-slate-400">{item.client}</p>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-slate-300">{item.budget}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>{item.timeline}</span>
        <span className="text-cyan-300">Open</span>
      </div>
    </Card>
  );
}
