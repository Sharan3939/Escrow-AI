"use client";

import { apiClient } from "./api";

export interface APIResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
}

export interface ReleaseEligibilityResponse {
  canRelease: boolean;
  reason?: string;
  details?: {
    escrowExists: boolean;
    isFunded: boolean;
    hasSubmission: boolean;
    aiStatus: string;
    clientReviewStatus: string;
    isDisputed: boolean;
    hasFreelancerAddress: boolean;
    alreadyReleased: boolean;
    freelancerAddress?: string;
    amount?: number;
  };
}

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

export async function checkReleaseEligibility(projectId: string) {
  return apiClient.get<APIResponse<ReleaseEligibilityResponse>>(`/escrow/${projectId}/can-release`);
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

export async function reviewSubmission(
  submissionId: string,
  action: "APPROVE" | "REQUEST_REVISION" | "DISPUTE",
  feedback?: string
) {
  return apiClient.post<APIResponse>(`/submissions/${submissionId}/review`, {
    action,
    feedback,
  });
}

export async function resolveDispute(
  projectId: string,
  decision: "RELEASE_TO_FREELANCER" | "REFUND_TO_CLIENT",
  notes?: string
) {
  return apiClient.post<APIResponse>(`/escrow/${projectId}/resolve-dispute`, {
    decision,
    notes,
  });
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
