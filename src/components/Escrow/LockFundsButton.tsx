"use client";

import { useWallet } from "@meshsdk/react";
import { Transaction, BrowserWallet } from "@meshsdk/core";
import { useState } from "react";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/src/services/api";
import {
  getEscrowScriptAddress,
  getPubKeyHashFromAddress,
  buildEscrowDatum,
} from "@/src/utils/cardano";

interface LockFundsButtonProps {
  projectId: string;
  escrowId: string;
  amount: number;
  freelancerAddress?: string;
  onSuccess?: (txHash: string) => void;
}

export function LockFundsButton({
  projectId,
  escrowId,
  amount,
  freelancerAddress,
  onSuccess,
}: LockFundsButtonProps) {
  const { wallet, connected, name } = useWallet();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const lockFunds = async () => {
    if (!connected) {
      setError("Please connect your Cardano wallet first.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setTxHash(null);

      setStep("Acquiring active wallet instance...");
      let activeWallet: any = wallet;
      if (!activeWallet) {
        const walletKey = (name || (typeof window !== "undefined" ? localStorage.getItem("escrow_ai_wallet_name") : null) || "lace").toLowerCase();
        activeWallet = await BrowserWallet.enable(walletKey);
      }

      setStep("Resolving client address & keys...");
      const usedAddresses = await activeWallet.getUsedAddresses();
      if (!usedAddresses || usedAddresses.length === 0) {
        throw new Error("No addresses found in connected wallet.");
      }
      const clientAddress = usedAddresses[0];

      // 1. Verify network ID
      const networkId = await activeWallet.getNetworkId();
      if (networkId !== 0) {
        console.warn("[LOCK FUNDS] Notice: Wallet network ID is", networkId, "(0 = Preview Testnet)");
      }

      // 2. Verify UTxOs and available balance
      const utxos = await activeWallet.getUtxos();
      if (!utxos || utxos.length === 0) {
        throw new Error(
          "Your connected wallet has no spendable UTxOs on Cardano Preview Testnet. Please fund your wallet with Preview test ADA."
        );
      }

      const totalLovelace = utxos.reduce((sum: bigint, u: any) => {
        const l = u.output.amount.find((a: any) => a.unit === "lovelace");
        return sum + (l ? BigInt(l.quantity) : BigInt(0));
      }, BigInt(0));

      const lovelaceAmount = Math.round(amount * 1_000_000);
      const requiredLovelace = BigInt(lovelaceAmount) + BigInt(2_000_000); // escrow amount + ~2 ADA buffer for fees and change output


      if (totalLovelace < requiredLovelace) {
        const availableAda = (Number(totalLovelace) / 1_000_000).toFixed(2);
        throw new Error(
          `Insufficient ADA balance: Wallet has ${availableAda} ADA, but ${amount} ADA + transaction fee (~2 ADA) is required.`
        );
      }

      // 3. Derive 28-byte payment key hashes
      const clientPubKeyHash = getPubKeyHashFromAddress(clientAddress);
      if (!clientPubKeyHash || clientPubKeyHash.length !== 56) {
        throw new Error(
          `Could not derive 28-byte payment key hash from client address (${clientAddress}).`
        );
      }

      const targetFreelancerAddress = freelancerAddress || clientAddress;
      const freelancerPubKeyHash = getPubKeyHashFromAddress(targetFreelancerAddress);
      if (!freelancerPubKeyHash || freelancerPubKeyHash.length !== 56) {
        throw new Error(
          `Could not derive 28-byte payment key hash from freelancer address (${targetFreelancerAddress}).`
        );
      }

      // 4. Resolve Aiken Plutus V3 script address
      setStep("Resolving Aiken Plutus V3 escrow script address...");
      const scriptAddress = getEscrowScriptAddress(0); // 0 = Preview testnet

      const deadlineMs = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

      // 5. Construct Escrow Datum
      setStep("Generating Plutus Escrow Datum...");
      const datum = buildEscrowDatum(
        clientPubKeyHash,
        freelancerPubKeyHash,
        lovelaceAmount,
        deadlineMs
      );

      // 6. Safe Debug Context
      console.log("[LOCK FUNDS DEBUG] Safe Tx Context:", {
        walletAddress: clientAddress,
        network: networkId === 0 ? "Cardano Preview (testnet)" : `Network ID ${networkId}`,
        balanceAda: (Number(totalLovelace) / 1_000_000).toFixed(2),
        utxoCount: utxos.length,
        escrowAmountAda: amount,
        scriptAddress: scriptAddress,
        transactionOutputValue: `${lovelaceAmount} lovelace`,
        datumSummary: {
          alternative: datum.alternative,
          fieldsCount: datum.fields.length,
          clientPkhPrefix: clientPubKeyHash.slice(0, 8) + "...",
          freelancerPkhPrefix: freelancerPubKeyHash.slice(0, 8) + "...",
        },
      });

      // 7. Construct Transaction
      setStep("Building Cardano Plutus V3 transaction...");
      try {
        await apiClient.post("/cardano/escrow-status", {
          escrowId,
          txHash: null,
          status: "USER_SIGNING",
        });
      } catch (e) {
        console.warn("Could not notify backend of USER_SIGNING:", e);
      }

      const tx = new Transaction({ initiator: activeWallet as any }).sendAssets(
        {
          address: scriptAddress,
          datum: {
            value: datum,
            inline: true,
          },
        },
        [{ unit: "lovelace", quantity: lovelaceAmount.toString() }]
      );

      const changeAddress = await activeWallet.getChangeAddress();
      if (changeAddress) {
        tx.setChangeAddress(changeAddress);
      }

      try {
        setStep("Building unsigned transaction...");
        const unsignedTx = await tx.build();

        setStep("Awaiting wallet signature in extension...");
        const signedTx = await activeWallet.signTx(unsignedTx, false);

        setStep("Submitting transaction to Cardano blockchain...");
        const submittedTxHash = await activeWallet.submitTx(signedTx);
        setTxHash(submittedTxHash);
        setStep("Submitted! Updating backend records...");

        // Update backend records
        try {
          await apiClient.post("/cardano/escrow-status", {
            escrowId,
            txHash: submittedTxHash,
            status: "LOCKED",
          });

          await apiClient.post("/transactions", {
            projectId,
            txHash: submittedTxHash,
            type: "LOCK",
            amount: amount.toString(),
          });
        } catch (e) {
          console.warn("Backend record update note:", e);
        }

        if (onSuccess) {
          onSuccess(submittedTxHash);
        }
      } catch (error) {
        console.error("LOCK FUNDS TRANSACTION ERROR:", error);
        console.error("ERROR MESSAGE:", error instanceof Error ? error.message : error);
        console.error("ERROR STACK:", error instanceof Error ? error.stack : undefined);
        throw error;
      }
    } catch (err: any) {
      console.error("Lock ADA error:", err);
      setError(err.message || "Transaction failed or rejected by wallet user.");
      try {
        await apiClient.post("/cardano/escrow-status", {
          escrowId,
          txHash: null,
          status: "FAILED",
        });
      } catch (_) {}
    } finally {
      setLoading(false);
      setStep("");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={lockFunds}
        disabled={loading || !connected}
        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{step || "Processing..."}</span>
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            <span>Lock {amount} ADA in Aiken Escrow</span>
          </>
        )}
      </button>

      {txHash && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="overflow-hidden">
            <p className="font-semibold">Funds locked successfully on Cardano!</p>
            <p className="font-mono truncate">Tx: {txHash}</p>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 bg-red-950/30 border border-red-500/30 p-2.5 rounded-lg">
          {error}
        </p>
      )}
    </div>
  );
}

