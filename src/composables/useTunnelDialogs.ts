import { ref, type Ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { useMessage } from "naive-ui";
import type { EditFormData, Tunnel } from "@/types/tunnel";
import { useTunnelStore } from "@/stores/tunnel";
import { extractErrorMessage } from "@/utils/errorHandler";

interface UseTunnelDialogsOptions {
  tunnels: Ref<Tunnel[]>;
  runningTunnels: Ref<Set<number>>;
}

export function useTunnelDialogs({
  tunnels,
  runningTunnels,
}: UseTunnelDialogsOptions) {
  const message = useMessage();
  const tunnelStore = useTunnelStore();

  const showLogs = ref(false);
  const currentLogs = ref<string[]>([]);
  const currentTunnelId = ref<number | null>(null);
  const loadingLogs = ref(false);

  const showDetails = ref(false);
  const currentTunnelDetails = ref<Tunnel | null>(null);

  const showEditModal = ref(false);
  const editingTunnel = ref<Tunnel | null>(null);

  // 请求序号：并发查看多个隧道日志时，仅最新的请求允许写入，
  // 避免慢的旧响应覆盖当前隧道的日志/复位 loading
  let logsRequestId = 0;

  async function viewLogs(tunnelId: number) {
    const requestId = ++logsRequestId;

    try {
      loadingLogs.value = true;
      currentTunnelId.value = tunnelId;
      const logs = await invoke<string[]>("api_get_tunnel_logs", { proxyId: tunnelId });

      // 已有更新的请求（切到了其它隧道），丢弃本次过期响应
      if (requestId !== logsRequestId) {
        return;
      }

      const nextSnapshot = logs.join("\n");
      const currentSnapshot = currentLogs.value.join("\n");
      if (nextSnapshot !== currentSnapshot) {
        currentLogs.value = logs;
      }
      showLogs.value = true;
    } catch (error) {
      // 过期请求的错误不提示（已切走）
      if (requestId !== logsRequestId) {
        return;
      }
      message.error(`获取日志失败: ${extractErrorMessage(error, "获取日志失败")}`);
    } finally {
      if (requestId === logsRequestId) {
        loadingLogs.value = false;
      }
    }
  }

  function viewTunnelDetails(tunnelId: number) {
    const tunnel = tunnels.value.find((item) => item.proxyId === tunnelId);
    if (!tunnel) {
      return;
    }

    currentTunnelDetails.value = tunnel;
    showDetails.value = true;
  }

  function editTunnel(tunnelId: number) {
    const tunnel = tunnels.value.find((item) => item.proxyId === tunnelId);
    if (!tunnel) {
      return;
    }

    if (runningTunnels.value.has(tunnelId)) {
      message.warning("隧道当前在线，请先关闭隧道");
      return;
    }

    editingTunnel.value = tunnel;
    showEditModal.value = true;
  }

  async function updateTunnel(tunnelId: number, updateData: EditFormData) {
    try {
      await tunnelStore.updateTunnel(tunnelId, updateData);
      message.success("隧道配置更新成功");
    } catch (err) {
      console.error("更新隧道配置失败:", err);
      message.error(extractErrorMessage(err, "更新隧道配置失败"));
      throw err;
    }
  }

  async function saveEdit(tunnelId: number, formData: EditFormData) {
    await updateTunnel(tunnelId, formData);
    showEditModal.value = false;
    editingTunnel.value = null;
  }

  function cancelEdit() {
    showEditModal.value = false;
    editingTunnel.value = null;
  }

  return {
    showLogs,
    currentLogs,
    currentTunnelId,
    loadingLogs,
    showDetails,
    currentTunnelDetails,
    showEditModal,
    editingTunnel,
    viewLogs,
    viewTunnelDetails,
    editTunnel,
    updateTunnel,
    saveEdit,
    cancelEdit,
  };
}
