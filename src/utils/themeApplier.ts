/**
 * Theme Applier Utility Module
 * 
 * 负责将主题应用到 UI 的工具模块
 * 包括 CSS Variables 应用、Naive UI 主题对象生成和过渡动画控制
 * 
 * Requirements: 2.3, 7.1, 7.2, 7.3, 7.4
 */

import { darkTheme, type GlobalTheme } from 'naive-ui';
import { lightThemeConfig, darkThemeConfig } from '@/config/theme';
import type { Theme } from '@/types/theme';

/**
 * 检查浏览器是否支持 CSS Variables
 * @returns 是否支持 CSS Variables
 */
function supportsCSSVariables(): boolean {
  if (typeof window === 'undefined' || typeof CSS === 'undefined') {
    return false;
  }
  
  try {
    return CSS.supports('color', 'var(--test)');
  } catch {
    return false;
  }
}

/**
 * 应用主题到 CSS Variables
 * 
 * 将主题配置映射到 CSS 自定义属性，应用到文档根元素
 * 如果浏览器不支持 CSS Variables，会记录警告并回退到 Naive UI 主题系统
 * 
 * @param theme - 要应用的主题 ('light' | 'dark')
 * 
 * Requirements: 2.3, 7.1, 7.2, 7.3
 * 
 * @example
 * ```ts
 * applyCSSVariables('light'); // 应用浅色主题
 * applyCSSVariables('dark');  // 应用深色主题
 * ```
 */
export function applyCSSVariables(theme: Theme): void {
  // 检查浏览器支持
  if (!supportsCSSVariables()) {
    console.warn('浏览器不支持 CSS Variables，使用 Naive UI 主题');
    return;
  }
  
  try {
    // 选择对应的主题配置
    const config = theme === 'light' ? lightThemeConfig : darkThemeConfig;
    const root = document.documentElement;
    
    // 将主题配置映射到 CSS Variables
    // 使用 --theme- 前缀以避免命名冲突
    Object.entries(config.common).forEach(([key, value]) => {
      // 将驼峰命名转换为短横线命名
      // 例如: bodyColor -> body-color
      const cssVarName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--theme-${cssVarName}`, value);
    });
    
    // 同时设置应用级别的 CSS Variables（使用 --app- 前缀）
    // 这些变量可以在自定义组件中使用
    root.style.setProperty('--app-bg-color', config.common.bodyColor);
    root.style.setProperty('--app-card-color', config.common.cardColor);
    root.style.setProperty('--app-text-color', config.common.textColorBase);
    root.style.setProperty('--app-text-color-1', config.common.textColor1);
    root.style.setProperty('--app-text-color-2', config.common.textColor2);
    root.style.setProperty('--app-text-color-3', config.common.textColor3);
    root.style.setProperty('--app-border-color', config.common.borderColor);
    root.style.setProperty('--app-divider-color', config.common.dividerColor);
    root.style.setProperty('--app-primary-color', config.common.primaryColor);
    root.style.setProperty('--app-primary-color-hover', config.common.primaryColorHover);
    root.style.setProperty('--app-primary-color-pressed', config.common.primaryColorPressed);
    root.style.setProperty('--app-info-color', config.common.infoColor);
    root.style.setProperty('--app-success-color', config.common.successColor);
    root.style.setProperty('--app-warning-color', config.common.warningColor);
    root.style.setProperty('--app-error-color', config.common.errorColor);
    root.style.setProperty('--app-log-timestamp-color', config.common.textColor3);
    root.style.setProperty('--app-log-info-color', config.common.infoColor);
    root.style.setProperty('--app-log-warning-color', config.common.warningColor);
    root.style.setProperty('--app-log-error-color', config.common.errorColor);
    root.style.setProperty('--app-log-path-color', config.common.successColor);
    root.style.setProperty('--app-log-highlight-color', config.common.errorColor);
    root.style.setProperty('--app-box-shadow-1', config.common.boxShadow1);
    root.style.setProperty('--app-box-shadow-2', config.common.boxShadow2);
    root.style.setProperty('--app-box-shadow-3', config.common.boxShadow3);
    
    // 登录按钮和广告横幅使用当前主题的主色调
    root.style.setProperty('--login-btn-bg', config.common.primaryColor);
    root.style.setProperty('--login-btn-bg-hover', config.common.primaryColorHover);
    root.style.setProperty('--login-btn-bg-pressed', config.common.primaryColorPressed);
    root.style.setProperty('--ad-banner-bg', config.common.primaryColor);
    root.style.setProperty('--ad-banner-bg-hover', config.common.primaryColorHover);
    
  } catch (error) {
    console.error('应用 CSS Variables 失败:', error);
  }
}

/**
 * 获取 Naive UI 主题对象
 * 
 * 根据主题类型返回对应的 Naive UI 主题对象
 * - 浅色模式: 返回 null (Naive UI 默认使用浅色主题)
 * - 深色模式: 返回 darkTheme 对象
 * 
 * @param theme - 主题类型 ('light' | 'dark')
 * @returns Naive UI 主题对象或 null
 * 
 * Requirements: 2.3
 * 
 * @example
 * ```ts
 * const naiveTheme = getNaiveTheme('dark');
 * // 在 n-config-provider 中使用:
 * // <n-config-provider :theme="naiveTheme">
 * ```
 */
export function getNaiveTheme(theme: Theme): GlobalTheme | null {
  // Naive UI 的浅色主题是默认主题，不需要传递 theme prop
  // 只有深色模式需要传递 darkTheme
  return theme === 'dark' ? darkTheme : null;
}

/**
 * 应用或移除主题切换过渡动画类
 * 
 * 由于使用全屏蒙层实现主题切换效果，不需要禁用任何过渡动画
 * 保留此函数以维持 API 兼容性，但不执行任何操作
 * 仍然检测用户的"减少动画"偏好设置，以备未来使用
 * 
 * @param enable - 是否启用过渡动画（当前未使用）
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 * 
 * @example
 * ```ts
 * applyTransitionClass(true);  // 不执行任何操作
 * applyTransitionClass(false); // 不执行任何操作
 * ```
 */
export function applyTransitionClass(enable: boolean): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  
  try {
    // 检查用户是否启用了"减少动画"辅助功能选项
    // Requirements: 7.4
    // 保留此检测逻辑以备未来使用
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    
    // 不再添加或移除任何类，因为我们使用全屏蒙层实现主题切换
    // 这样可以保证所有动画（路由切换、hover 效果等）正常工作
    
    // 未来如果需要根据 prefersReducedMotion 做特殊处理，可以在这里实现
  } catch (error) {
    console.error('检测动画偏好设置失败:', error);
  }
}

/**
 * 完整应用主题
 * 
 * 一次性应用主题的所有方面：CSS Variables 和过渡动画
 * 这是一个便捷函数，组合了 applyCSSVariables 和 applyTransitionClass
 * 
 * @param theme - 要应用的主题 ('light' | 'dark')
 * @param enableTransitions - 是否启用过渡动画（默认为 true）
 * 
 * @example
 * ```ts
 * applyTheme('light', true);  // 应用浅色主题，启用动画
 * applyTheme('dark', false);  // 应用深色主题，禁用动画
 * ```
 */
export function applyTheme(theme: Theme, enableTransitions: boolean = true): void {
  applyCSSVariables(theme);
  applyTransitionClass(enableTransitions);
}
