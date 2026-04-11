<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch, watchEffect } from "vue";
import { useRouter, useRoute } from "vue-router";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { BaseDirectory, readFile } from "@tauri-apps/plugin-fs";
import { 
  NDialogProvider, 
  NSpin, 
  NConfigProvider,
  NLoadingBarProvider,
  NMessageProvider,
  NNotificationProvider,
  NLayout,
  NLayoutContent,
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
import { extractProxyList, invokeTauriResponse } from "@/utils/tauriResponse";
import { loadUnifiedConfig, saveUnifiedConfig } from "@/utils/unifiedConfig";
import type { UpdateCheckResult } from "@/types/update";
import type { UnifiedConfig } from "@/types/config";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";

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
const backgroundImageUrl = ref<string | null>(null);
const backgroundImageLoadToken = ref(0);
const shellReady = ref(false);
const hasStoredSession = ref(false);

function clampOpacity(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 1;
  }

  return Math.min(1, Math.max(0, value / 100));
}

function withOpacity(color: string, opacity: number): string {
  const normalized = color.trim().replace("#", "");

  if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  if (/^[0-9a-fA-F]{8}$/.test(normalized)) {
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    const a = parseInt(normalized.slice(6, 8), 16) / 255;
    return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, opacity * a))})`;
  }

  return color;
}

function revokeBackgroundImageUrl(): void {
  if (backgroundImageUrl.value?.startsWith("blob:")) {
    URL.revokeObjectURL(backgroundImageUrl.value);
  }

  backgroundImageUrl.value = null;
}

function backgroundImageMime(filePath: string): string {
  const extension = filePath.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "jpg":
    case "jpeg":
    case "jfif":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    case "svg":
      return "image/svg+xml";
    case "ico":
      return "image/x-icon";
    default:
      return "application/octet-stream";
  }
}

async function syncBackgroundImage(path?: string): Promise<void> {
  const loadToken = ++backgroundImageLoadToken.value;
  revokeBackgroundImageUrl();

  if (!path) {
    return;
  }

  try {
    const isManagedPath = !/^[a-zA-Z]:[\\/]/.test(path) && !path.startsWith("/") && !path.startsWith("\\");
    if (!isManagedPath) {
      return;
    }

    const bytes = await readFile(path, {
      baseDir: BaseDirectory.Resource,
    });
    const blob = new Blob([bytes], {
      type: backgroundImageMime(path),
    });

    const objectUrl = URL.createObjectURL(blob);
    if (loadToken !== backgroundImageLoadToken.value) {
      URL.revokeObjectURL(objectUrl);
      return;
    }

    backgroundImageUrl.value = objectUrl;
  } catch (error) {
    console.error("加载背景图片失败:", error);
  }
}

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
    "--app-content-modal-color": withOpacity(activeTheme.modalColor, contentOpacity),
    "--app-content-popover-color": withOpacity(activeTheme.popoverColor, contentOpacity),
    "--app-content-input-color": withOpacity(activeTheme.inputColor, contentOpacity),
    "--app-content-input-disabled-color": withOpacity(activeTheme.inputColorDisabled, contentOpacity),
    "--app-content-table-header-color": withOpacity(activeTheme.tableHeaderColor, contentOpacity),
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

// 鑺傜偣閫夋嫨瀹屾垚锛岃繘鍏ラ毀閬撻厤缃〉闈?
function handleNodeSelected(node: any) {
  createTunnelStore.selectNode(node);
  router.push("/tunnel-config");
}

// 杩斿洖鑺傜偣閫夋嫨椤甸潰
function handleGoBackToNodeSelection() {
  createTunnelStore.goBackToNodeSelection();
  router.push("/create-tunnel");
}

// 璺宠浆鍒板垱寤洪毀閬撻〉闈?
function handleGoToCreateTunnel() {
  createTunnelStore.resetCreateFlow();
  router.push("/create-tunnel");
}

// 鏍规嵁缁勪欢绫诲瀷杩斿洖鐩稿簲鐨?props
function getComponentProps(component: any) {
  if (!component) return {};

  const componentName = component.__name || component.name;

  // 鍙负闇€瑕佽繖浜?props 鐨勭粍浠朵紶閫?
  if (componentName === "CreateTunnel" || componentName === "TunnelConfig") {
    return {
      selectedNode: selectedNode.value,
      currentPage: currentPage.value,
    };
  }

  return {};
}

// 鏍规嵁缁勪欢绫诲瀷杩斿洖鐩稿簲鐨勪簨浠剁洃鍚櫒
function getComponentListeners(component: any) {
  if (!component) return {};

  const componentName = component.__name || component.name;

  // 鍙负闇€瑕佽繖浜涗簨浠剁殑缁勪欢浼犻€?
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

const autoStartTunnels = async () => {
  try {
    const unifiedConfig = await loadUnifiedConfig();

    if (
      !unifiedConfig ||
      !unifiedConfig.autoStartTunnels ||
      unifiedConfig.autoStartTunnels.length === 0
    ) {
      return;
    }

    let validTunnelIds: number[] = [];

    try {
      const result = await invokeTauriResponse<{ proxies?: TunnelSummary[] } | TunnelSummary[]>(
        "api_get_tunnel_list",
      );

      if (result.code === 200) {
        const tunnelData = extractProxyList(result.data);
        const serverTunnelIds = tunnelData.map((tunnel) => tunnel.proxyId);
        const originalCount = unifiedConfig.autoStartTunnels.length;

        validTunnelIds = unifiedConfig.autoStartTunnels.filter((id) => serverTunnelIds.includes(id));

        if (validTunnelIds.length !== originalCount) {
          const removedCount = originalCount - validTunnelIds.length;
          message.warning(`已自动清理 ${removedCount} 个无效的自启动隧道配置`);

          await saveUnifiedConfig({
            ...unifiedConfig,
            autoStartTunnels: validTunnelIds,
          });
        }
      } else {
        console.error("获取隧道列表失败，跳过自启动验证:", result.message);
        validTunnelIds = unifiedConfig.autoStartTunnels;
      }
    } catch (error) {
      console.error("验证自启动隧道时发生错误，跳过验证:", error);
      validTunnelIds = unifiedConfig.autoStartTunnels;
    }

    if (validTunnelIds.length === 0) {
      return;
    }

    const startupDelay = (unifiedConfig.startupDelay || 5) * 1000;

    setTimeout(async () => {
      for (let i = 0; i < validTunnelIds.length; i++) {
        const tunnelId = validTunnelIds[i];

        try {
          const result = await invokeTauriResponse<null>("api_start_tunnel", {
            proxyId: tunnelId,
          });

          if (result.code === 200) {
            message.success(`自启动隧道 ${tunnelId} 成功`);
          } else {
            console.error(`隧道 ${tunnelId} 启动失败:`, result.message);
            message.error(`自启动隧道 ${tunnelId} 失败: ${result.message}`);
          }
        } catch (error) {
          console.error(`启动隧道 ${tunnelId} 时发生错误:`, error);
          message.error(`自启动隧道 ${tunnelId} 失败: ${error}`);
        }

        if (i < validTunnelIds.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }, startupDelay);
  } catch (error) {
    console.error("自启动隧道失败:", error);
  }
};

const autoCheckForUpdates = async () => {
  try {
    const unifiedConfig = await loadUnifiedConfig();

    if (!unifiedConfig || unifiedConfig.autoUpdate === false) {
      return;
    }

    const result = await invoke<UpdateCheckResult>("check_for_updates");

    if (result.has_update) {
      message.info(`发现新版本 ${result.latest_version}，请前往关于页面查看详情`, {
        duration: 5000,
      });
    }
  } catch (error) {
    console.error("自动检查更新失败:", error);
  }
};

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
      autoStartTunnels();
      setTimeout(() => {
        autoCheckForUpdates();
      }, 3000);
    } else {
      setTimeout(waitForLogin, 500);
    }
  };

  waitForLogin();
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

onUnmounted(() => {
  backgroundImageLoadToken.value += 1;
  revokeBackgroundImageUrl();
});
</script>

<template>
  <div class="app-container" :style="appAppearanceStyle">
    <div class="app-background-layer" />
    <n-config-provider
      :theme="themeStore.naiveTheme"
      :theme-overrides="themeStore.naiveThemeOverrides"
    >
      <n-loading-bar-provider ref="loadingBar">
        <n-message-provider ref="messageProvider" :container-style="{ zIndex: 100000 }">
          <n-dialog-provider ref="dialogProvider">
            <n-notification-provider ref="notificationProvider">
            <!-- 鍔犺浇鐘舵€?-->
            <div v-if="!shellReady" class="loading-container"></div>

            <!-- 鐧诲綍/娉ㄥ唽椤甸潰 -->
            <div v-else-if="showLoginScreen" class="login-fullscreen">
              <router-view v-slot="{ Component }">
                <component :is="Component" @login-success="handleLoginSuccess" />
              </router-view>
            </div>

            <!-- 涓诲簲鐢ㄧ晫闈?- 浣跨敤 NLayout -->
            <n-layout v-else-if="showAppShell" has-sider position="absolute" class="main-layout">
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

              <!-- 宸︿晶瀵艰埅鏍?-->
              <Sidebar @logout="handleLogout" />

              <!-- 鍙充晶鍐呭鍖哄煙 -->
              <n-layout class="content-layout">
                <n-layout-content class="content-body">
                  <router-view v-slot="{ Component, route }">
                    <transition :name="(route.meta.transition as string) || 'fade-slide'" mode="out-in">
                      <div v-if="Component" :key="route.path" class="route-container">
                        <Suspense>
                          <template #default>
                            <component
                              :is="Component"
                              v-bind="{
                                ...getComponentProps(Component),
                                ...getComponentListeners(Component),
                              }"
                            />
                          </template>
                          <template #fallback>
                            <div class="route-loading">
                              <n-spin size="medium" />
                            </div>
                          </template>
                        </Suspense>
                      </div>
                      <div v-else :key="'empty-' + route.path" class="route-container">
                        <div class="route-loading">
                          <n-spin size="medium" />
                        </div>
                      </div>
                    </transition>
                  </router-view>
                </n-layout-content>
              </n-layout>
            </n-layout>
            </n-notification-provider>
          </n-dialog-provider>
        </n-message-provider>
      </n-loading-bar-provider>
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
  color: var(--app-text-color, #333333);
  background-color: var(--app-bg-color, #f5f5f5);
}

body {
  color: var(--app-text-color, #333333);
  background-color: var(--app-bg-color, #f5f5f5);
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
  --app-bg-color: var(--app-content-bg-color);
  --app-card-color: var(--app-content-card-color);
}

.content-layout::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--app-content-bg-color, var(--app-bg-color));
  pointer-events: none;
  z-index: 0;
}

.content-body {
  position: relative;
  z-index: 1;
  padding: 30px;
  background: transparent !important;
  min-height: 100%;
  overflow-y: auto;
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

.content-layout .n-card,
.content-layout .n-alert,
.content-layout .n-collapse-item,
.content-layout .n-data-table,
.content-layout .n-tabs-nav--segment-type,
.content-layout .n-input,
.content-layout .n-base-selection,
.content-layout .n-input-number {
  --n-color: var(--app-content-card-color) !important;
}

.content-layout .n-card,
.content-layout .n-alert,
.content-layout .n-collapse-item {
  background-color: var(--app-content-card-color) !important;
}

.content-layout .n-card > .n-card-header,
.content-layout .n-card > .n-card__content,
.content-layout .n-card > .n-card__footer,
.content-layout .n-card > .n-card__action {
  background-color: transparent !important;
}

.content-layout .n-input,
.content-layout .n-input-number,
.content-layout .n-base-selection {
  --n-color: var(--app-content-input-color) !important;
  --n-color-disabled: var(--app-content-input-disabled-color) !important;
}

.content-layout .n-input .n-input-wrapper,
.content-layout .n-input-number .n-input-wrapper,
.content-layout .n-base-selection .n-base-selection-label {
  background-color: var(--app-content-input-color) !important;
}

.content-layout .n-input.n-input--disabled .n-input-wrapper,
.content-layout .n-input-number.n-input-number--disabled .n-input-wrapper,
.content-layout .n-base-selection.n-base-selection--disabled .n-base-selection-label {
  background-color: var(--app-content-input-disabled-color) !important;
}

.content-layout .n-data-table-th {
  background-color: var(--app-content-table-header-color) !important;
}

.content-layout .n-data-table thead,
.content-layout .n-data-table thead tr,
.content-layout .n-data-table thead th,
.content-layout .n-data-table-base-table-header,
.content-layout .n-data-table-base-table-header tr,
.content-layout .n-data-table-base-table-header th,
.content-layout .n-data-table-th__title,
.content-layout .n-data-table-sorter,
.content-layout .n-data-table-filter {
  background-color: var(--app-content-table-header-color) !important;
  color: var(--app-text-color) !important;
}

.content-layout .n-data-table,
.content-layout .n-data-table-wrapper,
.content-layout .n-data-table-base-table,
.content-layout .n-data-table-table,
.content-layout .n-data-table-tr,
.content-layout .n-data-table-td,
.content-layout .n-data-table-empty,
.content-layout .n-data-table-empty__content,
.content-layout .n-empty,
.content-layout .n-pagination {
  background-color: var(--app-content-card-color) !important;
}

.content-layout .n-data-table-td,
.content-layout .n-data-table-empty,
.content-layout .n-empty,
.content-layout .n-pagination,
.content-layout .n-data-table .n-button,
.content-layout .n-data-table .n-tag {
  color: var(--app-text-color) !important;
}

.content-layout .n-data-table .n-base-selection,
.content-layout .n-data-table .n-base-selection-label,
.content-layout .n-data-table .n-input,
.content-layout .n-data-table .n-input-wrapper {
  background-color: var(--app-content-input-color) !important;
}

.content-layout .n-descriptions,
.content-layout .n-descriptions-table,
.content-layout .n-descriptions-table-header,
.content-layout .n-descriptions-table-content,
.content-layout .n-descriptions-table-content__label,
.content-layout .n-descriptions-table-content__content,
.content-layout .n-descriptions-table-header__title,
.content-layout .n-descriptions-table-wrapper {
  background-color: var(--app-content-card-color) !important;
}

.content-layout .n-descriptions-table-content__label,
.content-layout .n-descriptions-table-content__content,
.content-layout .n-descriptions-table-header__title {
  color: var(--app-text-color) !important;
}

.content-layout .n-tabs-content,
.content-layout .n-tab-pane,
.content-layout .n-tabs-pane-wrapper,
.content-layout .n-tabs-wrapper {
  background-color: transparent !important;
}

.content-layout .n-tabs .n-card,
.content-layout .n-tab-pane .n-card,
.content-layout .n-tabs-pane-wrapper .n-card {
  background-color: var(--app-content-card-color) !important;
}

.n-modal,
.n-dialog,
.n-drawer,
.n-drawer-content,
.n-popover,
.n-dropdown-menu,
.n-select-menu {
  --n-color: var(--app-content-modal-color) !important;
  background-color: var(--app-content-modal-color) !important;
}

.n-popover,
.n-dropdown-menu,
.n-select-menu {
  --n-color: var(--app-content-popover-color) !important;
  background-color: var(--app-content-popover-color) !important;
}

.n-tooltip,
.n-popover,
.n-dropdown-menu,
.n-select-menu,
.n-popover-body,
.n-tooltip__content {
  color: var(--app-text-color) !important;
}

.n-modal .n-card,
.n-dialog .n-card,
.n-drawer .n-card {
  --n-color: var(--app-content-modal-color) !important;
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

.fa-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 鑷畾涔夋粴鍔ㄦ潯鏍峰紡 */
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

/* Naive UI 缁勪欢婊氬姩鏉℃牱寮?*/
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

/* 璺敱杩囨浮鍔ㄧ敾 */
/* 娣″叆娣″嚭 + 婊戝姩鏁堟灉 */
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

/* 娣″叆娣″嚭鏁堟灉 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 鍝嶅簲寮忚璁?*/
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
  
  /* 绉诲姩绔娇鐢ㄦ洿蹇殑鍔ㄧ敾 */
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



