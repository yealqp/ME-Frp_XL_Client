<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch, watchEffect } from "vue";
import { useRouter, useRoute } from "vue-router";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { 
  NDialogProvider,
  NConfigProvider,
  NGlobalStyle,
  NLoadingBarProvider,
  NMessageProvider,
  NNotificationProvider,
  NLayout,
  NLayoutContent,
  NLayoutFooter,
  NLayoutHeader,
  type DialogProviderInst,
  type LoadingBarProviderInst,
  type MessageProviderInst,
  type NotificationProviderInst,
} from "naive-ui";
import { storeToRefs } from "pinia";
import { useAuthStore } from "./stores/auth";
import { useCreateTunnelStore } from "./stores/createTunnel";
import { useSettingsStore } from "./stores/settings";
import { useThemeStore } from "./stores/theme";
import { useUIStore } from "./stores/ui";
import { setLoadingBar } from "./composables/useLoadingBar";
import Sidebar from "./components/Sidebar.vue";
import TopNav from "./components/TopNav.vue";
import RouteContent from "./components/common/RouteContent.vue";
import { loadUnifiedConfig } from "@/utils/unifiedConfig";
import type { UnifiedConfig } from "@/types/config";
import { ChevronLeft, ChevronRight } from "@lucide/vue";
import { useBackgroundImage } from "@/composables/useBackgroundImage";
import { useAutoStartTunnels } from "@/composables/useAutoStartTunnels";
import { hljs } from "@/utils/markdownParser";
import GlobalUpdateChecker from "./components/GlobalUpdateChecker.vue";

interface TunnelSummary {
  proxyId: number;
}

const router = useRouter();
const route = useRoute();

// Initialize stores
const authStore = useAuthStore();
const createTunnelStore = useCreateTunnelStore();
const settingsStore = useSettingsStore();
const themeStore = useThemeStore();
const uiStore = useUIStore();

// Provider refs
const loadingBar = useTemplateRef<LoadingBarProviderInst>("loadingBar");
const messageProvider = useTemplateRef<MessageProviderInst>("messageProvider");
const dialogProvider = useTemplateRef<DialogProviderInst>("dialogProvider");
const notificationProvider = useTemplateRef<NotificationProviderInst>("notificationProvider");

// Use storeToRefs for state/getters to maintain reactivity
const { isLoggedIn, isCheckingAuth } = storeToRefs(authStore);
const { currentPage, selectedNode } = storeToRefs(createTunnelStore);
const { settings } = storeToRefs(settingsStore);
const { sidebarCollapsed, sidebarCollapsible, currentSidebarWidth } = storeToRefs(uiStore);
const shellReady = ref(false);
const hasStoredSession = ref(false);

const { backgroundImageUrl, syncBackgroundImage, revokeBackgroundImageUrl, withOpacity, clampOpacity } = useBackgroundImage();
const { startAutoStartTunnels } = useAutoStartTunnels();

const appAppearanceStyle = computed(() => {
  const contentOpacity = clampOpacity(settings.value.contentOpacity);
  const textShadowIntensity = clampOpacity(settings.value.shadowIntensity);
  const backgroundBlur = settings.value.backgroundBlur ?? 0;
  const fontWeight = settings.value.fontWeight ?? 400;
  const activeTheme = themeStore.resolvedActiveThemeConfig.common;

  return {
    "--app-custom-bg-image": backgroundImageUrl.value ? `url("${backgroundImageUrl.value}")` : "none",
    "--app-custom-bg-opacity": String((settings.value.backgroundImageOpacity ?? 100) / 100),
    "--app-custom-bg-blur": `${backgroundBlur}px`,
    "--app-custom-bg-filter": backgroundBlur > 0 ? `blur(${backgroundBlur}px)` : "none",
    "--app-sidebar-opacity": String((settings.value.sidebarOpacity ?? 100) / 100),
    "--app-content-opacity": String(contentOpacity),
    "--app-content-bg-color": withOpacity(activeTheme.bodyColor, contentOpacity),
    "--app-content-card-color": withOpacity(activeTheme.cardColor, contentOpacity),
    "--app-font-weight-base": String(fontWeight),
    "--app-font-weight-medium": String(Math.min(800, fontWeight + 100)),
    "--app-font-weight-strong": String(Math.min(900, fontWeight + 200)),
    "--app-text-shadow-soft": `0 1px 2px rgba(0, 0, 0, ${0.14 * textShadowIntensity})`,
    "--app-text-shadow-strong": `0 2px 6px rgba(0, 0, 0, ${0.22 * textShadowIntensity})`,
  };
});

