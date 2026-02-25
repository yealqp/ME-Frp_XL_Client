import type { VNode } from 'vue'

/**
 * 隧道数据对象接口
 * 包含隧道的所有配置和状态信息
 */
export interface Tunnel {
  proxyId: number
  username: string
  proxyName: string
  proxyType: string
  isBanned: boolean
  isDisabled: boolean
  localIp: string
  localPort: number
  remotePort: number
  nodeId: number
  runId: string
  isOnline: boolean
  domain: string
  lastStartTime: number
  lastCloseTime: number
  clientVersion: string
  proxyProtocolVersion: string
  useEncryption: boolean
  useCompression: boolean
  location: string
  accessKey: string
  hostHeaderRewrite: string
  headerXFromWhere: string
  httpUser?: string
  httpPassword?: string
  crtPath?: string
  keyPath?: string
  transportProtocol?: string
}

/**
 * 编辑表单数据接口
 * 用于隧道配置编辑
 */
export interface EditFormData {
  proxyName: string
  localIp: string
  localPort: number
  remotePort: number
  domain: string
  sourceProtocol: string
  securityMode: string
  accessKey: string
  httpUser: string
  httpPassword: string
  crtPath: string
  keyPath: string
  useEncryption: boolean
  useCompression: boolean
  proxyProtocolVersion: string
  transportProtocol: string
  proxyType: string
  nodeId: number
}

/**
 * 更多菜单选项接口
 * 定义下拉菜单中的选项结构
 */
export interface MoreMenuOption {
  label: string
  key: string
  icon?: () => VNode
  type?: 'divider'
}

/**
 * 配置文件格式类型
 */
export type ConfigFormat = 'toml' | 'json' | 'yml' | 'ini'

/**
 * 配置内容对象接口
 * 包含不同格式的配置文件内容
 */
export interface ConfigContents {
  toml?: string
  json?: string
  yml?: string
  ini?: string
}
