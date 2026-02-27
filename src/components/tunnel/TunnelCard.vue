<template>
  <n-card
    :bordered="true"
    :class="['tunnel-card', { 'menu-open': showMoreMenu || isMenuClosing }]"
    hoverable
  >
    <!-- 卡片头部 -->
    <template #header>
      <div class="tunnel-header">
        <div class="tunnel-title">
          <h3 class="tunnel-name">{{ tunnel.proxyName }}</h3>
          <div class="status-tags">
            <n-tag
              v-if="tunnel.isDisabled"
              type="warning"
              :bordered="false"
              size="small"
              class="disabled-tag"
            >
              已禁用
            </n-tag>
            <n-tag
              :type="tunnel.isOnline ? 'success' : 'default'"
              :bordered="false"
              size="small"
              class="status-tag"
            >
              {{ tunnel.isOnline ? "在线" : "离线" }}
            </n-tag>
          </div>
        </div>
      </div>
    </template>

    <!-- 卡片内容 -->
    <div class="tunnel-content">
      <div class="tunnel-info">
        <div class="info-row">
          <span class="info-label">ID:</span>
          <n-tag type="info" :bordered="false" size="small">
            # {{ tunnel.proxyId }}
          </n-tag>
        </div>
        <div class="info-row">
          <span class="info-label">协议:</span>
          <span class="info-value">{{
            tunnel.proxyType.toUpperCase()
          }}</span>
        </div>
        <div
          class="info-row"
          v-if="tunnel.proxyType === 'tcp' || tunnel.proxyType === 'udp'"
        >
          <span class="info-label">远程端口:</span>
          <span class="info-value">{{ tunnel.remotePort }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">节点:</span>
          <span class="info-value">
            #{{ tunnel.nodeId }} -
            {{ nodeNameMap[tunnel.nodeId] || "未知节点" }}
          </span>
        </div>
        <div class="info-row" v-if="tunnel.domain">
          <span class="info-label">域名:</span>
          <span class="info-value">{{ tunnel.domain }}</span>
        </div>
      </div>
    </div>

    <!-- 卡片底部操作 -->
    <template #action>
      <div class="tunnel-actions">
        <!-- 未启动时：所有按钮在同一行 -->
        <div v-if="!isRunning" class="tunnel-actions-row">
          <n-button
            type="primary"
            size="small"
            @click="emit('start', tunnel.proxyId)"
            :loading="isLoading"
          >
            <template #icon>
              <Play :size="14" />
            </template>
            启动
          </n-button>
          <n-button
            type="default"
            size="small"
            @click="emit('copy-address', tunnel.proxyId)"
          >
            <template #icon>
              <Copy :size="14" />
            </template>
            复制地址
          </n-button>
          <div class="more-dropdown-wrapper">
            <n-button
              type="default"
              size="small"
              @click="toggleMoreMenu"
            >
              <template #icon>
                <SettingsIcon :size="14" />
              </template>
              更多
            </n-button>
            <transition name="dropdown-fade">
              <div
                v-if="showMoreMenu"
                :class="['more-dropdown-menu', menuPosition === 'top' ? 'menu-top' : 'menu-bottom']"
                @click.stop
              >
                <template v-for="option in moreOptions" :key="option.key">
                  <div v-if="option.type === 'divider'" class="dropdown-divider"></div>
                  <div
                    v-else
                    class="dropdown-item"
                    @click="handleMoreOptionClick(option.key)"
                  >
                    <component :is="option.icon" class="dropdown-icon" />
                    <span class="dropdown-label">{{ option.label }}</span>
                  </div>
                </template>
              </div>
            </transition>
          </div>
        </div>

        <!-- 启动后：第一行3个按钮，第二行更多按钮独占 -->
        <template v-else>
          <div class="tunnel-actions-row">
            <n-button
              type="warning"
              size="small"
              @click="emit('stop', tunnel.proxyId)"
              :loading="isLoading"
            >
              <template #icon>
                <Square :size="14" />
              </template>
              停止
            </n-button>
            <n-button
              type="info"
              size="small"
              @click="emit('view-logs', tunnel.proxyId)"
            >
              <template #icon>
                <FileText :size="14" />
              </template>
              日志
            </n-button>
            <n-button
              type="default"
              size="small"
              @click="emit('copy-address', tunnel.proxyId)"
            >
              <template #icon>
                <Copy :size="14" />
              </template>
              复制地址
            </n-button>
          </div>

          <div class="tunnel-actions-row tunnel-actions-row-second">
            <n-button
              type="default"
              size="small"
              @click="toggleMoreMenu"
              class="more-button-full"
            >
              <template #icon>
                <SettingsIcon :size="14" />
              </template>
              更多
            </n-button>
            <div class="more-dropdown-wrapper">
              <transition name="dropdown-fade">
                <div
                  v-if="showMoreMenu"
                  :class="['more-dropdown-menu', menuPosition === 'top' ? 'menu-top' : 'menu-bottom']"
                  @click.stop
                >
                  <template v-for="option in moreOptions" :key="option.key">
                    <div v-if="option.type === 'divider'" class="dropdown-divider"></div>
                    <div
                      v-else
                      class="dropdown-item"
                      @click="handleMoreOptionClick(option.key)"
                    >
                      <component :is="option.icon" class="dropdown-icon" />
                      <span class="dropdown-label">{{ option.label }}</span>
                    </div>
                  </template>
                </div>
              </transition>
            </div>
          </div>
        </template>
      </div>
    </template>
  </n-card>
</template>

<script setup lang="ts">
import { h, ref, computed, onMounted, onUnmounted } from "vue";
import { NIcon } from "naive-ui";
import {
  Play,
  Square,
  FileText,
  Copy,
  Info,
  Settings as SettingsIcon,
  Edit,
  FileCode,
  Rocket,
  FileOutput,
  PlayCircle,
  PauseCircle,
  LogOut,
  Trash2,
} from "lucide-vue-next";

interface Tunnel {
  proxyId: number;
  username: string;
  proxyName: string;
  proxyType: string;
  isBanned: boolean;
  isDisabled: boolean;
  localIp: string;
  localPort: number;
  remotePort: number;
  nodeId: number;
  runId: string;
  isOnline: boolean;
  domain: string;
  lastStartTime: number;
  lastCloseTime: number;
  clientVersion: string;
  proxyProtocolVersion: string;
  useEncryption: boolean;
  useCompression: boolean;
  location: string;
  accessKey: string;
  hostHeaderRewrite: string;
  headerXFromWhere: string;
  httpUser?: string;
  httpPassword?: string;
  crtPath?: string;
  keyPath?: string;
  transportProtocol?: string;
}

interface MoreMenuOption {
  label?: string;
  key: string;
  icon?: any;
  type?: 'divider';
}

interface Props {
  tunnel: Tunnel;
  nodeNameMap: Record<number, string>;
  nodeHostnameMap: Record<number, string>;
  isRunning: boolean;
  isLoading: boolean;
  usingConfigFile: boolean;
}

interface Emits {
  (e: 'start', tunnelId: number): void;
  (e: 'stop', tunnelId: number): void;
  (e: 'view-logs', tunnelId: number): void;
  (e: 'view-details', tunnelId: number): void;
  (e: 'copy-address', tunnelId: number): void;
  (e: 'more-action', action: string, tunnelId: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 更多菜单状态
const showMoreMenu = ref(false);
const menuPosition = ref<'top' | 'bottom'>('bottom');
const isMenuClosing = ref(false); // 菜单正在关闭的状态

// 计算更多菜单选项
const moreOptions = computed<MoreMenuOption[]>(() => {
  const options: MoreMenuOption[] = [
    {
      label: "详情",
      key: "view-details",
      icon: () => h(NIcon, null, { default: () => h(Info, { size: 16 }) }),
    },
    {
      label: "编辑",
      key: "edit",
      icon: () => h(NIcon, null, { default: () => h(Edit, { size: 16 }) }),
    },
    {
      type: "divider",
      key: "d1",
    },
  ];

  if (props.usingConfigFile) {
    options.push(
      {
        label: "配置文件",
        key: "view-config",
        icon: () => h(NIcon, null, { default: () => h(FileCode, { size: 16 }) }),
      },
      {
        label: "改用快速启动",
        key: "use-quick-start",
        icon: () => h(NIcon, null, { default: () => h(Rocket, { size: 16 }) }),
      },
    );
  } else {
    options.push({
      label: "改用配置文件",
      key: "use-config",
      icon: () => h(NIcon, null, { default: () => h(FileOutput, { size: 16 }) }),
    });
  }

  options.push(
    {
      type: "divider",
      key: "d2",
    },
    {
      label: props.tunnel.isDisabled ? "启用隧道" : "禁用隧道",
      key: props.tunnel.isDisabled ? "enable" : "disable",
      icon: () =>
        h(NIcon, null, {
          default: () => h(props.tunnel.isDisabled ? PlayCircle : PauseCircle, { size: 16 }),
        }),
    },
    {
      label: "强制下线",
      key: "kick",
      icon: () => h(NIcon, null, { default: () => h(LogOut, { size: 16 }) }),
    },
    {
      type: "divider",
      key: "d3",
    },
    {
      label: "删除隧道",
      key: "delete",
      icon: () =>
        h(NIcon, { style: { color: "#d03050" } }, { default: () => h(Trash2, { size: 16 }) }),
    },
  );

  return options;
});

// 切换更多菜单
function toggleMoreMenu(event: MouseEvent) {
  event.stopPropagation();
  
  if (showMoreMenu.value) {
    // 关闭菜单
    showMoreMenu.value = false;
    isMenuClosing.value = true;
    
    // 延迟恢复 z-index，等待动画完成
    setTimeout(() => {
      isMenuClosing.value = false;
    }, 200); // 与动画时长一致
  } else {
    // 打开菜单
    isMenuClosing.value = false;
    
    // 计算菜单应该显示在上方还是下方
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const menuHeight = 400; // 估算菜单高度
    const spaceBelow = windowHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // 如果下方空间不足且上方空间更多，则显示在上方
    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      menuPosition.value = 'top';
    } else {
      menuPosition.value = 'bottom';
    }
    
    showMoreMenu.value = true;
  }
}

// 处理更多菜单选项点击
function handleMoreOptionClick(action: string) {
  showMoreMenu.value = false;
  isMenuClosing.value = true;
  
  // 延迟恢复 z-index
  setTimeout(() => {
    isMenuClosing.value = false;
  }, 200);
  
  // 特殊处理详情按钮
  if (action === 'view-details') {
    emit('view-details', props.tunnel.proxyId);
  } else {
    emit('more-action', action, props.tunnel.proxyId);
  }
}

// 点击外部关闭菜单
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.more-dropdown-wrapper')) {
    if (showMoreMenu.value) {
      showMoreMenu.value = false;
      isMenuClosing.value = true;
      
      setTimeout(() => {
        isMenuClosing.value = false;
      }, 200);
    }
  }
}

