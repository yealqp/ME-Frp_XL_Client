/**
 * 批量操作辅助工具
 * 统一处理批量操作的循环、计数、错误处理和消息显示
 */

/**
 * 批量操作选项接口
 */
export interface BatchOperationOptions<T> {
  /** 操作名称，用于显示消息 */
  operationName: string;
  /** 要操作的 ID 列表 */
  ids: T[];
  /** 执行单个操作的函数，返回 true 表示成功，false 表示失败 */
  executeSingle: (id: T) => Promise<boolean>;
  /** 成功后的回调，可选 */
  onSuccess?: (id: T) => void;
  /** 所有操作完成后的回调 */
  onComplete?: (successCount: number, failCount: number) => void;
  /** 消息显示对象 */
  message: {
    loading: (content: string, options?: { duration: number }) => void;
    destroyAll: () => void;
    success: (content: string) => void;
    warning: (content: string) => void;
  };
  /** 并发数量限制，默认 5 */
  concurrency?: number;
}

/**
 * 批量操作结果
 */
export interface BatchOperationResult {
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failCount: number;
}

/**
 * 执行批量操作
 * 使用并发执行提高性能
 * @param options 批量操作选项
 * @returns 操作结果
 */
export async function executeBatchOperation<T>(
  options: BatchOperationOptions<T>
): Promise<BatchOperationResult> {
  const {
    operationName,
    ids,
    executeSingle,
    onSuccess,
    onComplete,
    message,
    concurrency = 5,
  } = options;

  if (ids.length === 0) {
    message.warning(`请先选择要${operationName}的隧道`);
    return { successCount: 0, failCount: 0 };
  }

  message.loading(`正在${operationName} ${ids.length} 个隧道...`, {
    duration: 0,
  });

  let successCount = 0;
  let failCount = 0;

  // 分批并发执行
  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    
    const results = await Promise.all(
      batch.map(async (id) => {
        try {
          const success = await executeSingle(id);
          if (success) {
            onSuccess?.(id);
            return true;
          }
          return false;
        } catch (error) {
          console.error(`${operationName}隧道 ${id} 失败:`, error);
          return false;
        }
      })
    );

    for (const result of results) {
      if (result) {
        successCount++;
      } else {
        failCount++;
      }
    }
  }

  message.destroyAll();

  if (failCount === 0) {
    message.success(`成功${operationName} ${successCount} 个隧道`);
  } else {
    message.warning(`成功${operationName} ${successCount} 个隧道，失败 ${failCount} 个`);
  }

  onComplete?.(successCount, failCount);

  return { successCount, failCount };
}

/**
 * 创建批量操作函数的工厂函数
 * 用于简化常见批量操作的创建
 */
export function createBatchOperation<T>(
  operationName: string,
  executeSingle: (id: T) => Promise<boolean>,
  message: BatchOperationOptions<T>['message'],
  options?: {
    onSuccess?: (id: T) => void;
    onComplete?: (successCount: number, failCount: number) => void;
    concurrency?: number;
  }
) {
  return (ids: T[]): Promise<BatchOperationResult> => {
    return executeBatchOperation({
      operationName,
      ids,
      executeSingle,
      message,
      ...options,
    });
  };
}