<template>
  <div class="tunnel-management">
    <div class="page-header">
      <h2 class="page-title">隧道管理</h2>
      <div class="header-actions">
        <!-- 批量操作模式切换 -->
        <n-button
          v-if="!batchMode"
          @click="enterBatchMode"
        >
          <template #icon>
            <LayoutGrid :size="16" />
          </template>
          批量操作
        </n-button>
        
        <!-- 批量操作按钮组 -->
        <BatchOperationBar
          :batch-mode="batchMode"
          :selected-count="selectedTunnels.size"
          @batch-start="batchStartTunnels"
          @batch-stop="batchStopTunnels"
          @batch-enable="batchEnableTunnels"
          @batch-disable="batchDisableTunnels"
          @batch-kick="batchKickTunnels"
          @batch-delete="batchDeleteTunnels"
          @cancel="exitBatchMode"
        />
        
        <!-- 视图切换 -->
        <n-button-group v-if="!batchMode">
          <n-button
            :type="viewMode === 'grid' ? 'primary' : 'default'"
            @click="viewMode = 'grid'"
          >
            <template #icon>
              <LayoutGrid :size="16" />
            </template>
            卡片
          </n-button>
          <n-button
            :type="viewMode === 'table' ? 'primary' : 'default'"
            @click="viewMode = 'table'"
          >
            <template #icon>
              <List :size="16" />
            </template>
            表格
          </n-button>
        </n-button-group>
        
        <n-button v-if="!batchMode" type="primary" @click="refreshTunnels" :loading="loading">
          <template #icon>
            <RefreshCw :size="16" />
          </template>
          刷新
        </n-button>
      </div>
    </div>
    
    <!-- 批量操作提示 -->
    <BatchOperationAlert
      :show="batchMode"
      :selected-count="selectedTunnels.size"
      @close="exitBatchMode"
      @clear-selection="clearSelection"
      @select-all="selectAll"
    />

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
      <!-- 卡片视图骨架屏 -->
      <div v-if="viewMode === 'grid'" class="tunnels-grid">
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

      <!-- 表格视图骨架屏 -->
      <div v-else class="table-skeleton">
        <n-data-table
          :columns="skeletonTableColumns"
          :data="skeletonTableData"
          :bordered="false"
          :pagination="false"
          :row-key="(row: any) => row.id"
          class="tunnels-table skeleton-table"
        />
      </div>
    </div>

    <!-- 隧道视图 -->
    <Transition name="view-fade" mode="out-in" v-if="!loading && tunnels.length > 0">
      <!-- 卡片网格视图 -->
      <div v-if="viewMode === 'grid'" key="grid" class="tunnels-container">
        <TunnelGridView
          :tunnels="tunnels"
          :batch-mode="batchMode"
          :selected-tunnels="selectedTunnels"
          :node-name-map="nodeNameMap"
          :node-hostname-map="nodeHostnameMap"
          :running-tunnels="runningTunnels"
          :action-loading="actionLoading"
          :using-config-file="usingConfigFile"
          @toggle-selection="toggleTunnelSelection"
          @start="startTunnel"
          @stop="stopTunnel"
          @view-logs="viewLogs"
          @view-details="viewTunnelDetails"
          @copy-address="copyRemoteAddress"
          @more-action="handleMoreAction"
        />
      </div>

      <!-- 表格视图 -->
      <div v-else key="table" class="tunnels-container">
        <n-data-table
          :columns="tableColumns"
          :data="tunnels"
          :bordered="false"
          :single-line="false"
          :pagination="false"
          :row-key="(row: Tunnel) => row.proxyId"
          :row-class-name="getRowClassName"
          :row-props="getRowProps"
          class="tunnels-table"
        />
      </div>
    </Transition>

    <!-- 空状态 -->
    <div v-else-if="!loading && tunnels.length === 0" class="empty-state">
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
import { h, ref, onMounted, onUnmounted, watch, nextTick, computed, shallowRef } from "vue";
import { useMessage, useDialog, NIcon, NDescriptions, NDescriptionsItem, NTag, NButton, NSpace, NDropdown, NDataTable, NSkeleton, NAlert, NPopconfirm } from "naive-ui";
import { invoke } from "@tauri-apps/api/core";
import { executeBatchOperation } from "@/utils/batchOperationHelper";
import { extractErrorMessage } from "@/utils/errorHandler";
import type { Tunnel, EditFormData, ApiResponse, TunnelListData } from "@/types/tunnel";
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
  LayoutGrid,
  List,
  Play,
  Square,
  FileText,
  Copy,
  MoreVertical,
  Info,
} from "lucide-vue-next";

