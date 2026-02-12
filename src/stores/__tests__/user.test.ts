import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUserStore } from '@/stores/user';
import type { UserDetailInfo } from '@/types/store';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const store = useUserStore();
    
    expect(store.userInfo).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.error).toBe('');
  });

  it('should format bandwidth correctly', () => {
    const store = useUserStore();
    
    // Test with null userInfo
    expect(store.formattedBandwidth('in')).toBe('0 Mbps');
    expect(store.formattedBandwidth('out')).toBe('0 Mbps');
    
    // Set userInfo
    store.userInfo = {
      email: 'test@example.com',
      friendlyGroup: 'VIP',
      group: 'vip',
      inBound: 100,
      outBound: 50,
      isRealname: false,
      maxProxies: 10,
      regTime: 1609459200,
      status: 1,
      todaySigned: false,
      traffic: 51200,
      usedProxies: 5,
      userId: 123,
      username: 'testuser',
    } as UserDetailInfo;
    
    expect(store.formattedBandwidth('in')).toBe('100 Mbps');
    expect(store.formattedBandwidth('out')).toBe('50 Mbps');
  });

  it('should format traffic correctly', () => {
    const store = useUserStore();
    
    // Test with null userInfo
    expect(store.formattedTraffic).toBe('0 GB');
    
    // Set userInfo with traffic in MB
    store.userInfo = {
      email: 'test@example.com',
      friendlyGroup: 'VIP',
      group: 'vip',
      inBound: 100,
      outBound: 50,
      isRealname: false,
      maxProxies: 10,
      regTime: 1609459200,
      status: 1,
      todaySigned: false,
      traffic: 51200, // 51200 MB = 50 GB
      usedProxies: 5,
      userId: 123,
      username: 'testuser',
    } as UserDetailInfo;
    
    expect(store.formattedTraffic).toBe('50.00 GB');
  });

  it('should format registration time correctly', () => {
    const store = useUserStore();
    
    // Test with null userInfo
    expect(store.formattedRegTime).toBe('');
    
    // Set userInfo with regTime (Unix timestamp in seconds)
    store.userInfo = {
      email: 'test@example.com',
      friendlyGroup: 'VIP',
      group: 'vip',
      inBound: 100,
      outBound: 50,
      isRealname: false,
      maxProxies: 10,
      regTime: 1609459200, // 2021-01-01 00:00:00 UTC
      status: 1,
      todaySigned: false,
      traffic: 51200,
      usedProxies: 5,
      userId: 123,
      username: 'testuser',
    } as UserDetailInfo;
    
    expect(store.formattedRegTime).toBe('2021-01-01');
  });

  it('should clear user info correctly', () => {
    const store = useUserStore();
    
    // Set some state
    store.userInfo = {
      email: 'test@example.com',
      friendlyGroup: 'VIP',
      group: 'vip',
      inBound: 100,
      outBound: 50,
      isRealname: false,
      maxProxies: 10,
      regTime: 1609459200,
      status: 1,
      todaySigned: false,
      traffic: 51200,
      usedProxies: 5,
      userId: 123,
      username: 'testuser',
    } as UserDetailInfo;
    store.loading = true;
    store.error = 'Some error';
    
    // Clear
    store.clearUserInfo();
    
    expect(store.userInfo).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.error).toBe('');
  });

  it('should load user info successfully', async () => {
    const store = useUserStore();
    
    const mockUserInfo: UserDetailInfo = {
      email: 'test@example.com',
      friendlyGroup: 'VIP',
      group: 'vip',
      inBound: 100,
      outBound: 50,
      isRealname: false,
      maxProxies: 10,
      regTime: 1609459200,
      status: 1,
      todaySigned: false,
      traffic: 51200,
      usedProxies: 5,
      userId: 123,
      username: 'testuser',
    };
    
    vi.mocked(invoke).mockResolvedValue(mockUserInfo);
    
    // Initially loading should be false
    expect(store.loading).toBe(false);
    
    // Call loadUserInfo
    const promise = store.loadUserInfo();
    
    // During loading, loading should be true
    expect(store.loading).toBe(true);
    
    await promise;
    
    // After loading, loading should be false and userInfo should be set
    expect(store.loading).toBe(false);
    expect(store.userInfo).toEqual(mockUserInfo);
    expect(store.error).toBe('');
    expect(invoke).toHaveBeenCalledWith('api_get_user_info');
  });

  it('should handle load user info error', async () => {
    const store = useUserStore();
    
    const errorMessage = 'Failed to fetch user info';
    vi.mocked(invoke).mockRejectedValue(new Error(errorMessage));
    
    // Call loadUserInfo and expect it to throw
    await expect(store.loadUserInfo()).rejects.toThrow(errorMessage);
    
    // After error, loading should be false and error should be set
    expect(store.loading).toBe(false);
    expect(store.userInfo).toBeNull();
    expect(store.error).toBe(errorMessage);
  });

  it('should refresh user info', async () => {
    const store = useUserStore();
    
    const mockUserInfo: UserDetailInfo = {
      email: 'test@example.com',
      friendlyGroup: 'VIP',
      group: 'vip',
      inBound: 100,
      outBound: 50,
      isRealname: false,
      maxProxies: 10,
      regTime: 1609459200,
      status: 1,
      todaySigned: false,
      traffic: 51200,
      usedProxies: 5,
      userId: 123,
      username: 'testuser',
    };
    
    vi.mocked(invoke).mockResolvedValue(mockUserInfo);
    
    await store.refreshUserInfo();
    
    expect(store.userInfo).toEqual(mockUserInfo);
    expect(invoke).toHaveBeenCalledWith('api_get_user_info');
  });

  it('should clear error', () => {
    const store = useUserStore();
    
    store.error = 'Some error';
    store.clearError();
    
    expect(store.error).toBe('');
  });
});
