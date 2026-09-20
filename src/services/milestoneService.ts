"use client";

import { apiClient } from "./api";

export interface APIResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
}

export interface MilestoneEligibilityResponse {
  canRelease: boolean;
  reason?: string;
  details?: {
    milestoneExists: boolean;
    isFunded: boolean;
    hasSubmission: boolean;
    aiStatus: string;
    clientReviewStatus: string;
    isDisputed: boolean;
    hasFreelancerAddress: boolean;
    alreadyReleased: boolean;
    freelancerAddress?: string;
    amount?: number;
    milestoneTitle?: string;
  };
}

export async function getMilestones(projectId: string) {
  return apiClient.get<APIResponse<any[]>>(`/milestones/project/${projectId}`);
}

export async function getMilestone(milestoneId: string) {
  return apiClient.get<APIResponse<any>>(`/milestones/${milestoneId}`);
}

export async function checkMilestoneCanRelease(milestoneId: string) {
  return apiClient.get<APIResponse<MilestoneEligibilityResponse>>(
    `/milestones/${milestoneId}/can-release`
  );
}

export async function submitMilestoneWork(
  milestoneId: string,
  data: {
    description: string;
    githubUrl?: string;
    fileUrl?: string;
  }
) {
  return apiClient.post<APIResponse>(`/milestones/${milestoneId}/submit`, data);
}

export async function reviewMilestone(
  milestoneId: string,
  action: "APPROVE" | "REQUEST_REVISION" | "DISPUTE",
  feedback?: string
) {
  return apiClient.post<APIResponse>(`/milestones/${milestoneId}/review`, {
    action,
    feedback,
  });
}

export async function recordMilestoneRelease(
  milestoneId: string,
  txHash: string
) {
  return apiClient.post<APIResponse>(`/milestones/${milestoneId}/release`, {
    txHash,
  });
}
