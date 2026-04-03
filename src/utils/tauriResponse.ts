import { invoke } from "@tauri-apps/api/core";
import type { ApiResponse } from "@/types/api";

export function parseTauriResponse<T>(responseText: string): ApiResponse<T> {
  return JSON.parse(responseText) as ApiResponse<T>;
}

export async function invokeTauriResponse<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<ApiResponse<T>> {
  const responseText = await invoke<string>(command, args);
  return parseTauriResponse<T>(responseText);
}

export function extractProxyList<T>(
  payload: { proxies?: T[] } | T[] | null | undefined,
): T[] {
  if (!payload) {
    return [];
  }

  return Array.isArray(payload) ? payload : payload.proxies ?? [];
}
