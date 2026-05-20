<template>
  <div class="filter-bar">
    <!-- 左侧：搜索 + 筛选 -->
    <div class="filter-bar-left">
      <n-input
        :value="searchKeyword"
        @update:value="$emit('update:searchKeyword', $event)"
        placeholder="搜索..."
        class="search-input"
        clearable
        size="small"
      />
      <div class="filter-divider" />
      <div class="checkbox-group">
        <n-checkbox
          :checked="showWebsiteNodes"
          @update:checked="$emit('update:showWebsiteNodes', $event)"
          size="small"
        >
          可建站
        </n-checkbox>
        <n-checkbox
          :checked="showHighTrafficNodes"
          @update:checked="$emit('update:showHighTrafficNodes', $event)"
          size="small"
        >
          大流量
        </n-checkbox>
        <n-checkbox
          :checked="showUnexpiredNodes"
          @update:checked="$emit('update:showUnexpiredNodes', $event)"
          size="small"
        >
          未过载
        </n-checkbox>
        <n-checkbox
          :checked="showFreeNodes"
          @update:checked="$emit('update:showFreeNodes', $event)"
          size="small"
        >
          非VIP
        </n-checkbox>
      </div>
    </div>

    <!-- 右侧：地图模式 + 下一步 -->
    <div class="filter-bar-right">
      <div class="map-mode-toggle">
        <n-switch
          :value="mapMode"
          @update:value="$emit('update:mapMode', $event)"
          size="small"
        />
        <span class="toggle-label">地图模式</span>
      </div>
      <div class="filter-divider" />
      <n-button
        type="primary"
        size="small"
        :disabled="!nextEnabled"
        @click="$emit('next-step')"
      >
        下一步
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface NodeFilterBarProps {
  searchKeyword: string;
  showWebsiteNodes: boolean;
  showHighTrafficNodes: boolean;
  showUnexpiredNodes: boolean;
  showFreeNodes: boolean;
  /** 地图模式开关状态 */
  mapMode: boolean;
  /** 下一步按钮是否可用（不可用时灰色禁用） */
  nextEnabled: boolean;
}

interface NodeFilterBarEmits {
  (e: "update:searchKeyword", value: string): void;
  (e: "update:showWebsiteNodes", value: boolean): void;
  (e: "update:showHighTrafficNodes", value: boolean): void;
  (e: "update:showUnexpiredNodes", value: boolean): void;
  (e: "update:showFreeNodes", value: boolean): void;
  (e: "update:mapMode", value: boolean): void;
  (e: "next-step"): void;
}

defineProps<NodeFilterBarProps>();
defineEmits<NodeFilterBarEmits>();
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  margin-bottom: 20px;
  border: 1px solid var(--app-border-color, rgba(128, 128, 128, 0.2));
  border-radius: 6px;
  background: var(--app-card-color);
  flex-wrap: wrap;
}

.filter-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
}

.filter-bar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.search-input {
  min-width: 160px;
  max-width: 240px;
}

.filter-divider {
  width: 1px;
  height: 20px;
  background: var(--app-border-color, rgba(128, 128, 128, 0.25));
  flex-shrink: 0;
}

.checkbox-group {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  align-items: center;
}

.map-mode-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.toggle-label {
  font-size: 13px;
  color: var(--app-text-color-2);
}
</style>
