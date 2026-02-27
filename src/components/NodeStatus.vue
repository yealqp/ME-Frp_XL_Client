<template>
  <div class="node-status-container">
    <n-space vertical :size="24">
      <!-- 页面标题和操作栏 -->
      <div class="header-bar">
        <h2 class="page-title">节点监控</h2>
        <n-space :size="12" align="center">
          <n-checkbox v-model:checked="filterOnlineOnly">仅在线</n-checkbox>
          <n-checkbox v-model:checked="filterNotOverloaded">未过载</n-checkbox>
          <n-input
            v-model:value="searchKeyword"
            placeholder="搜索节点名称或ID..."
            clearable
            style="width: 200px"
          >
            <template #prefix>
              <n-icon :component="Search" />
            </template>
          </n-input>
          <n-button @click="refreshData" :loading="loading" size="small">
            <template #icon>
              <n-icon :component="RefreshCw" />
            </template>
            刷新
          </n-button>
        </n-space>
      </div>

      <!-- 顶部统计卡片 -->
      <n-card>
        <n-space :size="24" justify="space-around">
          <n-statistic label="在线节点">
            <template #default>
              {{ onlineNodes }} / {{ totalNodes }}
            </template>
          </n-statistic>
          <n-statistic label="在线用户" :value="totalOnlineUsers" />
          <n-statistic label="在线隧道" :value="totalOnlineProxies" />
          <n-statistic label="今日入站流量">
            <template #default>
              {{ formatBytes(totalTrafficIn) }}
            </template>
          </n-statistic>
          <n-statistic label="今日出站流量">
            <template #default>
              {{ formatBytes(totalTrafficOut) }}
            </template>
          </n-statistic>
        </n-space>
      </n-card>

      <!-- 节点列表表格 -->
      <n-card title="节点列表">
        <n-data-table
          :columns="columns"
          :data="nodeData"
          :loading="loading"
          :pagination="false"
          :bordered="false"
        />
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, computed } from 'vue';
import { NTag, NProgress, NSpace, NIcon, NStatistic, NDataTable } from 'naive-ui';
import { ArrowDown, ArrowUp, Search, RefreshCw } from 'lucide-vue-next';
import { useNodeStore } from '../stores/node';
import type { NodeStatusData } from '../stores/node';

const nodeStore = useNodeStore();

// 计算属性从 store 获取
const loading = computed(() => nodeStore.loading);
const nodeData = computed(() => nodeStore.filteredNodes);
const searchKeyword = computed({
  get: () => nodeStore.searchKeyword,
  set: (value) => nodeStore.setSearchKeyword(value)
});
const filterOnlineOnly = computed({
  get: () => nodeStore.filterOnlineOnly,
  set: (value) => nodeStore.setFilterOnlineOnly(value)
});
const filterNotOverloaded = computed({
  get: () => nodeStore.filterNotOverloaded,
  set: (value) => nodeStore.setFilterNotOverloaded(value)
});

// 统计数据
const totalNodes = computed(() => nodeStore.totalNodes);
const onlineNodes = computed(() => nodeStore.onlineNodes);
const totalOnlineUsers = computed(() => nodeStore.totalOnlineUsers);
const totalOnlineProxies = computed(() => nodeStore.totalOnlineProxies);
const totalTrafficIn = computed(() => nodeStore.totalTrafficIn);
const totalTrafficOut = computed(() => nodeStore.totalTrafficOut);

// 格式化字节
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

// 格式化运行时长或离线时长
const formatUptime = (seconds: number, isOnline: boolean): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  let timeStr = '';
  if (days > 0) {
    timeStr = `${days}天${hours}小时${minutes}分钟`;
  } else if (hours > 0) {
    timeStr = `${hours}小时${minutes}分钟`;
  } else {
    timeStr = `${minutes}分钟`;
  }
  
  return isOnline ? `已在线 ${timeStr}` : `${timeStr} 前离线`;
};

// 获取负载百分比类型
const getLoadType = (percent: number): 'success' | 'info' | 'warning' | 'error' => {
  if (percent <= 40) return 'success';
  if (percent <= 60) return 'info';
  if (percent <= 80) return 'warning';
  return 'error';
};

// 表格列配置
const columns = [
  {
    title: '节点',
    key: 'name',
    render: (row: NodeStatusData) => {
      return h(NSpace, { align: 'center', size: 8 }, () => [
        h(NTag, { type: 'info', size: 'medium', bordered: false }, () => `#${row.nodeId}`),
        h('span', row.name)
      ]);
    }
  },
  {
    title: '在线隧道',
    key: 'onlineProxy',
    sorter: (a: NodeStatusData, b: NodeStatusData) => a.onlineProxy - b.onlineProxy
  },
  {
    title: '当前连接',
    key: 'curConns',
    sorter: (a: NodeStatusData, b: NodeStatusData) => a.curConns - b.curConns
  },
  {
    title: '负载百分比',
    key: 'loadPercent',
    render: (row: NodeStatusData) => {
      return h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
        h(NProgress, {
          type: 'line',
          status: getLoadType(row.loadPercent),
          percentage: row.loadPercent,
          showIndicator: false,
          height: 8,
          style: { flex: 1, minWidth: '100px' }
        }),
        h('span', { style: { whiteSpace: 'nowrap', fontSize: '14px' } }, `${row.loadPercent}%`)
      ]);
    },
    sorter: (a: NodeStatusData, b: NodeStatusData) => a.loadPercent - b.loadPercent
  },
  {
    title: '今日流量',
    key: 'traffic',
    render: (row: NodeStatusData) => {
      return h(NSpace, { vertical: true, size: 4 }, () => [
        h(NSpace, { align: 'center', size: 4 }, () => [
          h(ArrowDown, { size: 14, color: '#189f57' }),
          h('span', { style: { color: '#fff' } }, formatBytes(row.totalTrafficIn))
        ]),
        h(NSpace, { align: 'center', size: 4 }, () => [
          h(ArrowUp, { size: 14, color: '#c42e4d' }),
          h('span', { style: { color: '#fff' } }, formatBytes(row.totalTrafficOut))
        ])
      ]);
    }
  },
  {
    title: '版本',
    key: 'version'
  },
  {
    title: '运行时长',
    key: 'uptime',
    render: (row: NodeStatusData) => {
      return h(NTag, {
        type: row.isOnline ? 'success' : 'error',
        size: 'medium',
        bordered: false
      }, () => formatUptime(row.uptime, row.isOnline));
    },
    sorter: (a: NodeStatusData, b: NodeStatusData) => a.uptime - b.uptime
  }
];

// 获取节点状态数据
const fetchNodeStatus = async () => {
  try {
    await nodeStore.fetchNodeStatus();
  } catch (error) {
    console.error('获取节点状态失败:', error);
  }
};

// 刷新数据
const refreshData = async () => {
  await nodeStore.refreshNodeStatus();
};

onMounted(() => {
  fetchNodeStatus();
});
</script>

<style scoped>
.node-status-container {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

/* 节点监控卡片样式 */
.node-status-container :deep(.n-card) {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--app-text-color);
}
</style>