// 监听点击外部事件
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

// 清理事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* 确保下拉框不被裁剪 */
.tunnel-card {
  overflow: visible !important;
  position: relative;
  z-index: 1;
}

/* 当下拉菜单打开时，提升卡片层级 */
.tunnel-card.menu-open {
  z-index: 100 !important;
}

.tunnel-card :deep(.n-card) {
  overflow: visible !important;
}

.tunnel-card :deep(.n-card__content) {
  overflow: visible !important;
}

.tunnel-card :deep(.n-card__action) {
  overflow: visible !important;
  position: relative;
  z-index: 1;
}

.tunnel-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tunnel-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.status-tags {
  display: flex;
  gap: 8px;
  align-items: center;
}

.disabled-tag {
  background-color: #faad14 !important;
  color: white !important;
}

.status-tag {
  margin-left: 0;
}

.tunnel-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.info-label {
  font-size: 12px;
  min-width: 70px;
  color: var(--n-text-color-depth-3);
}

.info-value {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: flex-end;
}

.tunnel-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tunnel-actions-row {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  align-items: center;
}

.tunnel-actions-row-second {
  width: 100%;
  position: relative;
}

.tunnel-actions-row .n-button {
  flex: 1;
  min-width: 80px;
}

.tunnel-actions-row-second .n-button {
  width: 100%;
}

