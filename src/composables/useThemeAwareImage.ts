/**
 * useThemeAwareImage Composable
 * 
 * 为装饰性图片提供主题感知的样式调整
 * 
 * Requirements: 9.4
 */

import { computed } from 'vue';
import { useThemeStore } from '@/stores/theme';

/**
 * 图片主题适配选项
 */
export interface ThemeAwareImageOptions {
  /** 是否应用混合模式（默认 false） */
  applyBlendMode?: boolean;
  /** 是否应用透明度调整（默认 true） */
  applyOpacity?: boolean;
  /** 浅色模式下的透明度（默认 0.9） */
  lightOpacity?: number;
  /** 深色模式下的透明度（默认 1） */
  darkOpacity?: number;
}

/**
 * 主题感知图片样式 Composable
 * 
 * 提供基于当前主题的图片样式调整，包括透明度和混合模式
 * 
 * @param options - 配置选项
 * @returns 图片样式对象和主题类名
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useThemeAwareImage } from '@/composables/useThemeAwareImage';
 * 
 * const { imageStyle, imageClass } = useThemeAwareImage({
 *   applyBlendMode: true,
 *   applyOpacity: true,
 * });
 * </script>
 * 
 * <template>
 *   <img 
 *     src="decorative.png" 
 *     :style="imageStyle" 
 *     :class="imageClass"
 *   />
 * </template>
 * ```
 * 
 * Requirements: 9.4
 */
export function useThemeAwareImage(options: ThemeAwareImageOptions = {}) {
  const {
    applyBlendMode = false,
    applyOpacity = true,
    lightOpacity = 0.9,
    darkOpacity = 1,
  } = options;

  const themeStore = useThemeStore();

  /**
   * 计算图片样式
   * 
   * Requirements: 9.4
   */
  const imageStyle = computed(() => {
    const style: Record<string, string | number> = {};

    // 应用透明度调整
    if (applyOpacity) {
      style.opacity = themeStore.isLightMode ? lightOpacity : darkOpacity;
    }

    // 应用混合模式
    if (applyBlendMode) {
      // 在浅色模式下使用 multiply 混合模式
      // 在深色模式下使用 screen 混合模式
      style.mixBlendMode = themeStore.isLightMode ? 'multiply' : 'screen';
    }

    return style;
  });

  /**
   * 主题类名
   * 
   * Requirements: 9.4
   */
  const imageClass = computed(() => {
    return themeStore.isDarkMode ? 'theme-dark-image' : 'theme-light-image';
  });

  return {
    imageStyle,
    imageClass,
    isDarkMode: themeStore.isDarkMode,
    isLightMode: themeStore.isLightMode,
  };
}

/**
 * 为 CSS 滤镜提供的辅助函数
 * 
 * 根据当前主题返回适当的 CSS 滤镜字符串
 * 
 * @returns CSS 滤镜字符串
 * 
 * Requirements: 9.1, 9.2
 */
export function useThemeFilter() {
  const themeStore = useThemeStore();

  /**
   * 图标滤镜
   * 
   * 为图标提供主题感知的亮度和对比度调整
   * 
   * Requirements: 9.1, 9.2
   */
  const iconFilter = computed(() => {
    if (themeStore.isLightMode) {
      // 浅色模式：降低亮度，增加对比度
      return 'brightness(0.2) contrast(1.2)';
    } else {
      // 深色模式：增加亮度，降低对比度
      return 'brightness(1.8) contrast(0.9)';
    }
  });

  /**
   * 装饰性图片滤镜
   * 
   * 为装饰性图片提供更柔和的滤镜调整
   * 
   * Requirements: 9.4
   */
  const decorativeFilter = computed(() => {
    if (themeStore.isLightMode) {
      // 浅色模式：略微降低亮度
      return 'brightness(0.95)';
    } else {
      // 深色模式：略微增加亮度
      return 'brightness(1.05)';
    }
  });

  return {
    iconFilter,
    decorativeFilter,
    isDarkMode: themeStore.isDarkMode,
    isLightMode: themeStore.isLightMode,
  };
}
