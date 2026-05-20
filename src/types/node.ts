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
  /** 节点纬度（地图模式使用） */
  latitude?: number | null;
  /** 节点经度（地图模式使用） */
  longitude?: number | null;
  /** 负载百分比 */
  loadPercent?: number;
}

export interface NodeStatusData {
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

export type NodeStatus = NodeStatusData;

export interface GroupedNodes {
  mainland: Node[];
  hkMacaoTaiwan: Node[];
  overseas: Node[];
}
