/**
 * Tunnel Store
 * 
 * Manages tunnel list and running status.
 * Provides actions for loading, starting, stopping tunnels.
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { invoke } from '@tauri-apps/api/core';
import type { Tunnel, Node } from '@/types/store';

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
    return runningTunnels.value.size;
  });

  const totalTunnelsCount = computed(() => {
    return tunnels.value.length;
  });

  // Actions
  async function loadTunnels() {
    loading.value = true;
    error.value = '';

    try {
      // Load tunnels list
      const tunnelsList = await invoke<Tunnel[]>('api_get_proxies');
      tunnels.value = tunnelsList;

      // Load nodes list to build name maps
      const nodesList = await invoke<Node[]>('api_get_nodes');
      const nameMap: Record<number, string> = {};
      const hostnameMap: Record<number, string> = {};
      
      nodesList.forEach(node => {
        nameMap[node.nodeId] = node.name;
        hostnameMap[node.nodeId] = node.hostname;
      });

      nodeNameMap.value = nameMap;
      nodeHostnameMap.value = hostnameMap;
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
      console.error('Failed to load tunnels:', err);
    } finally {
      loading.value = false;
    }
  }

  async function loadRunningTunnels() {
    try {
      const running = await invoke<number[]>('get_running_tunnels');
      runningTunnels.value = new Set(running);

      // Update isOnline status for all tunnels
      tunnels.value.forEach(tunnel => {
        tunnel.isOnline = runningTunnels.value.has(tunnel.proxyId);
      });
    } catch (err) {
      console.error('Failed to load running tunnels:', err);
    }
  }

  async function refreshTunnels() {
    await loadTunnels();
    await loadRunningTunnels();
  }

  async function startTunnel(proxyId: number) {
    actionLoading.value[proxyId] = true;

    try {
      await invoke('start_tunnel', { proxyId });
      
      // Update running tunnels set
      runningTunnels.value.add(proxyId);

      // Update tunnel isOnline status
      const tunnel = tunnels.value.find(t => t.proxyId === proxyId);
      if (tunnel) {
        tunnel.isOnline = true;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
      console.error('Failed to start tunnel:', err);
      throw err;
    } finally {
      delete actionLoading.value[proxyId];
    }
  }

  async function stopTunnel(proxyId: number) {
    actionLoading.value[proxyId] = true;

    try {
      await invoke('stop_tunnel', { proxyId });
      
      // Update running tunnels set
      runningTunnels.value.delete(proxyId);

      // Update tunnel isOnline status
      const tunnel = tunnels.value.find(t => t.proxyId === proxyId);
      if (tunnel) {
        tunnel.isOnline = false;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
      console.error('Failed to stop tunnel:', err);
      throw err;
    } finally {
      delete actionLoading.value[proxyId];
    }
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
    clearTunnels,
    clearError,
  };
});
