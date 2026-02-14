<template>
  <div class="create-tunnel">
    <!-- 步骤 1: 选择节点 -->
    <Transition name="slide-fade" mode="out-in">
      <div v-if="currentStep === 1" key="step1">
        <h2 class="page-title">选择节点</h2>

        <!-- 顶部筛选卡片 -->
        <n-card class="filter-card" :bordered="true">
          <div class="filter-content">
            <n-input
              v-model:value="searchKeyword"
              placeholder="搜索..."
              class="search-input"
              clearable
            />
            <div class="checkbox-group">
              <n-checkbox v-model:checked="showWebsiteNodes">可建站</n-checkbox>
              <n-checkbox v-model:checked="showHighTrafficNodes"
                >大流量</n-checkbox
              >
              <n-checkbox v-model:checked="showUnexpiredNodes"
                >未过载</n-checkbox
              >
              <n-checkbox v-model:checked="showFreeNodes">非VIP</n-checkbox>
            </div>
          </div>
        </n-card>

        <!-- 错误状态 -->
        <div v-if="error" class="error-container">
          <n-alert type="error" :title="error" />
          <n-button type="primary" @click="reloadData" style="margin-top: 16px"
            >重新加载</n-button
          >
        </div>

        <!-- 加载状态 -->
        <div v-else-if="loading" class="nodes-container">
          <n-collapse default-expanded-names="mainland">
            <n-collapse-item title="加载中..." name="mainland">
              <div class="nodes-grid">
                <n-card
                  v-for="i in 6"
                  :key="i"
                  :bordered="true"
                  size="small"
                  class="node-card"
                >
                  <template #header>
                    <div class="node-header">
                      <n-skeleton text width="60" />
                      <n-skeleton text width="120" />
                    </div>
                  </template>
                  <div class="node-content">
                    <n-skeleton text :repeat="2" />
                  </div>
                </n-card>
              </div>
            </n-collapse-item>
          </n-collapse>
        </div>

        <!-- 节点列表 -->
        <div v-else class="nodes-container">
          <n-collapse default-expanded-names="mainland">
            <n-collapse-item
              v-for="(regionNodes, regionKey) in groupedNodes"
              :key="regionKey"
              :title="getRegionTitle(regionKey)"
              :name="regionKey"
              v-show="regionNodes.length > 0"
            >
              <template #header-extra>
                <n-tag size="small" type="info"
                  >{{ regionNodes.length }} 个节点</n-tag
                >
              </template>
              <div class="nodes-grid">
                <n-card
                  v-for="node in regionNodes"
                  :key="node.nodeId"
                  :bordered="true"
                  :hoverable="isNodeSelectable(node)"
                  :class="getNodeCardClass(node)"
                  size="small"
                  @click="selectNode(node)"
                >
                  <template #header>
                    <div class="node-header">
                      <n-tag :bordered="false" type="info" size="small"
                        >#{{ node.nodeId }}</n-tag
                      >
                      <span class="node-name">{{ node.name }}</span>
                    </div>
                  </template>
                  <div class="node-content">
                    <p class="node-description">{{ node.description }}</p>
                    <div class="node-tags-row">
                      <div class="protocol-tags">
                        <n-tag
                          v-for="protocol in node.allowType.split(';')"
                          :key="protocol"
                          :bordered="false"
                          type="success"
                          size="small"
                          class="protocol-tag"
                        >
                          {{ protocol.toUpperCase() }}
                        </n-tag>
                      </div>
                      <n-tag
                        :bordered="false"
                        type="info"
                        size="small"
                        class="bandwidth-tag"
                      >
                        {{ node.bandwidth }}
                      </n-tag>
                    </div>
                    <div class="node-info-row">
                      <span class="load-text"
                        >负载: {{ getNodeLoad(node.nodeId) }}%</span
                      >
                    </div>
                    <n-progress
                      type="line"
                      :percentage="getNodeLoad(node.nodeId)"
                      :color="getLoadColor(getNodeLoad(node.nodeId))"
                      :show-indicator="false"
                      :height="6"
                    />
                  </div>
                  <div
                    v-if="isNodeOverloaded(node.nodeId)"
                    class="node-overlay"
                  ></div>
                  <div
                    v-else-if="isVipRequired(node) && !isUserVip()"
                    class="vip-overlay"
                  ></div>
                  <div
                    v-if="isNodeOverloaded(node.nodeId)"
                    class="error-indicator"
                  >
                    <n-tag type="error" size="small" :bordered="true"
                      >负载过高</n-tag
                    >
                  </div>
                  <div v-else-if="showVipStyle(node)" class="vip-indicator">
                    <n-tag type="warning" size="small" :bordered="true"
                      >VIP专享</n-tag
                    >
                  </div>
                </n-card>
              </div>
            </n-collapse-item>
          </n-collapse>
        </div>

        <!-- 下一步按钮 -->
        <div v-if="selectedNode" class="next-button-container">
          <n-button type="primary" size="large" @click="nextStep"
            >下一步</n-button
          >
        </div>
      </div>

      <!-- 步骤 2: 配置隧道 -->
      <div v-else-if="currentStep === 2 && selectedNode" key="step2">
        <h2 class="page-title">创建隧道</h2>

        <!-- 顶部节点信息卡片 -->
        <n-card class="node-info-card" :bordered="true">
          <div class="node-info-content">
            <div class="node-details">
              <div class="node-header">
                <n-tag :bordered="false" type="info" size="medium"
                  >#{{ selectedNode.nodeId }}</n-tag
                >
                <span class="node-name">{{ selectedNode.name }}</span>
              </div>
              <p class="node-description">{{ selectedNode.description }}</p>
              <div class="node-tags">
                <div class="protocol-tags">
                  <n-tag
                    v-for="protocol in selectedNode.allowType.split(';')"
                    :key="protocol"
                    :bordered="false"
                    type="success"
                    size="small"
                    class="protocol-tag"
                  >
                    {{ protocol.toUpperCase() }}
                  </n-tag>
                </div>
                <n-tag
                  :bordered="false"
                  type="info"
                  size="small"
                  class="bandwidth-tag"
                >
                  {{ selectedNode.bandwidth }}
                </n-tag>
                <n-tag
                  :bordered="false"
                  type="warning"
                  size="small"
                  class="port-range-tag"
                >
                  {{ selectedNode.allowPort }}
                </n-tag>
              </div>
            </div>
            <div class="node-actions">
              <n-button type="default" @click="goBack">
                <template #icon><ArrowLeft :size="16" /></template>
                返回选择
              </n-button>
              <n-button
                type="primary"
                @click="createTunnel"
                :loading="creating"
              >
                <template #icon><Plus :size="16" /></template>
                创建隧道
              </n-button>
            </div>
          </div>
        </n-card>

        <!-- 隧道配置表单 -->
        <n-card class="config-form-card" :bordered="true">
          <template #header><h3>隧道配置</h3></template>
          <n-form
            ref="formRef"
            :model="tunnelForm"
            :rules="formRules"
            label-placement="left"
            label-width="120px"
            class="tunnel-form"
          >
            <n-form-item label="隧道名称" path="name">
              <n-input
                v-model:value="tunnelForm.name"
                placeholder="请输入隧道名称"
              />
            </n-form-item>
            <n-form-item label="本地地址" path="localIp">
              <n-input
                v-model:value="tunnelForm.localIp"
                placeholder="127.0.0.1"
              />
            </n-form-item>
            <n-form-item label="本地端口" path="localPort">
              <n-input-number
                v-model:value="tunnelForm.localPort"
                :min="1"
                :max="65535"
                placeholder="请输入本地端口"
                style="width: 100%"
              />
            </n-form-item>
            <n-form-item label="隧道类型" path="type">
              <n-select
                v-model:value="tunnelForm.type"
                :options="tunnelTypeOptions"
                placeholder="请选择隧道类型"
              />
            </n-form-item>
            <n-form-item 
              label="远程端口" 
              path="remotePort"
              v-if="tunnelForm.type === 'tcp' || tunnelForm.type === 'udp'"
            >
              <div style="display: flex; gap: 8px; width: 100%">
                <n-input-number
                  v-model:value="tunnelForm.remotePort"
                  :min="1"
                  :max="65535"
                  placeholder="请输入远程端口"
                  style="flex: 1"
                />
                <n-button
                  type="primary"
                  @click="getFreePort"
                  :loading="gettingPort"
                >
                  获取空闲端口
                </n-button>
              </div>
            </n-form-item>
            <n-form-item
              label="域名"
              path="customDomain"
              v-if="tunnelForm.type === 'http' || tunnelForm.type === 'https'"
            >
              <n-input
                v-model:value="tunnelForm.customDomain"
                placeholder="例如: example.com 或 subdomain.example.com"
              />
            </n-form-item>
            <n-form-item
              label="路径路由"
              path="locations"
              v-if="tunnelForm.type === 'http' || tunnelForm.type === 'https'"
            >
              <n-input
                v-model:value="tunnelForm.locations"
                placeholder="多个路径以逗号分隔，例如: /api,/admin"
              />
            </n-form-item>
            <n-divider title-placement="left">
              高级配置
              <n-text depth="3" style="font-size: 12px; margin-left: 8px;">
                （可选，仅推荐技术用户使用）
              </n-text>
            </n-divider>
            <n-form-item label="访问密钥" v-if="tunnelForm.type === 'http' || tunnelForm.type === 'https'">
              <n-input
                v-model:value="tunnelForm.accessKey"
                placeholder="用于身份验证"
                type="password"
                show-password-on="click"
              />
            </n-form-item>
            <n-form-item label="HTTP 插件" v-if="tunnelForm.type === 'http' || tunnelForm.type === 'https'">
              <n-select
                v-model:value="tunnelForm.httpPlugin"
                placeholder="请选择 HTTP 插件"
                :options="httpPluginOptions"
                clearable
              />
            </n-form-item>
            <n-form-item label="TLS 证书路径" v-if="tunnelForm.httpPlugin === 'https2https' || tunnelForm.httpPlugin === 'https2http'">
              <n-input
                v-model:value="tunnelForm.crtPath"
                placeholder="例如: /etc/crt/example.com.crt"
              />
            </n-form-item>
            <n-form-item label="TLS 私钥路径" v-if="tunnelForm.httpPlugin === 'https2https' || tunnelForm.httpPlugin === 'https2http'">
              <n-input
                v-model:value="tunnelForm.keyPath"
                placeholder="例如: /etc/crt/example.com.key"
              />
            </n-form-item>
            <n-form-item label="HTTP 用户名" v-if="tunnelForm.type === 'http' || tunnelForm.type === 'https'">
              <n-input
                v-model:value="tunnelForm.httpUser"
                placeholder="HTTP 基础认证用户名"
              />
            </n-form-item>
            <n-form-item label="HTTP 密码" v-if="tunnelForm.type === 'http' || tunnelForm.type === 'https'">
              <n-input
                v-model:value="tunnelForm.httpPassword"
                placeholder="HTTP 基础认证密码"
                type="password"
                show-password-on="click"
              />
            </n-form-item>
            <n-form-item label="Host Header Rewrite" v-if="tunnelForm.type === 'http' || tunnelForm.type === 'https'">
              <n-input
                v-model:value="tunnelForm.hostHeaderRewrite"
                placeholder="请求 Host 头重写为目标主机"
              />
            </n-form-item>
            <n-form-item label="传输层协议">
              <n-select
                v-model:value="tunnelForm.transportProtocol"
                placeholder="请选择传输层协议"
                :options="transportProtocolOptions"
                clearable
              />
            </n-form-item>
            <n-form-item label="Proxy Protocol">
              <n-select
                v-model:value="tunnelForm.proxyProtocolVersion"
                placeholder="请选择 Proxy Protocol 版本"
                :options="proxyProtocolOptions"
                clearable
              />
            </n-form-item>
            <n-form-item label="其他选项">
              <n-space>
                <n-checkbox v-model:checked="tunnelForm.useEncryption"
                  >启用加密</n-checkbox
                >
                <n-checkbox v-model:checked="tunnelForm.useCompression"
                  >启用压缩</n-checkbox
                >
              </n-space>
            </n-form-item>
          </n-form>
        </n-card>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { useMessage } from "naive-ui";
