<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { darkTheme, NDialogProvider, createDiscreteApi } from "naive-ui";
import Sidebar from "./components/Sidebar.vue";
import Login from "./components/Login.vue";
import type { UnifiedConfig } from "./types/config";

const router = useRouter();
const route = useRoute();

interface Node {
  nodeId: number;
  name: string;
  hostname: string;
  description: string;
  token: string;
  servicePort: number;
  adminPort: number;
  adminPass: string;
  allowGroup: string;
  allowPort: string;
  allowType: string;
  region: string;
  bandwidth: string;
  isOnline: boolean;
  isDisabled: boolean;
  totalTrafficIn: number;
  totalTrafficOut: number;
  upTime: number;
  version: string;
}

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

// 登录状态管理
const isLoggedIn = ref(false);
const isCheckingAuth = ref(true);

// 消息和对话框 - 使用 createDiscreteApi
const { message } = createDiscreteApi(["message"], {
  configProviderProps: {
    theme: customTheme,
  },
});

// 页面状态管理
const currentPage = ref("node-selection"); // 'node-selection' | 'tunnel-config'
const selectedNode = ref<Node | null>(null);

// 节点选择完成，进入隧道配置页面
function handleNodeSelected(node: Node) {
  console.log("App.vue: 接收到节点选择事件", node);
  console.log("App.vue: 当前页面状态", currentPage.value);
  selectedNode.value = node;
  currentPage.value = "tunnel-config";
  router.push("/tunnel-config");
  console.log("App.vue: 切换到隧道配置页面", currentPage.value);
}

// 返回节点选择页面
function handleGoBackToNodeSelection() {
  currentPage.value = "node-selection";
  selectedNode.value = null;
  router.push("/create-tunnel");
}

