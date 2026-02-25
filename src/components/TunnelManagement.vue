<template>
  <div class="tunnel-management">
    <div class="page-header">
      <h2 class="page-title">隧道管理</h2>
      <n-button type="primary" @click="refreshTunnels" :loading="loading">
        <template #icon>
          <RefreshCw :size="16" />
        </template>
        刷新
      </n-button>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="error-container">
      <n-alert type="error" :title="error" />
      <n-button
        type="primary"
        @click="
          () => {
            error = '';
            loadTunnels();
          }
        "
        style="margin-top: 16px"
      >
        重新加载
      </n-button>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="tunnels-container">
      <div class="tunnels-grid">
        <n-card
          v-for="i in 6"
          :key="i"
          :bordered="true"
          size="small"
          class="tunnel-card"
        >
          <template #header>
            <div class="tunnel-header">
              <n-skeleton text width="120" />
              <n-skeleton text width="60" />
            </div>
          </template>

          <div class="tunnel-content">
            <n-skeleton text :repeat="4" />
          </div>

          <template #action>
            <div class="tunnel-actions">
              <n-skeleton text width="60" style="margin-right: 8px" />
              <n-skeleton text width="60" style="margin-right: 8px" />
              <n-skeleton text width="60" />
            </div>
          </template>
        </n-card>
      </div>
    </div>

    <!-- 隧道卡片网格 -->
    <div v-else-if="tunnels.length > 0" class="tunnels-container">
      <div class="tunnels-grid">
        <TunnelCard
          v-for="tunnel in tunnels"
          :key="tunnel.proxyId"
          :tunnel="tunnel"
          :node-name-map="nodeNameMap"
          :node-hostname-map="nodeHostnameMap"
          :is-running="runningTunnels.has(tunnel.proxyId)"
          :is-loading="actionLoading[tunnel.proxyId] || false"
          :using-config-file="usingConfigFile.includes(tunnel.proxyId)"
          @start="startTunnel"
          @stop="stopTunnel"
          @view-logs="viewLogs"
          @view-details="viewTunnelDetails"
          @copy-address="copyRemoteAddress"
          @more-action="handleMoreAction"
        />
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <n-empty description="暂无隧道数据">
        <template #icon>
          <Inbox :size="48" />
        </template>
        <template #extra>
          <n-button type="primary" @click="goToCreateTunnel">
            创建隧道
          </n-button>
        </template>
      </n-empty>
    </div>
  </div>

  <!-- 日志模态框 -->
  <TunnelLogsModal
    v-model:show="showLogs"
    :tunnel-id="currentTunnelId"
    :logs="currentLogs"
    :loading="loadingLogs"
    @refresh="viewLogs"
  />

  <!-- 隧道详情模态框 -->
  <TunnelDetailsModal
    v-model:show="showDetails"
    :tunnel="currentTunnelDetails"
    :node-name-map="nodeNameMap"
    :node-hostname-map="nodeHostnameMap"
  />

  <!-- 编辑隧道模态框 -->
  <TunnelEditModal
    v-model:show="showEditModal"
    :tunnel="editingTunnel"
    :node-name-map="nodeNameMap"
    :getting-port="gettingPortForEdit"
    @save="saveEdit"
    @cancel="cancelEdit"
    @get-free-port="getFreePortForEdit"
  />

  <!-- 配置文件模态框 -->
  <TunnelConfigModal
    v-model:show="showConfigModal"
    :tunnel-id="currentConfigTunnelId"
    :config-contents="configContents"
    :editable-contents="editableConfigContents"
    :is-editing="isEditingConfig"
    :active-type="activeConfigType"
    @start-edit="startEditConfig"
    @save-to-local="saveConfigFile"
    @save-edit="saveEditedConfig"
    @cancel-edit="cancelEditConfig"
    @change-type="handleConfigTypeChange"
  />
</template>

<script setup lang="ts">
import { h, ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useMessage, useDialog, NIcon, NDescriptions, NDescriptionsItem } from "naive-ui";
import { invoke } from "@tauri-apps/api/core";
import {
  RefreshCw,
  Edit,
  Inbox,
  FileCode,
  Rocket,
  FileOutput,
  PlayCircle,
  PauseCircle,
  LogOut,
  Trash2,
} from "lucide-vue-next";

