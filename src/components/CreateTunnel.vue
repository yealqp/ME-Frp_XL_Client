<template>
  <div class="create-tunnel">
    <!-- 步骤 1: 选择节点 -->
    <Transition name="slide-fade" mode="out-in">
      <div v-if="currentStep === 1" key="step1">
        <h2 class="page-title">选择节点</h2>

        <!-- 节点筛选栏 -->
        <NodeFilterBar
          v-model:searchKeyword="searchKeyword"
          v-model:showWebsiteNodes="showWebsiteNodes"
          v-model:showHighTrafficNodes="showHighTrafficNodes"
          v-model:showUnexpiredNodes="showUnexpiredNodes"
          v-model:showFreeNodes="showFreeNodes"
        />

        <!-- 节点选择器 -->
        <NodeSelector
          :nodes="nodes"
          :nodeStatus="nodeStatus"
          :selectedNode="selectedNode"
          :userGroup="userGroup"
          :filterFn="shouldShowNode"
          :loading="loading"
          :error="error"
          @select-node="selectNode"
          @reload="reloadData"
        />

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

        <!-- 隧道配置表单 -->
        <TunnelConfigForm
          v-model="tunnelForm"
          :selectedNode="selectedNode"
          :creating="creating"
          @create="createTunnel"
          @get-free-port="getFreePort"
          @go-back="goBack"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useMessage } from "naive-ui";
import { extractErrorMessage } from "@/utils/errorHandler";
import { invokeTauriResponse } from "@/utils/tauriResponse";
import NodeFilterBar from "./create-tunnel/NodeFilterBar.vue";
import NodeSelector from "./create-tunnel/NodeSelector.vue";
import TunnelConfigForm from "./create-tunnel/TunnelConfigForm.vue";
import type { Node, NodeStatus, TunnelForm } from "./create-tunnel/types";

const message = useMessage();

// 当前步骤
const currentStep = ref(1);

// 节点数据
const nodes = ref<Node[]>([]);
const nodeStatus = ref<NodeStatus[]>([]);
const loading = ref(true);
const error = ref("");
const selectedNode = ref<Node | null>(null);
const userGroup = ref<string>("default");
const userGroups = ref<string[]>([]); // 用户组列表

interface CreateProxyDataPayload {
  nodes?: Node[];
  groups?: string[];
  currentGroup?: string;
}

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
  sourceProtocol: "http",
  proxyProtocolVersion: "",
  useEncryption: false,
  useCompression: false,
  securityMode: "none",
  accessKey: "",
  crtPath: "",
  keyPath: "",
  httpUser: "",
  httpPassword: "",
  transportProtocol: "tcp",
});

const creating = ref(false);
const gettingPort = ref(false);

// 获取创建隧道所需的所有数据（节点列表 + 用户组信息）
async function fetchCreateProxyData() {
  try {
    const response = await invokeTauriResponse<CreateProxyDataPayload>("api_get_create_proxy_data");
    
    if (response.code === 200) {
      // 设置节点列表
      nodes.value = response.data.nodes || [];
      
      // 设置用户组信息
      userGroups.value = response.data.groups || [];
      userGroup.value = (response.data.currentGroup || "default").toLowerCase();
      
      console.log("获取创建隧道数据成功:", {
        节点数量: nodes.value.length,
        当前用户组: userGroup.value,
        用户组列表: userGroups.value
      });
    } else {
      error.value = response.message || "获取数据失败";
      message.error(response.message || "获取数据失败");
    }
  } catch (err) {
    error.value = extractErrorMessage(err, "网络请求失败");
    message.error(error.value);
    console.error("获取创建隧道数据失败:", err);
  }
}

// 获取节点状态
async function fetchNodeStatus() {
  try {
    const response = await invokeTauriResponse<NodeStatus[]>("api_get_node_status");
    if (response.code === 200) {
      nodeStatus.value = response.data;
    } else {
      console.warn("获取节点状态失败:", response.message);
    }
  } catch (err) {
    console.error("获取节点状态失败:", err);
  }
}

