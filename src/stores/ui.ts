/**
 * UI Store
 * 
 * 管理全局 UI 状态，包括主题配置、侧边栏设置和系统通知
 * 
 * Requirements: 7.1, 7.2
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { invoke } from '@tauri-apps/api/core';
import { showAdGlobal } from '@/utils/eventBus';
import type { UnifiedConfig } from '@/types/config';
import type { NotificationReactive } from 'naive-ui';

export const useUIStore = defineStore('ui', () => {
  // State
  const theme = ref<'light' | 'dark'>('light');
  const customTheme = ref<any>(null);
  const showAd = ref<boolean>(true);
  
  // Sidebar settings
  const sidebarWidth = ref<number>(200); // 默认宽度 200px
  const sidebarCollapsible = ref<boolean>(true); // 默认开启收缩功能
  const sidebarCollapsed = ref<boolean>(false); // 当前收缩状态

  // System notification (单实例)
  const systemNotification = ref<NotificationReactive | null>(null);
  const notificationFetched = ref<boolean>(false); // 标记是否已获取过通知

  // Getters
  const currentTheme = computed(() => customTheme.value || theme.value);
  const isDarkMode = computed(() => theme.value === 'dark');
  const currentSidebarWidth = computed(() => 
    sidebarCollapsed.value ? 64 : sidebarWidth.value
  );

  // Actions
  function initTheme() {
    // 从 localStorage 加载主题设置
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      theme.value = savedTheme;
    }
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', theme.value);
  }

  /**
   * Update showAd state and sync to eventBus
   * @param value - New showAd value
   */
  function updateShowAd(value: boolean) {
    showAd.value = value;
    showAdGlobal.value = value;
  }

  /**
   * Load sidebar settings from UnifiedConfig
   */
  async function loadSidebarSettings() {
    try {
      const config = await invoke<UnifiedConfig>('load_unified_config');
      
      if (config.sidebarWidth !== undefined) {
        const width = config.sidebarWidth;
        if (width >= 150 && width <= 300) {
          sidebarWidth.value = width;
        }
      }
      
      if (config.sidebarCollapsible !== undefined) {
        sidebarCollapsible.value = config.sidebarCollapsible;
      }
      
      if (config.sidebarCollapsed !== undefined) {
        sidebarCollapsed.value = config.sidebarCollapsed;
      }
    } catch (error) {
      console.error('加载侧边栏设置失败:', error);
    }
  }

  /**
   * Save sidebar settings to UnifiedConfig
   */
  async function saveSidebarSettings() {
    try {
      const config = await invoke<UnifiedConfig>('load_unified_config');
      
      const updatedConfig: UnifiedConfig = {
        ...config,
        sidebarWidth: sidebarWidth.value,
        sidebarCollapsible: sidebarCollapsible.value,
        sidebarCollapsed: sidebarCollapsed.value,
      };
      
      await invoke('save_unified_config', { config: updatedConfig });
    } catch (error) {
      console.error('保存侧边栏设置失败:', error);
      throw error;
    }
  }

  /**
   * Update sidebar width
   * @param width - New sidebar width (150-300px)
   */
  async function updateSidebarWidth(width: number) {
    if (width >= 150 && width <= 300) {
      sidebarWidth.value = width;
      await saveSidebarSettings();
    }
  }

  /**
   * Update sidebar collapsible setting
   * @param collapsible - Whether sidebar can be collapsed
   */
  async function updateSidebarCollapsible(collapsible: boolean) {
    sidebarCollapsible.value = collapsible;
    
    // 如果禁用收缩功能，自动展开侧边栏
    if (!collapsible && sidebarCollapsed.value) {
      sidebarCollapsed.value = false;
    }
    
    await saveSidebarSettings();
  }

  /**
   * Toggle sidebar collapsed state
   */
  function toggleSidebarCollapsed() {
    if (sidebarCollapsible.value) {
      sidebarCollapsed.value = !sidebarCollapsed.value;
    }
  }

  /**
   * Set sidebar collapsed state
   * @param collapsed - New collapsed state
   */
  async function setSidebarCollapsed(collapsed: boolean) {
    if (sidebarCollapsible.value) {
      sidebarCollapsed.value = collapsed;
      // 保存状态到配置文件
      await saveSidebarSettings();
    }
  }

  /**
   * Fetch and show system notification (单实例)
   * @param notificationApi - Naive UI notification API instance
   */
  async function fetchAndShowNotification(notificationApi: any) {
    // 如果已经获取过通知，不再重复获取
    if (notificationFetched.value) {
      console.log('系统通知已获取，跳过重复请求');
      return;
    }

    // 如果已有通知实例，先销毁
    if (systemNotification.value) {
      systemNotification.value.destroy();
      systemNotification.value = null;
    }

    try {
      const response = await invoke("api_request", {
        url: "https://check.yealqp.cn/notification.txt",
        method: "GET",
        data: ""
      }) as string;

      if (response && response.trim()) {
        // 创建通知实例并保存引用
        systemNotification.value = notificationApi.info({
          title: "系统通知",
          content: response.trim(),
          duration: 10000, // 10秒后自动关闭
          closable: true,
          keepAliveOnHover: true,
          onClose: () => {
            systemNotification.value = null;
          }
        });
        
        notificationFetched.value = true;
        console.log("系统通知已显示");
      }
    } catch (error) {
      console.error("获取系统通知失败:", error);
      // 静默失败，不影响用户体验
    }
  }

  /**
   * Close system notification manually
   */
  function closeSystemNotification() {
    if (systemNotification.value) {
      systemNotification.value.destroy();
      systemNotification.value = null;
    }
  }

  /**
   * Reset notification fetched flag (用于需要重新获取通知的场景)
   */
  function resetNotificationFlag() {
    notificationFetched.value = false;
  }

  return {
    // State
    theme,
    customTheme,
    showAd,
    sidebarWidth,
    sidebarCollapsible,
    sidebarCollapsed,
    systemNotification,
    notificationFetched,
    // Getters
    currentTheme,
    isDarkMode,
    currentSidebarWidth,
    // Actions
    initTheme,
    toggleTheme,
    updateShowAd,
    loadSidebarSettings,
    saveSidebarSettings,
    updateSidebarWidth,
    updateSidebarCollapsible,
    toggleSidebarCollapsed,
    setSidebarCollapsed,
    fetchAndShowNotification,
    closeSystemNotification,
    resetNotificationFlag,
  };
});