// Import child components
import TunnelCard from "./tunnel/TunnelCard.vue";
import TunnelEditModal from "./tunnel/TunnelEditModal.vue";
import TunnelLogsModal from "./tunnel/TunnelLogsModal.vue";
import TunnelDetailsModal from "./tunnel/TunnelDetailsModal.vue";
import TunnelConfigModal from "./tunnel/TunnelConfigModal.vue";

interface Tunnel {
  proxyId: number;
  username: string;
  proxyName: string;
  proxyType: string;
  isBanned: boolean;
  isDisabled: boolean;
  localIp: string;
  localPort: number;
  remotePort: number;
  nodeId: number;
  runId: string;
  isOnline: boolean;
  domain: string;
  lastStartTime: number;
  lastCloseTime: number;
  clientVersion: string;
  proxyProtocolVersion: string;
  useEncryption: boolean;
  useCompression: boolean;
  location: string;
  accessKey: string;
  hostHeaderRewrite: string;
  headerXFromWhere: string;
  httpUser?: string;
  httpPassword?: string;
  crtPath?: string;
  keyPath?: string;
  transportProtocol?: string;
}

interface ApiResponse {
  code: number;
  data: Tunnel[];
  message: string;
}

interface Emits {
  (e: "tunnel-start", id: number): void;
  (e: "tunnel-stop", id: number): void;
  (e: "tunnel-edit", id: number): void;
  (e: "tunnel-delete", id: number): void;
  (e: "go-to-create"): void;
}

const emit = defineEmits<Emits>();
const message = useMessage();
const dialog = useDialog();

// 响应式数据
const tunnels = ref<Tunnel[]>([]);
const loading = ref(false);
const error = ref("");
const actionLoading = ref<Record<number, boolean>>({});
const nodeNameMap = ref<Record<number, string>>({});
const nodeHostnameMap = ref<Record<number, string>>({});

// 加载节点名称列表
async function loadNodeNames() {
  try {
    const responseText = await invoke("api_get_node_name_list");
    const result = JSON.parse(responseText as string);

    if (result.code === 200) {
      // 新版 API 可能返回 {nodes} 或直接返回数组
      const nodeData = result.data.nodes || result.data || [];
      const nameMap: Record<number, string> = {};
      const hostnameMap: Record<number, string> = {};
      nodeData.forEach((node: any) => {
        nameMap[node.nodeId] = node.name;
        hostnameMap[node.nodeId] = node.hostname;
      });
      nodeNameMap.value = nameMap;
      nodeHostnameMap.value = hostnameMap;
    }
  } catch (err) {
    console.error("加载节点名称失败:", err);
  }
}

// 加载配置文件状态
async function loadConfigFileStatus() {
  try {
    const tunnelsWithConfig = await invoke("check_tunnel_config_files");
    console.log("加载配置文件状态:", tunnelsWithConfig);
    // 使用数组以触发响应式更新
    usingConfigFile.value = tunnelsWithConfig as number[];
    console.log("更新后的usingConfigFile:", usingConfigFile.value);
  } catch (err) {
    console.error("加载配置文件状态失败:", err);
  }
}

// 加载隧道列表
async function loadTunnels() {
  loading.value = true;
  error.value = "";

  try {
    // 同时加载隧道列表、节点名称和配置文件状态
    await Promise.all([
      loadNodeNames(),
      loadConfigFileStatus(),
      (async () => {
        const responseText = await invoke("api_get_tunnel_list");
        const result = JSON.parse(responseText as string);

        if (result.code === 200) {
          // 新版 API 返回格式: {code, data: {nodes, proxies}, message}
          const tunnelData = result.data.proxies || result.data || [];
          tunnels.value = tunnelData;
          message.success(`成功加载 ${tunnelData.length} 个隧道`);
        } else {
          throw new Error(result.message || "获取隧道列表失败");
        }
      })(),
    ]);
  } catch (err) {
    console.error("加载隧道列表失败:", err);
    error.value = err instanceof Error ? err.message : "加载隧道列表失败";
    message.error(error.value);
  } finally {
    loading.value = false;
  }
}

