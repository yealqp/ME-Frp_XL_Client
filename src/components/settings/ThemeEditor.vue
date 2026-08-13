<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import {
  NAlert,
  NButton,
  NSpace,
  NTabs,
  NTabPane,
  useDialog,
  useMessage,
} from "naive-ui";
import { Upload, Download, RotateCcw, Save } from "@lucide/vue";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { useThemeStore } from "@/stores/theme";
import { THEME_FIELD_GROUPS } from "@/utils/themeConfig";
import type { ThemeFieldKey, ThemeVariant } from "@/types/theme";
import ThemeColorGroup from "./ThemeColorGroup.vue";
import ThemeEditorPreview from "./ThemeEditorPreview.vue";

const JSON_FILE_FILTER = [
  {
    name: "JSON",
    extensions: ["json"],
  },
];

const themeStore = useThemeStore();
const message = useMessage();
const dialog = useDialog();

const {
  editingTarget,
  currentEditingThemeConfig,
  currentEditingDefaults,
  hasDraftChanges,
  validationIssues,
  hasBlockingValidationIssues,
} = storeToRefs(themeStore);

const issueSummary = computed(() => {
  if (validationIssues.value.length === 0) {
    return null;
  }

  return {
    type: hasBlockingValidationIssues.value ? "error" : "warning",
    title: hasBlockingValidationIssues.value
      ? "保存前需要修复这些主题问题"
      : "当前主题存在可读性提醒",
  } as const;
});

function handleThemeTabChange(value: string): void {
  themeStore.setEditingTarget(value as ThemeVariant);
}

function handleFieldUpdate(key: ThemeFieldKey, value: string): void {
  themeStore.updateThemeDraftField(editingTarget.value, key, value);
}

function handleFieldReset(key: ThemeFieldKey): void {
  themeStore.updateThemeDraftField(
    editingTarget.value,
    key,
    currentEditingDefaults.value.common[key],
  );
}

async function persistTheme(force = false): Promise<void> {
  try {
    await themeStore.saveThemeCustomization(force);
    message.success("主题配色已保存");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "保存主题失败");
  }
}

function handleSave(): void {
  if (validationIssues.value.length === 0) {
    void persistTheme();
    return;
  }

  const issueCount = validationIssues.value.length;
  const blockingCount = validationIssues.value.filter((issue) => issue.severity === "error").length;

  dialog.warning({
    title: "确认保存当前主题",
    content:
      blockingCount > 0
        ? `当前有 ${blockingCount} 个严重对比度问题、共 ${issueCount} 条提醒。继续保存可能导致部分文本或控件难以辨认，是否仍要保存？`
        : `当前有 ${issueCount} 条配色提醒。继续保存可能影响部分区域的可读性，是否仍要保存？`,
    positiveText: "仍然保存",
    negativeText: "返回检查",
    onPositiveClick: async () => {
      await persistTheme(true);
    },
  });
}

function handleDiscard(): void {
  themeStore.discardThemeDraft();
  message.success("已撤销未保存的主题修改");
}

function handleResetCurrentTheme(): void {
  themeStore.resetThemeDraft(editingTarget.value);
  message.success(`已恢复${editingTarget.value === "light" ? "浅色" : "深色"}主题默认配色`);
}

function handleResetAll(): void {
  themeStore.resetAllThemeDrafts();
  message.success("已恢复全部主题默认配色");
}

async function handleExport(): Promise<void> {
  try {
    const filePath = await save({
      defaultPath: "XLClient_Custom_Themes.json",
      filters: JSON_FILE_FILTER,
    });

    if (!filePath) {
      return;
    }

    await writeTextFile(filePath, themeStore.exportThemeDraft());
    message.success("主题配置已导出");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "导出主题配置失败");
  }
}

function applyImportedTheme(content: string, successMessage: string): void {
  themeStore.importThemeDraft(content);
  message.success(successMessage);
}

async function handleImportFromFile(): Promise<void> {
  try {
    const filePath = await open({
      multiple: false,
      directory: false,
      filters: JSON_FILE_FILTER,
    });

    if (!filePath || Array.isArray(filePath)) {
      return;
    }

    const content = await readTextFile(filePath);
    applyImportedTheme(content, "主题配置已从文件导入到草稿预览");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "导入主题配置失败");
  }
}
</script>

