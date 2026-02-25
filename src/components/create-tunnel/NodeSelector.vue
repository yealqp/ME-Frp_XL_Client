<template>
  <div class="node-selector">
    <!-- 错误状态 -->
    <div v-if="error" class="error-container">
      <n-alert type="error" :title="error" />
      <n-button type="primary" @click="$emit('reload')" style="margin-top: 16px">
        重新加载
      </n-button>
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
            <n-tag size="small" type="info">
              {{ regionNodes.length }} 个节点
            </n-tag>
          </template>
          <div class="nodes-grid">
            <NodeCard
              v-for="node in regionNodes"
              :key="node.nodeId"
              :node="node"
              :load-percent="getNodeLoadPercent(node.nodeId)"
              :selected="selectedNode?.nodeId === node.nodeId"
              :user-group="userGroup"
              @select="handleNodeSelect"
            />
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NCollapse, NCollapseItem, NTag, NAlert, NButton, NCard, NSkeleton } from 'naive-ui';
import NodeCard from './NodeCard.vue';
import type { Node, NodeStatus, GroupedNodes } from './types';

/**
 * NodeSelector 组件
 * 
 * 节点选择器组件，负责展示节点列表和处理节点选择逻辑
 * 
 * @component
 */

/**
 * 组件 Props 接口
 */
interface NodeSelectorProps {
  /** 节点数组 */
  nodes: Node[];
  /** 节点状态数组 */
  nodeStatus: NodeStatus[];
  /** 当前选中的节点 */
  selectedNode: Node | null;
  /** 用户组信息 */
  userGroup: string;
  /** 筛选函数 */
  filterFn: (node: Node) => boolean;
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string;
}

/**
 * 组件 Emits 接口
 */
interface NodeSelectorEmits {
  /** 节点被选中事件 */
  (e: 'select-node', node: Node): void;
  /** 请求重新加载事件 */
  (e: 'reload'): void;
}

const props = defineProps<NodeSelectorProps>();
const emit = defineEmits<NodeSelectorEmits>();

/**
 * 将节点按地区分组
 * 
 * 根据 API 返回的 region 字段进行分组：
 * - cn: 中国大陆地区
 * - cnos: 港澳台地区
 * - oversea: 海外
 * 
 * 每个分组内的节点按照节点 ID 升序排列
 */
function groupNodesByRegion(nodes: Node[]): GroupedNodes {
  const mainland: Node[] = [];
  const hkMacaoTaiwan: Node[] = [];
  const overseas: Node[] = [];

  nodes.forEach(node => {
    const region = node.region.toLowerCase();

    switch (region) {
      case 'cn':
        mainland.push(node);
        break;
      case 'cnos':
        hkMacaoTaiwan.push(node);
        break;
      case 'oversea':
        overseas.push(node);
        break;
      default:
        // 未知地区归类到海外
        overseas.push(node);
        break;
    }
  });

  // 按节点 ID 升序排序
  const sortByNodeId = (a: Node, b: Node) => a.nodeId - b.nodeId;
  mainland.sort(sortByNodeId);
  hkMacaoTaiwan.sort(sortByNodeId);
  overseas.sort(sortByNodeId);

  return { mainland, hkMacaoTaiwan, overseas };
}

/**
 * 计算分组后的节点
 * 先应用筛选函数，再按地区分组
 */
const groupedNodes = computed<GroupedNodes>(() => {
  const filteredNodes = props.nodes.filter(props.filterFn);
  return groupNodesByRegion(filteredNodes);
});

/**
 * 获取节点负载百分比
 */
function getNodeLoadPercent(nodeId: number): number {
  const status = props.nodeStatus.find(s => s.nodeId === nodeId);
  return status?.loadPercent ?? 0;
}

/**
 * 获取地区标题
 */
function getRegionTitle(regionKey: string): string {
  const titles: Record<string, string> = {
    mainland: '中国大陆',
    hkMacaoTaiwan: '中国港澳台地区',
    overseas: '海外'
  };
  return titles[regionKey] || regionKey;
}

/**
 * 处理节点选择事件
 */
function handleNodeSelect(node: Node) {
  emit('select-node', node);
}
</script>

<style scoped>
.node-selector {
  width: 100%;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.nodes-container {
  margin-bottom: 80px;
}

.nodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

@media (max-width: 768px) {
  .nodes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