import { ArrowLeft, Plus } from "lucide-vue-next";

const message = useMessage();

interface Node {
  nodeId: number;
  name: string;
  hostname: string;
  description: string;
  token: string;
  servicePort: number;
  adminPort: number;
  adminPass: string;
  allowGroup: string;
  allowPort: string;
  allowType: string;
  region: string;
  bandwidth: string;
  isOnline: boolean;
  isDisabled: boolean;
  totalTrafficIn: number;
  totalTrafficOut: number;
  upTime: number;
  version: string;
}

interface NodeStatus {
  nodeId: number;
  name: string;
  totalTrafficIn: number;
  totalTrafficOut: number;
  onlineClient: number;
  onlineProxy: number;
  isOnline: boolean;
  version: string;
  uptime: number;
  curConns: number;
  loadPercent: number;
}

interface TunnelForm {
  name: string;
  type: string;
  localIp: string;
  localPort: number | null;
  remotePort: number | null;
  customDomain: string;
  locations: string;
  hostHeaderRewrite: string;
  proxyProtocolVersion: string;
  useEncryption: boolean;
  useCompression: boolean;
  accessKey: string;
  httpPlugin: string;
  crtPath: string;
  keyPath: string;
  httpUser: string;
  httpPassword: string;
  transportProtocol: string;
}