<template>
  <div class="theme-editor">
    <div class="editor-toolbar">
      <div>
        <h3>完整主题编辑器</h3>
        <p>修改当前草稿即可实时预览，点击保存后才会写入配置。</p>
      </div>

      <n-space class="toolbar-actions" wrap>
        <n-button quaternary @click="handleImportFromFile">
          <template #icon>
            <Upload :size="16" />
          </template>
          导入 JSON
        </n-button>
        <n-button quaternary @click="handleExport">
          <template #icon>
            <Download :size="16" />
          </template>
          导出 JSON
        </n-button>
        <n-button secondary @click="handleResetCurrentTheme">
          <template #icon>
            <RotateCcw :size="16" />
          </template>
          恢复当前主题默认
        </n-button>
        <n-button secondary @click="handleResetAll">恢复全部默认</n-button>
        <n-button :disabled="!hasDraftChanges" @click="handleDiscard">取消未保存修改</n-button>
        <n-button type="primary" :disabled="!hasDraftChanges" @click="handleSave">
          <template #icon>
            <Save :size="16" />
          </template>
          保存主题配置
        </n-button>
      </n-space>
    </div>

    <n-alert
      v-if="issueSummary"
      :type="issueSummary.type"
      :title="issueSummary.title"
      class="validation-alert"
    >
      <div class="validation-list">
        <div v-for="issue in validationIssues" :key="issue.id">
          {{ issue.message }}<span v-if="issue.ratio"> 当前对比度 {{ issue.ratio }}</span>
        </div>
      </div>
    </n-alert>

    <div class="editor-layout">
      <div class="editor-main">
        <n-tabs :value="editingTarget" type="segment" @update:value="handleThemeTabChange">
          <n-tab-pane name="light" tab="浅色主题" />
          <n-tab-pane name="dark" tab="深色主题" />
        </n-tabs>

        <div class="group-list">
          <ThemeColorGroup
            v-for="group in THEME_FIELD_GROUPS"
            :key="group.key"
            :group="group"
            :theme-values="currentEditingThemeConfig.common"
            :default-values="currentEditingDefaults.common"
            @update="handleFieldUpdate"
            @reset="handleFieldReset"
          />
        </div>
      </div>

      <ThemeEditorPreview
        :editing-target="editingTarget"
        :config="currentEditingThemeConfig"
      />
    </div>
  </div>
</template>

<style scoped>
.theme-editor {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.editor-toolbar h3 {
  margin: 0;
  color: var(--app-text-color);
  font-size: 18px;
}

.editor-toolbar p {
  margin: 6px 0 0;
  color: var(--app-text-color-2);
  font-size: 13px;
}

.toolbar-actions {
  justify-content: flex-end;
}

.validation-alert {
  border-radius: 14px;
}

.validation-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

.editor-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 20px;
}

.editor-main,
.editor-side {
  min-width: 0;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.editor-main :deep(.n-tabs .n-tabs-nav--segment-type) {
  background: color-mix(in srgb, var(--app-card-color) 88%, var(--app-bg-color));
  border: 1px solid var(--app-border-color);
  border-radius: 0;
  padding: 4px;
}

.editor-main :deep(.n-tabs .n-tabs-tab) {
  color: var(--app-text-color-2);
  border-radius: 0;
  font-weight: 600;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.editor-main :deep(.n-tabs .n-tabs-tab:hover) {
  color: var(--app-text-color);
  background: color-mix(in srgb, var(--app-card-color) 70%, var(--app-primary-color) 8%);
}

.editor-main :deep(.n-tabs .n-tabs-tab.n-tabs-tab--active) {
  color: var(--app-text-color);
}

.editor-main :deep(.n-tabs .n-tabs-capsule) {
  background: color-mix(in srgb, var(--app-primary-color) 18%, var(--app-card-color));
  border: 1px solid color-mix(in srgb, var(--app-primary-color) 38%, var(--app-border-color));
  border-radius: 0;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--app-primary-color) 10%, transparent);
}

.editor-main :deep(.theme-color-group),
.editor-main :deep(.n-card) {
  border-radius: 0;
}

@media (max-width: 1200px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .editor-toolbar {
    flex-direction: column;
  }
}
</style>
