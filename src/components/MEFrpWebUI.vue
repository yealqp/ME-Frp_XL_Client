<template>
  <div class="mefrp-webui">
    <div class="webui-content">
      <!-- WebUI 设置卡片 -->
      <n-card :bordered="true" class="webui-section">
        <template #header>
          <div class="section-header">
            <Settings :size="18" />
            <span>MEFrpc WebUI 设置</span>
          </div>
        </template>

        <div class="settings-row">
          <div class="setting-item-inline">
            <span class="setting-label">地址<n-tag size="medium" type="info">非必要不更改</n-tag></span>
            <n-input
              v-model:value="webuiStore.settings.addr"
              placeholder="localhost"
              @update:value="handleSaveSettings"
              size="small"
              style="width: 120px"
            />
          </div>

          <div class="setting-item-inline">
            <span class="setting-label">端口<n-tag size="medium" type="info">非必要不更改</n-tag></span>
            <n-input-number
              v-model:value="webuiStore.settings.port"
              :min="1"
              :max="65535"
              :step="1"
              placeholder="1201"
              @update:value="handleSaveSettings"
              size="small"
              style="width: 100px"
            />
          </div>

          <div class="setting-item-inline">
            <span class="setting-label">密码<n-tag size="medium" type="warning">必须修改</n-tag></span>
            <n-input
              v-model:value="webuiStore.settings.pass"
              type="password"
              show-password-on="click"
              placeholder="admin"
              @update:value="handleSaveSettings"
              size="small"
              style="width: 100px"
            />
          </div>

          <n-space :size="8" style="margin-left: auto">
            <n-tooltip v-if="!webuiStore.isRunning">
              <template #trigger>
                <n-button
                  type="primary"
                  @click="handleStart"
                  :loading="webuiStore.isStarting"
                  size="small"
                >
                  <template #icon>
                    <Play :size="14" />
                  </template>
                  启动
                </n-button>
              </template>
              启动 WebUI
            </n-tooltip>
            <n-tooltip v-else>
              <template #trigger>
                <n-button
                  type="warning"
                  @click="handleStop"
                  :loading="webuiStore.isStopping"
                  size="small"
                >
                  <template #icon>
                    <Square :size="14" />
                  </template>
                  停止
                </n-button>
              </template>
              停止 WebUI
            </n-tooltip>

            <n-tooltip>
              <template #trigger>
                <n-button
                  type="primary"
                  @click="handleOpenInWindow"
                  :disabled="!webuiStore.isRunning"
                  size="small"
                >
                  <template #icon>
                    <ExternalLink :size="14" />
                  </template>
                  新窗口
                </n-button>
              </template>
              在新窗口中打开 WebUI
            </n-tooltip>

            <n-tooltip>
              <template #trigger>
                <n-button
                  type="info"
                  @click="handleOpenInBrowser"
                  :disabled="!webuiStore.isRunning"
                  size="small"
                >
                  <template #icon>
                    <ExternalLink :size="14" />
                  </template>
                  浏览器
                </n-button>
              </template>
              在浏览器中打开 WebUI
            </n-tooltip>
          </n-space>
        </div>
      </n-card>

      <!-- 内嵌 WebUI -->
      <n-card
        v-if="webuiStore.showEmbedded && webuiStore.isRunning"
        :bordered="true"
        :class="['webui-embed-section', { 'webui-fullscreen': isFullscreen }]"
        :content-style="{ padding: 0, height: '100%' }"
      >
        <template #header>
          <div class="section-header">
            <Monitor :size="18" />
            <span>MEFrpc WebUI </span
            ><n-tag type="success">如退出登录无响应/拒绝连接 请重启WebUI</n-tag>
            <n-button
              text
              type="info"
              @click="toggleFullscreen"
              style="margin-left: auto"
            >
              <template #icon>
                <Maximize2 v-if="!isFullscreen" :size="18" />
                <Minimize2 v-else :size="18" />
              </template>
            </n-button>
          </div>
        </template>

        <!-- 全屏模式下的退出按钮 -->
        <n-button
          v-if="isFullscreen"
          class="fullscreen-exit-btn"
          @click="toggleFullscreen"
          type="info"
          size="small"
        >
          <template #icon>
            <Minimize2 :size="16" />
          </template>
          退出全屏
        </n-button>

        <div class="iframe-container">
          <iframe
            :src="iframeUrl"
            frameborder="0"
            class="webui-iframe"
            allow="
              autoplay;
              clipboard-write;
              encrypted-media;
              fullscreen;
              picture-in-picture;
            "
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useMessage } from "naive-ui";
import {
  Settings,
  Play,
  Square,
  ExternalLink,
  Monitor,
  Maximize2,
  Minimize2,
} from "lucide-vue-next";
import { useWebuiStore } from "../stores/webui";

