<template>
  <div class="mefrp-webui">
    <div class="webui-content">
      <!-- WebUI 设置卡片 -->
      <n-card :bordered="true" class="webui-section">
        <template #header>
          <div class="section-header">
            <Settings :size="18" />
            <span>MEFrpc WebUI 设置</span>
          </div>
        </template>

        <div class="settings-row">
          <div class="setting-item-inline">
            <span class="setting-label">地址<n-tag size="medium" type="info">非必要不更改</n-tag></span>
            <n-input
              v-model:value="webuiStore.settings.addr"
              placeholder="localhost"
              @update:value="handleSaveSettings"
              size="small"
              style="width: 120px"
            />
          </div>

          <div class="setting-item-inline">
            <span class="setting-label">端口<n-tag size="medium" type="info">非必要不更改</n-tag></span>
            <n-input-number
              v-model:value="webuiStore.settings.port"
              :min="1"
              :max="65535"
              :step="1"
              placeholder="1201"
              @update:value="handleSaveSettings"
              size="small"
              style="width: 100px"
            />
          </div>

          <div class="setting-item-inline">
            <span class="setting-label">密码<n-tag size="medium" type="warning">必须修改</n-tag></span>
            <n-input
              v-model:value="webuiStore.settings.pass"
              type="password"
              show-password-on="click"
              placeholder="admin"
              @update:value="handleSaveSettings"
              size="small"
              style="width: 100px"
            />
          </div>

          <n-space :size="8" style="margin-left: auto">
            <n-tooltip v-if="!webuiStore.isRunning">
              <template #trigger>
                <n-button
                  type="primary"
                  @click="handleStart"
                  :loading="webuiStore.isStarting"
                  size="small"
                >
                  <template #icon>
                    <Play :size="14" />
                  </template>
                  启动
                </n-button>
              </template>
              启动 WebUI
            </n-tooltip>
            <n-tooltip v-else>
              <template #trigger>
                <n-button
                  type="warning"
                  @click="handleStop"
                  :loading="webuiStore.isStopping"
                  size="small"
                >
                  <template #icon>
                    <Square :size="14" />
                  </template>
                  停止
                </n-button>
              </template>
              停止 WebUI
            </n-tooltip>

            <n-tooltip>
              <template #trigger>
                <n-button
                  type="primary"
                  @click="handleOpenInWindow"
                  :disabled="!webuiStore.isRunning"
                  size="small"
                >
                  <template #icon>
                    <ExternalLink :size="14" />
                  </template>
                  新窗口
                </n-button>
              </template>
              在新窗口中打开 WebUI
            </n-tooltip>

            <n-tooltip>
              <template #trigger>
                <n-button
                  type="info"
                  @click="handleOpenInBrowser"
                  :disabled="!webuiStore.isRunning"
                  size="small"
                >
                  <template #icon>
                    <ExternalLink :size="14" />
                  </template>
                  浏览器
                </n-button>
              </template>
              在浏览器中打开 WebUI
            </n-tooltip>
          </n-space>
        </div>
      </n-card>

      <!-- 原生隧道列表 -->
      <n-card
        v-if="webuiStore.showEmbedded && webuiStore.isRunning"
        :bordered="true"
        class="webui-embed-section"
      >
        <template #header>
          <div class="section-header">
            <Monitor :size="18" />
            <span>隧道列表</span>
            <n-button
              text
              type="info"
              @click="refreshTunnels"
              :loading="tunnelsLoading"
              style="margin-left: auto"
            >
              <template #icon>
                <RefreshCw :size="18" />
              </template>
            </n-button>
          </div>
        </template>

        <!-- 加载状态 -->
        <div v-if="tunnelsLoading && tunnels.length === 0" class="tunnels-loading">
          <n-spin size="large" />
          <p>加载隧道列表中...</p>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="tunnelsError" class="tunnels-error">
          <n-alert type="error" :title="tunnelsError" />
          <n-button type="primary" @click="refreshTunnels" style="margin-top: 16px">
            重试
          </n-button>
        </div>

        <!-- 隧道列表 -->
        <div v-else-if="tunnels.length > 0" class="tunnels-grid">
          <n-card
            v-for="tunnel in tunnels"
            :key="tunnel.proxyId"
            :bordered="true"
            class="tunnel-card"
            size="small"
          >
            <template #header>
              <div class="tunnel-header">
                <span class="tunnel-name">{{ tunnel.proxyName }}</span>
                <n-tag
                  :type="tunnel.isOnline ? 'success' : 'default'"
                  :bordered="false"
                  size="small"
                >
                  {{ tunnel.isOnline ? "在线" : "离线" }}
                </n-tag>
              </div>
            </template>

            <div class="tunnel-info">
              <div class="info-row">
                <span class="info-label">协议:</span>
                <span class="info-value">{{ tunnel.proxyType.toUpperCase() }}</span>
              </div>
              <div
                class="info-row"
                v-if="tunnel.proxyType === 'tcp' || tunnel.proxyType === 'udp'"
              >
                <span class="info-label">远程端口:</span>
                <span class="info-value">{{ tunnel.remotePort }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">节点:</span>
                <span class="info-value">#{{ tunnel.nodeId }}</span>
              </div>
            </div>

            <template #action>
              <div class="tunnel-actions">
                <n-button
                  v-if="!tunnel.isOnline"
                  type="primary"
                  size="small"
                  @click="startTunnel(tunnel.proxyId)"
                  :loading="tunnelActionLoading[tunnel.proxyId]"
                >
                  <template #icon>
                    <Play :size="14" />
                  </template>
                  启动
                </n-button>
                <n-button
                  v-else
                  type="warning"
                  size="small"
                  @click="stopTunnel(tunnel.proxyId)"
                  :loading="tunnelActionLoading[tunnel.proxyId]"
                >
                  <template #icon>
                    <Square :size="14" />
                  </template>
                  停止
                </n-button>
              </div>
            </template>
          </n-card>
        </div>

        <!-- 空状态 -->
        <div v-else class="tunnels-empty">
          <n-empty description="暂无隧道数据" />
        </div>
      </n-card>

      <!-- WebUI 运行日志卡片 -->
      <n-card
        v-if="webuiStore.isRunning"
        :bordered="true"
        class="webui-logs-section"
      >
        <template #header>
          <div class="section-header">
            <FileText :size="18" />
            <span>Mefrpc 运行日志</span>
            <n-tag type="error" size="medium" style="margin-left: 8px">
              如果您截图分享此页面请打码红色字体内容
            </n-tag>
            <n-space :size="8" style="margin-left: auto">
              <n-button
                text
                type="info"
                @click="copyLogs"
                :disabled="!logs || logs.length === 0"
              >
                <template #icon>
                  <Copy :size="18" />
                </template>
                复制
              </n-button>
            </n-space>
          </div>
        </template>

        <div class="logs-content">
          <div v-if="logsLoading && (!logs || logs.length === 0)" class="logs-loading">
            <n-spin size="large" />
            <p>加载日志中...</p>
          </div>
          <div v-else-if="logsError" class="logs-error">
            <n-alert type="error" :title="logsError" />
          </div>
          <div v-else-if="logs && logs.length > 0" class="logs-text" ref="logsTextRef">
            <div
              v-for="(log, index) in logs"
              :key="index"
              class="log-line"
              v-html="colorizeLog(log)"
            ></div>
          </div>
          <div v-else class="logs-empty">
            <n-empty description="暂无日志数据" />
          </div>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useMessage } from "naive-ui";
