/**
 * 统一的错误处理工具
 * 用于处理 ME-Frp API 调用的错误
 */

/**
 * 提取错误信息
 * @param error 错误对象
 * @param defaultMessage 默认错误信息
 * @returns 错误信息字符串
 */
export function extractErrorMessage(error: unknown, defaultMessage = "操作失败"): string {
  if (typeof error === "string") {
    return error;
  }
  
  if (error && typeof error === "object" && "message" in error) {
    return (error as any).message;
  }
  
  return defaultMessage;
}

/**
 * 处理 API 错误并返回错误信息
 * @param error 错误对象
 * @param context 错误上下文（用于日志）
 * @param defaultMessage 默认错误信息
 * @returns 错误信息字符串
 */
export function handleApiError(
  error: unknown,
  context: string,
  defaultMessage = "操作失败"
): string {
  const errorMessage = extractErrorMessage(error, defaultMessage);
  console.error(`${context}:`, error);
  return errorMessage;
}
