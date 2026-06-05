<script setup lang="ts">
import { computed, h, ref } from "vue";
import { storeToRefs } from "pinia";
import {
  NAlert,
  NButton,
  NCard,
  NConfigProvider,
  NDataTable,
  NDivider,
  NForm,
  NFormItem,
  NInputNumber,
  NPopover,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  NTabs,
  NTabPane,
  NText,
  useDialog,
  useMessage,
} from "naive-ui";
import { Upload, Download, RotateCcw, Save } from "@lucide/vue";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import {
  THEME_PREVIEW_SELECT_OPTIONS,
  THEME_PREVIEW_TABLE_DATA,
} from "@/config/themeEditorPreview";
import { useThemeStore } from "@/stores/theme";
import { THEME_FIELD_GROUPS } from "@/utils/themeConfig";
import type { ThemeFieldKey, ThemeVariant } from "@/types/theme";
import { buildNaiveThemeOverrides, getNaiveTheme } from "@/utils/themeApplier";
import ThemeColorGroup from "./ThemeColorGroup.vue";

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

const showPreviewModal = ref(false);

const previewSelectValue = ref("tcp");
const previewSwitchValue = ref(true);

const previewSelectOptions = THEME_PREVIEW_SELECT_OPTIONS;
const previewTableData = THEME_PREVIEW_TABLE_DATA;
const previewTableColumns = [
  {
    title: "字段",
    key: "label",
  },
  {
    title: "当前值",
    key: "value",
    render: (row: { value: string; type?: "primary" | "success" | "warning" | "error" }) =>
      row.type
        ? h(NTag, { type: row.type, bordered: false }, { default: () => row.value })
        : row.value,
  },
];

const previewTheme = computed(() => getNaiveTheme(editingTarget.value));
const previewThemeOverrides = computed(() =>
  buildNaiveThemeOverrides(currentEditingThemeConfig.value),
);
const previewCardStyle = computed(() => {
  const common = currentEditingThemeConfig.value.common;

  return {
    '--preview-shell-bg': common.bodyColor,
    '--preview-shell-surface': common.cardColor,
    '--preview-shell-border': common.borderColor,
    '--preview-shell-text': common.textColorBase,
    '--preview-shell-muted': common.textColor2,
  };
});

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

      <div class="editor-side">
        <n-card class="preview-card" :bordered="false" :style="previewCardStyle">
          <template #header>
            实时预览
          </template>

          <n-config-provider :theme="previewTheme" :theme-overrides="previewThemeOverrides">
            <div class="preview-shell">
              <n-space vertical :size="16">
                <div class="preview-head">
                  <div>
                    <div class="preview-title">主题预览</div>
                    <n-text depth="3">{{ editingTarget === "light" ? "浅色" : "深色" }}草稿</n-text>
                  </div>
                  <n-tag type="info" :bordered="false">Naive UI 预览</n-tag>
                </div>

                <n-card title="ME-Frp XL Client" size="small">
                  <n-space vertical>
                    <n-text>使用当前草稿直接预览按钮、输入框、标签、表格、浮层和模态框效果。</n-text>
                    <div>
                      <n-text>文本层级：</n-text>
                      <n-space vertical :size="4" style="margin-top: 8px;">
                        <n-text>主文本示例</n-text>
                        <n-text depth="2">次级文本示例</n-text>
                        <n-text depth="3">弱化文本示例</n-text>
                      </n-space>
                    </div>
                    <n-divider style="margin: 0;" />
                    <n-space>
                      <n-button type="primary">主按钮</n-button>
                      <n-button secondary>次按钮</n-button>
                      <n-button tertiary @click="showPreviewModal = true">打开模态框</n-button>
                      <n-popover trigger="hover">
                        <template #trigger>
                          <n-button quaternary>悬停浮层</n-button>
                        </template>
                        <n-space vertical :size="6">
                          <n-text>这是浮层背景与文本颜色预览。</n-text>
                          <n-tag type="info" :bordered="false">Popover</n-tag>
                        </n-space>
                      </n-popover>
                    </n-space>

                    <n-form label-placement="top">
                      <n-form-item label="服务地址">
                        <n-input value="127.0.0.1:7000" readonly />
                      </n-form-item>
                      <n-form-item label="协议类型">
                        <n-select v-model:value="previewSelectValue" :options="previewSelectOptions" />
                      </n-form-item>
                      <n-form-item label="本地端口">
                        <n-input-number :value="7000" style="width: 100%;" />
                      </n-form-item>
                      <n-form-item label="禁用输入框">
                        <n-input value="disabled preview" disabled />
                      </n-form-item>
                      <n-form-item label="开关组件">
                        <n-switch v-model:value="previewSwitchValue" />
                      </n-form-item>
                    </n-form>

                    <n-space>
                      <n-tag type="success" :bordered="false">成功</n-tag>
                      <n-tag type="warning" :bordered="false">警告</n-tag>
                      <n-tag type="error" :bordered="false">错误</n-tag>
                      <n-tag type="info" :bordered="false">信息</n-tag>
                    </n-space>
                    <n-data-table
                      :columns="previewTableColumns"
                      :data="previewTableData"
                      :pagination="false"
                      size="small"
                      :bordered="false"
                    />
                    <n-alert type="info" :bordered="false">当前预览使用正在编辑的主题，而不是应用当前启用的主题模式。</n-alert>
                  </n-space>
                </n-card>

                <n-modal v-model:show="showPreviewModal" preset="card" title="模态框预览" style="width: 420px;">
                  <n-space vertical>
                    <n-text>这里可以观察 modalColor、文本颜色和按钮状态色。</n-text>
                    <n-alert type="warning" :bordered="false">保存前请检查文字是否清晰可读。</n-alert>
                    <n-space justify="end">
                      <n-button @click="showPreviewModal = false">关闭</n-button>
                      <n-button type="primary" @click="showPreviewModal = false">确认</n-button>
                    </n-space>
                  </n-space>
                </n-modal>
              </n-space>
            </div>
          </n-config-provider>
        </n-card>

      </div>
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

.editor-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-card {
  background: var(--app-card-color);
}

.preview-card,
.editor-main :deep(.theme-color-group),
.editor-main :deep(.n-card),
.editor-side :deep(.n-card) {
  border-radius: 0;
}

.preview-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-title {
  font-weight: 700;
  color: var(--app-text-color);
}

.preview-shell {
  padding: 4px;
  background: var(--preview-shell-bg);
  border: 1px solid var(--preview-shell-border);
  color: var(--preview-shell-text);
}

.preview-shell :deep(.n-card) {
  background: var(--preview-shell-surface);
  border: 1px solid var(--preview-shell-border);
}

.preview-shell :deep(.n-card-header),
.preview-shell :deep(.n-card__content),
.preview-shell :deep(.n-form-item-label__text),
.preview-shell :deep(.n-alert-body__title),
.preview-shell :deep(.n-alert-body__content),
.preview-shell :deep(.n-data-table-th),
.preview-shell :deep(.n-data-table-td) {
  color: var(--preview-shell-text);
}

.preview-shell :deep(.n-text.n-text--depth-3),
.preview-shell :deep(.n-text.n-text--depth-2) {
  color: var(--preview-shell-muted);
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
