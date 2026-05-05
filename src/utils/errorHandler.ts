/**
 * 统一的错误处理工具
 * 用于处理 ME-Frp API 调用的错误
 */



export function extractErrorMessage(error: unknown, defaultMessage = "操作失败"): string {
  if (typeof error === "string") {
    return error;
  }
  
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as Record<string, unknown>).message;
    return typeof msg === "string" ? msg : defaultMessage;
  }
  
  return defaultMessage;
}









export function handleApiError(
  error: unknown,
  context: string,
  defaultMessage = "操作失败"
): string {
  const errorMessage = extractErrorMessage(error, defaultMessage);
  console.error(`${context}:`, error);
  return errorMessage;
}
