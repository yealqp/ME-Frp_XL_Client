import { ref, onUnmounted, onBeforeUnmount } from 'vue';

// 导入 Cap.js Widget 模块
import '@cap.js/widget';

// 本地类型定义
interface CapConfig {
  apiEndpoint: string;
  siteId?: string;
  workerCount?: number;
  hiddenFieldName?: string;
  i18n?: {
    verifyingLabel?: string;
    initialState?: string;
    solvedLabel?: string;
    errorLabel?: string;
    verifyAriaLabel?: string;
    verifyingAriaLabel?: string;
    verifiedAriaLabel?: string;
    errorAriaLabel?: string;
  };
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    borderRadius?: string;
    fontFamily?: string;
  };
}

interface CapSolveEvent extends CustomEvent {
  detail: {
    token: string;
  };
}

interface CapWidget extends HTMLElement {
  addEventListener(type: 'solve', listener: (event: CapSolveEvent) => void): void;
  addEventListener(type: 'error', listener: (event: any) => void): void;
  addEventListener(type: 'reset', listener: (event: CustomEvent) => void): void;
  addEventListener(type: 'progress', listener: (event: any) => void): void;
  removeEventListener(type: 'solve', listener: (event: CapSolveEvent) => void): void;
  removeEventListener(type: 'error', listener: (event: any) => void): void;
  removeEventListener(type: 'reset', listener: (event: CustomEvent) => void): void;
  removeEventListener(type: 'progress', listener: (event: any) => void): void;
  reset?(): void;
}

