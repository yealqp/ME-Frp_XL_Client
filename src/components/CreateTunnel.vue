<template>
  <div class="create-tunnel">
    <h2 class="page-title">选择节点</h2>

    <!-- 顶部筛选卡片 -->
    <n-card class="filter-card" :bordered="true">
      <div class="filter-content">
        <!-- 搜索框 -->
        <n-input v-model:value="searchKeyword" placeholder="搜索..." class="search-input" clearable />

        <!-- 复选框组 -->
        <div class="checkbox-group">
          <n-checkbox v-model:checked="showWebsiteNodes">
            可建站
          </n-checkbox>
          <n-checkbox v-model:checked="showHighTrafficNodes">
            大流量
          </n-checkbox>
          <n-checkbox v-model:checked="showUnexpiredNodes">
            未过载
          </n-checkbox>
          <!-- 新增：仅显示免费节点（allowGroup 包含 default） -->
          <n-checkbox v-model:checked="showFreeNodes">
            非VIP
          </n-checkbox>
        </div>
      </div>
    </n-card>

    <!-- 错误状态 -->
    <div v-if="error" class="error-container">
      <n-alert type="error" :title="error" />
      <n-button type="primary" @click="reloadData" style="margin-top: 16px;">
        重新加载
      </n-button>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="nodes-container">
      <n-collapse default-expanded-names="mainland">
        <n-collapse-item title="加载中..." name="mainland">
          <div class="nodes-grid">
            <n-card v-for="i in 6" :key="i" :bordered="true" size="small" class="node-card">
              <template #header>
                <div class="node-header">
                  <n-skeleton text width="60" />
                  <n-skeleton text width="120" />
                </div>
              </template>

              <div class="node-content">
                <n-skeleton text :repeat="2" />

                <div class="node-tags-row">
                  <div class="protocol-tags">
                    <n-skeleton text width="40" style="margin-right: 8px;" />
                    <n-skeleton text width="40" style="margin-right: 8px;" />
                    <n-skeleton text width="40" />
                  </div>

                  <div class="feature-tags">
                    <n-skeleton text width="60" style="margin-left: 8px;" />
                    <n-skeleton text width="60" style="margin-left: 8px;" />
                  </div>
                </div>

                <div class="node-stats">
                  <div class="stat-item">
                    <n-skeleton text width="80" />
                  </div>
                  <div class="stat-item">
                    <n-skeleton text width="80" />
                  </div>
                  <div class="stat-item">
                    <n-skeleton text width="80" />
                  </div>
                </div>
              </div>
            </n-card>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>

    <!-- 节点列表 -->
    <div v-else class="nodes-container">
      <n-collapse default-expanded-names="mainland">
        <!-- 中国大陆 -->
        <n-collapse-item title="中国大陆" name="mainland" v-if="groupedNodes.mainland.length > 0">
          <template #header-extra>
            <n-tag size="small" type="info">{{ groupedNodes.mainland.length }} 个节点</n-tag>
          </template>
          <div class="nodes-grid">
            <n-card v-for="node in groupedNodes.mainland" :key="node.nodeId" :bordered="true"
              :hoverable="isNodeSelectable(node)" :class="[
                'node-card',
                {
                  'node-card--selected': selectedNode?.nodeId === node.nodeId,
                  'node-card--disabled': !isNodeSelectable(node),
                  'node-card--selectable': isNodeSelectable(node),
                  'node-card--vip': showVipStyle(node)
                }
              ]" size="small" @click="selectNode(node)">
              <template #header>
                <div class="node-header">
                  <n-tag :bordered="false" type="info" size="small">#{{ node.nodeId }}</n-tag>
                  <span class="node-name">{{ node.name }}</span>
                </div>
              </template>

              <div class="node-content">
                <p class="node-description">{{ node.description }}</p>

                <div class="node-tags-row">
                  <div class="protocol-tags">
                    <n-tag v-for="protocol in node.allowType.split(';')" :key="protocol" :bordered="false"
                      type="success" size="small" class="protocol-tag">
                      {{ protocol.toUpperCase() }}
                    </n-tag>
                  </div>
                  <n-tag :bordered="false" type="info" size="small" class="bandwidth-tag">
                    {{ node.bandwidth }}
                  </n-tag>
                </div>

                <div class="node-info-row">
                  <span class="load-text">负载: {{ getNodeLoad(node.nodeId) }}%</span>
                </div>

                <n-progress type="line" :percentage="getNodeLoad(node.nodeId)"
                  :color="getLoadColor(getNodeLoad(node.nodeId))" :show-indicator="false" :height="6" />
              </div>

              <!-- 不可选择或VIP时的蒙层与标签 -->
              <div v-if="isNodeOverloaded(node.nodeId)" class="node-overlay"></div>
              <div v-else-if="isVipRequired(node) && !isUserVip()" class="vip-overlay"></div>

              <!-- 负载过高标识（优先显示） -->
              <div v-if="isNodeOverloaded(node.nodeId)" class="error-indicator">
                <n-tag type="error" size="small" :bordered="true">
                  负载过高
                </n-tag>
              </div>
              <!-- VIP 标签（当非过载且需要VIP显示时显示） -->
              <div v-else-if="showVipStyle(node)" class="vip-indicator">
                <n-tag type="warning" size="small" :bordered="true">
                  VIP专享
                </n-tag>
              </div>
            </n-card>
          </div>
        </n-collapse-item>

        <!-- 中国港澳台地区 -->
        <n-collapse-item title="中国港澳台地区" name="hkMacaoTaiwan" v-if="groupedNodes.hkMacaoTaiwan.length > 0">
          <template #header-extra>
            <n-tag size="small" type="info">{{ groupedNodes.hkMacaoTaiwan.length }} 个节点</n-tag>
          </template>
          <div class="nodes-grid">
            <n-card v-for="node in groupedNodes.hkMacaoTaiwan" :key="node.nodeId" :bordered="true"
              :hoverable="isNodeSelectable(node)" :class="[
                'node-card',
                {
                  'node-card--selected': selectedNode?.nodeId === node.nodeId,
                  'node-card--disabled': !isNodeSelectable(node),
                  'node-card--selectable': isNodeSelectable(node),
                  'node-card--vip': showVipStyle(node)
                }
              ]" size="small" @click="selectNode(node)">
              <template #header>
                <div class="node-header">
                  <n-tag :bordered="false" type="info" size="small">#{{ node.nodeId }}</n-tag>
                  <span class="node-name">{{ node.name }}</span>
                </div>
              </template>

              <div class="node-content">
                <p class="node-description">{{ node.description }}</p>

                <div class="node-tags-row">
                  <div class="protocol-tags">
                    <n-tag v-for="protocol in node.allowType.split(';')" :key="protocol" :bordered="false"
                      type="success" size="small" class="protocol-tag">
                      {{ protocol.toUpperCase() }}
                    </n-tag>
                  </div>
                  <n-tag :bordered="false" type="info" size="small" class="bandwidth-tag">
                    {{ node.bandwidth }}
                  </n-tag>
                </div>

                <div class="node-info-row">
                  <span class="load-text">负载: {{ getNodeLoad(node.nodeId) }}%</span>
                </div>

                <n-progress type="line" :percentage="getNodeLoad(node.nodeId)"
                  :color="getLoadColor(getNodeLoad(node.nodeId))" :show-indicator="false" :height="6" />
              </div>

              <!-- 不可选择或VIP时的蒙层与标签 -->
              <div v-if="isNodeOverloaded(node.nodeId)" class="node-overlay"></div>
              <div v-else-if="isVipRequired(node) && !isUserVip()" class="vip-overlay"></div>

              <!-- 负载过高标识（优先显示） -->
              <div v-if="isNodeOverloaded(node.nodeId)" class="error-indicator">
                <n-tag type="error" size="small" :bordered="true">
                  负载过高
                </n-tag>
              </div>
              <!-- VIP 标签（当非过载且需要VIP显示时显示） -->
              <div v-else-if="showVipStyle(node)" class="vip-indicator">
                <n-tag type="warning" size="small" :bordered="true">
                  VIP专享
                </n-tag>
              </div>
            </n-card>
          </div>
        </n-collapse-item>

        <!-- 海外 -->
        <n-collapse-item title="海外" name="overseas" v-if="groupedNodes.overseas.length > 0">
          <template #header-extra>
            <n-tag size="small" type="info">{{ groupedNodes.overseas.length }} 个节点</n-tag>
          </template>
          <div class="nodes-grid">
            <n-card v-for="node in groupedNodes.overseas" :key="node.nodeId" :bordered="true"
              :hoverable="isNodeSelectable(node)" :class="[
                'node-card',
                {
                  'node-card--selected': selectedNode?.nodeId === node.nodeId,
                  'node-card--disabled': !isNodeSelectable(node),
                  'node-card--selectable': isNodeSelectable(node),
                  'node-card--vip': showVipStyle(node)
                }
              ]" size="small" @click="selectNode(node)">
              <template #header>
                <div class="node-header">
                  <n-tag :bordered="false" type="info" size="small">#{{ node.nodeId }}</n-tag>
                  <span class="node-name">{{ node.name }}</span>
                </div>
              </template>

              <div class="node-content">
                <p class="node-description">{{ node.description }}</p>

                <div class="node-tags-row">
                  <div class="protocol-tags">
                    <n-tag v-for="protocol in node.allowType.split(';')" :key="protocol" :bordered="false"
                      type="success" size="small" class="protocol-tag">
                      {{ protocol.toUpperCase() }}
                    </n-tag>
                  </div>
                  <n-tag :bordered="false" type="info" size="small" class="bandwidth-tag">
                    {{ node.bandwidth }}
                  </n-tag>
                </div>

                <div class="node-info-row">
                  <span class="load-text">负载: {{ getNodeLoad(node.nodeId) }}%</span>
                </div>

                <n-progress type="line" :percentage="getNodeLoad(node.nodeId)"
                  :color="getLoadColor(getNodeLoad(node.nodeId))" :show-indicator="false" :height="6" />
              </div>

              <!-- 不可选择或VIP时的蒙层与标签 -->
              <div v-if="isNodeOverloaded(node.nodeId)" class="node-overlay"></div>
              <div v-else-if="isVipRequired(node) && !isUserVip()" class="vip-overlay"></div>

              <!-- 负载过高标识（优先显示） -->
              <div v-if="isNodeOverloaded(node.nodeId)" class="error-indicator">
                <n-tag type="error" size="small" :bordered="true">
                  负载过高
                </n-tag>
              </div>
              <!-- VIP 标签（当非过载且需要VIP显示时显示） -->
              <div v-else-if="showVipStyle(node)" class="vip-indicator">
                <n-tag type="warning" size="small" :bordered="true">
                  VIP
                </n-tag>
              </div>
            </n-card>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>

    <!-- 下一步按钮 -->
    <div v-if="selectedNode" class="next-button-container">
      <n-button type="primary" size="large" @click="nextStep">
        下一步
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { useMessage } from 'naive-ui';

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

interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

// 定义事件
const emit = defineEmits<{
  'tunnel-created': [tunnel: any];
  'node-selected': [node: Node];
}>();

// 节点数据
const nodes = ref<Node[]>([]);
const nodeStatus = ref<NodeStatus[]>([]);
const loading = ref(true);
const error = ref('');
const selectedNode = ref<Node | null>(null);
const message = useMessage();

// 用户组（用于VIP判断）
const userGroup = ref<string>('default');

/**
 * 获取用户组信息（从 config.yaml / 统一配置读取）
 * 使用后端命令 `load_unified_config` 获取配置中的 `userInfo.group`
 */
async function fetchUserGroup(): Promise<void> {
  try {
    const config = await invoke<any>('load_unified_config');
    const group = config?.userInfo?.group ?? 'default';
    userGroup.value = String(group).toLowerCase();
  } catch (err) {
    console.error('获取用户组失败:', err);
    userGroup.value = 'default';
  }
}

/**
 * 判断节点 allowGroup 是否包含 default
 */
function allowGroupIncludesDefault(node: Node): boolean {
  const groups = (node.allowGroup || '')
    .split(';')
    .map(g => g.trim().toLowerCase())
    .filter(Boolean);
  return groups.includes('default');
}

/**
 * 节点是否需要 VIP（allowGroup 不含 default）
 */