// 获取运行中的隧道
const runningTunnels = ref(new Set());

const loadRunningTunnels = async () => {
  try {
    const running = await invoke("api_get_running_tunnels");
    runningTunnels.value = new Set(running as number[]);
  } catch (error) {
    console.error("获取运行状态失败:", error);
  }
};

// 启动隧道
async function startTunnel(id: number) {
  actionLoading.value[id] = true;
  try {
    const responseText = await invoke("api_start_tunnel", { proxyId: id });
    const result = JSON.parse(responseText as string);

    if (result.code === 200) {
      message.success("隧道启动成功");
      
      // 更新运行状态
      await loadRunningTunnels();
      
      // 更新对应隧道的在线状态
      const tunnel = tunnels.value.find((t) => t.proxyId === id);
      if (tunnel) {
        tunnel.isOnline = true;
      }
    } else {
      throw new Error(result.message || "启动隧道失败");
    }

    emit("tunnel-start", id);
  } catch (err) {
    console.error("启动隧道失败:", err);
    message.error(err instanceof Error ? err.message : "启动隧道失败");
  } finally {
    actionLoading.value[id] = false;
  }
}

// 停止隧道
async function stopTunnel(id: number) {
  actionLoading.value[id] = true;
  try {
    const responseText = await invoke("api_stop_tunnel", { proxyId: id });
    const result = JSON.parse(responseText as string);

    if (result.code === 200) {
      message.success("隧道停止成功");
      
      // 更新运行状态
      await loadRunningTunnels();
      
      // 更新对应隧道的在线状态
      const tunnel = tunnels.value.find((t) => t.proxyId === id);
      if (tunnel) {
        tunnel.isOnline = false;
      }
    } else {
      throw new Error(result.message || "停止隧道失败");
    }

    emit("tunnel-stop", id);
  } catch (err) {
    console.error("停止隧道失败:", err);
    message.error(err instanceof Error ? err.message : "停止隧道失败");
  } finally {
    actionLoading.value[id] = false;
  }
}

// 查看隧道日志
const showLogs = ref(false);
const currentLogs = ref<string[]>([]);
const currentTunnelId = ref<number | null>(null);
const loadingLogs = ref(false);

// 查看隧道详情
const showDetails = ref(false);
const currentTunnelDetails = ref<Tunnel | null>(null);

// 编辑隧道
const showEditModal = ref(false);
const editingTunnel = ref<Tunnel | null>(null);
const gettingPortForEdit = ref(false);

const proxyProtocolOptions = [
  { label: "不使用", value: "" },
  { label: "v1", value: "v1" },
  { label: "v2", value: "v2" },
];

const transportProtocolOptions = [
  { label: "TCP (常规)", value: "tcp" },
  { label: "QUIC (部分场景可优化延迟)", value: "quic" },
];

const securityModeOptions = [
  { label: "禁用", value: "none" },
  { label: "Basic Auth", value: "basic" },
  { label: "访问密钥", value: "accessKey" },
];

const editForm = ref({
  proxyName: "",
  localIp: "",
  localPort: 0,
  remotePort: 0,
  domain: "",
  sourceProtocol: "http",
  securityMode: "none",
  accessKey: "",
  httpUser: "",
  httpPassword: "",
  crtPath: "",
  keyPath: "",
  useEncryption: false,
  useCompression: false,
  proxyProtocolVersion: "",
  transportProtocol: "tcp",
  proxyType: "",
  nodeId: 0,
});

const viewLogs = async (tunnelId: number) => {
  try {
    loadingLogs.value = true;
    currentTunnelId.value = tunnelId;
    const logs = await invoke("api_get_tunnel_logs", { proxyId: tunnelId });
    currentLogs.value = logs as string[];
    showLogs.value = true;
  } catch (error) {
    message.error(`获取日志失败: ${error}`);
  } finally {
    loadingLogs.value = false;
  }
};

// 查看隧道详情
const viewTunnelDetails = async (tunnelId: number) => {
  const tunnel = tunnels.value.find((t) => t.proxyId === tunnelId);
  if (tunnel) {
    currentTunnelDetails.value = tunnel;
    showDetails.value = true;
  }
};