const message = useMessage();
const webuiStore = useWebuiStore();
let statusCheckInterval: number | null = null;

// 防抖定时器
let saveSettingsDebounceTimer: number | null = null;

// 全屏状态
const isFullscreen = ref(false);

// 添加时间戳防止缓存
const iframeUrl = computed(() => {
  const timestamp = Date.now();
  return `${webuiStore.webuiUrl}?t=${timestamp}`;
});

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

// 包装 store 方法以显示消息
const handleStart = async () => {
  const result = await webuiStore.start();
  if (result.success) {
    message.success(result.message);
  } else {
    message.error(result.message);
  }
};

const handleStop = async () => {
  const result = await webuiStore.stop();
  if (result.success) {
    message.success(result.message);
  } else {
    message.error(result.message);
  }
};

const handleSaveSettings = async () => {
  // 清除之前的定时器
  if (saveSettingsDebounceTimer !== null) {
    clearTimeout(saveSettingsDebounceTimer);
  }
  
  // 设置新的定时器，500ms 后保存
  saveSettingsDebounceTimer = window.setTimeout(async () => {
    const result = await webuiStore.saveSettings();
    if (result.success) {
      message.success(result.message);
    } else {
      message.error(result.message);
    }
  }, 500);
};

const handleOpenInBrowser = async () => {
  const result = await webuiStore.openInBrowser();
  if (!result.success && result.message) {
    message.error(result.message);
  }
};

const handleOpenInWindow = async () => {
  const result = await webuiStore.openInWindow();
  if (result.success) {
    message.success("WebUI 窗口已打开");
  } else if (result.message) {
    message.error(result.message);
  }
};

// 组件挂载时加载设置
onMounted(() => {
  webuiStore.loadSettings();
  // 启动定期状态检查
  startStatusCheck();
});

// 组件卸载时停止定时器
onUnmounted(() => {
  stopStatusCheck();
  // 清理防抖定时器
  if (saveSettingsDebounceTimer !== null) {
    clearTimeout(saveSettingsDebounceTimer);
    saveSettingsDebounceTimer = null;
  }
});

// 启动状态检查定时器
const startStatusCheck = () => {
  // 立即检查一次
  webuiStore.checkStatus();
  // 每3秒检查一次
  statusCheckInterval = window.setInterval(() => {
    webuiStore.checkStatus();
  }, 3000);
};

// 停止状态检查定时器
const stopStatusCheck = () => {
  if (statusCheckInterval !== null) {
    clearInterval(statusCheckInterval);
    statusCheckInterval = null;
  }
};
</script>

<style scoped>
.mefrp-webui {
  padding: 20px;
  width: 100%;
}

.webui-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.webui-section,
.webui-embed-section {
  border-radius: 0px;
}

.webui-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999;
  margin: 0 !important;
  border-radius: 0 !important;
}

.webui-fullscreen .iframe-container {
  height: 100vh !important;
  min-height: unset !important;
}

.webui-fullscreen :deep(.n-card-header) {
  display: none;
}

.fullscreen-exit-btn {
  position: fixed;
  top: 20px;
  right: 3%;
  transform: translateX(-50%);
  z-index: 10000;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  color: white !important;
}

.fullscreen-exit-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.fullscreen-exit-btn :deep(.n-button__content) {
  color: white !important;
}

.fullscreen-exit-btn :deep(.n-icon) {
  color: white !important;
}

.webui-fullscreen :deep(.n-card__content) {
  padding: 0 !important;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.settings-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.setting-item-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-label {
  font-size: 14px;
  color: var(--n-text-color);
  white-space: nowrap;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.setting-info {
  flex: 1;
}

.setting-info h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--n-text-color);
}

.iframe-container {
  width: 100%;
  height: calc(100vh - 100px);
  min-height: 800px;
  overflow: hidden;
  background: #fff;
}

.webui-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

@media (max-width: 768px) {
  .mefrp-webui {
    padding: 10px;
  }

  .settings-row {
    flex-direction: column;
    align-items: stretch;
  }

  .setting-item-inline {
    width: 100%;
  }

  .setting-item-inline input,
  .setting-item-inline .n-input-number {
    flex: 1;
  }

  .iframe-container {
    height: calc(100vh - 150px);
    min-height: 600px;
  }
}
</style>
