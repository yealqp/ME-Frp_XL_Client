import type { ThemeCustomization, ThemeMode } from "@/types/theme";

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
  enableAi?: boolean;
  
  // UI 设置
  sidebarWidth?: number;
  sidebarCollapsible?: boolean;
  sidebarCollapsed?: boolean;
  backgroundImagePath?: string;
  backgroundImageOpacity?: number;
  backgroundBlur?: number;
  sidebarOpacity?: number;
  contentOpacity?: number;
  fontWeight?: number;
  shadowIntensity?: number;
  
  // WebUI 设置
  webuiAddr?: string;
  webuiPort?: number;
  webuiPass?: string;
  hideWebuiEntry?: boolean;
  
  // 主题设置
  themeMode?: ThemeMode;
  themeCustomization?: ThemeCustomization;
}

// 应用设置类型（派生自 UnifiedConfig 以消除字段重复）
type AppSettingKeys =
  | 'autoStart' | 'alwaysOnTop' | 'autoUpdate' | 'autoStartTunnels'
  | 'startupDelay' | 'minimizeToTray' | 'showAd' | 'enableAi'
  | 'sidebarWidth' | 'sidebarCollapsible' | 'sidebarCollapsed'
  | 'backgroundImagePath' | 'backgroundImageOpacity' | 'backgroundBlur'
  | 'sidebarOpacity' | 'contentOpacity' | 'fontWeight' | 'shadowIntensity'
  | 'webuiAddr' | 'webuiPort' | 'webuiPass' | 'hideWebuiEntry';

export interface AppSettings extends Pick<UnifiedConfig, AppSettingKeys> {
  theme: string;
}
