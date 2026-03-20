<template>
  <n-alert
    v-if="show"
    type="info"
    closable
    @close="$emit('close')"
    style="margin-bottom: 16px"
  >
    <template #icon>
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    </template>
    批量操作模式：点击隧道卡片或表格行进行选择，已选择 {{ selectedCount }} 个隧道
    <template v-if="selectedCount > 0">
      <n-button
        text
        type="primary"
        size="small"
        @click="$emit('clear-selection')"
        style="margin-left: 12px"
      >
        清除选择
      </n-button>
      <n-button
        text
        type="primary"
        size="small"
        @click="$emit('select-all')"
        style="margin-left: 8px"
      >
        全选
      </n-button>
    </template>
    <template v-else>
      <n-button
        text
        type="primary"
        size="small"
        @click="$emit('select-all')"
        style="margin-left: 12px"
      >
        全选
      </n-button>
    </template>
  </n-alert>
</template>

<script setup lang="ts">
import { NAlert, NButton } from 'naive-ui';

interface Props {
  show: boolean;
  selectedCount: number;
}

defineProps<Props>();

defineEmits<{
  (e: 'close'): void;
  (e: 'clear-selection'): void;
  (e: 'select-all'): void;
}>();
</script>
