"use client";

import { Briefcase, Gem, Wallet } from "lucide-react";
import { PageShell } from "@/src/components/layout/PageShell";
import { EscrowCard } from "@/src/components/ui/EscrowCard";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { StatsCard } from "@/src/components/dashboard/StatsCard";
import { TransactionCard } from "@/src/components/dashboard/TransactionCard";
import { AIReportCard } from "@/src/components/dashboard/AIReportCard";
import { useDashboardData } from "@/src/hooks/useDashboardData";
import { ProtectedRoute } from "@/src/components/layout/ProtectedRoute";

export default function DashboardPage() {
  const { data: { escrows, transactions, aiReports }, stats, loading, error } = useDashboardData();

  if (loading) return <div className="p-8 text-white">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <ProtectedRoute>
    <PageShell
      title="Operations dashboard"
      subtitle="Track wallet health, active escrows, and AI verification progress from one premium control center."
      action={
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2.5 text-xs text-cyan-300 hidden sm:block">
            Cardano Preview Network
          </div>
          <Button href="/client/create" className="px-4 py-2.5 text-xs">
            + Create Escrow
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatsCard title="ADA locked" value={stats.adaLocked} icon={<Wallet size={18} />} />
            <StatsCard title="Open escrows" value={stats.openEscrows.toString()} icon={<Briefcase size={18} />} />
            <StatsCard title="AI review score" value={stats.aiScore} icon={<Gem size={18} />} />
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Active escrow cards</h2>
              <span className="text-sm text-cyan-300">{stats.inMotionCount} in motion</span>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {escrows.length > 0 ? escrows.map((item: any) => (
                <EscrowCard key={item.id} item={item} />
              )) : <div className="text-slate-400">No active escrows</div>}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Recent transactions</h2>
              <span className="text-sm text-slate-400">Updated live</span>
            </div>
            <div className="space-y-3">
              {transactions.length > 0 ? transactions.map((transaction: any) => (
                <TransactionCard key={transaction.id} item={transaction} />
              )) : <div className="text-slate-400">No recent transactions</div>}
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">AI verification status</h2>
              <span className="text-sm text-cyan-300">Auto review enabled</span>
            </div>
            <div className="space-y-3">
              {aiReports.length > 0 ? aiReports.map((report: any) => (
                <AIReportCard key={report.id} item={report} />
              )) : <div className="text-slate-400">No AI reports</div>}
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
    </ProtectedRoute>
  );
}
