<template>
  <n-dropdown
    :options="menuOptions"
    :show-arrow="false"
    placement="bottom-end"
    @select="handleSelect"
  >
    <slot>
      <n-button size="small">
        <template #icon>
          <MoreVertical :size="14" />
        </template>
      </n-button>
    </slot>
  </n-dropdown>
</template>

<script setup lang="ts">
import { h, computed } from 'vue';
import { NDropdown, NButton, NIcon } from 'naive-ui';
import {
  MoreVertical,
  Info,
  Edit,
  FileCode,
  Rocket,
  FileOutput,
  PlayCircle,
  PauseCircle,
  LogOut,
  Trash2,
} from 'lucide-vue-next';
import type { Tunnel as TunnelRecord } from '@/types/tunnel';

type Tunnel = Pick<TunnelRecord, 'proxyId' | 'proxyName' | 'isDisabled'>

interface Props {
  tunnel: Tunnel;
  usingConfigFile: boolean;
}

interface Emits {
  (e: 'select', action: string, tunnelId: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 菜单选项
const menuOptions = computed(() => {
  const options: any[] = [
    {
      label: '详情',
      key: 'view-details',
      icon: () => h(NIcon, null, { default: () => h(Info, { size: 16 }) }),
    },
    {
      label: '编辑',
      key: 'edit',
      icon: () => h(NIcon, null, { default: () => h(Edit, { size: 16 }) }),
    },
    {
      type: 'divider',
      key: 'd1',
    },
  ];

  if (props.usingConfigFile) {
    options.push(
      {
        label: '配置文件',
        key: 'view-config',
        icon: () => h(NIcon, null, { default: () => h(FileCode, { size: 16 }) }),
      },
      {
        label: '改用快速启动',
        key: 'use-quick-start',
        icon: () => h(NIcon, null, { default: () => h(Rocket, { size: 16 }) }),
      }
    );
  } else {
    options.push({
      label: '改用配置文件',
      key: 'use-config',
      icon: () => h(NIcon, null, { default: () => h(FileOutput, { size: 16 }) }),
    });
  }

  options.push(
    {
      type: 'divider',
      key: 'd2',
    },
    {
      label: props.tunnel.isDisabled ? '启用隧道' : '禁用隧道',
      key: props.tunnel.isDisabled ? 'enable' : 'disable',
      icon: () =>
        h(NIcon, null, {
          default: () => h(props.tunnel.isDisabled ? PlayCircle : PauseCircle, { size: 16 }),
        }),
    },
    {
      label: '强制下线',
      key: 'kick',
      icon: () => h(NIcon, null, { default: () => h(LogOut, { size: 16 }) }),
    },
    {
      type: 'divider',
      key: 'd3',
    },
    {
      label: '删除隧道',
      key: 'delete',
      icon: () =>
        h(NIcon, { style: { color: 'var(--app-error-color)' } }, { default: () => h(Trash2, { size: 16 }) }),
    }
  );

  return options;
});

// 处理选择
const handleSelect = (key: string) => {
  emit('select', key, props.tunnel.proxyId);
};
</script>

<style scoped>
/* 组件内部不需要额外样式，使用全局样式 */
</style>
