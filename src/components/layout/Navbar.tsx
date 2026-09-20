"use client";

import Link from "next/link";
import { Button } from "@/src/components/ui/Button";
import { WalletButton } from "@/src/components/wallet/WalletButton";
import { useAuthStore } from "@/src/store/useAuthStore";

export function Navbar() {
  const { user, isAuthenticated } = useAuthStore();
  const isFreelancer = user?.role === "FREELANCER";

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
          <Link href="/#features" className="text-sm text-slate-300 transition hover:text-white">
            Product
          </Link>
          <Link href="/#how-it-works" className="text-sm text-slate-300 transition hover:text-white">
            How it works
          </Link>
          <Link href="/dashboard" className="text-sm text-slate-300 transition hover:text-white">
            Dashboard
          </Link>
          {isAuthenticated && (
            isFreelancer ? (
              <Link href="/freelancer/projects" className="text-sm text-emerald-400 font-semibold transition hover:text-emerald-300">
                Freelancer Board
              </Link>
            ) : (
              <Link href="/client/projects" className="text-sm text-cyan-400 font-semibold transition hover:text-cyan-300">
                Client Workspace
              </Link>
            )
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            href={isAuthenticated ? (isFreelancer ? "/freelancer/projects" : "/client/projects") : "/dashboard"}
            variant="secondary"
            className="hidden sm:inline-flex"
          >
            Launch app
          </Button>
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}

