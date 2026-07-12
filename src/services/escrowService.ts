"use client";

import { apiClient } from "./api.js";
import type { APIResponse } from "../../backend/src/types/index.js";

export async function createEscrow(data: {
  projectId: string;
  amount: string;
  escrowAddress?: string;
}) {
  return apiClient.post<APIResponse>("/escrow/create", data);
}

export async function getEscrow(projectId: string) {
  return apiClient.get<APIResponse>(`/escrow/${projectId}`);
}

export async function updateEscrowStatus(
  projectId: string,
  status: string
) {
  return apiClient.put<APIResponse>(`/escrow/${projectId}/status`, { status });
}

export async function submitWork(data: {
  projectId: string;
  description: string;
  githubUrl?: string;
  fileUrl?: string;
}) {
  return apiClient.post<APIResponse>("/submissions", data);
}

export async function getSubmission(projectId: string) {
  return apiClient.get<APIResponse>(`/submissions/${projectId}`);
}

export async function recordTransaction(data: {
  projectId: string;
  txHash: string;
  type: "DEPOSIT" | "LOCK" | "RELEASE" | "REFUND" | "PENALTY";
  amount: string;
}) {
  return apiClient.post<APIResponse>("/transactions", data);
}

export async function getTransactionHistory(projectId: string) {
  return apiClient.get<APIResponse>(`/transactions/${projectId}`);
}
