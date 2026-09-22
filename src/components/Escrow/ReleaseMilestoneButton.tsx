"use client";

import { useWallet } from "@meshsdk/react";
import { Transaction, UTxO } from "@meshsdk/core";
import { useState } from "react";
import { CheckCircle, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { apiClient } from "@/src/services/api";
import {
  checkMilestoneCanRelease,
  recordMilestoneRelease,
} from "@/src/services/milestoneService";
import {
  escrowScript,
  getEscrowScriptAddress,
  buildReleaseRedeemer,
} from "@/src/utils/cardano";

interface ReleaseMilestoneButtonProps {
  projectId: string;
  milestoneId: string;
  milestoneTitle: string;
  amount: number;
  freelancerAddress: string;
  escrowAddress?: string;
  onSuccess?: (txHash: string, projectCompleted?: boolean) => void;
}

export function ReleaseMilestoneButton({
  projectId,
  milestoneId,
  milestoneTitle,
  amount,
  freelancerAddress,
  escrowAddress,
  onSuccess,
}: ReleaseMilestoneButtonProps) {
  const { wallet, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const releaseMilestoneFunds = async () => {
    if (loading) return;

    if (!connected || !wallet) {
      setError("Please connect your Lace Cardano wallet first.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setTxHash(null);

      // STEP 1: Strict Backend Release Eligibility Check
      setStep("Verifying milestone dual approval (AI PASS + Client Approval)...");
      const eligibilityRes = await checkMilestoneCanRelease(milestoneId);
      const eligibility = eligibilityRes.data;

      if (!eligibility || !eligibility.canRelease) {
        throw new Error(
          eligibility?.reason ||
            "Milestone is not eligible for release. Dual approval (Gemini AI PASS + Client Approval) is strictly required."
        );
      }

      const targetFreelancerAddress =
        eligibility.details?.freelancerAddress || freelancerAddress;

      if (!targetFreelancerAddress) {
        throw new Error("Freelancer Cardano address could not be resolved.");
      }

      // STEP 2: Resolve Signer and Script addresses
      setStep("Resolving client signing address from Lace wallet...");
      const usedAddresses = await wallet.getUsedAddresses();
      if (!usedAddresses || usedAddresses.length === 0) {
        throw new Error("No address found in connected Cardano wallet.");
      }
      const clientAddress = usedAddresses[0];

      setStep("Resolving Aiken Plutus V3 script address...");
      const contractAddress = escrowAddress || getEscrowScriptAddress(0);
      const lovelaceAmount = Math.round(amount * 1_000_000);

      // STEP 3: Query script UTxOs on Cardano Preview
      setStep("Querying escrow script UTxOs on Cardano Preview...");
      let scriptUtxos: UTxO[] = [];
      try {
        const res = await apiClient.get<any>(`/cardano/utxos/${contractAddress}`);
        if (res.data?.utxos) {
          scriptUtxos = res.data.utxos;
        }
      } catch (e) {
        console.warn("Backend UTxO query fallback:", e);
      }

      if (!scriptUtxos || scriptUtxos.length === 0) {
        throw new Error(
          `No spendable UTxO found at the Aiken escrow script (${contractAddress}). Please ensure the escrow is funded on Cardano Preview.`
        );
      }

      const targetUtxo =
        scriptUtxos.find((u) => {
          const lovelace = u.output.amount.find((a) => a.unit === "lovelace");
          return lovelace && Number(lovelace.quantity) >= lovelaceAmount;
        }) || scriptUtxos[0];

      // STEP 4: Build Plutus V3 Spend Transaction
      setStep(`Building Plutus V3 transaction for ${amount} ADA milestone...`);
      const redeemer = buildReleaseRedeemer();
      const tx = new Transaction({ initiator: wallet as any });

      tx.redeemValue({
        value: targetUtxo,
        script: escrowScript,
        datum: targetUtxo.output.plutusData,
        redeemer: redeemer,
      });

      // Output funds to freelancer & enforce client signature in Aiken extra_signatories
      tx.sendLovelace(targetFreelancerAddress, lovelaceAmount.toString());
      tx.setRequiredSigners([clientAddress]);

      // STEP 5: Wallet Signature
      setStep("Awaiting wallet signature in Lace extension...");
      const unsignedTx = await tx.build();
      const signedTx = await wallet.signTx(unsignedTx, false);

      // STEP 6: Submit to Blockchain
      setStep("Submitting release transaction to Cardano Preview Testnet...");
      const submittedTxHash = await wallet.submitTx(signedTx);
      setTxHash(submittedTxHash);
      setStep("Confirmed! Recording milestone settlement...");

      // STEP 7: Save transaction hash & set Milestone = RELEASED
      let releaseRes: any = null;
      try {
        releaseRes = await recordMilestoneRelease(milestoneId, submittedTxHash);

        await apiClient.post("/transactions", {
          projectId,
          txHash: submittedTxHash,
          type: "RELEASE",
          amount: amount.toString(),
        });
      } catch (e) {
        console.warn("Backend record update note:", e);
      }

      if (onSuccess) {
        onSuccess(submittedTxHash, releaseRes?.data?.projectCompleted);
      }
    } catch (err: any) {
      console.error("Release milestone error:", err);
      setError(
        err.message ||
          "Transaction construction or wallet signing failed. Please ensure wallet has collateral & network is Cardano Preview."
      );
    } finally {
      setLoading(false);
      setStep("");
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <button
        onClick={releaseMilestoneFunds}
        disabled={loading || !connected}
        className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 transition-all font-semibold text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">{step || "Processing..."}</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Sign & Release {amount} ADA for &quot;{milestoneTitle}&quot;</span>
          </>
        )}
      </button>

      {txHash && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="overflow-hidden space-y-1">
            <p className="font-semibold text-white">Milestone Payment Released on Cardano Preview!</p>
            <p className="font-mono text-cyan-300 truncate select-all">Tx: {txHash}</p>
            <a
              href={`https://preview.cardanoscan.io/transaction/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-[11px] text-cyan-400 hover:underline pt-0.5"
            >
              View on Cardanoscan →
            </a>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}
    </div>
  );
}
