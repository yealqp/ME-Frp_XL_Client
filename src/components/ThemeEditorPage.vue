<template>
  <div class="theme-editor-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">外观设置</h1>
        <p class="page-description">集中管理主题模式、布局透明度、背景图片和整套配色方案。</p>
      </div>
      <n-button secondary @click="goBackToSettings">返回设置</n-button>
    </div>

    <div class="appearance-grid">
      <n-card :bordered="true" class="appearance-card">
        <template #header>
          <SectionHeader :icon="SwatchBook" title="主题模式与布局" />
        </template>

        <n-space vertical :size="24">
          <div class="setting-item">
            <div class="setting-info">
              <h4>主题模式</h4>
              <p>选择应用采用浅色、深色或跟随系统外观。</p>
            </div>
            <ThemeSwitcher mode="buttons" :show-label="true" />
          </div>

          <SettingSliderRow
            :value="settings.fontWeight ?? 400"
            title="字体粗细"
            description="调整全局文字的基础字重，让界面更轻盈或更扎实。"
            :min="300"
            :max="700"
            :step="50"
            :format-tooltip="formatFontWeightTooltip"
            @update:value="handleFontWeightChange"
          />

          <SettingSliderRow
            :value="settings.shadowIntensity ?? 100"
            title="文字阴影强度"
            description="控制标题、按钮和强调文字的阴影强度。"
            :min="0"
            :max="200"
            :step="10"
            suffix="%"
            :format-tooltip="formatPercentTooltip"
            @update:value="handleShadowIntensityChange"
          />

          <SettingSliderRow
            :value="sidebarWidth"
            title="侧边栏宽度"
            :description="isSidebarMode
              ? '调整导航侧栏的宽度，便于适配更宽或更紧凑的布局。'
              : '仅在左侧导航模式下生效，当前导航位置为顶部/底部。'"
            :min="150"
            :max="300"
            :step="1"
            suffix="px"
            :disabled="!isSidebarMode"
            :format-tooltip="formatPixelTooltip"
            @update:value="handleSidebarWidthChange"
          />

          <div class="setting-item">
            <div class="setting-info">
              <h4>侧边栏收缩功能</h4>
              <p>{{ isSidebarMode
                ? '开启后，可以通过侧栏顶部按钮快速收起和展开导航区。'
                : '仅在左侧导航模式下生效，当前导航位置为顶部/底部。' }}</p>
            </div>
            <n-switch
              v-model:value="sidebarCollapsible"
              :disabled="!isSidebarMode"
              @update:value="handleSidebarCollapsibleChange"
            />
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h4>导航位置</h4>
              <p>选择导航栏显示在左侧、顶部或底部，切换后即时生效。</p>
            </div>
            <n-radio-group
              :value="settings.sidebarPosition"
              size="small"
              @update:value="handleSidebarPositionChange"
            >
              <n-radio-button value="left" label="左侧" />
              <n-radio-button value="top" label="顶部" />
              <n-radio-button value="bottom" label="底部" />
            </n-radio-group>
          </div>
        </n-space>
      </n-card>

      <n-card :bordered="true" class="appearance-card">
        <template #header>
          <SectionHeader :icon="ImageIcon" title="背景与透明度" />
        </template>

        <n-space vertical :size="24">
          <div class="setting-item setting-item-column">
            <div class="setting-info">
              <h4>背景图片</h4>
              <p>选择图片作为应用背景，可随时清除恢复纯色背景，图片会复制到程序目录的 temp 文件夹。</p>
            </div>
            <div class="background-image-control">
              <n-input :value="backgroundImageName" readonly placeholder="未选择图片" />
              <n-space>
                <n-button @click="handleBackgroundImageSelect">选择图片</n-button>
                <n-button quaternary :disabled="!settings.backgroundImagePath" @click="handleBackgroundImageClear">
                  清除图片
                </n-button>
              </n-space>
            </div>
          </div>

          <SettingSliderRow
            :value="settings.backgroundImageOpacity ?? 100"
            title="背景图片透明度"
            description="调整背景图片图层透明度，100% 为完全显示。"
            :min="0"
            :max="100"
            :step="1"
            suffix="%"
            :format-tooltip="formatPercentTooltip"
            @update:value="handleBackgroundImageOpacityChange"
          />

          <SettingSliderRow
            :value="settings.backgroundBlur ?? 0"
            title="背景图片模糊"
            description="给背景图增加景深模糊，减少干扰。"
            :min="0"
            :max="30"
            :step="1"
            suffix="px"
            :format-tooltip="formatPixelTooltip"
            @update:value="handleBackgroundBlurChange"
          />

          <SettingSliderRow
            :value="settings.sidebarOpacity ?? 100"
            title="侧栏透明度"
            description="调整左侧导航区域透明度，便于背景图透出。"
            :min="0"
            :max="100"
            :step="1"
            suffix="%"
            :format-tooltip="formatPercentTooltip"
            @update:value="handleSidebarOpacityChange"
          />

          <SettingSliderRow
            :value="settings.contentOpacity ?? 100"
            title="内容区透明度"
            description="调整右侧主内容与模态浮层的背景透明度。"
            :min="0"
            :max="100"
            :step="1"
            suffix="%"
            :format-tooltip="formatPercentTooltip"
            @update:value="handleContentOpacityChange"
          />
        </n-space>
      </n-card>
    </div>

    <n-card :bordered="true" class="appearance-card">
      <template #header>
        <SectionHeader :icon="Palette" title="预设主题" />
      </template>

      <div class="preset-grid">
        <PresetThemeCard
          v-for="preset in themePresets"
          :key="preset.id"
          :preset="preset"
          @apply="applyPreset"
          @apply-target="applyPresetToTarget"
        />
      </div>
    </n-card>

    <ThemeEditor />
  </div>
