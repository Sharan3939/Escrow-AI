"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet, useAddress } from "@meshsdk/react";
import { PageShell } from "@/src/components/layout/PageShell";
import { ProtectedRoute } from "@/src/components/layout/ProtectedRoute";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { useAuthStore } from "@/src/store/useAuthStore";
import { apiClient } from "@/src/services/api";
import {
  Wallet,
  LogOut,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Coins,
  User,
  RefreshCw,
  CheckCircle2,
  Lock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function WalletPage() {
  const { connected, connecting, name, wallet, disconnect, connect } = useWallet();
  const address = useAddress();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [balance, setBalance] = useState<string>("0.00");
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchBalance = useCallback(async () => {
    if (connected && wallet) {
      setLoadingBalance(true);
      try {
        let lovelaceStr = "0";
        if (typeof (wallet as any).getLovelace === "function") {
          lovelaceStr = await (wallet as any).getLovelace();
        } else {
          const rawBalance = await wallet.getBalance();
          if (Array.isArray(rawBalance)) {
            const lovelaceAsset = rawBalance.find((a: any) => a.unit === "lovelace");
            lovelaceStr = lovelaceAsset ? lovelaceAsset.quantity : "0";
          } else if (typeof rawBalance === "string") {
            lovelaceStr = rawBalance;
          }
        }
        const adaNum = Number(lovelaceStr) / 1_000_000;
        setBalance(isNaN(adaNum) ? "0.00" : adaNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }));
      } catch (error) {
        console.error("Wallet balance fetch failed:", error);
      } finally {
        setLoadingBalance(false);
      }
    }
  }, [connected, wallet]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const handleCopyAddress = (textToCopy: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDisconnect = () => {
    disconnect();
    if (typeof window !== "undefined") {
      localStorage.removeItem("escrow_ai_token");
      localStorage.removeItem("escrow_ai_wallet_name");
    }
    apiClient.clearToken();
    logout();
  };

  const displayWalletName = name
    ? name.charAt(0).toUpperCase() + name.slice(1)
    : "Cardano Wallet";

  const activeAddress =
    address || user?.walletAddress || "";

  const shortenedAddress = activeAddress
    ? `${activeAddress.slice(0, 10)}...${activeAddress.slice(-8)}`
    : "Not Available";

  return (
    <ProtectedRoute>
      <PageShell
        title="Wallet & Security"
        subtitle="Manage your connected Cardano CIP-30 wallet, on-chain balances, and cryptographic authentication credentials."
        action={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Cardano Preview Network</span>
            </div>
          </div>
        }
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Wallet Details Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="space-y-6 border-cyan-500/20 bg-slate-900/80 shadow-2xl">
              {/* Wallet Top Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-300 shadow-lg shadow-cyan-500/10">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <span>{displayWalletName}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-medium">
                        CIP-30
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Cardano Web3 Provider
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 rounded-xl transition-all border border-rose-500/20 text-xs font-semibold cursor-pointer shadow-lg shadow-rose-500/5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect Wallet</span>
                  </button>
                </div>
              </div>

              {/* Status Pills Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Connection Status */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5">
                  <p className="text-xs text-slate-400 font-medium">Connection Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                    <span className="text-sm font-semibold text-emerald-400">
                      {connected ? "Connected & Synchronized" : "Connecting..."}
                    </span>
                  </div>
                </div>

                {/* Authentication Status */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5">
                  <p className="text-xs text-slate-400 font-medium">Authentication Status</p>
                  <div className="flex items-center gap-2">
                    {isAuthenticated ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-semibold text-cyan-300">
                          Authenticated (JWT Active)
                        </span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-semibold text-amber-300">
                          Pending Signature
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Wallet Address Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Wallet Address (Preview Network)
                  </span>
                  <span className="text-xs font-mono text-cyan-400">
                    {shortenedAddress}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/80 border border-white/10">
                  <span className="flex-1 font-mono text-xs text-slate-300 break-all select-all">
                    {activeAddress || "Resolving Cardano address..."}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyAddress(activeAddress)}
                    title="Copy full address"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Balance Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-950/60 to-violet-950/30 border border-cyan-500/20 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Available Balance</p>
                    <p className="text-2xl font-bold text-white flex items-baseline gap-1.5">
                      <span>{balance}</span>
                      <span className="text-sm font-semibold text-cyan-400">ADA</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchBalance}
                    disabled={loadingBalance}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors border border-white/10"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingBalance ? "animate-spin text-cyan-400" : ""}`} />
                    <span>Refresh Balance</span>
                  </button>
                  {activeAddress && (
                    <a
                      href={`https://preview.cardanoscan.io/address/${activeAddress}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-medium text-cyan-300 hover:text-cyan-200 transition-colors border border-cyan-500/30"
                    >
                      <span>Cardanoscan</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: User Profile & Quick Actions */}
          <div className="space-y-6">
            {/* User Profile Card */}
            <Card className="space-y-4">
              <div className="flex items-center gap-2.5">
                <User className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-semibold text-white">Authenticated Profile</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/5">
                  <span className="text-slate-400">Username</span>
                  <span className="font-semibold text-white">{user?.username || "Anonymous"}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/5">
                  <span className="text-slate-400">Role</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-semibold uppercase tracking-wider text-[10px]">
                    {user?.role || "CLIENT"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/5">
                  <span className="text-slate-400">User ID</span>
                  <span className="font-mono text-slate-300">{user?.id ? `${user.id.slice(0, 12)}...` : "Active"}</span>
                </div>
              </div>
            </Card>

            {/* Smart Contract Security Info */}
            <Card className="space-y-4 border-white/10">
              <div className="flex items-center gap-2.5">
                <Lock className="w-5 h-5 text-violet-400" />
                <h3 className="text-base font-semibold text-white">Smart Contract Escrow</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Transactions and milestone releases are executed non-custodially via Aiken Plutus V3 smart contract scripts on Cardano Preview.
              </p>

              <div className="pt-2 border-t border-white/5 space-y-2">
                <Link
                  href="/client/projects"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-white/5 text-xs text-slate-200 hover:text-white transition-all group"
                >
                  <span>Client Projects Workspace</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-white/5 text-xs text-slate-200 hover:text-white transition-all group"
                >
                  <span>Operations Overview</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </PageShell>
    </ProtectedRoute>
  );
}
