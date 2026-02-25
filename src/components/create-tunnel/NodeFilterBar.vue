<template>
  <n-card class="filter-card" :bordered="true">
    <div class="filter-content">
      <n-input
        :value="searchKeyword"
        @update:value="$emit('update:searchKeyword', $event)"
        placeholder="搜索..."
        class="search-input"
        clearable
      />
      <div class="checkbox-group">
        <n-checkbox
          :checked="showWebsiteNodes"
          @update:checked="$emit('update:showWebsiteNodes', $event)"
        >
          可建站
        </n-checkbox>
        <n-checkbox
          :checked="showHighTrafficNodes"
          @update:checked="$emit('update:showHighTrafficNodes', $event)"
        >
          大流量
        </n-checkbox>
        <n-checkbox
          :checked="showUnexpiredNodes"
          @update:checked="$emit('update:showUnexpiredNodes', $event)"
        >
          未过载
        </n-checkbox>
        <n-checkbox
          :checked="showFreeNodes"
          @update:checked="$emit('update:showFreeNodes', $event)"
        >
          非VIP
        </n-checkbox>
      </div>
    </div>
  </n-card>
</template>

<script setup lang="ts">
/**
 * NodeFilterBar 组件
 * 
 * 节点筛选栏组件,提供搜索和筛选功能
 * 
 * @component
 */

/**
 * 组件 Props 接口
 */
interface NodeFilterBarProps {
  /** 搜索关键词 */
  searchKeyword: string;
  /** 是否只显示可建站节点 */
  showWebsiteNodes: boolean;
  /** 是否只显示大流量节点 */
  showHighTrafficNodes: boolean;
  /** 是否只显示未过载节点 */
  showUnexpiredNodes: boolean;
  /** 是否只显示非VIP节点 */
  showFreeNodes: boolean;
}

/**
 * 组件 Emits 接口
 */
interface NodeFilterBarEmits {
  /** 搜索关键词更新事件 */
  (e: 'update:searchKeyword', value: string): void;
  /** 可建站筛选更新事件 */
  (e: 'update:showWebsiteNodes', value: boolean): void;
  /** 大流量筛选更新事件 */
  (e: 'update:showHighTrafficNodes', value: boolean): void;
  /** 未过载筛选更新事件 */
  (e: 'update:showUnexpiredNodes', value: boolean): void;
  /** 非VIP筛选更新事件 */
  (e: 'update:showFreeNodes', value: boolean): void;
}

// 定义 Props
const props = defineProps<NodeFilterBarProps>();

// 定义 Emits
const emit = defineEmits<NodeFilterBarEmits>();
</script>

<style scoped>
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
</style>
