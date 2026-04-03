import { invoke } from "@tauri-apps/api/core";
import type { UnifiedConfig } from "@/types/config";

export async function loadUnifiedConfig(): Promise<UnifiedConfig> {
  return invoke<UnifiedConfig>("load_unified_config");
}

export async function saveUnifiedConfig(config: UnifiedConfig): Promise<void> {
  await invoke("save_unified_config", { config });
}

export async function mergeUnifiedConfig(
  partial: Partial<UnifiedConfig>,
): Promise<UnifiedConfig> {
  const currentConfig = await loadUnifiedConfig();
  const updatedConfig: UnifiedConfig = {
    ...currentConfig,
    ...partial,
  };

  await saveUnifiedConfig(updatedConfig);

  return updatedConfig;
}