// 辅助函数：判断节点是否允许 default 用户组
function allowGroupIncludesDefault(node: Node): boolean {
  const groups = (node.allowGroup || "")
    .split(";")
    .map((g) => g.trim().toLowerCase())
    .filter(Boolean);
  return groups.includes("default");
}

// 辅助函数：判断节点是否需要 VIP
function isVipRequired(node: Node): boolean {
  return !allowGroupIncludesDefault(node);
}

// 辅助函数：判断用户是否是 VIP
function isUserVip(): boolean {
  const g = (userGroup.value || "").toLowerCase();
  return g !== "default" && g !== "norealname";
}

// 辅助函数：获取节点负载
function getNodeLoad(nodeId: number): number {
  const status = nodeStatus.value.find((s) => s.nodeId === nodeId);
  return status ? status.loadPercent : 0;
}

// 辅助函数：判断节点是否过载
function isNodeOverloaded(nodeId: number): boolean {
  const load = getNodeLoad(nodeId);
  return load > 85;
}

// 辅助函数：判断节点是否可选择
function isNodeSelectable(node: Node): boolean {
  if (isNodeOverloaded(node.nodeId)) return false;
  if (isVipRequired(node) && !isUserVip()) return false;
  return true;
}

// 筛选函数：可建站节点
const isWebsiteNode = (node: Node): boolean => {
  const protocols = node.allowType.toLowerCase();
  return protocols.includes("http") || protocols.includes("https");
};

// 筛选函数：大流量节点
const isHighTrafficNode = (node: Node): boolean => {
  const bandwidth = parseFloat(node.bandwidth.replace(/[^0-9.]/g, ""));
  return bandwidth >= 60;
};

// 筛选函数：未过载节点
const isNotOverloadedNode = (node: Node): boolean => {
  const load = getNodeLoad(node.nodeId);
  return load < 85;
};

// 筛选函数：非VIP节点
function isFreeNode(node: Node): boolean {
  return allowGroupIncludesDefault(node);
}

// 主筛选函数：根据所有筛选条件判断是否显示节点
const shouldShowNode = (node: Node): boolean => {
  // 搜索关键词筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    const matchesKeyword =
      node.name.toLowerCase().includes(keyword) ||
      node.description.toLowerCase().includes(keyword) ||
      node.region.toLowerCase().includes(keyword);
    if (!matchesKeyword) return false;
  }
  
  // 可建站筛选
  if (showWebsiteNodes.value && !isWebsiteNode(node)) return false;
  
  // 大流量筛选
  if (showHighTrafficNodes.value && !isHighTrafficNode(node)) return false;
  
  // 未过载筛选
  if (showUnexpiredNodes.value && !isNotOverloadedNode(node)) return false;
  
  // 非VIP筛选
  if (showFreeNodes.value && !isFreeNode(node)) return false;
  
  return true;
};

// 节点选择处理
function selectNode(node: Node) {
  if (!isNodeSelectable(node)) return;
  if (selectedNode.value?.nodeId === node.nodeId) {
    selectedNode.value = null;
  } else {
    selectedNode.value = node;
  }
}

// 下一步
function nextStep() {
  if (!selectedNode.value) {
    message.warning("请先选择一个节点");
    return;
  }
  currentStep.value = 2;
  
  // 根据节点支持的协议设置默认隧道类型
  if (selectedNode.value) {
    const allowedTypes = selectedNode.value.allowType.toLowerCase().split(";");
    const allTypes = ["tcp", "udp", "http", "https"];
    const firstAvailable = allTypes.find((type) => allowedTypes.includes(type));
    if (firstAvailable) {
      tunnelForm.value.type = firstAvailable;
    }
  }
}

