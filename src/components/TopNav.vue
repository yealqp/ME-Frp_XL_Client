<template>
  <div :class="['top-nav', { 'top-nav--compact': compact }]">
    <div class="top-nav-inner">
      <div class="top-nav-brand" @click="handleLogoClick">
        <img
          src="../assets/icon.png"
          alt="logo"
          class="top-nav-logo"
        />
        <span class="top-nav-brand-text">XL Client</span>
      </div>

      <nav class="top-nav-menu">
        <button
          v-for="item in filteredNavItems"
          :key="item.id"
          :class="['top-nav-item', { active: activeNav === item.id }]"
          :title="item.name"
          @click="handleMenuSelect(item.id)"
        >
          <NIcon :size="18"><component :is="item.icon" /></NIcon>
          <span class="top-nav-item-label">{{ item.name }}</span>
        </button>
      </nav>

      <div class="top-nav-actions">
        <button
          class="top-nav-item top-nav-item--logout"
          title="退出登录"
          @click="handleLogoutClick"
        >
          <NIcon :size="18" color="var(--app-error-color)">
            <LogOut />
          </NIcon>
          <span class="top-nav-item-label" style="color: var(--app-error-color)">退出登录</span>
        </button>
        <button
          class="top-nav-compact-toggle"
          :title="compact ? '展开导航' : '收起导航'"
          @click="toggleCompact"
        >
          <NIcon :size="16">
            <component :is="compact ? ChevronDown : ChevronUp" />
          </NIcon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { invoke } from "@tauri-apps/api/core";
import { NIcon, useDialog } from "naive-ui";
import { storeToRefs } from "pinia";
import { LogOut, ChevronDown, ChevronUp } from "@lucide/vue";
import { useSettingsStore } from "../stores/settings";
import { navItems, pathToNav, navToPath } from "../config/navigation";

const router = useRouter();
const route = useRoute();
const dialog = useDialog();

const settingsStore = useSettingsStore();
const { settings } = storeToRefs(settingsStore);

const compact = ref(false);

const emit = defineEmits<{
  logout: [];
}>();

const activeNav = computed(() => {
  return pathToNav.hasOwnProperty(route.path) ? pathToNav[route.path] : null;
});

const filteredNavItems = computed(() => {
  return navItems.filter(item => {
    if (item.id === 'mefrp-webui' && settings.value.hideWebuiEntry) {
      return false;
    }
    return true;
  });
});

function toggleCompact() {
  compact.value = !compact.value;
}

async function handleLogoClick() {
  try {
    await invoke('open_url', {
      url: 'https://www.mefrp.com/dashboard/home'
    });
  } catch (error) {
    console.error('打开官网失败:', error);
  }
}

function handleMenuSelect(key: string) {
  if (key === 'logout') {
    return;
  }

  const path = navToPath[key];
  if (path) {
    router.push(path);
  }
}

function handleLogoutClick() {
  dialog.error({
    title: '退出登录',
    content: '确定要退出登录吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      emit('logout');
    }
  });
}
</script>

<style scoped>
.top-nav {
  width: 100%;
  height: 56px;
  background: transparent;
  border-bottom: 1px solid var(--app-border-color);
  position: relative;
  z-index: 13;
}

.top-nav::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--app-card-color);
  opacity: var(--app-sidebar-opacity, 1);
  pointer-events: none;
}

.top-nav-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 16px;
  gap: 8px;
}

.top-nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.top-nav-brand:hover {
  background-color: color-mix(in srgb, var(--app-primary-color) 6%, transparent);
}

.top-nav-logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
  flex-shrink: 0;
}

.top-nav-brand-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--app-primary-color);
  white-space: nowrap;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}


.top-nav-menu {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  overflow: hidden;
}

.top-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--app-text-color);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s ease, color 0.2s ease;
  flex-shrink: 0;
}

.top-nav-item:hover {
  background-color: color-mix(in srgb, var(--app-primary-color) 6%, transparent);
}

.top-nav-item.active {
  background-color: color-mix(in srgb, var(--app-primary-color) 10%, transparent);
  color: var(--app-primary-color);
}

.top-nav-item--logout:hover {
  background-color: color-mix(in srgb, var(--app-error-color) 10%, transparent);
}

.top-nav-item-label {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.top-nav--compact .top-nav-item-label {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.top-nav--compact .top-nav-item {
  padding: 0 8px;
  gap: 0;
}

.top-nav-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.top-nav-compact-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--app-text-color-2);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
  flex-shrink: 0;
}

.top-nav-compact-toggle:hover {
  background-color: color-mix(in srgb, var(--app-primary-color) 6%, transparent);
  color: var(--app-text-color);
}
</style>
