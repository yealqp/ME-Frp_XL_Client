<template>
  <div class="skeleton-loader">
    <template v-if="type === 'list'">
      <div v-for="i in count" :key="i" class="skeleton-list-item">
        <n-skeleton text :repeat="rows" />
      </div>
    </template>

    <template v-else-if="type === 'card'">
      <n-card v-for="i in count" :key="i" :bordered="true" class="skeleton-card">
        <template #header>
          <n-skeleton text width="60%" />
        </template>
        <n-skeleton text :repeat="rows" />
      </n-card>
    </template>

    <template v-else-if="type === 'table'">
      <div class="skeleton-table">
        <div class="skeleton-table-header">
          <n-skeleton text :repeat="1" />
        </div>
        <div v-for="i in count" :key="i" class="skeleton-table-row">
          <n-skeleton text :repeat="1" />
        </div>
      </div>
    </template>

    <template v-else>
      <!-- Default: simple text skeleton -->
      <n-skeleton text :repeat="count" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { NSkeleton, NCard } from 'naive-ui';

/**
 * Props for SkeletonLoader component
 */
interface Props {
  /** Type of skeleton loader */
  type?: 'list' | 'card' | 'table' | 'text';
  /** Number of skeleton items to render */
  count?: number;
  /** Number of text rows per item (for list and card types) */
  rows?: number;
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  count: 3,
  rows: 3,
});
</script>

<style scoped>
.skeleton-loader {
  width: 100%;
}

.skeleton-list-item {
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid var(--n-border-color);
  border-radius: 4px;
}

.skeleton-card {
  margin-bottom: 16px;
}

.skeleton-table {
  width: 100%;
}

.skeleton-table-header {
  padding: 12px;
  background: var(--n-th-color);
  border-bottom: 1px solid var(--n-border-color);
}

.skeleton-table-row {
  padding: 12px;
  border-bottom: 1px solid var(--n-border-color);
}
</style>
