<template>
  <template v-if="batchMode">
    <n-popconfirm
      :show-icon="false"
      positive-text="确认"
      negative-text="取消"
      @positive-click="$emit('batch-start')"
    >
      <template #trigger>
        <n-button
          type="primary"
          :disabled="selectedCount === 0"
        >
          <template #icon>
            <Play :size="16" />
          </template>
          启动 ({{ selectedCount }})
        </n-button>
      </template>
      确定要启动选中的 {{ selectedCount }} 个隧道吗？
    </n-popconfirm>
    
    <n-popconfirm
      :show-icon="false"
      positive-text="确认"
      negative-text="取消"
      @positive-click="$emit('batch-stop')"
    >
      <template #trigger>
        <n-button
          type="warning"
          :disabled="selectedCount === 0"
        >
          <template #icon>
            <Square :size="16" />
          </template>
          停止 ({{ selectedCount }})
        </n-button>
      </template>
      确定要停止选中的 {{ selectedCount }} 个隧道吗？
    </n-popconfirm>
    
    <n-popconfirm
      :show-icon="false"
      positive-text="确认"
      negative-text="取消"
      @positive-click="$emit('batch-enable')"
    >
      <template #trigger>
        <n-button
          type="info"
          :disabled="selectedCount === 0"
        >
          <template #icon>
            <PlayCircle :size="16" />
          </template>
          启用 ({{ selectedCount }})
        </n-button>
      </template>
      确定要启用选中的 {{ selectedCount }} 个隧道吗？
    </n-popconfirm>
    
    <n-popconfirm
      :show-icon="false"
      positive-text="确认"
      negative-text="取消"
      @positive-click="$emit('batch-disable')"
    >
      <template #trigger>
        <n-button
          type="warning"
          :disabled="selectedCount === 0"
        >
          <template #icon>
            <PauseCircle :size="16" />
          </template>
          禁用 ({{ selectedCount }})
        </n-button>
      </template>
      确定要禁用选中的 {{ selectedCount }} 个隧道吗？禁用后将无法启动这些隧道。
    </n-popconfirm>
    
    <n-popconfirm
      :show-icon="false"
      positive-text="确认"
      negative-text="取消"
      @positive-click="$emit('batch-kick')"
    >
      <template #trigger>
        <n-button
          type="error"
          :disabled="selectedCount === 0"
        >
          <template #icon>
            <LogOut :size="16" />
          </template>
          下线 ({{ selectedCount }})
        </n-button>
      </template>
      确定要强制下线选中的 {{ selectedCount }} 个隧道吗？这将立即断开所有连接。
    </n-popconfirm>
    
    <n-popconfirm
      :show-icon="false"
      positive-text="确认"
      negative-text="取消"
      @positive-click="$emit('batch-delete')"
    >
      <template #trigger>
        <n-button
          type="error"
          :disabled="selectedCount === 0"
        >
          <template #icon>
            <Trash2 :size="16" />
          </template>
          删除 ({{ selectedCount }})
        </n-button>
      </template>
      确定要删除选中的 {{ selectedCount }} 个隧道吗？删除后将无法恢复。
    </n-popconfirm>
    
    <n-button @click="$emit('cancel')">
      取消
    </n-button>
  </template>
</template>

<script setup lang="ts">
import { NButton, NPopconfirm } from 'naive-ui';
import { Play, Square, PlayCircle, PauseCircle, LogOut, Trash2 } from 'lucide-vue-next';

interface Props {
  batchMode: boolean;
  selectedCount: number;
}

defineProps<Props>();

defineEmits<{
  (e: 'batch-start'): void;
  (e: 'batch-stop'): void;
  (e: 'batch-enable'): void;
  (e: 'batch-disable'): void;
  (e: 'batch-kick'): void;
  (e: 'batch-delete'): void;
  (e: 'cancel'): void;
}>();
</script>
