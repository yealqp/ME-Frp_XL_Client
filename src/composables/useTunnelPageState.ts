import { onMounted, onUnmounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useMessage } from "naive-ui";
import { useTunnelStore } from "@/stores/tunnel";
import { extractErrorMessage } from "@/utils/errorHandler";

interface UseTunnelPageStateOptions {
  loadConfigFileStatus: () => Promise<void>;
  onTunnelStart?: (id: number) => void;
  onTunnelStop?: (id: number) => void;
}

export function useTunnelPageState({
  loadConfigFileStatus,
  onTunnelStart,
  onTunnelStop,
}: UseTunnelPageStateOptions) {
  const message = useMessage();
  const tunnelStore = useTunnelStore();
  const {
    tunnels,
    loading,
    error,
    nodeNameMap,
    nodeHostnameMap,
    runningTunnels,
    actionLoading,
  } = storeToRefs(tunnelStore);

  const viewMode = ref<"grid" | "table">(
    (localStorage.getItem("tunnel-view-mode") as "grid" | "table") || "grid",
  );

  let statusUpdateTimer: number | null = null;

  watch(viewMode, (newMode) => {
    localStorage.setItem("tunnel-view-mode", newMode);
  });

  async function loadTunnels(showSuccess = true) {
    try {
      await Promise.all([
        tunnelStore.refreshTunnels(),
        loadConfigFileStatus(),
      ]);

      if (showSuccess && !error.value) {
        message.success(`成功加载 ${tunnels.value.length} 个隧道`);
      }
    } catch (err) {
      console.error("加载隧道列表失败:", err);
      message.error(extractErrorMessage(err, error.value || "加载隧道列表失败"));
    }
  }

  async function loadRunningTunnels() {
    try {
      await tunnelStore.loadRunningTunnels();
    } catch (err) {
      console.error("获取运行状态失败:", err);
    }
  }

  async function startTunnel(id: number) {
    try {
      await tunnelStore.startTunnel(id);
      message.success("隧道启动成功");
      onTunnelStart?.(id);
    } catch (err) {
      console.error("启动隧道失败:", err);
      message.error(extractErrorMessage(err, "启动隧道失败"));
    }
  }

  async function stopTunnel(id: number) {
    try {
      await tunnelStore.stopTunnel(id);
      message.success("隧道停止成功");
      onTunnelStop?.(id);
    } catch (err) {
      console.error("停止隧道失败:", err);
      message.error(extractErrorMessage(err, "停止隧道失败"));
    }
  }

  async function handleReload() {
    tunnelStore.clearError();
    await loadTunnels();
  }

  function refreshTunnels() {
    void loadTunnels();
  }

  onMounted(() => {
    void loadTunnels();

    statusUpdateTimer = window.setInterval(() => {
      void loadRunningTunnels();
    }, 5000);
  });

  onUnmounted(() => {
    if (statusUpdateTimer) {
      clearInterval(statusUpdateTimer);
      statusUpdateTimer = null;
    }
  });

  return {
    tunnels,
    loading,
    error,
    nodeNameMap,
    nodeHostnameMap,
    runningTunnels,
    actionLoading,
    viewMode,
    loadTunnels,
    loadRunningTunnels,
    startTunnel,
    stopTunnel,
    handleReload,
    refreshTunnels,
  };
}