import {
  Settings,
  Play,
  Square,
  ExternalLink,
  Monitor,
  RefreshCw,
  FileText,
  Copy,
} from "lucide-vue-next";
import { useWebuiStore } from "../stores/webui";
import { invoke } from "@tauri-apps/api/core";

const message = useMessage();
const webuiStore = useWebuiStore();
let statusCheckInterval: number | null = null;

// 防抖定时器
let saveSettingsDebounceTimer: number | null = null;

// 隧道列表相关
interface Tunnel {
  proxyId: number;
  proxyName: string;
  proxyType: string;
  isOnline: boolean;
  remotePort: number;
  nodeId: number;
}

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
const logsTextRef = ref<HTMLElement | null>(null);
let logsRefreshInterval: number | null = null;

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

// 登录 WebUI
const loginWebUI = async () => {
  try {
    const session = await invoke<string>("webui_login", {
      password: webuiStore.settings.pass,
    });
    
    sessionCookie.value = session;
    // 登录成功后获取隧道列表
    await fetchTunnels();
    // 启动定期刷新
    startTunnelsRefresh();
  } catch (error) {
    console.error("登录 WebUI 失败:", error);
    tunnelsError.value = `登录 WebUI 失败: ${error}`;
  }
};

// 获取隧道列表
const fetchTunnels = async () => {
  if (!sessionCookie.value) {
    await loginWebUI();
    return;
  }

  tunnelsLoading.value = true;
  tunnelsError.value = "";

  try {
    // 从配置中获取 userToken
    const config = await invoke<any>("load_unified_config");
    const userToken = config.userToken || "";

    if (!userToken) {
      throw new Error("未找到用户 Token，请先登录");
    }

    const responseText = await invoke<string>("webui_get_tunnels", {
      session: sessionCookie.value,
      userToken: userToken,
    });

    const result = JSON.parse(responseText);
    if (result.code === 200) {
      tunnels.value = result.data.proxies || [];
    } else {
      throw new Error(result.message || "获取隧道列表失败");
    }
  } catch (error) {
    console.error("获取隧道列表失败:", error);
    tunnelsError.value = error instanceof Error ? error.message : "获取隧道列表失败";
    // 如果是认证失败，尝试重新登录
    if (tunnelsError.value.includes("401") || tunnelsError.value.includes("认证")) {
      sessionCookie.value = "";
      await loginWebUI();
    }
  } finally {
    tunnelsLoading.value = false;
  }
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
    // 从配置中获取 frpToken
    const config = await invoke<any>("load_unified_config");
    const frpToken = config.frpToken || "";

    if (!frpToken) {
      throw new Error("未找到 FRP Token，请先登录");
    }

    const responseText = await invoke<string>("webui_start_tunnel", {
      session: sessionCookie.value,
      proxyId: proxyId,
      frpToken: frpToken,
    });

    const result = JSON.parse(responseText);
    if (result.code === 200) {
      message.success("隧道启动成功");
      // 刷新隧道列表
      await fetchTunnels();
    } else {
      throw new Error(result.message || "启动隧道失败");
    }
  } catch (error) {
    console.error("启动隧道失败:", error);
    message.error(error instanceof Error ? error.message : "启动隧道失败");
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
    // 从配置中获取 frpToken
    const config = await invoke<any>("load_unified_config");
    const frpToken = config.frpToken || "";

    if (!frpToken) {
      throw new Error("未找到 FRP Token，请先登录");
    }

    const responseText = await invoke<string>("webui_stop_tunnel", {
      session: sessionCookie.value,
      proxyId: proxyId,
      frpToken: frpToken,
    });

    const result = JSON.parse(responseText);
    if (result.code === 200) {
      message.success("隧道停止成功");
      // 刷新隧道列表
      await fetchTunnels();
    } else {
      throw new Error(result.message || "停止隧道失败");
    }
  } catch (error) {
    console.error("停止隧道失败:", error);
    message.error(error instanceof Error ? error.message : "停止隧道失败");
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

// 获取日志（直接从后端进程日志获取）
const fetchLogs = async () => {
  logsLoading.value = true;
  logsError.value = "";

  try {
    const logsArray = await invoke<string[]>("get_webui_logs");
    logs.value = logsArray;
    
    // 自动滚动到底部
    nextTick(() => {
      if (logsTextRef.value) {
        logsTextRef.value.scrollTop = logsTextRef.value.scrollHeight;
      }
    });
  } catch (error) {
    console.error("获取日志失败:", error);
    logsError.value = error instanceof Error ? error.message : "获取日志失败";
  } finally {
    logsLoading.value = false;
  }
};

// 复制日志（净化后的版本，移除 ANSI 转义序列和特殊字符）
const copyLogs = async () => {
  if (!logs.value || logs.value.length === 0) {
    message.warning("暂无日志内容");
    return;
  }

  try {
    // 净化日志：移除 ANSI 转义序列和特殊字符
    const cleanedLogs = logs.value.map(log => 
      log.replace(/\x1b\[[0-9;]*m/g, "").replace(/▣/g, "")
    );
    const logsText = cleanedLogs.join("\n");
    await navigator.clipboard.writeText(logsText);
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
    // 每0.5秒刷新一次
    logsRefreshInterval = window.setInterval(() => {
      if (webuiStore.isRunning) {
        fetchLogs();
      }
    }, 500);
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
      stopLogsRefresh();
    }
  }
);

// 为日志添加颜色（与隧道管理相同的渲染逻辑）
const colorizeLog = (log: string): string => {
  // 清理 ANSI 转义序列
  let cleanLog = log.replace(/\x1b\[[0-9;]*m/g, "").replace(/▣/g, "");

  // 时间戳 - 灰色
  cleanLog = cleanLog.replace(
    /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?)/g,
    '<span style="color: #888;">$1</span>',
  );

  // 日志级别 [I] - 蓝色
  cleanLog = cleanLog.replace(
    /\[I\]/g,
    '<span style="color: #42a5f5;">[I]</span>',
  );

  // 日志级别 [W] - 黄色
  cleanLog = cleanLog.replace(
    /\[W\]/g,
    '<span style="color: #ffc107;">[W]</span>',
  );

  // 日志级别 [E] - 红色
  cleanLog = cleanLog.replace(
    /\[E\]/g,
    '<span style="color: #ff6b6b;">[E]</span>',
  );

  // 文件路径 [xxx.go:123] - 绿色（先处理，避免被后续规则匹配）
  cleanLog = cleanLog.replace(
    /(\[[^\]]+\.go:\d+\])/g,
    '<span style="color: #7cb342;">$1</span>',
  );

  // HTTP/HTTPS URL - 红色加粗（在处理 IP 和域名之前）
  cleanLog = cleanLog.replace(
    /\b(https?:\/\/[a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)+(?::\d+)?(?:\/[^\s\]]*)?)\b/g,
    '<span style="color: #ff6b6b; font-weight: 600;">$1</span>',
  );

  // IP地址:端口 - 红色加粗
  cleanLog = cleanLog.replace(
    /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+)\b/g,
    '<span style="color: #ff6b6b; font-weight: 600;">$1</span>',
  );

  // 域名:端口 - 红色加粗（排除 .go: 文件路径）
  cleanLog = cleanLog.replace(
    /\b([a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)+:\d+)\b(?!\.go)/g,
    (match) => {
      // 额外检查：如果匹配项以 .go: 结尾，则不高亮
      if (/\.go:\d+$/.test(match)) {
        return match;
      }
      return `<span style="color: #ff6b6b; font-weight: 600;">${match}</span>`;
    },
  );

  // 访问密钥（32位十六进制字符串）- 红色加粗
  cleanLog = cleanLog.replace(
    /\b([0-9a-f]{32})\b/gi,
    '<span style="color: #ff6b6b; font-weight: 600;">$1</span>',
  );

  return cleanLog;
};

