import axios, { AxiosError } from "axios";

import type {
  AdminGuestUsage,
  AdminLiveActivitySnapshot,
  AdminOverview,
  AdminPlanCatalog,
  AdminProviderUsage,
  AdminRecentRewrite,
  AdminRiskSignal,
  AdminTrendPoint,
  AdminUserActivityWindow,
  AdminUserDetail,
  AdminUserListItem,
  AdminAuthSessionResponse,
  GoogleBillingDeadLetter,
  GoogleBillingReplayResponse,
  RevenueCatBillingDeadLetter,
  RevenueCatBillingReplayResponse,
  RevenueCatCatalogSyncResponse,
} from "../types/api";

const defaultBaseUrl = "https://api.draftkind.com";
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = configuredBaseUrl || defaultBaseUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let csrfToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAdminCsrfToken(token: string | null) {
  csrfToken = token;
}

/**
 * Registers a callback invoked when the API returns 401. Used by the admin
 * session provider to trigger a local sign-out when a token is revoked
 * server-side (F6) or has naturally expired.
 */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

api.interceptors.request.use((config) => {
  if (csrfToken && !isSafeMethod(config.method)) {
    config.headers["X-Admin-CSRF"] = csrfToken;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Skip /auth/logout to avoid recursion when the token is already invalid.
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      unauthorizedHandler &&
      !(error.config?.url ?? "").includes("/auth/logout")
    ) {
      try {
        unauthorizedHandler();
      } catch {
        // Swallow handler errors so the original rejection still propagates.
      }
    }
    return Promise.reject(error);
  },
);

export async function logout() {
  await api.post("/auth/admin/logout");
}

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (typeof error.response?.data === "string") {
      return error.response.data;
    }

    const responseMessage =
      typeof error.response?.data?.message === "string"
        ? error.response.data.message
        : typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : typeof error.response?.data?.title === "string"
            ? error.response.data.title
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
  const response = await api.post<AdminAuthSessionResponse>("/auth/admin/login", {
    email,
    password,
  });
  setAdminCsrfToken(response.data.csrfToken);
  return response.data;
}

export async function getAdminSession() {
  const response = await api.get<AdminAuthSessionResponse>("/auth/admin/session");
  setAdminCsrfToken(response.data.csrfToken);
  return response.data;
}

function isSafeMethod(method: string | undefined) {
  const normalized = (method ?? "get").toUpperCase();
  return normalized === "GET"
    || normalized === "HEAD"
    || normalized === "OPTIONS"
    || normalized === "TRACE";
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

export async function getUserActivity() {
  const response =
    await api.get<AdminUserActivityWindow[]>("/admin/user-activity");
  return response.data;
}

export async function getLiveActivitySnapshot(windowMinutes = 60) {
  const response = await api.get<AdminLiveActivitySnapshot>(
    "/admin/live-activity",
    {
      params: { windowMinutes },
    },
  );
  return response.data;
}

export async function getPlanCatalog() {
  const response = await api.get<AdminPlanCatalog[]>("/admin/plans");
  return response.data;
}

export async function getUsers(
  query: string,
  limit = 100,
  repeatDevice = false,
) {
  const response = await api.get<AdminUserListItem[]>("/admin/users", {
    params: {
      query: query.trim() || undefined,
      limit,
      repeatDevice: repeatDevice || undefined,
    },
  });

  return response.data;
}

export async function getUserDetail(userId: string) {
  const response = await api.get<AdminUserDetail>(`/admin/users/${userId}`);
  return response.data;
}

export async function revokePremiumPreview(userId: string) {
  const response = await api.post<AdminUserDetail>(
    `/admin/users/${userId}/premium-preview/revoke`,
  );
  return response.data;
}

export async function getUserRequests(
  userId: string,
  limit = 20,
  days?: number,
) {
  const response = await api.get<AdminRecentRewrite[]>(
    `/admin/users/${userId}/requests`,
    {
      params: {
        limit,
        days,
      },
    },
  );

  return response.data;
}

export async function getRecentRewrites(limit = 32, days?: number) {
  const response = await api.get<AdminRecentRewrite[]>(
    "/admin/rewrites/recent",
    {
      params: {
        limit,
        days,
      },
    },
  );

  return response.data;
}

export async function getRewriteProviderUsage(days = 7) {
  const response = await api.get<AdminProviderUsage[]>(
    "/admin/rewrites/provider-usage",
    {
      params: { days },
    },
  );

  return response.data;
}

export async function getGuestUsage(limit = 12) {
  const response = await api.get<AdminGuestUsage>("/admin/guest-usage", {
    params: { limit },
  });

  return response.data;
}

export async function getRiskSignals(userLimit = 50, eventLimit = 50) {
  const response = await api.get<AdminRiskSignal>("/admin/risk-signals", {
    params: {
      userLimit,
      eventLimit,
    },
  });

  return response.data;
}

export async function updateUserModeration(
  userId: string,
  payload: { accountStatus: "ACTIVE" | "SUSPENDED" | "BANNED"; reason?: string },
) {
  const response = await api.patch<AdminUserDetail>(
    `/admin/users/${userId}/moderation`,
    payload,
  );

  return response.data;
}

export async function deactivatePlan(planId: number) {
  const response = await api.put<AdminPlanCatalog>(
    `/subscriptions/admin/plans/${planId}/deactivate`,
  );
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

export async function getRevenueCatBillingDeadLetters(
  limit = 20,
  status?: string,
) {
  const response = await api.get<RevenueCatBillingDeadLetter[]>(
    "/subscriptions/admin/revenuecat-billing/dead-letters",
    {
      params: {
        limit,
        status: status || undefined,
      },
    },
  );
  return response.data;
}

export async function replayRevenueCatBillingDeadLetter(eventId: string) {
  const response = await api.post<RevenueCatBillingReplayResponse>(
    `/subscriptions/admin/revenuecat-billing/dead-letters/${eventId}/replay`,
  );
  return response.data;
}

export async function syncRevenueCatCatalog() {
  const response = await api.post<RevenueCatCatalogSyncResponse>(
    "/subscriptions/admin/revenuecat-billing/sync-catalog",
  );
  return response.data;
}

export type ApiRequestError = AxiosError;
