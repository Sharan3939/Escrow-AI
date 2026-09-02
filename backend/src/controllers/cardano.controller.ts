import { Request, Response } from "express";
import { cardanoService } from "../services/cardano.service.js";
import { APIError } from "../middleware/errors.js";
import type { APIResponse } from "../types/index.js";

export async function getBalance(req: Request, res: Response) {
  const { address } = req.params;

  if (!address) {
    throw new APIError(400, "Wallet address is required");
  }

  const balance = await cardanoService.getAddressBalance(address);

  res.json({
    success: true,
    data: { balance },
    timestamp: new Date().toISOString(),
  } as APIResponse);
}

export async function getAddressUtxos(req: Request, res: Response) {
  const { address } = req.params;

  if (!address) {
    throw new APIError(400, "Address is required");
  }

  const utxos = await cardanoService.getAddressUtxos(address);

  res.json({
    success: true,
    data: { utxos },
    timestamp: new Date().toISOString(),
  } as APIResponse);
}

export async function verifyTransaction(req: Request, res: Response) {
  const { hash } = req.params;

  if (!hash) {
    throw new APIError(400, "Transaction hash is required");
  }

  const isConfirmed = await cardanoService.verifyTransaction(hash);

  res.json({
    success: true,
    data: { isConfirmed },
    timestamp: new Date().toISOString(),
  } as APIResponse);
}

export async function updateEscrowStatus(req: Request, res: Response) {
  const { escrowId, txHash, status } = req.body;

  if (!escrowId || !status) {
    throw new APIError(400, "Missing required fields (escrowId, status)");
  }

  const updatedEscrow = await cardanoService.updateEscrowStatus(escrowId, txHash, status);

  res.json({
    success: true,
    data: updatedEscrow,
    timestamp: new Date().toISOString(),
  } as APIResponse);
}
