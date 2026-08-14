<template>
  <div class="mefrp-webui">
    <div class="webui-content">
      <!-- WebUI 设置卡片 -->
      <WebuiSettingsPanel
        :addr="webuiStore.settings.addr"
        :port="webuiStore.settings.port"
        :pass="webuiStore.settings.pass"
        :is-running="webuiStore.isRunning"
        :is-starting="webuiStore.isStarting"
        :is-stopping="webuiStore.isStopping"
        @update:addr="(value) => (webuiStore.settings.addr = value)"
        @update:port="(value) => { if (value !== null) webuiStore.settings.port = value }"
        @update:pass="(value) => (webuiStore.settings.pass = value)"
        @save="handleSaveSettings"
        @start="handleStart"
        @stop="handleStop"
        @open-window="handleOpenInWindow"
        @open-browser="handleOpenInBrowser"
      />

      <!-- 原生隧道列表 -->
      <WebuiTunnelList
        v-if="webuiStore.showEmbedded && webuiStore.isRunning"
        :tunnels="tunnels"
        :tunnels-loading="tunnelsLoading"
        :tunnels-error="tunnelsError"
        :tunnel-action-loading="tunnelActionLoading"
        @refresh="refreshTunnels"
        @start="startTunnel"
        @stop="stopTunnel"
      />

      <!-- WebUI 运行日志卡片 -->
      <WebuiLogPanel
        v-if="webuiStore.isRunning"
        :logs="logs"
        :logs-loading="logsLoading"
        :logs-error="logsError"
        :enable-ai="enableAi"
        :ai-analyzing="aiAnalyzing"
        @copy="copyLogs"
        @analyze="handleAIAnalyze"
      />
    </div>
  </div>

  <!-- AI 分析结果模态框 -->
  <n-modal
    v-model:show="showAnalysisModal"
    preset="card"
    title="AI 日志分析结果"
    style="width: 80%; max-width: 800px"
  >
    <div class="markdown-content" style="max-height: 500px; overflow-y: auto;">
              <div v-html="parseMarkdown(analysisResult)"></div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useMessage } from "naive-ui";
import { useWebuiStore } from "../stores/webui";
import { useSettingsStore } from "@/stores/settings";
import { invoke } from "@tauri-apps/api/core";
import { extractProxyList, invokeTauriResponse, invokeTauriText } from "@/utils/tauriResponse";
import { loadUnifiedConfig } from "@/utils/unifiedConfig";
import { extractErrorMessage } from "@/utils/errorHandler";
import { getSanitizedLogsText } from "@/utils/logSanitizer";
import { parseMarkdown } from "@/utils/markdownParser";
import { copyToClipboard } from "@/utils/clipboard";
import { useAIAnalysis } from "@/composables/useAIAnalysis";
import type { Tunnel as TunnelRecord } from "@/types/tunnel";
import WebuiSettingsPanel from "@/components/webui/WebuiSettingsPanel.vue";
import WebuiTunnelList from "@/components/webui/WebuiTunnelList.vue";
import WebuiLogPanel from "@/components/webui/WebuiLogPanel.vue";

const message = useMessage();
const webuiStore = useWebuiStore();
const settingsStore = useSettingsStore();
const enableAi = computed(() => settingsStore.settings.enableAi ?? false);
let statusCheckInterval: number | null = null;

// 防抖定时器
let saveSettingsDebounceTimer: number | null = null;

// 隧道列表相关
type Tunnel = Pick<
  TunnelRecord,
  "proxyId" | "proxyName" | "proxyType" | "isOnline" | "remotePort" | "nodeId"
>;

const tunnels = ref<Tunnel[]>([]);
const tunnelsLoading = ref(false);
const tunnelsError = ref("");
const tunnelActionLoading = ref<Record<number, boolean>>({});
const sessionCookie = ref("");
let tunnelsRefreshInterval: number | null = null;

