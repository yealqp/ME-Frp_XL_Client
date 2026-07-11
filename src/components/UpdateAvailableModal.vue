<template>
  <n-modal
    :show="show"
    preset="card"
    class="update-available-modal"
    :style="{ width: 'min(500px, calc(100vw - 40px))' }"
    :bordered="false"
    :closable="true"
    :mask-closable="false"
    :auto-focus="false"
    @update:show="(value) => emit('update:show', value)"
  >
    <template #header>
      <div class="modal-header">
        <div class="modal-header-icon" aria-hidden="true">
          <Sparkles :size="18" />
        </div>
        <div class="modal-header-text">
          <div class="modal-title">发现新版本</div>
          <div class="modal-subtitle">{{ changeCountText }}</div>
        </div>
      </div>
    </template>

    <div class="update-modal-content">
      <div class="version-row">
        <div class="version-chip version-chip--current">
          <span class="version-kicker">当前</span>
          <span class="version-number">v{{ currentVersion || "—" }}</span>
        </div>
        <div class="version-bridge" aria-hidden="true">
          <ArrowRight :size="14" />
        </div>
        <div class="version-chip version-chip--latest">
          <span class="version-kicker">最新</span>
          <span class="version-number">v{{ latestVersion || "—" }}</span>
        </div>
      </div>

      <div v-if="hasChangelog" class="changelog-panel">
        <div class="panel-head">
          <div class="panel-title">
            <ListTree :size="14" />
            <span>更新内容</span>
          </div>
          <span class="panel-meta">{{ sortedChangelog.length }} 个版本 · {{ totalChanges }} 项</span>
        </div>

        <div class="changelog-scroll">
          <section
            v-for="version in sortedChangelog"
            :key="version"
            class="version-group"
          >
            <header class="version-group-head">
              <span class="version-pill">v{{ version }}</span>
              <span v-if="version === latestVersion" class="latest-flag">最新</span>
              <span class="version-count">{{ (changelog[version] || []).length }} 项</span>
            </header>

            <ul class="change-list">
              <li
                v-for="(change, index) in changelog[version]"
                :key="`${version}-${index}`"
                class="change-item"
              >
                <Check :size="13" class="change-check" />
                <span class="change-text">{{ change }}</span>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <div v-else-if="hasUpdateInfo" class="changelog-panel">
        <div class="panel-head">
          <div class="panel-title">
            <ListTree :size="14" />
            <span>更新内容</span>
          </div>
        </div>
        <div
          class="markdown-content update-content-markdown"
          v-html="parsedUpdateInfo"
        />
      </div>

      <div v-else class="update-empty">
        <n-empty description="暂无更新说明" size="small" />
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <n-button quaternary class="footer-btn" @click="handleCancel">稍后提醒</n-button>
        <n-button type="primary" class="footer-btn footer-btn--primary" @click="emit('confirm')">
          <template #icon>
            <Download :size="16" />
          </template>
          立即更新
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { NModal, NButton, NEmpty } from "naive-ui";
import { ArrowRight, Check, Download, ListTree, Sparkles } from "@lucide/vue";
import type { UpdateChangelog } from "@/types/update";
import { parseMarkdown } from "@/utils/markdownParser";

const props = defineProps<{
  show: boolean;
  currentVersion: string;
  latestVersion: string;
  updateInfo: string[];
  changelog: UpdateChangelog;
  sortedChangelog: string[];
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  confirm: [];
  cancel: [];
}>();

const hasChangelog = computed(
  () => Object.keys(props.changelog || {}).length > 0,
);

const hasUpdateInfo = computed(
  () => Array.isArray(props.updateInfo) && props.updateInfo.length > 0,
);

const totalChanges = computed(() => {
  if (hasChangelog.value) {
    return props.sortedChangelog.reduce(
      (sum, version) => sum + (props.changelog[version]?.length || 0),
      0,
    );
  }
  return props.updateInfo?.length || 0;
});

const changeCountText = computed(() => {
  if (totalChanges.value > 0) {
    return `共 ${totalChanges.value} 项更新，建议尽快升级`;
  }
  return "建议尽快更新以获得更好体验";
});

const parsedUpdateInfo = computed(() => {
  if (!hasUpdateInfo.value) return "<p>暂无更新信息</p>";
  return parseMarkdown(props.updateInfo.join("\n"));
});

function handleCancel() {
  emit("cancel");
  emit("update:show", false);
}
</script>

<style scoped>
/* Header */
.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.modal-header-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: var(--app-primary-color);
  background: color-mix(in srgb, var(--app-primary-color) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--app-primary-color) 22%, transparent);
}

.modal-header-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.modal-title {
  font-size: 16px;
  font-weight: 650;
  color: var(--app-text-color);
  line-height: 1.25;
}

.modal-subtitle {
  font-size: 12px;
  color: var(--app-text-color-3);
  line-height: 1.4;
}

/* Body */
.update-modal-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.version-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--app-border-color) 85%, transparent);
  background: color-mix(in srgb, var(--app-card-color) 90%, var(--app-bg-color));
}

