import { Request, Response } from "express";
import { CreateTransactionSchema } from "../validators/index.js";
import * as transactionService from "../services/transaction.service.js";
import type { APIResponse } from "../types/index.js";

export async function createTransaction(req: Request, res: Response) {
  const data = CreateTransactionSchema.parse(req.body);
  const transaction = await transactionService.createTransaction(data);

  res.status(201).json({
    success: true,
    data: transaction,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function getTransactions(req: Request, res: Response) {
  const { projectId } = req.params;
  const transactions = await transactionService.getTransactionsByProjectId(
    projectId
  );

  res.json({
    success: true,
    data: transactions,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}