watchEffect(() => {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(appAppearanceStyle.value)) {
    root.style.setProperty(key, value);
  }
});

const appProviders = computed(() => ({
  loadingBar: loadingBar.value,
  message: messageProvider.value,
  dialog: dialogProvider.value,
  notification: notificationProvider.value,
}));

const sidebarToggleStyle = computed(() => ({
  left: `${currentSidebarWidth.value - 14}px`,
}));

const showAppShell = computed(() => {
  if (!shellReady.value) {
    return false;
  }

  if (isLoggedIn.value) {
    return true;
  }

  return hasStoredSession.value && isCheckingAuth.value;
});

const showLoginScreen = computed(() => shellReady.value && !showAppShell.value);

async function toggleSidebar(): Promise<void> {
  await uiStore.setSidebarCollapsed(!sidebarCollapsed.value);
}

const message = {
  success(content: Parameters<MessageProviderInst["success"]>[0], options?: Parameters<MessageProviderInst["success"]>[1]) {
    return appProviders.value.message?.success(content, options);
  },
  error(content: Parameters<MessageProviderInst["error"]>[0], options?: Parameters<MessageProviderInst["error"]>[1]) {
    return appProviders.value.message?.error(content, options);
  },
  warning(content: Parameters<MessageProviderInst["warning"]>[0], options?: Parameters<MessageProviderInst["warning"]>[1]) {
    return appProviders.value.message?.warning(content, options);
  },
  info(content: Parameters<MessageProviderInst["info"]>[0], options?: Parameters<MessageProviderInst["info"]>[1]) {
    return appProviders.value.message?.info(content, options);
  },
};

// 节点选择完成，进入隧道配置页面
function handleNodeSelected(node: any) {
  createTunnelStore.selectNode(node);
  router.push("/tunnel-config");
}

// 返回节点选择页面
function handleGoBackToNodeSelection() {
  createTunnelStore.goBackToNodeSelection();
  router.push("/create-tunnel");
}

// 跳转到创建隧道页面
function handleGoToCreateTunnel() {
  createTunnelStore.resetCreateFlow();
  router.push("/create-tunnel");
}

// 根据组件类型返回相应的 props
function getComponentProps(component: any) {
  if (!component) return {};

  const componentName = component.__name || component.name;

  // 只为需要这些 props 的组件传递
  if (componentName === "CreateTunnel" || componentName === "TunnelConfig") {
    return {
      selectedNode: selectedNode.value,
      currentPage: currentPage.value,
    };
  }

  return {};
}

// 根据组件类型返回相应的事件监听器
function getComponentListeners(component: any) {
  if (!component) return {};

  const componentName = component.__name || component.name;

  // 只为需要这些事件的组件传递
  if (componentName === "CreateTunnel") {
    return {
      onNodeSelected: handleNodeSelected,
      onGoToCreate: handleGoToCreateTunnel,
    };
  }

  if (componentName === "TunnelConfig") {
    return {
      onGoBack: handleGoBackToNodeSelection,
    };
  }

  if (componentName === "TunnelManagement") {
    return {
      onGoToCreate: handleGoToCreateTunnel,
    };
  }

  return {};
}

// 配置相关函数
const checkAuthStatus = async (retryCount = 0): Promise<void> => {
  try {
    await authStore.checkAuthStatus(retryCount);

    if (authStore.isLoggedIn && route.path === "/login") {
      router.push("/dashboard");
    } else if (!authStore.isLoggedIn && route.path !== "/login") {
      router.push("/login");
    }
  } catch {
    console.error("配置加载失败，已达到最大重试次数");
    router.push("/login");
  }
};

const handleLoginSuccess = (): void => {
  router.replace("/dashboard");
};

const handleLogout = async (): Promise<void> => {
  try {
    await authStore.logout();
    localStorage.removeItem("mefrp_config");
    router.push("/login");
  } catch (error) {
    console.error("登出失败:", error);
    message.error("登出失败，请重试");
  }
};

// Login polling state
let loginPollingTimer: number | null = null;
let loginPollingRetries = 0;
const MAX_LOGIN_POLL_RETRIES = 60;