.more-button-full {
  width: 100% !important;
  flex: none !important;
}

.tunnel-actions :deep(.n-button__content) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.tunnel-actions :deep(.n-button__icon) {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
}

/* 自定义下拉菜单 */
.more-dropdown-wrapper {
  position: relative;
  display: inline-block;
  flex: 1;
  min-width: 80px;
}

.tunnel-actions-row-second .more-dropdown-wrapper {
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.more-dropdown-menu {
  position: absolute;
  right: 0;
  min-width: 160px;
  max-height: 400px;
  overflow-y: auto;
  background-color: var(--app-card-color);
  border-radius: 3px;
  box-shadow: var(--app-box-shadow-2);
  border: 1px solid var(--app-border-color);
  padding: 4px 0;
  z-index: 10000;
  pointer-events: auto;
}

.more-dropdown-menu.menu-bottom {
  top: calc(100% + 4px);
}

.more-dropdown-menu.menu-top {
  bottom: calc(100% + 4px);
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: var(--app-text-color);
  font-size: 14px;
}

.dropdown-item:hover {
  background-color: var(--app-card-color);
  filter: brightness(1.1);
}

.dropdown-divider {
  height: 1px;
  background-color: var(--app-divider-color);
  margin: 4px 0;
}

.dropdown-icon {
  margin-right: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.dropdown-label {
  flex: 1;
}

/* 下拉菜单动画 */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tunnel-actions {
    flex-direction: column;
  }

  .tunnel-actions-row {
    width: 100%;
  }

  .tunnel-actions-row .n-button {
    flex: none;
  }

  .tunnel-actions-row-second .n-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .info-value {
    justify-content: flex-start;
  }
}
</style>
