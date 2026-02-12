/**
 * Tunnel Store Property-Based Tests
 * 
 * Property-based tests for Tunnel Store using fast-check.
 * Each property is tested across many randomly generated inputs.
 * 
 * Feature: pinia-state-management
 */

import { fc, test } from '@fast-check/vitest';
import { beforeEach, describe, expect } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTunnelStore } from '../tunnel';
import { vi } from 'vitest';
import type { Tunnel, Node } from '@/types/store';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';

// Generators for test data
const tunnelGenerator = fc.record({
  proxyId: fc.integer({ min: 1, max: 100000 }),
  username: fc.string({ minLength: 1, maxLength: 50 }),
  proxyName: fc.string({ minLength: 1, maxLength: 100 }),
  proxyType: fc.constantFrom('tcp', 'udp', 'http', 'https'),
  isBanned: fc.boolean(),
  isDisabled: fc.boolean(),
  localIp: fc.ipV4(),
  localPort: fc.integer({ min: 1, max: 65535 }),
  remotePort: fc.integer({ min: 1, max: 65535 }),
  nodeId: fc.integer({ min: 1, max: 100 }),
  runId: fc.uuid(),
  isOnline: fc.boolean(),
  domain: fc.domain(),
  lastStartTime: fc.integer({ min: 0, max: 2000000000 }),
  lastCloseTime: fc.integer({ min: 0, max: 2000000000 }),
  useEncryption: fc.boolean(),
  useCompression: fc.boolean(),
  sk: fc.string({ minLength: 10, maxLength: 50 }),
  remark: fc.string({ maxLength: 200 }),
});

