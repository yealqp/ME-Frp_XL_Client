<template>
  <div class="sidebar">
    <n-config-provider :theme="customTheme">
      <div class="sidebar-header">
        <h2 class="app-title">
          <img src="../assets/icon.png" alt="logo" class="logo" />
          ME-Frp
        </h2>
      </div>

      <div class="nav-content">
        <n-menu
          :options="menuOptions"
          :value="activeNav"
          @update:value="handleMenuSelect"
          :collapsed="false"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :render-extra="() => null"
        />
      </div>

      <div class="sidebar-footer">
        <div class="logout-item" @click="handleNavClick('logout')">
          <i class="logout-icon fas fa-sign-out-alt"></i>
          <span class="logout-text">退出登录</span>
        </div>

        <!-- 仙林云计算广告 -->
        <a
          v-if="showAd"
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
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { darkTheme } from "naive-ui";
import type { MenuOption } from "naive-ui";
import { invoke } from "@tauri-apps/api/core";
import type { UnifiedConfig } from "../types/config";
import { showAdGlobal } from "../utils/eventBus";

const router = useRouter();
const route = useRoute();

// 使用全局响应式广告显示状态
const showAd = showAdGlobal;

// 加载广告显示设置
const loadAdSettings = async () => {
  try {
    const config = await invoke<UnifiedConfig>("load_unified_config");
    if (config) {
      showAdGlobal.value = config.showAd !== undefined ? config.showAd : true;
    }
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

interface NavItem {
  id: string;
  name: string;
  icon: string;
}

const emit = defineEmits<{
  logout: [];
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
const navItems: NavItem[] = [
  { id: "dashboard", name: "面板首页", icon: "fas fa-home" },
  { id: "create-tunnel", name: "创建隧道", icon: "fas fa-plus-circle" },
  { id: "tunnel-management", name: "隧道管理", icon: "fas fa-cogs" },
  { id: "user-center", name: "用户中心", icon: "fas fa-user" },
  { id: "help-center", name: "帮助中心", icon: "fas fa-question-circle" },
  { id: "settings", name: "选项设置", icon: "fas fa-cog" },
  { id: "about", name: "关于面板", icon: "fas fa-info-circle" },
];

// 创建菜单选项
const menuOptions: MenuOption[] = navItems.map((item) => ({
  label: item.name,
  key: item.id,
  icon: () => h("i", { class: item.icon }),
}));

function handleMenuSelect(key: string) {
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

function handleNavClick(navId: string) {
  if (navId === "logout") {
    emit("logout");
  } else {
    handleMenuSelect(navId);
  }
}

// 隐藏 Menu 的 tooltip
onMounted(() => {
  // 加载广告设置
  loadAdSettings();
  
  // 使用 MutationObserver 监听 DOM 变化，移除 popover
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          // 查找并隐藏 n-popover 元素
          if (
            node.classList &&
            (node.classList.contains("n-popover") ||
              node.classList.contains("n-popover-shared"))
          ) {
            node.style.display = "none";
          }
          // 也检查子元素
          const popovers = node.querySelectorAll(
            ".n-popover, .n-popover-shared",
          );
          popovers.forEach((popover) => {
            if (popover instanceof HTMLElement) {
              popover.style.display = "none";
            }
          });
        }
      });
    });
  });

  // 监听 body 的变化
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
});
</script>

<style scoped>
.sidebar {
  width: 250px;
  background-color: #18181c;
  color: white;
  display: flex;
  flex-direction: column;
  height: 100vh;
  border-right: 1px solid #29292c;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #29292c;
  background-color: #18181c;
}

.app-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: #349ff4;
}

.nav-content {
  flex: 1;
  padding: 10px 0;
  background-color: #18181c;
}

.sidebar-footer {
  margin-top: auto;
  padding: 20px;
  border-top: 1px solid #29292c;
  background-color: #18181c;
}

/* 广告横幅样式 */
.ad-banner {
  display: block;
  margin-top: 16px;
  padding: 16px;
  background: #1e3a8a;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
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

.logo {
  width: 25px;
}

.logout-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 6px;
  color: #e74c3c;
}

.logout-item:hover {
  background-color: rgba(231, 76, 60, 0.1);
}

.logout-icon {
  font-size: 16px;
  margin-right: 12px;
  width: 20px;
  text-align: center;
}

.logout-text {
  font-size: 14px;
  font-weight: 500;
}

/* 自定义Naive UI Menu样式 */
:deep(.n-menu) {
  background-color: transparent !important;
}

:deep(.n-menu .n-menu-item) {
  margin: 4px 12px;
  border-radius: 6px;
}

:deep(.n-menu .n-menu-item--selected) {
  background-color: #349ff4 !important;
  color: white !important;
}

:deep(.n-menu .n-menu-item:hover) {
  background-color: rgba(52, 159, 244, 0.1) !important;
}

:deep(.n-menu .n-menu-item-content) {
  padding: 12px 16px !important;
}

:deep(.n-menu .n-menu-item-content__icon) {
  margin-right: 12px !important;
  font-size: 16px !important;
}

/* 隐藏菜单项的 tooltip，避免显示两个悬浮框 */
:deep(.n-menu .n-menu-item .n-tooltip) {
  display: none !important;
}
</style>
