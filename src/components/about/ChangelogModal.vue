<template>
  <n-modal
    v-model:show="show"
    preset="card"
    :style="{ width: '720px', maxHeight: '85vh' }"
    title="更新历史"
    :segmented="{
      content: true,
      footer: 'soft'
    }"
  >
    <div class="changelog-modal-content">
      <div v-if="Object.keys(changelog).length > 0" class="changelog-info">
        <div v-for="version in sortedChangelog" :key="version" class="changelog-version">
          <div class="version-header">
            <span class="version-badge">v{{ version }}</span>
          </div>
          <ul class="changelog-list">
            <li v-for="(change, index) in changelog[version]" :key="index" class="changelog-item">
              <span class="changelog-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M5 8L7 10L11 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span class="changelog-text">{{ change }}</span>
            </li>
          </ul>
        </div>
      </div>
      <div v-else-if="updateInfo.length > 0" class="changelog-info">
        <div class="markdown-content changelog-content-markdown" v-html="parsedUpdateInfo"></div>
      </div>
      <div v-else class="no-changelog">
        <n-empty description="暂无更新历史信息">
          <template #icon>
            <FileText :size="48" />
          </template>
        </n-empty>
      </div>
    </div>

    <template #footer>
      <n-space justify="end">
        <n-button @click="show = false" size="medium">关闭</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { FileText } from "@lucide/vue";
import { parseMarkdown } from "@/utils/markdownParser";

const props = defineProps<{
  show: boolean;
  updateInfo: string[];
  changelog: Record<string, string[]>;
  sortedChangelog: string[];
}>();

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
}>();

const show = computed({
  get: () => props.show,
  set: (value: boolean) => emit("update:show", value),
});

const parsedUpdateInfo = computed(() => {
  if (!props.updateInfo || props.updateInfo.length === 0) {
    return "<p>暂无更新信息</p>";
  }
  return parseMarkdown(props.updateInfo.join("\n"));
});
</script>

<style scoped>
.no-changelog {
  text-align: center;
  padding: 60px 20px;
  color: var(--app-text-color-3);
}

.changelog-version {
  margin-bottom: 24px;
  padding: 20px;
  background: var(--app-card-color);
  border-radius: 12px;
  border: 1px solid var(--app-border-color);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.changelog-version::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, var(--app-primary-color) 0%, color-mix(in srgb, var(--app-primary-color) 70%, white) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.changelog-version:hover {
  border-color: var(--app-primary-color);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--app-primary-color) 12%, transparent);
  transform: translateY(-2px);
}

.changelog-version:hover::before {
  opacity: 1;
}

.changelog-modal-content {
  max-height: 65vh;
  overflow-y: auto;
}

.changelog-version:last-child {
  margin-bottom: 0;
}

.version-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--app-divider-color);
}

.version-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text-color);
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
  border-radius: 6px;
}

.changelog-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.changelog-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 8px;
  color: var(--app-text-color-2);
  font-size: 14px;
  line-height: 1.7;
  border-radius: 8px;
  transition: all 0.2s ease;
  position: relative;
}

.changelog-item:last-child {
  padding-bottom: 0;
}

.changelog-item:hover {
  background: color-mix(in srgb, var(--app-primary-color) 6%, transparent);
  padding-left: 12px;
  padding-right: 12px;
}

.changelog-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-primary-color);
  margin-top: 2px;
}

.changelog-icon svg {
  width: 16px;
  height: 16px;
}

.changelog-text {
  flex: 1;
  word-break: break-word;
}

.changelog-modal-content::-webkit-scrollbar {
  width: 8px;
}

.changelog-modal-content::-webkit-scrollbar-track {
  background: transparent;
}

.changelog-modal-content::-webkit-scrollbar-thumb {
  background: var(--app-border-color);
  border-radius: 4px;
}

.changelog-modal-content::-webkit-scrollbar-thumb:hover {
  background: var(--app-text-color-3);
}

.changelog-content-markdown {
  padding: 16px;
  line-height: 1.8;
  font-size: 14px;
  color: var(--app-text-color-2);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.changelog-content-markdown :deep(h1),
.changelog-content-markdown :deep(h2),
.changelog-content-markdown :deep(h3),
.changelog-content-markdown :deep(h4),
.changelog-content-markdown :deep(h5),
.changelog-content-markdown :deep(h6) {
  margin: 20px 0 12px 0;
  font-weight: 600;
  line-height: 1.4;
  color: var(--app-text-color);
}

.changelog-content-markdown :deep(h1) {
  font-size: 22px;
  border-bottom: 2px solid var(--app-divider-color);
  padding-bottom: 10px;
}

.changelog-content-markdown :deep(h2) {
  font-size: 19px;
  margin-bottom: 8px;
}

.changelog-content-markdown :deep(p) {
  margin: 12px 0;
}

.changelog-content-markdown :deep(ul),
.changelog-content-markdown :deep(ol) {
  margin: 12px 0;
  padding-left: 28px;
}

.changelog-content-markdown :deep(li) {
  margin: 6px 0;
  line-height: 1.8;
  color: var(--app-text-color-2);
}

.changelog-content-markdown :deep(a) {
  color: var(--app-primary-color);
  text-decoration: none;
  font-weight: 500;
}

.changelog-content-markdown :deep(strong) {
  font-weight: 600;
  color: var(--app-text-color);
}

.changelog-content-markdown :deep(hr) {
  border: none;
  border-top: 1px solid var(--app-divider-color);
  margin: 20px 0;
}
</style>