onMounted(async () => {
  const persistedConfigPromise: Promise<UnifiedConfig | null> = loadUnifiedConfig().catch((error) => {
    console.error("加载本地配置失败:", error);
    return null;
  });

  await Promise.all([
    themeStore.initTheme(),
    settingsStore.loadSettings().catch((error) => {
      console.error("加载外观设置失败:", error);
    }),
    uiStore.loadSidebarSettings(),
    persistedConfigPromise,
  ]);

  const persistedConfig = await persistedConfigPromise;
  hasStoredSession.value = Boolean(persistedConfig?.userToken);
  authStore.applyUnifiedConfig(persistedConfig);
  if (authStore.isLoggedIn && route.path === "/login") {
    router.replace("/dashboard");
  }
  shellReady.value = true;

  await syncBackgroundImage(settings.value.backgroundImagePath);

  await new Promise((resolve) => setTimeout(resolve, 0));
  if (loadingBar.value) {
    setLoadingBar(loadingBar.value);
  }

  await listen("quit-app", async () => {
    try {
      await invoke("quit_app");
    } catch (error) {
      console.error("退出应用失败:", error);
    }
  });

  void authStore.checkAuthStatus(0, persistedConfig).finally(() => {
    hasStoredSession.value = authStore.isLoggedIn;
  });

  const waitForLogin = () => {
    if (authStore.isLoggedIn && !authStore.isCheckingAuth) {
      startAutoStartTunnels(message);
    } else if (loginPollingRetries < MAX_LOGIN_POLL_RETRIES) {
      loginPollingRetries++;
      loginPollingTimer = window.setTimeout(waitForLogin, 500);
    } else {
      console.warn("登录状态检查超时，停止轮询");
    }
  };

  waitForLogin();
});

onUnmounted(() => {
  if (loginPollingTimer !== null) {
    clearTimeout(loginPollingTimer);
    loginPollingTimer = null;
  }
});

// 检测到登录态时从 /login 跳转 dashboard
watch(isLoggedIn, (loggedIn) => {
  if (loggedIn && route.path === "/login") {
    router.push("/dashboard");
  }
});

watch(
  () => settings.value.backgroundImagePath,
  (path) => {
    if (shellReady.value) {
      void syncBackgroundImage(path);
    }
  },
);

watch(
  () => shellReady.value,
  (ready) => {
    if (!ready) {
      revokeBackgroundImageUrl();
    }
  },
);

</script>

<template>
  <div class="app-container" :style="appAppearanceStyle">
    <div class="app-background-layer" />
    <n-config-provider
      :theme="themeStore.naiveTheme"
      :theme-overrides="themeStore.naiveThemeOverrides"
      :hljs="hljs"
    >
      <n-loading-bar-provider ref="loadingBar">
        <n-message-provider ref="messageProvider" :container-style="{ zIndex: 100000 }">
          <n-dialog-provider ref="dialogProvider">
            <n-notification-provider ref="notificationProvider">
            <GlobalUpdateChecker />
            <!-- 加载状态 -->
            <div v-if="!shellReady" class="loading-container"></div>

            <!-- 登录/注册页面 -->
            <div v-else-if="showLoginScreen" class="login-fullscreen">
              <router-view v-slot="{ Component }">
                <component :is="Component" @login-success="handleLoginSuccess" />
              </router-view>
            </div>

            <!-- 主应用界面 - 左侧导航模式 -->
            <template v-else-if="showAppShell && settings.sidebarPosition !== 'top' && settings.sidebarPosition !== 'bottom'">
              <n-layout has-sider position="absolute" class="main-layout">
              <button
                v-if="sidebarCollapsible"
                type="button"
                class="global-sidebar-toggle"
                :style="sidebarToggleStyle"
                :aria-label="sidebarCollapsed ? '展开侧栏' : '收起侧栏'"
                @click="toggleSidebar"
              >
                <component :is="sidebarCollapsed ? ChevronRight : ChevronLeft" :size="16" />
              </button>

              <!-- 左侧导航栏 -->
              <Sidebar @logout="handleLogout" />

              <!-- 右侧内容区域 -->
              <n-layout class="content-layout">
                <n-layout-content class="content-body">
                  <div class="content-inner">
                  <RouteContent
                    :get-component-props="getComponentProps"
                    :get-component-listeners="getComponentListeners"
                  />
                  </div>
                </n-layout-content>
              </n-layout>
            </n-layout>
            </template>

            <!-- 主应用界面 - 顶部导航模式 -->
            <template v-else-if="showAppShell && settings.sidebarPosition === 'top'">
              <n-layout position="absolute" class="main-layout main-layout--top">
                <n-layout-header bordered class="top-layout-header">
                  <TopNav @logout="handleLogout" />
                </n-layout-header>
                <n-layout-content class="content-body content-body--top">
                  <div class="content-inner">
                  <RouteContent
                    :get-component-props="getComponentProps"
                    :get-component-listeners="getComponentListeners"
                  />
                  </div>
                </n-layout-content>
              </n-layout>
            </template>

            <!-- 主应用界面 - 底部导航模式 -->
            <template v-else-if="showAppShell && settings.sidebarPosition === 'bottom'">
              <n-layout position="absolute" class="main-layout main-layout--top">
                <n-layout-content class="content-body content-body--bottom">
                  <div class="content-inner">
                  <RouteContent
                    :get-component-props="getComponentProps"
                    :get-component-listeners="getComponentListeners"
                  />
                  </div>
                </n-layout-content>
                <n-layout-footer bordered class="top-layout-header bottom-layout-footer">
                  <TopNav position="bottom" @logout="handleLogout" />
                </n-layout-footer>
              </n-layout>
            </template>
            </n-notification-provider>
          </n-dialog-provider>
        </n-message-provider>
      </n-loading-bar-provider>
      <n-global-style />
    </n-config-provider>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  overflow: hidden;
}

