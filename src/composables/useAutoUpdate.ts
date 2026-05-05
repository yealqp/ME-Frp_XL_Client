import { invoke } from "@tauri-apps/api/core";
import { loadUnifiedConfig } from "@/utils/unifiedConfig";
import type { UpdateCheckResult } from "@/types/update";

interface AutoUpdateMessageApi {
  info: (content: string, options?: Record<string, unknown>) => unknown;
}

export function useAutoUpdate() {
  async function checkForUpdatesOnStart(message?: AutoUpdateMessageApi): Promise<void> {
    try {
      const unifiedConfig = await loadUnifiedConfig();

      if (!unifiedConfig || unifiedConfig.autoUpdate === false) {
        return;
      }

      const result = await invoke<UpdateCheckResult>("check_for_updates");

      if (result.has_update) {
        message?.info(`发现新版本 ${result.latest_version}，请前往关于页面查看详情`, {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("自动检查更新失败:", error);
    }
  }

  return { checkForUpdatesOnStart };
}
