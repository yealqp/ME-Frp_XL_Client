<script setup lang="ts">
import { NInputNumber, NSlider } from "naive-ui";

defineProps<{
  title: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  width?: number;
  suffix?: string;
  formatTooltip: (value: number) => string;
}>();

const emit = defineEmits<{
  (e: "update:value", value: number | null): void;
}>();
</script>

<template>
  <div class="setting-item">
    <div class="setting-info">
      <h4>{{ title }}</h4>
      <p>{{ description }}</p>
    </div>
    <div class="slider-control">
      <n-slider
        :value="value"
        :min="min"
        :max="max"
        :step="step"
        :format-tooltip="formatTooltip"
        :style="{ width: `${width ?? 220}px` }"
        @update:value="(nextValue) => emit('update:value', nextValue)"
      />
      <n-input-number
        :value="value"
        :min="min"
        :max="max"
        :step="step"
        :show-button="false"
        style="width: 88px"
        size="small"
        @update:value="(nextValue) => emit('update:value', nextValue)"
      >
        <template v-if="suffix" #suffix>{{ suffix }}</template>
      </n-input-number>
    </div>
  </div>
</template>

<style scoped>
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.setting-info h4 {
  margin: 0;
  color: var(--app-text-color);
  font-size: 15px;
}

.setting-info p {
  margin: 6px 0 0;
  color: var(--app-text-color-2);
  font-size: 13px;
  line-height: 1.6;
}

.slider-control {
  display: flex;
  align-items: center;
  gap: 16px;
}

.slider-control :deep(.n-slider) {
  touch-action: none;
}

@media (max-width: 768px) {
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
