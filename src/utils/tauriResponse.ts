import { invoke } from "@tauri-apps/api/core";
import type { ApiResponse } from "@/types/api";

export function parseTauriResponse<T>(responseText: string): ApiResponse<T> {
  try {
    return JSON.parse(responseText) as ApiResponse<T>;
  } catch {
    // 后端返回了非 JSON 内容（如意外错误信息），抛出带原始内容的可读错误
    const preview =
      responseText.length > 120 ? `${responseText.slice(0, 120)}…` : responseText;
    throw new Error(`后端响应解析失败: ${preview}`);
  }
}

export async function invokeTauriResponse<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<ApiResponse<T>> {
  const responseText = await invoke<string>(command, args);
  return parseTauriResponse<T>(responseText);
}

export async function invokeTauriText(
  command: string,
  args?: Record<string, unknown>,
): Promise<string> {
  return invoke<string>(command, args);
}

export function extractProxyList<T>(
  payload: { proxies?: T[] } | T[] | null | undefined,
): T[] {
  if (!payload) {
    return [];
  }

  return Array.isArray(payload) ? payload : payload.proxies ?? [];
}
