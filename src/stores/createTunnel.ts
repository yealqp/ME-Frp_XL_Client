/**
 * CreateTunnel Store
 * 
 * Manages the multi-step tunnel creation flow state.
 * Handles node selection and navigation between creation steps.
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { CreateTunnelState, Node } from '@/types/store';

export const useCreateTunnelStore = defineStore('createTunnel', () => {
  // ============================================================================
  // State
  // ============================================================================

  const currentPage = ref<'node-selection' | 'tunnel-config'>('node-selection');
  const selectedNode = ref<Node | null>(null);

  // ============================================================================
  // Getters
  // ============================================================================

  /**
   * Check if a node has been selected
   */
  const isNodeSelected = computed(() => selectedNode.value !== null);

  /**
   * Get the current page name
   */
  const currentPageName = computed(() => currentPage.value);

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Select a node and navigate to tunnel configuration page
   * @param node - The node to select
   */
  function selectNode(node: Node) {
    selectedNode.value = node;
    currentPage.value = 'tunnel-config';
  }

  /**
   * Go back to node selection page
   */
  function goBackToNodeSelection() {
    selectedNode.value = null;
    currentPage.value = 'node-selection';
  }

  /**
   * Reset the create flow to initial state
   */
  function resetCreateFlow() {
    selectedNode.value = null;
    currentPage.value = 'node-selection';
  }

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    currentPage,
    selectedNode,
    // Getters
    isNodeSelected,
    currentPageName,
    // Actions
    selectNode,
    goBackToNodeSelection,
    resetCreateFlow,
  };
});
