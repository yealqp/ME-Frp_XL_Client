<template>
  <div class="settings">
    <div class="settings-content">
      <n-card :bordered="true" class="settings-section">
        <template #header>
          <SectionHeader :icon="SettingsIcon" title="应用设置" />
        </template>

        <n-space vertical :size="24">
          <!-- 开机自启动 -->
          <div class="setting-item">
            <div class="setting-info">
              <h4>开机自启动</h4>
              <p>开启后，系统启动时会自动运行ME-Frp XL Client</p>
            </div>
            <n-switch
              v-model:value="settings.autoStart"
              @update:value="handleAutoStartChange"
            />
          </div>

          <!-- 窗口最前 -->
          <div class="setting-item">
            <div class="setting-info">
              <h4>窗口置顶</h4>
              <p>开启后，应用窗口将始终保持在最前面</p>
            </div>
            <n-switch
              v-model:value="settings.alwaysOnTop"
              @update:value="handleAlwaysOnTopChange"
            />
          </div>

          <!-- 最小化到托盘 -->
          <div class="setting-item">
            <div class="setting-info">
              <h4>最小化到系统托盘</h4>
              <p>关闭窗口时最小化到系统托盘而不是退出应用</p>
            </div>
            <n-switch
              v-model:value="settings.minimizeToTray"
              @update:value="handleMinimizeToTrayChange"
            />
          </div>

          <!-- 显示广告 -->
          <div class="setting-item">
            <div class="setting-info">
              <h4>显示侧边栏广告</h4>
              <p>显示或隐藏侧边栏底部的广告</p>
            </div>
            <n-switch
              v-model:value="settings.showAd"
              @update:value="handleShowAdChange"
            />
          </div>

          <!-- 隐藏 WebUI 入口 -->
          <div class="setting-item">
            <div class="setting-info">
              <h4>隐藏 WebUI 入口</h4>
              <p>开启后，侧边栏中的 WebUI 入口将被隐藏</p>
            </div>
            <n-switch
              v-model:value="settings.hideWebuiEntry"
              @update:value="handleHideWebuiEntryChange"
            />
          </div>

          <!-- AI 日志分析 -->
          <div class="setting-item">
            <div class="setting-info">
              <h4>AI 日志分析</h4>
              <p>开启后可在日志查看页面使用 AI 分析隧道日志</p>
            </div>
            <n-switch
              :value="settings.enableAi"
              @update:value="handleEnableAiToggle"
            />
          </div>
        </n-space>
      </n-card>

      <n-card :bordered="true" class="settings-section">
        <template #header>
          <SectionHeader :icon="Palette" title="外观设置" />
        </template>

        <div class="setting-item theme-editor-entry">
          <div class="setting-info">
            <h4>打开外观设置页</h4>
            <p>集中调整主题模式、布局透明度、背景图片和整套配色方案。</p>
          </div>
          <n-button type="primary" @click="openThemeEditorPage">
            打开外观设置
          </n-button>
        </div>
      </n-card>

      <n-card :bordered="true" class="settings-section">
        <template #header>
          <SectionHeader :icon="Rocket" title="隧道设置" />
        </template>

        <n-space vertical :size="24">
          <!-- 自启动隧道选择 -->
          <div class="setting-item tunnel-selection">
            <div class="setting-info">
              <h4>自启动隧道</h4>
              <p>选择应用启动时自动启动的隧道,由上至下依次启动</p>
            </div>
            <div class="tunnel-controls" v-if="tunnels.length > 0">
              <n-space>
                <n-button
                  size="small"
                  @click="selectAllTunnels"
                  :disabled="tunnelLoading"
                >
                  全选
                </n-button>
                <n-button
                  size="small"
                  @click="clearAllTunnels"
                  :disabled="tunnelLoading"
                >
                  清空
                </n-button>
                <n-button
                  size="small"
                  @click="refreshTunnels"
                  :loading="tunnelLoading"
                >
                  刷新
                </n-button>
              </n-space>
            </div>
            <div class="tunnel-list">
              <div v-if="tunnelLoading" class="loading-text">
                加载隧道列表中...
              </div>
              <div v-else-if="tunnels.length === 0" class="empty-text">
                暂无隧道
                <n-button
                  text
                  type="primary"
                  @click="refreshTunnels"
                  style="margin-left: 8px"
                >
                  点击刷新
                </n-button>
              </div>
              <div v-else class="tunnel-items">
                <!-- 现有隧道 -->
                <div
                  v-for="tunnel in sortedTunnels"
                  :key="tunnel.proxyId"
                  class="tunnel-item"
                  :class="{ 'tunnel-disabled': tunnel.isDisabled }"
                >
                  <div class="tunnel-item-content">
                    <n-checkbox
                      :checked="
                        settings.autoStartTunnels.includes(tunnel.proxyId)
                      "
                      @update:checked="
                        (checked) =>
                          handleTunnelAutoStartChange(tunnel.proxyId, checked)
                      "
                      :disabled="tunnel.isDisabled"
                    >
                      <div class="tunnel-info">
                        <div class="tunnel-header">
                          <span class="tunnel-name">{{
                            tunnel.proxyName
                          }}</span>
                          <n-tag
                            :type="tunnel.isDisabled ? 'default' : 'success'"
                            size="small"
                            :bordered="false"
                          >
                            {{ tunnel.isDisabled ? "已禁用" : "正常" }}
                          </n-tag>
                        </div>
                        <div class="tunnel-details">
                          <span class="tunnel-id"
                            >ID: {{ tunnel.proxyId }}</span
                          >
                          <span class="tunnel-type">{{
                            tunnel.proxyType.toUpperCase()
                          }}</span>
                          <span class="tunnel-port"
                            >{{ tunnel.localPort }} →
                            {{ tunnel.remotePort || "自动分配" }}</span
                          >
                        </div>
                      </div>
                    </n-checkbox>

                    <!-- 启动顺序调整 -->
                    <div
                      v-if="
                        settings.autoStartTunnels.includes(tunnel.proxyId) &&
                        settings.autoStartTunnels.length > 1
                      "
                      class="tunnel-order-controls"
                    >
                      <div class="order-buttons-vertical">
                        <n-button
                          v-if="getAutoStartIndex(tunnel.proxyId) > 0"
                          size="tiny"
                          quaternary
                          @click.stop="moveTunnelUp(tunnel.proxyId)"
                          title="向上移动"
                        >
                          <ArrowUp :size="14" />
                        </n-button>
                        <n-button
                          v-if="
                            getAutoStartIndex(tunnel.proxyId) <
                            settings.autoStartTunnels.length - 1
                          "
                          size="tiny"
                          quaternary
                          @click.stop="moveTunnelDown(tunnel.proxyId)"
                          title="向下移动"
                        >
                          <ArrowDown :size="14" />
                        </n-button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 已删除的隧道 -->
                <div
                  v-for="deletedTunnelId in deletedTunnels"
                  :key="`deleted-${deletedTunnelId}`"
                  class="tunnel-item tunnel-deleted"
                >
                  <div class="deleted-tunnel-content">
                    <div class="tunnel-info">
                      <div class="tunnel-header">
                        <span class="tunnel-name"
                          >隧道 ID: {{ deletedTunnelId }}</span
                        >
                        <n-tag type="error" size="small" :bordered="false">
                          隧道已删除
                        </n-tag>
                      </div>
                      <div class="tunnel-details">
                        <span class="tunnel-id">此隧道在服务器上已不存在</span>
                      </div>
                    </div>
                    <n-button
                      type="error"
                      size="small"
                      @click="removeDeletedTunnelConfig(deletedTunnelId)"
                      class="delete-config-btn"
                    >
                      点击删除配置
                    </n-button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 启动延迟 -->
          <div class="setting-item">
            <div class="setting-info">
              <h4>启动延迟</h4>
              <p>自启动隧道的延迟时间（秒）</p>
            </div>
            <n-input-number
              v-model:value="settings.startupDelay"
              :min="0"
              :max="60"
              :step="1"
              @update:value="handleStartupDelayChange"
            />
          </div>
        </n-space>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import {
  NCard,
  NSwitch,
  NButton,
  NInputNumber,
  NSpace,
  NCheckbox,
  NTag,
  useDialog,
} from "naive-ui";
import { useSettingsPanel } from "@/composables/useSettingsPanel";
import {
  Settings as SettingsIcon,
  Rocket,
  ArrowUp,
  ArrowDown,
  Palette,
} from "@lucide/vue";
import SectionHeader from "@/components/common/SectionHeader.vue";

