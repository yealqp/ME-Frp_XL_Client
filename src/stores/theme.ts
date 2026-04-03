/**
 * Theme Store
 * 
 * 主题状态管理 Store，负责管理主题状态、主题切换和持久化
 * 使用 Pinia Setup Store 语法
 * 
 * Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 8.1, 8.2, 8.3, 8.4, 10.1, 10.2, 10.3, 10.4
 */

import { ref, computed, watch } from 'vue';
import { defineStore } from 'pinia';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { ThemeMode, Theme, ThemePreference } from '@/types/theme';
import { useSystemTheme } from '@/composables/useSystemTheme';
import { applyCSSVariables, getNaiveTheme, applyTransitionClass } from '@/utils/themeApplier';
import { mergeUnifiedConfig } from '@/utils/unifiedConfig';

/**
 * LocalStorage 键名
 */
const THEME_PREFERENCE_KEY = 'theme-preference';

/**
 * 设置窗口标题栏主题
 * 
 * @param theme - 主题类型 ('light' | 'dark')
 */
async function setWindowTheme(theme: Theme): Promise<void> {
  try {
    const appWindow = getCurrentWindow();
    await appWindow.setTheme(theme);
  } catch (error) {
    console.error('设置窗口主题失败:', error);
    // 静默失败，不影响用户体验
  }
}

/**
 * 保存主题偏好到 LocalStorage
 * 
 * @param preference - 主题偏好对象
 * 
 * Requirements: 3.1
 */
function saveThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_PREFERENCE_KEY, JSON.stringify(preference));
  } catch (error) {
    console.error('保存主题偏好失败:', error);
    // 静默失败，不影响用户体验
  }
}

/**
 * 从 LocalStorage 读取主题偏好
 * 
 * @returns 主题偏好对象或 null（如果不存在或读取失败）
 * 
 * Requirements: 3.2
 */
