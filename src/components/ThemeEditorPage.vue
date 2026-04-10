<template>
  <div class="theme-editor-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">主题编辑器</h1>
        <p class="page-description">分别编辑浅色与深色主题，右侧预览直接使用 Naive UI 原生组件。</p>
      </div>
      <n-button secondary @click="goBackToSettings">返回设置</n-button>
    </div>

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
              :format-tooltip="(value) => `${value}%`"
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
              :format-tooltip="(value) => `${value}%`"
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
              :format-tooltip="(value) => `${value}%`"
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

    <ThemeEditor />
  </div>
</template>

<script setup lang="ts">
import { NButton, NCard, NInput, NInputNumber, NSlider, NSpace } from "naive-ui";
import { useRouter } from "vue-router";
import { Image as ImageIcon } from "lucide-vue-next";
import ThemeEditor from "@/components/settings/ThemeEditor.vue";
import { useAppearanceSettings } from "@/composables/useAppearanceSettings";

const router = useRouter();
const {
  settings,
  backgroundImageName,
  handleBackgroundImageSelect,
  handleBackgroundImageClear,
  handleBackgroundImageOpacityChange,
  handleSidebarOpacityChange,
  handleContentOpacityChange,
} = useAppearanceSettings();

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

.appearance-card {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
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
