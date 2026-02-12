/**
 * Tunnel Store Unit Tests
 * 
 * Unit tests for Tunnel Store functionality.
 */

import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTunnelStore } from '../tunnel';
import type { Tunnel, Node } from '@/types/store';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';

describe('Tunnel Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const store = useTunnelStore();
      
      expect(store.tunnels).toEqual([]);
      expect(store.runningTunnels).toEqual(new Set());
      expect(store.nodeNameMap).toEqual({});
      expect(store.nodeHostnameMap).toEqual({});
      expect(store.loading).toBe(false);
      expect(store.error).toBe('');
      expect(store.actionLoading).toEqual({});
    });
  });

  describe('Getters', () => {
    it('should get tunnel by ID', () => {
      const store = useTunnelStore();
      const mockTunnel: Tunnel = {
        proxyId: 1,
        username: 'test',
        proxyName: 'test-tunnel',
        proxyType: 'tcp',
        isBanned: false,
        isDisabled: false,
        localIp: '127.0.0.1',
        localPort: 8080,
        remotePort: 80,
        nodeId: 1,
        runId: 'run-1',
        isOnline: false,
        domain: 'test.com',
        lastStartTime: 0,
        lastCloseTime: 0,
        useEncryption: false,
        useCompression: false,
        sk: 'secret',
        remark: 'test',
      };
      
      store.tunnels = [mockTunnel];
      
      expect(store.getTunnelById(1)).toEqual(mockTunnel);
      expect(store.getTunnelById(999)).toBeUndefined();
    });

    it('should get node name', () => {
      const store = useTunnelStore();
      store.nodeNameMap = { 1: 'Node 1', 2: 'Node 2' };
      
      expect(store.getNodeName(1)).toBe('Node 1');
      expect(store.getNodeName(999)).toBe('节点 999');
    });

    it('should get node hostname', () => {
      const store = useTunnelStore();
      store.nodeHostnameMap = { 1: 'node1.example.com', 2: 'node2.example.com' };
      
      expect(store.getNodeHostname(1)).toBe('node1.example.com');
      expect(store.getNodeHostname(999)).toBe('');
    });

    it('should count online tunnels', () => {
      const store = useTunnelStore();
      store.runningTunnels = new Set([1, 2, 3]);
      
      expect(store.onlineTunnelsCount).toBe(3);
    });

    it('should count total tunnels', () => {
      const store = useTunnelStore();
      store.tunnels = [
        { proxyId: 1 } as Tunnel,
        { proxyId: 2 } as Tunnel,
      ];
      
      expect(store.totalTunnelsCount).toBe(2);
    });
  });

  describe('loadTunnels', () => {
    it('should load tunnels and nodes successfully', async () => {
      const store = useTunnelStore();
      
      const mockTunnels: Tunnel[] = [
        {
          proxyId: 1,
          username: 'test',
          proxyName: 'tunnel-1',
          proxyType: 'tcp',
          isBanned: false,
          isDisabled: false,
          localIp: '127.0.0.1',
          localPort: 8080,
          remotePort: 80,
          nodeId: 1,
          runId: 'run-1',
          isOnline: false,
          domain: 'test.com',
          lastStartTime: 0,
          lastCloseTime: 0,
          useEncryption: false,
          useCompression: false,
          sk: 'secret',
          remark: 'test',
        },
      ];
      
      const mockNodes: Node[] = [
        {
          nodeId: 1,
          name: 'Node 1',
          hostname: 'node1.example.com',
          description: 'Test node',
          token: 'token',
          servicePort: 7000,
          adminPort: 7500,
          adminPass: 'pass',
          allowGroup: 'all',
          allowPort: '1-65535',
          allowType: 'tcp,udp',
          region: 'CN',
          bandwidth: '100M',
          isOnline: true,
          isDisabled: false,
          totalTrafficIn: 0,
          totalTrafficOut: 0,
          upTime: 0,
          version: '1.0',
        },
      ];
      
      vi.mocked(invoke).mockImplementation(async (cmd: string) => {
        if (cmd === 'api_get_proxies') return mockTunnels;
        if (cmd === 'api_get_nodes') return mockNodes;
        throw new Error(`Unexpected command: ${cmd}`);
      });
      
      await store.loadTunnels();
      
      expect(store.tunnels).toEqual(mockTunnels);
      expect(store.nodeNameMap).toEqual({ 1: 'Node 1' });
      expect(store.nodeHostnameMap).toEqual({ 1: 'node1.example.com' });
      expect(store.loading).toBe(false);
      expect(store.error).toBe('');
    });

    it('should handle load error', async () => {
      const store = useTunnelStore();
      const errorMessage = 'Network error';
      
      vi.mocked(invoke).mockRejectedValueOnce(new Error(errorMessage));
      
      await store.loadTunnels();
      
      expect(store.loading).toBe(false);
      expect(store.error).toBe(errorMessage);
    });
  });

  describe('loadRunningTunnels', () => {
    it('should load running tunnels and update isOnline status', async () => {
      const store = useTunnelStore();
      
      store.tunnels = [
        { proxyId: 1, isOnline: false } as Tunnel,
        { proxyId: 2, isOnline: false } as Tunnel,
        { proxyId: 3, isOnline: false } as Tunnel,
      ];
      
      vi.mocked(invoke).mockResolvedValueOnce([1, 3]);
      
      await store.loadRunningTunnels();
      
      expect(store.runningTunnels).toEqual(new Set([1, 3]));
      expect(store.tunnels[0].isOnline).toBe(true);
      expect(store.tunnels[1].isOnline).toBe(false);
      expect(store.tunnels[2].isOnline).toBe(true);
    });
  });

  describe('refreshTunnels', () => {
    it('should call both loadTunnels and loadRunningTunnels', async () => {
      const store = useTunnelStore();
      
      vi.mocked(invoke).mockImplementation(async (cmd: string) => {
        if (cmd === 'api_get_proxies') return [];
        if (cmd === 'api_get_nodes') return [];
        if (cmd === 'get_running_tunnels') return [];
        throw new Error(`Unexpected command: ${cmd}`);
      });
      
      await store.refreshTunnels();
      
      expect(invoke).toHaveBeenCalledWith('api_get_proxies');
      expect(invoke).toHaveBeenCalledWith('api_get_nodes');
      expect(invoke).toHaveBeenCalledWith('get_running_tunnels');
    });
  });

  describe('startTunnel', () => {
    it('should start tunnel and update state', async () => {
      const store = useTunnelStore();
      
      store.tunnels = [
        { proxyId: 1, isOnline: false } as Tunnel,
      ];
      
      vi.mocked(invoke).mockResolvedValueOnce(undefined);
      
      await store.startTunnel(1);
      
      expect(store.runningTunnels.has(1)).toBe(true);
      expect(store.tunnels[0].isOnline).toBe(true);
      expect(invoke).toHaveBeenCalledWith('start_tunnel', { proxyId: 1 });
    });

    it('should handle start error', async () => {
      const store = useTunnelStore();
      const errorMessage = 'Start failed';
      
      vi.mocked(invoke).mockRejectedValueOnce(new Error(errorMessage));
      
      await expect(store.startTunnel(1)).rejects.toThrow(errorMessage);
      expect(store.error).toBe(errorMessage);
    });
  });

  describe('stopTunnel', () => {
    it('should stop tunnel and update state', async () => {
      const store = useTunnelStore();
      
      store.tunnels = [
        { proxyId: 1, isOnline: true } as Tunnel,
      ];
      store.runningTunnels = new Set([1]);
      
      vi.mocked(invoke).mockResolvedValueOnce(undefined);
      
      await store.stopTunnel(1);
      
      expect(store.runningTunnels.has(1)).toBe(false);
      expect(store.tunnels[0].isOnline).toBe(false);
      expect(invoke).toHaveBeenCalledWith('stop_tunnel', { proxyId: 1 });
    });

    it('should handle stop error', async () => {
      const store = useTunnelStore();
      const errorMessage = 'Stop failed';
      
      vi.mocked(invoke).mockRejectedValueOnce(new Error(errorMessage));
      
      await expect(store.stopTunnel(1)).rejects.toThrow(errorMessage);
      expect(store.error).toBe(errorMessage);
    });
  });

  describe('clearTunnels', () => {
    it('should clear all tunnel data', () => {
      const store = useTunnelStore();
      
      store.tunnels = [{ proxyId: 1 } as Tunnel];
      store.runningTunnels = new Set([1]);
      store.nodeNameMap = { 1: 'Node 1' };
      store.nodeHostnameMap = { 1: 'node1.example.com' };
      store.error = 'Some error';
      store.actionLoading = { 1: true };
      
      store.clearTunnels();
      
      expect(store.tunnels).toEqual([]);
      expect(store.runningTunnels).toEqual(new Set());
      expect(store.nodeNameMap).toEqual({});
      expect(store.nodeHostnameMap).toEqual({});
      expect(store.error).toBe('');
      expect(store.actionLoading).toEqual({});
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      const store = useTunnelStore();
      
      store.error = 'Some error';
      store.clearError();
      
      expect(store.error).toBe('');
    });
  });
});
