<template>
  <div class="settings">
    <div class="settings-content">
      <n-card :bordered="true" class="settings-section">
        <template #header>
          <div class="section-header">
            <SettingsIcon :size="18" />
            <span>应用设置</span>
          </div>
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
        </n-space>
      </n-card>

      <!-- 外观设置 -->
      <n-card :bordered="true" class="settings-section">
        <template #header>
          <div class="section-header">
            <Palette :size="18" />
            <span>外观设置</span>
          </div>
        </template>

        <n-space vertical :size="24">
          <!-- 主题切换 -->
          <div class="setting-item">
            <div class="setting-info">
              <h4>主题模式</h4>
              <p>选择应用的主题模式（浅色、深色或跟随系统）</p>
            </div>
            <ThemeSwitcher mode="buttons" :show-label="true" />
          </div>

          <!-- 侧边栏宽度 -->
          <div class="setting-item">
            <div class="setting-info">
              <h4>侧边栏宽度</h4>
              <p>调整侧边栏的宽度（150-300px）</p>
            </div>
            <div class="slider-control">
              <n-slider
                v-model:value="uiSettings.sidebarWidth"
                :min="150"
                :max="300"
                :step="1"
                :tooltip="true"
                :format-tooltip="(value) => `${value}px`"
                @update:value="handleSidebarWidthChange"
                style="width: 200px"
              />
              <n-input-number
                v-model:value="uiSettings.sidebarWidth"
                :min="150"
                :max="300"
                :step="1"
                :show-button=false
                @update:value="handleSidebarWidthChange"
                style="width: 80px"
                size="small"
              >
                <template #suffix>
                  px
                </template>
              </n-input-number>
            </div>
          </div>

          <!-- 侧边栏收缩功能 -->
          <div class="setting-item">
            <div class="setting-info">
              <h4>侧边栏收缩功能</h4>
              <p>开启后，可以点击按钮收缩侧边栏</p>
            </div>
            <n-switch
              v-model:value="uiSettings.sidebarCollapsible"
              @update:value="handleSidebarCollapsibleChange"
            />
          </div>
        </n-space>
      </n-card>

      <n-card :bordered="true" class="settings-section">
        <template #header>
          <div class="section-header">
            <Rocket :size="18" />
            <span>隧道设置</span>
          </div>
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
import { ref, onMounted, computed } from "vue";
import {
  useMessage,
  NCard,
  NSwitch,
  NButton,
  NInputNumber,
  NSpace,
  NCheckbox,
  NTag,
  NSlider,
} from "naive-ui";
import { invoke } from "@tauri-apps/api/core";
import type { UnifiedConfig, AppSettings } from "../types/config";
import { extractProxyList, invokeTauriResponse } from "@/utils/tauriResponse";
import { loadUnifiedConfig, saveUnifiedConfig } from "@/utils/unifiedConfig";
import { useSettingsStore } from "../stores/settings";
import { useUIStore } from "../stores/ui";
import { useThemeStore } from "../stores/theme";
import ThemeSwitcher from "./common/ThemeSwitcher.vue";
import {
  Settings as SettingsIcon,
  Rocket,
  ArrowUp,
  ArrowDown,
  Palette,
} from "lucide-vue-next";

// 使用导入的AppSettings类型
type Settings = AppSettings;

interface TunnelOption {
  label: string;
  value: number;
}

interface Tunnel {
  proxyId: number;
  proxyName: string;
  proxyType: string;
  localIp: string;
  localPort: number;
  remotePort: number;
  nodeId: number;
  isDisabled: boolean;
}

const message = useMessage();

// UI Store
const uiStore = useUIStore();
const uiSettings = ref({
  sidebarWidth: 200,
  sidebarCollapsible: true,
});

// Theme Store
const themeStore = useThemeStore();

// 防抖定时器
let sidebarWidthDebounceTimer: number | null = null;

// 设置数据
const settings = ref<Settings>({
  autoStart: false,
  alwaysOnTop: false,
  autoUpdate: true,
  autoStartTunnels: [],
  startupDelay: 5,
  theme: "dark",
  minimizeToTray: false,
  showAd: true,
  hideWebuiEntry: false,
  webuiAddr: "127.0.0.1",
  webuiPort: 1201,
  webuiPass: "admin",
});

// 隧道数据
const tunnels = ref<Tunnel[]>([]);
const tunnelLoading = ref(false);

