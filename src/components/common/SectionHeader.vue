<template>
  <div class="section-header">
    <component :is="iconComponent" v-if="iconComponent" :size="20" />
    <slot>
      <span v-if="title">{{ title }}</span>
    </slot>
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";

interface Props {
  title?: string;
  icon?: Component;
}

const props = defineProps<Props>();

const iconComponent = props.icon || null;
</script>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text-color);
}

.section-header :deep(svg:first-child) {
  color: var(--app-primary-color);
}
</style>
