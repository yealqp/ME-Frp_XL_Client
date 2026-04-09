<template>
  <div class="theme-editor-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">主题编辑器</h1>
        <p class="page-description">分别编辑浅色与深色主题，右侧预览直接使用 Naive UI 原生组件。</p>
      </div>
      <n-button secondary @click="goBackToSettings">返回设置</n-button>
    </div>

    <ThemeEditor />
  </div>
</template>

<script setup lang="ts">
import { NButton } from "naive-ui";
import { useRouter } from "vue-router";
import ThemeEditor from "@/components/settings/ThemeEditor.vue";

const router = useRouter();

function goBackToSettings(): void {
  router.push("/settings");
}
</script>

<style scoped>
.theme-editor-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.page-title {
  margin: 0;
  color: var(--app-text-color);
  font-size: 28px;
  font-weight: 700;
}

.page-description {
  margin: 8px 0 0;
  color: var(--app-text-color-2);
  line-height: 1.6;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }
}
</style>