.version-chip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--app-border-color) 88%, transparent);
  background: color-mix(in srgb, var(--app-card-color) 86%, transparent);
}

.version-chip--latest {
  border-color: color-mix(
    in srgb,
    var(--app-success-color, #18a058) 32%,
    var(--app-border-color)
  );
  background: color-mix(in srgb, var(--app-success-color, #18a058) 8%, var(--app-card-color));
}

.version-kicker {
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--app-text-color-3);
}

.version-number {
  font-size: 16px;
  font-weight: 650;
  line-height: 1.2;
  color: var(--app-text-color);
  word-break: break-all;
}

.version-chip--latest .version-number {
  color: var(--app-success-color, #18a058);
}

.version-bridge {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: var(--app-primary-color);
  background: color-mix(in srgb, var(--app-primary-color) 12%, var(--app-card-color));
  border: 1px solid color-mix(in srgb, var(--app-primary-color) 22%, transparent);
}

/* Panel */
.changelog-panel {
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--app-border-color) 85%, transparent);
  background: color-mix(in srgb, var(--app-card-color) 88%, transparent);
  overflow: hidden;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid color-mix(in srgb, var(--app-divider-color) 80%, transparent);
  background: color-mix(in srgb, var(--app-text-color) 3%, transparent);
}

.panel-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-color);
}

.panel-title :deep(svg) {
  color: var(--app-primary-color);
}

.panel-meta {
  font-size: 12px;
  color: var(--app-text-color-3);
  white-space: nowrap;
}

.changelog-scroll {
  max-height: min(42vh, 320px);
  overflow-y: auto;
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--app-text-color-3) 50%, transparent) transparent;
}

.version-group {
  padding: 10px 12px 11px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--app-border-color) 70%, transparent);
  background: color-mix(in srgb, var(--app-bg-color) 30%, var(--app-card-color));
}

.version-group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.version-pill {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 650;
  color: var(--app-text-color);
  background: color-mix(in srgb, var(--app-text-color) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--app-border-color) 88%, transparent);
}

.latest-flag {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 650;
  color: var(--app-primary-color);
  background: color-mix(in srgb, var(--app-primary-color) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--app-primary-color) 24%, transparent);
}

.version-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--app-text-color-3);
}

.change-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.change-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--app-text-color-2);
}

.change-check {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--app-primary-color);
  opacity: 0.9;
}

.change-text {
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.update-content-markdown {
  padding: 12px 14px 14px;
  line-height: 1.7;
  font-size: 13px;
  color: var(--app-text-color-2);
  max-height: min(42vh, 320px);
  overflow-y: auto;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.update-content-markdown :deep(p) {
  margin: 0 0 8px;
}

.update-content-markdown :deep(p:last-child) {
  margin-bottom: 0;
}

.update-content-markdown :deep(a) {
  color: var(--app-primary-color);
  text-decoration: none;
}

.update-content-markdown :deep(code) {
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 12px;
  padding: 1px 5px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--app-text-color) 8%, transparent);
}

.update-empty {
  padding: 28px 8px 12px;
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
}

.footer-btn {
  transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.footer-btn--primary {
  min-width: 112px;
}

.changelog-scroll::-webkit-scrollbar,
.update-content-markdown::-webkit-scrollbar {
  width: 6px;
}

.changelog-scroll::-webkit-scrollbar-track,
.update-content-markdown::-webkit-scrollbar-track {
  background: transparent;
}

.changelog-scroll::-webkit-scrollbar-thumb,
.update-content-markdown::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--app-text-color-3) 50%, transparent);
  border-radius: 999px;
}

.changelog-scroll::-webkit-scrollbar-thumb:hover,
.update-content-markdown::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--app-text-color-2) 60%, transparent);
}

@media (max-width: 520px) {
  .version-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .version-bridge {
    display: none;
  }

  .version-chip--latest {
    order: -1;
  }
}
</style>

<style>
.update-available-modal.n-card {
  border-radius: 14px !important;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--app-border-color) 82%, transparent) !important;
  box-shadow: 0 20px 56px color-mix(in srgb, #000 22%, transparent) !important;
  background: color-mix(in srgb, var(--app-card-color) 96%, var(--app-bg-color)) !important;
}

.update-available-modal .n-card-header {
  padding: 16px 18px 10px !important;
}

.update-available-modal .n-card__content {
  padding: 4px 18px 2px !important;
}

.update-available-modal .n-card__footer {
  padding: 12px 18px 16px !important;
  border-top: 1px solid color-mix(in srgb, var(--app-divider-color) 76%, transparent);
}

.update-available-modal .n-base-close {
  top: 14px !important;
  right: 14px !important;
}

/* 可见焦点环（键盘导航） */
.update-available-modal .footer-btn:focus-visible {
  outline: 2px solid var(--app-primary-color);
  outline-offset: 2px;
}

.update-available-modal .n-base-close:focus-visible {
  outline: 2px solid var(--app-primary-color);
  outline-offset: 2px;
}
</style>