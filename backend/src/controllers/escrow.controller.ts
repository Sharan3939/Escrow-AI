import { Request, Response } from "express";
import { CreateEscrowSchema } from "../validators/index.js";
import * as escrowService from "../services/escrow.service.js";
import type { APIResponse } from "../types/index.js";

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