// 隧道选项（保留兼容性）
const tunnelOptions = ref<TunnelOption[]>([]);

// 计算属性：已删除的隧道（配置中存在但API中不存在）
const deletedTunnels = computed(() => {
  const existingTunnelIds = tunnels.value.map((tunnel) => tunnel.proxyId);
  return settings.value.autoStartTunnels.filter(
    (tunnelId) => !existingTunnelIds.includes(tunnelId),
  );
});

// 计算属性：按自启动顺序排序的隧道列表
const sortedTunnels = computed(() => {
  const autoStartIds = settings.value.autoStartTunnels;
  const autoStartTunnels: Tunnel[] = [];
  const otherTunnels: Tunnel[] = [];

  // 按照autoStartTunnels的顺序添加自启动隧道
  autoStartIds.forEach((id) => {
    const tunnel = tunnels.value.find((t) => t.proxyId === id);
    if (tunnel) {
      autoStartTunnels.push(tunnel);
    }
  });

  // 添加非自启动隧道
  tunnels.value.forEach((tunnel) => {
    if (!autoStartIds.includes(tunnel.proxyId)) {
      otherTunnels.push(tunnel);
    }
  });

  return [...autoStartTunnels, ...otherTunnels];
});
// 处理开机自启动变化
const handleAutoStartChange = async (value: boolean) => {
  try {
    await invoke("set_auto_start", { enable: value });
    message.success(value ? "已开启开机自启动" : "已关闭开机自启动");
    saveSettings();
  } catch (error) {
    message.error("设置开机自启动失败");
    settings.value.autoStart = !value; // 回滚
  }
};

// 处理窗口置顶变化
const handleAlwaysOnTopChange = async (value: boolean) => {
  try {
    await invoke("set_always_on_top", { alwaysOnTop: value });
    message.success(value ? "已开启窗口置顶" : "已关闭窗口置顶");
    saveSettings();
  } catch (error) {
    message.error("设置窗口置顶失败");
    settings.value.alwaysOnTop = !value; // 回滚
  }
};

// 处理单个隧道自启动变化
const handleTunnelAutoStartChange = (proxyId: number, checked: boolean) => {
  if (checked) {
    // 确保不重复添加
    if (!settings.value.autoStartTunnels.includes(proxyId)) {
      settings.value.autoStartTunnels.push(proxyId);
    }
  } else {
    // 移除所有匹配的项（防止重复）
    settings.value.autoStartTunnels = settings.value.autoStartTunnels.filter(
      (id) => id !== proxyId,
    );
  }
  message.success("自启动隧道设置已更新");
  saveSettings();
};

// 处理启动延迟变化
const handleStartupDelayChange = (value: number | null) => {
  if (value !== null) {
    saveSettings();
  }
};

// 处理最小化到托盘变化
const handleMinimizeToTrayChange = async (value: boolean) => {
  try {
    await invoke("set_minimize_to_tray", { minimizeToTray: value });
    message.success(value ? "已开启最小化到托盘" : "已关闭最小化到托盘");
    saveSettings();
  } catch (error) {
    message.error("设置最小化到托盘失败");
    settings.value.minimizeToTray = !value; // 回滚
  }
};

// 处理显示广告变化
const handleShowAdChange = async (value: boolean) => {
  const settingsStore = useSettingsStore();
  await settingsStore.updateSetting('showAd', value);
  message.success(value ? "已开启侧边栏广告" : "已关闭侧边栏广告");
};

// 处理隐藏 WebUI 入口变化
const handleHideWebuiEntryChange = async (value: boolean) => {
  const settingsStore = useSettingsStore();
  await settingsStore.updateSetting('hideWebuiEntry', value);
  message.success(value ? "已隐藏 WebUI 入口" : "已显示 WebUI 入口");
};

// 处理侧边栏宽度变化（带防抖）
const handleSidebarWidthChange = (value: number | null) => {
  if (value === null) return;
  
  // 立即更新本地显示和 store（触发动画）
  uiSettings.value.sidebarWidth = value;
  // 直接更新 store 的响应式值，触发 Sidebar 组件立即响应
  if (value >= 150 && value <= 300) {
    uiStore.$patch({ sidebarWidth: value });
  }
  
  // 清除之前的定时器
  if (sidebarWidthDebounceTimer !== null) {
    clearTimeout(sidebarWidthDebounceTimer);
  }
  
  // 设置新的定时器，300ms 后保存到配置文件（与侧栏动画时长一致）
  sidebarWidthDebounceTimer = window.setTimeout(async () => {
    try {
      // 只保存，不再更新 store（已经更新过了）
      await uiStore.saveSidebarSettings();
      message.success(`侧边栏宽度已设置为 ${value}px`);
    } catch (error) {
      message.error('保存侧边栏宽度失败');
      console.error('保存侧边栏宽度失败:', error);
      // 保存失败时回滚
      await uiStore.loadSidebarSettings();
      uiSettings.value.sidebarWidth = uiStore.sidebarWidth;
    }
  }, 300);
};

