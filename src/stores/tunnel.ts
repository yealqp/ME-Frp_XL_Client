/**
 * Tunnel Store
 * 
 * Manages tunnel list and running status.
 * Provides actions for loading, starting, stopping tunnels.
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { invoke } from '@tauri-apps/api/core';
import type { EditFormData, Tunnel } from '@/types/tunnel';
import { extractErrorMessage } from '@/utils/errorHandler';
import { extractProxyList, invokeTauriResponse } from '@/utils/tauriResponse';
import * as tunnelApi from '@/api/tunnel';
import * as nodeApi from '@/api/node';
import { useAuthStore } from './auth';

interface NodeNameItem {
  nodeId: number;
  name: string;
  hostname: string;
}

interface NodeNamePayload {
  nodes?: NodeNameItem[];
}

interface TunnelActionOptions {
  syncAfter?: boolean;
}

interface KickTunnelOptions extends TunnelActionOptions {
  reEnableAfterKick?: boolean;
}

export const useTunnelStore = defineStore('tunnel', () => {
  // State
  const tunnels = ref<Tunnel[]>([]);
  const runningTunnels = ref<Set<number>>(new Set());
  const nodeNameMap = ref<Record<number, string>>({});
  const nodeHostnameMap = ref<Record<number, string>>({});
  const loading = ref(false);
  const error = ref('');
  const actionLoading = ref<Record<number, boolean>>({});

  // Getters
  const getTunnelById = computed(() => (id: number) => {
    return tunnels.value.find(t => t.proxyId === id);
  });

  const getNodeName = computed(() => (nodeId: number) => {
    return nodeNameMap.value[nodeId] || `节点 ${nodeId}`;
  });

  const getNodeHostname = computed(() => (nodeId: number) => {
    return nodeHostnameMap.value[nodeId] || '';
  });

  const onlineTunnelsCount = computed(() => {
    return tunnels.value.filter((tunnel) => tunnel.isOnline).length;
  });

  const totalTunnelsCount = computed(() => {
    return tunnels.value.length;
  });

  function extractNodeList(payload: NodeNameItem[] | NodeNamePayload | null | undefined): NodeNameItem[] {
    if (!payload) {
      return [];
    }

    return Array.isArray(payload) ? payload : payload.nodes ?? [];
  }

  async function executeTunnelCommand<T>(
    command: string,
    args: Record<string, unknown>,
    defaultMessage: string,
  ): Promise<T> {
    const result = await invokeTauriResponse<T>(command, args);

    if (result.code !== 200) {
      throw new Error(result.message || defaultMessage);
    }

    return result.data;
  }

  async function withTunnelAction<T>(
    proxyId: number,
    defaultMessage: string,
    action: () => Promise<T>,
  ): Promise<T> {
    actionLoading.value[proxyId] = true;
    error.value = '';

    try {
      return await action();
    } catch (err) {
      error.value = extractErrorMessage(err, defaultMessage);
      console.error(defaultMessage, err);
      throw err;
    } finally {
      delete actionLoading.value[proxyId];
    }
  }

  function buildUpdateTunnelRequest(proxyId: number, updateData: EditFormData) {
    return {
      proxyId,
      proxyName: updateData.proxyName,
      localIp: updateData.localIp,
      localPort: updateData.localPort,
      remotePort: updateData.remotePort || null,
      domain: updateData.domain || '',
      location: '',
      accessKey: updateData.securityMode === 'accessKey' ? updateData.accessKey : '',
      hostHeaderRewrite: '',
      headerXFromWhere: '',
      useEncryption: updateData.useEncryption,
      useCompression: updateData.useCompression,
      proxyProtocolVersion: updateData.proxyProtocolVersion || '',
      proxyType: updateData.proxyType,
      nodeId: updateData.nodeId,
    };
  }

  // Actions
  async function loadTunnels() {
    loading.value = true;
    error.value = '';

    try {
      const authStore = useAuthStore();
      const token = authStore.userToken;

      const [tunnelResponse, nodeResponse] = await Promise.all([
        tunnelApi.getTunnelList(token),
        (async () => {
          try {
            return await nodeApi.getNodeNameList(token);
          } catch {
            return { code: 200, data: { nodes: [] }, message: '' };
          }
        })(),
      ]);

      if (tunnelResponse.code !== 200) {
        throw new Error(tunnelResponse.message || '获取隧道列表失败');
      }

      tunnels.value = extractProxyList(tunnelResponse.data);

      const nodeData = nodeResponse.data;
      const nodesList = nodeData && typeof nodeData === 'object' && 'nodes' in nodeData
        ? (nodeData as { nodes: NodeNameItem[] }).nodes ?? []
        : Array.isArray(nodeData)
          ? nodeData as NodeNameItem[]
          : [];

      const nameMap: Record<number, string> = {};
      const hostnameMap: Record<number, string> = {};

      nodesList.forEach((node: NodeNameItem) => {
        nameMap[node.nodeId] = node.name;
        hostnameMap[node.nodeId] = node.hostname;
      });

      nodeNameMap.value = nameMap;
      nodeHostnameMap.value = hostnameMap;
    } catch (err) {
      error.value = extractErrorMessage(err, '加载隧道列表失败');
      console.error('Failed to load tunnels:', err);
    } finally {
      loading.value = false;
    }
  }

  async function loadRunningTunnels() {
    try {
      const running = await invoke<number[]>('api_get_running_tunnels');
      runningTunnels.value = new Set(running);
    } catch (err) {
      error.value = extractErrorMessage(err, '获取隧道运行状态失败');
      console.error('Failed to load running tunnels:', err);
    }
  }

  async function refreshTunnels() {
    await loadTunnels();
    await loadRunningTunnels();
  }

  async function startTunnel(proxyId: number) {
    await withTunnelAction(proxyId, '启动隧道失败', async () => {
      await executeTunnelCommand<{ proxyId: number }>('api_start_tunnel', {
        proxyId,
      }, '启动隧道失败');
      
      // Update running tunnels set
      runningTunnels.value.add(proxyId);
    });
  }

  async function stopTunnel(proxyId: number) {
    await withTunnelAction(proxyId, '停止隧道失败', async () => {
      await executeTunnelCommand<{ proxyId: number }>('api_stop_tunnel', {
        proxyId,
      }, '停止隧道失败');
      
      // Update running tunnels set
      runningTunnels.value.delete(proxyId);
    });
  }

  async function updateTunnel(
    proxyId: number,
    updateData: EditFormData,
    options: TunnelActionOptions = {},
  ) {
    await withTunnelAction(proxyId, '更新隧道配置失败', async () => {
      const authStore = useAuthStore();
      const req = buildUpdateTunnelRequest(proxyId, updateData);
      const res = await tunnelApi.updateTunnel(authStore.userToken, req);

      if (res.code !== 200) {
        throw new Error(res.message || '更新隧道配置失败');
      }

      if (options.syncAfter !== false) {
        await refreshTunnels();
      }
    });
  }

  async function toggleTunnel(
    proxyId: number,
    enable: boolean,
    options: TunnelActionOptions = {},
  ) {
    await withTunnelAction(proxyId, enable ? '启用隧道失败' : '禁用隧道失败', async () => {
      const authStore = useAuthStore();
      const res = await tunnelApi.toggleTunnel(
        authStore.userToken,
        proxyId,
        !enable,
      );

      if (res.code !== 200) {
        throw new Error(res.message || (enable ? '启用隧道失败' : '禁用隧道失败'));
      }

      if (options.syncAfter !== false) {
        await refreshTunnels();
      }
    });
  }

  async function kickTunnel(
    proxyId: number,
    options: KickTunnelOptions = {},
  ) {
    await withTunnelAction(proxyId, '强制下线失败', async () => {
      const authStore = useAuthStore();
      const token = authStore.userToken;

      const res = await tunnelApi.kickTunnel(token, proxyId);
      if (res.code !== 200) {
        throw new Error(res.message || '强制下线失败');
      }

      runningTunnels.value.delete(proxyId);

      if (options.reEnableAfterKick) {
        const enableRes = await tunnelApi.toggleTunnel(token, proxyId, false);
        if (enableRes.code !== 200) {
          throw new Error(enableRes.message || '启用隧道失败');
        }
      }

      if (options.syncAfter !== false) {
        await refreshTunnels();
      }
    });
  }

  async function deleteTunnel(
    proxyId: number,
    options: TunnelActionOptions = {},
  ) {
    await withTunnelAction(proxyId, '删除隧道失败', async () => {
      const authStore = useAuthStore();
      const res = await tunnelApi.deleteTunnel(authStore.userToken, proxyId);

      if (res.code !== 200) {
        throw new Error(res.message || '删除隧道失败');
      }

      if (options.syncAfter !== false) {
        await refreshTunnels();
      }
    });
  }

  function clearTunnels() {
    tunnels.value = [];
    runningTunnels.value = new Set();
    nodeNameMap.value = {};
    nodeHostnameMap.value = {};
    error.value = '';
    actionLoading.value = {};
  }

  function clearError() {
    error.value = '';
  }

  return {
    // State
    tunnels,
    runningTunnels,
    nodeNameMap,
    nodeHostnameMap,
    loading,
    error,
    actionLoading,
    // Getters
    getTunnelById,
    getNodeName,
    getNodeHostname,
    onlineTunnelsCount,
    totalTunnelsCount,
    // Actions
    loadTunnels,
    loadRunningTunnels,
    refreshTunnels,
    startTunnel,
    stopTunnel,
    updateTunnel,
    toggleTunnel,
    kickTunnel,
    deleteTunnel,
    clearTunnels,
    clearError,
  };
});