function loadThemePreference(): ThemePreference | null {
  try {
    const data = localStorage.getItem(THEME_PREFERENCE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('读取主题偏好失败:', error);
    return null;
  }
}

/**
 * Theme Store
 * 
 * 管理应用的主题状态，包括主题模式、系统主题同步和持久化
 */
export const useThemeStore = defineStore('theme', () => {
  // ==================== State ====================
  
  /**
   * 当前主题模式
   * - 'light': 浅色模式
   * - 'dark': 深色模式
   * - 'system': 跟随系统主题
   * 
   * Requirements: 2.1, 2.2, 4.4
   */
  const mode = ref<ThemeMode>('system');
  
  /**
   * 实际应用的主题
   * - 'light': 浅色主题
   * - 'dark': 深色主题
   * 
   * Requirements: 2.1, 2.2
   */
  const activeTheme = ref<Theme>('dark');
  
  /**
   * 系统主题
   * - 'light': 系统使用浅色主题
   * - 'dark': 系统使用深色主题
   * - null: 系统主题未知或不支持
   * 
   * Requirements: 4.1, 4.2
   */
  const systemTheme = ref<Theme | null>(null);
  
  // ==================== System Theme Listener ====================
  
  /**
   * 系统主题监听器
   * 
   * Requirements: 4.1, 4.2, 4.3
   */
  const systemThemeListener = useSystemTheme();
  
  // ==================== Getters ====================
  
  /**
   * 获取当前激活的主题
   * 
   * Requirements: 8.1, 8.3
   */
  const currentTheme = computed<Theme>(() => activeTheme.value);
  
  /**
   * 判断是否为深色模式
   * 
   * Requirements: 8.1, 8.3
   */
  const isDarkMode = computed<boolean>(() => activeTheme.value === 'dark');
  
  /**
   * 判断是否为浅色模式
   * 
   * Requirements: 8.1, 8.3
   */
  const isLightMode = computed<boolean>(() => activeTheme.value === 'light');
  
  /**
   * 判断是否跟随系统
   * 
   * Requirements: 4.4, 8.1, 8.3
   */
  const isSystemMode = computed<boolean>(() => mode.value === 'system');
  
  /**
   * 获取 Naive UI 主题对象
   * 
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
   */
  const naiveTheme = computed(() => getNaiveTheme(activeTheme.value));
  
  // ==================== Internal Methods ====================
  
  /**
   * 更新激活的主题
   * 
   * 根据当前模式和系统主题计算实际应用的主题
   * 
   * Requirements: 2.1, 2.2, 4.1, 4.2
   */
  function updateActiveTheme(): void {
    if (mode.value === 'system') {
      // 跟随系统模式：使用系统主题，如果系统主题未知则使用浅色
      activeTheme.value = systemTheme.value || 'light';
    } else {
      // 手动模式：直接使用选择的模式
      activeTheme.value = mode.value;
    }
  }
  
  /**
   * 应用主题到 UI
   * 
   * 更新 CSS Variables，动画永久启用
   * 
   * Requirements: 2.3, 7.1, 7.2, 7.3, 7.4
   */
  function applyTheme(): void {
    applyCSSVariables(activeTheme.value);
    
    // 设置窗口标题栏主题（所有模式都需要设置）
    setWindowTheme(activeTheme.value);
  }
  
  /**
   * 保存当前主题偏好
   * 
   * 同时保存到 LocalStorage 和 UnifiedConfig
   * 
   * Requirements: 3.1, 3.2
   */
  async function savePreference(): Promise<void> {
    const preference: ThemePreference = {
      mode: mode.value,
      enableTransitions: true, // 永久启用动画
    };
    
    // 保存到 LocalStorage
    saveThemePreference(preference);
    
    // 同步到 UnifiedConfig
    await syncToUnifiedConfig();
  }
  
  /**
   * 同步主题设置到 Tauri UnifiedConfig
   * 
   * Requirements: 3.1, 3.2
   */
  async function syncToUnifiedConfig(): Promise<void> {
    try {
      await mergeUnifiedConfig({
        themeMode: mode.value,
      });
    } catch (error) {
      console.error('同步主题到 UnifiedConfig 失败:', error);
      // 静默失败，LocalStorage 已保存主题偏好
    }
  }
  
  // ==================== Actions ====================
  
  /**
   * 初始化主题系统
   * 
   * 1. 读取持久化的主题偏好
   * 2. 如果没有偏好，检测系统主题
   * 3. 计算并应用激活的主题
   * 4. 开始监听系统主题变化
   * 
   * Requirements: 10.1, 10.2, 10.3, 10.4
   */
  async function initTheme(): Promise<void> {
    try {
      // 1. 读取持久化的主题偏好
      const preference = loadThemePreference();
      
      if (preference) {
        // 如果存在主题偏好，使用保存的设置
        mode.value = preference.mode;
        // enableTransitions 已删除，永久启用动画
      } else {
        // 2. 如果没有偏好，使用暗色模式作为默认主题
        mode.value = 'dark';
      }
      
      // 4. 如果模式是跟随系统，确保系统主题监听器已启动
      if (mode.value === 'system' && systemThemeListener.isSupported.value) {
        systemThemeListener.startListening();
        
        // 等待一小段时间，让系统主题检测稳定
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // 再次读取系统主题，确保获取到正确的值
        systemTheme.value = systemThemeListener.systemTheme.value;
      }
      
      // 5. 计算并应用激活的主题
      updateActiveTheme();
      applyTheme();
      
    } catch (error) {
      console.error('初始化主题系统失败:', error);
      // 回退到默认主题（暗色模式）
      mode.value = 'dark';
      activeTheme.value = 'dark';
      applyTheme();
    }
  }
  
  /**
   * 设置主题模式
   * 
   * @param newMode - 新的主题模式
   * 
   * Requirements: 2.1, 2.2, 4.1, 4.2, 4.3
   */
  async function setThemeMode(newMode: ThemeMode): Promise<void> {
    try {
      // 1. 确定当前主题和目标主题
      const currentTheme = activeTheme.value;
      let targetTheme: Theme;
      
      if (newMode === 'system') {
        // 切换到跟随系统模式时，先启动监听器并获取系统主题
        if (systemThemeListener.isSupported.value) {
          // 启动监听器（内部会立即同步获取系统主题）
          systemThemeListener.startListening();
          // 直接使用监听器中的系统主题值
          targetTheme = systemThemeListener.systemTheme.value || 'dark';
          // 同步更新 store 中的系统主题状态
          systemTheme.value = systemThemeListener.systemTheme.value;
        } else {
          // 如果不支持系统主题检测，使用暗色作为默认
          targetTheme = 'dark';
        }
      } else {
        targetTheme = newMode;
      }
      
      // 如果当前主题和目标主题相同且模式也相同，不需要切换
      if (currentTheme === targetTheme && mode.value === newMode) {
        return;
      }
      
      // 2. 动态导入 Settings 图标
      const { Settings } = await import('lucide-vue-next');
      
      // 3. 创建蒙层容器
      const overlay = document.createElement('div');
      overlay.className = 'theme-overlay';
      
      // 4. 创建内容容器
      const content = document.createElement('div');
      content.className = 'theme-overlay-content';
      
      // 5. 创建齿轮图标容器
      const gearContainer = document.createElement('div');
      gearContainer.className = 'theme-overlay-gear';
      
      // 6. 使用 lucide Settings 图标的 SVG 路径
      const gear = document.createElement('div');
      gear.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      `;
      gearContainer.appendChild(gear);
      
      // 7. 创建提示文字
      const text = document.createElement('div');
      text.className = 'theme-overlay-text';
      const themeText = targetTheme === 'light' ? '浅色' : '深色';
      text.textContent = `正在切换到${themeText}模式`;
      
      // 8. 组装元素
      content.appendChild(gearContainer);
      content.appendChild(text);
      overlay.appendChild(content);
      
      // 9. 添加当前主题的蒙层颜色类
      overlay.classList.add(currentTheme);
      document.body.appendChild(overlay);
      
      // 10. 触发蒙层淡入动画（前 0.5 秒显示当前色调）
      requestAnimationFrame(() => {
        overlay.classList.add('active');
      });
      
      // 11. 等待 0.5 秒（显示当前色调）
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 12. 切换到目标主题色调
      overlay.classList.remove(currentTheme);
      overlay.classList.add(targetTheme);
      
      // 13. 在蒙层完全显示时切换主题（中间时刻）
      mode.value = newMode;
      if (newMode === 'system' && systemThemeListener.isSupported.value) {
        systemThemeListener.startListening();
        systemTheme.value = systemThemeListener.systemTheme.value;
      }
      updateActiveTheme();
      applyTheme();
      
      // 14. 等待 0.5 秒（显示目标色调）
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 15. 淡出蒙层
      overlay.classList.remove('active');
      
      // 16. 等待蒙层完全消失后移除
      await new Promise(resolve => setTimeout(resolve, 150));
      document.body.removeChild(overlay);
      
      // 17. 保存偏好
      await savePreference();
    } catch (error) {
      console.error('设置主题模式失败:', error);
      throw error;
    }
  }
  
  /**
   * 切换到浅色模式
   * 
   * Requirements: 2.1
   */
  async function setLightMode(): Promise<void> {
    await setThemeMode('light');
  }
  
  /**
   * 切换到深色模式
   * 
   * Requirements: 2.2
   */
  async function setDarkMode(): Promise<void> {
    await setThemeMode('dark');
  }
  
  /**
   * 切换到跟随系统模式
   * 
   * Requirements: 4.1, 4.2, 4.3, 4.4
   */
  async function setSystemMode(): Promise<void> {
    await setThemeMode('system');
  }
  
  /**
   * 切换主题（在浅色和深色之间）
   * 
   * 如果当前是跟随系统模式，则切换到相反的手动模式
   * 
   * Requirements: 2.1, 2.2
   */
  async function toggleTheme(): Promise<void> {
    if (mode.value === 'system') {
      // 如果当前是跟随系统，切换到相反的手动模式
      const newMode = activeTheme.value === 'light' ? 'dark' : 'light';
      await setThemeMode(newMode);
    } else {
      // 如果是手动模式，在浅色和深色之间切换
      const newMode = mode.value === 'light' ? 'dark' : 'light';
      await setThemeMode(newMode);
    }
  }
  
  /**
   * 更新系统主题
   * 
   * 由系统主题监听器调用，当系统主题变化时更新应用主题
   * 
   * @param theme - 新的系统主题
   * 
   * Requirements: 4.1, 4.2, 4.3
   */
  function updateSystemTheme(theme: Theme): void {
    systemTheme.value = theme;
    
    // 如果当前模式是跟随系统，更新激活的主题
    if (mode.value === 'system') {
      updateActiveTheme();
      applyTheme();
    }
  }
  
  /**
   * 设置是否启用过渡动画
   * 
   * @deprecated 动画已永久启用，此方法保留仅用于兼容性
   * 
   * @param enable - 是否启用过渡动画（已忽略）
   * 
   * Requirements: 7.1, 7.2, 7.3, 7.4
   */
  async function setEnableTransitions(enable: boolean): Promise<void> {
    console.warn('setEnableTransitions 已废弃：动画已永久启用');
    // 不执行任何操作，动画永久启用
  }
  
  // ==================== Watchers ====================
  
  /**
   * 监听系统主题变化
   * 
   * 当系统主题监听器检测到系统主题变化时，自动更新应用主题
   * 
   * Requirements: 4.3, 8.2, 8.4
   */
  watch(
    () => systemThemeListener.systemTheme.value,
    (newSystemTheme) => {
      if (newSystemTheme) {
        updateSystemTheme(newSystemTheme);
      }
    }
  );
  
  // ==================== Return ====================
  
  return {
    // State
    mode,
    activeTheme,
    systemTheme,
    
    // Getters
    currentTheme,
    isDarkMode,
    isLightMode,
    isSystemMode,
    naiveTheme,
    
    // Actions
    initTheme,
    setThemeMode,
    setLightMode,
    setDarkMode,
    setSystemMode,
    toggleTheme,
    updateSystemTheme,
    setEnableTransitions,
  };
});
