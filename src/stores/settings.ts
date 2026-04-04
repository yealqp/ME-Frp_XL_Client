/**
 * Settings Store
 * 
 * Manages application settings.
 * Uses Setup Store syntax (Composition API style).
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { invoke } from '@tauri-apps/api/core';
import type { AppSettings } from '@/types/config';
import { extractErrorMessage } from '@/utils/errorHandler';
import { showAdGlobal } from '@/utils/eventBus';
import { loadUnifiedConfig, mergeUnifiedConfig } from '@/utils/unifiedConfig';

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
      const config = await loadUnifiedConfig();
      
      // Load settings with defaults
      settings.value = {
        autoStart: config.autoStart ?? false,
        alwaysOnTop: config.alwaysOnTop ?? false,
        autoUpdate: config.autoUpdate ?? true,
        autoStartTunnels: config.autoStartTunnels ?? [],
        startupDelay: config.startupDelay ?? 5,
        theme: localStorage.getItem('mefrp_theme') || 'dark',
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
      await mergeUnifiedConfig({
        autoStart: settings.value.autoStart,
        alwaysOnTop: settings.value.alwaysOnTop,
        autoUpdate: settings.value.autoUpdate,
        autoStartTunnels: settings.value.autoStartTunnels,
        startupDelay: settings.value.startupDelay,
        minimizeToTray: settings.value.minimizeToTray,
        showAd: settings.value.showAd,
        hideWebuiEntry: settings.value.hideWebuiEntry,
      });
      localStorage.setItem('mefrp_theme', settings.value.theme);
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
    settings.value.autoStartTunnels = [...new Set(tunnelIds)];
    await saveSettings();
  }

  async function initializeSettings(): Promise<void> {
    await loadSettings();

    try {
      const isEnabled = await invoke<boolean>('is_auto_start_enabled');
      if (settings.value.autoStart !== isEnabled) {
        settings.value.autoStart = isEnabled;
        await saveSettings();
      }
    } catch (err) {
      console.error('检查开机自启动状态失败:', err);
    }

    try {
      await invoke('set_minimize_to_tray', {
        minimizeToTray: settings.value.minimizeToTray,
      });
    } catch (err) {
      console.error('同步最小化到托盘设置失败:', err);
    }
  }

  async function setAutoStart(value: boolean): Promise<void> {
    const previousValue = settings.value.autoStart;
    settings.value.autoStart = value;

    try {
      await invoke('set_auto_start', { enable: value });
      await saveSettings();
    } catch (err) {
      settings.value.autoStart = previousValue;
      error.value = extractErrorMessage(err, '设置开机自启动失败');
      throw err;
    }
  }

  async function setAlwaysOnTop(value: boolean): Promise<void> {
    const previousValue = settings.value.alwaysOnTop;
    settings.value.alwaysOnTop = value;

    try {
      await invoke('set_always_on_top', { alwaysOnTop: value });
      await saveSettings();
    } catch (err) {
      settings.value.alwaysOnTop = previousValue;
      error.value = extractErrorMessage(err, '设置窗口置顶失败');
      throw err;
    }
  }

  async function setMinimizeToTray(value: boolean): Promise<void> {
    const previousValue = settings.value.minimizeToTray;
    settings.value.minimizeToTray = value;

    try {
      await invoke('set_minimize_to_tray', { minimizeToTray: value });
      await saveSettings();
    } catch (err) {
      settings.value.minimizeToTray = previousValue;
      error.value = extractErrorMessage(err, '设置最小化到托盘失败');
      throw err;
    }
  }

  async function updateStartupDelay(value: number): Promise<void> {
    settings.value.startupDelay = value;
    await saveSettings();
  }

  async function toggleAutoStartTunnel(proxyId: number, checked: boolean): Promise<void> {
    if (checked) {
      if (!settings.value.autoStartTunnels.includes(proxyId)) {
        await updateAutoStartTunnels([...settings.value.autoStartTunnels, proxyId]);
      }
      return;
    }

    await updateAutoStartTunnels(
      settings.value.autoStartTunnels.filter((id) => id !== proxyId),
    );
  }

  async function selectAllAutoStartTunnels(proxyIds: number[]): Promise<void> {
    const mergedIds = [...new Set([...settings.value.autoStartTunnels, ...proxyIds])];
    await updateAutoStartTunnels(mergedIds);
  }

  async function clearAutoStartTunnels(): Promise<void> {
    await updateAutoStartTunnels([]);
  }

  async function moveAutoStartTunnel(proxyId: number, direction: 'up' | 'down'): Promise<boolean> {
    const index = settings.value.autoStartTunnels.indexOf(proxyId);
    const offset = direction === 'up' ? -1 : 1;
    const targetIndex = index + offset;

    if (
      index < 0 ||
      targetIndex < 0 ||
      targetIndex >= settings.value.autoStartTunnels.length
    ) {
      return false;
    }

    const updatedTunnels = [...settings.value.autoStartTunnels];
    [updatedTunnels[index], updatedTunnels[targetIndex]] = [
      updatedTunnels[targetIndex],
      updatedTunnels[index],
    ];

    await updateAutoStartTunnels(updatedTunnels);
    return true;
  }

  async function removeAutoStartTunnel(proxyId: number): Promise<boolean> {
    if (!settings.value.autoStartTunnels.includes(proxyId)) {
      return false;
    }

    await updateAutoStartTunnels(
      settings.value.autoStartTunnels.filter((id) => id !== proxyId),
    );
    return true;
  }

  async function cleanupInvalidAutoStartTunnels(validTunnelIds: number[]): Promise<number> {
    const filteredIds = settings.value.autoStartTunnels.filter((id) =>
      validTunnelIds.includes(id),
    );
    const removedCount = settings.value.autoStartTunnels.length - filteredIds.length;

    if (removedCount > 0) {
      await updateAutoStartTunnels(filteredIds);
    }

    return removedCount;
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
    initializeSettings,
    updateSetting,
    updateAutoStartTunnels,
    setAutoStart,
    setAlwaysOnTop,
    setMinimizeToTray,
    updateStartupDelay,
    toggleAutoStartTunnel,
    selectAllAutoStartTunnels,
    clearAutoStartTunnels,
    moveAutoStartTunnel,
    removeAutoStartTunnel,
    cleanupInvalidAutoStartTunnels,
    clearError,
  };
});
