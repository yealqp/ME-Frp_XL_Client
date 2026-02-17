/**
 * Global Loading Bar Composable
 * 
 * Provides a unified interface for controlling the global loading bar
 * Used for route transitions and API requests
 */

import type { LoadingBarProviderInst } from 'naive-ui';

let loadingBarInstance: LoadingBarProviderInst | null = null;
let activeRequests = 0;

/**
 * Set the loading bar instance (called from App.vue)
 */
export function setLoadingBar(instance: LoadingBarProviderInst) {
  loadingBarInstance = instance;
}

/**
 * Start the loading bar
 */
export function startLoading() {
  if (loadingBarInstance) {
    activeRequests++;
    if (activeRequests === 1) {
      loadingBarInstance.start();
    }
  }
}

/**
 * Finish the loading bar (success)
 */
export function finishLoading() {
  if (loadingBarInstance && activeRequests > 0) {
    activeRequests--;
    if (activeRequests === 0) {
      loadingBarInstance.finish();
    }
  }
}

/**
 * Error state for loading bar
 */
export function errorLoading() {
  if (loadingBarInstance) {
    activeRequests = 0;
    loadingBarInstance.error();
  }
}

/**
 * Composable for using loading bar in components
 */
export function useLoadingBar() {
  return {
    start: startLoading,
    finish: finishLoading,
    error: errorLoading,
  };
}
