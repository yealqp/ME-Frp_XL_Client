/**
 * Auth Store Property-Based Tests
 * 
 * Property-based tests for Auth Store using fast-check.
 * Each property is tested across many randomly generated inputs.
 * 
 * Feature: pinia-state-management
 */

import { fc, test } from '@fast-check/vitest';
import { beforeEach, describe } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../auth';
import { vi } from 'vitest';
import type { UnifiedConfig } from '@/types/config';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';

describe('Auth Store - Property-Based Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  /**
   * Property 1: 登录状态更新
   * 
   * **Validates: Requirements 2.3**
   * 
   * For any valid user information object, when calling Auth Store's login action,
   * the store's isLoggedIn should become true, userToken should be correctly set,
   * and isCheckingAuth should be false.
   */
  test.prop([
    fc.record({
      userToken: fc.string({ minLength: 1, maxLength: 100 }),
      username: fc.string({ minLength: 1, maxLength: 50 }),
      group: fc.option(fc.string({ maxLength: 20 }), { nil: undefined }),
      frpToken: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
    })
  ], { numRuns: 100 })('Property 1: login should update state correctly for any valid user info', (userInfo) => {
    const store = useAuthStore();
    
    // Execute login
    store.login(userInfo);
    
    // Verify login state is updated
    expect(store.isLoggedIn).toBe(true);
    expect(store.userToken).toBe(userInfo.userToken);
    expect(store.username).toBe(userInfo.username);
    expect(store.group).toBe(userInfo.group || '');
    expect(store.frpToken).toBe(userInfo.frpToken || '');
    expect(store.isCheckingAuth).toBe(false);
    expect(store.isAuthenticated).toBe(true);
  });

  /**
   * Property 2: 登出状态清理
   * 
   * **Validates: Requirements 2.4, 8.1, 8.2**
   * 
   * For any logged-in state, when calling Auth Store's logout action,
   * isLoggedIn should become false, userToken should be cleared,
   * and User Store and Tunnel Store data should be cleared.
   */
  test.prop([
    fc.record({
      userToken: fc.string({ minLength: 1, maxLength: 100 }),
      username: fc.string({ minLength: 1, maxLength: 50 }),
      group: fc.option(fc.string({ maxLength: 20 }), { nil: undefined }),
      frpToken: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
    }),
    fc.record({
      autoStart: fc.boolean(),
      alwaysOnTop: fc.boolean(),
      autoUpdate: fc.boolean(),
      autoStartTunnels: fc.array(fc.integer({ min: 1, max: 1000 }), { maxLength: 10 }),
      startupDelay: fc.integer({ min: 0, max: 60 }),
      minimizeToTray: fc.boolean(),
      showAd: fc.boolean(),
    })
  ], { numRuns: 100 })('Property 2: logout should clear all auth state for any logged-in user', async (userInfo, settings) => {
    const store = useAuthStore();
    
    // Set up logged-in state
    store.login(userInfo);
    expect(store.isLoggedIn).toBe(true);
    
    // Mock config operations
    const mockConfig: UnifiedConfig = {
      userToken: userInfo.userToken,
      username: userInfo.username,
      group: userInfo.group || '',
      frpToken: userInfo.frpToken || '',
      ...settings,
    };
    
    vi.mocked(invoke).mockResolvedValueOnce(mockConfig); // load_unified_config
    vi.mocked(invoke).mockResolvedValueOnce(undefined); // save_unified_config
    
    // Execute logout
    await store.logout();
    
    // Verify all auth state is cleared
    expect(store.isLoggedIn).toBe(false);
    expect(store.userToken).toBe('');
    expect(store.username).toBe('');
    expect(store.group).toBe('');
    expect(store.frpToken).toBe('');
    expect(store.isAuthenticated).toBe(false);
    
    // Verify config was saved with cleared auth fields but preserved settings
    expect(invoke).toHaveBeenCalledWith('save_unified_config', {
      config: {
        ...mockConfig,
        userToken: '',
        frpToken: '',
        username: '',
        group: '',
      },
    });
  });

  /**
   * Property 3: 认证状态加载
   * 
   * **Validates: Requirements 2.5**
   * 
   * For any UnifiedConfig configuration object, when calling Auth Store's checkAuthStatus action,
   * if the config contains a valid userToken, then isLoggedIn should be true;
   * otherwise it should be false.
   */
  test.prop([
    fc.record({
      hasToken: fc.boolean(),
      userToken: fc.string({ minLength: 1, maxLength: 100 }),
      username: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
      group: fc.option(fc.string({ maxLength: 20 }), { nil: undefined }),
      frpToken: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
      autoStart: fc.boolean(),
      alwaysOnTop: fc.boolean(),
      autoUpdate: fc.boolean(),
      autoStartTunnels: fc.array(fc.integer({ min: 1, max: 1000 }), { maxLength: 10 }),
      startupDelay: fc.integer({ min: 0, max: 60 }),
      minimizeToTray: fc.boolean(),
      showAd: fc.boolean(),
    })
  ], { numRuns: 100 })('Property 3: checkAuthStatus should correctly determine login state from config', async (configData) => {
    const store = useAuthStore();
    
    // Create config with or without token based on hasToken flag
    const mockConfig: UnifiedConfig = {
      userToken: configData.hasToken ? configData.userToken : '',
      username: configData.username || '',
      group: configData.group || '',
      frpToken: configData.frpToken || '',
      autoStart: configData.autoStart,
      alwaysOnTop: configData.alwaysOnTop,
      autoUpdate: configData.autoUpdate,
      autoStartTunnels: configData.autoStartTunnels,
      startupDelay: configData.startupDelay,
      minimizeToTray: configData.minimizeToTray,
      showAd: configData.showAd,
    };
    
    vi.mocked(invoke).mockResolvedValueOnce(mockConfig);
    
    // Execute checkAuthStatus
    await store.checkAuthStatus();
    
    // Verify login state matches token presence
    if (configData.hasToken) {
      expect(store.isLoggedIn).toBe(true);
      expect(store.userToken).toBe(configData.userToken);
      expect(store.username).toBe(configData.username || '');
      expect(store.group).toBe(configData.group || '');
      expect(store.frpToken).toBe(configData.frpToken || '');
    } else {
      expect(store.isLoggedIn).toBe(false);
    }
    
    // Verify isCheckingAuth is false after completion
    expect(store.isCheckingAuth).toBe(false);
  });
});