const nodeGenerator = fc.record({
  nodeId: fc.integer({ min: 1, max: 100 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  hostname: fc.domain(),
  description: fc.string({ maxLength: 200 }),
  token: fc.string({ minLength: 10, maxLength: 50 }),
  servicePort: fc.integer({ min: 1, max: 65535 }),
  adminPort: fc.integer({ min: 1, max: 65535 }),
  adminPass: fc.string({ minLength: 8, maxLength: 50 }),
  allowGroup: fc.string({ maxLength: 100 }),
  allowPort: fc.string({ maxLength: 100 }),
  allowType: fc.string({ maxLength: 100 }),
  region: fc.constantFrom('CN', 'US', 'EU', 'AS'),
  bandwidth: fc.string({ minLength: 1, maxLength: 20 }),
  isOnline: fc.boolean(),
  isDisabled: fc.boolean(),
  totalTrafficIn: fc.integer({ min: 0, max: 1000000000 }),
  totalTrafficOut: fc.integer({ min: 0, max: 1000000000 }),
  upTime: fc.integer({ min: 0, max: 1000000 }),
  version: fc.string({ minLength: 1, maxLength: 20 }),
});

describe('Tunnel Store - Property-Based Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  /**
   * Property 6: 隧道列表加载
   * 
   * **Validates: Requirements 4.4**
   * 
   * For any successful API response, when calling Tunnel Store's loadTunnels action,
   * tunnels array should be correctly updated, nodeNameMap should contain all node name mappings,
   * loading state should be true during execution, and false after completion.
   */
  test.prop([
    fc.array(tunnelGenerator, { minLength: 0, maxLength: 20 }),
    fc.array(nodeGenerator, { minLength: 0, maxLength: 10 })
  ], { numRuns: 100 })('Property 6: loadTunnels should update state correctly for any valid API response', async (mockTunnels, mockNodes) => {
    const store = useTunnelStore();
    
    // Mock successful API responses
    vi.mocked(invoke).mockImplementation(async (cmd: string) => {
      if (cmd === 'api_get_proxies') {
        return mockTunnels;
      } else if (cmd === 'api_get_nodes') {
        return mockNodes;
      }
      throw new Error(`Unexpected command: ${cmd}`);
    });
    
    // Initially loading should be false
    expect(store.loading).toBe(false);
    
    // Call loadTunnels
    const promise = store.loadTunnels();
    
    // During loading, loading should be true
    expect(store.loading).toBe(true);
    
    await promise;
    
    // After loading, loading should be false and data should be set
    expect(store.loading).toBe(false);
    expect(store.tunnels).toEqual(mockTunnels);
    expect(store.error).toBe('');
    
    // Build expected maps (last node with same ID wins, matching implementation)
    const expectedNameMap: Record<number, string> = {};
    const expectedHostnameMap: Record<number, string> = {};
    mockNodes.forEach(node => {
      expectedNameMap[node.nodeId] = node.name;
      expectedHostnameMap[node.nodeId] = node.hostname;
    });
    
    // Verify nodeNameMap and nodeHostnameMap match expected
    expect(store.nodeNameMap).toEqual(expectedNameMap);
    expect(store.nodeHostnameMap).toEqual(expectedHostnameMap);
    
    expect(invoke).toHaveBeenCalledWith('api_get_proxies');
    expect(invoke).toHaveBeenCalledWith('api_get_nodes');
  });

  /**
   * Property 7: 隧道启动状态更新
   * 
   * **Validates: Requirements 4.5**
   * 
   * For any tunnel ID, when calling Tunnel Store's startTunnel action successfully,
   * runningTunnels set should contain that ID, and the corresponding tunnel's isOnline should be true.
   */
  test.prop([
    fc.array(tunnelGenerator, { minLength: 1, maxLength: 20 }),
    fc.integer({ min: 0, max: 19 }) // Index to select which tunnel to start
  ], { numRuns: 100 })('Property 7: startTunnel should update state correctly for any tunnel', async (mockTunnels, tunnelIndex) => {
    const store = useTunnelStore();
    
    // Adjust index to valid range
    const validIndex = tunnelIndex % mockTunnels.length;
    const tunnelToStart = mockTunnels[validIndex];
    
    // Set initial state
    store.tunnels = mockTunnels.map(t => ({ ...t, isOnline: false }));
    store.runningTunnels = new Set();
    
    // Mock successful start_tunnel call
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    
    // Call startTunnel
    await store.startTunnel(tunnelToStart.proxyId);
    
    // Verify runningTunnels contains the ID
    expect(store.runningTunnels.has(tunnelToStart.proxyId)).toBe(true);
    
    // Verify tunnel's isOnline is true
    const updatedTunnel = store.tunnels.find(t => t.proxyId === tunnelToStart.proxyId);
    expect(updatedTunnel?.isOnline).toBe(true);
    
    expect(invoke).toHaveBeenCalledWith('start_tunnel', { proxyId: tunnelToStart.proxyId });
  });

  /**
   * Property 8: 隧道停止状态更新
   * 
   * **Validates: Requirements 4.6**
   * 
   * For any running tunnel ID, when calling Tunnel Store's stopTunnel action successfully,
   * runningTunnels set should not contain that ID, and the corresponding tunnel's isOnline should be false.
   */
  test.prop([
    fc.array(tunnelGenerator, { minLength: 1, maxLength: 20 }),
    fc.integer({ min: 0, max: 19 }) // Index to select which tunnel to stop
  ], { numRuns: 100 })('Property 8: stopTunnel should update state correctly for any running tunnel', async (mockTunnels, tunnelIndex) => {
    const store = useTunnelStore();
    
    // Adjust index to valid range
    const validIndex = tunnelIndex % mockTunnels.length;
    const tunnelToStop = mockTunnels[validIndex];
    
    // Set initial state - tunnel is running
    store.tunnels = mockTunnels.map(t => ({
      ...t,
      isOnline: t.proxyId === tunnelToStop.proxyId
    }));
    store.runningTunnels = new Set([tunnelToStop.proxyId]);
    
    // Mock successful stop_tunnel call
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    
    // Call stopTunnel
    await store.stopTunnel(tunnelToStop.proxyId);
    
    // Verify runningTunnels does not contain the ID
    expect(store.runningTunnels.has(tunnelToStop.proxyId)).toBe(false);
    
    // Verify tunnel's isOnline is false
    const updatedTunnel = store.tunnels.find(t => t.proxyId === tunnelToStop.proxyId);
    expect(updatedTunnel?.isOnline).toBe(false);
    
    expect(invoke).toHaveBeenCalledWith('stop_tunnel', { proxyId: tunnelToStop.proxyId });
  });
});
