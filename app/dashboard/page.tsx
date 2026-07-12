import { Briefcase, Gem, Wallet } from "lucide-react";
import { PageShell } from "@/src/components/layout/PageShell";
import { EscrowCard } from "@/src/components/ui/EscrowCard";
import { Card } from "@/src/components/ui/Card";
import { StatsCard } from "@/src/components/dashboard/StatsCard";
import { TransactionCard } from "@/src/components/dashboard/TransactionCard";
import { AIReportCard } from "@/src/components/dashboard/AIReportCard";
import { activeEscrows, aiReports, transactions } from "@/src/constants/mockData";

export default function DashboardPage() {
  return (
    <PageShell
      title="Operations dashboard"
      subtitle="Track wallet health, active escrows, and AI verification progress from one premium control center."
      action={<div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-300">Wallet ready for milestone settlement</div>}
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatsCard title="ADA balance" value="12,480 ADA" icon={<Wallet size={18} />} />
            <StatsCard title="Open escrows" value="6" icon={<Briefcase size={18} />} />
            <StatsCard title="AI review score" value="91/100" icon={<Gem size={18} />} />
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Active escrow cards</h2>
              <span className="text-sm text-cyan-300">2 in motion</span>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {activeEscrows.map((item) => (
                <EscrowCard key={item.id} item={item} />
              ))}
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
              {transactions.map((transaction) => (
                <TransactionCard key={transaction.id} item={transaction} />
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">AI verification status</h2>
              <span className="text-sm text-cyan-300">Auto review enabled</span>
            </div>
            <div className="space-y-3">
              {aiReports.map((report) => (
                <AIReportCard key={report.id} item={report} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