// 当前步骤
const currentStep = ref(1);

// 节点数据
const nodes = ref<Node[]>([]);
const nodeStatus = ref<NodeStatus[]>([]);
const loading = ref(true);
const error = ref("");
const selectedNode = ref<Node | null>(null);
const userGroup = ref<string>("default");

// 筛选条件
const searchKeyword = ref("");
const showWebsiteNodes = ref(false);
const showHighTrafficNodes = ref(false);
const showUnexpiredNodes = ref(false);
const showFreeNodes = ref(false);

// 表单数据
const tunnelForm = ref<TunnelForm>({
  name: "",
  type: "",
  localIp: "127.0.0.1",
  localPort: null,
  remotePort: null,
  customDomain: "",
  locations: "",
  hostHeaderRewrite: "",
  proxyProtocolVersion: "",
  useEncryption: true,
  useCompression: true,
  accessKey: "",
  httpPlugin: "",
  crtPath: "",
  keyPath: "",
  httpUser: "",
  httpPassword: "",
  transportProtocol: "",
});

const creating = ref(false);
const gettingPort = ref(false);
const formRef = ref();

// 表单验证规则
const formRules = computed(() => {
  const rules: any = {
    name: { required: true, message: "请输入隧道名称", trigger: "blur" },
    type: { required: true, message: "请选择隧道类型", trigger: "change" },
    localIp: { required: true, message: "请输入本地地址", trigger: "blur" },
    localPort: {
      required: true,
      type: "number",
      message: "请输入本地端口",
      trigger: "blur",
    },
  };
  
  // HTTP/HTTPS 隧道需要域名
  if (tunnelForm.value.type === 'http' || tunnelForm.value.type === 'https') {
    rules.customDomain = {
      required: true,
      message: "请输入域名",
      trigger: "blur",
    };
  }
  
  return rules;
});

