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
import { login as apiLogin, getFrpToken } from '@/api/auth';

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
   * Login via direct API call to api.mefrp.com
   * Replaces the old invoke('api_login') approach.
   */
  async function loginWithApi(
    username: string,
    password: string,
    captchaToken?: string,
  ): Promise<void> {
    const res = await apiLogin(username, password, captchaToken);

    if (res.code !== 200) {
      throw new Error(res.message || '登录失败');
    }

    const loginData = res.data;
    let frpTokenValue = '';

    // Fetch frp_token
    try {
      const frpRes = await getFrpToken(loginData.token);
      if (frpRes.code === 200 && frpRes.data) {
        frpTokenValue = frpRes.data.token;
      }
    } catch (e) {
      console.warn('获取 frp_token 失败（可忽略）:', e);
    }

    // Update store state
    login({
      userToken: loginData.token,
      username: loginData.username,
      group: loginData.group,
      frpToken: frpTokenValue,
    });

    // Persist to config
    try {
      const config = await loadUnifiedConfig();
      config.userToken = loginData.token;
      config.frpToken = frpTokenValue;
      config.username = loginData.username;
      config.group = loginData.group;
      await saveUnifiedConfig(config);
    } catch (e) {
      console.error('保存登录信息到配置文件失败:', e);
    }
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
    const results = await Promise.allSettled([
      (async () => {
        const { useUserStore } = await import('./user');
        const userStore = useUserStore();
        userStore.clearUserInfo?.();
      })(),
      (async () => {
        const { useTunnelStore } = await import('./tunnel');
        const tunnelStore = useTunnelStore();
        tunnelStore.clearTunnels?.();
      })(),
      (async () => {
        const { useNodeStore } = await import('./node');
        const nodeStore = useNodeStore();
        nodeStore.clearNodes?.();
      })(),
    ]);

    for (const result of results) {
      if (result.status === 'rejected') {
        console.warn('Store not available during logout:', result.reason);
      }
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
    loginWithApi,
    logout,
  };
});
