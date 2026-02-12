/**
 * Store Type Definitions
 * 
 * This file contains all type definitions for Pinia stores.
 * These types ensure type safety across the state management layer.
 */

import type { UnifiedConfig, AppSettings } from './config';

// ============================================================================
// Auth Store Types
// ============================================================================

export interface AuthState {
  isLoggedIn: boolean;           // 登录状态
  isCheckingAuth: boolean;       // 正在检查认证状态
  userToken: string;             // 用户 token
  username: string;              // 用户名
  group: string;                 // 用户组
  frpToken: string;              // FRP token
}

// ============================================================================
// User Store Types
// ============================================================================

export interface UserState {
  userInfo: UserDetailInfo | null;  // 用户详细信息
  loading: boolean;                 // 加载状态
  error: string;                    // 错误信息
}

export interface UserDetailInfo {
  email: string;
  friendlyGroup: string;
  group: string;
  inBound: number;
  isRealname: boolean;
  maxProxies: number;
  outBound: number;
  regTime: number;
  status: number;
  todaySigned: boolean;
  traffic: number;
  usedProxies: number;
  userId: number;
  username: string;
}

// ============================================================================
// Tunnel Store Types
// ============================================================================

export interface TunnelState {
  tunnels: Tunnel[];                        // 隧道列表
  runningTunnels: Set<number>;              // 运行中的隧道 ID 集合
  nodeNameMap: Record<number, string>;      // 节点 ID -> 名称映射
  nodeHostnameMap: Record<number, string>;  // 节点 ID -> 主机名映射
  loading: boolean;                         // 加载状态
  error: string;                            // 错误信息
  actionLoading: Record<number, boolean>;   // 单个隧道操作加载状态
}

export interface Tunnel {
  proxyId: number;
  username: string;
  proxyName: string;
  proxyType: string;
  isBanned: boolean;
  isDisabled: boolean;
  localIp: string;
  localPort: number;
  remotePort: number;
  nodeId: number;
  runId: string;
  isOnline: boolean;
  domain: string;
  lastStartTime: number;
  lastCloseTime: number;
  useEncryption: boolean;
  useCompression: boolean;
  sk: string;
  remark: string;
}

// ============================================================================
// Settings Store Types
// ============================================================================

export interface SettingsState {
  settings: AppSettings;  // 应用设置
  loading: boolean;       // 加载状态
  error: string;          // 错误信息
}

// Re-export AppSettings from config
export type { AppSettings } from './config';

// ============================================================================
// CreateTunnel Store Types
// ============================================================================

export interface CreateTunnelState {
  currentPage: 'node-selection' | 'tunnel-config';  // 当前页面
  selectedNode: Node | null;                        // 选中的节点
}

export interface Node {
  nodeId: number;
  name: string;
  hostname: string;
  description: string;
  token: string;
  servicePort: number;
  adminPort: number;
  adminPass: string;
  allowGroup: string;
  allowPort: string;
  allowType: string;
  region: string;
  bandwidth: string;
  isOnline: boolean;
  isDisabled: boolean;
  totalTrafficIn: number;
  totalTrafficOut: number;
  upTime: number;
  version: string;
}

// ============================================================================
// UI Store Types
// ============================================================================

export interface UIState {
  theme: 'light' | 'dark';  // 主题
  customTheme: any;         // 自定义主题配置
  showAd: boolean;          // 是否显示广告
}

// ============================================================================
// Re-export common types
// ============================================================================

export type { UnifiedConfig } from './config';
