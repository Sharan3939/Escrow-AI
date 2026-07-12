import Link from "next/link";
import { LayoutDashboard, Briefcase, UploadCloud, Wallet, Sparkles } from "lucide-react";

const menu = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Client projects", href: "/client/projects", icon: Briefcase },
  { label: "Freelancer workspace", href: "/freelancer/submission", icon: UploadCloud },
  { label: "Wallet", href: "/dashboard", icon: Wallet },
];

export function DashboardSidebar() {
  return (
    <aside className="hidden min-h-screen w-72 border-r border-white/10 bg-slate-950/70 p-6 lg:block">
      <div className="mb-10 flex items-center gap-3 text-white">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500">
          <Sparkles size={18} />
        </span>
        <div>
          <p className="text-lg font-semibold">EscrowAI</p>
          <p className="text-sm text-slate-400">Operations hub</p>
        </div>
      </div>
      <nav className="space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
