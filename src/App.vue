<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { 
  darkTheme, 
  NDialogProvider, 
  NSpin, 
  NConfigProvider,
  NLoadingBarProvider,
  NMessageProvider,
  NNotificationProvider,
  NLayout,
  NLayoutContent,
  createDiscreteApi, 
  type LoadingBarProviderInst 
} from "naive-ui";
import { storeToRefs } from "pinia";
import { useAuthStore } from "./stores/auth";
import { useCreateTunnelStore } from "./stores/createTunnel";
import { useThemeStore } from "./stores/theme";
import { setLoadingBar } from "./composables/useLoadingBar";
import Sidebar from "./components/Sidebar.vue";
import { extractProxyList, invokeTauriResponse } from "@/utils/tauriResponse";
import { loadUnifiedConfig, saveUnifiedConfig } from "@/utils/unifiedConfig";
import type { UpdateCheckResult } from "@/types/update";

interface TunnelSummary {
  proxyId: number;
}

const router = useRouter();
const route = useRoute();

// Initialize stores
const authStore = useAuthStore();
const createTunnelStore = useCreateTunnelStore();
const themeStore = useThemeStore();

// Loading bar ref
const loadingBar = ref<LoadingBarProviderInst | null>(null);

// Use storeToRefs for state/getters to maintain reactivity
const { isLoggedIn, isCheckingAuth } = storeToRefs(authStore);
const { currentPage, selectedNode } = storeToRefs(createTunnelStore);

// 消息和对话框 - 使用 createDiscreteApi
// Note: Discrete API uses darkTheme for now since it's created at setup time
// The main app uses themeStore.naiveTheme which is reactive
const { message } = createDiscreteApi(["message"], {
  configProviderProps: {
    theme: darkTheme,
  },
  messageProviderProps: {
    containerStyle: {
      zIndex: 100000,
    },
  },
});

// 节点选择完成，进入隧道配置页面
function handleNodeSelected(node: any) {
  console.log("App.vue: 接收到节点选择事件", node);
  console.log("App.vue: 当前页面状态", currentPage.value);
  createTunnelStore.selectNode(node);
  router.push("/tunnel-config");
  console.log("App.vue: 切换到隧道配置页面", currentPage.value);
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
    
    // 只在登录页时跳转到首页，其他情况保持当前路由
    if (authStore.isLoggedIn && route.path === "/login") {
      router.push("/dashboard");
    } else if (!authStore.isLoggedIn && route.path !== "/login") {
      // 未登录且不在登录页，跳转到登录页
      router.push("/login");
    }
  } catch (error) {
    console.error("配置加载失败，已达到最大重试次数");
    router.push("/login");
  }
};

const handleLoginSuccess = (): void => {
  console.log("收到登录成功事件，设置登录状态为true");
  console.log("当前登录状态:", authStore.isLoggedIn);
  
  // 立即跳转到首页，不等待任何延迟
  router.replace("/dashboard");
};

const handleLogout = async (): Promise<void> => {
  try {
    await authStore.logout();
    // 清除本地存储的配置
    localStorage.removeItem("mefrp_config");
    router.push("/login");
  } catch (error) {
    console.error("登出失败:", error);
    message.error("登出失败，请重试");
  }
};