function isVipRequired(node: Node): boolean {
  return !allowGroupIncludesDefault(node);
}

/**
 * 当前用户是否为 VIP（非 noRealname 与 default）
 */
function isUserVip(): boolean {
  const g = (userGroup.value || '').toLowerCase();
  return g !== 'default' && g !== 'norealname';
}

/**
 * 节点是否过载
 * 阈值：负载 > 85%
 */
function isNodeOverloaded(nodeId: number): boolean {
  const load = getNodeLoad(nodeId);
  return load > 85;
}

/**
 * 节点是否可选择
 * 优先级：过载禁选 > VIP要求且用户非VIP禁选；其余可选
 */
function isNodeSelectable(node: Node): boolean {
  if (isNodeOverloaded(node.nodeId)) return false;
  if (isVipRequired(node) && !isUserVip()) return false;
  return true;
}

/**
 * 是否显示 VIP 样式（金色边框与金色蒙层）
 * 过载时优先显示过载，不显示 VIP 样式
 */
function showVipStyle(node: Node): boolean {
  return isVipRequired(node) && !isNodeOverloaded(node.nodeId);
}

// 筛选条件
const searchKeyword = ref('');
const showWebsiteNodes = ref(false);
const showHighTrafficNodes = ref(false);
const showUnexpiredNodes = ref(false);

