/**
 * System Theme Listener Composable
 * 
 * 监听操作系统主题变化的 Composable
 * 系统主题通过 Rust 端 `get_system_theme` 命令读取（Windows 注册表），
 * 不使用 window.theme() / matchMedia / onThemeChanged 的取值：
 * 应用自身调用 setTheme 会固定窗口主题，导致这些来源全部返回
 * "窗口主题"而非"系统主题"（被应用自身的设置污染）。
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
import { invoke } from '@tauri-apps/api/core';
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
  /** 主动刷新系统主题（异步检测并更新状态），返回最新主题或 null */
  refreshSystemTheme: () => Promise<Theme | null>;
}

/**
 * 通过 Rust 端读取操作系统真实主题
 * （Windows 注册表 AppsUseLightTheme，不受窗口 setTheme 污染）
 * @returns 系统主题 ('light' | 'dark') 或 null（如果检测失败）
 */
async function detectSystemThemeViaRust(): Promise<Theme | null> {
  try {
    const theme = await invoke<string>('get_system_theme');

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
 * @returns 系统主题 ('light' | 'dark') 或 null（如果不支持或检测失败）
 */
async function detectSystemTheme(): Promise<Theme | null> {
  return await detectSystemThemeViaRust();
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
   * 主动刷新系统主题（异步检测并更新状态）
   *
   * 返回最新检测结果；检测失败返回 null。
   * 供"跟随系统"模式切换等需要立即拿到准确系统主题的场景使用，
   * 避免读取到过期的 systemTheme 缓存值。
   */
  async function refreshSystemTheme(): Promise<Theme | null> {
    try {
      const theme = await detectSystemTheme();
      if (theme === "light" || theme === "dark") {
        updateTheme(theme);
        return theme;
      }
    } catch {
      // 检测失败，保留现有状态
    }
    return null;
  }

  /**
   * 开始监听系统主题变化
   *
   * 事件 payload 不可信（应用自身 setTheme 也会触发 onThemeChanged，
   * 且 payload 为窗口主题），因此事件仅作为"系统主题可能变化"的信号，
   * 实际主题一律以 Rust 端注册表检测结果为准。
   *
   * Requirements: 4.1, 4.2, 4.3
   */
  function startListening(): void {
    // 如果已经在监听，直接返回
    if (tauriUnlisten) {
      return;
    }
    
    // 先异步获取当前系统主题
    void refreshSystemTheme().then(theme => {
      if (!theme) {
        // 无法检测系统主题，使用深色作为默认
        updateTheme('dark');
      }
    });
    
    // 监听系统主题变化（仅作触发器，值以 refreshSystemTheme 为准）
    try {
      const appWindow = getCurrentWindow();
      appWindow.onThemeChanged(() => {
        void refreshSystemTheme();
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
    refreshSystemTheme,
  };
}


