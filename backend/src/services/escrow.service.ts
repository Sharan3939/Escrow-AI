import prisma from "../config/database.js";
import { APIError } from "../middleware/errors.js";
import type { CreateEscrowInput } from "../validators/index.js";

export async function createEscrow(data: CreateEscrowInput) {
  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
  });

  if (!project) {
    throw new APIError(404, "Project not found");
  }

  return prisma.escrow.create({
    data: {
      projectId: data.projectId,
      amount: parseFloat(data.amount),
      escrowAddress: data.escrowAddress,
      status: "CREATED",
    },
  });
}

export async function getEscrowByProjectId(projectId: string) {
  const escrow = await prisma.escrow.findUnique({
    where: { projectId },
    include: {
      project: true,
    },
  });

  if (!escrow) {
    throw new APIError(404, "Escrow not found");
  }

  return escrow;
}

export async function updateEscrowStatus(
  projectId: string,
  status: string
) {
  return prisma.escrow.update({
    where: { projectId },
    data: {
      status: status as "CREATED" | "FUNDED" | "LOCKED" | "RELEASED",
    },
  });
}

export async function fundEscrow(projectId: string, txHash: string) {
  return prisma.escrow.update({
    where: { projectId },
    data: {
      status: "FUNDED",
      transactionHash: txHash,
    },
  });
}
