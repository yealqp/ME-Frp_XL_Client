/**
 * Node Store
 * 
 * Manages node status and statistics.
 * Provides actions for loading and filtering node data.
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { invoke } from '@tauri-apps/api/core';

export interface NodeStatusData {
  nodeId: number;
  name: string;
  totalTrafficIn: number;
  totalTrafficOut: number;
  onlineClient: number;
  onlineProxy: number;
  isOnline: boolean;
  version: string;
  uptime: number;
  curConns: number;
  loadPercent: number;
}

interface NodeStatusResponse {
  code: number;
  data: NodeStatusData[];
  message: string;
}

export const useNodeStore = defineStore('node', () => {
  // State
  const nodes = ref<NodeStatusData[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastUpdated = ref<Date | null>(null);

  // Filters
  const searchKeyword = ref('');
  const filterOnlineOnly = ref(false);
  const filterNotOverloaded = ref(false);

  // Getters
  const totalNodes = computed(() => nodes.value.length);
  
  const onlineNodes = computed(() => 
    nodes.value.filter(n => n.isOnline).length
  );
  
  const totalOnlineUsers = computed(() => 
    nodes.value.reduce((sum, n) => sum + n.onlineClient, 0)
  );
  
  const totalOnlineProxies = computed(() => 
    nodes.value.reduce((sum, n) => sum + n.onlineProxy, 0)
  );
  
  const totalTrafficIn = computed(() => 
    nodes.value.reduce((sum, n) => sum + n.totalTrafficIn, 0)
  );
  
  const totalTrafficOut = computed(() => 
    nodes.value.reduce((sum, n) => sum + n.totalTrafficOut, 0)
  );

  // Filtered nodes based on search and filters
  const filteredNodes = computed(() => {
    let filtered = nodes.value;

    // Online filter
    if (filterOnlineOnly.value) {
      filtered = filtered.filter(node => node.isOnline);
    }

    // Not overloaded filter (load < 80%)
    if (filterNotOverloaded.value) {
      filtered = filtered.filter(node => node.loadPercent < 80);
    }

    // Search filter
    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.trim().toLowerCase();
      filtered = filtered.filter(node => 
        node.name.toLowerCase().includes(keyword) || 
        node.nodeId.toString().includes(keyword)
      );
    }

    return filtered;
  });

  // Get node by ID
  const getNodeById = computed(() => (nodeId: number) => {
    return nodes.value.find(n => n.nodeId === nodeId);
  });

  // Get node name by ID
  const getNodeName = computed(() => (nodeId: number) => {
    const node = nodes.value.find(n => n.nodeId === nodeId);
    return node ? node.name : `节点 ${nodeId}`;
  });

  // Actions
  async function fetchNodeStatus() {
    loading.value = true;
    error.value = null;

    try {
      const response = await invoke<string>('api_get_node_status');
      const parsedResponse: NodeStatusResponse = JSON.parse(response);
      
      if (parsedResponse.code === 200) {
        // Sort by node ID
        nodes.value = parsedResponse.data.sort((a, b) => a.nodeId - b.nodeId);
        lastUpdated.value = new Date();
      } else {
        error.value = parsedResponse.message || '获取节点状态失败';
        console.error('获取节点状态失败:', parsedResponse.message);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
      console.error('获取节点状态失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function refreshNodeStatus() {
    await fetchNodeStatus();
  }

  function clearNodes() {
    nodes.value = [];
    error.value = null;
    lastUpdated.value = null;
  }

  function clearError() {
    error.value = null;
  }

  function setSearchKeyword(keyword: string) {
    searchKeyword.value = keyword;
  }

  function setFilterOnlineOnly(value: boolean) {
    filterOnlineOnly.value = value;
  }

  function setFilterNotOverloaded(value: boolean) {
    filterNotOverloaded.value = value;
  }

  function resetFilters() {
    searchKeyword.value = '';
    filterOnlineOnly.value = false;
    filterNotOverloaded.value = false;
  }

  return {
    // State
    nodes,
    loading,
    error,
    lastUpdated,
    searchKeyword,
    filterOnlineOnly,
    filterNotOverloaded,
    
    // Getters
    totalNodes,
    onlineNodes,
    totalOnlineUsers,
    totalOnlineProxies,
    totalTrafficIn,
    totalTrafficOut,
    filteredNodes,
    getNodeById,
    getNodeName,
    
    // Actions
    fetchNodeStatus,
    refreshNodeStatus,
    clearNodes,
    clearError,
    setSearchKeyword,
    setFilterOnlineOnly,
    setFilterNotOverloaded,
    resetFilters,
  };
});