// 获取节点地址
const getNodeAddress = (proxyId: number): string => {
  const tunnel = tunnels.value.find((t) => t.proxyId === proxyId);
  if (tunnel && nodeHostnameMap.value[tunnel.nodeId]) {
    return nodeHostnameMap.value[tunnel.nodeId];
  }
  return "未知";
};

function editTunnel(id: number) {
  const tunnel = tunnels.value.find((t) => t.proxyId === id);
  if (tunnel) {
    // 检查隧道是否在线
    if (runningTunnels.value.has(id)) {
      message.warning("隧道当前在线，请先关闭隧道");
      return;
    }

    editingTunnel.value = tunnel;
    
    // 根据accessKey和httpUser判断安全模式
    let securityMode = "none";
    if (tunnel.accessKey) {
      securityMode = "accessKey";
    } else if (tunnel.httpUser) {
      securityMode = "basic";
    }
    
    // 根据隧道类型和域名判断源协议（简化处理，默认http）
    const sourceProtocol = "http";
    
    editForm.value = {
      proxyName: tunnel.proxyName,
      localIp: tunnel.localIp,
      localPort: tunnel.localPort,
      remotePort: tunnel.remotePort,
      domain: tunnel.domain,
      sourceProtocol: sourceProtocol,
      securityMode: securityMode,
      accessKey: tunnel.accessKey || "",
      httpUser: "",
      httpPassword: "",
      crtPath: "",
      keyPath: "",
      useEncryption: tunnel.useEncryption,
      useCompression: tunnel.useCompression,
      proxyProtocolVersion: tunnel.proxyProtocolVersion || "",
      transportProtocol: "tcp",
      proxyType: tunnel.proxyType,
      nodeId: tunnel.nodeId,
    };
    showEditModal.value = true;
  }
}

// 更新隧道配置
async function updateTunnel(tunnelId: number, updateData: any) {
  try {
    actionLoading.value[tunnelId] = true;
    const requestData = {
      proxyId: tunnelId,
      proxyName: updateData.proxyName,
      localIp: updateData.localIp,
      localPort: updateData.localPort,
      remotePort: updateData.remotePort || null,
      domain: updateData.domain || "",
      location: "",
      accessKey: updateData.securityMode === 'accessKey' ? updateData.accessKey : "",
      hostHeaderRewrite: "",
      headerXFromWhere: "",
      useEncryption: updateData.useEncryption,
      useCompression: updateData.useCompression,
      proxyProtocolVersion: updateData.proxyProtocolVersion || "",
      proxyType: updateData.proxyType,
      nodeId: updateData.nodeId,
    };
    const responseText = await invoke("api_update_tunnel", {
      data: JSON.stringify(requestData),
    });
    const result = JSON.parse(responseText as string);

    if (result.code === 200) {
      message.success("隧道配置更新成功");
      await loadTunnels();
    } else {
      throw new Error(result.message || "更新隧道配置失败");
    }
  } catch (err) {
    console.error("更新隧道配置失败:", err);
    message.error(err instanceof Error ? err.message : "更新隧道配置失败");
  } finally {
    actionLoading.value[tunnelId] = false;
  }
}

// 保存编辑
const saveEdit = async () => {
  if (!editingTunnel.value) return;

  try {
    await updateTunnel(editingTunnel.value.proxyId, editForm.value);
    showEditModal.value = false;
    editingTunnel.value = null;
  } catch (err) {
    // 错误已在updateTunnel中处理
  }
};

// 取消编辑
const cancelEdit = () => {
  showEditModal.value = false;
  editingTunnel.value = null;
};

