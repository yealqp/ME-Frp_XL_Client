<template>
  <AuthShell>
    <div class="auth-panel-view register-view">
      <div class="auth-panel-header">
        <p class="auth-panel-kicker">快速创建账号</p>
        <h1 class="auth-panel-title">注册 ME-Frp 账号</h1>
        <p class="auth-panel-subtitle">{{ panelSubtitle }}</p>
      </div>

      <n-form
        ref="formRef"
        :model="registerForm"
        :rules="rules"
        class="auth-form"
        @submit.prevent="handleRegister"
      >
        <n-form-item path="username">
          <n-input
            v-model:value="registerForm.username"
            placeholder="用户名"
            size="large"
            :disabled="isRegistering"
          />
        </n-form-item>

        <n-form-item path="email" class="email-form-item">
          <div class="email-input-wrapper">
            <n-input
              v-model:value="registerForm.email"
              placeholder="邮箱地址"
              size="large"
              :disabled="isRegistering || emailSent"
              class="email-input"
            />
            <n-button
              type="primary"
              size="large"
              :disabled="!canSendCode || countdown > 0"
              :loading="isSendingCode"
              class="send-code-btn"
              @click="sendEmailCode"
            >
              {{ countdown > 0 ? `${countdown}秒` : "发送验证码" }}
            </n-button>
          </div>
        </n-form-item>

        <n-form-item v-if="emailSent" path="emailCode">
          <n-input
            v-model:value="registerForm.emailCode"
            placeholder="请输入邮箱验证码"
            size="large"
            :disabled="isRegistering"
          />
        </n-form-item>

        <n-form-item path="password">
          <n-input
            v-model:value="registerForm.password"
            type="password"
            placeholder="密码"
            size="large"
            :disabled="isRegistering"
            show-password-on="mousedown"
          />
        </n-form-item>

        <n-alert
          v-if="registerForm.password && passwordStrength.type !== 'default'"
          :type="passwordStrength.type"
          :show-icon="false"
          class="auth-inline-alert password-strength-alert"
          size="small"
        >
          {{ passwordStrength.text }}
        </n-alert>

        <n-form-item path="confirmPassword">
          <n-input
            v-model:value="registerForm.confirmPassword"
            type="password"
            placeholder="确认密码"
            size="large"
            :disabled="isRegistering"
            show-password-on="mousedown"
          />
        </n-form-item>

        <n-button
          type="primary"
          size="large"
          block
          :loading="isRegistering"
          :disabled="!canRegister"
          class="register-btn auth-submit-btn"
          @click="handleRegister"
        >
          {{ isRegistering ? "注册中..." : "注册" }}
        </n-button>
      </n-form>

      <div class="back-to-login">
        <n-button
          text
          type="primary"
          class="back-btn auth-link-btn"
          @click="goToLogin"
        >
          已有账号？返回登录
        </n-button>
      </div>
    </div>
  </AuthShell>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from "vue";
import { useMessage } from "naive-ui";
import { useRouter } from "vue-router";
import { useCaptchaVerifier } from "@/composables/useCaptchaVerifier";
import { extractErrorMessage } from "@/utils/errorHandler";
import { invokeTauriResponse } from "@/utils/tauriResponse";
import AuthShell from "./AuthShell.vue";

const emit = defineEmits(["register-success"]);
const message = useMessage();
const router = useRouter();
const { ensureCaptcha, verifyWithFeedback } = useCaptchaVerifier();

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  emailCode: string;
}

// 注册表单数据
const registerForm = ref<RegisterForm>({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  emailCode: "",
});

// 表单引用
const formRef = useTemplateRef<any>("formRef");

// 倒计时
const countdown = ref(0);
let countdownTimer: number | null = null;

// 是否已发送验证码
const emailSent = ref(false);

function clearCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function startCountdown() {
  clearCountdown();
  countdown.value = 60;
  countdownTimer = window.setInterval(() => {
    countdown.value--;

    if (countdown.value <= 0) {
      clearCountdown();
    }
  }, 1000);
}

// 表单验证规则
const rules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 4, max: 16, message: "用户名长度应在4-16个字符之间", trigger: "blur" },
    {
      validator: (_rule: any, value: string) => {
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          return new Error("用户名只能包含字母、数字和下划线");
        }
        return true;
      },
      trigger: "blur",
    },
  ],
  email: [
    { required: true, message: "请输入邮箱地址", trigger: "blur" },
    { type: "email", message: "请输入有效的邮箱地址", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 8, max: 16, message: "密码长度应在8-16个字符之间", trigger: "blur" },
    {
      validator: (_rule: any, value: string) => {
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return new Error("密码必须包含大小写字母和数字");
        }
        return true;
      },
      trigger: "blur",
    },
  ],
  confirmPassword: [
    { required: true, message: "请再次输入密码", trigger: "blur" },
    {
      validator: (_rule: any, value: string) => {
        if (value !== registerForm.value.password) {
          return new Error("两次输入的密码不一致");
        }
        return true;
      },
      trigger: "blur",
    },
  ],
  emailCode: [
    { required: true, message: "请输入邮箱验证码", trigger: "blur" },
  ],
};

// 注册状态
const isRegistering = ref(false);
const isSendingCode = ref(false);

// 是否可以发送验证码
const canSendCode = computed(() => {
  return (
    registerForm.value.email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.value.email) &&
    countdown.value === 0
  );
});

