<template>
  <n-alert
    v-if="show"
    type="info"
    closable
    @close="$emit('close')"
    style="margin-bottom: 16px"
  >
    <template #icon>
      <LayoutGrid :size="18" />
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
import { LayoutGrid } from '@lucide/vue'
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
