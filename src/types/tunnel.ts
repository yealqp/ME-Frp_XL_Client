/**
 * 隧道数据接口
 */
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
  clientVersion: string;
  proxyProtocolVersion: string;
  useEncryption: boolean;
  useCompression: boolean;
  location: string;
  accessKey: string;
  hostHeaderRewrite: string;
  headerXFromWhere: string;
  httpUser?: string;
  httpPassword?: string;
  crtPath?: string;
  keyPath?: string;
  transportProtocol?: string;
}

/**
 * 编辑表单数据接口
 */
export interface EditFormData {
  proxyName: string;
  localIp: string;
  localPort: number;
  remotePort: number;
  domain: string;
  sourceProtocol: string;
  securityMode: string;
  accessKey: string;
  httpUser: string;
  httpPassword: string;
  crtPath: string;
  keyPath: string;
  useEncryption: boolean;
  useCompression: boolean;
  proxyProtocolVersion: string;
  transportProtocol: string;
  proxyType: string;
  nodeId: number;
}

/**
 * 统一 API 响应格式
 */
export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

/**
 * 隧道列表 API 响应数据
 */
export interface TunnelListData {
  nodes: Record<number, { name: string; hostname: string }>;
  proxies: Tunnel[];
}