// 获取空闲端口（编辑时）
const getFreePortForEdit = async () => {
  if (!editingTunnel.value) return;

  // 检查隧道类型是否支持获取端口
  if (
    !editingTunnel.value.proxyType ||
    (editingTunnel.value.proxyType !== "tcp" &&
      editingTunnel.value.proxyType !== "udp")
  ) {
    message.warning("只有TCP和UDP隧道支持获取空闲端口");
    return;
  }

  gettingPortForEdit.value = true;
  try {
    const requestData = {
      nodeId: editingTunnel.value.nodeId,
      protocol: editingTunnel.value.proxyType,
    };

    const responseText = await invoke<string>("api_get_free_port", {
      data: JSON.stringify(requestData),
    });
    const result = JSON.parse(responseText);

    if (result.code === 200 && result.data) {
      editForm.value.remotePort = result.data;
      message.success(`获取到空闲端口: ${result.data}`);
    } else {
      throw new Error(result.message || "获取空闲端口失败");
    }
  } catch (err) {
    console.error("获取空闲端口失败:", err);
    message.error(err instanceof Error ? err.message : "获取空闲端口失败");
  } finally {
    gettingPortForEdit.value = false;
  }
};

// 配置文件相关
const showConfigModal = ref(false);
const currentConfigTunnelId = ref<number | null>(null);
const configTypes = ["toml", "json", "yml", "ini"];
const activeConfigType = ref("toml");
const configContents = ref<Record<string, string>>({});
const editableConfigContents = ref<Record<string, string>>({});
const loadingConfig = ref(false);
const usingConfigFile = ref<number[]>([]);
const isEditingConfig = ref(false);

// 获取隧道配置文件
async function getTunnelConfig(tunnelId: number, format: string) {
  try {
    loadingConfig.value = true;
    const responseText = await invoke("api_get_tunnel_config", {
      proxyId: tunnelId,
      format: format,
    });

    const result = JSON.parse(responseText as string);

    if (result.code === 200 && result.data && result.data.config) {
      return result.data.config;
    } else {
      throw new Error(result.message || "获取配置文件失败");
    }
  } catch (err) {
    console.error("获取配置文件失败:", err);
    message.error(err instanceof Error ? err.message : "获取配置文件失败");
    return null;
  } finally {
    loadingConfig.value = false;
  }
}

// 保存配置文件到本地
async function saveConfigFile(
  tunnelId: number,
  format: string,
  content: string,
) {
  try {
    const fileName = `${tunnelId}.${format}`;
    await invoke("save_config_file", {
      fileName: fileName,
      content: content,
    });
    message.success(`配置文件已保存: ${fileName}，下次启动将使用配置文件模式`);

    // 添加短暂延迟确保文件系统操作完成
    await new Promise(resolve => setTimeout(resolve, 100));

    // 立即刷新配置文件状态以确保与文件系统同步
    await loadConfigFileStatus();

    // 关闭模态框
    showConfigModal.value = false;
  } catch (err) {
    console.error("保存配置文件失败:", err);
    message.error(err instanceof Error ? err.message : "保存配置文件失败");
  }
}

// 改用配置文件
async function useConfigFile(tunnelId: number) {
  currentConfigTunnelId.value = tunnelId;
  configContents.value = {};
  editableConfigContents.value = {};
  isEditingConfig.value = false;
  message.success("正在尝试获取配置文件内容,请等待", { duration: 8000 });

  // 获取所有格式的配置文件
  for (const format of configTypes) {
    const config = await getTunnelConfig(tunnelId, format);
    if (config) {
      configContents.value[format] = config;
      editableConfigContents.value[format] = config;
    }
  }

  if (Object.keys(configContents.value).length > 0) {
    showConfigModal.value = true;
  } else {
    message.error("无法获取配置文件");
  }
}

// 开始编辑配置
function startEditConfig() {
  isEditingConfig.value = true;
}

// 取消编辑配置
function cancelEditConfig() {
  isEditingConfig.value = false;
  // 恢复原始内容
  editableConfigContents.value = { ...configContents.value };
}

// 保存编辑的配置
async function saveEditedConfig() {
  if (!currentConfigTunnelId.value) return;

  try {
    const tunnelId = currentConfigTunnelId.value;
    const format = activeConfigType.value;
    const content = editableConfigContents.value[format];

    if (!content) {
      message.error("配置内容不能为空");
      return;
    }

    await saveConfigFile(tunnelId, format, content);

    // 更新原始内容
    configContents.value[format] = content;
    isEditingConfig.value = false;

    message.success("配置文件修改成功");
  } catch (err) {
    console.error("保存配置失败:", err);
    message.error(err instanceof Error ? err.message : "保存配置失败");
  }
}

