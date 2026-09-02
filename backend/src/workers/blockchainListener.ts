import prisma from "../config/database.js";
import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import { config } from "../config/index.js";

const projectId = config.cardano?.blockfrostProjectId || process.env.BLOCKFROST_PROJECT_ID || process.env.BLOCKFROST_API_KEY || "";
const isPlaceholderKey = !projectId || projectId.includes("placeholder") || projectId.includes("your-");

let blockfrost: BlockFrostAPI | null = null;
if (!isPlaceholderKey) {
  try {
    blockfrost = new BlockFrostAPI({
      projectId,
    });
  } catch (err: any) {
    console.warn("[Blockchain Listener] Failed to initialize Blockfrost client:", err.message);
  }
}

export const checkPendingTransactions = async () => {
  if (isPlaceholderKey || !blockfrost) {
    // Standby mode: do not spam logs or fail
    return;
  }

  console.log("[Blockchain Listener] Checking pending blockchain transactions...");

  try {
    const pendingTxs = await prisma.transaction.findMany({
      where: { status: "PENDING" },
      include: { project: { include: { escrow: true } } },
    });

    for (const tx of pendingTxs) {
      try {
        const bfTx = await blockfrost.txs(tx.txHash);

        if (bfTx) {
          // Transaction confirmed
          await prisma.transaction.update({
            where: { id: tx.id },
            data: {
              status: "CONFIRMED",
              blockNumber: bfTx.block_height,
              timestamp: new Date(bfTx.block_time * 1000),
              confirmedAt: new Date(),
            },
          });

          // Update Escrow status if it's a LOCK or RELEASE
          if (tx.project?.escrow) {
            let escrowStatus = tx.project.escrow.status;
            let blockchainStatus = "CONFIRMED";
            let updateData: any = { blockchainStatus };

            if (tx.type === "LOCK") {
              escrowStatus = "LOCKED";
              updateData.status = escrowStatus;
              updateData.fundedAt = new Date();
            } else if (tx.type === "RELEASE") {
              escrowStatus = "RELEASED";
              updateData.status = escrowStatus;
              updateData.releasedAt = new Date();
            }

            await prisma.escrow.update({
              where: { id: tx.project.escrow.id },
              data: updateData,
            });
            console.log(`[Blockchain Listener] Updated Escrow ${tx.project.escrow.id} to ${escrowStatus}`);
          }
        }
      } catch (e: any) {
        if (e.status_code === 404) {
          // Check if it's been pending for more than 1 hour
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          if (tx.createdAt < oneHourAgo) {
            await prisma.transaction.update({
              where: { id: tx.id },
              data: { status: "FAILED" },
            });
            console.log(`[Blockchain Listener] Transaction ${tx.txHash} marked as FAILED (timeout)`);
          }
        } else {
          console.error(`[Blockchain Listener] Error checking tx ${tx.txHash}:`, e.message);
        }
      }
    }
  } catch (error: any) {
    console.error("[Blockchain Listener] Error querying pending transactions:", error.message);
  }
};

// Start polling
export const startBlockchainListener = () => {
  if (isPlaceholderKey) {
    console.log("ℹ️  [Blockchain Listener] Standby mode: Valid BLOCKFROST_PROJECT_ID required for live Cardano synchronization.");
    return;
  }
  const INTERVAL = 2 * 60 * 1000;
  setInterval(checkPendingTransactions, INTERVAL);
  console.log("🚀 [Blockchain Listener] Polling started (interval: 2m).");
};
