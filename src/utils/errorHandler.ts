/**
 * 统一的错误处理工具
 * 用于处理 ME-Frp API 调用的错误
 */

export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  UNKNOWN = 'unknown'
}

export function extractErrorMessage(error: unknown, defaultMessage = "操作失败"): string {
  if (typeof error === "string") {
    return error;
  }
  
  if (error && typeof error === "object" && "message" in error) {
    return (error as any).message;
  }
  
  return defaultMessage;
}

export function classifyError(error: unknown): ErrorType {
  const message = extractErrorMessage(error);
  if (message.includes('网络') || message.includes('连接') || message.includes('timeout') || message.includes('network')) {
    return ErrorType.NETWORK;
  }
  if (message.includes('验证') || message.includes('无效') || message.includes('格式') || message.includes('invalid')) {
    return ErrorType.VALIDATION;
  }
  if (message.includes('权限') || message.includes('禁止') || message.includes('permission') || message.includes('forbidden')) {
    return ErrorType.PERMISSION;
  }
  if (message.includes('未找到') || message.includes('不存在') || message.includes('not found')) {
    return ErrorType.NOT_FOUND;
  }
  return ErrorType.UNKNOWN;
}

export interface RetryOptions {
  maxRetries: number;
  delayMs: number;
  shouldRetry?: (error: unknown) => boolean;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < options.maxRetries) {
        const shouldRetry = options.shouldRetry?.(error) ?? true;
        if (shouldRetry) {
          await new Promise(resolve => setTimeout(resolve, options.delayMs));
          continue;
        }
      }
      break;
    }
  }
  
  throw lastError;
}

export function getUserFriendlyMessage(error: unknown): string {
  const message = extractErrorMessage(error);
  const type = classifyError(error);
  
  switch (type) {
    case ErrorType.NETWORK:
      return '网络连接失败，请检查网络设置后重试';
    case ErrorType.VALIDATION:
      return '输入数据无效，请检查后重试';
    case ErrorType.PERMISSION:
      return '权限不足，请联系管理员';
    case ErrorType.NOT_FOUND:
      return '请求的资源不存在';
    default:
      return message || '操作失败，请稍后重试';
  }
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