const proxyProtocolOptions = [
  { label: "不使用", value: "" },
  { label: "v1", value: "v1" },
  { label: "v2", value: "v2" },
];

const httpPluginOptions = [
  { label: "不使用", value: "" },
  { label: "http2https - 本地 HTTPS 使用 HTTP 隧道", value: "http2https" },
  { label: "https2http - 本地 HTTP 使用 HTTPS 隧道", value: "https2http" },
  { label: "https2https - 本地 HTTPS 使用 HTTPS 隧道", value: "https2https" },
];

const transportProtocolOptions = [
  { label: "默认", value: "" },
  { label: "TCP", value: "tcp" },
  { label: "KCP", value: "kcp" },
  { label: "QUIC", value: "quic" },
];

// 隧道类型选项
const tunnelTypeOptions = computed(() => {
  if (!selectedNode.value) return [];
  const allowedTypes = selectedNode.value.allowType.toLowerCase().split(";");
  const allTypes = [
    { label: "TCP", value: "tcp" },
    { label: "UDP", value: "udp" },
    { label: "HTTP", value: "http" },
    { label: "HTTPS", value: "https" },
  ];
  return allTypes.filter((type) => allowedTypes.includes(type.value));
});

// 获取用户组信息
async function fetchUserGroup(): Promise<void> {
  try {
    const config = await invoke<any>("load_unified_config");
    const group = config?.group ?? "default";
    userGroup.value = String(group).toLowerCase();
  } catch (err) {
    console.error("获取用户组失败:", err);
    userGroup.value = "default";
  }
}