:root {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

body {
  font-weight: var(--app-font-weight-base, 400);
}

.app-container {
  position: relative;
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  font-weight: var(--app-font-weight-base, 400);
}

.app-background-layer {
  position: absolute;
  inset: 0;
  background-color: var(--app-bg-color);
  background-image: var(--app-custom-bg-image);
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  opacity: var(--app-custom-bg-opacity, 0);
  filter: var(--app-custom-bg-filter, none);
  pointer-events: none;
  z-index: 0;
}

.app-container > .n-config-provider {
  position: relative;
  z-index: 1;
  width: 100%;
}

.main-layout {
  width: 100%;
  height: 100vh;
  background: transparent !important;
}

.global-sidebar-toggle {
  position: fixed;
  top: 84px;
  z-index: 100000;
  width: 28px;
  height: 28px;
  border: 1px solid var(--app-border-color);
  background: var(--app-card-color);
  color: var(--app-text-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  transition:
    left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
  will-change: left;
}

.global-sidebar-toggle:hover {
  color: var(--app-primary-color);
  border-color: var(--app-primary-color);
}

.global-sidebar-toggle:active {
  transform: translateX(1px);
}

.content-layout {
  position: relative;
  background: transparent !important;
  overflow: hidden;
}

.content-layout::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--app-bg-color);
  opacity: var(--app-content-opacity, 1);
  pointer-events: none;
  z-index: 0;
}

.content-body {
  position: relative;
  z-index: 1;
  background: transparent !important;
}

.content-inner {
  padding: 30px;
}

/* 顶部/底部导航布局 */
.main-layout--top {
  flex-direction: column !important;
}

.main-layout--top .n-layout-scroll-container {
  flex-direction: column !important;
  display: flex !important;
}

.top-layout-header {
  position: sticky !important;
  top: 0;
  z-index: 14;
  background: transparent !important;
  --n-header-border-color: var(--app-border-color);
  flex-shrink: 0;
}

.bottom-layout-footer {
  position: sticky !important;
  bottom: 0;
  z-index: 14;
  background: transparent !important;
  --n-footer-border-color: var(--app-border-color);
  flex-shrink: 0;
}

.content-body--top .content-inner {
  padding: 20px 30px 30px;
}

.content-body--bottom .content-inner {
  padding: 30px 30px 20px;
}

/* 卡片保留 Naive 默认 card-color，与顶部/底部导航布局保持一致 */
.content-layout .n-card {
  background-color: var(--app-card-color) !important;
}

.content-layout .n-card > .n-card-header,
.content-layout .n-card > .n-card__content,
.content-layout .n-card > .n-card__footer,
.content-layout .n-card > .n-card__action {
  background-color: transparent !important;
}

