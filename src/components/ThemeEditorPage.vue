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
          <div class="section-header">
            <SwatchBook :size="18" />
            <span>主题模式与布局</span>
          </div>
        </template>

        <n-space vertical :size="24">
          <div class="setting-item">
            <div class="setting-info">
              <h4>主题模式</h4>
              <p>选择应用采用浅色、深色或跟随系统外观。</p>
            </div>
            <ThemeSwitcher mode="buttons" :show-label="true" />
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h4>侧边栏宽度</h4>
              <p>调整导航侧栏的宽度，便于适配更宽或更紧凑的布局。</p>
            </div>
            <div class="slider-control">
              <n-slider
                v-model:value="sidebarWidth"
                :min="150"
                :max="300"
                :step="1"
                :format-tooltip="formatPixelTooltip"
                @update:value="handleSidebarWidthChange"
                style="width: 220px"
              />
              <n-input-number
                v-model:value="sidebarWidth"
                :min="150"
                :max="300"
                :step="1"
                :show-button="false"
                @update:value="handleSidebarWidthChange"
                style="width: 88px"
                size="small"
              >
                <template #suffix>px</template>
              </n-input-number>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h4>侧边栏收缩功能</h4>
              <p>开启后，可以通过侧栏顶部按钮快速收起和展开导航区。</p>
            </div>
            <n-switch
              v-model:value="sidebarCollapsible"
              @update:value="handleSidebarCollapsibleChange"
            />
          </div>
        </n-space>
      </n-card>

      <n-card :bordered="true" class="appearance-card">
        <template #header>
          <div class="section-header">
            <ImageIcon :size="18" />
            <span>背景与透明度</span>
          </div>
        </template>

        <n-space vertical :size="24">
          <div class="setting-item setting-item-column">
            <div class="setting-info">
              <h4>背景图片</h4>
              <p>选择桌面图片作为应用背景，可随时清除恢复纯色背景。</p>
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

          <div class="setting-item">
            <div class="setting-info">
              <h4>背景图片透明度</h4>
              <p>调整背景图片图层透明度，100% 为完全显示。</p>
            </div>
            <div class="slider-control">
              <n-slider
                v-model:value="settings.backgroundImageOpacity"
                :min="0"
                :max="100"
                :step="1"
                :format-tooltip="formatPercentTooltip"
                @update:value="handleBackgroundImageOpacityChange"
                style="width: 220px"
              />
              <n-input-number
                v-model:value="settings.backgroundImageOpacity"
                :min="0"
                :max="100"
                :step="1"
                :show-button="false"
                @update:value="handleBackgroundImageOpacityChange"
                style="width: 88px"
                size="small"
              >
                <template #suffix>%</template>
              </n-input-number>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h4>侧栏透明度</h4>
              <p>调整左侧导航区域透明度，便于背景图透出。</p>
            </div>
            <div class="slider-control">
              <n-slider
                v-model:value="settings.sidebarOpacity"
                :min="0"
                :max="100"
                :step="1"
                :format-tooltip="formatPercentTooltip"
                @update:value="handleSidebarOpacityChange"
                style="width: 220px"
              />
              <n-input-number
                v-model:value="settings.sidebarOpacity"
                :min="0"
                :max="100"
                :step="1"
                :show-button="false"
                @update:value="handleSidebarOpacityChange"
                style="width: 88px"
                size="small"
              >
                <template #suffix>%</template>
              </n-input-number>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h4>内容区透明度</h4>
              <p>调整右侧主内容与模态浮层的背景透明度。</p>
            </div>
            <div class="slider-control">
              <n-slider
                v-model:value="settings.contentOpacity"
                :min="0"
                :max="100"
                :step="1"
                :format-tooltip="formatPercentTooltip"
                @update:value="handleContentOpacityChange"
                style="width: 220px"
              />
              <n-input-number
                v-model:value="settings.contentOpacity"
                :min="0"
                :max="100"
                :step="1"
                :show-button="false"
                @update:value="handleContentOpacityChange"
                style="width: 88px"
                size="small"
              >
                <template #suffix>%</template>
              </n-input-number>
            </div>
          </div>
        </n-space>
      </n-card>
    </div>

    <n-card :bordered="true" class="appearance-card">
      <template #header>
        <div class="section-header">
          <Palette :size="18" />
          <span>预设主题</span>
        </div>
      </template>

      <div class="preset-grid">
        <button
          v-for="preset in themePresets"
          :key="preset.id"
          type="button"
          class="preset-card"
        >
          <div class="preset-hero" :style="{ '--preset-primary': preset.preview[0], '--preset-surface': preset.preview[1], '--preset-accent': preset.preview[2] }">
            <div class="preset-swatch-stack">
              <span
                v-for="color in preset.preview"
                :key="color"
                class="preset-swatch"
                :style="{ background: color }"
              />
            </div>
            <div class="preset-hero-line" />
          </div>
          <div class="preset-meta">
            <div class="preset-name-row">
              <div class="preset-name">{{ preset.name }}</div>
              <span class="preset-count">双主题</span>
            </div>
            <div class="preset-description">{{ preset.description }}</div>
          </div>
          <n-space size="small" class="preset-actions" wrap>
            <n-button size="tiny" @click.stop="applyPreset(preset.id)">整套应用</n-button>
            <n-button size="tiny" quaternary @click.stop="applyPresetToTarget(preset.id, 'light')">
              浅色
            </n-button>
            <n-button size="tiny" quaternary @click.stop="applyPresetToTarget(preset.id, 'dark')">
              深色
            </n-button>
          </n-space>
        </button>
      </div>
    </n-card>

    <ThemeEditor />
  </div>
</template>

<script setup lang="ts">
import { NButton, NCard, NInput, NInputNumber, NSlider, NSpace, NSwitch, useMessage } from "naive-ui";
import { useRouter } from "vue-router";
import { Image as ImageIcon, Palette, SwatchBook } from "lucide-vue-next";
import ThemeEditor from "@/components/settings/ThemeEditor.vue";
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
  handleSidebarOpacityChange,
  handleContentOpacityChange,
  handleSidebarWidthChange,
  handleSidebarCollapsibleChange,
} = useAppearanceSettings();

function applyPreset(presetId: string): void {
  const preset = themePresets.find((item) => item.id === presetId);
  if (!preset) {
    return;
  }

  themeStore.applyThemePreset(preset);
  message.success(`已应用预设主题：${preset.name}`);
}

function applyPresetToTarget(presetId: string, target: ThemeVariant): void {
  const preset = themePresets.find((item) => item.id === presetId);
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

.preset-hero {
  position: relative;
  width: 100%;
  min-height: 76px;
  padding: 14px;
  border: 1px solid var(--app-border-color);
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--preset-primary) 28%, transparent), transparent 48%),
    linear-gradient(135deg, var(--preset-surface), color-mix(in srgb, var(--preset-surface) 78%, #000000 22%));
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

.preset-hero-line {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 14px;
  height: 8px;
  background: linear-gradient(90deg, var(--preset-primary), var(--preset-accent));
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

.preset-description {
  color: var(--app-text-color-2);
  font-size: 12px;
  line-height: 1.5;
  min-height: 36px;
}

.preset-actions {
  width: 100%;
  justify-content: flex-start;
  padding-top: 4px;
  border-top: 1px solid var(--app-border-color);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text-color);
}

.section-header :deep(svg) {
  color: var(--app-primary-color);
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

.slider-control {
  display: flex;
  align-items: center;
  gap: 16px;
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
