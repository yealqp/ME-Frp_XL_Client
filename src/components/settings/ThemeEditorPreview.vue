<script setup lang="ts">
import { computed, h, ref } from "vue";
import {
  NAlert,
  NButton,
  NCard,
  NConfigProvider,
  NDataTable,
  NDivider,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NPopover,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  NText,
} from "naive-ui";
import {
  THEME_PREVIEW_SELECT_OPTIONS,
  THEME_PREVIEW_TABLE_DATA,
} from "@/config/themeEditorPreview";
import type { ThemeConfig, ThemeVariant } from "@/types/theme";
import { buildNaiveThemeOverrides, getNaiveTheme } from "@/utils/themeApplier";

const props = defineProps<{
  editingTarget: ThemeVariant;
  config: ThemeConfig;
}>();

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

const previewTheme = computed(() => getNaiveTheme(props.editingTarget));
const previewThemeOverrides = computed(() => buildNaiveThemeOverrides(props.config));
const previewCardStyle = computed(() => {
  const common = props.config.common;

  return {
    '--preview-shell-bg': common.bodyColor,
    '--preview-shell-surface': common.cardColor,
    '--preview-shell-border': common.borderColor,
    '--preview-shell-text': common.textColorBase,
    '--preview-shell-muted': common.textColor2,
  };
});
</script>

<template>
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
</template>

<style scoped>
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
</style>
