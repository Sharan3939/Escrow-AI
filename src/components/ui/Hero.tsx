import { ArrowRight, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";

export function Hero() {
  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-20 lg:px-8 lg:py-28">
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">
            <Sparkles size={16} />
            AI powered smart escrow for freelancers on Cardano
          </div>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Trustless freelance payments powered by Cardano AI
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-400">
              EscrowAI combines ADA-backed smart contracts with Gemini-powered review to make freelance work safer, faster, and easier to trust.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button href="/dashboard" className="px-7 py-3">
              <span className="flex items-center gap-2">Connect wallet <Wallet size={16} /></span>
            </Button>
            <Button href="/client/create" variant="secondary" className="px-7 py-3">
              <span className="flex items-center gap-2">Create escrow <ArrowRight size={16} /></span>
            </Button>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-slate-400">
            <span>✓ On-chain escrow</span>
            <span>✓ Gemini verification</span>
            <span>✓ Instant settlement</span>
          </div>
        </div>

        <Card className="space-y-5 p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cyan-300">Live market signal</p>
              <h2 className="text-2xl font-semibold text-white">$214k secured this month</h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500">
              <ShieldCheck />
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
            <p className="text-sm text-slate-400">Milestone safety score</p>
            <div className="mt-4 h-2 rounded-full bg-slate-800">
              <div className="h-2 w-[86%] rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" />
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
              <span>AI review ready</span>
              <span className="text-cyan-300">86% confidence</span>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">ADA locked</p>
              <p className="mt-2 text-2xl font-semibold text-white">128.8k</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Verified freelancers</p>
              <p className="mt-2 text-2xl font-semibold text-white">3,412</p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
