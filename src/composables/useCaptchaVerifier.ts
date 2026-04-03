import { useMessage } from "naive-ui";
import { onUnmounted } from "vue";
import { createCaptcha } from "@/utils/captcha";

type MessageApi = ReturnType<typeof useMessage>;

interface UseCaptchaVerifierOptions {
  siteId?: string;
  workerCount?: number;
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
}

interface CaptchaFeedbackOptions {
  message: MessageApi;
  loadingText?: string;
  failureText?: string;
}

type CaptchaInstance = ReturnType<typeof createCaptcha>;

const defaultProgressHandler = (progress: number) => {
  console.log(`验证进度: ${progress}%`);
};

const defaultErrorHandler = (error: string) => {
  console.error("验证错误:", error);
};

export function useCaptchaVerifier(options: UseCaptchaVerifierOptions = {}) {
  let captchaInstance: CaptchaInstance | null = null;

  function ensureCaptcha(): CaptchaInstance {
    if (!captchaInstance) {
      captchaInstance = createCaptcha({
        ...options,
        onProgress: options.onProgress ?? defaultProgressHandler,
        onError: options.onError ?? defaultErrorHandler,
      });
    }

    return captchaInstance;
  }

  async function verifyCaptcha(): Promise<string> {
    return ensureCaptcha().verify();
  }

  async function verifyWithFeedback({
    message,
    loadingText = "正在进行人机验证，请稍候...",
    failureText = "人机验证失败，请重试",
  }: CaptchaFeedbackOptions): Promise<string> {
    message.loading(loadingText, { duration: 0 });

    try {
      return await verifyCaptcha();
    } catch (error) {
      console.error(failureText, error);
      throw new Error(failureText);
    } finally {
      message.destroyAll();
    }
  }

  function destroyCaptcha(): void {
    if (!captchaInstance) {
      return;
    }

    captchaInstance.destroy();
    captchaInstance = null;
  }

  onUnmounted(destroyCaptcha);

  return {
    ensureCaptcha,
    verifyCaptcha,
    verifyWithFeedback,
    destroyCaptcha,
  };
}
