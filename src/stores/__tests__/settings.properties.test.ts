/**
 * Settings Store Property-Based Tests
 * 
 * Property-based tests for Settings Store using fast-check.
 * Each property is tested across many randomly generated inputs.
 * 
 * Feature: pinia-state-management
 */

import { fc, test } from '@fast-check/vitest';
import { beforeEach, describe, expect } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSettingsStore } from '../settings';
import { vi } from 'vitest';
import type { UnifiedConfig, AppSettings } from '@/types/config';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock eventBus
vi.mock('@/utils/eventBus', () => ({
  showAdGlobal: { value: true },
}));

import { invoke } from '@tauri-apps/api/core';
import { showAdGlobal } from '@/utils/eventBus';

describe('Settings Store - Property-Based Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  /**
   * Property 9: 设置加载
   * 
   * **Validates: Requirements 5.3**
   * 
   * For any UnifiedConfig configuration object, when calling Settings Store's loadSettings action,
   * the settings object should contain all setting items from the config,
   * and undefined items should use default values.
   */
  test.prop([
    fc.record({
      userToken: fc.string({ maxLength: 100 }),
      username: fc.string({ maxLength: 50 }),
      group: fc.string({ maxLength: 20 }),
      frpToken: fc.string({ maxLength: 100 }),
      autoStart: fc.option(fc.boolean(), { nil: undefined }),
      alwaysOnTop: fc.option(fc.boolean(), { nil: undefined }),
      autoUpdate: fc.option(fc.boolean(), { nil: undefined }),
      autoStartTunnels: fc.option(fc.array(fc.integer({ min: 1, max: 1000 }), { maxLength: 10 }), { nil: undefined }),
      startupDelay: fc.option(fc.integer({ min: 0, max: 60 }), { nil: undefined }),
      minimizeToTray: fc.option(fc.boolean(), { nil: undefined }),
      showAd: fc.option(fc.boolean(), { nil: undefined }),
    })
  ], { numRuns: 100 })('Property 9: loadSettings should load settings with defaults for undefined values', async (configData) => {
    const store = useSettingsStore();
    
    // Create config with potentially undefined settings
    const mockConfig: UnifiedConfig = {
      userToken: configData.userToken,
      username: configData.username,
      group: configData.group,
      frpToken: configData.frpToken,
      autoStart: configData.autoStart ?? false,
      alwaysOnTop: configData.alwaysOnTop ?? false,
      autoUpdate: configData.autoUpdate ?? true,
      autoStartTunnels: configData.autoStartTunnels ?? [],
      startupDelay: configData.startupDelay ?? 5,
      minimizeToTray: configData.minimizeToTray ?? true,
      showAd: configData.showAd ?? true,
    };
    
    vi.mocked(invoke).mockResolvedValueOnce(mockConfig);
    
    // Execute loadSettings
    await store.loadSettings();
    
    // Verify settings are loaded with correct defaults
    expect(store.settings.autoStart).toBe(configData.autoStart ?? false);
    expect(store.settings.alwaysOnTop).toBe(configData.alwaysOnTop ?? false);
    expect(store.settings.autoUpdate).toBe(configData.autoUpdate ?? true);
    expect(store.settings.autoStartTunnels).toEqual(configData.autoStartTunnels ?? []);
    expect(store.settings.startupDelay).toBe(configData.startupDelay ?? 5);
    expect(store.settings.minimizeToTray).toBe(configData.minimizeToTray ?? true);
    expect(store.settings.showAd).toBe(configData.showAd ?? true);
    
    // Verify showAd is synced to eventBus
    expect(showAdGlobal.value).toBe(configData.showAd ?? true);
    
    // Verify loading state is false after completion
    expect(store.loading).toBe(false);
    expect(store.error).toBe('');
  });

  /**
   * Property 10: 设置保存
   * 
   * **Validates: Requirements 5.4**
   * 
   * For any setting item change, when calling Settings Store's updateSetting action,
   * the change should be immediately reflected in the settings object,
   * and should trigger saveSettings to persist to UnifiedConfig.
   */
  test.prop([
    fc.record({
      // Initial config
      userToken: fc.string({ minLength: 1, maxLength: 100 }),
      username: fc.string({ minLength: 1, maxLength: 50 }),
      group: fc.string({ maxLength: 20 }),
      frpToken: fc.string({ maxLength: 100 }),
      autoStart: fc.boolean(),
      alwaysOnTop: fc.boolean(),
      autoUpdate: fc.boolean(),
      autoStartTunnels: fc.array(fc.integer({ min: 1, max: 1000 }), { maxLength: 10 }),
      startupDelay: fc.integer({ min: 0, max: 60 }),
      minimizeToTray: fc.boolean(),
      showAd: fc.boolean(),
    }),
    fc.constantFrom(
      'autoStart',
      'alwaysOnTop',
      'autoUpdate',
      'minimizeToTray',
      'showAd'
    ) as fc.Arbitrary<'autoStart' | 'alwaysOnTop' | 'autoUpdate' | 'minimizeToTray' | 'showAd'>,
  ], { numRuns: 100 })('Property 10: updateSetting should update and persist boolean settings', async (configData, settingKey) => {
    const store = useSettingsStore();
    
    // Create initial config
    const mockConfig: UnifiedConfig = {
      userToken: configData.userToken,
      username: configData.username,
      group: configData.group,
      frpToken: configData.frpToken,
      autoStart: configData.autoStart,
      alwaysOnTop: configData.alwaysOnTop,
      autoUpdate: configData.autoUpdate,
      autoStartTunnels: configData.autoStartTunnels,
      startupDelay: configData.startupDelay,
      minimizeToTray: configData.minimizeToTray,
      showAd: configData.showAd,
    };
    
    // Mock load and save operations
    vi.mocked(invoke).mockResolvedValueOnce(mockConfig); // loadSettings
    vi.mocked(invoke).mockResolvedValueOnce(mockConfig); // saveSettings - load
    vi.mocked(invoke).mockResolvedValueOnce(undefined); // saveSettings - save
    
    // Load initial settings
    await store.loadSettings();
    
    // Get original value and toggle it
    const originalValue = store.settings[settingKey];
    const newValue = !originalValue;
    
    // Execute updateSetting
    await store.updateSetting(settingKey, newValue);
    
    // Verify setting is updated in store
    expect(store.settings[settingKey]).toBe(newValue);
    
    // Verify saveSettings was called with updated config
    expect(invoke).toHaveBeenCalledWith('save_unified_config', {
      config: {
        ...mockConfig,
        [settingKey]: newValue,
      },
    });
    
    // If showAd was updated, verify eventBus sync
    if (settingKey === 'showAd') {
      expect(showAdGlobal.value).toBe(newValue);
    }
  });

  /**
   * Property 11: 自启动隧道验证
   * 
   * **Validates: Requirements 5.8**
   * 
   * For any tunnel ID list, when updating Settings Store's autoStartTunnels,
   * if the list contains invalid tunnel IDs (not existing in Tunnel Store's tunnels),
   * these invalid IDs should be filtered out.
   */
  test.prop([
    fc.record({
      // Initial config
      userToken: fc.string({ minLength: 1, maxLength: 100 }),
      username: fc.string({ minLength: 1, maxLength: 50 }),
      group: fc.string({ maxLength: 20 }),
      frpToken: fc.string({ maxLength: 100 }),
      autoStart: fc.boolean(),
      alwaysOnTop: fc.boolean(),
      autoUpdate: fc.boolean(),
      autoStartTunnels: fc.array(fc.integer({ min: 1, max: 1000 }), { maxLength: 10 }),
      startupDelay: fc.integer({ min: 0, max: 60 }),
      minimizeToTray: fc.boolean(),
      showAd: fc.boolean(),
    }),
    fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 10 }),
    fc.array(fc.integer({ min: 101, max: 200 }), { minLength: 1, maxLength: 5 }),
  ], { numRuns: 100 })('Property 11: updateAutoStartTunnels should filter invalid tunnel IDs', async (configData, validIds, invalidIds) => {
    const store = useSettingsStore();
    
    // Create initial config
    const mockConfig: UnifiedConfig = {
      userToken: configData.userToken,
      username: configData.username,
      group: configData.group,
      frpToken: configData.frpToken,
      autoStart: configData.autoStart,
      alwaysOnTop: configData.alwaysOnTop,
      autoUpdate: configData.autoUpdate,
      autoStartTunnels: configData.autoStartTunnels,
      startupDelay: configData.startupDelay,
      minimizeToTray: configData.minimizeToTray,
      showAd: configData.showAd,
    };
    
    // Mock Tunnel Store with valid tunnels
    vi.doMock('../tunnel', () => ({
      useTunnelStore: () => ({
        tunnels: validIds.map(id => ({ proxyId: id })),
      }),
    }));
    
    // Mock config operations
    vi.mocked(invoke).mockResolvedValue(mockConfig); // load for saveSettings
    vi.mocked(invoke).mockResolvedValue(undefined); // save
    
    // Combine valid and invalid IDs
    const mixedIds = [...validIds, ...invalidIds];
    
    // Execute updateAutoStartTunnels
    await store.updateAutoStartTunnels(mixedIds);
    
    // Verify only valid IDs are kept
    expect(store.settings.autoStartTunnels).toEqual(expect.arrayContaining(validIds));
    expect(store.settings.autoStartTunnels.length).toBe(validIds.length);
    
    // Verify no invalid IDs are present
    invalidIds.forEach(invalidId => {
      expect(store.settings.autoStartTunnels).not.toContain(invalidId);
    });
  });
});