// Import child components
import TunnelCard from "./tunnel/TunnelCard.vue";
import TunnelEditModal from "./tunnel/TunnelEditModal.vue";
import TunnelLogsModal from "./tunnel/TunnelLogsModal.vue";
import TunnelDetailsModal from "./tunnel/TunnelDetailsModal.vue";
import TunnelConfigModal from "./tunnel/TunnelConfigModal.vue";
import TunnelMoreMenu from "./tunnel/TunnelMoreMenu.vue";
import BatchOperationBar from "./tunnel/BatchOperationBar.vue";
import BatchOperationAlert from "./tunnel/BatchOperationAlert.vue";
import TunnelGridView from "./tunnel/TunnelGridView.vue";

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

// 视图模式（从 localStorage 读取，默认为 grid）
const viewMode = ref<'grid' | 'table'>(
  (localStorage.getItem('tunnel-view-mode') as 'grid' | 'table') || 'grid'
);

// 监听视图模式变化，保存到 localStorage
watch(viewMode, (newMode) => {
  localStorage.setItem('tunnel-view-mode', newMode);
});

// 批量操作模式
const batchMode = ref(false);
const selectedTunnels = ref<Set<number>>(new Set());

// 进入批量操作模式
function enterBatchMode() {
  batchMode.value = true;
  selectedTunnels.value.clear();
}

// 退出批量操作模式
function exitBatchMode() {
  batchMode.value = false;
  selectedTunnels.value.clear();
}

// 切换隧道选择状态
function toggleTunnelSelection(tunnelId: number) {
  if (!batchMode.value) return;
  
  if (selectedTunnels.value.has(tunnelId)) {
    selectedTunnels.value.delete(tunnelId);
  } else {
    selectedTunnels.value.add(tunnelId);
  }
  // 触发响应式更新
  selectedTunnels.value = new Set(selectedTunnels.value);
}

// 全选
function selectAll() {
  const allIds = tunnels.value.map(t => t.proxyId);
  selectedTunnels.value = new Set(allIds);
}

// 清除选择
function clearSelection() {
  selectedTunnels.value.clear();
}

// 批量启动
async function batchStartTunnels() {
  const selectedIds = Array.from(selectedTunnels.value);
  
  await executeBatchOperation({
    operationName: '启动',
    ids: selectedIds,
    message,
    executeSingle: async (tunnelId) => {
      const responseText = await invoke("api_start_tunnel", { proxyId: tunnelId });
      const result = JSON.parse(responseText as string);
      return result.code === 200;
    },
    onSuccess: (tunnelId) => {
      const tunnel = tunnels.value.find((t) => t.proxyId === tunnelId);
      if (tunnel) {
        tunnel.isOnline = true;
      }
    },
    onComplete: async () => {
      await loadRunningTunnels();
      exitBatchMode();
    },
  });
}

// 批量停止
async function batchStopTunnels() {
  const selectedIds = Array.from(selectedTunnels.value);
  
  await executeBatchOperation({
    operationName: '停止',
    ids: selectedIds,
    message,
    executeSingle: async (tunnelId) => {
      const responseText = await invoke("api_stop_tunnel", { proxyId: tunnelId });
      const result = JSON.parse(responseText as string);
      return result.code === 200;
    },
    onSuccess: (tunnelId) => {
      const tunnel = tunnels.value.find((t) => t.proxyId === tunnelId);
      if (tunnel) {
        tunnel.isOnline = false;
      }
    },
    onComplete: async () => {
      await loadRunningTunnels();
      exitBatchMode();
    },
  });
}

// 批量启用
async function batchEnableTunnels() {
  const selectedIds = Array.from(selectedTunnels.value);
  
  await executeBatchOperation({
    operationName: '启用',
    ids: selectedIds,
    message,
    executeSingle: async (tunnelId) => {
      const responseText = await invoke("api_toggle_tunnel", {
        proxyId: tunnelId,
        isDisabled: false,
      });
      const result = JSON.parse(responseText as string);
      return result.code === 200;
    },
    onComplete: async () => {
      await loadTunnels();
      exitBatchMode();
    },
  });
}

