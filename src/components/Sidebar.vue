<template>
  <n-layout-sider
    :class="['sidebar']"
    bordered
    collapse-mode="width"
    :collapsed-width="64"
    :width="sidebarWidth"
    :collapsed="sidebarCollapsed"
    :show-trigger="false"
    :native-scrollbar="false"
    @collapse="handleCollapse"
    @expand="handleExpand"
  >
      <div class="sidebar-header" @click="handleLogoClick">
        <h2 class="app-title">
          <img 
            src="../assets/icon.png" 
            alt="logo" 
            class="logo"
          />
          <span v-show="!sidebarCollapsed" class="title-text">ME-Frp</span>
        </h2>
      </div>

      <div class="nav-content">
        <n-menu
          :options="menuOptions"
          :value="activeNav"
          inverted
          @update:value="handleMenuSelect"
          :collapsed="sidebarCollapsed"
          :collapsed-width="64"
          :collapsed-icon-size="20"
          :indent="24"
        />
      </div>

      <div class="sidebar-footer">
        <!-- 仙林云计算广告 -->
        <a
          v-if="showAd && !sidebarCollapsed"
          href="https://www.idcxl.cn"
          target="_blank"
          rel="noopener noreferrer"
          class="ad-banner"
        >
          <div class="ad-content">
            <div class="ad-icon">
              <img
                src="../assets/xly.ico"
                alt="仙林云计算"
                class="ad-logo"
              />
            </div>
            <div class="ad-text">
              <div class="ad-title">仙林云</div>
              <div class="ad-subtitle">推荐服务商 价格低廉</div>
            </div>
          </div>
      </a>
    </div>
  </n-layout-sider>
</template>

<script setup lang="ts">
import { h, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { invoke } from "@tauri-apps/api/core";
import { NIcon, NLayoutSider, useDialog } from "naive-ui";
import type { MenuOption } from "naive-ui";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "../stores/settings";
import { useUIStore } from "../stores/ui";
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
} from "lucide-vue-next";

const router = useRouter();
const route = useRoute();
const dialog = useDialog();

// UI Store
const uiStore = useUIStore();
const { sidebarWidth, sidebarCollapsible, sidebarCollapsed } = storeToRefs(uiStore);

// 处理收缩
const handleCollapse = async () => {
  await uiStore.setSidebarCollapsed(true);
  emit('toggle-sidebar', true);
};

// 处理展开
const handleExpand = async () => {
  await uiStore.setSidebarCollapsed(false);
  emit('toggle-sidebar', false);
};

// 使用 Settings store 中的广告显示状态
const settingsStore = useSettingsStore();
const { settings } = storeToRefs(settingsStore);
const showAd = computed(() => settings.value.showAd);

const emit = defineEmits<{
  logout: [];
  'toggle-sidebar': [collapsed: boolean];
}>();

// 从路由计算当前激活的导航项
const activeNav = computed(() => {
  const pathToNav: Record<string, string> = {
    "/dashboard": "dashboard",
    "/create-tunnel": "create-tunnel",
    "/tunnel-config": "create-tunnel",
    "/tunnel-management": "tunnel-management",
    "/node-status": "node-status",
    "/mefrp-webui": "mefrp-webui",
    "/user-center": "user-center",
    "/luckydraw": "luckydraw",
      "/operation-log": "", // 操作日志页面不高亮任何菜单项
      "/settings": "settings",
      "/theme-editor": "settings",
      "/help-center": "help-center",
    "/about": "about",
  };
  // 如果路径在映射中，返回对应的值；否则返回 null（不高亮任何项）
  return pathToNav.hasOwnProperty(route.path) ? pathToNav[route.path] : null;
});

// 导航项配置
const navItems = [
  { id: "dashboard", name: "面板首页", icon: Home },
  { id: "create-tunnel", name: "创建隧道", icon: PlusCircle },
  { id: "tunnel-management", name: "隧道管理", icon: SettingsIcon },
  { id: "mefrp-webui", name: "WebUI", icon: Globe },
  { id: "node-status", name: "节点监控", icon: Activity },
  { id: "user-center", name: "用户中心", icon: User },
  { id: "luckydraw", name: "每日抽奖", icon: Gift },
  { id: "help-center", name: "帮助中心", icon: HelpCircle },
  { id: "settings", name: "选项设置", icon: SettingsIcon },
  { id: "about", name: "关于面板", icon: Info },
];

// 根据设置过滤导航项
const filteredNavItems = computed(() => {
  return navItems.filter(item => {
    // 如果开启了隐藏 WebUI 入口，则过滤掉 WebUI 项
    if (item.id === 'mefrp-webui' && settings.value.hideWebuiEntry) {
      return false;
    }
    return true;
  });
});

