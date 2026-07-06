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
          @batch-export-image="exportConnectionImage"
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

    <!-- 加载状态 -->
    <div v-if="loading" class="tunnels-container">
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
    :tunnel-name="currentTunnelName"
    :tunnel-type="currentTunnelType"
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
    @save="saveEdit"
    @cancel="cancelEdit"
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
import { computed } from "vue";
import { NDataTable, NAlert, useMessage } from "naive-ui";
import type { Tunnel } from "@/types/tunnel";
import { useUserStore } from "@/stores/user";
import { useTunnelBatchActions } from "@/composables/useTunnelBatchActions";
import { useTunnelConfigFiles } from "@/composables/useTunnelConfigFiles";
import { useTunnelDialogs } from "@/composables/useTunnelDialogs";
import { useTunnelMoreActions } from "@/composables/useTunnelMoreActions";
import { useTunnelPageState } from "@/composables/useTunnelPageState";
import { useTunnelTableView } from "@/composables/useTunnelTableView";
import {
  RefreshCw,
  Inbox,
  LayoutGrid,
  List,
} from "@lucide/vue";

// Import child components
import TunnelEditModal from "./tunnel/TunnelEditModal.vue";
import TunnelLogsModal from "./tunnel/TunnelLogsModal.vue";
import TunnelDetailsModal from "./tunnel/TunnelDetailsModal.vue";
import TunnelConfigModal from "./tunnel/TunnelConfigModal.vue";
import BatchOperationBar from "./tunnel/BatchOperationBar.vue";
import BatchOperationAlert from "./tunnel/BatchOperationAlert.vue";
import TunnelGridView from "./tunnel/TunnelGridView.vue";

interface Emits {
  (e: "tunnel-start", id: number): void;
  (e: "tunnel-stop", id: number): void;
  (e: "tunnel-delete", id: number): void;
  (e: "go-to-create"): void;
}

const emit = defineEmits<Emits>();
const message = useMessage();

const {
  showConfigModal,
  currentConfigTunnelId,
  configTypes,
  activeConfigType,
  configContents,
  editableConfigContents,
  loadingConfig,
  usingConfigFile,
  isEditingConfig,
  loadConfigFileStatus,
  saveConfigFile,
  useConfigFile,
  startEditConfig,
  cancelEditConfig,
  saveEditedConfig,
  handleConfigTypeChange,
  viewConfigFile,
  switchToQuickStart,
} = useTunnelConfigFiles();

const {
  tunnels,
  loading,
  error,
  nodeNameMap,
  nodeHostnameMap,
  runningTunnels,
  actionLoading,
  viewMode,
  loadTunnels,
  loadRunningTunnels,
  startTunnel,
  stopTunnel,
  handleReload,
  refreshTunnels,
} = useTunnelPageState({
  loadConfigFileStatus,
  onTunnelStart: (id) => emit("tunnel-start", id),
  onTunnelStop: (id) => emit("tunnel-stop", id),
});

const {
  batchMode,
  selectedTunnels,
  enterBatchMode,
  exitBatchMode,
  toggleTunnelSelection,
  selectAll,
  clearSelection,
  batchStartTunnels,
  batchStopTunnels,
  batchEnableTunnels,
  batchDisableTunnels,
  batchKickTunnels,
  batchDeleteTunnels,
} = useTunnelBatchActions({
  tunnels,
  loadTunnels,
  loadRunningTunnels,
});

const userStore = useUserStore();

