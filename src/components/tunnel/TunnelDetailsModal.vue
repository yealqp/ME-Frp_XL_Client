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
          <div class="link-container">
            <div class="link-content">
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
              </span>
              <!-- 域名选择下拉框（仅当有多个域名时显示） -->
              <n-select
                v-if="domainOptions.length > 1"
                v-model:value="selectedDomain"
                :options="domainOptions"
                size="small"
                style="min-width: 200px; margin-left: 8px"
                placeholder="选择域名"
              />
            </div>
            <n-button
              v-if="canGenerateQrCode"
              size="small"
              type="primary"
              @click="showQrCode"
              style="margin-left: 8px"
            >
              生成二维码
            </n-button>
          </div>
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

  <!-- 二维码模态框 -->
  <n-modal
    v-model:show="showQrCodeModal"
    preset="card"
    title="二维码快速访问"
    style="width: 90%; max-width: 450px"
  >
    <div class="qrcode-container">
      <div class="qrcode-tip">
        <n-alert type="info" :bordered="false">
          使用微信或任意浏览器扫码快速访问
        </n-alert>
      </div>
      <div class="qrcode-wrapper">
        <QrcodeVue
          :value="linkAddress"
          :size="240"
          level="H"
          render-as="svg"
          :margin="20"
          :dotsOptions="{
            type: 'square',
            color: '#000000'
          }"
          :cornersSquareOptions="{
            type: 'square',
            color: '#000000'
          }"
          :cornersDotOptions="{
            type: 'square',
            color: '#000000'
          }"
          :backgroundOptions="{
            color: '#ffffff'
          }"
        />
      </div>
      <div class="qrcode-text">
        {{ linkAddress }}
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { NModal, NDescriptions, NDescriptionsItem, NTag, NButton, NAlert, NSelect } from "naive-ui";
import QrcodeVue from "qrcode-vue3";

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

// 选中的域名
const selectedDomain = ref<string>("");

// 格式化域名显示（解析 JSON 字符串数组）
function formatDomain(domain: string): string {
  if (!domain) return '未配置域名';
  
  try {
    // 尝试解析 JSON 字符串数组
    const domains = JSON.parse(domain);
    if (Array.isArray(domains) && domains.length > 0) {
      // 返回第一个域名
      return domains[0];
    }
    // 如果不是数组，直接返回原值
    return domain;
  } catch {
    // 解析失败，直接返回原值
    return domain;
  }
}

// 解析域名数组
function parseDomainArray(domain: string): string[] {
  if (!domain) return [];
  
  try {
    const domains = JSON.parse(domain);
    if (Array.isArray(domains)) {
      return domains;
    }
    return [domain];
  } catch {
    return [domain];
  }
}

// 域名选项（用于下拉框）
const domainOptions = computed(() => {
  if (!props.tunnel || !props.tunnel.domain) return [];
  
  const domains = parseDomainArray(props.tunnel.domain);
  return domains.map(domain => ({
    label: domain,
    value: domain
  }));
});

// 监听 tunnel 变化，重置选中的域名
watch(
  () => props.tunnel,
  (newTunnel) => {
    if (newTunnel && newTunnel.domain) {
      const domains = parseDomainArray(newTunnel.domain);
      selectedDomain.value = domains[0] || '';
    } else {
      selectedDomain.value = '';
    }
  },
  { immediate: true }
);

// 二维码模态框状态
const showQrCodeModal = ref(false);

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

// 计算链接地址
const linkAddress = computed(() => {
  if (!props.tunnel) return "";
  
  const tunnel = props.tunnel;
  const domain = selectedDomain.value || formatDomain(tunnel.domain);
  
  if (tunnel.proxyType === "tcp") {
    const nodeAddress = getNodeAddress(tunnel.proxyId);
    return `http://${nodeAddress}:${tunnel.remotePort || "未分配"}/`;
  } else if (tunnel.proxyType === "udp") {
    // UDP 不支持生成二维码
    return "";
  } else if (tunnel.proxyType === "http") {
    return `http://${domain}`;
  } else if (tunnel.proxyType === "https") {
    return `https://${domain}`;
  } else {
    return domain;
  }
});

// 显示二维码
const showQrCode = () => {
  if (!props.tunnel) return;
  
  // UDP 不支持生成二维码
  if (props.tunnel.proxyType === "udp") {
    return;
  }
  
  showQrCodeModal.value = true;
};

// 判断是否可以生成二维码
const canGenerateQrCode = computed(() => {
  if (!props.tunnel) return false;
  // UDP 不支持生成二维码
  return props.tunnel.proxyType !== "udp";
});
</script>

<style scoped>
/* 详情模态框样式 */
.details-container {
  padding: 4px 0;
}

.link-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.link-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.link-value {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  color: var(--app-primary-color);
  font-weight: 500;
  word-break: break-all;
  flex-shrink: 0;
}

/* 二维码容器样式 */
.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 24px 20px;
}

.qrcode-tip {
  width: 100%;
  text-align: center;
}

.qrcode-wrapper {
  padding: 0;
  background: #ffffff;
  border-radius: 0;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  width: 280px;
  height: 280px;
  overflow: hidden;
}

/* 修复二维码组件的对齐问题 */
.qrcode-wrapper :deep(svg) {
  display: block;
}

/* 移除内部边框效果 */

.qrcode-text {
  text-align: center;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  color: var(--app-text-color-2);
  font-size: 13px;
  word-break: break-all;
  max-width: 100%;
  line-height: 1.6;
  padding: 12px 16px;
  background: var(--app-card-color);
  border-radius: 8px;
  border: 1px solid var(--app-border-color);
  transition: all 0.3s ease;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .qrcode-container {
    padding: 16px 12px;
    gap: 16px;
  }
  
  .qrcode-wrapper {
    width: 240px;
    height: 240px;
  }
  
  .qrcode-text {
    font-size: 12px;
    padding: 10px 12px;
  }
}
</style>
