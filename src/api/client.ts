/**
 * HTTP API Client
 *
 * Base HTTP client for calling api.mefrp.com directly from the frontend.
 * Uses native fetch(). Note: some endpoints (e.g. /api/public/statistics)
 * may have CORS restrictions. Traffic stats is routed through Rust backend.
 */

import type { ApiResponse } from "@/types/api";

export const API_BASE_URL = "https://api.mefrp.com";

/** 请求总超时（毫秒），避免网络挂起时请求永久 pending */
const REQUEST_TIMEOUT_MS = 30_000;

/** 网络错误/5xx 的最大重试次数 */
const MAX_RETRIES = 2;

export class ApiError extends Error {
  code: number;
  details?: unknown;

  constructor(code: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 带超时的 fetch（30s），供系统内其它裸 fetch 调用点复用 */
export async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["authorization"] = `Bearer ${token}`;
  }

  const options: RequestInit = { method, headers };
  if (body !== undefined && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const url = `${API_BASE_URL}${path}`;

  // 仅幂等请求（GET）在失败时自动重试；
  // POST/PUT/DELETE 等非幂等操作（创建隧道、CDK 兑换、签到等）不重试，
  // 避免网络抖动导致请求重复提交造成重复扣减/重复奖励
  const isIdempotent = method === "GET";

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(url, options);

      if (res.status >= 500 && isIdempotent && attempt < MAX_RETRIES) {
        await delay(500 * 2 ** attempt);
        continue;
      }

      const json: ApiResponse<T> = await res.json();

      if (json.code !== 200) {
        throw new ApiError(json.code, json.message || "API request failed", json.data);
      }

      return json;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // 非幂等操作失败直接抛出，不重试
      if (!isIdempotent) {
        throw error;
      }

      lastError = error;

      if (attempt < MAX_RETRIES) {
        await delay(500 * 2 ** attempt);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("网络请求失败，请检查网络连接后重试");
}

export async function apiGet<T>(path: string, token?: string): Promise<ApiResponse<T>> {
  return request<T>("GET", path, undefined, token);
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  token?: string,
): Promise<ApiResponse<T>> {
  return request<T>("POST", path, body, token);
}
