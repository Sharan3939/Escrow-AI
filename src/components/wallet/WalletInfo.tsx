"use client";

import { useWallet, useAddress } from "@meshsdk/react";
import { useEffect, useState } from "react";

export function WalletInfo() {
  const { connected, wallet } = useWallet();
  const address = useAddress();
  const [balance, setBalance] = useState<string>("0");

  useEffect(() => {
    let isMounted = true;

    async function fetchBalance() {
      if (connected && wallet) {
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
          if (isMounted) {
            setBalance(isNaN(adaNum) ? "0.00" : adaNum.toFixed(2));
          }
        } catch (error) {
          console.error("Wallet balance fetch failed:", error);
        }
      }
    }

    fetchBalance();

    return () => {
      isMounted = false;
    };
  }, [connected, wallet]);

  if (!connected) return null;

  return (
    <div className="flex items-center gap-4 bg-slate-800/60 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-inner">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
          Connected
        </span>
        <span className="text-xs font-mono text-cyan-300">
          {address ? `${address.slice(0, 9)}...${address.slice(-6)}` : "Loading..."}
        </span>
      </div>

      <div className="h-6 w-px bg-slate-700/80"></div>

      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
          Balance
        </span>
        <span className="text-xs font-semibold text-emerald-400">
          {balance} ADA
        </span>
      </div>
    </div>
  );
}