// 自动启动隧道的函数
const autoStartTunnels = async () => {
  try {
    // 从统一配置读取自动启动隧道列表
    const unifiedConfig = await loadUnifiedConfig();

    if (
      !unifiedConfig ||
      !unifiedConfig.autoStartTunnels ||
      unifiedConfig.autoStartTunnels.length === 0
    ) {
      console.log("没有配置自动启动的隧道");
      return;
    }

    // 先获取服务器上的隧道列表，验证配置中的隧道是否仍然存在
      let validTunnelIds: number[] = [];

      try {
      const result = await invokeTauriResponse<{ proxies?: TunnelSummary[] } | TunnelSummary[]>("api_get_tunnel_list");

      if (result.code === 200) {
        const tunnelData = extractProxyList(result.data);
        const serverTunnelIds = tunnelData.map((tunnel) => tunnel.proxyId);
        const originalCount = unifiedConfig.autoStartTunnels.length;

        // 过滤出仍然存在于服务器上的隧道
        validTunnelIds = unifiedConfig.autoStartTunnels.filter((id) =>
          serverTunnelIds.includes(id),
        );

        // 如果有隧道被删除，需要更新配置
        if (validTunnelIds.length !== originalCount) {
          const removedCount = originalCount - validTunnelIds.length;
          console.log(
            `检测到 ${removedCount} 个自启动隧道在服务器上已不存在，将自动清理配置`,
          );
          message.warning(`已自动清理 ${removedCount} 个无效的自启动隧道配置`);

          // 更新配置文件
          const updatedConfig = {
            ...unifiedConfig,
            autoStartTunnels: validTunnelIds,
          };
          await saveUnifiedConfig(updatedConfig);
        }
      } else {
        console.error("获取隧道列表失败，跳过自启动验证:", result.message);
        // 如果获取隧道列表失败，仍然尝试启动配置中的隧道
        validTunnelIds = unifiedConfig.autoStartTunnels;
      }
    } catch (error) {
      console.error("验证自启动隧道时发生错误，跳过验证:", error);
      // 如果验证失败，仍然尝试启动配置中的隧道
      validTunnelIds = unifiedConfig.autoStartTunnels;
    }

    if (validTunnelIds.length === 0) {
      console.log("没有有效的自启动隧道");
      return;
    }

    const startupDelay = (unifiedConfig.startupDelay || 5) * 1000; // 转换为毫秒

    console.log(
      `准备自启动 ${validTunnelIds.length} 个隧道，延迟 ${startupDelay / 1000} 秒`,
    );

    // 延迟启动
    setTimeout(async () => {
      console.log("开始自启动隧道...");

      for (let i = 0; i < validTunnelIds.length; i++) {
        const tunnelId = validTunnelIds[i];

        try {
          console.log(
            `正在启动隧道 ${tunnelId} (${i + 1}/${validTunnelIds.length})`,
          );

          // 调用API启动隧道
          const result = await invokeTauriResponse<null>("api_start_tunnel", {
            proxyId: tunnelId,
          });

          if (result.code === 200) {
            console.log(`隧道 ${tunnelId} 启动成功`);
            message.success(`自启动隧道 ${tunnelId} 成功`);
          } else {
            console.error(`隧道 ${tunnelId} 启动失败:`, result.message);
            message.error(`自启动隧道 ${tunnelId} 失败: ${result.message}`);
          }
        } catch (error) {
          console.error(`启动隧道 ${tunnelId} 时发生错误:`, error);
          message.error(`自启动隧道 ${tunnelId} 失败: ${error}`);
        }

        // 如果不是最后一个隧道，等待1秒再启动下一个
        if (i < validTunnelIds.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      console.log("自启动隧道流程完成");
    }, startupDelay);
  } catch (error) {
    console.error("自启动隧道失败:", error);
  }
};

// 自动检查更新的函数
const autoCheckForUpdates = async () => {
  try {
    // 从统一配置读取自动更新设置
    const unifiedConfig = await loadUnifiedConfig();

    // 如果未开启自动更新，则跳过
    if (!unifiedConfig || unifiedConfig.autoUpdate === false) {
      console.log("自动更新已关闭，跳过检查");
      return;
    }

    console.log("开始自动检查更新...");

    const result = await invoke<UpdateCheckResult>("check_for_updates");

    if (result.has_update) {
      console.log(`发现新版本: ${result.latest_version}`);
      message.info(`发现新版本 ${result.latest_version}，请前往关于页面查看详情`, {
        duration: 5000,
      });
    } else {
      console.log(`当前已是最新版本: ${result.current_version}`);
    }
  } catch (error) {
    console.error("自动检查更新失败:", error);
    // 静默失败，不打扰用户
  }
};

// 组件挂载时检查登录状态
onMounted(async () => {
  console.log(`    __  _________   ______              _  __ __       _________            __ 
   /  |/  / ____/  / ____/________     | |/ // /      / ____/ (_)__  ____  / /_
  / /|_/ / __/    / /_  / ___/ __ \\    |   // /      / /   / / / _ \\/ __ \\/ __/
 / /  / / /___   / __/ / /  / /_/ /   /   |/ /___   / /___/ / /  __/ / / / /_  
/_/  /_/_____/  /_/   /_/  / .___/   /_/|_/_____/   \\____/_/_/\\___/_/ /_/\\__/  
                          /_/                                                  `);

  // Initialize theme system BEFORE first render
  await themeStore.initTheme();

  // Set loading bar instance immediately - this must happen before any navigation
  // Use nextTick to ensure the ref is available
  await new Promise(resolve => setTimeout(resolve, 0));
  if (loadingBar.value) {
    setLoadingBar(loadingBar.value);
  }

  // 监听系统托盘退出事件
  await listen("quit-app", async () => {
    try {
      await invoke("quit_app");
    } catch (error) {
      console.error("退出应用失败:", error);
    }
  });

  checkAuthStatus();

  // 等待登录完成后再启动自启动隧道和检查更新
  const waitForLogin = () => {
    if (authStore.isLoggedIn && !authStore.isCheckingAuth) {
      autoStartTunnels();
      // 延迟3秒后检查更新，避免与自启动隧道冲突
      setTimeout(() => {
        autoCheckForUpdates();
      }, 3000);
    } else {
      // 每500ms检查一次登录状态
      setTimeout(waitForLogin, 500);
    }
  };

  // 开始等待登录
  waitForLogin();
});
</script>

<template>
  <div class="app-container">
    <n-config-provider :theme="themeStore.naiveTheme">
      <n-loading-bar-provider ref="loadingBar">
        <n-message-provider :container-style="{ zIndex: 100000 }">
          <n-dialog-provider>
            <n-notification-provider>
            <!-- 加载状态 -->
            <div v-if="isCheckingAuth" class="loading-container"></div>

            <!-- 登录/注册页面 -->
            <div v-else-if="!isLoggedIn" class="login-fullscreen">
              <router-view v-slot="{ Component }">
                <component :is="Component" @login-success="handleLoginSuccess" />
              </router-view>
            </div>

            <!-- 主应用界面 - 使用 NLayout -->
            <n-layout v-else has-sider position="absolute" class="main-layout">
              <!-- 左侧导航栏 -->
              <Sidebar @logout="handleLogout" />

              <!-- 右侧内容区域 -->
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
}

.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.main-layout {
  width: 100%;
  height: 100vh;
}

.content-layout {
  background-color: var(--app-bg-color);
}

.content-body {
  padding: 30px;
  background-color: var(--app-bg-color);
  min-height: 100%;
  overflow-y: auto;
}

.route-container {
  width: 100%;
  height: 100%;
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
</style>
