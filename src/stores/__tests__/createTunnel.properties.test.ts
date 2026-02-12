/**
 * CreateTunnel Store Property-Based Tests
 * 
 * Property-based tests for CreateTunnel Store using fast-check.
 * Each property is tested across many randomly generated inputs.
 * 
 * Feature: pinia-state-management
 */

import { fc, test } from '@fast-check/vitest';
import { beforeEach, describe, expect } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCreateTunnelStore } from '../createTunnel';
import type { Node } from '@/types/store';

describe('CreateTunnel Store - Property-Based Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  /**
   * Property 12: 节点选择状态更新
   * 
   * **Validates: Requirements 6.3**
   * 
   * For any node object, when calling CreateTunnel Store's selectNode action,
   * selectedNode should be set to that node, and currentPage should become 'tunnel-config'.
   */
  test.prop([
    fc.record({
      nodeId: fc.integer({ min: 1, max: 10000 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      hostname: fc.domain(),
      description: fc.string({ maxLength: 200 }),
      token: fc.string({ minLength: 10, maxLength: 100 }),
      servicePort: fc.integer({ min: 1024, max: 65535 }),
      adminPort: fc.integer({ min: 1024, max: 65535 }),
      adminPass: fc.string({ minLength: 8, maxLength: 32 }),
      allowGroup: fc.string({ maxLength: 50 }),
      allowPort: fc.string({ maxLength: 100 }),
      allowType: fc.string({ maxLength: 50 }),
      region: fc.constantFrom('CN', 'US', 'EU', 'AS', 'HK', 'TW'),
      bandwidth: fc.constantFrom('100Mbps', '1Gbps', '10Gbps', '100Gbps'),
      isOnline: fc.boolean(),
      isDisabled: fc.boolean(),
      totalTrafficIn: fc.integer({ min: 0, max: 1000000000 }),
      totalTrafficOut: fc.integer({ min: 0, max: 1000000000 }),
      upTime: fc.integer({ min: 0, max: 31536000 }), // up to 1 year in seconds
      version: fc.constantFrom('0.51.0', '0.52.0', '0.53.0', '1.0.0'),
    })
  ], { numRuns: 100 })('Property 12: selectNode should update state correctly for any node', (node: Node) => {
    // Create a fresh pinia instance for each test to ensure isolation
    setActivePinia(createPinia());
    const store = useCreateTunnelStore();
    
    // Verify initial state
    expect(store.currentPage).toBe('node-selection');
    expect(store.selectedNode).toBeNull();
    expect(store.isNodeSelected).toBe(false);
    
    // Execute selectNode
    store.selectNode(node);
    
    // Verify state is updated correctly
    expect(store.selectedNode).toEqual(node);
    expect(store.currentPage).toBe('tunnel-config');
    expect(store.isNodeSelected).toBe(true);
    expect(store.currentPageName).toBe('tunnel-config');
    
    // Verify the selected node has all expected properties
    expect(store.selectedNode?.nodeId).toBe(node.nodeId);
    expect(store.selectedNode?.name).toBe(node.name);
    expect(store.selectedNode?.hostname).toBe(node.hostname);
  });

  /**
   * Property: 返回节点选择状态更新
   * 
   * **Validates: Requirements 6.4**
   * 
   * For any selected node state, when calling CreateTunnel Store's goBackToNodeSelection action,
   * selectedNode should be cleared (null), and currentPage should become 'node-selection'.
   */
  test.prop([
    fc.record({
      nodeId: fc.integer({ min: 1, max: 10000 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      hostname: fc.domain(),
      description: fc.string({ maxLength: 200 }),
      token: fc.string({ minLength: 10, maxLength: 100 }),
      servicePort: fc.integer({ min: 1024, max: 65535 }),
      adminPort: fc.integer({ min: 1024, max: 65535 }),
      adminPass: fc.string({ minLength: 8, maxLength: 32 }),
      allowGroup: fc.string({ maxLength: 50 }),
      allowPort: fc.string({ maxLength: 100 }),
      allowType: fc.string({ maxLength: 50 }),
      region: fc.constantFrom('CN', 'US', 'EU', 'AS', 'HK', 'TW'),
      bandwidth: fc.constantFrom('100Mbps', '1Gbps', '10Gbps', '100Gbps'),
      isOnline: fc.boolean(),
      isDisabled: fc.boolean(),
      totalTrafficIn: fc.integer({ min: 0, max: 1000000000 }),
      totalTrafficOut: fc.integer({ min: 0, max: 1000000000 }),
      upTime: fc.integer({ min: 0, max: 31536000 }),
      version: fc.constantFrom('0.51.0', '0.52.0', '0.53.0', '1.0.0'),
    })
  ], { numRuns: 100 })('goBackToNodeSelection should clear state for any selected node', (node: Node) => {
    // Create a fresh pinia instance for each test to ensure isolation
    setActivePinia(createPinia());
    const store = useCreateTunnelStore();
    
    // Set up state with selected node
    store.selectNode(node);
    expect(store.selectedNode).toEqual(node);
    expect(store.currentPage).toBe('tunnel-config');
    
    // Execute goBackToNodeSelection
    store.goBackToNodeSelection();
    
    // Verify state is cleared
    expect(store.selectedNode).toBeNull();
    expect(store.currentPage).toBe('node-selection');
    expect(store.isNodeSelected).toBe(false);
    expect(store.currentPageName).toBe('node-selection');
  });

  /**
   * Property: 重置创建流程状态
   * 
   * **Validates: Requirements 6.7**
   * 
   * For any state (with or without selected node), when calling CreateTunnel Store's resetCreateFlow action,
   * all state should be reset to initial values (selectedNode = null, currentPage = 'node-selection').
   */
  test.prop([
    fc.option(
      fc.record({
        nodeId: fc.integer({ min: 1, max: 10000 }),
        name: fc.string({ minLength: 1, maxLength: 50 }),
        hostname: fc.domain(),
        description: fc.string({ maxLength: 200 }),
        token: fc.string({ minLength: 10, maxLength: 100 }),
        servicePort: fc.integer({ min: 1024, max: 65535 }),
        adminPort: fc.integer({ min: 1024, max: 65535 }),
        adminPass: fc.string({ minLength: 8, maxLength: 32 }),
        allowGroup: fc.string({ maxLength: 50 }),
        allowPort: fc.string({ maxLength: 100 }),
        allowType: fc.string({ maxLength: 50 }),
        region: fc.constantFrom('CN', 'US', 'EU', 'AS', 'HK', 'TW'),
        bandwidth: fc.constantFrom('100Mbps', '1Gbps', '10Gbps', '100Gbps'),
        isOnline: fc.boolean(),
        isDisabled: fc.boolean(),
        totalTrafficIn: fc.integer({ min: 0, max: 1000000000 }),
        totalTrafficOut: fc.integer({ min: 0, max: 1000000000 }),
        upTime: fc.integer({ min: 0, max: 31536000 }),
        version: fc.constantFrom('0.51.0', '0.52.0', '0.53.0', '1.0.0'),
      }),
      { nil: null }
    )
  ], { numRuns: 100 })('resetCreateFlow should reset to initial state from any state', (maybeNode) => {
    // Create a fresh pinia instance for each test to ensure isolation
    setActivePinia(createPinia());
    const store = useCreateTunnelStore();
    
    // Set up state (may or may not have a selected node)
    if (maybeNode) {
      store.selectNode(maybeNode);
      expect(store.selectedNode).toEqual(maybeNode);
      expect(store.currentPage).toBe('tunnel-config');
    }
    
    // Execute resetCreateFlow
    store.resetCreateFlow();
    
    // Verify state is reset to initial values
    expect(store.selectedNode).toBeNull();
    expect(store.currentPage).toBe('node-selection');
    expect(store.isNodeSelected).toBe(false);
    expect(store.currentPageName).toBe('node-selection');
  });

  /**
   * Property: 状态转换幂等性
   * 
   * Verifies that calling the same action multiple times produces consistent results.
   */
  test.prop([
    fc.record({
      nodeId: fc.integer({ min: 1, max: 10000 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      hostname: fc.domain(),
      description: fc.string({ maxLength: 200 }),
      token: fc.string({ minLength: 10, maxLength: 100 }),
      servicePort: fc.integer({ min: 1024, max: 65535 }),
      adminPort: fc.integer({ min: 1024, max: 65535 }),
      adminPass: fc.string({ minLength: 8, maxLength: 32 }),
      allowGroup: fc.string({ maxLength: 50 }),
      allowPort: fc.string({ maxLength: 100 }),
      allowType: fc.string({ maxLength: 50 }),
      region: fc.constantFrom('CN', 'US', 'EU', 'AS', 'HK', 'TW'),
      bandwidth: fc.constantFrom('100Mbps', '1Gbps', '10Gbps', '100Gbps'),
      isOnline: fc.boolean(),
      isDisabled: fc.boolean(),
      totalTrafficIn: fc.integer({ min: 0, max: 1000000000 }),
      totalTrafficOut: fc.integer({ min: 0, max: 1000000000 }),
      upTime: fc.integer({ min: 0, max: 31536000 }),
      version: fc.constantFrom('0.51.0', '0.52.0', '0.53.0', '1.0.0'),
    }),
    fc.integer({ min: 2, max: 5 })
  ], { numRuns: 100 })('multiple calls to same action should be idempotent', (node: Node, callCount: number) => {
    // Create a fresh pinia instance for each test to ensure isolation
    setActivePinia(createPinia());
    const store = useCreateTunnelStore();
    
    // Call selectNode multiple times
    for (let i = 0; i < callCount; i++) {
      store.selectNode(node);
    }
    
    // State should be the same as calling once
    expect(store.selectedNode).toEqual(node);
    expect(store.currentPage).toBe('tunnel-config');
    
    // Call goBackToNodeSelection multiple times
    for (let i = 0; i < callCount; i++) {
      store.goBackToNodeSelection();
    }
    
    // State should be the same as calling once
    expect(store.selectedNode).toBeNull();
    expect(store.currentPage).toBe('node-selection');
  });
});
