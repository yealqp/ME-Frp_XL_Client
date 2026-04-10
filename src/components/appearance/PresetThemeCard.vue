<script setup lang="ts">
import { NButton, NSpace } from "naive-ui";
import type { ThemePreset, ThemeVariant } from "@/types/theme";

defineProps<{
  preset: ThemePreset;
}>();

const emit = defineEmits<{
  (e: "apply", presetId: string): void;
  (e: "apply-target", presetId: string, target: ThemeVariant): void;
}>();
</script>

<template>
  <button type="button" class="preset-card">
    <div class="preset-swatch-stack">
      <span
        v-for="color in preset.preview"
        :key="color"
        class="preset-swatch"
        :style="{ background: color }"
      />
    </div>
    <div class="preset-meta">
      <div class="preset-name-row">
        <div class="preset-name">{{ preset.name }}</div>
        <span class="preset-count">双主题</span>
      </div>
    </div>
    <n-space size="small" class="preset-actions" wrap>
      <n-button size="tiny" @click.stop="emit('apply', preset.id)">整套应用</n-button>
      <n-button size="tiny" quaternary @click.stop="emit('apply-target', preset.id, 'light')">
        浅色
      </n-button>
      <n-button size="tiny" quaternary @click.stop="emit('apply-target', preset.id, 'dark')">
        深色
      </n-button>
    </n-space>
  </button>
</template>

<style scoped>
.preset-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--app-border-color);
  background: var(--app-card-color);
  color: var(--app-text-color);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.preset-card:hover {
  border-color: var(--app-primary-color);
  transform: translateY(-1px);
}

.preset-swatch-stack {
  display: flex;
  gap: 6px;
}

.preset-swatch {
  width: 30px;
  height: 30px;
  border: 1px solid var(--app-border-color);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, #ffffff 18%, transparent);
}

.preset-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.preset-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.preset-name {
  font-size: 14px;
  font-weight: 600;
}

.preset-count {
  color: var(--app-text-color-3);
  font-size: 11px;
  line-height: 1;
  padding: 4px 6px;
  border: 1px solid var(--app-border-color);
}

.preset-actions {
  width: 100%;
  justify-content: flex-start;
  padding-top: 4px;
  border-top: 1px solid var(--app-border-color);
}
</style>
