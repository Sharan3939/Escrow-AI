import type { ReactNode } from "react";
import { DashboardSidebar } from "@/src/components/dashboard/Sidebar";
import { Navbar } from "@/src/components/layout/Navbar";

type PageShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  action?: ReactNode;
};

export function PageShell({ title, subtitle, children, action }: PageShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.16),_transparent_28%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] text-slate-100">
      <Navbar />
      <div className="flex min-h-[calc(100vh-73px)]">
        <DashboardSidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_80px_rgba(2,8,23,0.35)] backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">EscrowAI</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">{subtitle}</p>
            </div>
            {action}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