// 筛选函数
const isWebsiteNode = (node: Node): boolean => {
  const protocols = node.allowType.toLowerCase();
  return protocols.includes('http') || protocols.includes('https');
};

const isHighTrafficNode = (node: Node): boolean => {
  const bandwidth = parseFloat(node.bandwidth.replace(/[^0-9.]/g, ''));
  return bandwidth >= 60;
};

const isNotOverloadedNode = (node: Node): boolean => {
  const load = getNodeLoad(node.nodeId);
  return load < 85;
};

// 新增：仅显示免费节点筛选开关
const showFreeNodes = ref(false);

/**
 * 判断是否为免费节点
 * 免费节点定义：allowGroup 包含 default
 */
function isFreeNode(node: Node): boolean {
  return allowGroupIncludesDefault(node);
}

const shouldShowNode = (node: Node): boolean => {
  // 搜索关键词筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    const matchesKeyword = node.name.toLowerCase().includes(keyword) ||
      node.description.toLowerCase().includes(keyword) ||
      node.region.toLowerCase().includes(keyword);
    if (!matchesKeyword) return false;
  }

  // 可建站节点筛选
  if (showWebsiteNodes.value && !isWebsiteNode(node)) {
    return false;
  }

  // 大流量节点筛选
  if (showHighTrafficNodes.value && !isHighTrafficNode(node)) {
    return false;
  }

  // 未过载节点筛选
  if (showUnexpiredNodes.value && !isNotOverloadedNode(node)) {
    return false;
  }

  // 新增：仅显示免费节点筛选
  if (showFreeNodes.value && !isFreeNode(node)) {
    return false;
  }

  return true;
};

// 按地区分组的节点
const groupedNodes = computed(() => {
  const mainland: Node[] = [];
  const hkMacaoTaiwan: Node[] = [];
  const overseas: Node[] = [];

  // 先筛选节点，再分组
  const filteredNodes = nodes.value.filter(shouldShowNode);

  filteredNodes.forEach(node => {
    const region = node.region.toLowerCase();
    const name = node.name.toLowerCase();

    // 港澳台地区判断
    if (region.includes('香港') || region.includes('澳门') || region.includes('台湾') ||
      region.includes('hong kong') || region.includes('macau') || region.includes('taiwan') ||
      region.includes('hk') || region.includes('tw') || region.includes('mo') ||
      name.includes('香港') || name.includes('澳门') || name.includes('台湾') ||
      name.includes('hong kong') || name.includes('hk') || name.includes('taiwan') || name.includes('tw')) {
      hkMacaoTaiwan.push(node);
    }
    // 中国大陆地区判断
    else if (region.includes('中国') || region.includes('china') || region.includes('cn') ||
      region.includes('大陆') || region.includes('mainland') ||
      region.includes('北京') || region.includes('上海') || region.includes('广州') ||
      region.includes('深圳') || region.includes('杭州') || region.includes('成都') ||
      region.includes('重庆') || region.includes('天津') || region.includes('南京') ||
      region.includes('武汉') || region.includes('西安') || region.includes('青岛') ||
      name.includes('北京') || name.includes('上海') || name.includes('广州') ||
      name.includes('深圳') || name.includes('杭州') || name.includes('成都') ||
      name.includes('重庆') || name.includes('天津') || name.includes('南京') ||
      name.includes('武汉') || name.includes('西安') || name.includes('青岛') ||
      name.includes('中国') || name.includes('大陆')) {
      mainland.push(node);
    }
    // 海外地区
    else {
      overseas.push(node);
    }
  });

  return {
    mainland,
    hkMacaoTaiwan,
    overseas
  };
});

// 获取节点列表
async function fetchNodes() {
  try {
    const responseText = await invoke<string>('api_get_node_list');
    const response = JSON.parse(responseText) as ApiResponse<Node[]>;

    if (response.code === 200) {
      nodes.value = response.data;
    } else {
      error.value = response.message || '获取节点列表失败';
      message.error(response.message || '获取节点列表失败');
    }
  } catch (err) {
    error.value = '网络请求失败: ' + String(err);
    message.error('网络请求失败: ' + String(err));
    console.error('获取节点列表失败:', err);
  }
}

