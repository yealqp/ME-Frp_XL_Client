<template>
  <n-layout-sider
    :class="['sidebar']"
    bordered
    collapse-mode="width"
    :collapsed-width="64"
    :width="sidebarWidth"
    :collapsed="sidebarCollapsed"
    :show-trigger="false"
    :native-scrollbar="false"
    @collapse="handleCollapse"
    @expand="handleExpand"
  >
      <div class="sidebar-header">
        <NavLogo :hide-text="sidebarCollapsed" @click="handleLogoClick" />
      </div>

      <div class="nav-content">
        <n-menu
          :options="menuOptions"
          :value="activeNav"
          :inverted="!isLightMode"
          @update:value="onMenuSelect"
          :collapsed="sidebarCollapsed"
          :collapsed-width="64"
          :collapsed-icon-size="20"
          :indent="24"
        />
      </div>

      <div class="sidebar-footer">
      </div>
  </n-layout-sider>
</template>

<script setup lang="ts">
import { h, computed } from "vue";
import { NIcon, NLayoutSider, useDialog } from "naive-ui";
import type { MenuOption } from "naive-ui";
import { storeToRefs } from "pinia";
import { LogOut } from "@lucide/vue";
import { useUIStore } from "@/stores/ui";
import { useThemeStore } from "@/stores/theme";
import { useNav } from "@/composables/useNav";
import NavLogo from "@/components/common/NavLogo.vue";

const emit = defineEmits<{
  logout: [];
  "toggle-sidebar": [collapsed: boolean];
}>();

const dialog = useDialog();

const uiStore = useUIStore();
const { sidebarWidth, sidebarCollapsed } = storeToRefs(uiStore);

const themeStore = useThemeStore();
const { isLightMode } = storeToRefs(themeStore);

const { activeNav, filteredNavItems, handleMenuSelect, handleLogoClick } = useNav();

function handleCollapse() {
  uiStore.setSidebarCollapsed(true);
  emit("toggle-sidebar", true);
}

function handleExpand() {
  uiStore.setSidebarCollapsed(false);
  emit("toggle-sidebar", false);
}

function onMenuSelect(key: string) {
  if (key === "logout") {
    dialog.error({
      title: "退出登录",
      content: "确定要退出登录吗？",
      positiveText: "确定",
      negativeText: "取消",
      onPositiveClick: () => {
        emit("logout");
      },
    });
    return;
  }
  handleMenuSelect(key);
}

const menuOptions = computed<MenuOption[]>(() => [
  ...filteredNavItems.value.map((item) => ({
    label: item.name,
    key: item.id,
    icon: () => h(NIcon, { size: 18 }, { default: () => h(item.icon) }),
  })),
  {
    type: "divider",
    key: "divider-before-logout",
  },
  {
    label: () =>
      h(
        "span",
        { style: { color: "var(--app-error-color)" } },
        "退出登录",
      ),
    key: "logout",
    icon: () =>
      h(
        NIcon,
        { size: 18, color: "var(--app-error-color)" },
        { default: () => h(LogOut) },
      ),
  },
]);
</script>

<style scoped>
.sidebar {
  position: relative;
  background: transparent !important;
  color: var(--app-text-color);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: visible;
  z-index: 12;
}

.sidebar::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--app-card-color);
  opacity: var(--app-sidebar-opacity, 1);
  pointer-events: none;
  z-index: 0;
}

/* 侧边栏宽度变化 - 保留收起展开动画 */
:deep(.n-layout-sider) {
  background: transparent !important;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  will-change: width;
  z-index: 12 !important;
}

:deep(.n-layout-sider-scroll-container),
:deep(.n-layout-sider-content) {
  position: relative;
  z-index: 1;
  background: transparent !important;
}

:deep(.n-layout-sider__border) {
  display: none !important;
}

:deep(.n-layout-sider-scroll-container) {
  transition: none;
  overflow: hidden !important;
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.n-layout-sider-scroll-container .n-scrollbar-rail--vertical) {
  display: none !important;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--app-border-color);
  background-color: transparent;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 68px;
  overflow: hidden;
}

/* 收缩状态下调整 header padding */
:deep(.n-layout-sider--collapsed) .sidebar-header {
  padding: 20px 8px;
}

