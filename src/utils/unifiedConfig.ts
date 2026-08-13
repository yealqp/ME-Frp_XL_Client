import { invoke } from "@tauri-apps/api/core";
import type { UnifiedConfig } from "@/types/config";

export async function loadUnifiedConfig(): Promise<UnifiedConfig> {
  return invoke<UnifiedConfig>("load_unified_config");
}

export async function saveUnifiedConfig(config: UnifiedConfig): Promise<void> {
  await invoke("save_unified_config", { config });
}

/**
 * 串行化配置写入队列
 *
 * mergeUnifiedConfig 是 read-modify-write 操作，多个调用方并发执行时
 * 后写者基于旧快照，会导致前写者的字段被覆盖（例如切换主题的同时拖动
 * 透明度滑块，主题或外观字段丢失）。通过模块级 promise 链保证同一时刻
 * 只有一个 merge 在执行，后到的 merge 等待前一个完成后再读取最新配置。
 */
let writeQueue: Promise<unknown> = Promise.resolve();

export async function mergeUnifiedConfig(
  partial: Partial<UnifiedConfig>,
): Promise<UnifiedConfig> {
  const result = writeQueue.then(async () => {
    const currentConfig = await loadUnifiedConfig();
    const updatedConfig: UnifiedConfig = {
      ...currentConfig,
      ...partial,
    };

    await saveUnifiedConfig(updatedConfig);

    return updatedConfig;
  });

  // 链上的失败不影响后续 merge 继续执行；
  // 当前调用方仍能通过 await result 收到自己的错误
  writeQueue = result.then(
    () => undefined,
    () => undefined,
  );

  return result;
}