// 日志相关
const logs = ref<string[]>([]);
const logsLoading = ref(false);
const logsError = ref("");
const autoRefreshLogs = ref(true); // 默认开启自动刷新
let logsRefreshInterval: number | null = null;
let lastLogsSnapshot = "";
const { aiAnalyzing, analysisResult, showAnalysisModal, handleAIAnalyze } = useAIAnalysis(logs, message);

interface TunnelListPayload {
  proxies?: Tunnel[];
}

async function getRequiredConfigToken(
  key: "userToken" | "frpToken",
  errorMessage: string,
): Promise<string> {
  const config = await loadUnifiedConfig();
  const token = config[key] || "";

  if (!token) {
    throw new Error(errorMessage);
  }

  return token;
}

async function runTunnelAction(
  command: "webui_start_tunnel" | "webui_stop_tunnel",
  proxyId: number,
  successMessage: string,
): Promise<void> {
  const frpToken = await getRequiredConfigToken("frpToken", "未找到 FRP Token，请先登录");

  const result = await invokeTauriResponse<null>(command, {
    session: sessionCookie.value,
    proxyId,
    frpToken,
  });

  if (result.code !== 200) {
    throw new Error(result.message || successMessage.replace("成功", "失败"));
  }

  message.success(successMessage);
  await fetchTunnels();
}

// 包装 store 方法以显示消息
const handleStart = async () => {
  const result = await webuiStore.start();
  if (result.success) {
    message.success(result.message);
    // WebUI 启动成功后，登录并获取隧道列表
    await loginWebUI();
  } else {
    message.error(result.message);
  }
};

const handleStop = async () => {
  const result = await webuiStore.stop();
  if (result.success) {
    message.success(result.message);
    // WebUI 停止后清空隧道列表
    tunnels.value = [];
    sessionCookie.value = "";
    stopTunnelsRefresh();
  } else {
    message.error(result.message);
  }
};

// 登录 WebUI（in-flight 去重，避免并发触发重复登录）
let loginInFlight: Promise<void> | null = null;
const loginWebUI = async (): Promise<void> => {
  if (loginInFlight) {
    return loginInFlight;
  }

  loginInFlight = (async () => {
    try {
      const session = await invokeTauriText("webui_login", {
        password: webuiStore.settings.pass,
      });

      sessionCookie.value = session;
      // 登录成功后获取隧道列表
      await fetchTunnels();
      // 启动定期刷新
      startTunnelsRefresh();
    } catch (error) {
      console.error("登录 WebUI 失败:", error);
      tunnelsError.value = `登录 WebUI 失败: ${extractErrorMessage(error, "登录 WebUI 失败")}`;
    }
  })().finally(() => {
    loginInFlight = null;
  });

  return loginInFlight;
};

// 获取隧道列表（in-flight 去重，避免 5s 轮询与手动刷新并发堆叠）
let fetchTunnelsInFlight: Promise<void> | null = null;
let reauthInProgress = false;
const fetchTunnels = async (): Promise<void> => {
  if (fetchTunnelsInFlight) {
    return fetchTunnelsInFlight;
  }

  if (!sessionCookie.value) {
    return loginWebUI();
  }

  fetchTunnelsInFlight = (async () => {
    tunnelsLoading.value = true;
    tunnelsError.value = "";

    try {
      const userToken = await getRequiredConfigToken("userToken", "未找到用户 Token，请先登录");

      const result = await invokeTauriResponse<TunnelListPayload | Tunnel[]>("webui_get_tunnels", {
        session: sessionCookie.value,
        userToken,
      });

      if (result.code === 200) {
        tunnels.value = extractProxyList(result.data);
      } else {
        throw new Error(result.message || "获取隧道列表失败");
      }
    } catch (error) {
      console.error("获取隧道列表失败:", error);
      tunnelsError.value = extractErrorMessage(error, "获取隧道列表失败");
      // 认证失败时尝试重新登录（reauthInProgress 防 401→重登→再 401 无限递归）
      const isAuthError =
        tunnelsError.value.includes("401") || tunnelsError.value.includes("认证");
      if (isAuthError && !reauthInProgress) {
        reauthInProgress = true;
        sessionCookie.value = "";
        try {
          await loginWebUI();
        } finally {
          reauthInProgress = false;
        }
      }
    } finally {
      tunnelsLoading.value = false;
    }
  })().finally(() => {
    fetchTunnelsInFlight = null;
  });

  return fetchTunnelsInFlight;
};