// 处理侧边栏收缩功能变化
const handleSidebarCollapsibleChange = async (value: boolean) => {
  try {
    await uiStore.updateSidebarCollapsible(value);
    message.success(value ? "已开启侧边栏收缩功能" : "已关闭侧边栏收缩功能");
  } catch (error) {
    message.error('保存侧边栏收缩设置失败');
    console.error('保存侧边栏收缩设置失败:', error);
  }
};

// 保存设置
const saveSettings = async () => {
  try {
    const currentConfig = await loadUnifiedConfig();

    // 更新设置部分（不包含 theme，theme 由前端管理）
    const updatedConfig: UnifiedConfig = {
      ...currentConfig,
      autoStart: settings.value.autoStart,
      alwaysOnTop: settings.value.alwaysOnTop,
      autoUpdate: settings.value.autoUpdate,
      autoStartTunnels: settings.value.autoStartTunnels,
      startupDelay: settings.value.startupDelay,
      minimizeToTray: settings.value.minimizeToTray,
      showAd: settings.value.showAd,
      hideWebuiEntry: settings.value.hideWebuiEntry,
    };

    await saveUnifiedConfig(updatedConfig);

    // theme 保存到 localStorage
    localStorage.setItem("mefrp_theme", settings.value.theme);
  } catch (error) {
    console.error("保存设置失败:", error);
  }
};

// 加载设置
const loadSettings = async () => {
  try {
    const unifiedConfig = await loadUnifiedConfig();
    if (unifiedConfig) {
      settings.value = {
        autoStart: unifiedConfig.autoStart || false,
        alwaysOnTop: unifiedConfig.alwaysOnTop || false,
        autoUpdate:
          unifiedConfig.autoUpdate !== undefined
            ? unifiedConfig.autoUpdate
            : true,
        autoStartTunnels: unifiedConfig.autoStartTunnels || [],
        startupDelay: unifiedConfig.startupDelay || 5,
        theme: localStorage.getItem("mefrp_theme") || "dark",
        minimizeToTray:
          unifiedConfig.minimizeToTray !== undefined
            ? unifiedConfig.minimizeToTray
            : true,
        showAd:
          unifiedConfig.showAd !== undefined ? unifiedConfig.showAd : true,
        hideWebuiEntry:
          unifiedConfig.hideWebuiEntry !== undefined
            ? unifiedConfig.hideWebuiEntry
            : false,
      };
    }

    // 同步开机自启动状态
    try {
      const isEnabled = await invoke<boolean>("is_auto_start_enabled");
      settings.value.autoStart = isEnabled;
      // 如果配置文件中的状态与实际状态不一致，更新配置文件
      if (unifiedConfig && unifiedConfig.autoStart !== isEnabled) {
        saveSettings();
      }
    } catch (error) {
      console.error("检查开机自启动状态失败:", error);
    }

    // 同步最小化到托盘设置到后端
    try {
      await invoke("set_minimize_to_tray", {
        minimizeToTray: settings.value.minimizeToTray,
      });
    } catch (error) {
      console.error("同步最小化到托盘设置失败:", error);
    }
  } catch (error) {
    console.error("加载设置失败:", error);
  }
};

