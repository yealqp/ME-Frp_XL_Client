import { computed, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useMessage } from "naive-ui";
import type { Tunnel } from "@/types/tunnel";
import { useSettingsStore } from "@/stores/settings";
import { useUIStore } from "@/stores/ui";
import { useTunnelStore } from "@/stores/tunnel";

export function useSettingsPanel() {
  const message = useMessage();
  const settingsStore = useSettingsStore();
  const uiStore = useUIStore();
  const tunnelStore = useTunnelStore();

  const { settings } = storeToRefs(settingsStore);
  const { sidebarWidth, sidebarCollapsible } = storeToRefs(uiStore);
  const { tunnels, loading: tunnelLoading, error: tunnelError } = storeToRefs(tunnelStore);
  let sidebarWidthDebounceTimer: number | null = null;

  const deletedTunnels = computed(() => {
    const existingTunnelIds = tunnels.value.map((tunnel) => tunnel.proxyId);
    return settings.value.autoStartTunnels.filter(
      (tunnelId) => !existingTunnelIds.includes(tunnelId),
    );
  });

  const sortedTunnels = computed(() => {
    const autoStartIds = settings.value.autoStartTunnels;
    const autoStartTunnels: Tunnel[] = [];
    const otherTunnels: Tunnel[] = [];

    autoStartIds.forEach((id) => {
      const tunnel = tunnels.value.find((item) => item.proxyId === id);
      if (tunnel) {
        autoStartTunnels.push(tunnel);
      }
    });

    tunnels.value.forEach((tunnel) => {
      if (!autoStartIds.includes(tunnel.proxyId)) {
        otherTunnels.push(tunnel);
      }
    });

    return [...autoStartTunnels, ...otherTunnels];
  });

  async function syncAutoStartTunnels() {
    const removedCount = await settingsStore.cleanupInvalidAutoStartTunnels(
      tunnels.value.map((tunnel: Tunnel) => tunnel.proxyId),
    );

    if (removedCount > 0) {
      message.warning(`已自动清理 ${removedCount} 个无效的自启动隧道配置`);
    }
  }

  async function loadTunnels() {
    await tunnelStore.loadTunnels();

    if (tunnelError.value) {
      message.error(tunnelError.value || "获取隧道列表失败");
      return;
    }

    await syncAutoStartTunnels();
  }

  async function refreshTunnels() {
    await loadTunnels();
    if (!tunnelError.value) {
      message.success("隧道列表已刷新");
    }
  }

  async function handleAutoStartChange(value: boolean) {
    try {
      await settingsStore.setAutoStart(value);
      message.success(value ? "已开启开机自启动" : "已关闭开机自启动");
    } catch {
      message.error("设置开机自启动失败");
    }
  }

  async function handleAlwaysOnTopChange(value: boolean) {
    try {
      await settingsStore.setAlwaysOnTop(value);
      message.success(value ? "已开启窗口置顶" : "已关闭窗口置顶");
    } catch {
      message.error("设置窗口置顶失败");
    }
  }

  async function handleMinimizeToTrayChange(value: boolean) {
    try {
      await settingsStore.setMinimizeToTray(value);
      message.success(value ? "已开启最小化到托盘" : "已关闭最小化到托盘");
    } catch {
      message.error("设置最小化到托盘失败");
    }
  }

  async function handleShowAdChange(value: boolean) {
    try {
      await settingsStore.updateSetting("showAd", value);
      message.success(value ? "已开启侧边栏广告" : "已关闭侧边栏广告");
    } catch {
      message.error("保存广告显示设置失败");
    }
  }

  async function handleHideWebuiEntryChange(value: boolean) {
    try {
      await settingsStore.updateSetting("hideWebuiEntry", value);
      message.success(value ? "已隐藏 WebUI 入口" : "已显示 WebUI 入口");
    } catch {
      message.error("保存 WebUI 入口设置失败");
    }
  }

  async function handleTunnelAutoStartChange(proxyId: number, checked: boolean) {
    try {
      await settingsStore.toggleAutoStartTunnel(proxyId, checked);
      message.success("自启动隧道设置已更新");
    } catch {
      message.error("更新自启动隧道失败");
    }
  }

  async function handleStartupDelayChange(value: number | null) {
    if (value === null) {
      return;
    }

    try {
      await settingsStore.updateStartupDelay(value);
    } catch {
      message.error("保存启动延迟失败");
    }
  }

  function handleSidebarWidthChange(value: number | null) {
    if (value === null) {
      return;
    }

    uiStore.setSidebarWidth(value);

    if (sidebarWidthDebounceTimer !== null) {
      clearTimeout(sidebarWidthDebounceTimer);
    }

    sidebarWidthDebounceTimer = window.setTimeout(async () => {
      try {
        await uiStore.saveSidebarSettings();
        message.success(`侧边栏宽度已设置为 ${value}px`);
      } catch (error) {
        message.error("保存侧边栏宽度失败");
        console.error("保存侧边栏宽度失败:", error);
        await uiStore.loadSidebarSettings();
      }
    }, 300);
  }

  async function handleSidebarCollapsibleChange(value: boolean) {
    try {
      await uiStore.updateSidebarCollapsible(value);
      message.success(value ? "已开启侧边栏收缩功能" : "已关闭侧边栏收缩功能");
    } catch (error) {
      message.error("保存侧边栏收缩设置失败");
      console.error("保存侧边栏收缩设置失败:", error);
    }
  }

  async function selectAllTunnels() {
    const enabledTunnels = tunnels.value.filter((tunnel) => !tunnel.isDisabled);
    const allEnabledIds = enabledTunnels.map((tunnel) => tunnel.proxyId);

    await settingsStore.selectAllAutoStartTunnels(allEnabledIds);
    message.success(`已选择 ${enabledTunnels.length} 个可用隧道`);
  }

  async function clearAllTunnels() {
    await settingsStore.clearAutoStartTunnels();
    message.success("已清空所有自启动隧道选择");
  }

  function getAutoStartIndex(proxyId: number) {
    return settings.value.autoStartTunnels.indexOf(proxyId);
  }

  async function moveTunnelUp(tunnelId: number) {
    const moved = await settingsStore.moveAutoStartTunnel(tunnelId, "up");
    if (moved) {
      message.success("启动顺序已调整");
    }
  }

  async function moveTunnelDown(tunnelId: number) {
    const moved = await settingsStore.moveAutoStartTunnel(tunnelId, "down");
    if (moved) {
      message.success("启动顺序已调整");
    }
  }

  async function removeDeletedTunnelConfig(tunnelId: number) {
    const removed = await settingsStore.removeAutoStartTunnel(tunnelId);
    if (removed) {
      message.success(`已删除隧道 ${tunnelId} 的自启动配置`);
    }
  }

  onMounted(async () => {
    try {
      await settingsStore.initializeSettings();
    } catch (error) {
      console.error("加载设置失败:", error);
      message.error("加载设置失败");
    }

    await uiStore.loadSidebarSettings();
    await loadTunnels();
  });

  onUnmounted(() => {
    if (sidebarWidthDebounceTimer !== null) {
      clearTimeout(sidebarWidthDebounceTimer);
      sidebarWidthDebounceTimer = null;
    }
  });

  return {
    settings,
    sidebarWidth,
    sidebarCollapsible,
    tunnels,
    tunnelLoading,
    deletedTunnels,
    sortedTunnels,
    handleAutoStartChange,
    handleAlwaysOnTopChange,
    handleMinimizeToTrayChange,
    handleShowAdChange,
    handleHideWebuiEntryChange,
    handleTunnelAutoStartChange,
    handleStartupDelayChange,
    handleSidebarWidthChange,
    handleSidebarCollapsibleChange,
    refreshTunnels,
    selectAllTunnels,
    clearAllTunnels,
    getAutoStartIndex,
    moveTunnelUp,
    moveTunnelDown,
    removeDeletedTunnelConfig,
  };
}