</template>

<script setup lang="ts">
import { NButton, NCard, NInput, NSpace, NSwitch, NRadioGroup, NRadioButton, useMessage } from "naive-ui";
import { computed } from "vue";
import { useRouter } from "vue-router";
import { Image as ImageIcon, Palette, SwatchBook } from "@lucide/vue";
import SectionHeader from "@/components/common/SectionHeader.vue";
import PresetThemeCard from "@/components/appearance/PresetThemeCard.vue";
import ThemeEditor from "@/components/settings/ThemeEditor.vue";
import SettingSliderRow from "@/components/appearance/SettingSliderRow.vue";
import { useAppearanceSettings } from "@/composables/useAppearanceSettings";
import { themePresets } from "@/config/theme";
import { useThemeStore } from "@/stores/theme";
import type { ThemeVariant } from "@/types/theme";
import ThemeSwitcher from "@/components/common/ThemeSwitcher.vue";

const router = useRouter();
const message = useMessage();
const themeStore = useThemeStore();
const {
  settings,
  sidebarWidth,
  sidebarCollapsible,
  backgroundImageName,
  handleBackgroundImageSelect,
  handleBackgroundImageClear,
  handleBackgroundImageOpacityChange,
  handleBackgroundBlurChange,
  handleSidebarOpacityChange,
  handleContentOpacityChange,
  handleFontWeightChange,
  handleShadowIntensityChange,
  handleSidebarWidthChange,
  handleSidebarCollapsibleChange,
  handleSidebarPositionChange,
} = useAppearanceSettings();

// 侧边栏相关设置仅在左侧导航模式下有意义（顶部/底部导航无侧边栏）
const isSidebarMode = computed(
  () =>
    settings.value.sidebarPosition !== "top" &&
    settings.value.sidebarPosition !== "bottom",
);

function findPreset(presetId: string) {
  return themePresets.find((item) => item.id === presetId);
}

function applyPreset(presetId: string): void {
  const preset = findPreset(presetId);
  if (!preset) {
    return;
  }

  themeStore.applyThemePreset(preset);
  message.success(`已应用预设主题：${preset.name}`);
}

function applyPresetToTarget(presetId: string, target: ThemeVariant): void {
  const preset = findPreset(presetId);
  if (!preset) {
    return;
  }

  themeStore.applyThemePresetToTarget(preset, target);
  message.success(`已将 ${preset.name} 应用到${target === "light" ? "浅色" : "深色"}主题`);
}

function goBackToSettings(): void {
  router.push("/settings");
}

function formatPixelTooltip(value: number): string {
  return `${value}px`;
}

function formatPercentTooltip(value: number): string {
  return `${value}%`;
}

function formatFontWeightTooltip(value: number): string {
  return `${value}`;
}
</script>

<style scoped>
.theme-editor-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.appearance-card {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
}

.appearance-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
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

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.setting-item-column {
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
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

.background-image-control {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.background-image-control :deep(.n-input) {
  flex: 1;
}

@media (max-width: 768px) {
  .appearance-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .background-image-control {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

