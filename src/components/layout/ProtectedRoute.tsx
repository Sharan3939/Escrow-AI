"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useWallet } from "@meshsdk/react";
import { Wallet, ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { WalletButton } from "../wallet/WalletButton";

const emptySubscribe = () => () => {};

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const { connected, connecting } = useWallet();
  const [mounted, setMounted] = useState(false);

  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR or before client hydration finishes, wait briefly
  if (!isClient || !mounted || !isHydrated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-slate-300 gap-3">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-medium">Verifying Cardano wallet session...</p>
      </div>
    );
  }

  // If user is authenticated, give immediate access
  if (isAuthenticated) {
    console.log("[AUTH DEBUG] ProtectedRoute authenticated: granting access to protected workspace");
    return <>{children}</>;
  }

  // If wallet is connecting, show connecting state
  if (connecting) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-slate-300 gap-3">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-medium">Connecting to Cardano wallet extension...</p>
      </div>
    );
  }

  // If not authenticated, show friendly connection & sign-in card
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/90 border border-white/10 text-center space-y-6 shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10">
          <Wallet className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Wallet Connection Required</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            {connected
              ? "Your wallet is connected. Please sign the authentication message to access your escrow workspace."
              : "Connect your Cardano wallet (Lace, Nami, or Eternl) to access EscrowAI smart contracts and workspace."}
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex justify-center">
            <WalletButton />
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white transition-colors pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}


