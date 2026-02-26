<!--
  ThemeAwareIcon Component
  
  主题感知的图标组件，根据当前主题自动选择合适的图标版本或应用滤镜
  
  Props:
  - lightIcon: 浅色模式下使用的图标路径（可选）
  - darkIcon: 深色模式下使用的图标路径（可选）
  - src: 通用图标路径，如果未提供 lightIcon/darkIcon 则使用此路径并应用滤镜（可选）
  - alt: 图标的替代文本
  - applyFilter: 是否应用 CSS 滤镜（默认 true）
  - class: 自定义样式类
  
  Requirements: 9.1, 9.2, 9.3, 9.4
-->

<template>
  <img
    :src="iconSrc"
    :alt="alt"
    :class="['theme-aware-icon', themeClass, customClass]"
    :style="iconStyle"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useThemeStore } from '@/stores/theme';

/**
 * 组件 Props
 */
interface ThemeAwareIconProps {
  /** 浅色模式下使用的图标路径 */
  lightIcon?: string;
  /** 深色模式下使用的图标路径 */
  darkIcon?: string;
  /** 通用图标路径（如果未提供 lightIcon/darkIcon） */
  src?: string;
  /** 图标的替代文本 */
  alt?: string;
  /** 是否应用 CSS 滤镜（默认 true） */
  applyFilter?: boolean;
  /** 自定义样式类 */
  class?: string;
}

const props = withDefaults(defineProps<ThemeAwareIconProps>(), {
  alt: '',
  applyFilter: true,
  class: '',
});

/**
 * 主题 Store
 */
const themeStore = useThemeStore();

/**
 * 计算当前应该使用的图标路径
 * 
 * Requirements: 9.1, 9.2, 9.3
 */
const iconSrc = computed<string>(() => {
  // 如果提供了主题特定的图标，根据当前主题选择
  if (props.lightIcon && props.darkIcon) {
    return themeStore.isDarkMode ? props.darkIcon : props.lightIcon;
  }
  
  // 如果只提供了一个主题特定的图标，优先使用它
  if (props.lightIcon) {
    return props.lightIcon;
  }
  
  if (props.darkIcon) {
    return props.darkIcon;
  }
  
  // 否则使用通用图标路径
  return props.src || '';
});

/**
 * 主题样式类
 * 
 * Requirements: 9.1, 9.2
 */
const themeClass = computed<string>(() => {
  // 如果提供了主题特定的图标，不需要应用滤镜类
  if (props.lightIcon && props.darkIcon) {
    return '';
  }
  
  // 如果启用了滤镜，应用主题类
  if (props.applyFilter) {
    return themeStore.isDarkMode ? 'theme-dark' : 'theme-light';
  }
  
  return '';
});

/**
 * 自定义样式类
 */
const customClass = computed<string>(() => props.class);

/**
 * 图标样式（用于装饰性图片的透明度调整）
 * 
 * Requirements: 9.4
 */
const iconStyle = computed(() => {
  // 如果不应用滤镜，返回空样式
  if (!props.applyFilter) {
    return {};
  }
  
  // 为装饰性图片提供主题感知的透明度调整
  // 在浅色模式下略微降低透明度，在深色模式下保持原样
  return {
    opacity: themeStore.isLightMode ? '0.9' : '1',
  };
});
</script>

<style scoped>
/**
 * 基础图标样式
 */
.theme-aware-icon {
  display: inline-block;
  vertical-align: middle;
  transition: filter 0.3s ease, opacity 0.3s ease;
}

/**
 * 浅色模式滤镜
 * 
 * 为深色图标应用滤镜使其在浅色背景下可见
 * 
 * Requirements: 9.1
 */
.theme-aware-icon.theme-light {
  filter: brightness(0.2) contrast(1.2);
}

/**
 * 深色模式滤镜
 * 
 * 为浅色图标应用滤镜使其在深色背景下可见
 * 
 * Requirements: 9.2
 */
.theme-aware-icon.theme-dark {
  filter: brightness(1.8) contrast(0.9);
}

/**
 * 减少动画模式
 * 
 * 当用户启用了"减少动画"辅助功能选项时，禁用过渡动画
 */
@media (prefers-reduced-motion: reduce) {
  .theme-aware-icon {
    transition: none !important;
  }
}
</style>