// 批量禁用
async function batchDisableTunnels() {
  const selectedIds = Array.from(selectedTunnels.value);
  
  await executeBatchOperation({
    operationName: '禁用',
    ids: selectedIds,
    message,
    executeSingle: async (tunnelId) => {
      const responseText = await invoke("api_toggle_tunnel", {
        proxyId: tunnelId,
        isDisabled: true,
      });
      const result = JSON.parse(responseText as string);
      return result.code === 200;
    },
    onComplete: async () => {
      await loadTunnels();
      exitBatchMode();
    },
  });
}

// 批量强制下线
async function batchKickTunnels() {
  const selectedIds = Array.from(selectedTunnels.value);
  
  await executeBatchOperation({
    operationName: '下线',
    ids: selectedIds,
    message,
    executeSingle: async (tunnelId) => {
      const responseText = await invoke("api_kick_tunnel", { proxyId: tunnelId });
      const result = JSON.parse(responseText as string);
      return result.code === 200;
    },
    onSuccess: async (tunnelId) => {
      try {
        await toggleTunnel(tunnelId, true);
      } catch (err) {
        console.error(`自动启用隧道 ${tunnelId} 失败:`, err);
      }
    },
    onComplete: async () => {
      await loadRunningTunnels();
      exitBatchMode();
    },
  });
}

// 批量删除
async function batchDeleteTunnels() {
  const selectedIds = Array.from(selectedTunnels.value);
  
  await executeBatchOperation({
    operationName: '删除',
    ids: selectedIds,
    message,
    executeSingle: async (tunnelId) => {
      const responseText = await invoke("api_delete_tunnel", { proxyId: tunnelId });
      const result = JSON.parse(responseText as string);
      return result.code === 200;
    },
    onComplete: async () => {
      await loadTunnels();
      exitBatchMode();
    },
  });
}

// 响应式数据
const tunnels = ref<Tunnel[]>([]);
const loading = ref(false);
const error = ref("");
const actionLoading = ref<Record<number, boolean>>({});
const nodeNameMap = ref<Record<number, string>>({});
const nodeHostnameMap = ref<Record<number, string>>({});

// 解析域名数组
function parseDomainArray(domain: string): string[] {
  if (!domain) return [];
  try {
    const domains = JSON.parse(domain);
    if (Array.isArray(domains)) return domains;
    return [domain];
  } catch {
    return [domain];
  }
}

// 表格骨架屏列定义（与实际表格列宽完全一致）
const skeletonTableColumns = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '隧道名称', key: 'name', width: 150 },
  { title: '状态', key: 'status', width: 120 },
  { title: '协议', key: 'protocol', width: 80 },
  { title: '节点', key: 'node', width: 150 },
  { title: '本地地址', key: 'local', width: 150 },
  { title: '远程端口/域名', key: 'remote', width: 200 },
  { title: '操作', key: 'actions', width: 280, fixed: 'right' as const },
];

// 表格骨架屏数据
const skeletonTableData = computed(() => 
  Array.from({ length: 8 }, (_, i) => ({
    id: h(NSkeleton, { text: true, width: '50px', height: '22px' }),
    name: h(NSkeleton, { text: true, width: '110px', height: '14px' }),
    status: h(NSpace, { size: 4 }, () => [
      h(NSkeleton, { text: true, width: '45px', height: '22px' }),
      h(NSkeleton, { text: true, width: '45px', height: '22px' }),
    ]),
    protocol: h(NSkeleton, { text: true, width: '50px', height: '22px' }),
    node: h(NSkeleton, { text: true, width: '130px', height: '14px' }),
    local: h(NSkeleton, { text: true, width: '120px', height: '14px' }),
    remote: h(NSkeleton, { text: true, width: '100px', height: '14px' }),
    actions: h(NSpace, { size: 4 }, () => [
      h(NSkeleton, { text: true, width: '60px', height: '28px' }),
      h(NSkeleton, { text: true, width: '60px', height: '28px' }),
      h(NSkeleton, { text: true, width: '40px', height: '28px' }),
    ]),
  }))
);

// 表格行类名
function getRowClassName(row: Tunnel) {
  if (!batchMode.value) return '';
  return selectedTunnels.value.has(row.proxyId) ? 'selected-row' : '';
}

// 表格行属性
function getRowProps(row: Tunnel) {
  if (!batchMode.value) return {};
  return {
    style: 'cursor: pointer;',
    onClick: () => toggleTunnelSelection(row.proxyId)
  };
}

