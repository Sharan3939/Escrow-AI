"use client";

import axios, { AxiosInstance, AxiosError } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class APIClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError<Record<string, unknown>>) => {
        console.error("[API Error]", error.response?.data);
        throw error.response?.data || error;
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("escrow_ai_token");
    }
    return this.token;
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("escrow_ai_token", token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("escrow_ai_token");
    }
  }

  get<T = Record<string, unknown>>(url: string) {
    return this.client.get<Record<string, unknown>, T>(url);
  }

  post<T = Record<string, unknown>>(url: string, data?: Record<string, unknown>) {
    return this.client.post<Record<string, unknown>, T>(url, data);
  }

  put<T = Record<string, unknown>>(url: string, data?: Record<string, unknown>) {
    return this.client.put<Record<string, unknown>, T>(url, data);
  }

  delete<T = Record<string, unknown>>(url: string) {
    return this.client.delete<Record<string, unknown>, T>(url);
  }
}

export const apiClient = new APIClient();