export function useCap(config: CapConfig) {
  const capWidget = ref<CapWidget | null>(null);
  const isLoading = ref(true);
  const isVerified = ref(false);
  const token = ref<string | null>(null);
  const error = ref<string | null>(null);
  const isMounted = ref(true);

  // 不再需要动态加载脚本，因为已经通过 import 导入
  const ensureCapReady = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!isMounted.value) {
        reject(new Error('Component unmounted'));
        return;
      }

      // 等待 Cap.js 自定义元素注册完成
      if (customElements.get('cap-widget')) {
        resolve();
        return;
      }

      // 等待自定义元素定义
      const checkElement = () => {
        if (customElements.get('cap-widget')) {
          resolve();
        } else if (isMounted.value) {
          setTimeout(checkElement, 50);
        } else {
          reject(new Error('Component unmounted while waiting for Cap.js'));
        }
      };

      checkElement();
    });
  };

  const destroyWidget = (): void => {
    if (capWidget.value) {
      try {
        // 移除所有事件监听器
        capWidget.value.removeEventListener('solve', handleSolve);
        capWidget.value.removeEventListener('error', handleError);
        capWidget.value.removeEventListener('reset', handleReset);
        capWidget.value.removeEventListener('progress', handleProgress);
        
        // 重置状态
        isVerified.value = false;
        token.value = null;
        error.value = null;
        
        // 清空 widget 引用
        capWidget.value = null;
      } catch (err) {
        console.warn('Failed to destroy Cap widget:', err);
      }
    }
  };

  const handleSolve = (event: CapSolveEvent) => {
    if (isMounted.value) {
      const captchaToken = event.detail.token;
      if (captchaToken) {
        isVerified.value = true;
        token.value = captchaToken;
        console.log('Cap.js verification completed:', captchaToken);
      }
    }
  };

  const handleError = (event: any) => {
    if (isMounted.value) {
      const errorMessage = event.detail?.error || 'Cap.js verification failed';
      error.value = errorMessage;
      console.error('Cap.js error:', errorMessage);
    }
  };

  const handleReset = (_event: CustomEvent) => {
    if (isMounted.value) {
      isVerified.value = false;
      token.value = null;
      error.value = null;
      console.log('Cap.js widget reset');
    }
  };

  const handleProgress = (_event: any) => {
    // if (isMounted.value) {
    //   const progress = event.detail?.progress || 0;
    //   console.log('Cap.js progress:', progress);
    //   // 可以在这里添加进度状态管理
    // }
  };

  const initCap = async (containerId: string) => {
    try {
      if (!isMounted.value) {
        return;
      }

      isLoading.value = true;
      error.value = null;

      // 确保容器存在
      let container: Element | null = null;
      let retryCount = 0;
      const maxRetries = 5;

      while (retryCount < maxRetries && isMounted.value) {
        container = document.querySelector(containerId);
        if (container && document.contains(container)) {
          break;
        }

        if (retryCount < maxRetries - 1) {
          console.log(`Container ${containerId} not ready, retrying... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        retryCount++;
      }

      if (!container || !document.contains(container)) {
        if (isMounted.value) {
          throw new Error(`Container ${containerId} not found after ${maxRetries} attempts`);
        }
        return;
      }

      // 销毁现有 widget（如果存在）
      destroyWidget();

      // 确保 Cap.js 准备就绪
      await ensureCapReady();

      if (!isMounted.value) {
        return;
      }

      // 创建 cap-widget 元素
      const capWidgetElement = document.createElement('cap-widget') as CapWidget;
      capWidgetElement.id = `cap-${Math.random().toString(36).substr(2, 9)}`;
      capWidgetElement.setAttribute('data-cap-api-endpoint', config.apiEndpoint);
      
      // 设置可选属性
      if (config.siteId) {
        capWidgetElement.setAttribute('data-cap-site-id', config.siteId);
      }
      if (config.workerCount) {
        capWidgetElement.setAttribute('data-cap-worker-count', config.workerCount.toString());
      }
      if (config.hiddenFieldName) {
        capWidgetElement.setAttribute('data-cap-hidden-field-name', config.hiddenFieldName);
      } else {
        capWidgetElement.setAttribute('data-cap-hidden-field-name', 'cap-token');
      }
      
      // 设置国际化属性
      if (config.i18n) {
        const i18n = config.i18n;
        if (i18n.verifyingLabel) capWidgetElement.setAttribute('data-cap-i18n-verifying-label', i18n.verifyingLabel);
        if (i18n.initialState) capWidgetElement.setAttribute('data-cap-i18n-initial-state', i18n.initialState);
        if (i18n.solvedLabel) capWidgetElement.setAttribute('data-cap-i18n-solved-label', i18n.solvedLabel);
        if (i18n.errorLabel) capWidgetElement.setAttribute('data-cap-i18n-error-label', i18n.errorLabel);
        if (i18n.verifyAriaLabel) capWidgetElement.setAttribute('data-cap-i18n-verify-aria-label', i18n.verifyAriaLabel);
        if (i18n.verifyingAriaLabel) capWidgetElement.setAttribute('data-cap-i18n-verifying-aria-label', i18n.verifyingAriaLabel);
        if (i18n.verifiedAriaLabel) capWidgetElement.setAttribute('data-cap-i18n-verified-aria-label', i18n.verifiedAriaLabel);
        if (i18n.errorAriaLabel) capWidgetElement.setAttribute('data-cap-i18n-error-aria-label', i18n.errorAriaLabel);
      }

      // 应用主题样式
      if (config.theme) {
        // 应用 CSS 变量到 widget 元素
        const theme = config.theme;
        if (theme.primaryColor) capWidgetElement.style.setProperty('--cap-primary-color', theme.primaryColor);
        if (theme.backgroundColor) capWidgetElement.style.setProperty('--cap-background-color', theme.backgroundColor);
        if (theme.borderColor) capWidgetElement.style.setProperty('--cap-border-color', theme.borderColor);
        if (theme.textColor) capWidgetElement.style.setProperty('--cap-text-color', theme.textColor);
        if (theme.borderRadius) capWidgetElement.style.setProperty('--cap-border-radius', theme.borderRadius);
        if (theme.fontFamily) capWidgetElement.style.setProperty('--cap-font-family', theme.fontFamily);
      }

      // 设置site ID（如果提供）
      if (config.siteId) {
        capWidgetElement.setAttribute('data-cap-site-id', config.siteId);
      }

      // 清空容器并添加 widget
      container.innerHTML = '';
      container.appendChild(capWidgetElement);

      // 设置事件监听器
      capWidgetElement.addEventListener('solve', handleSolve);
      capWidgetElement.addEventListener('error', handleError);
      capWidgetElement.addEventListener('reset', handleReset);
      capWidgetElement.addEventListener('progress', handleProgress);

      // 保存 widget 引用
      capWidget.value = capWidgetElement;

      // 等待 widget 初始化完成
      await new Promise(resolve => setTimeout(resolve, 200));

      if (isMounted.value) {
        isLoading.value = false;
      }
    } catch (err) {
      if (isMounted.value) {
        const errorMessage = err instanceof Error ? err.message : 'Cap.js 初始化失败';
        error.value = errorMessage;
        isLoading.value = false;
      }
    }
  };

  const reset = (force = false) => {
    if (capWidget.value && isMounted.value) {
      try {
        // Cap.js widget 支持重置功能
        if (typeof capWidget.value.reset === 'function') {
          capWidget.value.reset();
        } else {
          // 如果没有 reset 方法，重新创建 widget
          const container = capWidget.value.parentElement;
          if (container) {
            const containerId = `#${container.id}`;
            initCap(containerId);
          }
        }
        
        if (force) {
          isVerified.value = false;
          token.value = null;
        } else {
          isVerified.value = false;
        }
      } catch (err) {
        console.warn('Failed to reset Cap widget:', err);
        isVerified.value = false;
        if (force) {
          token.value = null;
        }
      }
    }
  };

  const destroy = () => {
    isMounted.value = false;
    destroyWidget();
  };

  // 组件卸载时清理资源
  onBeforeUnmount(() => {
    isMounted.value = false;
  });

  onUnmounted(() => {
    destroy();
  });

  return {
    isLoading,
    isVerified,
    token,
    error,
    capWidget,
    initCap,
    reset,
    destroy,
  };
}
