import Link from "next/link";
import { Button } from "@/src/components/ui/Button";

const navItems = [
  { label: "Product", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Dashboard", href: "/dashboard" },
];

export function Navbar() {
  return (
    <nav className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-wide text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 text-base font-bold">
            E
          </span>
          <span>EscrowAI</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-slate-300 transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" className="hidden sm:inline-flex">
            <Link href="/dashboard">Launch app</Link>
          </Button>
          <Button>Connect wallet</Button>
        </div>
      </div>
    </nav>
  );
}