// 监听 WebUI 运行状态变化
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
      stopTunnelsRefresh();
    }
  }
);

const handleSaveSettings = async () => {
  // 清除之前的定时器
  if (saveSettingsDebounceTimer !== null) {
    clearTimeout(saveSettingsDebounceTimer);
  }
  
  // 设置新的定时器，500ms 后保存
  saveSettingsDebounceTimer = window.setTimeout(async () => {
    const result = await webuiStore.saveSettings();
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

// 组件挂载时加载设置
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

// 组件卸载时停止定时器
onUnmounted(() => {
  stopStatusCheck();
  stopTunnelsRefresh();
  stopLogsRefresh();
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

.webui-section,
.webui-embed-section,
.webui-logs-section {
  border-radius: 0px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.settings-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.setting-item-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-label {
  font-size: 14px;
  color: var(--n-text-color);
  white-space: nowrap;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.setting-info {
  flex: 1;
}

.setting-info h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--n-text-color);
}

/* 隧道列表样式 */
.tunnels-loading,
.tunnels-error,
.tunnels-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.tunnels-loading p {
  margin-top: 16px;
  color: var(--n-text-color-depth-3);
}

.tunnels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.tunnel-card {
  border-radius: 8px;
}

.tunnel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tunnel-name {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tunnel-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 13px;
  color: var(--n-text-color-depth-2);
}

.info-value {
  font-size: 13px;
  color: var(--n-text-color);
  font-weight: 500;
}

.tunnel-actions {
  display: flex;
  gap: 8px;
}

.tunnel-actions .n-button {
  flex: 1;
}

/* WebUI 日志卡片样式 */
.logs-content {
  height: 400px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.logs-loading,
.logs-error,
.logs-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.logs-loading p {
  margin-top: 16px;
  color: var(--n-text-color-depth-3);
}

.logs-text {
  flex: 1;
  overflow-y: auto;
  background: var(--n-color-embedded);
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  padding: 12px;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
}

.log-line {
  margin-bottom: 2px;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.log-line:last-child {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .mefrp-webui {
    padding: 10px;
  }

  .settings-row {
    flex-direction: column;
    align-items: stretch;
  }

  .setting-item-inline {
    width: 100%;
  }

  .setting-item-inline input,
  .setting-item-inline .n-input-number {
    flex: 1;
  }

  .tunnels-grid {
    grid-template-columns: 1fr;
  }

  .logs-content {
    height: 300px;
  }
}
</style>
