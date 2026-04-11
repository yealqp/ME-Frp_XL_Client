/**
 * Auth Store
 * 
 * Manages user authentication state and basic information.
 * Uses Setup Store syntax (Composition API style).
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { UnifiedConfig } from '@/types/config';
import { loadUnifiedConfig, saveUnifiedConfig } from '@/utils/unifiedConfig';

export const useAuthStore = defineStore('auth', () => {
  // ============================================================================
  // State
  // ============================================================================

  const isLoggedIn = ref(false);           // 登录状态
  const isCheckingAuth = ref(false);       // 正在检查认证状态
  const userToken = ref('');               // 用户 token
  const username = ref('');                // 用户名
  const group = ref('');                   // 用户组
  const frpToken = ref('');                // FRP token

  // ============================================================================
  // Getters
  // ============================================================================

  /**
   * Returns the authentication status
   */
  const isAuthenticated = computed(() => isLoggedIn.value);

  // ============================================================================
  // Actions (to be implemented in subsequent tasks)
  // ============================================================================

  /**
   * Check authentication status from UnifiedConfig
   * Implements retry logic (max 3 retries, 500ms interval)
   * 
   * @param retryCount - Current retry attempt (internal use)
   * @throws Error if all retries fail
   */
  function applyUnifiedConfig(config?: UnifiedConfig | null): void {
    if (config?.userToken) {
      isLoggedIn.value = true;
      userToken.value = config.userToken;
      username.value = config.username || '';
      group.value = config.group || '';
      frpToken.value = config.frpToken || '';
    } else {
      isLoggedIn.value = false;
      userToken.value = '';
      username.value = '';
      group.value = '';
      frpToken.value = '';
    }
  }

  async function checkAuthStatus(retryCount = 0, presetConfig?: UnifiedConfig | null): Promise<void> {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 500;

    isCheckingAuth.value = true;

    try {
      const config = presetConfig ?? await loadUnifiedConfig();
      applyUnifiedConfig(config);
      isCheckingAuth.value = false;
    } catch (error) {
      console.error(`检查登录状态失败 (尝试 ${retryCount + 1}/${MAX_RETRIES + 1}):`, error);
      
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return checkAuthStatus(retryCount + 1, presetConfig);
      }
      
      isCheckingAuth.value = false;
      throw error;
    }
  }

  /**
   * Handle successful login
   * Updates authentication state and user information
   * 
   * @param userInfo - User information from login response
   */
  function login(userInfo: { 
    userToken: string; 
    username: string; 
    group?: string; 
    frpToken?: string 
  }): void {
    isLoggedIn.value = true;
    userToken.value = userInfo.userToken;
    username.value = userInfo.username;
    group.value = userInfo.group || '';
    frpToken.value = userInfo.frpToken || '';
  }

  /**
   * Handle logout
   * Clears local authentication state, calls User Store and Tunnel Store to clear data,
   * and clears login information from UnifiedConfig
   * 
   * @throws Error if clearing config fails
   */
  async function logout(): Promise<void> {
    // Clear local authentication state
    isLoggedIn.value = false;
    userToken.value = '';
    username.value = '';
    group.value = '';
    frpToken.value = '';

    // Clear other stores (dynamic import to avoid circular dependencies)
    try {
      // Import and clear User Store if it exists
      const { useUserStore } = await import('./user');
      const userStore = useUserStore();
      if (userStore.clearUserInfo) {
        userStore.clearUserInfo();
      }
    } catch (error) {
      // User Store may not exist yet, skip
      console.warn('User Store not available:', error);
    }

    try {
      // Import and clear Tunnel Store if it exists
      const { useTunnelStore } = await import('./tunnel');
      const tunnelStore = useTunnelStore();
      if (tunnelStore.clearTunnels) {
        tunnelStore.clearTunnels();
      }
    } catch (error) {
      // Tunnel Store may not exist yet, skip
      console.warn('Tunnel Store not available:', error);
    }

    try {
      // Import and clear Node Store if it exists
      const { useNodeStore } = await import('./node');
      const nodeStore = useNodeStore();
      if (nodeStore.clearNodes) {
        nodeStore.clearNodes();
      }
    } catch (error) {
      // Node Store may not exist yet, skip
      console.warn('Node Store not available:', error);
    }

    // Clear login information from UnifiedConfig
    try {
      const config = await loadUnifiedConfig();
      const clearedConfig: UnifiedConfig = {
        ...config,
        userToken: '',
        frpToken: '',
        username: '',
        group: '',
      };
      await saveUnifiedConfig(clearedConfig);
    } catch (error) {
      console.error('清除登录信息失败:', error);
      throw error;
    }
  }

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    isLoggedIn,
    isCheckingAuth,
    userToken,
    username,
    group,
    frpToken,
    // Getters
    isAuthenticated,
    // Actions
    checkAuthStatus,
    applyUnifiedConfig,
    login,
    logout,
  };
});