// 返回上一步
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
    const response = await invokeTauriResponse<number>("api_get_free_port", {
      data: JSON.stringify(requestData),
    });

    if (response.code === 200) {
      tunnelForm.value.remotePort = response.data;
      message.success(`获取到空闲端口: ${response.data}`);
    } else {
      message.error(response.message || "获取空闲端口失败");
    }
  } catch (error) {
    console.error("获取空闲端口失败:", error);
    message.error(`获取空闲端口失败: ${extractErrorMessage(error, "获取空闲端口失败")}`);
  } finally {
    gettingPort.value = false;
  }
}

// 创建隧道
async function createTunnel() {
  try {
    creating.value = true;
    
    // 根据源协议和隧道类型自动设置 httpPlugin
    let httpPlugin = "";
    if (tunnelForm.value.type === 'http' && tunnelForm.value.sourceProtocol === 'https') {
      httpPlugin = "http2https";
    } else if (tunnelForm.value.type === 'https' && tunnelForm.value.sourceProtocol === 'http') {
      httpPlugin = "https2http";
    } else if (tunnelForm.value.type === 'https' && tunnelForm.value.sourceProtocol === 'https') {
      httpPlugin = "https2https";
    }
    
    // 处理域名：对于 HTTP/HTTPS 隧道，需要转换为 JSON 字符串数组格式
    let domainValue = "";
    if ((tunnelForm.value.type === 'http' || tunnelForm.value.type === 'https') && tunnelForm.value.customDomain) {
      // 将逗号分隔的域名转换为 JSON 字符串数组
      const domains = tunnelForm.value.customDomain
        .split(',')
        .map(d => d.trim())
        .filter(d => d.length > 0);
      domainValue = JSON.stringify(domains);
    }
    
    // 构建请求数据
    const requestData = {
      nodeId: selectedNode.value?.nodeId,
      proxyName: tunnelForm.value.name,
      proxyType: tunnelForm.value.type,
      localIp: tunnelForm.value.localIp,
      localPort: tunnelForm.value.localPort,
      remotePort: tunnelForm.value.remotePort || 0,
      domain: domainValue,
      locations: "",
      accessKey: tunnelForm.value.securityMode === 'accessKey' ? tunnelForm.value.accessKey : "",
      hostHeaderRewrite: "",
      useEncryption: tunnelForm.value.useEncryption,
      useCompression: tunnelForm.value.useCompression,
      proxyProtocolVersion: tunnelForm.value.proxyProtocolVersion || "",
      httpPlugin: httpPlugin,
      crtPath: tunnelForm.value.crtPath || "",
      keyPath: tunnelForm.value.keyPath || "",
      requestHeaders: {},
      responseHeaders: {},
      httpUser: tunnelForm.value.securityMode === 'basic' ? tunnelForm.value.httpUser : "",
      httpPassword: tunnelForm.value.securityMode === 'basic' ? tunnelForm.value.httpPassword : "",
      transportProtocol: tunnelForm.value.transportProtocol || "",
    };
    
    const response = await invokeTauriResponse<null>("api_create_tunnel", {
      data: JSON.stringify(requestData),
    });
    
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
        sourceProtocol: "http",
        proxyProtocolVersion: "",
        useEncryption: false,
        useCompression: false,
        securityMode: "none",
        accessKey: "",
        crtPath: "",
        keyPath: "",
        httpUser: "",
        httpPassword: "",
        transportProtocol: "tcp",
      };
      selectedNode.value = null;
      currentStep.value = 1;
    } else {
      message.error(response.message || "创建隧道失败");
    }
  } catch (error) {
    console.error("创建隧道失败:", error);
    message.error(`创建隧道失败: ${extractErrorMessage(error, "创建隧道失败")}`);
  } finally {
    creating.value = false;
  }
}

// 重新加载数据
async function reloadData() {
  loading.value = true;
  error.value = "";
  await Promise.all([fetchCreateProxyData(), fetchNodeStatus()]);
  loading.value = false;
}

// 组件挂载时加载数据
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
  color: var(--app-text-color-2);
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

@media (max-width: 768px) {
  .create-tunnel {
    padding: 10px;
  }
  .next-button-container {
    bottom: 20px;
    right: 20px;
  }
}
</style>
