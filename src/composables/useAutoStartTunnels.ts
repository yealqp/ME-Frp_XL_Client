import { loadUnifiedConfig, saveUnifiedConfig } from "@/utils/unifiedConfig";
import { extractProxyList, invokeTauriResponse } from "@/utils/tauriResponse";

interface AutoStartMessageApi {
  success: (content: string, options?: Record<string, unknown>) => unknown;
  warning: (content: string, options?: Record<string, unknown>) => unknown;
  error: (content: string, options?: Record<string, unknown>) => unknown;
}

export function useAutoStartTunnels() {
  async function startAutoStartTunnels(message?: AutoStartMessageApi): Promise<void> {
    try {
      const unifiedConfig = await loadUnifiedConfig();

      if (
        !unifiedConfig ||
        !unifiedConfig.autoStartTunnels ||
        unifiedConfig.autoStartTunnels.length === 0
      ) {
        return;
      }

      let validTunnelIds: number[] = [];

      try {
        const { getTunnelList } = await import("@/api/tunnel");
        const { useAuthStore } = await import("@/stores/auth");
        const authStore = useAuthStore();
        const tunnelRes = await getTunnelList(authStore.userToken);

        if (tunnelRes.code === 200) {
          const tunnelData = extractProxyList(tunnelRes.data);
          const serverTunnelIds = tunnelData.map((tunnel) => tunnel.proxyId);
          const originalCount = unifiedConfig.autoStartTunnels.length;

          validTunnelIds = unifiedConfig.autoStartTunnels.filter((id) => serverTunnelIds.includes(id));

          if (validTunnelIds.length !== originalCount) {
            const removedCount = originalCount - validTunnelIds.length;
            message?.warning(`已自动清理 ${removedCount} 个无效的自启动隧道配置`);

            await saveUnifiedConfig({
              ...unifiedConfig,
              autoStartTunnels: validTunnelIds,
            });
          }
        } else {
          console.error("获取隧道列表失败，跳过自启动验证:", tunnelRes.message);
          validTunnelIds = unifiedConfig.autoStartTunnels;
        }
      } catch (error) {
        console.error("验证自启动隧道时发生错误，跳过验证:", error);
        validTunnelIds = unifiedConfig.autoStartTunnels;
      }

      if (validTunnelIds.length === 0) {
        return;
      }

      const startupDelay = (unifiedConfig.startupDelay || 5) * 1000;

      setTimeout(() => {
        (async () => {
          for (let i = 0; i < validTunnelIds.length; i++) {
            const tunnelId = validTunnelIds[i];

            try {
              const result = await invokeTauriResponse<null>("api_start_tunnel", {
                proxyId: tunnelId,
              });

              if (result.code === 200) {
                message?.success(`自启动隧道 ${tunnelId} 成功`);
              } else {
                console.error(`隧道 ${tunnelId} 启动失败:`, result.message);
                message?.error(`自启动隧道 ${tunnelId} 失败: ${result.message}`);
              }
            } catch (error) {
              console.error(`启动隧道 ${tunnelId} 时发生错误:`, error);
              message?.error(`自启动隧道 ${tunnelId} 失败: ${error}`);
            }

            if (i < validTunnelIds.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        })().catch(error => {
          console.error("自启动隧道执行异常:", error);
        });
      }, startupDelay);
    } catch (error) {
      console.error("自启动隧道失败:", error);
    }
  }

  return { startAutoStartTunnels };
}
