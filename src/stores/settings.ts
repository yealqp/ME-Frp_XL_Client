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
import { clampAppearanceOpacity, clampAppearanceRange } from '@/utils/appearanceSettings';
import { extractErrorMessage } from '@/utils/errorHandler';
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
    minimizeToTray: true,
    theme: 'dark',
    hideWebuiEntry: false,
    enableAi: false,
    backgroundImagePath: undefined,
    backgroundImageOpacity: 100,
    backgroundBlur: 0,
    sidebarOpacity: 100,
    contentOpacity: 100,
    fontWeight: 400,
    shadowIntensity: 100,
    sidebarPosition: 'left' as 'left' | 'top' | 'bottom',
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
        minimizeToTray: config.minimizeToTray ?? true,
        theme: localStorage.getItem('mefrp_theme') || 'dark',
        hideWebuiEntry: config.hideWebuiEntry ?? false,
        enableAi: config.enableAi ?? false,
        backgroundImagePath: config.backgroundImagePath,
        backgroundImageOpacity: clampAppearanceOpacity(config.backgroundImageOpacity, 100) ?? 100,
        backgroundBlur: clampAppearanceRange(config.backgroundBlur, 0, 30, 0) ?? 0,
        sidebarOpacity: clampAppearanceOpacity(config.sidebarOpacity, 100) ?? 100,
        contentOpacity: clampAppearanceOpacity(config.contentOpacity, 100) ?? 100,
        fontWeight: clampAppearanceRange(config.fontWeight, 300, 700, 400) ?? 400,
        shadowIntensity: clampAppearanceRange(config.shadowIntensity, 0, 200, 100) ?? 100,
        sidebarPosition: (config.sidebarPosition === 'left' || config.sidebarPosition === 'top' || config.sidebarPosition === 'bottom')
          ? config.sidebarPosition
          : 'left',
      };
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
        hideWebuiEntry: settings.value.hideWebuiEntry,
        enableAi: settings.value.enableAi,
        backgroundImagePath: settings.value.backgroundImagePath || undefined,
        backgroundImageOpacity: clampAppearanceOpacity(settings.value.backgroundImageOpacity, 100) ?? 100,
        backgroundBlur: clampAppearanceRange(settings.value.backgroundBlur, 0, 30, 0) ?? 0,
        sidebarOpacity: clampAppearanceOpacity(settings.value.sidebarOpacity, 100) ?? 100,
        contentOpacity: clampAppearanceOpacity(settings.value.contentOpacity, 100) ?? 100,
        fontWeight: clampAppearanceRange(settings.value.fontWeight, 300, 700, 400) ?? 400,
        shadowIntensity: clampAppearanceRange(settings.value.shadowIntensity, 0, 200, 100) ?? 100,
        sidebarPosition: settings.value.sidebarPosition,
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
   * 防抖保存：滑块等高频更新的设置项合并为一次写入
   *
   * 连续调用共享同一个 promise：防抖窗口（250ms）内多次 updateSetting
   * 只触发一次 saveSettings，所有调用方一起 await 到同一个结果，
   * 避免高频拖动滑块导致大量全量 YAML 读写与配置竞态
   */
  let saveSettingsTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingSavePromise: Promise<void> | null = null;
  let resolvePendingSave: (() => void) | null = null;
  let rejectPendingSave: ((reason?: unknown) => void) | null = null;

  function scheduleSaveSettings(): Promise<void> {
    if (!pendingSavePromise) {
      pendingSavePromise = new Promise<void>((resolve, reject) => {
        resolvePendingSave = resolve;
        rejectPendingSave = reject;
      });
    }

    if (saveSettingsTimer !== null) {
      clearTimeout(saveSettingsTimer);
    }

    saveSettingsTimer = setTimeout(() => {
      saveSettingsTimer = null;

      const promise = pendingSavePromise;
      const resolve = resolvePendingSave;
      const reject = rejectPendingSave;
      pendingSavePromise = null;
      resolvePendingSave = null;
      rejectPendingSave = null;

      saveSettings().then(
        () => resolve?.(),
        (err) => reject?.(err),
      );
    }, 250);

    return pendingSavePromise;
  }

  /**
   * Update a single setting item
   * Persists the change with debounce (250ms)
   * @param key - Setting key to update
   * @param value - New value for the setting
   */
  async function updateSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<void> {
    settings.value[key] = value;

    await scheduleSaveSettings();
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
