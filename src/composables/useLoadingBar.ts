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
  
  // If there are pending requests, finish them immediately
  // This handles the case where routes were navigated before the loading bar was initialized
  if (activeRequests > 0) {
    activeRequests = 0;
    loadingBarInstance.finish();
  }
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
  } else {
    // If loading bar is not initialized yet, just increment the counter
    // It will be handled when the instance is set
    activeRequests++;
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
 *
 * 仅在存在未完成请求时清零并显示错误，避免误清其它组件的进行中计数
 */
export function errorLoading() {
  if (loadingBarInstance && activeRequests > 0) {
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
