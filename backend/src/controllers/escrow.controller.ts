import { Request, Response } from "express";
import { CreateEscrowSchema, ResolveDisputeSchema } from "../validators/index.js";
import * as escrowService from "../services/escrow.service.js";
import type { APIResponse } from "../types/index.js";
import { APIError } from "../middleware/errors.js";

export async function createEscrow(req: Request, res: Response) {
  const data = CreateEscrowSchema.parse(req.body);
  const escrow = await escrowService.createEscrow(data);

  res.status(201).json({
    success: true,
    data: escrow,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function getEscrow(req: Request, res: Response) {
  const { projectId } = req.params;
  const escrow = await escrowService.getEscrowByProjectId(projectId);

  res.json({
    success: true,
    data: escrow,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function updateEscrowStatus(req: Request, res: Response) {
  const { projectId } = req.params;
  const { status } = req.body;
  const escrow = await escrowService.updateEscrowStatus(projectId, status);

  res.json({
    success: true,
    data: escrow,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function checkReleaseEligibility(req: Request, res: Response) {
  const { projectId } = req.params;
  const eligibility = await escrowService.canReleaseEscrow(projectId);

  res.json({
    success: true,
    data: eligibility,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function resolveDispute(req: Request, res: Response) {
  if (!req.userId) {
    throw new APIError(401, "Authentication required");
  }

  const { projectId } = req.params;
  const data = ResolveDisputeSchema.parse(req.body);

  const result = await escrowService.resolveDispute(
    req.userId,
    projectId,
    data
  );

  res.json({
    success: true,
    data: result,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}
