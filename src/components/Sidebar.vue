<template>
  <n-layout-sider
    :class="['sidebar']"
    bordered
    collapse-mode="width"
    :collapsed-width="64"
    :width="sidebarWidth"
    :collapsed="sidebarCollapsed"
    :show-trigger="sidebarCollapsible ? 'arrow-circle' : false"
    :native-scrollbar="false"
    @collapse="handleCollapse"
    @expand="handleExpand"
  >
    <n-config-provider :theme="customTheme">
      <div class="sidebar-header">
        <h2 class="app-title">
          <img src="../assets/icon.png" alt="logo" class="logo" />
          <span v-show="!sidebarCollapsed" class="title-text">ME-Frp</span>
        </h2>
      </div>

      <div class="nav-content">
        <n-menu
          :options="menuOptions"
          :value="activeNav"
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
              <div class="ad-title">仙林云计算</div>
              <div class="ad-subtitle">推荐服务商 价格低廉</div>
            </div>
          </div>
        </a>
      </div>
    </n-config-provider>
  </n-layout-sider>
</template>

<script setup lang="ts">
import { h, onMounted, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { darkTheme, NIcon, NLayoutSider, useDialog } from "naive-ui";
import type { MenuOption } from "naive-ui";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "../stores/settings";
import { useUIStore } from "../stores/ui";
import {
  Home,
  PlusCircle,
  Settings as SettingsIcon,
  User,
  HelpCircle,
  Info,
  LogOut,
} from "lucide-vue-next";

const router = useRouter();
const route = useRoute();
const dialog = useDialog();

// UI Store
const uiStore = useUIStore();
const { sidebarWidth, sidebarCollapsible, sidebarCollapsed } = storeToRefs(uiStore);

// 监听侧栏宽度变化，确保动画生效
watch(sidebarWidth, (newWidth, oldWidth) => {
  console.log(`侧栏宽度从 ${oldWidth}px 变化到 ${newWidth}px`);
});

// 处理收缩
const handleCollapse = () => {
  uiStore.setSidebarCollapsed(true);
  emit('toggle-sidebar', true);
};

// 处理展开
const handleExpand = () => {
  uiStore.setSidebarCollapsed(false);
  emit('toggle-sidebar', false);
};

// 使用 Settings store 中的广告显示状态
const settingsStore = useSettingsStore();
const { settings } = storeToRefs(settingsStore);
const showAd = computed(() => settings.value.showAd);

// 加载广告显示设置
const loadAdSettings = async () => {
  try {
    await settingsStore.loadSettings();
  } catch (error) {
    console.error("加载广告设置失败:", error);
  }
};

// 自定义主题配置
const customTheme = {
  ...darkTheme,
  common: {
    ...darkTheme.common,
    bodyColor: "#101014",
    cardColor: "#18181c",
    modalColor: "#18181c",
    popoverColor: "#18181c",
    tableHeaderColor: "#18181c",
    inputColor: "#303033",
    inputColorDisabled: "#303033",
    primaryColor: "#349ff4",
    primaryColorHover: "#4da8f5",
    primaryColorPressed: "#2891f3",
    borderColor: "#29292c",
    dividerColor: "#29292c",
  },
};

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
    "/user-center": "user-center",
    "/operation-log": "", // 操作日志页面不高亮任何菜单项
    "/settings": "settings",
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
  { id: "user-center", name: "用户中心", icon: User },
  { id: "help-center", name: "帮助中心", icon: HelpCircle },
  { id: "settings", name: "选项设置", icon: SettingsIcon },
  { id: "about", name: "关于面板", icon: Info },
];

// 创建菜单选项 - 使用 NIcon 包裹图标以支持 Naive UI 的收缩功能
const menuOptions: MenuOption[] = [
  ...navItems.map((item) => ({
    label: item.name,
    key: item.id,
    icon: () => h(NIcon, { size: 18 }, { default: () => h(item.icon) }),
  })),
  {
    type: 'divider',
    key: 'divider-before-logout',
  },
  {
    label: () => h('span', { style: { color: '#e74c3c' } }, '退出登录'),
    key: 'logout',
    icon: () => h(NIcon, { size: 18, color: '#e74c3c' }, { default: () => h(LogOut) }),
  },
];

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
    "user-center": "/user-center",
    settings: "/settings",
    "help-center": "/help-center",
    about: "/about",
  };

  const path = navToPath[key];
  if (path) {
    router.push(path);
  }
}