function allowGroupIncludesDefault(node: Node): boolean {
  const groups = (node.allowGroup || "")
    .split(";")
    .map((g) => g.trim().toLowerCase())
    .filter(Boolean);
  return groups.includes("default");
}

function isVipRequired(node: Node): boolean {
  return !allowGroupIncludesDefault(node);
}

function isUserVip(): boolean {
  const g = (userGroup.value || "").toLowerCase();
  return g !== "default" && g !== "norealname";
}

function isNodeOverloaded(nodeId: number): boolean {
  const load = getNodeLoad(nodeId);
  return load > 85;
}

function isNodeSelectable(node: Node): boolean {
  if (isNodeOverloaded(node.nodeId)) return false;
  if (isVipRequired(node) && !isUserVip()) return false;
  return true;
}

function showVipStyle(node: Node): boolean {
  return isVipRequired(node) && !isNodeOverloaded(node.nodeId);
}

// 筛选函数
const isWebsiteNode = (node: Node): boolean => {
  const protocols = node.allowType.toLowerCase();
  return protocols.includes("http") || protocols.includes("https");
};

const isHighTrafficNode = (node: Node): boolean => {
  const bandwidth = parseFloat(node.bandwidth.replace(/[^0-9.]/g, ""));
  return bandwidth >= 60;
};

const isNotOverloadedNode = (node: Node): boolean => {
  const load = getNodeLoad(node.nodeId);
  return load < 85;
};

function isFreeNode(node: Node): boolean {
  return allowGroupIncludesDefault(node);
}

const shouldShowNode = (node: Node): boolean => {
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    const matchesKeyword =
      node.name.toLowerCase().includes(keyword) ||
      node.description.toLowerCase().includes(keyword) ||
      node.region.toLowerCase().includes(keyword);
    if (!matchesKeyword) return false;
  }
  if (showWebsiteNodes.value && !isWebsiteNode(node)) return false;
  if (showHighTrafficNodes.value && !isHighTrafficNode(node)) return false;
  if (showUnexpiredNodes.value && !isNotOverloadedNode(node)) return false;
  if (showFreeNodes.value && !isFreeNode(node)) return false;
  return true;
};

