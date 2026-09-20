"use client";

import { useWallet } from "@meshsdk/react";
import { BrowserWallet } from "@meshsdk/core";
import { useState, useEffect, useCallback, useRef } from "react";
import { LogOut, Wallet, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { apiClient } from "@/src/services/api";
import { useAuthStore } from "@/src/store/useAuthStore";

interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: any;
  };
}

interface NonceResponse {
  success: boolean;
  data: {
    nonce: string;
  };
}

async function resolveWalletAddress(w: any): Promise<string> {
  try {
    const used = await w.getUsedAddresses();
    if (used && used.length > 0) return used[0];
  } catch (_) {}
  try {
    const unused = await w.getUnusedAddresses();
    if (unused && unused.length > 0) return unused[0];
  } catch (_) {}
  try {
    const reward = await w.getRewardAddresses();
    if (reward && reward.length > 0) return reward[0];
  } catch (_) {}
  try {
    const change = await w.getChangeAddress?.();
    if (change) return change;
  } catch (_) {}
  throw new Error("No addresses found in connected wallet.");
}

export function WalletButton() {
  const { connect, disconnect, connected, connecting, name, wallet } = useWallet();
  const [showWallets, setShowWallets] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string>("");
  const isAuthInProgress = useRef(false);

  const { login, logout, isAuthenticated, user, isHydrated } = useAuthStore();

  const availableWallets = [
    { id: "lace", label: "Lace" },
    { id: "nami", label: "Nami" },
    { id: "eternl", label: "Eternl" },
  ];

  // 1. Auto-reconnect saved wallet on mount / page navigation
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedWallet = localStorage.getItem("escrow_ai_wallet_name");
    if (savedWallet && !connected && !connecting) {
      console.log("[Wallet] Auto-reconnecting to:", savedWallet);
      connect(savedWallet).catch((err) => {
        console.warn("[Wallet] Auto-reconnect failed:", err);
      });
    }
  }, [connected, connecting, connect]);

  // 2. Synchronize token with apiClient if token exists
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("escrow_ai_token");
    if (token) {
      apiClient.setToken(token);
    }
  }, [isAuthenticated]);

  // 3. Authenticate with backend whenever wallet connects or user clicks Sign In
  const authenticateWallet = useCallback(async () => {
    if (isAuthInProgress.current) return;

    try {
      isAuthInProgress.current = true;
      setIsAuthenticating(true);
      setAuthError(null);

      const walletKey = (name || (typeof window !== "undefined" ? localStorage.getItem("escrow_ai_wallet_name") : null) || "lace").toLowerCase();
      const cardano = typeof window !== "undefined" ? (window as any).cardano : undefined;

      // 1. Provider detection
      if (cardano && cardano[walletKey]) {
        const displayName = walletKey === "lace" ? "Lace" : walletKey.charAt(0).toUpperCase() + walletKey.slice(1);
        console.log(`[AUTH DEBUG] ${displayName} provider detected`);
      }

      // 2. Re-enable provider to ensure fresh, non-stale wallet API instance
      const displayName = walletKey === "lace" ? "Lace" : walletKey.charAt(0).toUpperCase() + walletKey.slice(1);
      console.log(`[AUTH DEBUG] ${displayName} provider enabled`);
      
      let activeWallet: any = null;
      try {
        activeWallet = await BrowserWallet.enable(walletKey);
        console.log("[AUTH DEBUG] wallet API acquired");
      } catch (enableErr) {
        console.warn("[AUTH DEBUG] BrowserWallet.enable fallback to context wallet:", enableErr);
        if (wallet) {
          activeWallet = wallet;
          console.log("[AUTH DEBUG] wallet API acquired");
        } else {
          throw enableErr;
        }
      }

      // 3. Resolve address
      const walletAddress = await resolveWalletAddress(activeWallet);
      setResolvedAddress(walletAddress);
      console.log("[AUTH DEBUG] wallet address resolved:", walletAddress);

      // If we already have a valid token and user matching this address, keep session
      const storedToken = localStorage.getItem("escrow_ai_token");
      if (storedToken && user && user.walletAddress === walletAddress && isAuthenticated) {
        apiClient.setToken(storedToken);
        console.log("[AUTH DEBUG] existing active session restored for:", walletAddress);
        setIsAuthenticating(false);
        isAuthInProgress.current = false;
        return;
      }

      // 4. Request Nonce
      console.log(`[AUTH DEBUG] requesting nonce from /api/auth/nonce/${walletAddress}`);
      const nonceRes: any = await apiClient.get<NonceResponse>(`/auth/nonce/${walletAddress}`);
      const nonce = nonceRes?.data?.nonce || nonceRes?.nonce;
      if (!nonce) throw new Error("Failed to retrieve nonce from authentication server");
      console.log("[AUTH DEBUG] nonce received:", nonce);

      // 5. Trigger CIP-30 signData
      console.log("[AUTH DEBUG] calling signData now");
      let signature: any = null;
      try {
        signature = await activeWallet.signData(nonce, walletAddress);
        console.log("[AUTH DEBUG] signData returned:", signature);
      } catch (signErr: any) {
        console.error("[AUTH DEBUG] signData exception:", signErr);
        throw signErr;
      }

      if (!signature || !signature.signature || !signature.key) {
        throw new Error("Wallet did not return a valid signature and key");
      }

      // 6. Verify signature with backend
      console.log("[AUTH DEBUG] verify request sent to /api/auth/verify");
      const verifyRes: any = await apiClient.post<AuthResponse>("/auth/verify", {
        walletAddress,
        signature: signature.signature,
        key: signature.key,
        nonce,
      });
      console.log("[AUTH DEBUG] verify response:", verifyRes);

      const token = verifyRes?.data?.token || verifyRes?.token;
      const authenticatedUser = verifyRes?.data?.user || verifyRes?.user;

      if (!token || !authenticatedUser) {
        throw new Error("Invalid response from authentication server");
      }

      // 7. Store JWT and update auth store
      apiClient.setToken(token);
      console.log("[AUTH DEBUG] JWT stored in localStorage and apiClient");
      login(authenticatedUser);
      console.log("[AUTH DEBUG] auth store logged in:", authenticatedUser.username);
    } catch (error: any) {
      console.error("[AUTH DEBUG] Authentication error:", error);
      const msg = error?.error || error?.message || "Wallet signature / authentication failed";
      setAuthError(msg);
    } finally {
      setIsAuthenticating(false);
      isAuthInProgress.current = false;
    }
  }, [wallet, name, user, isAuthenticated, login]);

  // Trigger address resolution and authentication when connected
  useEffect(() => {
    if (connected && wallet) {
      resolveWalletAddress(wallet)
        .then((addr) => {
          setResolvedAddress(addr);
          const storedToken = localStorage.getItem("escrow_ai_token");
          if (!isAuthenticated || !storedToken || (user && user.walletAddress !== addr)) {
            authenticateWallet();
          }
        })
        .catch((err) => {
          console.warn("[Wallet] Address resolution note:", err);
        });
    } else {
      setResolvedAddress("");
    }
  }, [connected, wallet, isAuthenticated, user, authenticateWallet]);

  const handleConnect = async (walletId: string) => {
    try {
      setAuthError(null);
      setShowWallets(false);
      localStorage.setItem("escrow_ai_wallet_name", walletId);
      await connect(walletId);
    } catch (error: any) {
      console.error("Wallet connection failed:", error);
      alert(`Failed to connect to ${walletId}: ${error?.message || "Unknown error"}`);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    if (typeof window !== "undefined") {
      localStorage.removeItem("escrow_ai_token");
      localStorage.removeItem("escrow_ai_wallet_name");
    }
    apiClient.clearToken();
    logout();
    setResolvedAddress("");
    setAuthError(null);
  };

  const handleRoleSwitch = async (newRole: "CLIENT" | "FREELANCER") => {
    if (!isAuthenticated || !user) return;
    try {
      const res: any = await apiClient.put("/users/role", { role: newRole });
      if (res?.data?.user) {
        login(res.data.user);
        if (res.data.token) {
          apiClient.setToken(res.data.token);
          if (typeof window !== "undefined") {
            localStorage.setItem("escrow_ai_token", res.data.token);
          }
        }
      }
    } catch (err) {
      console.error("Failed to switch role:", err);
    }
  };

  if (connected) {
    const displayAddr =
      resolvedAddress || (user?.walletAddress ? user.walletAddress : "");
    const formattedAddr = displayAddr
      ? `${displayAddr.slice(0, 8)}...${displayAddr.slice(-4)}`
      : name || "Connected";

    const currentRole = (user?.role || "CLIENT").toUpperCase();
    const isClient = currentRole === "CLIENT";

    return (
      <div className="flex items-center gap-2">
        {isAuthenticating ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-xs text-cyan-300 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>Check Lace popup to sign...</span>
          </div>
        ) : !isAuthenticated ? (
          <button
            type="button"
            onClick={() => authenticateWallet()}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-md shadow-cyan-500/20"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sign In with Wallet</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 bg-slate-900 border border-white/10 rounded-xl p-1 text-xs">
            {/* Role Badge / Switcher */}
            <button
              type="button"
              onClick={() => handleRoleSwitch(isClient ? "FREELANCER" : "CLIENT")}
              title={`Active role: ${currentRole}. Click to switch to ${isClient ? "FREELANCER" : "CLIENT"}`}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                isClient
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
              }`}
            >
              {currentRole}
            </button>

            {/* Wallet Address */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 font-mono text-slate-300">
              <div className={`w-2 h-2 rounded-full ${isClient ? "bg-cyan-400" : "bg-emerald-400"}`} />
              <span className="text-[11px]">{formattedAddr}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleDisconnect}
          title="Disconnect wallet"
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors border border-slate-700 text-xs font-medium cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Disconnect</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowWallets(!showWallets)}
        disabled={connecting || isAuthenticating}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl transition-all border border-cyan-500/30 text-xs font-semibold shadow-lg shadow-cyan-500/10 disabled:opacity-50 cursor-pointer"
      >
        {connecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            <span>Connect Wallet</span>
          </>
        )}
      </button>

      {showWallets && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 p-1.5 space-y-1 backdrop-blur-xl">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Select Cardano Wallet
          </div>
          {availableWallets.map((w) => (
            <button
              key={w.id}
              onClick={() => handleConnect(w.id)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-200 hover:bg-white/10 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <span>{w.label}</span>
              <span className="text-[10px] text-cyan-400 font-mono">CIP-30</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