function exportConnectionImage() {
  const selectedIds = [...selectedTunnels.value];
  if (selectedIds.length === 0) return;

  const lines: string[] = [];
  for (const id of selectedIds) {
    const tunnel = tunnels.value.find(t => t.proxyId === id);
    if (!tunnel) continue;
    const host = nodeHostnameMap.value[tunnel.nodeId] || "未知";
    const addr = tunnel.proxyType === "tcp" || tunnel.proxyType === "udp"
      ? `${host}:${tunnel.remotePort || "未分配"}`
      : host;
    lines.push(`${tunnel.proxyName} - ${addr}`);
  }

  const text = lines.join("\n");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const scale = 4;
  const fontSize = 14;
  const lineHeight = fontSize * 1.8;
  const padding = 24;

  ctx.font = `${fontSize}px "Consolas", "Monaco", monospace`;
  const linesArr = text.split("\n");
  const maxLineWidth = Math.max(...linesArr.map(l => ctx.measureText(l).width));
  const w = Math.ceil(maxLineWidth) + padding * 2;
  const h = linesArr.length * lineHeight + padding * 2;

  canvas.width = w * scale;
  canvas.height = h * scale;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.scale(scale, scale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.font = `${fontSize}px "Consolas", "Monaco", monospace`;
  ctx.fillStyle = "#1e1e1e";
  ctx.textBaseline = "top";

  for (let i = 0; i < linesArr.length; i++) {
    ctx.fillText(linesArr[i], padding, padding + i * lineHeight);
  }

  // 右下角 ID 溯源
  const userId = userStore.userInfo?.userId ?? 0;
  const watermarkText = `${userId}`;
  ctx.save();
  // 斜体水印 — 仅提高对比度可见
  ctx.font = `italic 12px "Consolas", "Monaco", monospace`;
  ctx.fillStyle = "rgba(0, 0, 0, 0.005)";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const step = 25;
  for (let y = step; y < h; y += step) {
    for (let x = 0; x < w; x += step * 3) {
      ctx.save();
      ctx.translate(x + step, y);
      ctx.rotate(-0.5);
      ctx.fillText(watermarkText, 0, 0);
      ctx.restore();
    }
  }
  ctx.restore();

  canvas.toBlob(async (blob) => {
    if (!blob) return;
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const { writeFile } = await import("@tauri-apps/plugin-fs");
      const path = await save({
        defaultPath: `tunnels-${new Date().toISOString().slice(0, 10)}.png`,
        filters: [{ name: "PNG 图片", extensions: ["png"] }],
      });
      if (path) {
        await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
        message.success("连接信息图片保存成功");
      }
    } catch {
      // 回退：浏览器下载
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tunnels-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
  });
}

const {
  showLogs,
  currentLogs,
  currentTunnelId,
  loadingLogs,
  showDetails,
  currentTunnelDetails,
  showEditModal,
  editingTunnel,
  viewLogs,
  viewTunnelDetails,
  editTunnel,
  saveEdit,
  cancelEdit,
} = useTunnelDialogs({
  tunnels,
  runningTunnels,
});

const currentTunnelName = computed(() => {
  if (currentTunnelId.value == null) return undefined;
  const t = tunnels.value.find(item => item.proxyId === currentTunnelId.value);
  return t?.proxyName;
});

const currentTunnelType = computed(() => {
  if (currentTunnelId.value == null) return undefined;
  const t = tunnels.value.find(item => item.proxyId === currentTunnelId.value);
  return t?.proxyType;
});

const {
  copyRemoteAddress,
  handleMoreAction,
} = useTunnelMoreActions({
  tunnels,
  nodeHostnameMap,
  onViewDetails: viewTunnelDetails,
  onEditTunnel: editTunnel,
  onUseConfigFile: useConfigFile,
  onViewConfigFile: viewConfigFile,
  onSwitchToQuickStart: switchToQuickStart,
  onDeleteSuccess: (tunnelId) => emit("tunnel-delete", tunnelId),
});

const {
  skeletonTableColumns,
  skeletonTableData,
  getRowClassName,
  getRowProps,
  tableColumns,
} = useTunnelTableView({
  batchMode,
  selectedTunnels,
  nodeNameMap,
  runningTunnels,
  actionLoading,
  usingConfigFile,
  onToggleSelection: toggleTunnelSelection,
  onStart: startTunnel,
  onStop: stopTunnel,
  onViewLogs: viewLogs,
  onCopyAddress: copyRemoteAddress,
  onMoreAction: handleMoreAction,
});

function goToCreateTunnel() {
  emit("go-to-create");
}
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
  color: var(--app-text-color);
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