// 按地区分组的节点
const groupedNodes = computed(() => {
  const mainland: Node[] = [];
  const hkMacaoTaiwan: Node[] = [];
  const overseas: Node[] = [];
  const filteredNodes = nodes.value.filter(shouldShowNode);

  filteredNodes.forEach((node) => {
    const region = node.region.toLowerCase();
    const name = node.name.toLowerCase();
    if (
      region.includes("香港") ||
      region.includes("澳门") ||
      region.includes("台湾") ||
      region.includes("hong kong") ||
      region.includes("macau") ||
      region.includes("taiwan") ||
      region.includes("hk") ||
      region.includes("tw") ||
      region.includes("mo") ||
      name.includes("香港") ||
      name.includes("澳门") ||
      name.includes("台湾") ||
      name.includes("hong kong") ||
      name.includes("hk") ||
      name.includes("taiwan") ||
      name.includes("tw")
    ) {
      hkMacaoTaiwan.push(node);
    } else if (
      region.includes("中国") ||
      region.includes("china") ||
      region.includes("cn") ||
      region.includes("大陆") ||
      region.includes("mainland") ||
      region.includes("北京") ||
      region.includes("上海") ||
      region.includes("广州") ||
      region.includes("深圳") ||
      region.includes("杭州") ||
      region.includes("成都") ||
      region.includes("重庆") ||
      region.includes("天津") ||
      region.includes("南京") ||
      region.includes("武汉") ||
      region.includes("西安") ||
      region.includes("青岛") ||
      name.includes("北京") ||
      name.includes("上海") ||
      name.includes("广州") ||
      name.includes("深圳") ||
      name.includes("杭州") ||
      name.includes("成都") ||
      name.includes("重庆") ||
      name.includes("天津") ||
      name.includes("南京") ||
      name.includes("武汉") ||
      name.includes("西安") ||
      name.includes("青岛") ||
      name.includes("中国") ||
      name.includes("大陆")
    ) {
      mainland.push(node);
    } else {
      overseas.push(node);
    }
  });

  return { mainland, hkMacaoTaiwan, overseas };
});

function getRegionTitle(key: string): string {
  const titles: Record<string, string> = {
    mainland: "中国大陆",
    hkMacaoTaiwan: "中国港澳台地区",
    overseas: "海外",
  };
  return titles[key] || key;
}

function getNodeCardClass(node: Node) {
  return [
    "node-card",
    {
      "node-card--selected": selectedNode.value?.nodeId === node.nodeId,
      "node-card--disabled": !isNodeSelectable(node),
      "node-card--selectable": isNodeSelectable(node),
      "node-card--vip": showVipStyle(node),
    },
  ];
}

// 获取节点列表
async function fetchNodes() {
  try {
    const responseText = await invoke<string>("api_get_node_list");
    const response = JSON.parse(responseText);
    if (response.code === 200) {
      // 新版 API 返回格式: {code, data: {nodes, proxies}, message}
      nodes.value = response.data.nodes || response.data || [];
    } else {
      error.value = response.message || "获取节点列表失败";
      message.error(response.message || "获取节点列表失败");
    }
  } catch (err) {
    error.value = "网络请求失败: " + String(err);
    message.error("网络请求失败: " + String(err));
    console.error("获取节点列表失败:", err);
  }
}

// 获取节点状态
async function fetchNodeStatus() {
  try {
    const responseText = await invoke<string>("api_get_node_status");
    const response = JSON.parse(responseText);
    if (response.code === 200) {
      nodeStatus.value = response.data;
    } else {
      console.warn("获取节点状态失败:", response.message);
    }
  } catch (err) {
    console.error("获取节点状态失败:", err);
  }
}

function getNodeLoad(nodeId: number): number {
  const status = nodeStatus.value.find((s) => s.nodeId === nodeId);
  return status ? status.loadPercent : 0;
}