// 创建菜单选项 - 使用 NIcon 包裹图标以支持 Naive UI 的收缩功能
const menuOptions = computed<MenuOption[]>(() => [
  ...filteredNavItems.value.map((item) => ({
    label: item.name,
    key: item.id,
    icon: () => h(NIcon, { size: 18 }, { default: () => h(item.icon) }),
  })),
  {
    type: 'divider',
    key: 'divider-before-logout',
  },
  {
    label: () => h('span', { style: { color: 'var(--app-error-color)' } }, '退出登录'),
    key: 'logout',
    icon: () => h(NIcon, { size: 18, color: 'var(--app-error-color)' }, { default: () => h(LogOut) }),
  },
]);

// 点击 Logo 在浏览器中打开官网首页
async function handleLogoClick() {
  try {
    await invoke('open_url', {
      url: 'https://www.mefrp.com/dashboard/home'
    });
  } catch (error) {
    console.error('打开官网失败:', error);
  }
}

function handleMenuSelect(key: string) {
  if (key === 'logout') {
    // 显示二次确认对话框
    dialog.error({
      title: '退出登录',
      content: '确定要退出登录吗？',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => {
        emit('logout');
      }
    });
    return;
  }

  // 路由映射
  const navToPath: Record<string, string> = {
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

  const path = navToPath[key];
  if (path) {
    router.push(path);
  }
}

</script>

<style scoped>
.sidebar {
  position: relative;
  background: transparent !important;
  color: var(--app-text-color);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: visible;
  z-index: 12;
}

.sidebar::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--app-card-color);
  opacity: var(--app-sidebar-opacity, 1);
  pointer-events: none;
  z-index: 0;
}

/* 侧边栏宽度变化 - 保留收起展开动画 */
:deep(.n-layout-sider) {
  background: transparent !important;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  will-change: width;
  z-index: 12 !important;
}

:deep(.n-layout-sider-scroll-container),
:deep(.n-layout-sider-content) {
  position: relative;
  z-index: 1;
  background: transparent !important;
}

:deep(.n-layout-sider__border) {
  display: none !important;
}

:deep(.n-layout-sider-scroll-container) {
  transition: none;
  overflow: hidden !important;
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.n-layout-sider-scroll-container .n-scrollbar-rail--vertical) {
  display: none !important;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--app-border-color);
  background-color: transparent;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 68px;
  overflow: hidden;
  cursor: pointer;
}

.sidebar-header:hover {
  background-color: transparent;
}

.sidebar-header:active {
  background-color: transparent;
}

/* 收缩状态下调整 header padding */
:deep(.n-layout-sider--collapsed) .sidebar-header {
  padding: 20px 8px;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: var(--app-primary-color);
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  justify-content: center;
  width: 100%;
}

.title-text {
  opacity: 1;
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 1;
  min-width: 0;
}

/* 收缩状态下隐藏文字 */
:deep(.n-layout-sider--collapsed) .title-text {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
  flex-shrink: 0;
}

/* 收缩状态下 logo 保持居中 */
:deep(.n-layout-sider--collapsed) .logo {
  margin: 0 auto;
}

.nav-content {
  flex: 1;
  min-height: 0;
  padding: 10px 0;
  background-color: transparent;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-footer {
  margin-top: auto;
  padding: 20px;
  border-top: 1px solid var(--app-border-color);
  background-color: transparent;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 收缩状态下调整 footer padding */
:deep(.n-layout-sider--collapsed) .sidebar-footer {
  padding: 20px 8px;
}

/* 广告横幅样式 */
/* 广告背景使用反向的颜色：浅色模式用浅蓝，深色模式用深蓝 */
.ad-banner {
  display: block;
  padding: 16px;
  background: var(--ad-banner-bg, var(--app-primary-color));
  border-radius: 8px;
  text-decoration: none;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--ad-banner-bg, var(--app-primary-color)) 30%, transparent);
  opacity: 1;
}

/* 收缩状态下隐藏广告 */
:deep(.n-layout-sider--collapsed) .ad-banner {
  opacity: 0;
  height: 0;
  padding: 0;
  margin: 0;
  overflow: hidden;
}

.ad-banner:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px color-mix(in srgb, var(--ad-banner-bg, var(--app-primary-color)) 40%, transparent);
  background: var(--ad-banner-bg-hover, var(--app-primary-color-hover));
}

.ad-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ad-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  flex-shrink: 0;
}

.ad-logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.ad-text {
  flex: 1;
}

.ad-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #ffffff;
}

.ad-subtitle {
  font-size: 12px;
  opacity: 0.9;
  color: #ffffff;
}

/* 自定义Naive UI Menu样式 */
:deep(.n-menu) {
  background-color: transparent !important;
  padding: 0 !important;
}

