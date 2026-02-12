/**
 * User Store Property-Based Tests
 * 
 * Property-based tests for User Store using fast-check.
 * Each property is tested across many randomly generated inputs.
 * 
 * Feature: pinia-state-management
 */

import { fc, test } from '@fast-check/vitest';
import { beforeEach, describe } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '../user';
import { vi } from 'vitest';
import type { UserDetailInfo } from '@/types/store';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';

describe('User Store - Property-Based Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  /**
   * Property 4: 用户信息加载
   * 
   * **Validates: Requirements 3.3**
   * 
   * For any successful API response, when calling User Store's loadUserInfo action,
   * userInfo should be correctly updated, loading state should be true during execution,
   * and false after completion.
   */
  test.prop([
    fc.record({
      email: fc.emailAddress(),
      friendlyGroup: fc.string({ minLength: 1, maxLength: 20 }),
      group: fc.string({ minLength: 1, maxLength: 20 }),
      inBound: fc.integer({ min: 0, max: 10000 }),
      outBound: fc.integer({ min: 0, max: 10000 }),
      isRealname: fc.boolean(),
      maxProxies: fc.integer({ min: 1, max: 100 }),
      regTime: fc.integer({ min: 1000000000, max: 2000000000 }), // Unix timestamp
      status: fc.integer({ min: 0, max: 2 }),
      todaySigned: fc.boolean(),
      traffic: fc.integer({ min: 0, max: 1000000 }), // Traffic in MB
      usedProxies: fc.integer({ min: 0, max: 100 }),
      userId: fc.integer({ min: 1, max: 1000000 }),
      username: fc.string({ minLength: 1, maxLength: 50 }),
    })
  ], { numRuns: 100 })('Property 4: loadUserInfo should update state correctly for any valid API response', async (mockUserInfo) => {
    const store = useUserStore();
    
    // Mock successful API response
    vi.mocked(invoke).mockResolvedValueOnce(mockUserInfo);
    
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

  /**
   * Property 5: 用户信息格式化
   * 
   * **Validates: Requirements 3.6**
   * 
   * For any user information object, User Store's getters should return correctly formatted strings:
   * bandwidth in Mbps, traffic in GB, time in YYYY-MM-DD format.
   */
  test.prop([
    fc.record({
      email: fc.emailAddress(),
      friendlyGroup: fc.string({ minLength: 1, maxLength: 20 }),
      group: fc.string({ minLength: 1, maxLength: 20 }),
      inBound: fc.integer({ min: 0, max: 10000 }),
      outBound: fc.integer({ min: 0, max: 10000 }),
      isRealname: fc.boolean(),
      maxProxies: fc.integer({ min: 1, max: 100 }),
      regTime: fc.integer({ min: 1000000000, max: 2000000000 }), // Unix timestamp
      status: fc.integer({ min: 0, max: 2 }),
      todaySigned: fc.boolean(),
      traffic: fc.integer({ min: 0, max: 1000000 }), // Traffic in MB
      usedProxies: fc.integer({ min: 0, max: 100 }),
      userId: fc.integer({ min: 1, max: 1000000 }),
      username: fc.string({ minLength: 1, maxLength: 50 }),
    })
  ], { numRuns: 100 })('Property 5: getters should format user info correctly for any valid user data', (userInfo) => {
    const store = useUserStore();
    
    // Set userInfo
    store.userInfo = userInfo as UserDetailInfo;
    
    // Test bandwidth formatting
    const formattedInBound = store.formattedBandwidth('in');
    const formattedOutBound = store.formattedBandwidth('out');
    expect(formattedInBound).toBe(`${userInfo.inBound} Mbps`);
    expect(formattedOutBound).toBe(`${userInfo.outBound} Mbps`);
    
    // Test traffic formatting (MB to GB)
    const expectedTrafficGB = (userInfo.traffic / 1024).toFixed(2);
    expect(store.formattedTraffic).toBe(`${expectedTrafficGB} GB`);
    
    // Test registration time formatting (Unix timestamp to YYYY-MM-DD)
    const date = new Date(userInfo.regTime * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const expectedDate = `${year}-${month}-${day}`;
    expect(store.formattedRegTime).toBe(expectedDate);
  });
});