// 隐藏 Menu 的 tooltip（收缩时会自动显示）
onMounted(async () => {
  // 加载广告设置
  loadAdSettings();
  
  // 加载 UI 设置
  await uiStore.loadSidebarSettings();
});
</script>

<style scoped>
.sidebar {
  background-color: #18181c !important;
  color: white;
  display: flex;
  flex-direction: column;
  height: 100vh;
  border-right: 1px solid #29292c !important;
}

/* 侧边栏收缩动画 - 应用到 Naive UI 的内部元素 */
:deep(.n-layout-sider) {
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  will-change: width;
}

:deep(.n-layout-sider--collapsed) {
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

:deep(.n-layout-sider__border) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

:deep(.n-layout-sider-scroll-container) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #29292c;
  background-color: #18181c;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 68px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

/* 收缩状态下调整 header padding */
:deep(.n-layout-sider--collapsed) .sidebar-header {
  padding: 20px 8px;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #349ff4;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 收缩状态下 logo 保持居中 */
:deep(.n-layout-sider--collapsed) .logo {
  margin: 0 auto;
}

.nav-content {
  flex: 1;
  padding: 10px 0;
  background-color: #18181c;
  overflow-y: auto;
  overflow-x: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-footer {
  margin-top: auto;
  padding: 20px;
  border-top: 1px solid #29292c;
  background-color: #18181c;
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

/* 收缩状态下调整 footer padding */
:deep(.n-layout-sider--collapsed) .sidebar-footer {
  padding: 20px 8px;
}

/* 广告横幅样式 */
.ad-banner {
  display: block;
  padding: 16px;
  background: #1e3a8a;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
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
  box-shadow: 0 6px 16px rgba(30, 58, 138, 0.4);
  background: #1e40af;
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
  color: #ffffff;
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
}

:deep(.n-menu .n-menu-item) {
  margin: 4px 12px;
  border-radius: 6px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  min-height: 42px;
  display: flex;
  align-items: center;
}

/* 收缩状态下的菜单项 - 减少边距让背景更宽 */
:deep(.n-menu--collapsed .n-menu-item) {
  margin: 4px 8px;
  min-height: 42px;
}

/* 选中状态 - 持久蓝色背景 */
:deep(.n-menu .n-menu-item--selected) {
  background-color: #349ff4 !important;
  color: white !important;
}

:deep(.n-menu .n-menu-item--selected .n-menu-item-content-header) {
  color: white !important;
}

:deep(.n-menu .n-menu-item--selected .n-icon) {
  color: white !important;
}

/* hover 状态 - 浅蓝色背景 */
:deep(.n-menu .n-menu-item:hover:not(.n-menu-item--selected)) {
  background-color: rgba(52, 159, 244, 0.1) !important;
}

:deep(.n-menu .n-menu-item-content) {
  padding: 12px 16px !important;
  display: flex !important;
  align-items: center !important;
  background: transparent !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  min-height: 42px;
}

/* 收缩状态下的菜单项内容居中 - 保持相同的垂直 padding */
:deep(.n-menu--collapsed .n-menu-item-content) {
  padding: 12px !important;
  justify-content: center !important;
  min-height: 42px;
}

:deep(.n-menu .n-menu-item-content__icon) {
  font-size: 18px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0 !important;
  margin-right: 12px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  width: 18px;
  height: 18px;
}

/* 收缩状态下图标居中 - 移除右边距并确保居中 */
:deep(.n-menu--collapsed .n-menu-item-content__icon) {
  margin-right: 0 !important;
  width: 18px;
  height: 18px;
}

:deep(.n-menu .n-menu-item-content-header) {
  font-size: 14px !important;
  font-weight: 500 !important;
  display: flex !important;
  align-items: center !important;
  opacity: 1;
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 收缩状态下隐藏文字 */
:deep(.n-menu--collapsed .n-menu-item-content-header) {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

/* 分割线样式 */
:deep(.n-menu .n-menu-divider) {
  margin: 8px 12px !important;
  background-color: #29292c !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 收缩状态下的分割线 */
:deep(.n-menu--collapsed .n-menu-divider) {
  margin: 8px 8px !important;
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