function getLoadColor(load: number): string {
  if (load <= 50) return "#90ff96";
  else if (load <= 80) return "#ffcf46";
  else return "#ff452b";
}

function selectNode(node: Node) {
  if (!isNodeSelectable(node)) return;
  if (selectedNode.value?.nodeId === node.nodeId) {
    selectedNode.value = null;
  } else {
    selectedNode.value = node;
  }
}

function nextStep() {
  if (!selectedNode.value) {
    message.warning("请先选择一个节点");
    return;
  }
  currentStep.value = 2;
  // 设置协议类型默认值
  if (tunnelTypeOptions.value.length > 0) {
    tunnelForm.value.type = tunnelTypeOptions.value[0].value;
  }
}

function goBack() {
  currentStep.value = 1;
}

// 获取空闲端口
async function getFreePort() {
  if (!tunnelForm.value.type) {
    message.warning("请先选择隧道类型");
    return;
  }
  
  // HTTP/HTTPS 不需要远程端口
  if (tunnelForm.value.type === "http" || tunnelForm.value.type === "https") {
    message.info("HTTP/HTTPS 隧道不需要远程端口");
    return;
  }
  
  if (tunnelForm.value.type !== "tcp" && tunnelForm.value.type !== "udp") {
    message.warning("只有 TCP/UDP 隧道需要远程端口");
    return;
  }
  
  try {
    gettingPort.value = true;
    const requestData = {
      nodeId: selectedNode.value?.nodeId,
      protocol: tunnelForm.value.type,
    };
    const responseText = await invoke<string>("api_get_free_port", {
      data: JSON.stringify(requestData),
    });
    const response = JSON.parse(responseText);
    if (response.code === 200) {
      tunnelForm.value.remotePort = response.data;
      message.success(`获取到空闲端口: ${response.data}`);
    } else {
      message.error(response.message || "获取空闲端口失败");
    }
  } catch (error) {
    console.error("获取空闲端口失败:", error);
    const errorMessage =
      error && typeof error === "string"
        ? error
        : error && typeof error === "object" && "message" in error
          ? (error as any).message
          : "获取空闲端口失败";
    message.error(`获取空闲端口失败: ${errorMessage}`);
  } finally {
    gettingPort.value = false;
  }
}

// 创建隧道
async function createTunnel() {
  try {
    await formRef.value?.validate();
    creating.value = true;
    
    // 根据新版 API 文档构建请求数据
    const requestData = {
      nodeId: selectedNode.value?.nodeId,
      proxyName: tunnelForm.value.name,
      proxyType: tunnelForm.value.type,
      localIp: tunnelForm.value.localIp,
      localPort: tunnelForm.value.localPort,
      remotePort: tunnelForm.value.remotePort || 0,
      domain: tunnelForm.value.customDomain || "",
      locations: tunnelForm.value.locations || "",
      accessKey: tunnelForm.value.accessKey || "",
      hostHeaderRewrite: tunnelForm.value.hostHeaderRewrite || "",
      useEncryption: tunnelForm.value.useEncryption,
      useCompression: tunnelForm.value.useCompression,
      proxyProtocolVersion: tunnelForm.value.proxyProtocolVersion || "",
      httpPlugin: tunnelForm.value.httpPlugin || "",
      crtPath: tunnelForm.value.crtPath || "",
      keyPath: tunnelForm.value.keyPath || "",
      requestHeaders: {},
      responseHeaders: {},
      httpUser: tunnelForm.value.httpUser || "",
      httpPassword: tunnelForm.value.httpPassword || "",
      transportProtocol: tunnelForm.value.transportProtocol || "",
    };
    
    const responseText = await invoke<string>("api_create_tunnel", {
      data: JSON.stringify(requestData),
    });
    const response = JSON.parse(responseText);
    if (response.code === 200) {
      message.success("隧道创建成功");
      // 重置表单并返回第一步
      tunnelForm.value = {
        name: "",
        type: "",
        localIp: "127.0.0.1",
        localPort: null,
        remotePort: null,
        customDomain: "",
        locations: "",
        hostHeaderRewrite: "",
        proxyProtocolVersion: "",
        useEncryption: true,
        useCompression: true,
        accessKey: "",
        httpPlugin: "",
        crtPath: "",
        keyPath: "",
        httpUser: "",
        httpPassword: "",
        transportProtocol: "",
      };
      selectedNode.value = null;
      currentStep.value = 1;
    } else {
      message.error(response.message || "创建隧道失败");
    }
  } catch (error) {
    console.error("创建隧道失败:", error);
    const errorMessage =
      error && typeof error === "string"
        ? error
        : error && typeof error === "object" && "message" in error
          ? (error as any).message
          : "创建隧道失败";
    message.error(`创建隧道失败: ${errorMessage}`);
  } finally {
    creating.value = false;
  }
}

