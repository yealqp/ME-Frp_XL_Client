// 统一配置类型定义（优化后）
// 移除了冗余字段：apiStatus, theme, loginTime, userInfo
// 将 userInfo.group 提升到顶层作为 group 字段
export interface UnifiedConfig {
  // 登录相关配置
  userToken: string;
  frpToken: string;
  username: string;
  group: string;

  // 应用设置
  autoStart: boolean;
  alwaysOnTop: boolean;
  autoUpdate: boolean;
  autoStartTunnels: number[];
  startupDelay: number;
  minimizeToTray: boolean;
  showAd: boolean;
}

// 旧的用户信息类型（保留用于向后兼容）
export interface UserInfo {
  group: string | null;
  token: string | null;
  username: string | null;
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
  showAd: boolean;
}
