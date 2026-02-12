/**
 * UI Store Unit Tests
 * 
 * Unit tests for UI Store functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUIStore } from '../ui';
import { showAdGlobal } from '@/utils/eventBus';

describe('UI Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    showAdGlobal.value = true;
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const store = useUIStore();
      
      expect(store.theme).toBe('light');
      expect(store.customTheme).toBeNull();
      expect(store.showAd).toBe(true);
      expect(store.isDarkMode).toBe(false);
    });
  });

  describe('initTheme', () => {
    it('should load theme from localStorage if available', () => {
      localStorage.setItem('theme', 'dark');
      const store = useUIStore();
      
      store.initTheme();
      
      expect(store.theme).toBe('dark');
      expect(store.isDarkMode).toBe(true);
    });

    it('should keep default theme if localStorage is empty', () => {
      const store = useUIStore();
      
      store.initTheme();
      
      expect(store.theme).toBe('light');
    });

    it('should ignore invalid theme values in localStorage', () => {
      localStorage.setItem('theme', 'invalid');
      const store = useUIStore();
      
      store.initTheme();
      
      expect(store.theme).toBe('light');
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from light to dark', () => {
      const store = useUIStore();
      store.theme = 'light';
      
      store.toggleTheme();
      
      expect(store.theme).toBe('dark');
      expect(localStorage.getItem('theme')).toBe('dark');
      expect(store.isDarkMode).toBe(true);
    });

    it('should toggle from dark to light', () => {
      const store = useUIStore();
      store.theme = 'dark';
      
      store.toggleTheme();
      
      expect(store.theme).toBe('light');
      expect(localStorage.getItem('theme')).toBe('light');
      expect(store.isDarkMode).toBe(false);
    });
  });

  describe('updateShowAd', () => {
    it('should update showAd state and sync to eventBus', () => {
      const store = useUIStore();
      
      store.updateShowAd(false);
      
      expect(store.showAd).toBe(false);
      expect(showAdGlobal.value).toBe(false);
    });

    it('should sync true value to eventBus', () => {
      const store = useUIStore();
      store.showAd = false;
      showAdGlobal.value = false;
      
      store.updateShowAd(true);
      
      expect(store.showAd).toBe(true);
      expect(showAdGlobal.value).toBe(true);
    });
  });

  describe('Getters', () => {
    it('currentTheme should return customTheme if set', () => {
      const store = useUIStore();
      const customThemeObj = { primaryColor: '#ff0000' };
      
      store.customTheme = customThemeObj;
      
      expect(store.currentTheme).toStrictEqual(customThemeObj);
    });

    it('currentTheme should return theme if customTheme is null', () => {
      const store = useUIStore();
      store.theme = 'dark';
      store.customTheme = null;
      
      expect(store.currentTheme).toBe('dark');
    });

    it('isDarkMode should return true for dark theme', () => {
      const store = useUIStore();
      store.theme = 'dark';
      
      expect(store.isDarkMode).toBe(true);
    });

    it('isDarkMode should return false for light theme', () => {
      const store = useUIStore();
      store.theme = 'light';
      
      expect(store.isDarkMode).toBe(false);
    });
  });
});