// 获取节点状态
async function fetchNodeStatus() {
  try {
    const responseText = await invoke<string>('api_get_node_status');
    const response = JSON.parse(responseText) as ApiResponse<NodeStatus[]>;

    if (response.code === 200) {
      nodeStatus.value = response.data;
    } else {
      console.warn('获取节点状态失败:', response.message);
      message.warning('获取节点状态失败: ' + (response.message || '未知错误'));
    }
  } catch (err) {
    console.error('获取节点状态失败:', err);
    message.error('获取节点状态失败: ' + String(err));
  }
}

// 获取节点负载
function getNodeLoad(nodeId: number): number {
  const status = nodeStatus.value.find(s => s.nodeId === nodeId);
  return status ? status.loadPercent : 0;
}

// 根据负载获取颜色
function getLoadColor(load: number): string {
  if (load <= 50) {
    return '#90ff96'; // 绿色
  } else if (load <= 80) {
    return '#ffcf46'; // 橙黄色
  } else {
    return '#ff452b'; // 红色
  }
}

// 旧版节点选择函数已移除，改用基于VIP与过载的 isNodeSelectable(node)

// 选择节点
function selectNode(node: Node) {
  if (!isNodeSelectable(node)) {
    return; // 不可选择
  }

  if (selectedNode.value?.nodeId === node.nodeId) {
    selectedNode.value = null; // 取消选择
  } else {
    selectedNode.value = node; // 选择节点
  }
  console.log('选择节点:', selectedNode.value);
}

// 进入下一步
function nextStep() {
  if (selectedNode.value) {
    console.log('选中的节点:', selectedNode.value);
    emit('node-selected', selectedNode.value);
  }
}

// 重新加载数据（增加用户组获取）
async function reloadData() {
  loading.value = true;
  error.value = '';
  await Promise.all([
    fetchNodes(),
    fetchNodeStatus(),
    fetchUserGroup()
  ]);
  loading.value = false;
}
// 组件挂载时获取数据
onMounted(async () => {
  await reloadData();
});
</script>

<style scoped>
.create-tunnel {
  padding: 20px;
  width: 100%;
}

.page-title {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.error-container {
  text-align: center;
  padding: 20px;
}

/* 顶部筛选卡片样式 */
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

/* 可选择的卡片 */
.node-card--selectable {
  cursor: pointer;
}

.node-card--selectable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background-color: rgba(24, 160, 251, 0.05);
  border-color: rgba(24, 160, 251, 0.3);
}

/* VIP 节点悬停样式：覆盖普通悬停样式，保持金色主题 */
.node-card--vip.node-card--selectable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(242, 201, 76, 0.25);
  background-color: rgba(242, 201, 76, 0.12);
  border-color: #f2c94c;
}

/* 选中状态的卡片 */
.node-card--selected {
  background-color: rgba(24, 160, 251, 0.1);
  border-color: #18a0fb;
  box-shadow: 0 0 0 2px rgba(24, 160, 251, 0.2);
}

/* 不可选择的卡片 */
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



/* 蒙层样式 */
.node-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(128, 128, 128, 0.6);
  z-index: 1;
}

/* VIP 卡片样式：默认不显示金色边框与背景，仅用于标识 */
.node-card--vip {
  /* 默认状态无金色边框与背景，悬停时才显示（见下方规则） */
}

/* VIP 金色蒙层：仅在需要VIP且用户非VIP时显示；不包含边框 */
.vip-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(242, 201, 76, 0.25), rgba(242, 201, 76, 0.10));
  /* 移除边框，避免默认状态出现边框 */
  z-index: 1;
  pointer-events: none;
}

/* VIP 节点悬停样式：覆盖普通悬停样式，保持金色主题 */
.node-card--vip.node-card--selectable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(242, 201, 76, 0.25);
  background-color: rgba(242, 201, 76, 0.12);
  border-color: #f2c94c;
}

/* VIP 标签：右上角黄色标签，优先级低于过载标签 */
.vip-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
}

/* 负载过高标识 */
.error-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  /* 高于 VIP 标签 */
}

/* 选中状态的卡片 */
.node-card--selected {
  background-color: rgba(24, 160, 251, 0.1);
  border-color: #18a0fb;
  box-shadow: 0 0 0 2px rgba(24, 160, 251, 0.2);
}

/* 不可选择的卡片 */
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



/* 下一步按钮容器 */
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

/* 响应式设计 */
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
}
</style>