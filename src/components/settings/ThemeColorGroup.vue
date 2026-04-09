<script setup lang="ts">
import type { ThemeCommonConfig, ThemeFieldGroup } from "@/types/theme";
import ThemeColorField from "./ThemeColorField.vue";

defineProps<{
  group: ThemeFieldGroup;
  themeValues: ThemeCommonConfig;
  defaultValues: ThemeCommonConfig;
}>();

const emit = defineEmits<{
  (e: "update", key: keyof ThemeCommonConfig, value: string): void;
  (e: "reset", key: keyof ThemeCommonConfig): void;
}>();
</script>

<template>
  <section class="theme-color-group">
    <header class="group-header">
      <h4>{{ group.label }}</h4>
      <p>{{ group.description }}</p>
    </header>

    <div class="group-fields">
      <ThemeColorField
        v-for="field in group.fields"
        :key="field.key"
        :field="field"
        :value="themeValues[field.key]"
        :default-value="defaultValues[field.key]"
        @update="(value) => emit('update', field.key, value)"
        @reset="emit('reset', field.key)"
      />
    </div>
  </section>
</template>

<style scoped>
.theme-color-group {
  padding: 18px 20px;
  border: 1px solid var(--app-border-color);
  border-radius: 16px;
  background: color-mix(in srgb, var(--app-card-color) 96%, var(--app-bg-color));
}

.group-header h4 {
  margin: 0;
  color: var(--app-text-color);
  font-size: 15px;
}

.group-header p {
  margin: 6px 0 0;
  color: var(--app-text-color-2);
  font-size: 12px;
}

.group-fields {
  margin-top: 12px;
}
</style>
