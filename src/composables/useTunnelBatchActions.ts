import { ref, type Ref } from "vue";
import { useMessage } from "naive-ui";
import type { Tunnel } from "@/types/tunnel";
import { useTunnelStore } from "@/stores/tunnel";
import { executeBatchOperation } from "@/utils/batchOperationHelper";

interface UseTunnelBatchActionsOptions {
  tunnels: Ref<Tunnel[]>;
  loadTunnels: () => Promise<void>;
  loadRunningTunnels: () => Promise<void>;
}

export function useTunnelBatchActions({
  tunnels,
  loadTunnels,
  loadRunningTunnels,
}: UseTunnelBatchActionsOptions) {
  const message = useMessage();
  const tunnelStore = useTunnelStore();

  const batchMode = ref(false);
  const selectedTunnels = ref<Set<number>>(new Set());

  function enterBatchMode() {
    batchMode.value = true;
    selectedTunnels.value.clear();
  }

  function exitBatchMode() {
    batchMode.value = false;
    selectedTunnels.value.clear();
  }

  function toggleTunnelSelection(tunnelId: number) {
    if (!batchMode.value) {
      return;
    }

    if (selectedTunnels.value.has(tunnelId)) {
      selectedTunnels.value.delete(tunnelId);
    } else {
      selectedTunnels.value.add(tunnelId);
    }

    selectedTunnels.value = new Set(selectedTunnels.value);
  }

  function selectAll() {
    selectedTunnels.value = new Set(tunnels.value.map((tunnel) => tunnel.proxyId));
  }

  function clearSelection() {
    selectedTunnels.value.clear();
  }

  async function batchStartTunnels() {
    await executeBatchOperation({
      operationName: "启动",
      ids: Array.from(selectedTunnels.value),
      message,
      executeSingle: async (tunnelId) => {
        await tunnelStore.startTunnel(tunnelId);
        return true;
      },
      onComplete: async () => {
        await loadRunningTunnels();
        exitBatchMode();
      },
    });
  }

  async function batchStopTunnels() {
    await executeBatchOperation({
      operationName: "停止",
      ids: Array.from(selectedTunnels.value),
      message,
      executeSingle: async (tunnelId) => {
        await tunnelStore.stopTunnel(tunnelId);
        return true;
      },
      onComplete: async () => {
        await loadRunningTunnels();
        exitBatchMode();
      },
    });
  }

  async function batchEnableTunnels() {
    await executeBatchOperation({
      operationName: "启用",
      ids: Array.from(selectedTunnels.value),
      message,
      executeSingle: async (tunnelId) => {
        await tunnelStore.toggleTunnel(tunnelId, true, { syncAfter: false });
        return true;
      },
      onComplete: async () => {
        await loadTunnels();
        exitBatchMode();
      },
    });
  }

  async function batchDisableTunnels() {
    await executeBatchOperation({
      operationName: "禁用",
      ids: Array.from(selectedTunnels.value),
      message,
      executeSingle: async (tunnelId) => {
        await tunnelStore.toggleTunnel(tunnelId, false, { syncAfter: false });
        return true;
      },
      onComplete: async () => {
        await loadTunnels();
        exitBatchMode();
      },
    });
  }

  async function batchKickTunnels() {
    await executeBatchOperation({
      operationName: "下线",
      ids: Array.from(selectedTunnels.value),
      message,
      executeSingle: async (tunnelId) => {
        await tunnelStore.kickTunnel(tunnelId, {
          reEnableAfterKick: true,
          syncAfter: false,
        });
        return true;
      },
      onComplete: async () => {
        await loadTunnels();
        exitBatchMode();
      },
    });
  }

  async function batchDeleteTunnels() {
    await executeBatchOperation({
      operationName: "删除",
      ids: Array.from(selectedTunnels.value),
      message,
      executeSingle: async (tunnelId) => {
        await tunnelStore.deleteTunnel(tunnelId, { syncAfter: false });
        return true;
      },
      onComplete: async () => {
        await loadTunnels();
        exitBatchMode();
      },
    });
  }

  return {
    batchMode,
    selectedTunnels,
    enterBatchMode,
    exitBatchMode,
    toggleTunnelSelection,
    selectAll,
    clearSelection,
    batchStartTunnels,
    batchStopTunnels,
    batchEnableTunnels,
    batchDisableTunnels,
    batchKickTunnels,
    batchDeleteTunnels,
  };
}