async function reloadData() {
  loading.value = true;
  error.value = "";
  await Promise.all([fetchNodes(), fetchNodeStatus(), fetchUserGroup()]);
  loading.value = false;
}

onMounted(async () => {
  await reloadData();
});
</script>

<style scoped>
.create-tunnel {
  padding: 20px;
  width: 100%;
}

/* 过渡动画 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

.page-title {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 600;
  color: #fff;
}

.error-container {
  text-align: center;
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 0px;
}

.filter-content {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.search-input {
  min-width: 200px;
  flex: 1;
  max-width: 300px;
}

.checkbox-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.nodes-container {
  margin-top: 16px;
}

.nodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 16px;
  padding-right: 8px;
}

.node-card {
  transition: all 0.3s ease;
  border-radius: 0px;
  max-width: 365px;
  position: relative;
}

.node-card--selectable {
  cursor: pointer;
}

.node-card--selectable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background-color: rgba(24, 160, 251, 0.05);
  border-color: rgba(24, 160, 251, 0.3);
}

.node-card--vip.node-card--selectable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(242, 201, 76, 0.25);
  background-color: rgba(242, 201, 76, 0.12);
  border-color: #f2c94c;
}

.node-card--selected {
  background-color: rgba(24, 160, 251, 0.1);
  border-color: #18a0fb;
  box-shadow: 0 0 0 2px rgba(24, 160, 251, 0.2);
}

.node-card--disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.node-card--disabled:hover {
  background-color: rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.3);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.node-name {
  font-weight: 600;
  font-size: 14px;
  color: #d5d3d2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-description {
  margin: 0;
  color: #666;
  font-size: 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.node-tags-row {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 4px;
}

.protocol-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.protocol-tag {
  font-size: 10px;
}

.node-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.bandwidth-tag {
  font-size: 10px;
}

.load-text {
  font-size: 11px;
  color: #666;
  font-weight: 500;
}

.node-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(128, 128, 128, 0.6);
  z-index: 1;
}

.vip-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(242, 201, 76, 0.25),
    rgba(242, 201, 76, 0.1)
  );
  z-index: 1;
  pointer-events: none;
}

.vip-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
}

.error-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
}

.next-button-container {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.node-info-card {
  border-radius: 0px;
  margin-bottom: 20px;
}

.node-info-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.node-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.node-tags {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 4px;
}

.port-range-tag {
  font-size: 10px;
  font-weight: 500;
}

.node-actions {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.config-form-card {
  border-radius: 0px;
}

.tunnel-form {
  max-width: 600px;
}

@media (max-width: 768px) {
  .nodes-grid {
    grid-template-columns: 1fr;
  }
  .create-tunnel {
    padding: 10px;
  }
  .next-button-container {
    bottom: 20px;
    right: 20px;
  }
  .node-info-content {
    flex-direction: column;
    align-items: stretch;
  }
  .node-actions {
    justify-content: flex-end;
  }
}
</style>
