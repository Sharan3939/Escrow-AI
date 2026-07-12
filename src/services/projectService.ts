"use client";

import { apiClient } from "./api.js";
import type { APIResponse } from "../../backend/src/types/index.js";

export async function createProject(data: {
  title: string;
  description: string;
  budget: string;
  deadline: string;
}) {
  return apiClient.post<APIResponse>("/projects", data);
}

export async function getProjects(filters?: { status?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  return apiClient.get<APIResponse>(
    `/projects${params.size > 0 ? `?${params}` : ""}`
  );
}

export async function getProjectById(id: string) {
  return apiClient.get<APIResponse>(`/projects/${id}`);
}

export async function updateProject(
  id: string,
  data: {
    title?: string;
    description?: string;
    budget?: string;
    deadline?: string;
  }
) {
  return apiClient.put<APIResponse>(`/projects/${id}`, data);
}
