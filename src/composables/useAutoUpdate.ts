import { loadUnifiedConfig } from "@/utils/unifiedConfig";

export function useAutoUpdate() {
  async function checkForUpdatesOnStart(
    openUpdateModal: () => Promise<void>,
  ): Promise<void> {
    try {
      const unifiedConfig = await loadUnifiedConfig();

      if (!unifiedConfig || unifiedConfig.autoUpdate === false) {
        return;
      }

      await openUpdateModal();
    } catch (error) {
      console.error("自动检查更新失败:", error);
    }
  }

  return { checkForUpdatesOnStart };
}
