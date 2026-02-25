/**
 * 节点数据接口
 */
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

/**
 * 节点状态接口
 */
export interface NodeStatus {
  nodeId: number;
  name: string;
  totalTrafficIn: number;
  totalTrafficOut: number;
  onlineClient: number;
  onlineProxy: number;
  isOnline: boolean;
  version: string;
  uptime: number;
  curConns: number;
  loadPercent: number;
}

/**
 * 隧道表单数据接口
 */
export interface TunnelForm {
  name: string;
  type: string;
  localIp: string;
  localPort: number | null;
  remotePort: number | null;
  customDomain: string;
  sourceProtocol: string; // 'http' | 'https'
  proxyProtocolVersion: string;
  useEncryption: boolean;
  useCompression: boolean;
  securityMode: string; // 'none' | 'basic' | 'accessKey'
  accessKey: string;
  crtPath: string;
  keyPath: string;
  httpUser: string;
  httpPassword: string;
  transportProtocol: string;
}

/**
 * 分组节点接口
 */
export interface GroupedNodes {
  mainland: Node[];
  hkMacaoTaiwan: Node[];
  overseas: Node[];
}
