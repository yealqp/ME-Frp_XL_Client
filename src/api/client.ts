/**
 * HTTP API Client
 *
 * Base HTTP client for calling api.mefrp.com directly from the frontend.
 * Uses native fetch(). Note: some endpoints (e.g. /api/public/statistics)
 * may have CORS restrictions. Traffic stats is routed through Rust backend.
 */

import type { ApiResponse } from "@/types/api";

export const API_BASE_URL = "https://api.mefrp.com";

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

  const res = await fetch(`${API_BASE_URL}${path}`, options);

  const json: ApiResponse<T> = await res.json();

  if (json.code !== 200) {
    throw new ApiError(json.code, json.message || "API request failed", json.data);
  }

  return json;
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

export async function apiPut<T>(
  path: string,
  body?: unknown,
  token?: string,
): Promise<ApiResponse<T>> {
  return request<T>("PUT", path, body, token);
}

export async function apiDelete<T>(
  path: string,
  body?: unknown,
  token?: string,
): Promise<ApiResponse<T>> {
  return request<T>("DELETE", path, body, token);
}
