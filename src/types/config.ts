// 统一配置类型定义
export interface UserInfo {
  group: string | null;
  token: string | null;
  username: string | null;
}

export interface UnifiedConfig {
  // 登录相关配置
  apiStatus: string;
  loginTime: string;
  userToken: string;
  frpToken: string;
  username: string;
  userInfo: UserInfo;

  // 应用设置
  autoStart: boolean;
  alwaysOnTop: boolean;
  autoUpdate: boolean;
  autoStartTunnels: number[];
  startupDelay: number;
  theme: string;
  minimizeToTray: boolean;
}

// 兼容性配置类型（用于旧API）
export interface Config {
  api_status: string;
  login_time: string;
  user_token: string;
  frp_token: string;
  username: string;
  user_info: UserInfo;
}

// 应用设置类型
export interface AppSettings {
  autoStart: boolean;
  alwaysOnTop: boolean;
  autoUpdate: boolean;
  autoStartTunnels: number[];
  startupDelay: number;
  theme: string;
  minimizeToTray: boolean;
}
