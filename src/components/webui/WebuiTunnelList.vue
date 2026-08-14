<template>
  <n-card :bordered="true" class="webui-embed-section">
    <template #header>
      <SectionHeader :icon="Monitor">
        <span>隧道列表</span>
        <n-button
          text
          type="info"
          @click="emit('refresh')"
          :loading="tunnelsLoading"
          style="margin-left: auto"
        >
          <template #icon>
            <RefreshCw :size="18" />
          </template>
        </n-button>
      </SectionHeader>
    </template>

    <!-- 加载状态 -->
    <div v-if="tunnelsLoading && tunnels.length === 0" class="tunnels-loading">
      <n-spin size="large" />
      <p>加载隧道列表中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="tunnelsError" class="tunnels-error">
      <n-alert type="error" :title="tunnelsError" />
      <n-button type="primary" @click="emit('refresh')" style="margin-top: 16px">
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
            <span class="info-value">{{ (tunnel.proxyType || "").toUpperCase() }}</span>
          </div>
          <div
            class="info-row"
            v-if="tunnel.proxyType === 'tcp' || tunnel.proxyType === 'udp'"
          >
            <span class="info-label">远程端口:</span>
            <span class="info-value">{{ tunnel.remotePort ?? "未分配" }}</span>
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
              @click="emit('start', tunnel.proxyId)"
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
              @click="emit('stop', tunnel.proxyId)"
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
</template>

<script setup lang="ts">
import { Monitor, RefreshCw, Play, Square } from "@lucide/vue";
import SectionHeader from "@/components/common/SectionHeader.vue";
import type { Tunnel as TunnelRecord } from "@/types/tunnel";

// 与父组件 MEFrpWebUI.vue 一致的轻量隧道类型
type WebuiTunnel = Pick<
  TunnelRecord,
  "proxyId" | "proxyName" | "proxyType" | "isOnline" | "remotePort" | "nodeId"
>;

defineProps<{
  tunnels: WebuiTunnel[];
  tunnelsLoading: boolean;
  tunnelsError: string;
  tunnelActionLoading: Record<number, boolean>;
}>();

const emit = defineEmits<{
  (e: "refresh"): void;
  (e: "start", proxyId: number): void;
  (e: "stop", proxyId: number): void;
}>();
</script>

<style scoped>
.webui-embed-section {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
}

.tunnels-loading,
.tunnels-error,
.tunnels-empty {
  padding: 32px 0;
  text-align: center;
}

.tunnels-loading p {
  margin-top: 12px;
  color: var(--app-text-color-2);
  font-size: 14px;
}

.tunnels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.tunnel-card {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
}

.tunnel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.tunnel-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tunnel-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.info-label {
  color: var(--app-text-color-2);
  flex-shrink: 0;
}

.info-value {
  color: var(--app-text-color);
  word-break: break-all;
}

.tunnel-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