.nav-content {
  flex: 1;
  min-height: 0;
  padding: 10px 0;
  background-color: transparent;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-footer {
  margin-top: auto;
  padding: 20px;
  border-top: 1px solid var(--app-border-color);
  background-color: transparent;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 收缩状态下调整 footer padding */
:deep(.n-layout-sider--collapsed) .sidebar-footer {
  padding: 20px 8px;
}

/* 自定义Naive UI Menu样式 */
:deep(.n-menu) {
  background-color: transparent !important;
  padding: 0 !important;
}

/* 菜单项容器 - 使用固定的 margin 和 padding */
:deep(.n-menu .n-menu-item) {
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  margin-left: 12px !important;
  margin-right: 12px !important;
  border-radius: 6px;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
              margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  height: 44px;
  overflow: hidden;
  flex-shrink: 0;
}

/* 收缩状态下的菜单项 - 只改变水平 margin */
:deep(.n-menu--collapsed .n-menu-item) {
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  margin-left: 8px !important;
  margin-right: 8px !important;
  height: 44px;
}

/* 选中状态 - 与 hover 背景一致，文字为主题色 */
:deep(.n-menu .n-menu-item--selected) {
  background-color: color-mix(in srgb, var(--app-primary-color) 10%, transparent) !important;
}

:deep(.n-menu .n-menu-item--selected .n-menu-item-content-header) {
  color: var(--app-primary-color) !important;
}

:deep(.n-menu .n-menu-item--selected .n-icon) {
  color: var(--app-primary-color) !important;
}

/* hover 状态 */
:deep(.n-menu .n-menu-item:hover:not(.n-menu-item--selected)) {
  background-color: color-mix(in srgb, var(--app-primary-color) 6%, transparent) !important;
}

/* 菜单项内容 - 使用相对定位作为参考点 */
:deep(.n-menu .n-menu-item-content) {
  position: relative !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 44px !important;
  padding: 12px 16px !important;
  display: flex !important;
  align-items: center !important;
  background: transparent !important;
  transition: padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
              padding-right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 收缩状态下的菜单项内容 - 保持相同的垂直 padding */
:deep(.n-menu--collapsed .n-menu-item-content) {
  padding: 12px !important;
  justify-content: center !important;
}

/* 图标容器 - 固定尺寸，强制锁定垂直位置 */
:deep(.n-menu .n-menu-item-content__icon) {
  width: 20px !important;
  height: 20px !important;
  font-size: 18px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0 !important;
  margin-right: 12px !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  transition: margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  transform: translateY(0) !important;
  line-height: 20px !important;
}

/* 收缩状态下图标居中 - 强制保持垂直位置 */
:deep(.n-menu--collapsed .n-menu-item-content__icon) {
  margin-right: 0 !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  transform: translateY(0) !important;
}

/* NIcon 组件 - 锁定位置 */
:deep(.n-menu .n-menu-item-content__icon .n-icon) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 18px !important;
  height: 18px !important;
  transform: translateY(0) !important;
  margin: 0 !important;
  padding: 0 !important;
}

:deep(.n-menu--collapsed .n-menu-item-content__icon .n-icon) {
  transform: translateY(0) !important;
}

/* 图标内部的 SVG - 确保不会移动 */
:deep(.n-menu .n-menu-item-content__icon svg) {
  display: block !important;
  width: 18px !important;
  height: 18px !important;
  transform: translateY(0) !important;
  margin: 0 !important;
  padding: 0 !important;
  vertical-align: baseline !important;
}

:deep(.n-menu--collapsed .n-menu-item-content__icon svg) {
  transform: translateY(0) !important;
}

/* 文字标签 */
:deep(.n-menu .n-menu-item-content-header) {
  font-size: 14px !important;
  font-weight: 500 !important;
  line-height: 20px !important;
  flex: 1 !important;
  opacity: 1;
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  overflow: hidden;
}

/* 收缩状态下隐藏文字 */
:deep(.n-menu--collapsed .n-menu-item-content-header) {
  opacity: 0;
  width: 0;
}

/* 分割线样式 - 固定高度和垂直边距,使用 flex 确保不影响布局 */
:deep(.n-menu .n-menu-divider) {
  margin-top: 8px !important;
  margin-bottom: 8px !important;
  margin-left: 12px !important;
  margin-right: 12px !important;
  background-color: var(--app-divider-color) !important;
  height: 1px !important;
  min-height: 1px !important;
  max-height: 1px !important;
  flex-shrink: 0 !important;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 收缩状态下的分割线 - 只改变水平边距 */
:deep(.n-menu--collapsed .n-menu-divider) {
  margin-top: 8px !important;
  margin-bottom: 8px !important;
  margin-left: 8px !important;
  margin-right: 8px !important;
}

/* 移除所有伪元素蒙层 */
:deep(.n-menu-item-content::before),
:deep(.n-menu-item-content::after),
:deep(.n-menu-item::before),
:deep(.n-menu-item::after) {
  display: none !important;
}

/* 移除 Naive UI 的波纹和加载效果 */
:deep(.n-base-wave),
:deep(.n-base-loading),
:deep(.n-base-select-option__check) {
  display: none !important;
}
</style>
