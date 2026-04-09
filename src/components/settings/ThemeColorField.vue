<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { NButton, NColorPicker, NInput } from "naive-ui";
import type { ThemeFieldDefinition } from "@/types/theme";
import { isHexColor } from "@/utils/themeConfig";

const props = defineProps<{
  field: ThemeFieldDefinition;
  value: string;
  defaultValue: string;
}>();

const emit = defineEmits<{
  (e: "update", value: string): void;
  (e: "reset"): void;
}>();

const normalizedValue = computed(() => props.value.toUpperCase());
const normalizedDefaultValue = computed(() => props.defaultValue.toUpperCase());
const isCustomized = computed(() => normalizedValue.value !== normalizedDefaultValue.value);
const inputValue = ref(normalizedValue.value);

watch(normalizedValue, (value) => {
  inputValue.value = value;
});

function handleColorUpdate(value: string | null): void {
  if (value) {
    emit("update", value.toUpperCase());
  }
}

function handleTextUpdate(value: string): void {
  inputValue.value = value.toUpperCase();
}

function commitTextValue(): void {
  if (isHexColor(inputValue.value)) {
    emit("update", inputValue.value);
    return;
  }

  inputValue.value = normalizedValue.value;
}
</script>

<template>
  <div class="theme-color-field">
    <div class="field-meta">
      <div class="field-header">
        <span class="field-label">{{ field.label }}</span>
        <span v-if="isCustomized" class="field-badge">已自定义</span>
      </div>
      <p class="field-description">{{ field.description }}</p>
    </div>

    <div class="field-controls">
      <div class="color-chip" :style="{ backgroundColor: normalizedValue }" />
      <n-color-picker
        :value="normalizedValue"
        :modes="['hex']"
        :show-alpha="false"
        @update:value="handleColorUpdate"
      />
      <n-input
        :value="inputValue"
        placeholder="#RRGGBB"
        @update:value="handleTextUpdate"
        @blur="commitTextValue"
        @keyup.enter="commitTextValue"
      />
      <n-button quaternary size="small" :disabled="!isCustomized" @click="emit('reset')">
        恢复默认
      </n-button>
    </div>
  </div>
</template>

<style scoped>
.theme-color-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--app-divider-color);
}

.theme-color-field:last-child {
  border-bottom: none;
}

.field-meta {
  min-width: 0;
}

.field-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text-color);
}

.field-badge {
  font-size: 12px;
  color: var(--app-primary-color);
}

.field-description {
  margin: 6px 0 0;
  color: var(--app-text-color-2);
  font-size: 12px;
  line-height: 1.5;
}

.field-controls {
  display: grid;
  grid-template-columns: 20px 1fr 120px auto;
  gap: 12px;
  align-items: center;
}

.color-chip {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: 1px solid var(--app-border-color);
  box-shadow: var(--app-box-shadow-1);
}

@media (max-width: 960px) {
  .theme-color-field {
    grid-template-columns: 1fr;
  }

  .field-controls {
    grid-template-columns: 20px 1fr;
  }
}
</style>
