/**
 * System Theme Listener Composable
 * 
 * 监听操作系统主题变化的 Composable
 * 使用 Tauri 的 theme API 而不是 window.matchMedia，因为后者在 Tauri 中有 bug
 * 
 * Requirements: 4.1, 4.2, 4.3
 * 
 * @example
 * ```ts
 * const { systemTheme, isSupported, startListening, stopListening } = useSystemTheme();
 * 
 * // 开始监听系统主题变化
 * startListening();
 * 
 * // 访问当前系统主题
 * console.log(systemTheme.value); // 'light' | 'dark' | null
 * 
 * // 停止监听
 * stopListening();
 * ```
 */

import { ref, onUnmounted, type Ref } from 'vue';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { Theme } from '@/types/theme';

/**
 * 系统主题监听器 Composable 返回值
 */
export interface UseSystemThemeReturn {
  /** 当前系统主题 ('light' | 'dark' | null) */
  systemTheme: Ref<Theme | null>;
  /** 是否支持系统主题检测 */
  isSupported: Ref<boolean>;
  /** 开始监听系统主题变化 */
  startListening: () => void;
  /** 停止监听系统主题变化 */
  stopListening: () => void;
}

/**
 * 使用 Tauri API 检测系统主题
 * 注意：这个方法会读取操作系统的实际主题设置，而不是窗口主题
 * @returns 系统主题 ('light' | 'dark') 或 null（如果检测失败）
 */
async function detectSystemThemeViaTauri(): Promise<Theme | null> {
  try {
    const appWindow = getCurrentWindow();
    const theme = await appWindow.theme();
    
    if (theme === 'light' || theme === 'dark') {
      return theme;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 检测当前系统主题
 * 优先使用 Tauri API，因为 window.matchMedia 在 Tauri 中有 bug
 * @returns 系统主题 ('light' | 'dark') 或 null（如果不支持或检测失败）
 */
async function detectSystemTheme(): Promise<Theme | null> {
  return await detectSystemThemeViaTauri();
}

/**
 * 系统主题监听器 Composable
 * 
 * 提供系统主题检测和变化监听功能
 * 使用 Tauri 的 onThemeChanged 事件
 * 
 * @returns 包含系统主题状态和控制方法的对象
 * 
 * Requirements: 4.1, 4.2, 4.3
 */
export function useSystemTheme(): UseSystemThemeReturn {
  // 当前系统主题
  const systemTheme = ref<Theme | null>(null);
  
  // 是否支持系统主题检测（Tauri 总是支持）
  const isSupported = ref<boolean>(true);
  
  // Tauri 主题监听取消函数
  let tauriUnlisten: (() => void) | null = null;

  /**
   * 更新系统主题状态
   * @param theme - 新的系统主题
   */
  function updateTheme(theme: Theme): void {
    systemTheme.value = theme;
  }

  /**
   * 开始监听系统主题变化
   * 
   * 使用 Tauri 的 onThemeChanged 事件
   * 
   * Requirements: 4.1, 4.2, 4.3
   */
  function startListening(): void {
    // 如果已经在监听，直接返回
    if (tauriUnlisten) {
      return;
    }
    
    // 先异步获取当前系统主题
    detectSystemTheme().then(theme => {
      if (theme) {
        updateTheme(theme);
      } else {
        // 无法检测系统主题，使用深色作为默认
        updateTheme('dark');
      }
    });
    
    // 监听系统主题变化
    try {
      const appWindow = getCurrentWindow();
      appWindow.onThemeChanged(({ payload: theme }) => {
        if (theme === 'light' || theme === 'dark') {
          updateTheme(theme);
        }
      }).then(unlisten => {
        tauriUnlisten = unlisten;
      }).catch(() => {
        isSupported.value = false;
      });
    } catch {
      isSupported.value = false;
    }
  }

  /**
   * 停止监听系统主题变化
   * 
   * 清理事件监听器和相关资源
   */
  function stopListening(): void {
    if (tauriUnlisten) {
      try {
        tauriUnlisten();
      } finally {
        tauriUnlisten = null;
      }
    }
  }

  // 组件卸载时自动停止监听
  onUnmounted(() => {
    stopListening();
  });

  return {
    systemTheme,
    isSupported,
    startListening,
    stopListening,
  };
}


