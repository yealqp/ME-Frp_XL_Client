/**
 * UI Store
 * 
 * 管理全局 UI 状态，包括主题配置
 * 
 * Requirements: 7.1, 7.2
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useUIStore = defineStore('ui', () => {
  // State
  const theme = ref<'light' | 'dark'>('light');
  const customTheme = ref<any>(null);

  // Getters
  const currentTheme = computed(() => customTheme.value || theme.value);
  const isDarkMode = computed(() => theme.value === 'dark');

  // Actions
  function initTheme() {
    // 从 localStorage 加载主题设置
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      theme.value = savedTheme;
    }
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', theme.value);
  }

  return {
    // State
    theme,
    customTheme,
    // Getters
    currentTheme,
    isDarkMode,
    // Actions
    initTheme,
    toggleTheme,
  };
});
