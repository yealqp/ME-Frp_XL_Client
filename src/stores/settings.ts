/**
 * Settings Store
 * 
 * Manages application settings.
 * Uses Setup Store syntax (Composition API style).
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { invoke } from '@tauri-apps/api/core';
import type { UnifiedConfig, AppSettings } from '@/types/config';
import { showAdGlobal } from '@/utils/eventBus';

export const useSettingsStore = defineStore('settings', () => {
  // ============================================================================
  // State
  // ============================================================================

  const settings = ref<AppSettings>({
    autoStart: false,
    alwaysOnTop: false,
    autoUpdate: true,
    autoStartTunnels: [],
    startupDelay: 5,
    theme: 'light',
    minimizeToTray: true,
    showAd: true,
    hideWebuiEntry: false,
  });

  const loading = ref(false);
  const error = ref('');

  // ============================================================================
  // Getters
  // ============================================================================

  /**
   * Returns whether auto-start is enabled
   */
  const isAutoStartEnabled = computed(() => settings.value.autoStart);

  /**
   * Returns the list of auto-start tunnels with details
   * Requires Tunnel Store to be loaded
   */
  const autoStartTunnelsList = computed(() => {
    // This will be enhanced when integrating with Tunnel Store
    return settings.value.autoStartTunnels;
  });

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Load settings from UnifiedConfig
   * Sets default values for undefined settings
   * Syncs showAd to eventBus
   */
  async function loadSettings(): Promise<void> {
    loading.value = true;
    error.value = '';

    try {
      const config = await invoke<UnifiedConfig>('load_unified_config');
      
      // Load settings with defaults
      settings.value = {
        autoStart: config.autoStart ?? false,
        alwaysOnTop: config.alwaysOnTop ?? false,
        autoUpdate: config.autoUpdate ?? true,
        autoStartTunnels: config.autoStartTunnels ?? [],
        startupDelay: config.startupDelay ?? 5,
        theme: 'light', // Theme is not stored in UnifiedConfig
        minimizeToTray: config.minimizeToTray ?? true,
        showAd: config.showAd ?? true,
        hideWebuiEntry: config.hideWebuiEntry ?? false,
      };

      // Sync showAd to eventBus
      showAdGlobal.value = settings.value.showAd;
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
      console.error('加载设置失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Save settings to UnifiedConfig
   * Preserves other config items (userToken, etc.)
   */
  async function saveSettings(): Promise<void> {
    loading.value = true;
    error.value = '';

    try {
      // Load current config to preserve other fields
      const config = await invoke<UnifiedConfig>('load_unified_config');
      
      // Merge settings into config
      const updatedConfig: UnifiedConfig = {
        ...config,
        autoStart: settings.value.autoStart,
        alwaysOnTop: settings.value.alwaysOnTop,
        autoUpdate: settings.value.autoUpdate,
        autoStartTunnels: settings.value.autoStartTunnels,
        startupDelay: settings.value.startupDelay,
        minimizeToTray: settings.value.minimizeToTray,
        showAd: settings.value.showAd,
        hideWebuiEntry: settings.value.hideWebuiEntry,
      };

      await invoke('save_unified_config', { config: updatedConfig });
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
      console.error('保存设置失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update a single setting item
   * Calls saveSettings to persist the change
   * Syncs showAd to eventBus if updated
   * 
   * @param key - Setting key to update
   * @param value - New value for the setting
   */
  async function updateSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<void> {
    settings.value[key] = value;
    
    // Sync showAd to eventBus
    if (key === 'showAd') {
      showAdGlobal.value = value as boolean;
    }
    
    await saveSettings();
  }

  /**
   * Update auto-start tunnels list
   * Validates tunnel IDs against Tunnel Store
   * Filters out invalid IDs
   * 
   * @param tunnelIds - Array of tunnel IDs to auto-start
   */
  async function updateAutoStartTunnels(tunnelIds: number[]): Promise<void> {
    // Validate tunnel IDs against Tunnel Store
    try {
      const { useTunnelStore } = await import('./tunnel');
      const tunnelStore = useTunnelStore();
      
      // Filter out invalid tunnel IDs
      const validTunnelIds = tunnelIds.filter(id => 
        tunnelStore.tunnels.some(tunnel => tunnel.proxyId === id)
      );
      
      // Update setting
      settings.value.autoStartTunnels = validTunnelIds;
      await saveSettings();
    } catch (err) {
      // If Tunnel Store is not available, save without validation
      console.warn('Tunnel Store not available for validation:', err);
      settings.value.autoStartTunnels = tunnelIds;
      await saveSettings();
    }
  }

  /**
   * Clear error state
   */
  function clearError(): void {
    error.value = '';
  }

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    settings,
    loading,
    error,
    // Getters
    isAutoStartEnabled,
    autoStartTunnelsList,
    // Actions
    loadSettings,
    saveSettings,
    updateSetting,
    updateAutoStartTunnels,
    clearError,
  };
});
