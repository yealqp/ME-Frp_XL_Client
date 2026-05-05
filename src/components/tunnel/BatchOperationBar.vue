<template>
  <template v-if="batchMode">
    <n-popconfirm
      v-for="action in batchActions"
      :key="action.event"
      :show-icon="false"
      positive-text="确认"
      negative-text="取消"
      @positive-click="$emit(action.event as any)"
    >
      <template #trigger>
        <n-button
          :type="action.type"
          :disabled="selectedCount === 0"
        >
          <template #icon>
            <component :is="action.icon" :size="16" />
          </template>
          {{ action.label }} ({{ selectedCount }})
        </n-button>
      </template>
      {{ getConfirmText(action) }}
    </n-popconfirm>

    <n-button @click="$emit('cancel')">
      取消
    </n-button>
  </template>
</template>

<script setup lang="ts">
import { NButton, NPopconfirm } from 'naive-ui';
import { Play, Square, PlayCircle, PauseCircle, LogOut, Trash2 } from 'lucide-vue-next';
import type { Component } from 'vue';

interface BatchAction {
  event: string;
  type: 'primary' | 'warning' | 'info' | 'error';
  icon: Component;
  label: string;
  confirmText: string;
}

const batchActions: BatchAction[] = [
  { event: 'batch-start', type: 'primary', icon: Play, label: '启动', confirmText: '确定要启动选中的 {selectedCount} 个隧道吗？' },
  { event: 'batch-stop', type: 'warning', icon: Square, label: '停止', confirmText: '确定要停止选中的 {selectedCount} 个隧道吗？' },
  { event: 'batch-enable', type: 'info', icon: PlayCircle, label: '启用', confirmText: '确定要启用选中的 {selectedCount} 个隧道吗？' },
  { event: 'batch-disable', type: 'warning', icon: PauseCircle, label: '禁用', confirmText: '确定要禁用选中的 {selectedCount} 个隧道吗？禁用后将无法启动这些隧道。' },
  { event: 'batch-kick', type: 'error', icon: LogOut, label: '下线', confirmText: '确定要强制下线选中的 {selectedCount} 个隧道吗？这将立即断开所有连接。' },
  { event: 'batch-delete', type: 'error', icon: Trash2, label: '删除', confirmText: '确定要删除选中的 {selectedCount} 个隧道吗？删除后将无法恢复。' },
];

const props = defineProps<{
  batchMode: boolean;
  selectedCount: number;
}>();

defineEmits<{
  (e: 'batch-start'): void;
  (e: 'batch-stop'): void;
  (e: 'batch-enable'): void;
  (e: 'batch-disable'): void;
  (e: 'batch-kick'): void;
  (e: 'batch-delete'): void;
  (e: 'cancel'): void;
}>();

function getConfirmText(action: BatchAction): string {
  return action.confirmText.replace('{selectedCount}', String(props.selectedCount));
}
</script>