const router = useRouter();
const dialog = useDialog();

function openThemeEditorPage(): void {
  router.push("/theme-editor");
}

const {
  settings,
  tunnels,
  tunnelLoading,
  deletedTunnels,
  sortedTunnels,
  handleAutoStartChange,
  handleAlwaysOnTopChange,
  handleMinimizeToTrayChange,
  handleShowAdChange,
  handleHideWebuiEntryChange,
  handleEnableAiChange,
  handleTunnelAutoStartChange,
  handleStartupDelayChange,
  refreshTunnels,
  selectAllTunnels,
  clearAllTunnels,
  getAutoStartIndex,
  moveTunnelUp,
  moveTunnelDown,
  removeDeletedTunnelConfig,
} = useSettingsPanel();

// AI 日志分析开关 - 开启时弹出隐私确认对话框
const handleEnableAiToggle = (value: boolean) => {
  if (value) {
    dialog.warning({
      title: "启用 AI 日志分析",
      content: "启用后将允许将您的隧道日志内容[可能包括敏感信息]发送至 AI 服务进行分析。请确认您已阅读并同意相关隐私政策。",
      positiveText: "同意",
      negativeText: "拒绝",
      onPositiveClick: () => {
        handleEnableAiChange(true);
      },
      onNegativeClick: () => {
        // 不做任何操作，保持关闭状态
      },
    });
  } else {
    handleEnableAiChange(false);
  }
};
</script>

