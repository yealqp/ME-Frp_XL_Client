/**
 * Auth Store Unit Tests
 * 
 * Tests for the Auth Store functionality including checkAuthStatus action.
 * 
 * Requirements:
 * - 2.5: Load authentication status from UnifiedConfig
 * - 2.6: Provide checkAuthStatus action for verifying login status
 * 
 * **Validates: Requirements 2.5, 2.6**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../auth';
import type { UnifiedConfig } from '@/types/config';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';

describe('Auth Store - checkAuthStatus', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should initialize with default state', () => {
      // Validates: Requirement 2.1 - Initial state
      const store = useAuthStore();
      
      expect(store.isLoggedIn).toBe(false);
      expect(store.isCheckingAuth).toBe(false);
      expect(store.userToken).toBe('');
      expect(store.username).toBe('');
      expect(store.group).toBe('');
      expect(store.frpToken).toBe('');
    });

    it('should have isAuthenticated getter', () => {
      // Validates: Requirement 2.1 - Getter exists
      const store = useAuthStore();
      
      expect(store.isAuthenticated).toBe(false);
      
      store.isLoggedIn = true;
      expect(store.isAuthenticated).toBe(true);
    });
  });

  describe('checkAuthStatus - Success Cases', () => {
    it('should load auth status from UnifiedConfig with valid token', async () => {
      // Validates: Requirement 2.5 - Load from UnifiedConfig
      const store = useAuthStore();
      
      const mockConfig: UnifiedConfig = {
        userToken: 'test-token-123',
        username: 'testuser',
        group: 'vip',
        frpToken: 'frp-token-456',
        autoStart: false,
        alwaysOnTop: false,
        autoUpdate: false,
        autoStartTunnels: [],
        startupDelay: 0,
        minimizeToTray: false,
        showAd: true,
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockConfig);

      await store.checkAuthStatus();

      expect(store.isLoggedIn).toBe(true);
      expect(store.userToken).toBe('test-token-123');
      expect(store.username).toBe('testuser');
      expect(store.group).toBe('vip');
      expect(store.frpToken).toBe('frp-token-456');
      expect(store.isCheckingAuth).toBe(false);
    });

    it('should set isLoggedIn to false when userToken is empty', async () => {
      // Validates: Requirement 2.5 - Handle empty token
      const store = useAuthStore();
      
      const mockConfig: UnifiedConfig = {
        userToken: '',
        username: '',
        group: '',
        frpToken: '',
        autoStart: false,
        alwaysOnTop: false,
        autoUpdate: false,
        autoStartTunnels: [],
        startupDelay: 0,
        minimizeToTray: false,
        showAd: true,
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockConfig);

      await store.checkAuthStatus();

      expect(store.isLoggedIn).toBe(false);
      expect(store.isCheckingAuth).toBe(false);
    });

    it('should handle missing optional fields gracefully', async () => {
      // Validates: Requirement 2.5 - Handle partial config
      const store = useAuthStore();
      
      const mockConfig = {
        userToken: 'test-token',
        username: undefined,
        group: undefined,
        frpToken: undefined,
      } as any;

      vi.mocked(invoke).mockResolvedValueOnce(mockConfig);

      await store.checkAuthStatus();

      expect(store.isLoggedIn).toBe(true);
      expect(store.userToken).toBe('test-token');
      expect(store.username).toBe('');
      expect(store.group).toBe('');
      expect(store.frpToken).toBe('');
    });

    it('should set isCheckingAuth to true during execution', async () => {
      // Validates: Requirement 2.6 - Loading state management
      const store = useAuthStore();
      
      const mockConfig: UnifiedConfig = {
        userToken: 'test-token',
        username: 'testuser',
        group: '',
        frpToken: '',
        autoStart: false,
        alwaysOnTop: false,
        autoUpdate: false,
        autoStartTunnels: [],
        startupDelay: 0,
        minimizeToTray: false,
        showAd: true,
      };

      let resolveInvoke: (value: UnifiedConfig) => void;
      const invokePromise = new Promise<UnifiedConfig>((resolve) => {
        resolveInvoke = resolve;
      });

      vi.mocked(invoke).mockReturnValueOnce(invokePromise);

      const checkPromise = store.checkAuthStatus();
      
      // Should be checking during execution
      expect(store.isCheckingAuth).toBe(true);

      resolveInvoke!(mockConfig);
      await checkPromise;

      // Should be false after completion
      expect(store.isCheckingAuth).toBe(false);
    });
  });

  describe('checkAuthStatus - Retry Logic', () => {
    it('should retry up to 3 times on failure', async () => {
      // Validates: Requirement 2.6 - Retry logic
      const store = useAuthStore();
      
      const mockConfig: UnifiedConfig = {
        userToken: 'test-token',
        username: 'testuser',
        group: '',
        frpToken: '',
        autoStart: false,
        alwaysOnTop: false,
        autoUpdate: false,
        autoStartTunnels: [],
        startupDelay: 0,
        minimizeToTray: false,
        showAd: true,
      };

      // Fail 3 times, succeed on 4th attempt
      vi.mocked(invoke)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockConfig);

      await store.checkAuthStatus();

      // Should have called invoke 4 times (initial + 3 retries)
      expect(invoke).toHaveBeenCalledTimes(4);
      expect(store.isLoggedIn).toBe(true);
      expect(store.isCheckingAuth).toBe(false);
    });

    it('should throw error after max retries exceeded', async () => {
      // Validates: Requirement 2.6 - Max retry limit
      const store = useAuthStore();
      
      // Fail all attempts
      vi.mocked(invoke).mockRejectedValue(new Error('Network error'));

      await expect(store.checkAuthStatus()).rejects.toThrow('Network error');

      // Should have called invoke 4 times (initial + 3 retries)
      expect(invoke).toHaveBeenCalledTimes(4);
      expect(store.isCheckingAuth).toBe(false);
    });

    it('should wait 500ms between retries', async () => {
      // Validates: Requirement 2.6 - Retry delay
      const store = useAuthStore();
      
      vi.useFakeTimers();

      const mockConfig: UnifiedConfig = {
        userToken: 'test-token',
        username: 'testuser',
        group: '',
        frpToken: '',
        autoStart: false,
        alwaysOnTop: false,
        autoUpdate: false,
        autoStartTunnels: [],
        startupDelay: 0,
        minimizeToTray: false,
        showAd: true,
      };

      // Fail once, succeed on retry
      vi.mocked(invoke)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockConfig);

      const checkPromise = store.checkAuthStatus();

      // Fast-forward time by 500ms
      await vi.advanceTimersByTimeAsync(500);

      await checkPromise;

      expect(invoke).toHaveBeenCalledTimes(2);
      expect(store.isLoggedIn).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('checkAuthStatus - Error Handling', () => {
    it('should set isCheckingAuth to false on error', async () => {
      // Validates: Requirement 2.6 - Error state management
      const store = useAuthStore();
      
      vi.mocked(invoke).mockRejectedValue(new Error('API error'));

      await expect(store.checkAuthStatus()).rejects.toThrow();

      expect(store.isCheckingAuth).toBe(false);
    });

    it('should log error messages during retries', async () => {
      // Validates: Requirement 2.6 - Error logging
      const store = useAuthStore();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      vi.mocked(invoke).mockRejectedValue(new Error('Test error'));

      await expect(store.checkAuthStatus()).rejects.toThrow();

      // Should log error for each attempt (4 times total)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(4);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('检查登录状态失败'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});

describe('Auth Store - login', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should update login state with user information', () => {
      // Validates: Requirement 2.3 - Update login state
      const store = useAuthStore();
      
      const userInfo = {
        userToken: 'test-token-123',
        username: 'testuser',
        group: 'vip',
        frpToken: 'frp-token-456',
      };

      store.login(userInfo);

      expect(store.isLoggedIn).toBe(true);
      expect(store.userToken).toBe('test-token-123');
      expect(store.username).toBe('testuser');
      expect(store.group).toBe('vip');
      expect(store.frpToken).toBe('frp-token-456');
    });

    it('should handle optional fields with default values', () => {
      // Validates: Requirement 2.3 - Handle optional fields
      const store = useAuthStore();
      
      const userInfo = {
        userToken: 'test-token',
        username: 'testuser',
      };

      store.login(userInfo);

      expect(store.isLoggedIn).toBe(true);
      expect(store.userToken).toBe('test-token');
      expect(store.username).toBe('testuser');
      expect(store.group).toBe('');
      expect(store.frpToken).toBe('');
    });

    it('should set isLoggedIn to true', () => {
      // Validates: Requirement 2.3 - Set login status
      const store = useAuthStore();
      
      expect(store.isLoggedIn).toBe(false);

      store.login({
        userToken: 'token',
        username: 'user',
      });

      expect(store.isLoggedIn).toBe(true);
      expect(store.isAuthenticated).toBe(true);
    });

    it('should update all user information fields', () => {
      // Validates: Requirement 2.7 - Provide login action
      const store = useAuthStore();
      
      const userInfo = {
        userToken: 'new-token',
        username: 'newuser',
        group: 'premium',
        frpToken: 'new-frp-token',
      };

      store.login(userInfo);

      expect(store.userToken).toBe('new-token');
      expect(store.username).toBe('newuser');
      expect(store.group).toBe('premium');
      expect(store.frpToken).toBe('new-frp-token');
    });

    it('should overwrite previous login state', () => {
      // Validates: Requirement 2.3 - Update existing state
      const store = useAuthStore();
      
      // First login
      store.login({
        userToken: 'old-token',
        username: 'olduser',
        group: 'basic',
      });

      expect(store.userToken).toBe('old-token');
      expect(store.username).toBe('olduser');

      // Second login should overwrite
      store.login({
        userToken: 'new-token',
        username: 'newuser',
        group: 'premium',
      });

      expect(store.userToken).toBe('new-token');
      expect(store.username).toBe('newuser');
      expect(store.group).toBe('premium');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string values', () => {
      // Validates: Requirement 2.3 - Handle edge cases
      const store = useAuthStore();
      
      store.login({
        userToken: '',
        username: '',
        group: '',
        frpToken: '',
      });

      expect(store.isLoggedIn).toBe(true);
      expect(store.userToken).toBe('');
      expect(store.username).toBe('');
      expect(store.group).toBe('');
      expect(store.frpToken).toBe('');
    });

    it('should handle undefined optional fields', () => {
      // Validates: Requirement 2.3 - Handle undefined values
      const store = useAuthStore();
      
      store.login({
        userToken: 'token',
        username: 'user',
        group: undefined,
        frpToken: undefined,
      });

      expect(store.isLoggedIn).toBe(true);
      expect(store.group).toBe('');
      expect(store.frpToken).toBe('');
    });
  });
});

describe('Auth Store - logout', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should clear local authentication state', async () => {
      // Validates: Requirement 2.4 - Clear authentication state
      const store = useAuthStore();
      
      // Set up logged in state
      store.login({
        userToken: 'test-token',
        username: 'testuser',
        group: 'vip',
        frpToken: 'frp-token',
      });

      expect(store.isLoggedIn).toBe(true);

      // Mock config operations
      const mockConfig: UnifiedConfig = {
        userToken: 'test-token',
        username: 'testuser',
        group: 'vip',
        frpToken: 'frp-token',
        autoStart: false,
        alwaysOnTop: false,
        autoUpdate: false,
        autoStartTunnels: [],
        startupDelay: 0,
        minimizeToTray: false,
        showAd: true,
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockConfig); // load_unified_config
      vi.mocked(invoke).mockResolvedValueOnce(undefined); // save_unified_config

      await store.logout();

      // Verify all auth state is cleared
      expect(store.isLoggedIn).toBe(false);
      expect(store.userToken).toBe('');
      expect(store.username).toBe('');
      expect(store.group).toBe('');
      expect(store.frpToken).toBe('');
      expect(store.isAuthenticated).toBe(false);
    });

    it('should clear login information from UnifiedConfig', async () => {
      // Validates: Requirement 2.8 - Clear config
      const store = useAuthStore();
      
      store.login({
        userToken: 'test-token',
        username: 'testuser',
      });

      const mockConfig: UnifiedConfig = {
        userToken: 'test-token',
        username: 'testuser',
        group: 'vip',
        frpToken: 'frp-token',
        autoStart: true,
        alwaysOnTop: false,
        autoUpdate: true,
        autoStartTunnels: [1, 2, 3],
        startupDelay: 5,
        minimizeToTray: true,
        showAd: false,
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockConfig); // load_unified_config
      vi.mocked(invoke).mockResolvedValueOnce(undefined); // save_unified_config

      await store.logout();

      // Verify save_unified_config was called with cleared auth fields
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

    it('should preserve non-auth config fields', async () => {
      // Validates: Requirement 2.8 - Preserve other settings
      const store = useAuthStore();
      
      store.login({
        userToken: 'test-token',
        username: 'testuser',
      });

      const mockConfig: UnifiedConfig = {
        userToken: 'test-token',
        username: 'testuser',
        group: 'vip',
        frpToken: 'frp-token',
        autoStart: true,
        alwaysOnTop: true,
        autoUpdate: false,
        autoStartTunnels: [1, 2],
        startupDelay: 10,
        minimizeToTray: true,
        showAd: false,
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockConfig);
      vi.mocked(invoke).mockResolvedValueOnce(undefined);

      await store.logout();

      const savedConfig = vi.mocked(invoke).mock.calls[1][1].config;
      
      // Verify non-auth fields are preserved
      expect(savedConfig.autoStart).toBe(true);
      expect(savedConfig.alwaysOnTop).toBe(true);
      expect(savedConfig.autoUpdate).toBe(false);
      expect(savedConfig.autoStartTunnels).toEqual([1, 2]);
      expect(savedConfig.startupDelay).toBe(10);
      expect(savedConfig.minimizeToTray).toBe(true);
      expect(savedConfig.showAd).toBe(false);
    });
  });

  describe('Store Communication', () => {
    it('should handle missing User Store gracefully', async () => {
      // Validates: Requirement 8.1 - Handle missing stores
      const store = useAuthStore();
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      store.login({
        userToken: 'test-token',
        username: 'testuser',
      });

      const mockConfig: UnifiedConfig = {
        userToken: 'test-token',
        username: 'testuser',
        group: '',
        frpToken: '',
        autoStart: false,
        alwaysOnTop: false,
        autoUpdate: false,
        autoStartTunnels: [],
        startupDelay: 0,
        minimizeToTray: false,
        showAd: true,
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockConfig);
      vi.mocked(invoke).mockResolvedValueOnce(undefined);

      // Should not throw even if User Store doesn't exist
      await expect(store.logout()).resolves.not.toThrow();

      expect(store.isLoggedIn).toBe(false);
      
      consoleWarnSpy.mockRestore();
    });

    it('should handle missing Tunnel Store gracefully', async () => {
      // Validates: Requirement 8.2 - Handle missing stores
      const store = useAuthStore();
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      store.login({
        userToken: 'test-token',
        username: 'testuser',
      });

      const mockConfig: UnifiedConfig = {
        userToken: 'test-token',
        username: 'testuser',
        group: '',
        frpToken: '',
        autoStart: false,
        alwaysOnTop: false,
        autoUpdate: false,
        autoStartTunnels: [],
        startupDelay: 0,
        minimizeToTray: false,
        showAd: true,
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockConfig);
      vi.mocked(invoke).mockResolvedValueOnce(undefined);

      // Should not throw even if Tunnel Store doesn't exist
      await expect(store.logout()).resolves.not.toThrow();

      expect(store.isLoggedIn).toBe(false);
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should throw error if config loading fails', async () => {
      // Validates: Requirement 2.4 - Error handling
      const store = useAuthStore();
      
      store.login({
        userToken: 'test-token',
        username: 'testuser',
      });

      vi.mocked(invoke).mockRejectedValueOnce(new Error('Config load failed'));

      await expect(store.logout()).rejects.toThrow('Config load failed');
    });

    it('should throw error if config saving fails', async () => {
      // Validates: Requirement 2.4 - Error handling
      const store = useAuthStore();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      store.login({
        userToken: 'test-token',
        username: 'testuser',
      });

      const mockConfig: UnifiedConfig = {
        userToken: 'test-token',
        username: 'testuser',
        group: '',
        frpToken: '',
        autoStart: false,
        alwaysOnTop: false,
        autoUpdate: false,
        autoStartTunnels: [],
        startupDelay: 0,
        minimizeToTray: false,
        showAd: true,
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockConfig);
      vi.mocked(invoke).mockRejectedValueOnce(new Error('Config save failed'));

      await expect(store.logout()).rejects.toThrow('Config save failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '清除登录信息失败:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });

    it('should clear local state even if config operations fail', async () => {
      // Validates: Requirement 2.4 - Partial success handling
      const store = useAuthStore();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      store.login({
        userToken: 'test-token',
        username: 'testuser',
      });

      vi.mocked(invoke).mockRejectedValue(new Error('Config error'));

      try {
        await store.logout();
      } catch (error) {
        // Expected to throw
      }

      // Local state should still be cleared
      expect(store.isLoggedIn).toBe(false);
      expect(store.userToken).toBe('');
      expect(store.username).toBe('');
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle logout when already logged out', async () => {
      // Validates: Requirement 2.4 - Idempotent operation
      const store = useAuthStore();
      
      expect(store.isLoggedIn).toBe(false);

      const mockConfig: UnifiedConfig = {
        userToken: '',
        username: '',
        group: '',
        frpToken: '',
        autoStart: false,
        alwaysOnTop: false,
        autoUpdate: false,
        autoStartTunnels: [],
        startupDelay: 0,
        minimizeToTray: false,
        showAd: true,
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockConfig);
      vi.mocked(invoke).mockResolvedValueOnce(undefined);

      await expect(store.logout()).resolves.not.toThrow();

      expect(store.isLoggedIn).toBe(false);
    });

    it('should handle empty config gracefully', async () => {
      // Validates: Requirement 2.4 - Handle edge cases
      const store = useAuthStore();
      
      store.login({
        userToken: 'test-token',
        username: 'testuser',
      });

      const emptyConfig = {} as UnifiedConfig;

      vi.mocked(invoke).mockResolvedValueOnce(emptyConfig);
      vi.mocked(invoke).mockResolvedValueOnce(undefined);

      await expect(store.logout()).resolves.not.toThrow();

      expect(store.isLoggedIn).toBe(false);
    });
  });
});
