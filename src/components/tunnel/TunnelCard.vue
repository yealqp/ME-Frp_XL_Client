<template>
  <n-card
    :bordered="true"
    class="tunnel-card"
    hoverable
  >
    <!-- 卡片头部 -->
    <template #header>
      <div class="tunnel-header">
        <div class="tunnel-title">
          <h3 class="tunnel-name">{{ tunnel.proxyName }}</h3>
          <div class="status-tags">
            <n-tag
              v-if="tunnel.isDisabled"
              type="warning"
              :bordered="false"
              size="small"
              class="disabled-tag"
            >
              已禁用
            </n-tag>
            <n-tag
              :type="tunnel.isOnline ? 'success' : 'default'"
              :bordered="false"
              size="small"
              class="status-tag"
            >
              {{ tunnel.isOnline ? "在线" : "离线" }}
            </n-tag>
          </div>
        </div>
      </div>
    </template>

    <!-- 卡片内容 -->
    <div class="tunnel-content">
      <div class="tunnel-info">
        <div class="info-row">
          <span class="info-label">ID:</span>
          <n-tag type="info" :bordered="false" size="small">
            # {{ tunnel.proxyId }}
          </n-tag>
        </div>
        <div class="info-row">
          <span class="info-label">协议:</span>
          <span class="info-value">{{
            tunnel.proxyType.toUpperCase()
          }}</span>
        </div>
        <div
          class="info-row"
          v-if="tunnel.proxyType === 'tcp' || tunnel.proxyType === 'udp'"
        >
          <span class="info-label">远程端口:</span>
          <span class="info-value">{{ tunnel.remotePort }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">节点:</span>
          <span class="info-value">
            #{{ tunnel.nodeId }} -
            {{ nodeNameMap[tunnel.nodeId] || "未知节点" }}
          </span>
        </div>
        <div class="info-row" v-if="tunnel.domain">
          <span class="info-label">域名:</span>
          <div class="info-value domain-tags">
            <n-tag
              v-for="(domain, index) in parseDomainArray(tunnel.domain)"
              :key="index"
              type="info"
              :bordered="false"
              size="small"
              class="domain-tag"
            >
              {{ domain }}
            </n-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 卡片底部操作 -->
    <template #action>
      <div class="tunnel-actions">
        <!-- 未启动时：所有按钮在同一行 -->
        <div v-if="!isRunning" class="tunnel-actions-row">
          <n-button
            type="primary"
            size="small"
            @click="emit('start', tunnel.proxyId)"
            :loading="isLoading"
          >
            <template #icon>
              <Play :size="14" />
            </template>
            启动
          </n-button>
          <n-button
            type="default"
            size="small"
            @click="handleCopyAddress"
          >
            <template #icon>
              <Copy :size="14" />
            </template>
            复制地址
          </n-button>
          <tunnel-more-menu
            :tunnel="tunnel"
            :using-config-file="usingConfigFile"
            @select="handleMoreAction"
          >
            <n-button type="default" size="small">
              <template #icon>
                <SettingsIcon :size="14" />
              </template>
              更多
            </n-button>
          </tunnel-more-menu>
        </div>

        <!-- 启动后：第一行3个按钮，第二行更多按钮独占 -->
        <template v-else>
          <div class="tunnel-actions-row">
            <n-button
              type="warning"
              size="small"
              @click="emit('stop', tunnel.proxyId)"
              :loading="isLoading"
            >
              <template #icon>
                <Square :size="14" />
              </template>
              停止
            </n-button>
            <n-button
              type="info"
              size="small"
              @click="emit('view-logs', tunnel.proxyId)"
            >
              <template #icon>
                <FileText :size="14" />
              </template>
              日志
            </n-button>
            <n-button
              type="default"
              size="small"
              @click="handleCopyAddress"
            >
              <template #icon>
                <Copy :size="14" />
              </template>
              复制地址
            </n-button>
          </div>

          <div class="tunnel-actions-row tunnel-actions-row-second">
            <tunnel-more-menu
              :tunnel="tunnel"
              :using-config-file="usingConfigFile"
              @select="handleMoreAction"
            >
              <n-button
                type="default"
                size="small"
                class="more-button-full"
              >
                <template #icon>
                  <SettingsIcon :size="14" />
                </template>
                更多
              </n-button>
            </tunnel-more-menu>
          </div>
        </template>
      </div>
    </template>
  </n-card>
</template>

<script setup lang="ts">
import { h, ref } from "vue";
import { NIcon, useDialog, NRadioGroup, NRadio, NSpace } from "naive-ui";
import {
  Play,
  Square,
  FileText,
  Copy,
  Settings as SettingsIcon,
} from "lucide-vue-next";
import TunnelMoreMenu from "./TunnelMoreMenu.vue";
import type { Tunnel } from "@/types/tunnel";

interface Props {
  tunnel: Tunnel;
  nodeNameMap: Record<number, string>;
  nodeHostnameMap: Record<number, string>;
  isRunning: boolean;
  isLoading: boolean;
  usingConfigFile: boolean;
}

interface Emits {
  (e: 'start', tunnelId: number): void;
  (e: 'stop', tunnelId: number): void;
  (e: 'view-logs', tunnelId: number): void;
  (e: 'view-details', tunnelId: number): void;
  (e: 'copy-address', tunnelId: number, selectedDomain?: string): void;
  (e: 'more-action', action: string, tunnelId: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const dialog = useDialog();

// 解析域名为数组
function parseDomainArray(domain: string): string[] {
  if (!domain) return [];
  
  try {
    // 尝试解析 JSON 字符串数组
    const domains = JSON.parse(domain);
    if (Array.isArray(domains)) {
      return domains;
    }
    // 如果不是数组，返回单个域名的数组
    return [domain];
  } catch {
    // 解析失败，返回单个域名的数组
    return [domain];
  }
}

// 处理复制地址
function handleCopyAddress() {
  // 如果是 HTTP/HTTPS 隧道且有多个域名，显示选择对话框
  if ((props.tunnel.proxyType === 'http' || props.tunnel.proxyType === 'https') && props.tunnel.domain) {
    const domains = parseDomainArray(props.tunnel.domain);
    
    if (domains.length > 1) {
      // 多个域名，显示选择对话框
      const selectedDomain = ref(domains[0]);
      
      dialog.info({
        title: '选择要复制的域名',
        content: () => h(NSpace, { vertical: true, size: 'large', style: 'width: 100%;' }, {
          default: () => [
            h(NRadioGroup, {
              value: selectedDomain.value,
              'onUpdate:value': (value: string) => {
                selectedDomain.value = value;
              }
            }, {
              default: () => h(NSpace, { vertical: true, size: 'medium' }, {
                default: () => domains.map(domain =>
                  h(NRadio, {
                    key: domain,
                    value: domain,
                    style: 'width: 100%;'
                  }, {
                    default: () => h('span', { 
                      style: 'font-family: Consolas, Monaco, monospace; font-size: 13px;' 
                    }, domain)
                  })
                )
              })
            })
          ]
        }),
        positiveText: '复制',
        negativeText: '取消',
        onPositiveClick: () => {
          emit('copy-address', props.tunnel.proxyId, selectedDomain.value);
        }
      });
    } else {
      // 单个域名，直接复制
      emit('copy-address', props.tunnel.proxyId);
    }
  } else {
    // TCP/UDP 隧道，直接复制
    emit('copy-address', props.tunnel.proxyId);
  }
}

// 格式化域名显示（保留用于其他可能的用途）
function formatDomain(domain: string): string {
  if (!domain) return '';
  
  try {
    // 尝试解析 JSON 字符串数组
    const domains = JSON.parse(domain);
    if (Array.isArray(domains)) {
      // 如果是数组，用逗号分隔显示
      return domains.join(', ');
    }
    // 如果不是数组，直接返回原值
    return domain;
  } catch {
    // 解析失败，直接返回原值
    return domain;
  }
}

// 处理更多操作
function handleMoreAction(action: string, tunnelId: number) {
  // 特殊处理详情按钮
  if (action === 'view-details') {
    emit('view-details', tunnelId);
  } else {
    emit('more-action', action, tunnelId);
  }
}
</script>

<style scoped>
/* 确保下拉框不被裁剪 */
.tunnel-card {
  background: var(--app-bg-color);
  border: 1px solid var(--app-border-color);
  overflow: visible !important;
  position: relative;
  z-index: 1;
}

.tunnel-card :deep(.n-card) {
  overflow: visible !important;
}

.tunnel-card :deep(.n-card__content) {
  overflow: visible !important;
}

.tunnel-card :deep(.n-card__action) {
  background: var(--app-card-color);
  border-top: 1px solid var(--app-divider-color);
  overflow: visible !important;
  position: relative;
  z-index: 1;
}

.tunnel-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tunnel-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.status-tags {
  display: flex;
  gap: 8px;
  align-items: center;
}

.disabled-tag {
  background-color: #faad14 !important;
  color: white !important;
}

.status-tag {
  margin-left: 0;
}

.tunnel-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.info-row:has(.domain-tags) {
  align-items: flex-start;
}

.info-label {
  font-size: 12px;
  min-width: 70px;
  color: var(--n-text-color-depth-3);
}

.info-value {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: flex-end;
}

.domain-tags {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.domain-tag {
  font-size: 11px;
  max-width: 100%;
  word-break: break-all;
}

.tunnel-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tunnel-actions-row {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  align-items: center;
}

.tunnel-actions-row-second {
  width: 100%;
  position: relative;
}

.tunnel-actions-row .n-button {
  flex: 1;
  min-width: 80px;
}

.tunnel-actions-row-second .n-button {
  width: 100%;
}

.more-button-full {
  width: 100% !important;
  flex: none !important;
}

.tunnel-actions :deep(.n-button__content) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.tunnel-actions :deep(.n-button__icon) {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
}
/* 响应式设计 */
@media (max-width: 768px) {
  .tunnel-actions {
    flex-direction: column;
  }

  .tunnel-actions-row {
    width: 100%;
  }

  .tunnel-actions-row .n-button {
    flex: none;
  }

  .tunnel-actions-row-second .n-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .info-value {
    justify-content: flex-start;
  }
}
</style>
