<template>
  <n-card
    :bordered="true"
    :hoverable="isNodeSelectable()"
    :class="getNodeCardClass()"
    size="small"
    @click="handleClick"
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
        <span class="load-text">负载: {{ loadPercent }}%</span>
      </div>
      <n-progress
        type="line"
        :percentage="loadPercent"
        :color="getLoadColor(loadPercent)"
        :show-indicator="false"
        :height="6"
      />
    </div>
    <div v-if="loadPercent > 85" class="node-overlay"></div>
    <div
      v-else-if="isVipRequired() && !isUserVip()"
      class="vip-overlay"
    ></div>
    <div v-if="loadPercent > 85" class="error-indicator">
      <n-tag type="error" size="small" :bordered="true">负载过高</n-tag>
    </div>
    <div v-else-if="showVipStyle()" class="vip-indicator">
      <n-tag type="warning" size="small" :bordered="true">VIP专享</n-tag>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import type { Node } from './types';

interface NodeCardProps {
  node: Node;
  loadPercent: number;
  selected: boolean;
  userGroup: string;
}

interface NodeCardEmits {
  (e: 'select', node: Node): void;
}

const props = defineProps<NodeCardProps>();
const emit = defineEmits<NodeCardEmits>();

/**
 * 计算负载颜色
 * 绿色 ≤50%、黄色 51-80%、红色 >80%
 */
function getLoadColor(load: number): string {
  if (load <= 50) return "#90ff96";
  else if (load <= 80) return "#ffcf46";
  else return "#ff452b";
}

/**
 * 判断节点是否需要 VIP 权限
 */
function isVipRequired(): boolean {
  const groups = props.node.allowGroup
    .split(";")
    .map((g) => g.trim().toLowerCase())
    .filter(Boolean);
  return !groups.includes("default");
}

/**
 * 判断用户是否是 VIP
 */
function isUserVip(): boolean {
  const g = props.userGroup.toLowerCase();
  return g !== "default" && g !== "norealname";
}

/**
 * 判断节点是否可选择
 */
function isNodeSelectable(): boolean {
  // 负载过高不可选
  if (props.loadPercent > 85) return false;
  
  // VIP 节点且用户不是 VIP 不可选
  if (isVipRequired() && !isUserVip()) return false;
  
  return true;
}

/**
 * 判断是否显示 VIP 样式
 */
function showVipStyle(): boolean {
  return isVipRequired() && props.loadPercent <= 85;
}

/**
 * 获取节点卡片的 CSS 类
 */
function getNodeCardClass() {
  return [
    "node-card",
    {
      "node-card--selected": props.selected,
      "node-card--disabled": !isNodeSelectable(),
      "node-card--selectable": isNodeSelectable(),
      "node-card--vip": showVipStyle(),
    },
  ];
}

/**
 * 处理点击事件
 */
function handleClick() {
  if (!isNodeSelectable()) return;
  emit('select', props.node);
}
</script>

<style scoped>
.node-card {
  transition: all 0.3s ease;
  border-radius: 0px;
  width: 100%;
  position: relative;
}

.node-card--selectable {
  cursor: pointer;
}

.node-card--selectable:hover {
  transform: translateY(-2px);
  box-shadow: var(--app-box-shadow-1);
  background-color: var(--app-card-color);
  border-color: var(--app-primary-color);
}

.node-card--vip.node-card--selectable:hover {
  transform: translateY(-2px);
  box-shadow: var(--app-box-shadow-2);
  background-color: var(--app-card-color);
  border-color: #f2c94c;
}

.node-card--selected {
  background-color: var(--app-card-color);
  border-color: var(--app-primary-color);
  box-shadow: 0 0 0 2px var(--app-primary-color-hover);
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
  color: var(--app-text-color-1);
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
  color: var(--app-text-color-3);
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
  color: var(--app-text-color-3);
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
</style>
