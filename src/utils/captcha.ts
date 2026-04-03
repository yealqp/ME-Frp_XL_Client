/**
 * 隐式验证码工具
 * 使用 Cap.js 进行隐式人机验证
 */

import Cap from "@cap.js/widget";

interface CaptchaOptions {
  siteId?: string;
  workerCount?: number;
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
}

interface CaptchaInstance {
  verify: () => Promise<string>;
  reset: () => void;
  getToken: () => string | null;
  destroy: () => void;
  isInitialized: () => boolean;
}

/**
 * 创建验证码实例
 * @param options 配置选项
 * @returns 验证码实例
 */
export function createCaptcha(options: CaptchaOptions = {}): CaptchaInstance {
  const {
    siteId = "2bf50e050d",
    workerCount = 2,
    onProgress,
    onError,
  } = options;

  let capInstance: any = null;
  let initialized = false;
  let currentToken: string | null = null;
  let initPromise: Promise<void> | null = null;

  /**
   * 初始化 Cap 实例
   */
  const init = async (): Promise<void> => {
    if (initialized) return;
    
    // 如果正在初始化，等待初始化完成
    if (initPromise) {
      return initPromise;
    }

    initPromise = (async () => {
      try {
        console.log("开始初始化 Cap.js 隐式验证...");
        
        // 创建 Cap 实例
        capInstance = new Cap({
          apiEndpoint: `https://captcha.mefrp.yealqp.cn/${siteId}/`,
          workerCount: workerCount,
        } as any);

        // 监听进度事件
        if (onProgress) {
          capInstance.addEventListener("progress", (event: any) => {
            const progress = event.detail?.progress || 0;
            console.log(`Cap.js 隐式验证进度: ${progress}%`);
            onProgress(progress);
          });
        }

        // 监听错误事件
        if (onError) {
          capInstance.addEventListener("error", (event: any) => {
            const error = event.detail?.error || "验证失败";
            console.error("Cap.js 隐式验证错误:", error);
            onError(error);
          });
        }

        initialized = true;
        console.log("Cap.js 隐式验证实例初始化成功");
      } catch (error) {
        console.error("Cap.js 隐式验证初始化失败:", error);
        const errorMessage = error instanceof Error ? error.message : "验证组件初始化失败";
        if (onError) {
          onError(errorMessage);
        }
        throw error;
      }
    })();

    return initPromise;
  };

  /**
   * 触发验证
   * @returns 验证 token
   */
  const verify = async (): Promise<string> => {
    try {
      // 确保已初始化
      await init();

      if (!initialized || !capInstance) {
        throw new Error("验证组件未初始化");
      }

      console.log("开始 Cap.js 隐式验证...");

      // 调用 solve() 方法
      const result = await capInstance.solve();

      // 处理不同的返回类型
      let token: string;
      if (typeof result === "string") {
        token = result;
      } else if (result && typeof result === "object" && "token" in result) {
        token = result.token;
      } else {
        console.error("Cap.js 返回了意外的格式:", result);
        throw new Error("验证失败：返回格式错误");
      }

      if (!token || typeof token !== "string") {
        throw new Error("验证失败：token 格式错误");
      }

      currentToken = token;
      console.log("Cap.js 隐式验证成功，token 长度:", token.length);

      return token;
    } catch (error) {
      console.error("Cap.js 隐式验证失败:", error);
      const errorMessage = error instanceof Error ? error.message : "验证失败";
      if (onError) {
        onError(errorMessage);
      }
      throw error;
    }
  };

  /**
   * 重置验证状态
   */
  const reset = (): void => {
    if (capInstance && typeof capInstance.reset === "function") {
      capInstance.reset();
      currentToken = null;
      console.log("Cap.js 隐式验证已重置");
    }
  };

  /**
   * 获取当前 token
   * @returns 当前的验证 token
   */
  const getToken = (): string | null => {
    return currentToken || (capInstance ? capInstance.token : null);
  };

  /**
   * 销毁实例，释放资源
   */
  const destroy = (): void => {
    if (capInstance) {
      // 直接清空实例引用，让垃圾回收处理
      // Cap.js 实例会在引用清空后自动清理
      capInstance = null;
      initialized = false;
      currentToken = null;
      initPromise = null;
      console.log("Cap.js 隐式验证实例已销毁");
    }
  };

  /**
   * 检查是否已初始化
   * @returns 是否已初始化
   */
  const isInitialized = (): boolean => {
    return initialized;
  };

  // 自动初始化
  init().catch((error) => {
    console.error("自动初始化失败:", error);
  });

  return {
    verify,
    reset,
    getToken,
    destroy,
    isInitialized,
  };
}

/**
 * 全局单例验证码实例
 */
let globalCaptchaInstance: CaptchaInstance | null = null;

/**
 * 获取全局验证码实例
 * @param options 配置选项
 * @returns 验证码实例
 */
export function getCaptchaInstance(options?: CaptchaOptions): CaptchaInstance {
  if (!globalCaptchaInstance) {
    globalCaptchaInstance = createCaptcha(options);
  }
  return globalCaptchaInstance;
}

/**
 * 销毁全局验证码实例
 */
export function destroyGlobalCaptcha(): void {
  if (globalCaptchaInstance) {
    globalCaptchaInstance.destroy();
    globalCaptchaInstance = null;
  }
}

/**
 * 快捷验证方法
 * 使用全局实例进行验证
 * @param options 配置选项
 * @returns 验证 token
 */
export async function verifyCaptcha(options?: CaptchaOptions): Promise<string> {
  const instance = getCaptchaInstance(options);
  return instance.verify();
}
