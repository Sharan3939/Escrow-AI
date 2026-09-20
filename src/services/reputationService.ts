"use client";

import { apiClient } from "./api";

export interface FreelancerProfileData {
  user: {
    id: string;
    username: string;
    walletAddress: string;
    role: string;
    bio?: string;
    profileImage?: string;
  };
  profile: {
    id: string;
    userId: string;
    totalProjects: number;
    completedProjects: number;
    successfulProjects: number;
    disputedProjects: number;
    totalRevisions: number;
    totalAdaEarned: number | string;
    averageRating: number | string;
    ratingCount: number;
    createdAt: string;
    updatedAt: string;
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
    client: {
      id: string;
      username: string;
      walletAddress: string;
    };
    project: {
      id: string;
      title: string;
      budget: number | string;
    };
  }>;
}

export async function getFreelancerProfile(userId: string) {
  return apiClient.get<{ success: boolean; data: FreelancerProfileData }>(
    `/reputation/freelancers/${userId}/profile`
  );
}

export async function getFreelancerReviews(userId: string) {
  return apiClient.get<{ success: boolean; data: any[] }>(
    `/reputation/freelancers/${userId}/reviews`
  );
}

export async function submitFreelancerReview(
  projectId: string,
  rating: number,
  comment?: string
) {
  return apiClient.post<{ success: boolean; data: any }>(
    `/reputation/projects/${projectId}/review`,
    { rating, comment }
  );
}
