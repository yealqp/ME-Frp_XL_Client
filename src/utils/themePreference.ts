/**
 * Theme Preference Utils — 主题偏好持久化（localStorage）
 */

import type { ThemePreference } from "@/types/theme";

const THEME_PREFERENCE_KEY = "theme-preference";

/** 保存主题偏好到 localStorage */
export function saveThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_PREFERENCE_KEY, JSON.stringify(preference));
  } catch (error) {
    console.error("保存主题偏好失败:", error);
  }
}

/** 从 localStorage 读取主题偏好，无数据或解析失败返回 null */
export function loadThemePreference(): ThemePreference | null {
  try {
    const data = localStorage.getItem(THEME_PREFERENCE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("读取主题偏好失败:", error);
    return null;
  }
}