<style scoped>
.settings {
  padding: 20px;
  width: 100%;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-section {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--app-divider-color);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
}

.setting-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--app-text-color);
}

.setting-info p {
  margin: 0;
  font-size: 12px;
  color: var(--app-text-color-2);
  line-height: 1.4;
}

/* 隧道选择相关样式 */
.tunnel-selection {
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.tunnel-controls {
  width: 100%;
  padding: 8px 0;
  border-bottom: 1px solid var(--app-divider-color);
}

.tunnel-list {
  width: 100%;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--app-border-color);
  border-radius: 6px;
  background: var(--app-bg-color);
}

.loading-text,
.empty-text {
  color: var(--app-text-color-2);
  font-size: 14px;
  padding: 20px;
  text-align: center;
}

.tunnel-items {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.tunnel-item {
  padding: 12px 16px;
  border-bottom: 1px solid var(--app-divider-color);
  background: var(--app-bg-color);
  transition: all 0.2s ease;
}

.tunnel-item:last-child {
  border-bottom: none;
}

.tunnel-item:hover {
  background: var(--app-card-color);
}

.tunnel-item.tunnel-disabled {
  opacity: 0.6;
  background: var(--app-card-color);
  filter: brightness(0.95);
}

.tunnel-item.tunnel-disabled:hover {
  background: var(--app-card-color);
  filter: brightness(0.9);
}

.tunnel-item.tunnel-deleted {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
  opacity: 0.9;
  filter: brightness(0.85) saturate(1.2);
}

.tunnel-item.tunnel-deleted:hover {
  background: var(--app-card-color);
  filter: brightness(0.8) saturate(1.2);
}

.deleted-tunnel-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.delete-config-btn {
  flex-shrink: 0;
  margin-left: 12px;
}

.tunnel-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-left: 8px;
  width: 100%;
}

.tunnel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tunnel-name {
  color: var(--app-text-color);
  font-size: 14px;
  font-weight: 500;
}

.tunnel-details {
  display: flex;
  gap: 12px;
  align-items: center;
}

.tunnel-id,
.tunnel-type,
.tunnel-port {
  color: var(--app-text-color-2);
  font-size: 12px;
}

.tunnel-type {
  background: var(--app-card-color);
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}

.tunnel-port {
  font-family: "Courier New", monospace;
}

/* 隧道项内容布局 */
.tunnel-item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* 启动顺序控制样式 */
.tunnel-order-controls {
  display: flex;
  align-items: center;
  margin-left: 12px;
  flex-shrink: 0;
}

.order-buttons-vertical {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.order-buttons-vertical .n-button {
  width: 24px;
  height: 20px;
  padding: 0;
  min-width: unset;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .settings {
    padding: 10px;
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .tunnel-list {
    max-height: 200px;
  }
}
</style>
