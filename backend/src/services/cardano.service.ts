import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import { config } from "../config/index.js";
import prisma from "../config/database.js";
import { isValidTransactionHash } from "../utils/cardano/transaction.utils.js";
import { validateNetwork } from "../utils/cardano/network.utils.js";

// Ensure network is preview
validateNetwork(config.cardano.network);

const isPlaceholder =
  !config.cardano.blockfrostProjectId ||
  config.cardano.blockfrostProjectId.includes("placeholder") ||
  config.cardano.blockfrostProjectId.includes("your-") ||
  config.cardano.blockfrostProjectId.includes("your_");


let blockfrost: BlockFrostAPI | null = null;
if (!isPlaceholder) {
  try {
    blockfrost = new BlockFrostAPI({
      projectId: config.cardano.blockfrostProjectId,
    });
  } catch (err: any) {
    console.warn("[Cardano Service] Failed to initialize Blockfrost:", err.message);
  }
}

export class CardanoService {
  public async getAddressBalance(address: string): Promise<number> {
    if (!blockfrost) return 0;
    try {
      const addressInfo = await blockfrost.addresses(address);
      const lovelaceBalance =
        addressInfo.amount.find((a) => a.unit === "lovelace")?.quantity || "0";
      // Convert Lovelace to ADA (1 ADA = 1,000,000 Lovelace)
      return parseInt(lovelaceBalance, 10) / 1_000_000;
    } catch (error: any) {
      if (error.status_code === 404) return 0; // Address not found or no transactions yet
      console.error(`Blockfrost error getting balance for ${address}:`, error.message);
      throw new Error("Failed to retrieve balance from blockchain");
    }
  }

  public async getAddressUtxos(address: string): Promise<any[]> {
    if (!blockfrost) return [];
    try {
      return await blockfrost.addressesUtxosAll(address);
    } catch (error: any) {
      if (error.status_code === 404) return [];
      console.error(`Blockfrost error getting UTxOs for ${address}:`, error.message);
      return [];
    }
  }

  public async verifyTransaction(hash: string): Promise<boolean> {
    if (!isValidTransactionHash(hash)) {
      throw new Error("Invalid transaction hash format");
    }

    if (!blockfrost) return false;

    try {
      const tx = await blockfrost.txs(hash);
      return tx.block_height !== null;
    } catch (error: any) {
      if (error.status_code === 404) {
        return false; // Transaction not confirmed yet
      }
      console.error(`Blockfrost error verifying tx ${hash}:`, error.message);
      throw new Error("Failed to verify transaction on blockchain");
    }
  }

  public async getTransactionDetails(hash: string): Promise<any> {
    if (!isValidTransactionHash(hash)) {
      throw new Error("Invalid transaction hash format");
    }

    if (!blockfrost) {
      throw new Error("Blockfrost is in standby mode. Real API key required.");
    }

    try {
      return await blockfrost.txs(hash);
    } catch (error: any) {
      console.error(`Blockfrost error getting tx details ${hash}:`, error.message);
      throw new Error("Failed to retrieve transaction details");
    }
  }

  public async updateEscrowStatus(
    escrowId: string,
    txHash: string | null,
    status: string
  ): Promise<any> {
    const existing = await prisma.escrow.findFirst({
      where: {
        OR: [{ id: escrowId }, { projectId: escrowId }],
      },
      include: {
        project: {
          include: {
            submissions: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            freelancer: true,
          },
        },
      },
    });

    if (!existing) {
      throw new Error(`Escrow record not found for id/projectId: ${escrowId}`);
    }

    if (status === "RELEASED") {
      if (!txHash) {
        throw new Error("Cannot mark escrow as RELEASED without a valid transaction hash.");
      }
      const submission = existing.project?.submissions[0];
      if (!submission || submission.aiVerificationStatus !== "PASS" || submission.clientReviewStatus !== "APPROVED") {
        throw new Error("Cannot mark escrow as RELEASED: Gemini AI and Client Satisfaction dual approvals are required.");
      }
    }

    const escrowStatus =
      status === "LOCKED"
        ? "LOCKED"
        : status === "RELEASED"
        ? "RELEASED"
        : undefined;

    return prisma.escrow.update({
      where: { id: existing.id },
      data: {
        transactionHash: txHash || undefined,
        blockchainStatus: status,
        status: escrowStatus,
        fundedAt: status === "LOCKED" ? new Date() : undefined,
        releasedAt: status === "RELEASED" ? new Date() : undefined,
      },
    });
  }
}

export const cardanoService = new CardanoService();
