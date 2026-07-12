import { Blocks, ShieldCheck } from "lucide-react";
import { Navbar } from "@/src/components/layout/Navbar";
import { Footer } from "@/src/components/layout/Footer";
import { FeatureCard } from "@/src/components/ui/FeatureCard";
import { Hero } from "@/src/components/ui/Hero";
import { Card } from "@/src/components/ui/Card";
import { landingFeatures, roadmap, steps } from "@/src/constants/mockData";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.16),_transparent_28%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] text-slate-100">
      <Navbar />
      <Hero />

      <section id="features" className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Features</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Built for modern freelance teams</h2>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {landingFeatures.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={<ShieldCheck size={20} />}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">How it works</p>
            <h2 className="text-3xl font-semibold text-white">Fast, transparent, and secure</h2>
            <p className="leading-8 text-slate-400">
              From milestone creation to final settlement, each step is visible, auditable, and protected by smart contract logic.
            </p>
          </Card>
          <div className="grid gap-4">
            {steps.map((step, index) => (
              <Card key={step} className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <p className="text-slate-300">{step}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Cardano advantages</p>
            <h2 className="text-3xl font-semibold text-white">Low fees, high certainty, global access</h2>
            <p className="leading-8 text-slate-400">
              Cardano makes escrow simple for global freelancers who need dependable settlement without excessive gas costs.
            </p>
          </Card>
          <Card className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Roadmap</p>
            <ul className="space-y-3">
              {roadmap.map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-300">
                  <Blocks size={16} className="text-cyan-300" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <Footer />
    </main>
  );
}