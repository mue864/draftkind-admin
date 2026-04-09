import axios, { AxiosError } from "axios";

import type {
  AdminGuestUsage,
  AdminOverview,
  AdminPlanCatalog,
  AdminRecentRewrite,
  AdminTrendPoint,
  AdminUserDetail,
  AdminUserListItem,
  AuthResponse,
  GoogleBillingDeadLetter,
  GoogleBillingReplayResponse,
} from "../types/api";

const defaultBaseUrl = "https://api.draftkind.com";
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = configuredBaseUrl || defaultBaseUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const responseMessage =
      typeof error.response?.data?.message === "string"
        ? error.response.data.message
        : null;

    return responseMessage || error.message || "Request failed.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error.";
}

export function isForbidden(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 403;
}

export function isUnauthorized(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

export async function login(email: string, password: string) {
  const response = await api.post<AuthResponse>("/auth/login", { email, password });
  return response.data;
}

export async function getOverview() {
  const response = await api.get<AdminOverview>("/admin/overview");
  return response.data;
}

export async function getTrends(days = 14) {
  const response = await api.get<AdminTrendPoint[]>("/admin/trends", {
    params: { days },
  });

  return response.data;
}

export async function getPlanCatalog() {
  const response = await api.get<AdminPlanCatalog[]>("/admin/plans");
  return response.data;
}

export async function getUsers(query: string, limit = 24) {
  const response = await api.get<AdminUserListItem[]>("/admin/users", {
    params: {
      query: query.trim() || undefined,
      limit,
    },
  });

  return response.data;
}

export async function getUserDetail(userId: string) {
  const response = await api.get<AdminUserDetail>(`/admin/users/${userId}`);
  return response.data;
}

export async function getRecentRewrites(limit = 32) {
  const response = await api.get<AdminRecentRewrite[]>("/admin/rewrites/recent", {
    params: { limit },
  });

  return response.data;
}

export async function getGuestUsage(limit = 12) {
  const response = await api.get<AdminGuestUsage>("/admin/guest-usage", {
    params: { limit },
  });

  return response.data;
}

export async function deactivatePlan(planId: number) {
  const response = await api.put<AdminPlanCatalog>(`/subscriptions/admin/plans/${planId}/deactivate`);
  return response.data;
}

export async function getBillingDeadLetters(limit = 20, status?: string) {
  const response = await api.get<GoogleBillingDeadLetter[]>(
    "/subscriptions/admin/google-billing/dead-letters",
    {
      params: {
        limit,
        status: status || undefined,
      },
    },
  );
  return response.data;
}

export async function replayBillingDeadLetter(eventId: string) {
  const response = await api.post<GoogleBillingReplayResponse>(
    `/subscriptions/admin/google-billing/dead-letters/${eventId}/replay`,
  );
  return response.data;
}

export type ApiRequestError = AxiosError;
