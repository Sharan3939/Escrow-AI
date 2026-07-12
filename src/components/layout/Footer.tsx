export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-slate-400 md:flex-row md:items-center md:justify-between lg:px-8">
        <p>EscrowAI © 2026. Cardano-native freelance trust infrastructure.</p>
        <div className="flex gap-4">
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#how-it-works" className="transition hover:text-white">How it works</a>
          <a href="/dashboard" className="transition hover:text-white">Dashboard</a>
        </div>
      </div>
    </footer>
  );
}
