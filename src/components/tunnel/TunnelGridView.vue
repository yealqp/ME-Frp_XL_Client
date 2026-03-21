<template>
  <div class="tunnels-grid">
    <div
      v-for="tunnel in tunnels"
      :key="tunnel.proxyId"
      :class="['tunnel-card-wrapper', { 
        'batch-mode': batchMode, 
        'selected': selectedTunnels.has(tunnel.proxyId) 
      }]"
      @click="batchMode ? $emit('toggle-selection', tunnel.proxyId) : null"
    >
      <TunnelCard
        :tunnel="tunnel"
        :node-name-map="nodeNameMap"
        :node-hostname-map="nodeHostnameMap"
        :is-running="runningTunnels.has(tunnel.proxyId)"
        :is-loading="actionLoading[tunnel.proxyId] || false"
        :using-config-file="usingConfigFile.includes(tunnel.proxyId)"
        @start="$emit('start', $event)"
        @stop="$emit('stop', $event)"
        @view-logs="$emit('view-logs', $event)"
        @view-details="$emit('view-details', $event)"
        @copy-address="$emit('copy-address', $event)"
        @more-action="$emit('more-action', $event, tunnel.proxyId)"
      />
      <!-- 批量模式蒙层 -->
      <div v-if="batchMode" class="batch-overlay"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import TunnelCard from './TunnelCard.vue';
import type { Tunnel } from '@/types/tunnel';

interface Props {
  tunnels: Tunnel[];
  batchMode: boolean;
  selectedTunnels: Set<number>;
  nodeNameMap: Record<number, string>;
  nodeHostnameMap: Record<number, string>;
  runningTunnels: Set<number>;
  actionLoading: Record<number, boolean>;
  usingConfigFile: number[];
}

const props = defineProps<Props>();

defineEmits<{
  (e: 'toggle-selection', tunnelId: number): void;
  (e: 'start', tunnelId: number): void;
  (e: 'stop', tunnelId: number): void;
  (e: 'view-logs', tunnelId: number): void;
  (e: 'view-details', tunnelId: number): void;
  (e: 'copy-address', tunnelId: number): void;
  (e: 'more-action', action: string, tunnelId: number): void;
}>();
</script>

<style scoped>
.tunnels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  position: relative;
  overflow: visible;
}

/* 批量操作模式样式 */
.tunnel-card-wrapper {
  position: relative;
  transition: all 0.2s ease;
  border-radius: 3px;
  overflow: hidden;
}

.tunnel-card-wrapper.batch-mode {
  cursor: pointer;
}

.tunnel-card-wrapper.batch-mode:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 批量模式蒙层 */
.batch-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  transition: all 0.2s ease;
  pointer-events: auto;
  opacity: 0;
  z-index: 10;
}

.tunnel-card-wrapper.batch-mode .batch-overlay {
  opacity: 1;
}

.tunnel-card-wrapper.batch-mode.selected .batch-overlay {
  background: rgba(24, 160, 88, 0.3);
}

.tunnel-card-wrapper.batch-mode:hover .batch-overlay {
  background: transparent;
}

.tunnel-card-wrapper.batch-mode.selected:hover .batch-overlay {
  background: rgba(24, 160, 88, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
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
