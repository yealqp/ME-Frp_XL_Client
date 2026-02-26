/**
 * ThemeSwitcher Component
 * 
 * 主题切换器组件，提供用户界面以切换主题模式
 * 支持三种显示模式：dropdown（下拉菜单）、buttons（按钮组）、icon（图标按钮）
 * 
 * Requirements: 2.4, 4.4, 5.1, 5.2, 5.3, 5.4
 */

<template>
  <div :class="['theme-switcher', props.class]">
    <!-- Dropdown 模式 -->
    <n-dropdown
      v-if="props.mode === 'dropdown'"
      trigger="click"
      :options="dropdownOptions"
      @select="handleSelect"
    >
      <n-button>
        <template #icon>
          <n-icon :component="currentIcon" />
        </template>
        <span v-if="props.showLabel">{{ currentLabel }}</span>
      </n-button>
    </n-dropdown>

    <!-- Buttons 模式 -->
    <n-button-group v-else-if="props.mode === 'buttons'">
      <n-button
        :type="themeStore.mode === 'light' ? 'primary' : 'default'"
        @click="handleModeChange('light')"
      >
        <template #icon>
          <n-icon :component="Sun" />
        </template>
        <span v-if="props.showLabel">浅色</span>
      </n-button>
      <n-button
        :type="themeStore.mode === 'dark' ? 'primary' : 'default'"
        @click="handleModeChange('dark')"
      >
        <template #icon>
          <n-icon :component="Moon" />
        </template>
        <span v-if="props.showLabel">深色</span>
      </n-button>
      <n-button
        :type="themeStore.mode === 'system' ? 'primary' : 'default'"
        @click="handleModeChange('system')"
      >
        <template #icon>
          <n-icon :component="Monitor" />
        </template>
        <span v-if="props.showLabel">跟随系统</span>
      </n-button>
    </n-button-group>

    <!-- Icon 模式 -->
    <n-button
      v-else-if="props.mode === 'icon'"
      @click="handleToggle"
      circle
    >
      <template #icon>
        <n-icon :component="currentIcon" />
      </template>
    </n-button>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue';
import { NButton, NButtonGroup, NDropdown, NIcon } from 'naive-ui';
import { Sun, Moon, Monitor } from 'lucide-vue-next';
import { useThemeStore } from '@/stores/theme';
import type { ThemeMode } from '@/types/theme';
import type { DropdownOption } from 'naive-ui';

/**
 * 组件 Props
 */
interface ThemeSwitcherProps {
  /**
   * 显示模式
   * - 'dropdown': 下拉菜单
   * - 'buttons': 按钮组
   * - 'icon': 图标按钮
   */
  mode?: 'dropdown' | 'buttons' | 'icon';
  
  /**
   * 是否显示标签文本
   */
  showLabel?: boolean;
  
  /**
   * 自定义样式类
   */
  class?: string;
}

/**
 * 组件 Emits
 */
interface ThemeSwitcherEmits {
  /**
   * 主题模式变化时触发
   * @param mode - 新的主题模式
   */
  (e: 'change', mode: ThemeMode): void;
}

// Props 默认值
const props = withDefaults(defineProps<ThemeSwitcherProps>(), {
  mode: 'dropdown',
  showLabel: true,
  class: '',
});

// Emits
const emit = defineEmits<ThemeSwitcherEmits>();

// Theme Store
const themeStore = useThemeStore();

/**
 * 当前主题的图标
 * 
 * Requirements: 5.4
 */
const currentIcon = computed(() => {
  if (themeStore.mode === 'light') {
    return Sun;
  } else if (themeStore.mode === 'dark') {
    return Moon;
  } else {
    return Monitor;
  }
});

/**
 * 当前主题的标签文本
 * 
 * Requirements: 5.4
 */
const currentLabel = computed(() => {
  if (themeStore.mode === 'light') {
    return '浅色';
  } else if (themeStore.mode === 'dark') {
    return '深色';
  } else {
    return '跟随系统';
  }
});

/**
 * 下拉菜单选项
 * 
 * Requirements: 4.4, 5.2, 5.4
 */
const dropdownOptions = computed<DropdownOption[]>(() => [
  {
    label: '浅色',
    key: 'light',
    icon: () => h(NIcon, { component: Sun }),
  },
  {
    label: '深色',
    key: 'dark',
    icon: () => h(NIcon, { component: Moon }),
  },
  {
    label: '跟随系统',
    key: 'system',
    icon: () => h(NIcon, { component: Monitor }),
  },
]);

/**
 * 处理主题模式变化
 * 
 * @param mode - 新的主题模式
 * 
 * Requirements: 5.2, 5.3
 */
async function handleModeChange(mode: ThemeMode): Promise<void> {
  try {
    await themeStore.setThemeMode(mode);
    emit('change', mode);
  } catch (error) {
    console.error('切换主题失败:', error);
  }
}

/**
 * 处理下拉菜单选择
 * 
 * @param key - 选中的选项键
 * 
 * Requirements: 5.2, 5.3
 */
function handleSelect(key: string | number): void {
  handleModeChange(key as ThemeMode);
}

/**
 * 处理图标按钮切换
 * 
 * 在浅色和深色之间切换
 * 
 * Requirements: 5.2, 5.3
 */
async function handleToggle(): Promise<void> {
  try {
    await themeStore.toggleTheme();
    emit('change', themeStore.mode);
  } catch (error) {
    console.error('切换主题失败:', error);
  }
}
</script>

<style scoped>
.theme-switcher {
  display: inline-flex;
  align-items: center;
}
</style>