// 跳转到创建隧道页面
function handleGoToCreateTunnel() {
  currentPage.value = "node-selection";
  selectedNode.value = null;
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
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 500; // 500ms

  try {
    // 从统一配置读取
    const config = await invoke<UnifiedConfig>("load_unified_config");
    console.log("从统一配置读取:", config);

    if (config) {
      // 检查是否有API连接状态或有效的user_token
      if (config.apiStatus === "connected" || config.userToken) {
        isLoggedIn.value = true;
        // 如果当前在登录页，跳转到首页
        if (route.path === "/login" || route.path === "/") {
          router.push("/dashboard");
        }
      } else {
        // 未登录，跳转到登录页
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
    
    // 成功加载配置，结束检查状态
    isCheckingAuth.value = false;
  } catch (error) {
    console.error(`检查登录状态失败 (尝试 ${retryCount + 1}/${MAX_RETRIES + 1}):`, error);
    
    // 如果还有重试次数，延迟后重试
    if (retryCount < MAX_RETRIES) {
      console.log(`将在 ${RETRY_DELAY}ms 后重试...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return checkAuthStatus(retryCount + 1);
    }
    
    // 重试次数用尽，跳转到登录页
    console.error("配置加载失败，已达到最大重试次数");
    router.push("/login");
    isCheckingAuth.value = false;
  }
};

const handleLoginSuccess = (): void => {
  console.log("收到登录成功事件，设置登录状态为true");
  isLoggedIn.value = true;
  console.log("当前登录状态:", isLoggedIn.value);
  router.push("/dashboard");
};

const handleLogout = async (): Promise<void> => {
  isLoggedIn.value = false;
  // 清除本地存储的配置
  localStorage.removeItem("mefrp_config");

  // 清除统一配置中的登录相关信息，但保留应用设置
  try {
    const config = await invoke<UnifiedConfig>("load_unified_config");
    const clearedConfig: UnifiedConfig = {
      ...config,
      apiStatus: "",
      loginTime: "",
      userToken: "",
      frpToken: "",
      username: "",
      userInfo: {
        group: null,
        token: null,
        username: null,
      },
    };
    await invoke("save_unified_config", { config: clearedConfig });
    console.log("已清除登录信息，保留应用设置");
  } catch (error) {
    console.error("清除登录信息失败:", error);
  }

  router.push("/login");
};

// 自动启动隧道的函数
const autoStartTunnels = async () => {
  try {
    // 从统一配置读取自动启动隧道列表
    const unifiedConfig = await invoke<UnifiedConfig>("load_unified_config");

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
      const responseText = await invoke("api_get_tunnel_list");
      const result = JSON.parse(responseText as string);

      if (result.code === 200 && Array.isArray(result.data)) {
        const serverTunnelIds = result.data.map(
          (tunnel: any) => tunnel.proxyId,
        );
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
          await invoke("save_unified_config", { config: updatedConfig });
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
          const responseText = await invoke("api_start_tunnel", {
            proxyId: tunnelId,
          });
          const result = JSON.parse(responseText as string);

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

// 组件挂载时检查登录状态
onMounted(async () => {
  console.log(`     __  _________   ______                  ___          __  __           __          
    /  |/  / ____/  / ____/________         ( _ )         \\ \\/ /__  ____ _/ /___ _____ 
   / /|_/ / __/    / /_  / ___/ __ \\       / __ \\/|        \\  / _ \/ __ \`\/ / __\` / __ \\ 
  / /  / / /___   / __/ / /  / /_/ /      / /_/  <         / /  __/ /_/ / / /_/ / /_/ / 
 /_/  /_/_____/  /_/   /_/  / .___/       \\____/\\/        /_/\\___/\\__,_/_/\\__, / .___/ 
                           /_/                                              /_/_/      `);

  // 监听系统托盘退出事件
  await listen("quit-app", async () => {
    try {
      await invoke("quit_app");
    } catch (error) {
      console.error("退出应用失败:", error);
    }
  });

  checkAuthStatus();

  // 等待登录完成后再启动自启动隧道
  const waitForLogin = () => {
    if (isLoggedIn.value && !isCheckingAuth.value) {
      autoStartTunnels();
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
    <n-config-provider :theme="customTheme">
      <n-message-provider>
        <n-dialog-provider>
          <!-- 加载状态 -->
          <div v-if="isCheckingAuth" class="loading-container"></div>

          <!-- 登录页面 -->
          <div v-else-if="!isLoggedIn" class="login-fullscreen">
            <Login @login-success="handleLoginSuccess" />
          </div>

          <!-- 主应用界面 -->
          <template v-else>
            <!-- 左侧导航栏组件 -->
            <Sidebar @logout="handleLogout" />

            <!-- 右侧内容区域 -->
            <main class="main-content">
              <div class="content-body">
                <router-view v-slot="{ Component }">
                  <component
                    :is="Component"
                    v-bind="{
                      ...getComponentProps(Component),
                      ...getComponentListeners(Component),
                    }"
                  />
                </router-view>
              </div>
            </main>
          </template>
        </n-dialog-provider>
      </n-message-provider>
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
  color: #333;
  background-color: #f5f5f5;
}

.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #1c1c1c 0%, #1c1c1c 100%);
}

.loading-spinner {
  text-align: center;
  color: white;
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

.main-content {
  width: calc(100vw - 250px);
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #101014;
  margin-left: 250px;
  overflow-y: auto;
}

.content-body {
  flex: 1;
  padding: 30px;
  background-color: #101014;
  min-height: calc(100vh - 60px);
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
  scrollbar-color: #3e3e42 #18181c;
}

*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

*::-webkit-scrollbar-track {
  background: #18181c;
  border-radius: 0;
}

*::-webkit-scrollbar-thumb {
  background: #3e3e42;
  border-radius: 0;
  border: none;
}

*::-webkit-scrollbar-thumb:hover {
  background: #4e4e52;
}

*::-webkit-scrollbar-thumb:active {
  background: #5e5e62;
}

*::-webkit-scrollbar-corner {
  background: #18181c;
}

/* Naive UI 组件滚动条样式 */
.n-scrollbar-rail {
  background: #18181c !important;
}

.n-scrollbar-rail__scrollbar {
  background: #3e3e42 !important;
  border-radius: 0 !important;
}

.n-scrollbar-rail__scrollbar:hover {
  background: #4e4e52 !important;
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
  background: #18181c;
  border-radius: 0;
}

.n-modal-body-wrapper::-webkit-scrollbar-thumb,
.n-drawer-body-content-wrapper::-webkit-scrollbar-thumb,
.n-data-table-base-table-body::-webkit-scrollbar-thumb,
.n-select-menu::-webkit-scrollbar-thumb,
.n-dropdown-menu::-webkit-scrollbar-thumb {
  background: #3e3e42;
  border-radius: 0;
}

.n-modal-body-wrapper::-webkit-scrollbar-thumb:hover,
.n-drawer-body-content-wrapper::-webkit-scrollbar-thumb:hover,
.n-data-table-base-table-body::-webkit-scrollbar-thumb:hover,
.n-select-menu::-webkit-scrollbar-thumb:hover,
.n-dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: #4e4e52;
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
}
</style>
