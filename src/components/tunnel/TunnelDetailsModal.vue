<template>
  <n-modal
    :show="show"
    preset="card"
    title="隧道详情"
    style="width: 90%; max-width: 600px"
    @update:show="$emit('update:show', $event)"
  >
    <div v-if="tunnel" class="details-container">
      <n-descriptions :column="2" bordered label-placement="left">
        <n-descriptions-item label="状态">
          <n-tag
            :type="tunnel.isOnline ? 'success' : 'default'"
            size="small"
            :bordered="false"
          >
            {{ tunnel.isOnline ? "在线" : "离线" }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="协议类型">
          <n-tag size="small" :bordered="false">
            {{ tunnel.proxyType.toUpperCase() }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="隧道名称" :span="2">
          {{ tunnel.proxyName }}
        </n-descriptions-item>
        <n-descriptions-item label="节点" :span="2">
          #{{ tunnel.nodeId }} - {{ nodeNameMap[tunnel.nodeId] || "未知节点" }}
        </n-descriptions-item>
        <n-descriptions-item label="本地地址">
          {{ tunnel.localIp }}
        </n-descriptions-item>
        <n-descriptions-item label="本地端口">
          {{ tunnel.localPort }}
        </n-descriptions-item>
        <n-descriptions-item label="链接地址" :span="2">
          <span class="link-value">
            <span
              v-if="
                tunnel.proxyType === 'tcp' ||
                tunnel.proxyType === 'udp'
              "
            >
              {{ getNodeAddress(tunnel.proxyId) }}:{{
                tunnel.remotePort || "未分配"
              }}
            </span>
            <span v-else-if="tunnel.proxyType === 'http'">
              http://{{ tunnel.domain || "未配置域名" }}
            </span>
            <span v-else-if="tunnel.proxyType === 'https'">
              https://{{ tunnel.domain || "未配置域名" }}
            </span>
            <span v-else>
              {{ tunnel.domain || "未配置域名" }}
            </span>
          </span>
        </n-descriptions-item>
        <n-descriptions-item label="上次启动">
          {{ formatTimestamp(tunnel.lastStartTime) }}
        </n-descriptions-item>
        <n-descriptions-item label="上次关闭">
          {{ formatTimestamp(tunnel.lastCloseTime) }}
        </n-descriptions-item>
      </n-descriptions>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { NModal, NDescriptions, NDescriptionsItem, NTag } from "naive-ui";

// Tunnel 接口定义
interface Tunnel {
  proxyId: number;
  username: string;
  proxyName: string;
  proxyType: string;
  isBanned: boolean;
  isDisabled: boolean;
  localIp: string;
  localPort: number;
  remotePort: number;
  nodeId: number;
  runId: string;
  isOnline: boolean;
  domain: string;
  lastStartTime: number;
  lastCloseTime: number;
  clientVersion: string;
  proxyProtocolVersion: string;
  useEncryption: boolean;
  useCompression: boolean;
  location: string;
  accessKey: string;
  hostHeaderRewrite: string;
  headerXFromWhere: string;
  httpUser?: string;
  httpPassword?: string;
  crtPath?: string;
  keyPath?: string;
  transportProtocol?: string;
}

// Props 接口
interface Props {
  show: boolean;
  tunnel: Tunnel | null;
  nodeNameMap: Record<number, string>;
  nodeHostnameMap: Record<number, string>;
}

// Emits 接口
interface Emits {
  (e: "update:show", value: boolean): void;
}

const props = defineProps<Props>();
defineEmits<Emits>();

// 格式化时间戳
const formatTimestamp = (timestamp: number): string => {
  if (!timestamp) return "未知";
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// 获取节点地址
const getNodeAddress = (proxyId: number): string => {
  if (props.tunnel && props.nodeHostnameMap[props.tunnel.nodeId]) {
    return props.nodeHostnameMap[props.tunnel.nodeId];
  }
  return "未知";
};
</script>

<style scoped>
/* 详情模态框样式 */
.details-container {
  padding: 4px 0;
}

.link-value {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  color: #4da8f5;
  font-weight: 500;
  word-break: break-all;
}
</style>