.route-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: transparent;
}

.main-layout .n-layout-scroll-container,
.content-layout .n-layout-scroll-container,
.content-body .n-layout-scroll-container,
.main-layout .n-layout,
.content-layout .n-layout,
.content-layout .n-layout-content {
  background: transparent !important;
}

.route-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  width: 100%;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--app-bg-color) 92%, var(--app-card-color)) 0%,
    color-mix(in srgb, var(--app-card-color) 86%, var(--app-bg-color)) 100%
  );
}

.loading-spinner {
  text-align: center;
  color: var(--app-text-color);
}

.loading-spinner i {
  font-size: 48px;
  margin-bottom: 20px;
  display: block;
}

.loading-spinner p {
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
}

.login-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 自定义滚动条样式 */
* {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--app-text-color-3) 58%, transparent) var(--app-card-color);
}

*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

*::-webkit-scrollbar-track {
  background: var(--app-card-color);
  border-radius: 0;
}

*::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--app-text-color-3) 58%, transparent);
  border-radius: 0;
  border: none;
}

*::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--app-text-color-2) 68%, transparent);
}

*::-webkit-scrollbar-thumb:active {
  background: color-mix(in srgb, var(--app-text-color-1) 76%, transparent);
}

*::-webkit-scrollbar-corner {
  background: var(--app-card-color);
}

/* Naive UI 组件滚动条样式 */
.n-scrollbar-rail {
  background: var(--app-card-color) !important;
}

.n-scrollbar-rail__scrollbar {
  background: color-mix(in srgb, var(--app-text-color-3) 58%, transparent) !important;
  border-radius: 0 !important;
}

.n-scrollbar-rail__scrollbar:hover {
  background: color-mix(in srgb, var(--app-text-color-2) 68%, transparent) !important;
}

.n-modal-body-wrapper::-webkit-scrollbar,
.n-drawer-body-content-wrapper::-webkit-scrollbar,
.n-data-table-base-table-body::-webkit-scrollbar,
.n-select-menu::-webkit-scrollbar,
.n-dropdown-menu::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.n-modal-body-wrapper::-webkit-scrollbar-track,
.n-drawer-body-content-wrapper::-webkit-scrollbar-track,
.n-data-table-base-table-body::-webkit-scrollbar-track,
.n-select-menu::-webkit-scrollbar-track,
.n-dropdown-menu::-webkit-scrollbar-track {
  background: var(--app-card-color);
  border-radius: 0;
}

.n-modal-body-wrapper::-webkit-scrollbar-thumb,
.n-drawer-body-content-wrapper::-webkit-scrollbar-thumb,
.n-data-table-base-table-body::-webkit-scrollbar-thumb,
.n-select-menu::-webkit-scrollbar-thumb,
.n-dropdown-menu::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--app-text-color-3) 58%, transparent);
  border-radius: 0;
}

.n-modal-body-wrapper::-webkit-scrollbar-thumb:hover,
.n-drawer-body-content-wrapper::-webkit-scrollbar-thumb:hover,
.n-data-table-base-table-body::-webkit-scrollbar-thumb:hover,
.n-select-menu::-webkit-scrollbar-thumb:hover,
.n-dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--app-text-color-2) 68%, transparent);
}

/* 路由过渡动画 */
/* 淡入淡出 + 滑动效果 */
.fade-slide-enter-active {
  transition: all 0.3s ease-out;
}

.fade-slide-leave-active {
  transition: all 0.25s ease-in;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 淡入淡出效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-body {
    padding: 20px;
  }

  .loading-spinner i {
    font-size: 36px;
  }

  .loading-spinner p {
    font-size: 14px;
  }
  
  /* 移动端使用更快的动画 */
  .fade-slide-enter-active,
  .fade-slide-leave-active {
    transition: all 0.2s ease;
  }
}
.app-container h1,
.app-container h2,
.app-container h3,
.app-container h4,
.app-container h5,
.app-container h6,
.app-container .section-header,
.app-container .page-title {
  font-weight: var(--app-font-weight-strong, 600);
  text-shadow: var(--app-text-shadow-strong, none);
}

.app-container strong,
.app-container .n-card-header {
  font-weight: var(--app-font-weight-medium, 500);
  text-shadow: var(--app-text-shadow-soft, none);
}
</style>