/* 菜单项容器 - 使用固定的 margin 和 padding */
:deep(.n-menu .n-menu-item) {
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  margin-left: 12px !important;
  margin-right: 12px !important;
  border-radius: 6px;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
              margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  height: 44px;
  overflow: hidden;
  flex-shrink: 0;
}

/* 收缩状态下的菜单项 - 只改变水平 margin */
:deep(.n-menu--collapsed .n-menu-item) {
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  margin-left: 8px !important;
  margin-right: 8px !important;
  height: 44px;
}

/* 选中状态 - 与 hover 背景一致，文字为主题色 */
:deep(.n-menu .n-menu-item--selected) {
  background-color: color-mix(in srgb, var(--app-primary-color) 10%, transparent) !important;
}

:deep(.n-menu .n-menu-item--selected .n-menu-item-content-header) {
  color: var(--app-primary-color) !important;
}

:deep(.n-menu .n-menu-item--selected .n-icon) {
  color: var(--app-primary-color) !important;
}

/* hover 状态 */
:deep(.n-menu .n-menu-item:hover:not(.n-menu-item--selected)) {
  background-color: color-mix(in srgb, var(--app-primary-color) 6%, transparent) !important;
}

/* 菜单项内容 - 使用相对定位作为参考点 */
:deep(.n-menu .n-menu-item-content) {
  position: relative !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 44px !important;
  padding: 12px 16px !important;
  display: flex !important;
  align-items: center !important;
  background: transparent !important;
  transition: padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
              padding-right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 收缩状态下的菜单项内容 - 保持相同的垂直 padding */
:deep(.n-menu--collapsed .n-menu-item-content) {
  padding: 12px !important;
  justify-content: center !important;
}

/* 图标容器 - 固定尺寸，强制锁定垂直位置 */
:deep(.n-menu .n-menu-item-content__icon) {
  width: 20px !important;
  height: 20px !important;
  font-size: 18px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0 !important;
  margin-right: 12px !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  transition: margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  transform: translateY(0) !important;
  line-height: 20px !important;
}

/* 收缩状态下图标居中 - 强制保持垂直位置 */
:deep(.n-menu--collapsed .n-menu-item-content__icon) {
  margin-right: 0 !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  transform: translateY(0) !important;
}

/* NIcon 组件 - 锁定位置 */
:deep(.n-menu .n-menu-item-content__icon .n-icon) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 18px !important;
  height: 18px !important;
  transform: translateY(0) !important;
  margin: 0 !important;
  padding: 0 !important;
}

:deep(.n-menu--collapsed .n-menu-item-content__icon .n-icon) {
  transform: translateY(0) !important;
}

/* 图标内部的 SVG - 确保不会移动 */
:deep(.n-menu .n-menu-item-content__icon svg) {
  display: block !important;
  width: 18px !important;
  height: 18px !important;
  transform: translateY(0) !important;
  margin: 0 !important;
  padding: 0 !important;
  vertical-align: baseline !important;
}

:deep(.n-menu--collapsed .n-menu-item-content__icon svg) {
  transform: translateY(0) !important;
}

/* 文字标签 */
:deep(.n-menu .n-menu-item-content-header) {
  font-size: 14px !important;
  font-weight: 500 !important;
  line-height: 20px !important;
  flex: 1 !important;
  opacity: 1;
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  overflow: hidden;
}

/* 收缩状态下隐藏文字 */
:deep(.n-menu--collapsed .n-menu-item-content-header) {
  opacity: 0;
  width: 0;
}

/* 分割线样式 - 固定高度和垂直边距,使用 flex 确保不影响布局 */
:deep(.n-menu .n-menu-divider) {
  margin-top: 8px !important;
  margin-bottom: 8px !important;
  margin-left: 12px !important;
  margin-right: 12px !important;
  background-color: var(--app-divider-color) !important;
  height: 1px !important;
  min-height: 1px !important;
  max-height: 1px !important;
  flex-shrink: 0 !important;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 收缩状态下的分割线 - 只改变水平边距 */
:deep(.n-menu--collapsed .n-menu-divider) {
  margin-top: 8px !important;
  margin-bottom: 8px !important;
  margin-left: 8px !important;
  margin-right: 8px !important;
}

/* 移除所有伪元素蒙层 */
:deep(.n-menu-item-content::before),
:deep(.n-menu-item-content::after),
:deep(.n-menu-item::before),
:deep(.n-menu-item::after) {
  display: none !important;
}

/* 移除 Naive UI 的波纹和加载效果 */
:deep(.n-base-wave),
:deep(.n-base-loading),
:deep(.n-base-select-option__check) {
  display: none !important;
}
</style>
