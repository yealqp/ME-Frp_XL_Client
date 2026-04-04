export type { GroupedNodes, Node, NodeStatus } from "@/types/node";

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

