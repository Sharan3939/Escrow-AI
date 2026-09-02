"use client";

import { useWallet } from "@meshsdk/react";
import { useState, useEffect } from "react";
import { LogOut, Wallet } from "lucide-react";
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

export function WalletButton() {
  const { connect, disconnect, connected, connecting, name, wallet } = useWallet();
  const [showWallets, setShowWallets] = useState(false);
  const [authConnecting, setAuthConnecting] = useState(false);
  const { login, logout, isAuthenticated } = useAuthStore();

  const availableWallets = [
    { id: "nami", label: "Nami" },
    { id: "eternl", label: "Eternl" },
    { id: "lace", label: "Lace" },
  ];

  // Auto-connect if token exists
  useEffect(() => {
    const token = localStorage.getItem("escrow_ai_token");
    if (token && !connected) {
      apiClient.setToken(token);
    }
  }, [connected]);

  const handleConnect = async (walletId: string) => {
    try {
      setAuthConnecting(true);
      setShowWallets(false);
      await connect(walletId);
    } catch (error) {
      console.error("Wallet connection failed:", error);
      alert(`Failed to connect to ${walletId}.`);
      setAuthConnecting(false);
    }
  };

  useEffect(() => {
    // If wallet connected but not authenticated yet
    const authenticate = async () => {
      if (connected && wallet && authConnecting) {
        try {
          const addresses = await wallet.getUsedAddresses();
          if (!addresses || addresses.length === 0) throw new Error("No addresses found");
          const walletAddress = addresses[0];

          // 1. Get nonce
          const { data: { nonce } } = await apiClient.get<NonceResponse>(`/auth/nonce/${walletAddress}`);

          // 2. Sign nonce
          const signature = await wallet.signData(walletAddress, nonce);

          // 3. Verify signature
          const { data: { token, user } } = await apiClient.post<AuthResponse>("/auth/verify", {
            walletAddress,
            signature: signature.signature,
            key: signature.key,
          });

          // 4. Save token and user
          apiClient.setToken(token);
          login(user);
          setAuthConnecting(false);
        } catch (error) {
          console.error("Authentication failed:", error);
          alert("Authentication failed. Please try again.");
          disconnect();
          setAuthConnecting(false);
        }
      }
    };
    authenticate();
  }, [connected, wallet, authConnecting, disconnect]);

  const handleDisconnect = () => {
    disconnect();
    apiClient.clearToken();
    logout();
  };

  if (connected) {
    return (
      <button
        onClick={handleDisconnect}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700 text-sm font-medium"
      >
        <LogOut className="w-4 h-4" />
        Disconnect {name}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowWallets(!showWallets)}
        disabled={connecting || authConnecting}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors border border-blue-500 text-sm font-medium disabled:opacity-50"
      >
        <Wallet className="w-4 h-4" />
        {connecting || authConnecting ? "Connecting..." : "Connect Wallet"}
      </button>

      {showWallets && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
          <div className="p-2 space-y-1">
            {availableWallets.map((w) => (
              <button
                key={w.id}
                onClick={() => handleConnect(w.id)}
                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-md transition-colors"
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
