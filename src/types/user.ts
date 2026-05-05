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

export interface CdkHistoryLog {
  logId: number;
  code: string;
  username: string;
  type: string;
  value: number;
  useTime: number;
  clientIp: string;
  userAgent: string;
}

export interface TrafficStatsData {
  dates: string[];
  trafficIn: number[];
  trafficOut: number[];
  totalTraffic: number[];
}