// 刷新隧道列表
const refreshTunnels = async () => {
  await fetchTunnels();
};

// 启动隧道
const startTunnel = async (proxyId: number) => {
  if (!sessionCookie.value) {
    message.error("请先登录 WebUI");
    return;
  }

  tunnelActionLoading.value[proxyId] = true;
  try {
    await runTunnelAction("webui_start_tunnel", proxyId, "隧道启动成功");
  } catch (error) {
    console.error("启动隧道失败:", error);
    message.error(extractErrorMessage(error, "启动隧道失败"));
  } finally {
    tunnelActionLoading.value[proxyId] = false;
  }
};

// 停止隧道
const stopTunnel = async (proxyId: number) => {
  if (!sessionCookie.value) {
    message.error("请先登录 WebUI");
    return;
  }

  tunnelActionLoading.value[proxyId] = true;
  try {
    await runTunnelAction("webui_stop_tunnel", proxyId, "隧道停止成功");
  } catch (error) {
    console.error("停止隧道失败:", error);
    message.error(extractErrorMessage(error, "停止隧道失败"));
  } finally {
    tunnelActionLoading.value[proxyId] = false;
  }
};

// 启动隧道列表定期刷新
const startTunnelsRefresh = () => {
  stopTunnelsRefresh();
  tunnelsRefreshInterval = window.setInterval(() => {
    if (webuiStore.isRunning && sessionCookie.value) {
      fetchTunnels();
    }
  }, 5000); // 每5秒刷新一次
};

// 停止隧道列表定期刷新
const stopTunnelsRefresh = () => {
  if (tunnelsRefreshInterval !== null) {
    clearInterval(tunnelsRefreshInterval);
    tunnelsRefreshInterval = null;
  }
};

// 获取日志（1s 轮询：in-flight 去重，避免慢请求堆叠与响应乱序回写）
let fetchLogsInFlight: Promise<void> | null = null;
const fetchLogs = async (): Promise<void> => {
  if (fetchLogsInFlight) {
    return fetchLogsInFlight;
  }

  fetchLogsInFlight = (async () => {
    logsLoading.value = true;
    logsError.value = "";

    try {
      const logsArray = await invoke<string[]>("get_webui_logs");
      const nextSnapshot = logsArray.join("\n");
      if (nextSnapshot === lastLogsSnapshot) {
        return;
      }

      lastLogsSnapshot = nextSnapshot;
      logs.value = logsArray;
    } catch (error) {
      console.error("获取日志失败:", error);
      logsError.value = error instanceof Error ? error.message : "获取日志失败";
    } finally {
      logsLoading.value = false;
    }
  })().finally(() => {
    fetchLogsInFlight = null;
  });

  return fetchLogsInFlight;
};

// 复制日志（净化后的版本，移除 ANSI 转义序列和特殊字符）
const copyLogs = async () => {
  if (!logs.value || logs.value.length === 0) {
    message.warning("暂无日志内容");
    return;
  }

  try {
    const logsText = getSanitizedLogsText(logs.value);
    await copyToClipboard(logsText);
    message.success("日志已复制到剪贴板（已净化）");
  } catch (error) {
    console.error("复制日志失败:", error);
    message.error("复制日志失败");
  }
};

// 启动日志自动刷新
const startLogsRefresh = () => {
  stopLogsRefresh();
  if (autoRefreshLogs.value && webuiStore.isRunning) {
    // 立即获取一次
    fetchLogs();
    // 每1秒刷新一次
    logsRefreshInterval = window.setInterval(() => {
      if (webuiStore.isRunning) {
        fetchLogs();
      }
    }, 1000);
  }
};

