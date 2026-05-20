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
            <n-card v-for="i in 6" :key="i" :bordered="true" size="small" class="node-card">
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

    <!-- 地图模式 -->
    <NodeMap
      v-if="!loading && mapMode"
      :nodes="activeNodes"
      :node-status="nodeStatus"
      :selected-node-id="selectedNode?.nodeId ?? null"
      :loading="loading"
      :user-group="userGroup"
      @select-node="handleNodeSelect"
    />

    <!-- 列表模式 -->
    <div v-else-if="!loading && !mapMode" class="nodes-container">
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
import { computed } from "vue";
import { NCollapse, NCollapseItem, NTag, NAlert, NButton, NCard, NSkeleton } from "naive-ui";
import NodeCard from "./NodeCard.vue";
import NodeMap from "./NodeMap.vue";
import type { Node, NodeStatus, GroupedNodes } from "./types";

interface NodeSelectorProps {
  nodes: Node[];
  nodeStatus: NodeStatus[];
  selectedNode: Node | null;
  userGroup: string;
  filterFn: (node: Node) => boolean;
  loading: boolean;
  error: string;
  /** 地图模式 */
  mapMode: boolean;
}

interface NodeSelectorEmits {
  (e: "select-node", node: Node): void;
  (e: "reload"): void;
}

const props = defineProps<NodeSelectorProps>();
const emit = defineEmits<NodeSelectorEmits>();

// Nodes passed to the map (filtered by parent's filterFn)
const activeNodes = computed(() => props.nodes.filter(props.filterFn));

function groupNodesByRegion(nodes: Node[]): GroupedNodes {
  const mainland: Node[] = [];
  const hkMacaoTaiwan: Node[] = [];
  const overseas: Node[] = [];

  nodes.forEach((node) => {
    const region = (node.region || "").toLowerCase();
    switch (region) {
      case "cn":
        mainland.push(node);
        break;
      case "cnos":
        hkMacaoTaiwan.push(node);
        break;
      case "oversea":
        overseas.push(node);
        break;
      default:
        overseas.push(node);
        break;
    }
  });

  const sortByNodeId = (a: Node, b: Node) => a.nodeId - b.nodeId;
  mainland.sort(sortByNodeId);
  hkMacaoTaiwan.sort(sortByNodeId);
  overseas.sort(sortByNodeId);

  return { mainland, hkMacaoTaiwan, overseas };
}

const groupedNodes = computed<GroupedNodes>(() => {
  return groupNodesByRegion(activeNodes.value);
});

function getNodeLoadPercent(nodeId: number): number {
  const status = props.nodeStatus.find((s) => s.nodeId === nodeId);
  return status?.loadPercent ?? 0;
}

function getRegionTitle(regionKey: string): string {
  const titles: Record<string, string> = {
    mainland: "中国大陆",
    hkMacaoTaiwan: "中国港澳台地区",
    overseas: "海外",
  };
  return titles[regionKey] || regionKey;
}

function handleNodeSelect(node: Node) {
  emit("select-node", node);
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

.nodes-container :deep(.n-collapse-item) {
  background: transparent !important;
}
.nodes-container :deep(.n-collapse-item__content-wrapper) {
  background: transparent !important;
}
.nodes-container :deep(.n-collapse-item__header) {
  background: transparent !important;
}

@media (max-width: 768px) {
  .nodes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