// 处理配置文件类型切换
async function handleConfigTypeChange(newType: string) {
  if (!currentConfigTunnelId.value) return;

  const oldType = activeConfigType.value;
  if (oldType === newType) return;

  try {
    // 删除旧的配置文件
    const tunnelId = currentConfigTunnelId.value;
    const oldFileName = `${tunnelId}.${oldType}`;

    await invoke("delete_config_file", { fileName: oldFileName }).catch(() => {
      // 忽略文件不存在的错误
    });

    // 更新活动类型
    activeConfigType.value = newType;

    message.success(`已切换到 ${newType.toUpperCase()} 格式`);
  } catch (err) {
    console.error("切换配置文件类型失败:", err);
    message.error(err instanceof Error ? err.message : "切换配置文件类型失败");
  }
}

// 查看配置文件
async function viewConfigFile(tunnelId: number) {
  await useConfigFile(tunnelId);
}

// 切换到快速启动模式
async function switchToQuickStart(tunnelId: number) {
  try {
    // 删除所有格式的配置文件
    const configFormats = ["toml", "json", "yml", "ini"];
    const deletePromises = configFormats.map((format) => {
      const fileName = `${tunnelId}.${format}`;
      return invoke("delete_config_file", { fileName }).catch(() => {
        // 忽略文件不存在的错误
      });
    });

    await Promise.all(deletePromises);

    // 重新加载配置文件状态以触发响应式更新
    await loadConfigFileStatus();
    message.success("已切换到快速启动模式");
  } catch (err) {
    console.error("切换到快速启动失败:", err);
    message.error(err instanceof Error ? err.message : "切换到快速启动失败");
  }
}

// 获取代码高亮语言
function getLanguageForFormat(format: string): string {
  const languageMap: Record<string, string> = {
    toml: "toml",
    json: "json",
    yml: "yaml",
    ini: "ini",
  };
  return languageMap[format] || "text";
}

// 强制隧道下线
async function kickTunnel(tunnelId: number) {
  try {
    actionLoading.value[tunnelId] = true;
    const responseText = await invoke("api_kick_tunnel", { proxyId: tunnelId });
    const result = JSON.parse(responseText as string);

    if (result.code === 200) {
      message.success("隧道已强制下线");
      await loadRunningTunnels();
    } else {
      throw new Error(result.message || "强制下线失败");
    }
  } catch (err) {
    console.error("强制下线失败:", err);
    message.error(err instanceof Error ? err.message : "强制下线失败");
  } finally {
    actionLoading.value[tunnelId] = false;
  }
}

// 启用/禁用隧道
async function toggleTunnel(tunnelId: number, enable: boolean) {
  try {
    actionLoading.value[tunnelId] = true;
    const responseText = await invoke("api_toggle_tunnel", {
      proxyId: tunnelId,
      isDisabled: !enable,
    });
    const result = JSON.parse(responseText as string);

    if (result.code === 200) {
      message.success(enable ? "隧道已启用" : "隧道已禁用");
      await loadTunnels();
    } else {
      throw new Error(
        result.message || (enable ? "启用隧道失败" : "禁用隧道失败"),
      );
    }
  } catch (err) {
    console.error("切换隧道状态失败:", err);
    message.error(err instanceof Error ? err.message : "切换隧道状态失败");
  } finally {
    actionLoading.value[tunnelId] = false;
  }
}