// 停止日志自动刷新
const stopLogsRefresh = () => {
  if (logsRefreshInterval !== null) {
    clearInterval(logsRefreshInterval);
    logsRefreshInterval = null;
  }
};

// 监听自动刷新开关
watch(autoRefreshLogs, (newValue) => {
  if (newValue && webuiStore.isRunning) {
    startLogsRefresh();
  } else {
    stopLogsRefresh();
  }
});

// 监听 WebUI 运行状态
watch(
  () => webuiStore.isRunning,
  (isRunning) => {
    if (isRunning) {
      // WebUI 启动后开始自动刷新日志
      if (autoRefreshLogs.value) {
        startLogsRefresh();
      }
    } else {
      // WebUI 停止后清空日志并停止刷新
      logs.value = [];
      lastLogsSnapshot = "";
      stopLogsRefresh();
    }
  }
);

watch(
  () => webuiStore.isRunning,
  async (isRunning) => {
    if (isRunning && webuiStore.showEmbedded) {
      // WebUI 启动后自动登录并获取隧道列表
      await loginWebUI();
    } else {
      // WebUI 停止后清空数据
      tunnels.value = [];
      sessionCookie.value = "";
      logs.value = [];
      lastLogsSnapshot = "";
      stopTunnelsRefresh();
    }
  }
);

const handleSaveSettings = async () => {
  // 清除之前的定时器
  if (saveSettingsDebounceTimer !== null) {
    clearTimeout(saveSettingsDebounceTimer);
  }
  
  // 用户点击"保存"：持久化地址/端口/密码
  saveSettingsDebounceTimer = window.setTimeout(async () => {
    // 密码在点击保存时落盘持久化
    const result = await webuiStore.saveSettings(true);
    if (result.success) {
      message.success(result.message);
    } else {
      message.error(result.message);
    }
  }, 500);
};

const handleOpenInBrowser = async () => {
  const result = await webuiStore.openInBrowser();
  if (!result.success && result.message) {
    message.error(result.message);
  }
};

const handleOpenInWindow = async () => {
  const result = await webuiStore.openInWindow();
  if (result.success) {
    message.success("WebUI 窗口已打开");
  } else if (result.message) {
    message.error(result.message);
  }
};

onMounted(() => {
  webuiStore.loadSettings();
  // 启动定期状态检查
  startStatusCheck();
  // 如果 WebUI 已经在运行，登录并获取隧道列表
  if (webuiStore.isRunning && webuiStore.showEmbedded) {
    loginWebUI();
  }
  // 如果 WebUI 已经在运行，自动刷新一次日志
  if (webuiStore.isRunning) {
    fetchLogs();
    // 如果开启了自动刷新，启动定时刷新
    if (autoRefreshLogs.value) {
      startLogsRefresh();
    }
  }
});

// 组件卸载时停止定时器并清除会话
onUnmounted(() => {
  stopStatusCheck();
  stopTunnelsRefresh();
  stopLogsRefresh();
  // 清理会话 cookie（敏感信息，卸载后立即清除）
  sessionCookie.value = "";
  // 清理防抖定时器
  if (saveSettingsDebounceTimer !== null) {
    clearTimeout(saveSettingsDebounceTimer);
    saveSettingsDebounceTimer = null;
  }
});

// 启动状态检查定时器
const startStatusCheck = () => {
  // 立即检查一次
  webuiStore.checkStatus();
  // 每3秒检查一次
  statusCheckInterval = window.setInterval(() => {
    webuiStore.checkStatus();
  }, 3000);
};

// 停止状态检查定时器
const stopStatusCheck = () => {
  if (statusCheckInterval !== null) {
    clearInterval(statusCheckInterval);
    statusCheckInterval = null;
  }
};
</script>

<style scoped>
.mefrp-webui {
  padding: 20px;
  width: 100%;
}

.webui-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