// 表格列定义
const tableColumns = computed(() => [
  {
    title: 'ID',
    key: 'proxyId',
    width: 80,
    render: (row: Tunnel) => h(NTag, { type: 'info', bordered: false, size: 'small' }, { default: () => `#${row.proxyId}` })
  },
  {
    title: '隧道名称',
    key: 'proxyName',
    width: 150,
    ellipsis: { tooltip: true }
  },
  {
    title: '状态',
    key: 'status',
    width: 120,
    render: (row: Tunnel) => h(NSpace, { size: 4 }, () => [
      row.isDisabled ? h(NTag, { type: 'warning', bordered: false, size: 'small' }, { default: () => '已禁用' }) : null,
      h(NTag, { 
        type: row.isOnline ? 'success' : 'default', 
        bordered: false, 
        size: 'small' 
      }, { default: () => row.isOnline ? '在线' : '离线' })
    ])
  },
  {
    title: '协议',
    key: 'proxyType',
    width: 80,
    render: (row: Tunnel) => h(NTag, { bordered: false, size: 'small' }, { default: () => row.proxyType.toUpperCase() })
  },
  {
    title: '节点',
    key: 'nodeId',
    width: 150,
    ellipsis: { tooltip: true },
    render: (row: Tunnel) => `#${row.nodeId} - ${nodeNameMap.value[row.nodeId] || '未知节点'}`
  },
  {
    title: '本地地址',
    key: 'local',
    width: 150,
    render: (row: Tunnel) => `${row.localIp}:${row.localPort}`
  },
  {
    title: '远程端口/域名',
    key: 'remote',
    width: 200,
    render: (row: Tunnel) => {
      if (row.proxyType === 'tcp' || row.proxyType === 'udp') {
        return String(row.remotePort);
      } else if (row.domain) {
        const domains = parseDomainArray(row.domain);
        return h(NSpace, { size: 4, vertical: true }, () => 
          domains.map(domain => h(NTag, { type: 'info', bordered: false, size: 'small' }, { default: () => domain }))
        );
      }
      return '-';
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 280,
    fixed: 'right' as const,
    render: (row: Tunnel) => {
      const isRunning = runningTunnels.value.has(row.proxyId);
      const isLoading = actionLoading.value[row.proxyId] || false;
      
      return h(NSpace, { size: 4 }, () => [
        // 启动/停止按钮
        isRunning 
          ? h(NButton, {
              type: 'warning',
              size: 'small',
              loading: isLoading,
              onClick: () => stopTunnel(row.proxyId)
            }, {
              icon: () => h(NIcon, null, { default: () => h(Square, { size: 14 }) }),
              default: () => '停止'
            })
          : h(NButton, {
              type: 'primary',
              size: 'small',
              loading: isLoading,
              onClick: () => startTunnel(row.proxyId)
            }, {
              icon: () => h(NIcon, null, { default: () => h(Play, { size: 14 }) }),
              default: () => '启动'
            }),
        
        // 日志按钮（仅运行时显示）
        isRunning ? h(NButton, {
          type: 'info',
          size: 'small',
          onClick: () => viewLogs(row.proxyId)
        }, {
          icon: () => h(NIcon, null, { default: () => h(FileText, { size: 14 }) }),
          default: () => '日志'
        }) : null,
        
        // 复制地址按钮
        h(NButton, {
          size: 'small',
          onClick: () => copyRemoteAddress(row.proxyId)
        }, {
          icon: () => h(NIcon, null, { default: () => h(Copy, { size: 14 }) }),
          default: () => '复制地址'
        }),
        
        // 更多操作下拉菜单
        h(TunnelMoreMenu, {
          tunnel: row,
          usingConfigFile: usingConfigFile.value.includes(row.proxyId),
          onSelect: (action: string, tunnelId: number) => handleMoreAction(action, tunnelId)
        })
      ]);
    }
  }
]);

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
let configFileStatusTimer: number | null = null;

async function loadConfigFileStatus() {
  if (configFileStatusTimer) {
    clearTimeout(configFileStatusTimer);
  }
  
  configFileStatusTimer = window.setTimeout(async () => {
    try {
      const tunnelsWithConfig = await invoke("check_tunnel_config_files");
      usingConfigFile.value = tunnelsWithConfig as number[];
    } catch (err) {
      console.error("加载配置文件状态失败:", err);
    }
  }, 100);
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
const runningTunnels = ref<Set<number>>(new Set());

let isLoadingRunningTunnels = false;

const loadRunningTunnels = async () => {
  if (isLoadingRunningTunnels) return;
  
  try {
    isLoadingRunningTunnels = true;
    const running = await invoke("api_get_running_tunnels");
    runningTunnels.value = new Set(running as number[]);
  } catch (error) {
    console.error("获取运行状态失败:", error);
  } finally {
    isLoadingRunningTunnels = false;
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
  if (!tunnel) return "未知";
  
  if (!nodeHostnameMap.value || !nodeHostnameMap.value[tunnel.nodeId]) {
    return "未知";
  }
  
  return nodeHostnameMap.value[tunnel.nodeId];
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
    
    // 处理域名：确保域名已经是 JSON 字符串数组格式（从编辑模态框传来的已经处理过）
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
const usingConfigFile = shallowRef<number[]>([]);
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

    await new Promise(resolve => setTimeout(resolve, 100));
    await loadConfigFileStatus();

    showConfigModal.value = false;
  } catch (err) {
    console.error("保存配置文件失败:", err);
    message.error(err instanceof Error ? err.message : "保存配置文件失败");
    await loadConfigFileStatus();
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
function validateConfigContent(content: string, format: string): boolean {
  if (!content || content.trim() === '') {
    return false;
  }

  try {
    switch (format) {
      case 'json':
        JSON.parse(content);
        break;
      case 'toml':
        if (!content.includes('=') && !content.includes('[')) {
          return false;
        }
        break;
      case 'yml':
      case 'yaml':
        if (!content.includes(':') && !content.includes('-')) {
          return false;
        }
        break;
      case 'ini':
        if (!content.includes('=') && !content.includes('[')) {
          return false;
        }
        break;
    }
    return true;
  } catch {
    return false;
  }
}

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

    if (!validateConfigContent(content, format)) {
      message.error(`配置内容格式无效，请检查 ${format.toUpperCase()} 格式是否正确`);
      return;
    }

    await saveConfigFile(tunnelId, format, content);

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
    const configFormats = ["toml", "json", "yml", "ini"];
    const deletePromises = configFormats.map((format) => {
      const fileName = `${tunnelId}.${format}`;
      return invoke("delete_config_file", { fileName }).catch(() => {});
    });

    await Promise.all(deletePromises);

    await new Promise(resolve => setTimeout(resolve, 100));
    await loadConfigFileStatus();
    message.success("已切换到快速启动模式");
  } catch (err) {
    console.error("切换到快速启动失败:", err);
    message.error(err instanceof Error ? err.message : "切换到快速启动失败");
    await loadConfigFileStatus();
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
      
      // 强制下线后自动启用隧道（因为主控会将隧道标记为禁用）
      try {
        await toggleTunnel(tunnelId, true);
      } catch (err) {
        console.error("自动启用隧道失败:", err);
        // 不影响主流程，只记录错误
      }
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
async function copyRemoteAddress(tunnelId: number, selectedDomain?: string) {
  try {
    const tunnel = tunnels.value.find((t) => t.proxyId === tunnelId);
    if (!tunnel) {
      message.error("未找到隧道信息");
      return;
    }

    let remoteAddress: string;

    // 解析域名（处理 JSON 字符串数组格式）
    const parseDomain = (domain: string): string => {
      if (!domain) return '';
      
      // 如果提供了选中的域名，直接使用
      if (selectedDomain) return selectedDomain;
      
      try {
        const domains = JSON.parse(domain);
        if (Array.isArray(domains) && domains.length > 0) {
          return domains[0]; // 返回第一个域名
        }
        return domain;
      } catch {
        return domain;
      }
    };

    // HTTP/HTTPS 隧道复制完整 URL，TCP/UDP 隧道复制节点地址:端口
    if (tunnel.proxyType === "http") {
      if (!tunnel.domain) {
        message.error("该隧道未配置域名");
        return;
      }
      const domain = parseDomain(tunnel.domain);
      remoteAddress = `http://${domain}`;
    } else if (tunnel.proxyType === "https") {
      if (!tunnel.domain) {
        message.error("该隧道未配置域名");
        return;
      }
      const domain = parseDomain(tunnel.domain);
      remoteAddress = `https://${domain}`;
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

async function handleMoreAction(action: string, tunnelId: number) {
  const tunnel = tunnels.value.find((t) => t.proxyId === tunnelId);
  
  switch (action) {
    case "view-details":
      viewTunnelDetails(tunnelId);
      break;
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
                delete actionLoading.value[tunnelId];
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
  actionLoading.value = {};
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
  batchStartTunnels,
  batchStopTunnels,
  batchEnableTunnels,
  batchDisableTunnels,
  batchKickTunnels,
  batchDeleteTunnels,
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

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
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

/* 卡片网格布局 */
.tunnels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

/* 视图切换动画 */
.view-fade-enter-active,
.view-fade-leave-active {
  transition: all 0.3s ease;
}

.view-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.view-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.tunnels-table {
  background: var(--app-card-color);
  border-radius: 0px;
  border: 1px solid var(--app-border-color);
  overflow: hidden;
}

.tunnels-table :deep(.n-data-table) {
  background: var(--app-card-color);
}

.tunnels-table :deep(.n-data-table-th) {
  background: var(--app-card-color);
  font-weight: 600;
  border: none;
  border-bottom: 2px solid var(--app-divider-color);
}

.tunnels-table :deep(.n-data-table-td) {
  background: var(--app-bg-color);
  border: none;
}

.tunnels-table :deep(.n-data-table-tr) {
  border: none;
}

.tunnels-table :deep(.n-data-table-tr:hover .n-data-table-td) {
  background: var(--app-bg-color);
}

/* 暗色模式下增加亮度 */
html[data-theme="dark"] .tunnels-table :deep(.n-data-table-tr:hover .n-data-table-td) {
  filter: brightness(1.15);
}

/* 浅色模式下降低亮度 */
html[data-theme="light"] .tunnels-table :deep(.n-data-table-tr:hover .n-data-table-td) {
  filter: brightness(0.96);
}

/* 批量模式表格行样式 */
.tunnels-table :deep(.n-data-table-tr.selected-row .n-data-table-td) {
  background: rgba(24, 160, 88, 0.1) !important;
}

.tunnels-table :deep(.n-data-table-tr.selected-row:hover .n-data-table-td) {
  background: rgba(24, 160, 88, 0.15) !important;
  filter: none;
}

.tunnels-table :deep(.n-data-table-tbody .n-data-table-tr:not(:last-child) .n-data-table-td) {
  border-bottom: 1px solid var(--app-divider-color);
}

/* 表格骨架屏样式 */
.table-skeleton {
  width: 100%;
}

.skeleton-table :deep(.n-data-table-td) {
  padding: 12px 16px;
}

.skeleton-table :deep(.n-skeleton) {
  display: inline-block;
}

/* 表格中的下拉菜单样式 - 与卡片视图保持一致 */
.tunnels-table :deep(.n-dropdown-menu) {
  background-color: var(--app-card-color);
  border-radius: 3px;
  box-shadow: var(--app-box-shadow-2);
  border: 1px solid var(--app-border-color);
  padding: 2px 0;
  min-width: 130px;
}

.tunnels-table :deep(.n-dropdown-option) {
  padding: 6px 10px;
  font-size: 13px;
  color: var(--app-text-color);
}

.tunnels-table :deep(.n-dropdown-option:hover) {
  background-color: var(--app-card-color);
  filter: brightness(1.1);
}

.tunnels-table :deep(.n-dropdown-divider) {
  height: 1px;
  background-color: var(--app-divider-color);
  margin: 4px 0;
}

.tunnels-table :deep(.n-dropdown-option-body__prefix) {
  margin-right: 8px;
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
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    padding: 0 16px;
  }
  
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .header-actions > * {
    width: 100%;
  }
  
  .tunnels-grid {
    grid-template-columns: 1fr;
    gap: 16px;
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
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}
</style>

<style>
/* 全局样式 - 确保下拉框正确显示并与卡片视图样式一致 */
.n-dropdown-menu {
  z-index: 9999 !important;
  background-color: var(--app-card-color) !important;
  border-radius: 3px !important;
  box-shadow: var(--app-box-shadow-2) !important;
  border: 1px solid var(--app-border-color) !important;
  padding: 2px 0 !important;
  min-width: 130px !important;
}

.n-dropdown {
  z-index: 9999 !important;
}

.n-dropdown-option {
  padding: 6px 10px !important;
  font-size: 13px !important;
}

.n-dropdown-option:not(.n-dropdown-option--disabled):hover {
  background-color: var(--app-card-color) !important;
  filter: brightness(1.1) !important;
}

.n-dropdown-divider {
  height: 1px !important;
  background-color: var(--app-divider-color) !important;
  margin: 2px 0 !important;
}

.n-dropdown-option-body__prefix {
  margin-right: 6px !important;
}
</style>