// 是否可以注册
const canRegister = computed(() => {
  return (
    registerForm.value.username &&
    registerForm.value.email &&
    registerForm.value.password &&
    registerForm.value.confirmPassword &&
    registerForm.value.emailCode &&
    registerForm.value.password === registerForm.value.confirmPassword
  );
});

const panelSubtitle = computed(() =>
  emailSent.value
    ? "验证码已发送，请继续完成账号创建。"
    : "注册后即可在 XL Client 中集中管理节点、隧道与运行状态。",
);

// 密码强度检查
const passwordStrength = computed(() => {
  const password = registerForm.value.password;
  if (!password) {
    return { type: "default", text: "" };
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const validLength = password.length >= 8 && password.length <= 16;

  if (!validLength) {
    return { type: "error", text: "密码长度必须为8-16位" };
  }

  if (!hasLower || !hasUpper || !hasNumber) {
    return { type: "warning", text: "密码必须包含大小写字母和数字" };
  }

  // 检查是否有特殊字符（可选，增强强度）
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (hasSpecial) {
    return { type: "success", text: "密码强度：强" };
  }

  return { type: "info", text: "密码强度：中等" };
});

/**
 * 发送邮箱验证码
 */
async function sendEmailCode() {
  if (!canSendCode.value || isSendingCode.value) return;

  try {
    isSendingCode.value = true;
    const captchaToken = await verifyWithFeedback({ message });

    message.loading("正在发送验证码...", { duration: 0 });

    // 调用后端API发送验证码
    const result = await invokeTauriResponse<null>("api_send_email_code", {
      email: registerForm.value.email,
      captchaToken,
    });

    if (result.code === 200) {
      message.destroyAll();
      message.success("验证码已发送至您的邮箱，请注意查收");

      // 标记已发送验证码
      emailSent.value = true;

      // 开始倒计时
      startCountdown();
    } else {
      throw new Error(result.message || "发送验证码失败");
    }
  } catch (error) {
    message.destroyAll();
    console.error("发送验证码失败:", error);
    message.error(extractErrorMessage(error, "发送验证码失败"));
  } finally {
    isSendingCode.value = false;
  }
}

/**
 * 处理注册
 */
async function handleRegister() {
  if (!canRegister.value || isRegistering.value) return;

  // 验证表单
  try {
    await formRef.value?.validate();
  } catch (error) {
    return;
  }

  isRegistering.value = true;

  try {
    message.loading("正在注册中，请稍候...", { duration: 0 });

    // 调用后端API注册
    const result = await invokeTauriResponse<null>("api_register", {
      username: registerForm.value.username,
      email: registerForm.value.email,
      password: registerForm.value.password,
      emailCode: registerForm.value.emailCode,
    });

    if (result.code === 200) {
      message.destroyAll();
      message.success(result.message || "注册成功！请登录");
      emit("register-success");

      // 延迟跳转到登录页
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } else {
      throw new Error(result.message || "注册失败");
    }
  } catch (error) {
    message.destroyAll();
    console.error("注册失败:", error);
    message.error(extractErrorMessage(error, "注册失败，请稍后重试"));
  } finally {
    isRegistering.value = false;
  }
}

/**
 * 返回登录页
 */
function goToLogin() {
  router.push("/login");
}

// 组件挂载时初始化验证码
onMounted(() => {
  ensureCaptcha();
});

// 组件卸载时清理
onUnmounted(() => {
  clearCountdown();
});
</script>

<style scoped>
.register-view {
  width: 100%;
}

.email-input-wrapper {
  display: flex;
  align-items: stretch;
  gap: 8px;
  width: 100%;
}

.email-input {
  flex: 1;
}

.send-code-btn {
  flex-shrink: 0;
  min-width: 124px;
}

.register-btn {
  margin-top: 4px;
}

:deep(.send-code-btn.n-button) {
  height: 48px;
  border-radius: 14px;
  backdrop-filter: blur(10px);
  --n-border: 1px solid var(--auth-send-btn-border) !important;
  --n-border-hover: 1px solid var(--auth-send-btn-border-hover) !important;
  --n-border-pressed: 1px solid var(--auth-send-btn-border-hover) !important;
  --n-color: var(--auth-send-btn-bg) !important;
  --n-color-hover: var(--auth-send-btn-bg-hover) !important;
  --n-color-pressed: var(--auth-send-btn-bg-pressed) !important;
  --n-color-disabled: var(--auth-send-btn-bg-disabled) !important;
  --n-text-color: var(--auth-send-btn-text) !important;
  --n-text-color-hover: var(--auth-send-btn-text-hover) !important;
  --n-text-color-pressed: var(--auth-send-btn-text-hover) !important;
  --n-text-color-disabled: var(--auth-send-btn-text-disabled) !important;
}

.password-strength-alert {
  margin-bottom: 18px;
}

.back-to-login {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--auth-divider-color);
  text-align: center;
}

.back-btn {
  font-size: 13px;
}

:deep(.back-btn.n-button) {
  padding: 4px 8px;
}

:deep(.back-btn.n-button .n-button__content) {
  font-size: 13px;
}

@media (max-width: 480px) {
  .email-input-wrapper {
    flex-direction: column;
  }

  .send-code-btn {
    width: 100%;
  }

  .back-btn {
    font-size: 12px;
  }
}
</style>