// 加载隧道列表
const loadTunnels = async () => {
  tunnelLoading.value = true;
  try {
    const result = await invokeTauriResponse<{ proxies?: Tunnel[] } | Tunnel[]>("api_get_tunnel_list");

    if (result.code === 200) {
      const tunnelData = extractProxyList(result.data);
      tunnels.value = tunnelData;

      // 清理无效的自启动隧道ID
      const validTunnelIds = tunnelData.map(
        (tunnel: Tunnel) => tunnel.proxyId,
      );
      const originalCount = settings.value.autoStartTunnels.length;
      settings.value.autoStartTunnels = settings.value.autoStartTunnels.filter(
        (id) => validTunnelIds.includes(id),
      );

      // 如果清理了无效ID，保存设置并提示用户
      if (originalCount !== settings.value.autoStartTunnels.length) {
        const removedCount =
          originalCount - settings.value.autoStartTunnels.length;
        message.warning(`已自动清理 ${removedCount} 个无效的自启动隧道配置`);
        saveSettings();
      }

      // 更新隧道选项（保留兼容性）
      tunnelOptions.value = tunnelData.map((tunnel: Tunnel) => ({
        label: `${tunnel.proxyName} (ID: ${tunnel.proxyId})`,
        value: tunnel.proxyId,
      }));
      console.log(`成功加载 ${tunnelData.length} 个隧道`);
    } else {
      console.error("获取隧道列表失败:", result.message);
      message.error(result.message || "获取隧道列表失败");
    }
  } catch (error) {
    console.error("加载隧道列表失败:", error);
    message.error("加载隧道列表失败，请检查网络连接");
  } finally {
    tunnelLoading.value = false;
  }
};

// 刷新隧道列表
const refreshTunnels = async () => {
  await loadTunnels();
  message.success("隧道列表已刷新");
};

// 全选隧道
const selectAllTunnels = () => {
  const enabledTunnels = tunnels.value.filter((tunnel) => !tunnel.isDisabled);
  const allEnabledIds = enabledTunnels.map((tunnel) => tunnel.proxyId);

  // 先清理无效的隧道ID，然后添加所有可用的隧道
  const validExistingIds = settings.value.autoStartTunnels.filter((id) =>
    tunnels.value.some((tunnel) => tunnel.proxyId === id),
  );

  // 合并有效的现有选择和所有可用隧道，去重
  const newSelection = [...new Set([...validExistingIds, ...allEnabledIds])];
  settings.value.autoStartTunnels = newSelection;

  message.success(`已选择 ${enabledTunnels.length} 个可用隧道`);
  saveSettings();
};

// 清空所有选择
const clearAllTunnels = () => {
  settings.value.autoStartTunnels = [];
  message.success("已清空所有自启动隧道选择");
  saveSettings();
};

// 获取隧道在自启动列表中的索引
const getAutoStartIndex = (proxyId: number) => {
  return settings.value.autoStartTunnels.indexOf(proxyId);
};

// 向上移动隧道
const moveTunnelUp = (tunnelId: number) => {
  const index = settings.value.autoStartTunnels.indexOf(tunnelId);
  if (index > 0) {
    const tunnels = [...settings.value.autoStartTunnels];
    [tunnels[index], tunnels[index - 1]] = [tunnels[index - 1], tunnels[index]];
    settings.value.autoStartTunnels = tunnels;
    message.success("启动顺序已调整");
    saveSettings();
  }
};

// 向下移动隧道
const moveTunnelDown = (tunnelId: number) => {
  const index = settings.value.autoStartTunnels.indexOf(tunnelId);
  if (index >= 0 && index < settings.value.autoStartTunnels.length - 1) {
    const tunnels = [...settings.value.autoStartTunnels];
    [tunnels[index], tunnels[index + 1]] = [tunnels[index + 1], tunnels[index]];
    settings.value.autoStartTunnels = tunnels;
    message.success("启动顺序已调整");
    saveSettings();
  }
};

// 删除已删除隧道的配置
const removeDeletedTunnelConfig = (tunnelId: number) => {
  const index = settings.value.autoStartTunnels.indexOf(tunnelId);
  if (index > -1) {
    settings.value.autoStartTunnels.splice(index, 1);
    message.success(`已删除隧道 ${tunnelId} 的自启动配置`);
    saveSettings();
  }
};

onMounted(async () => {
  loadSettings();
  loadTunnels();
  
  // 加载 UI 设置
  await uiStore.loadSidebarSettings();
  uiSettings.value.sidebarWidth = uiStore.sidebarWidth;
  uiSettings.value.sidebarCollapsible = uiStore.sidebarCollapsible;
});
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

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text-color);
}

.section-header :deep(svg) {
  color: #349ff4;
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

/* 滑块控制样式 */
.slider-control {
  display: flex;
  align-items: center;
  gap: 16px;
}

.slider-value {
  color: #349ff4;
  font-size: 14px;
  font-weight: 500;
  min-width: 60px;
  text-align: right;
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
