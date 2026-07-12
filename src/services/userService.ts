"use client";

import { apiClient } from "./api.js";
import type { APIResponse } from "../../backend/src/types/index.js";

interface UserResponse {
  id: string;
  walletAddress: string;
  username: string;
  role: "CLIENT" | "FREELANCER" | "ADMIN";
  token?: string;
}

export async function createUser(data: {
  walletAddress: string;
  username: string;
  email?: string;
  role: "CLIENT" | "FREELANCER";
}) {
  const response = await apiClient.post<APIResponse<UserResponse>>("/users", data);
  if (response.data?.token) {
    apiClient.setToken(response.data.token);
  }
  return response.data;
}

export async function getUserByWallet(walletAddress: string) {
  return apiClient.get<APIResponse<UserResponse>>(`/users/wallet/${walletAddress}`);
}

export async function getAuthenticatedUser() {
  return apiClient.get<APIResponse<UserResponse>>("/users/me");
}
