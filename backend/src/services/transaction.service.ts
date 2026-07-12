import prisma from "../config/database.js";
import { APIError } from "../middleware/errors.js";
import type { CreateTransactionInput } from "../validators/index.js";

export async function createTransaction(data: CreateTransactionInput) {
  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
  });

  if (!project) {
    throw new APIError(404, "Project not found");
  }

  return prisma.transaction.create({
    data: {
      projectId: data.projectId,
      txHash: data.txHash,
      type: data.type as "DEPOSIT" | "LOCK" | "RELEASE" | "REFUND" | "PENALTY",
      amount: parseFloat(data.amount),
      status: "PENDING",
    },
  });
}

export async function getTransactionsByProjectId(projectId: string) {
  return prisma.transaction.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateTransactionStatus(
  txHash: string,
  status: string,
  blockNumber?: number,
  timestamp?: Date
) {
  return prisma.transaction.update({
    where: { txHash },
    data: {
      status: status as "PENDING" | "CONFIRMED" | "FAILED",
      blockNumber,
      timestamp,
    },
  });
}
