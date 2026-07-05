<template>
  <n-modal :show="show" preset="card" title="隧道详情" style="width: 90%; max-width: 600px"
    @update:show="$emit('update:show', $event)">
    <div v-if="tunnel" class="details-container">
      <n-descriptions :column="2" bordered label-placement="left">
        <n-descriptions-item label="状态">
          <n-tag :type="tunnel.isOnline ? 'success' : 'warning'" size="small" :bordered="false">
            {{ tunnel.isOnline ? "在线" : "离线" }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="协议类型">
          <n-tag :type="protocolTagType" size="small" :bordered="false">
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
                <span v-if="
                  tunnel.proxyType === 'tcp' ||
                  tunnel.proxyType === 'udp'
                ">
                  {{ getNodeAddress(tunnel.proxyId) }}:{{
                    tunnel.remotePort || "未分配"
                  }}
                </span>
              </span>
              <!-- 域名选择下拉框（仅当有多个域名时显示） -->
              <n-select v-if="domainOptions.length > 1" v-model:value="selectedDomain" :options="domainOptions"
                size="small" style="min-width: 200px; margin-left: 8px" placeholder="选择域名" />
            </div>
            <n-button v-if="canGenerateQrCode" size="small" type="primary" @click="showQrCode" style="margin-left: 8px">
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
  <n-modal v-model:show="showQrCodeModal" preset="card" title="二维码快速访问" style="width: 90%; max-width: 420px">
    <div class="qrcode-container">
      <n-alert type="info" :bordered="false" style="margin-bottom: 16px;">
        使用微信或任意浏览器扫码快速访问
      </n-alert>
      <div class="qrcode-center">
        <n-qr-code
          :value="linkAddress"
          :size="240"
          error-level="H"
          type="svg"
          :padding="12"
          color="#000000"
          background-color="#ffffff"
        />
      </div>
      <n-input
        :value="linkAddress"
        readonly
        style="margin-top: 14px;"
      >
        <template #suffix>
          <n-button text @click="copyToClipboard(linkAddress)">复制</n-button>
        </template>
      </n-input>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { NModal, NDescriptions, NDescriptionsItem, NTag, NButton, NAlert, NSelect, NQrCode, useMessage } from "naive-ui";
import { parseDomainArray } from "@/utils/domainUtils";
import type { Tunnel } from "@/types/tunnel";

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
const message = useMessage();

const selectedDomain = ref<string>("");

const protocolTagType = computed(() => {
  if (!props.tunnel) return "default";
  const typeMap: Record<string, "info" | "success" | "warning" | "error"> = {
    tcp: "info",
    udp: "warning",
    http: "success",
    https: "success",
  };
  return typeMap[props.tunnel.proxyType] || "default";
});

const domainOptions = computed(() => {
  if (!props.tunnel || !props.tunnel.domain) return [];

  const domains = parseDomainArray(props.tunnel.domain);
  return domains.map(domain => ({
    label: domain,
    value: domain
  }));
});

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

const linkAddress = computed(() => {
  if (!props.tunnel) return "";

  const tunnel = props.tunnel;
  const domains = parseDomainArray(tunnel.domain);
  const domain = selectedDomain.value || domains[0] || '';

  if (tunnel.proxyType === "tcp") {
    const nodeAddress = getNodeAddress(tunnel.proxyId);
    return `http://${nodeAddress}:${tunnel.remotePort || "未分配"}/`;
  } else if (tunnel.proxyType === "udp") {
    return "";
  } else if (tunnel.proxyType === "http") {
    return domain ? `http://${domain}` : "";
  } else if (tunnel.proxyType === "https") {
    return domain ? `https://${domain}` : "";
  } else {
    return domain;
  }
});

const showQrCode = () => {
  if (!props.tunnel) return;

  if (props.tunnel.proxyType === "udp") {
    return;
  }

  if (!linkAddress.value || linkAddress.value === '') {
    message.error('无法生成二维码：链接地址为空');
    return;
  }

  showQrCodeModal.value = true;
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    message.success("已复制到剪贴板");
  } catch {
    message.error("复制失败");
  }
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

/* 二维码容器 */
.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
}

.qrcode-center {
  padding: 20px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  line-height: 0;
}

/* 响应式 */
@media (max-width: 480px) {
  .qrcode-center {
    padding: 14px;
  }
}
</style>
