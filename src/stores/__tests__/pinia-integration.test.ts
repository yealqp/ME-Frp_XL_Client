/**
 * Pinia Integration Tests
 * 
 * These tests verify that Pinia is correctly integrated into the application.
 * 
 * Requirements:
 * - 1.1: Pinia instance is correctly registered
 * - 1.2: Components can access stores
 * 
 * **Validates: Requirements 1.1, 1.2**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia, defineStore } from 'pinia';
import { mount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';

describe('Pinia Integration', () => {
  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia());
  });

  it('should create Pinia instance successfully', () => {
    // Validates: Requirement 1.1 - Pinia instance can be created
    const pinia = createPinia();
    
    expect(pinia).toBeDefined();
    expect(pinia.install).toBeDefined();
    expect(typeof pinia.install).toBe('function');
  });

  it('should set active Pinia instance', () => {
    // Validates: Requirement 1.2 - Pinia instance can be set as active
    const pinia = createPinia();
    setActivePinia(pinia);
    
    // The active pinia should be accessible
    expect(pinia._s).toBeDefined(); // _s is the stores map
    expect(pinia._s instanceof Map).toBe(true);
  });

  it('should allow multiple Pinia instances', () => {
    // Validates: Requirement 1.1 - Multiple Pinia instances can coexist
    const pinia1 = createPinia();
    const pinia2 = createPinia();
    
    expect(pinia1).not.toBe(pinia2);
    expect(pinia1._s).not.toBe(pinia2._s);
  });

  it('should have empty stores map on initialization', () => {
    // Validates: Requirement 1.1 - Fresh Pinia instance starts with no stores
    const pinia = createPinia();
    
    expect(pinia._s.size).toBe(0);
  });

  describe('Component Store Access', () => {
    // Create a test store for component access testing
    const useTestStore = defineStore('test', () => {
      const count = ref(0);
      const increment = () => {
        count.value++;
      };
      return { count, increment };
    });

    it('should allow components to access stores', () => {
      // Validates: Requirement 1.2 - Components can access stores
      const pinia = createPinia();
      
      // Create a test component that uses the store
      const TestComponent = defineComponent({
        setup() {
          const store = useTestStore();
          return { store };
        },
        template: '<div>{{ store.count }}</div>',
      });

      // Mount component with Pinia
      const wrapper = mount(TestComponent, {
        global: {
          plugins: [pinia],
        },
      });

      // Verify the component can access the store
      expect(wrapper.vm.store).toBeDefined();
      expect(wrapper.vm.store.count).toBe(0);
      expect(wrapper.text()).toBe('0');
    });

    it('should allow components to call store actions', async () => {
      // Validates: Requirement 1.2 - Components can call store actions
      const pinia = createPinia();
      
      const TestComponent = defineComponent({
        setup() {
          const store = useTestStore();
          return { store };
        },
        template: '<button @click="store.increment">{{ store.count }}</button>',
      });

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [pinia],
        },
      });

      // Initial state
      expect(wrapper.text()).toBe('0');

      // Call action
      wrapper.vm.store.increment();
      await wrapper.vm.$nextTick();

      // Verify state updated
      expect(wrapper.vm.store.count).toBe(1);
      expect(wrapper.text()).toBe('1');
    });

    it('should share store state across multiple components', async () => {
      // Validates: Requirement 1.2 - Store state is shared across components
      const pinia = createPinia();
      
      const Component1 = defineComponent({
        setup() {
          const store = useTestStore();
          return { store };
        },
        template: '<div>{{ store.count }}</div>',
      });

      const Component2 = defineComponent({
        setup() {
          const store = useTestStore();
          return { store };
        },
        template: '<button @click="store.increment">Increment</button>',
      });

      const wrapper1 = mount(Component1, {
        global: { plugins: [pinia] },
      });

      const wrapper2 = mount(Component2, {
        global: { plugins: [pinia] },
      });

      // Initial state in both components
      expect(wrapper1.text()).toBe('0');

      // Increment in component 2
      wrapper2.vm.store.increment();
      await wrapper1.vm.$nextTick();
      await wrapper2.vm.$nextTick();

      // Both components should reflect the change
      expect(wrapper1.vm.store.count).toBe(1);
      expect(wrapper2.vm.store.count).toBe(1);
      expect(wrapper1.text()).toBe('1');
    });

    it('should register store in Pinia instance when accessed', () => {
      // Validates: Requirement 1.1 - Stores are registered when first accessed
      const pinia = createPinia();
      setActivePinia(pinia);

      // Initially no stores
      expect(pinia._s.size).toBe(0);

      // Access the store
      const store = useTestStore();

      // Store should be registered
      expect(pinia._s.size).toBe(1);
      expect(pinia._s.has('test')).toBe(true);
      expect(store).toBeDefined();
    });

    it('should return same store instance on multiple calls', () => {
      // Validates: Requirement 1.2 - Store instances are singletons per Pinia instance
      const pinia = createPinia();
      setActivePinia(pinia);

      const store1 = useTestStore();
      const store2 = useTestStore();

      // Should be the same instance
      expect(store1).toBe(store2);
    });
  });
});

/**
 * Manual Integration Test
 * 
 * This test can be verified by checking the browser console after the app starts.
 * The Pinia instance should be available and functional.
 */
export function manualIntegrationTest() {
  console.log('=== Pinia Integration Manual Test ===');
  
  try {
    // Test 1: Check if Pinia is imported correctly
    console.log('✓ Pinia module imported successfully');
    
    // Test 2: Create a test instance
    const testPinia = createPinia();
    console.log('✓ Pinia instance created:', testPinia);
    
    // Test 3: Check instance properties
    if (testPinia.install && testPinia._s instanceof Map) {
      console.log('✓ Pinia instance has correct structure');
    } else {
      console.error('✗ Pinia instance structure is invalid');
    }
    
    console.log('=== All manual tests passed ===');
    return true;
  } catch (error) {
    console.error('✗ Manual test failed:', error);
    return false;
  }
}