// 复制远程地址到剪贴板
async function copyRemoteAddress(tunnelId: number) {
  try {
    const tunnel = tunnels.value.find((t) => t.proxyId === tunnelId);
    if (!tunnel) {
      message.error("未找到隧道信息");
      return;
    }

    let remoteAddress: string;

    // HTTP/HTTPS 隧道复制完整 URL，TCP/UDP 隧道复制节点地址:端口
    if (tunnel.proxyType === "http") {
      if (!tunnel.domain) {
        message.error("该隧道未配置域名");
        return;
      }
      remoteAddress = `http://${tunnel.domain}`;
    } else if (tunnel.proxyType === "https") {
      if (!tunnel.domain) {
        message.error("该隧道未配置域名");
        return;
      }
      remoteAddress = `https://${tunnel.domain}`;
    } else {
      // TCP/UDP 隧道
      const nodeAddress = getNodeAddress(tunnelId);
      if (!nodeAddress) {
        message.error("无法获取节点地址");
        return;
      }
      // 构建远程地址格式：nodeAddress:remotePort
      remoteAddress = `${nodeAddress}:${tunnel.remotePort}`;
    }

    // 复制到剪贴板
    if (navigator.clipboard && window.isSecureContext) {
      // 使用现代 Clipboard API
      await navigator.clipboard.writeText(remoteAddress);
    } else {
      // 降级方案：使用传统方法
      const textArea = document.createElement("textarea");
      textArea.value = remoteAddress;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
    }

    message.success(`远程地址已复制: ${remoteAddress}`);
  } catch (err) {
    console.error("复制远程地址失败:", err);
    message.error("复制远程地址失败");
  }
}

function refreshTunnels() {
  loadTunnels();
}

function goToCreateTunnel() {
  emit("go-to-create");
}

function getMoreOptions(tunnelId: number) {
  const tunnel = tunnels.value.find((t) => t.proxyId === tunnelId);

  if (!tunnel) {
    return [
      {
        label: "刷新",
        key: "refresh",
        icon: () => h(NIcon, null, { default: () => h(RefreshCw, { size: 16 }) }),
      },
    ];
  }

  const isUsingConfig = usingConfigFile.value.includes(tunnelId);

  const options: any[] = [
    {
      label: "编辑",
      key: "edit",
      icon: () => h(NIcon, null, { default: () => h(Edit, { size: 16 }) }),
    },
    {
      type: "divider",
      key: "d1",
    },
  ];

  if (isUsingConfig) {
    options.push(
      {
        label: "配置文件",
        key: "view-config",
        icon: () => h(NIcon, null, { default: () => h(FileCode, { size: 16 }) }),
      },
      {
        label: "改用快速启动",
        key: "use-quick-start",
        icon: () => h(NIcon, null, { default: () => h(Rocket, { size: 16 }) }),
      },
    );
  } else {
    options.push({
      label: "改用配置文件",
      key: "use-config",
      icon: () => h(NIcon, null, { default: () => h(FileOutput, { size: 16 }) }),
    });
  }

  options.push(
    {
      type: "divider",
      key: "d2",
    },
    {
      label: tunnel.isDisabled ? "启用隧道" : "禁用隧道",
      key: tunnel.isDisabled ? "enable" : "disable",
      icon: () =>
        h(NIcon, null, {
          default: () => h(tunnel.isDisabled ? PlayCircle : PauseCircle, { size: 16 }),
        }),
    },
    {
      label: "强制下线",
      key: "kick",
      icon: () => h(NIcon, null, { default: () => h(LogOut, { size: 16 }) }),
    },
    {
      type: "divider",
      key: "d3",
    },
    {
      label: "删除隧道",
      key: "delete",
      icon: () =>
        h(NIcon, { style: { color: "#d03050" } }, { default: () => h(Trash2, { size: 16 }) }),
    },
  );

  return options;
}

