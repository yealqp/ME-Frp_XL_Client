/**
 * UI Store Property-Based Tests
 * 
 * Property-based tests for UI Store using fast-check.
 * Each property is tested across many randomly generated inputs.
 * 
 * Feature: pinia-state-management
 */

import { fc, test } from '@fast-check/vitest';
import { beforeEach, describe, expect } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUIStore } from '../ui';
import { showAdGlobal } from '@/utils/eventBus';

describe('UI Store - Property-Based Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    // Reset localStorage
    localStorage.clear();
    // Reset showAdGlobal
    showAdGlobal.value = true;
  });

  /**
   * Property 13: 广告显示状态同步
   * 
   * **Validates: Requirements 7.3**
   * 
   * For any showAd value change, when calling UI Store's updateShowAd action,
   * the store's showAd state should be updated, and eventBus's showAdGlobal
   * should be synchronized to the same value.
   */
  test.prop([
    fc.boolean()
  ], { numRuns: 100 })('Property 13: updateShowAd should synchronize state with eventBus', (showAdValue) => {
    const store = useUIStore();
    
    // Execute updateShowAd
    store.updateShowAd(showAdValue);
    
    // Verify store state is updated
    expect(store.showAd).toBe(showAdValue);
    
    // Verify eventBus is synchronized
    expect(showAdGlobal.value).toBe(showAdValue);
  });

  /**
   * Additional Property: Theme Toggle
   * 
   * Verifies that toggleTheme correctly switches between light and dark themes
   * and persists the choice to localStorage.
   */
  test.prop([
    fc.constantFrom('light' as const, 'dark' as const)
  ], { numRuns: 100 })('toggleTheme should switch theme and persist to localStorage', (initialTheme) => {
    const store = useUIStore();
    
    // Set initial theme
    store.theme = initialTheme;
    
    // Execute toggleTheme
    store.toggleTheme();
    
    // Verify theme is toggled
    const expectedTheme = initialTheme === 'light' ? 'dark' : 'light';
    expect(store.theme).toBe(expectedTheme);
    
    // Verify localStorage is updated
    expect(localStorage.getItem('theme')).toBe(expectedTheme);
    
    // Verify isDarkMode getter
    expect(store.isDarkMode).toBe(expectedTheme === 'dark');
  });

  /**
   * Additional Property: Theme Initialization
   * 
   * Verifies that initTheme correctly loads theme from localStorage
   * or uses default value.
   */
  test.prop([
    fc.option(fc.constantFrom('light' as const, 'dark' as const), { nil: null })
  ], { numRuns: 100 })('initTheme should load theme from localStorage or use default', (savedTheme) => {
    // Clear localStorage before each test
    localStorage.clear();
    
    const store = useUIStore();
    
    // Reset theme to default
    store.theme = 'light';
    
    // Set up localStorage
    if (savedTheme !== null) {
      localStorage.setItem('theme', savedTheme);
    }
    
    // Execute initTheme
    store.initTheme();
    
    // Verify theme is loaded correctly
    if (savedTheme !== null) {
      expect(store.theme).toBe(savedTheme);
    } else {
      // Should remain at default value (light)
      expect(store.theme).toBe('light');
    }
  });

  /**
   * Additional Property: Current Theme Getter
   * 
   * Verifies that currentTheme returns customTheme if set, otherwise returns theme.
   */
  test.prop([
    fc.constantFrom('light' as const, 'dark' as const),
    fc.option(fc.object(), { nil: null })
  ], { numRuns: 100 })('currentTheme should return customTheme if set, otherwise theme', (themeValue, customThemeValue) => {
    const store = useUIStore();
    
    store.theme = themeValue;
    store.customTheme = customThemeValue;
    
    // Verify currentTheme getter
    if (customThemeValue !== null) {
      expect(store.currentTheme).toStrictEqual(customThemeValue);
    } else {
      expect(store.currentTheme).toBe(themeValue);
    }
  });
});
