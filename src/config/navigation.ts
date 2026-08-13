import {
  Home,
  PlusCircle,
  Settings as SettingsIcon,
  User,
  Gift,
  HelpCircle,
  Info,
  LogOut,
  Activity,
  Globe,
} from "@lucide/vue";

export const navItems = [
  { id: "dashboard", name: "面板首页", icon: Home },
  { id: "create-tunnel", name: "创建隧道", icon: PlusCircle },
  { id: "tunnel-management", name: "隧道管理", icon: SettingsIcon },
  { id: "mefrp-webui", name: "WebUI", icon: Globe },
  { id: "node-status", name: "节点监控", icon: Activity },
  { id: "user-center", name: "用户中心", icon: User },
  { id: "luckydraw", name: "每日抽奖", icon: Gift },
  { id: "help-center", name: "帮助中心", icon: HelpCircle },
  { id: "settings", name: "选项设置", icon: SettingsIcon },
  { id: "about", name: "关于应用", icon: Info },
] as const;

export const navToPath: Record<string, string> = {
  dashboard: "/dashboard",
  "create-tunnel": "/create-tunnel",
  "tunnel-management": "/tunnel-management",
  "node-status": "/node-status",
  "mefrp-webui": "/mefrp-webui",
  "user-center": "/user-center",
  luckydraw: "/luckydraw",
  settings: "/settings",
  "help-center": "/help-center",
  about: "/about",
};

export const pathToNav: Record<string, string> = {
  "/dashboard": "dashboard",
  "/create-tunnel": "create-tunnel",
  "/tunnel-management": "tunnel-management",
  "/node-status": "node-status",
  "/mefrp-webui": "mefrp-webui",
  "/user-center": "user-center",
  "/luckydraw": "luckydraw",
  "/operation-log": "",
  "/settings": "settings",
  "/theme-editor": "settings",
  "/help-center": "help-center",
  "/about": "about",
};