async function handleMoreAction(action: string, tunnelId: number) {
  const tunnel = tunnels.value.find((t) => t.proxyId === tunnelId);
  
  switch (action) {
    case "edit":
      editTunnel(tunnelId);
      break;
    case "use-config":
      await useConfigFile(tunnelId);
      break;
    case "view-config":
      await viewConfigFile(tunnelId);
      break;
    case "use-quick-start":
      await switchToQuickStart(tunnelId);
      break;
    case "enable":
      // 启用隧道确认
      if (tunnel) {
        dialog.info({
          title: "确认启用",
          content: `确定要启用隧道 "${tunnel.proxyName}" 吗？`,
          positiveText: "确认启用",
          negativeText: "取消",
          onPositiveClick: async () => {
            await toggleTunnel(tunnelId, true);
          },
        });
      }
      break;
    case "disable":
      // 禁用隧道确认
      if (tunnel) {
        dialog.warning({
          title: "确认禁用",
          content: `确定要禁用隧道 "${tunnel.proxyName}" 吗？禁用后将无法启动此隧道。`,
          positiveText: "确认禁用",
          negativeText: "取消",
          onPositiveClick: async () => {
            await toggleTunnel(tunnelId, false);
          },
        });
      }
      break;
    case "kick":
      // 强制下线确认
      if (tunnel) {
        dialog.error({
          title: "确认强制下线",
          content: `确定要强制下线隧道 "${tunnel.proxyName}" 吗？这将立即断开所隧道连接。`,
          positiveText: "确认下线",
          negativeText: "取消",
          onPositiveClick: async () => {
            await kickTunnel(tunnelId);
          },
        });
      }
      break;
    case "delete":
      // 删除隧道确认
      if (tunnel) {
        dialog.error({
          title: "确认删除",
          content: `确定要删除隧道 "${tunnel.proxyName}" 吗？删除后将无法恢复。`,
          positiveText: "确认删除",
          negativeText: "取消",
          onPositiveClick: async () => {
            try {
              const responseText = await invoke("api_delete_tunnel", {
                proxyId: tunnelId,
              });
              const result = JSON.parse(responseText as string);

              if (result.code === 200) {
                message.success("隧道删除成功");
                // 重新加载隧道列表
                await loadTunnels();
                emit("tunnel-delete", tunnelId);
              } else {
                throw new Error(result.message || "删除隧道失败");
              }
            } catch (err) {
              console.error("删除隧道失败:", err);
              message.error(err instanceof Error ? err.message : "删除隧道失败");
            }
          },
        });
      }
      break;
  }
}

// 定时器引用
let statusUpdateTimer: number | null = null;

// 组件挂载时初始化
onMounted(() => {
  loadTunnels();
  loadRunningTunnels();
  
  // 定期更新运行状态
  statusUpdateTimer = window.setInterval(() => {
    loadRunningTunnels();
  }, 5000);
});

// 组件卸载时清理
onUnmounted(() => {
  if (statusUpdateTimer) {
    clearInterval(statusUpdateTimer);
    statusUpdateTimer = null;
  }
});

// 暴露给模板的变量和方法
defineExpose({
  tunnels,
  loading,
  runningTunnels,
  showLogs,
  currentLogs,
  currentTunnelId,
  showDetails,
  currentTunnelDetails,
  showEditModal,
  editingTunnel,
  showConfigModal,
  currentConfigTunnelId,
  configTypes,
  activeConfigType,
  configContents,
  editableConfigContents,
  loadingConfig,
  usingConfigFile,
  isEditingConfig,
  refreshTunnels: loadTunnels,
  startTunnel,
  stopTunnel,
  editTunnel,
  updateTunnel,
  kickTunnel,
  toggleTunnel,
  copyRemoteAddress,
  handleMoreAction,
  viewLogs,
  viewTunnelDetails,
  saveEdit,
  cancelEdit,
  getFreePortForEdit,
  getTunnelConfig,
  saveConfigFile,
  useConfigFile,
  viewConfigFile,
  getLanguageForFormat,
  loadConfigFileStatus,
  switchToQuickStart,
  startEditConfig,
  cancelEditConfig,
  saveEditedConfig,
  handleConfigTypeChange,
});
</script>

<style scoped>
.tunnel-management {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.tunnels-container {
  width: 100%;
  position: relative;
  z-index: 1;
}

.tunnels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
  position: relative;
}

.error-container {
  margin-bottom: 24px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 60px 20px;
  text-align: center;
  color: var(--n-text-color-depth-3);
}

.empty-state h3 {
  margin: 16px 0 8px;
  color: var(--n-text-color-depth-2);
  font-size: 16px;
  font-weight: 500;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--n-text-color-depth-3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tunnels-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    padding: 0 16px;
  }
}

@media (max-width: 480px) {
  .tunnels-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 1200px) {
  .tunnels-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}
</style>

<style>
/* 全局样式 - 确保下拉框正确显示 */
.n-dropdown-menu {
  z-index: 9999 !important;
  box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05) !important;
  min-width: 160px !important;
}

.n-dropdown {
  z-index: 9999 !important;
}

.n-dropdown-option {
  padding: 8px 12px !important;
}
</style>
