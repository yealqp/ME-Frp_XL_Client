/**
 * User Store
 * 
 * Manages user detailed information and related operations.
 * Provides formatted getters for displaying user data.
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { invoke } from '@tauri-apps/api/core';
import type { UserDetailInfo } from '@/types/user';

export const useUserStore = defineStore('user', () => {
  // State
  const userInfo = ref<UserDetailInfo | null>(null);
  const loading = ref(false);
  const error = ref('');

  // Getters
  
  /**
   * Format bandwidth for display
   * @param type - 'in' for inbound, 'out' for outbound
   * @returns Formatted bandwidth string (e.g., "100 Mbps")
   */
  const formattedBandwidth = computed(() => {
    return (type: 'in' | 'out') => {
      if (!userInfo.value) return '0 Mbps';
      const bandwidth = type === 'in' ? userInfo.value.inBound : userInfo.value.outBound;
      return `${bandwidth} Mbps`;
    };
  });

  /**
   * Format traffic for display
   * @returns Formatted traffic string in GB (e.g., "50.5 GB")
   */
  const formattedTraffic = computed(() => {
    if (!userInfo.value) return '0 GB';
    const trafficInGB = (userInfo.value.traffic / 1024).toFixed(2);
    return `${trafficInGB} GB`;
  });

  /**
   * Format registration time for display
   * @returns Formatted date string (YYYY-MM-DD)
   */
  const formattedRegTime = computed(() => {
    if (!userInfo.value) return '';
    const date = new Date(userInfo.value.regTime * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Actions
  
  /**
   * Load user information from Tauri API
   * Manages loading and error states
   */
  async function loadUserInfo() {
    loading.value = true;
    error.value = '';
    
    try {
      const result = await invoke<UserDetailInfo>('api_get_user_info');
      userInfo.value = result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
      console.error('Failed to load user info:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Refresh user information (called after sign-in or CDK redemption)
   */
  async function refreshUserInfo() {
    return loadUserInfo();
  }

  /**
   * Clear error state
   */
  function clearError() {
    error.value = '';
  }

  /**
   * Clear user information (called on logout)
   */
  function clearUserInfo() {
    userInfo.value = null;
    loading.value = false;
    error.value = '';
  }

  return {
    // State
    userInfo,
    loading,
    error,
    // Getters
    formattedBandwidth,
    formattedTraffic,
    formattedRegTime,
    // Actions
    loadUserInfo,
    refreshUserInfo,
    clearError,
    clearUserInfo,
  };
});
