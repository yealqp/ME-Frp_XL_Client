<template>
  <n-card title="平台统计" :bordered="true" class="statistics-card">
    <template v-if="loading">
      <div class="stats-grid">
        <div v-for="i in 4" :key="i" class="stat-item">
          <n-skeleton text :repeat="2" style="width: 100%" />
        </div>
      </div>
    </template>
    <template v-else>
      <div class="stats-grid">
        <!-- 用户数量 -->
        <div class="stat-item">
          <div class="stat-icon">
            <n-icon size="24" :component="Users" color="var(--app-primary-color)" />
          </div>
          <div class="stat-content">
            <n-text depth="3" class="stat-label">用户数量</n-text>
            <n-text strong class="stat-value">{{ formatNumber(statistics.users) }}</n-text>
          </div>
        </div>

        <!-- 节点数量 -->
        <div class="stat-item">
          <div class="stat-icon">
            <n-icon size="24" :component="Server" color="var(--app-success-color)" />
          </div>
          <div class="stat-content">
            <n-text depth="3" class="stat-label">节点数量</n-text>
            <n-text strong class="stat-value">{{ formatNumber(statistics.nodes) }}</n-text>
          </div>
        </div>

        <!-- 隧道数量 -->
        <div class="stat-item">
          <div class="stat-icon">
            <n-icon size="24" :component="Network" color="var(--app-warning-color)" />
          </div>
          <div class="stat-content">
            <n-text depth="3" class="stat-label">隧道数量</n-text>
            <n-text strong class="stat-value">{{ formatNumber(statistics.proxies) }}</n-text>
          </div>
        </div>

        <!-- 已承载流量 -->
        <div class="stat-item">
          <div class="stat-icon">
            <n-icon size="24" :component="HardDrive" color="var(--app-info-color)" />
          </div>
          <div class="stat-content">
            <n-text depth="3" class="stat-label">已承载流量</n-text>
            <n-text strong class="stat-value">{{ formatTrafficInTB(statistics.traffic) }}</n-text>
          </div>
        </div>
      </div>
    </template>
  </n-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NCard, NSkeleton, NText, NIcon, useMessage } from 'naive-ui';
import { Users, Server, Network, HardDrive } from 'lucide-vue-next';
import { invoke } from '@tauri-apps/api/core';

interface Statistics {
  users: number;
  nodes: number;
  proxies: number;
  traffic: number;
}

const statistics = ref<Statistics>({
  users: 0,
  nodes: 0,
  proxies: 0,
  traffic: 0,
});

const loading = ref(true);
const message = useMessage();

// 格式化数字（添加千位分隔符）
const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-CN');
};

// 格式化流量（以 TB 为单位）
const formatTrafficInTB = (value: number): string => {
  // value 是字节数，转换为 TB
  const tb = value / (1024 * 1024 * 1024 * 1024);
  return `${tb.toFixed(2)} TB`;
};

// 获取统计信息
const fetchStatistics = async () => {
  loading.value = true;
  try {
    const responseText = await invoke('api_get_statistics');
    const result = JSON.parse(responseText as string);

    if (result.code === 200 && result.data) {
      statistics.value = {
        users: result.data.users || 0,
        nodes: result.data.nodes || 0,
        proxies: result.data.proxies || 0,
        traffic: result.data.traffic || 0,
      };
      console.log('获取统计信息成功:', statistics.value);
    } else {
      console.error('获取统计信息失败:', result.message);
      message.error(`获取统计信息失败: ${result.message || '未知错误'}`);
    }
  } catch (error) {
    console.error('获取统计信息失败:', error);
    const errorMessage = error && typeof error === 'string' ? error : '请检查网络连接';
    message.error(`获取统计信息失败: ${errorMessage}`);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStatistics();
});
</script>

<style scoped>
.statistics-card {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
  width: 100%;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-item {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: var(--app-card-color);
  border-color: var(--app-primary-color);
  transform: translateY(-2px);
  box-shadow: var(--app-box-shadow-1);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.7;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
