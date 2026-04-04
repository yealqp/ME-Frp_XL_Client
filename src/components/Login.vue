<template>
  <AuthShell>
    <div class="auth-panel-view login-view">
      <div class="auth-panel-header">
        <p class="auth-panel-kicker">欢迎回来</p>
        <h1 class="auth-panel-title">登录到 ME-Frp XL Client</h1>
        <p class="auth-panel-subtitle">{{ panelSubtitle }}</p>
      </div>

      <n-form
        ref="formRef"
        :model="loginForm"
        :rules="rules"
        class="auth-form"
        @submit.prevent="handleLogin"
      >
        <template v-if="!isTokenMode">
          <n-form-item path="username">
            <n-input
              v-model:value="loginForm.username"
              placeholder="用户名 / 邮箱"
              size="large"
              :disabled="isLogging"
            />
          </n-form-item>

          <n-form-item path="password">
            <n-input
              v-model:value="loginForm.password"
              type="password"
              placeholder="密码"
              size="large"
              :disabled="isLogging"
              show-password-on="mousedown"
            />
          </n-form-item>

          <n-alert type="warning" :show-icon="false" class="auth-inline-alert">
            如果无法点击或输入，请重装 webview 运行时（
            <n-button
              text
              type="primary"
              size="small"
              class="auth-inline-link inline-link-btn"
              @click="openWebWievPage"
            >
              Openlist
            </n-button>
            内有安装包）后重启应用。
          </n-alert>
        </template>

        <template v-else>
          <n-form-item path="userToken">
            <n-input
              v-model:value="loginForm.userToken"
              placeholder="请输入您的 Token"
              size="large"
              :disabled="isLogging"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 5 }"
            />
          </n-form-item>

          <n-alert type="info" :show-icon="false" class="auth-inline-alert">
            Token 即为用户令牌 / 访问秘钥，请在
            <n-button
              text
              type="primary"
              size="small"
              class="auth-inline-link inline-link-btn"
              @click="openTokenPage"
            >
              官网用户中心
            </n-button>
            最底部复制您的 Token。
          </n-alert>
        </template>

        <n-button
          type="primary"
          size="large"
          block
          :loading="isLogging"
          :disabled="
            isTokenMode
              ? !loginForm.userToken
              : !loginForm.username || !loginForm.password
          "
          class="login-btn auth-submit-btn"
          @click="handleLogin"
        >
          {{ isLogging ? "登录中..." : "登录" }}
        </n-button>
      </n-form>

      <div class="mode-switch-container">
        <n-button
          text
          type="primary"
          class="mode-switch-btn auth-link-btn"
          @click="toggleLoginMode"
        >
          {{ isTokenMode ? "账号登录" : "Token登录" }}
        </n-button>
        <span class="separator">|</span>
        <n-button
          text
          type="primary"
          class="mode-switch-btn auth-link-btn"
          @click="goToRegister"
        >
          注册账号
        </n-button>
      </div>
    </div>
  </AuthShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { useMessage } from "naive-ui";
import { useRouter } from "vue-router";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useAuthStore } from "../stores/auth";
import type { UnifiedConfig } from "../types/config";
import { useCaptchaVerifier } from "@/composables/useCaptchaVerifier";
import { extractErrorMessage } from "@/utils/errorHandler";
import { invokeTauriText } from "@/utils/tauriResponse";
import { mergeUnifiedConfig } from "@/utils/unifiedConfig";
import AuthShell from "./AuthShell.vue";

const emit = defineEmits(["login-success"]);
const message = useMessage();
const router = useRouter();
const authStore = useAuthStore();
const { ensureCaptcha, verifyWithFeedback } = useCaptchaVerifier();

interface LoginForm {
  username: string;
  password: string;
  captchaToken: string;
  userToken: string;
}

interface TokenLoginUserInfo {
  username?: string;
  group?: string;
}

function createEmptyLoginForm(): LoginForm {
  return {
    username: "",
    password: "",
    captchaToken: "",
    userToken: "",
  };
}

// 登录表单数据
const loginForm = ref<LoginForm>(createEmptyLoginForm());

// Token登录模式状态
const isTokenMode = ref(false);

// 表单引用
const formRef = useTemplateRef<any>("formRef");

// 表单验证规则
const rules = computed(() => {
  if (isTokenMode.value) {
    // Token模式下的验证规则
    return {
      userToken: {
        required: true,
        message: "请输入Token",
        trigger: "blur",
      },
    };
  } else {
    // 普通登录模式下的验证规则
    return {
      username: {
        required: true,
        message: "请输入用户名",
        trigger: "blur",
      },
      password: {
        required: true,
        message: "请输入密码",
        trigger: "blur",
      },
      // 移除 captchaToken 验证，因为现在是隐式验证
    };
  }
});

// 登录状态
const isLogging = ref(false);

function resetLoginForm() {
  loginForm.value = createEmptyLoginForm();
}

function finishLogin(config: UnifiedConfig) {
  authStore.login({
    userToken: config.userToken,
    username: config.username,
    group: config.group,
    frpToken: config.frpToken,
  });
  emit("login-success");
}

async function openExternalPage(url: string, fallbackUrl = url) {
  try {
    await openUrl(url);
  } catch (error) {
    console.error("打开链接失败:", error);
    message.error(`无法打开链接，请手动访问 ${fallbackUrl}`);
  }
}

function getTokenLoginErrorMessage(error: unknown): string {
  const errorMessage = extractErrorMessage(error, "Token登录失败");

  if (errorMessage.includes("未找到有效的token")) {
    return "Token验证失败，请检查Token是否正确或已过期";
  }

  if (errorMessage.includes("配置保存失败")) {
    return "配置保存失败，请检查应用权限或重试";
  }

  if (errorMessage.includes("未找到配置文件")) {
    return "配置文件加载失败，请重启应用后重试";
  }

  return errorMessage;
}

async function buildTokenLoginConfig(userToken: string): Promise<UnifiedConfig> {
  const normalizedToken = userToken.trim();

  if (!normalizedToken) {
    throw new Error("请输入有效的Token");
  }

  await mergeUnifiedConfig({ userToken: normalizedToken });

  const userInfo = await invoke<TokenLoginUserInfo>("api_get_user_info");
  const frpToken = await invokeTauriText("api_get_frp_token");

  return mergeUnifiedConfig({
    userToken: normalizedToken,
    username: userInfo.username || "",
    group: userInfo.group || "",
    frpToken,
  });
}

/**
 * 切换登录模式（普通登录 <-> Token登录）
 */
function toggleLoginMode() {
  isTokenMode.value = !isTokenMode.value;
  resetLoginForm();

  // 如果切换到普通登录模式，初始化验证码实例
  if (!isTokenMode.value) {
    ensureCaptcha();
  }

  console.log("切换登录模式:", isTokenMode.value ? "Token模式" : "普通模式");
}

/**
 * 跳转到注册页面
 */
function goToRegister() {
  router.push("/register");
}

/**
 * 打开Token获取页面
 * 使用Tauri的opener插件在默认浏览器中打开链接
 */
async function openTokenPage() {
  await openExternalPage("https://www.mefrp.com/dashboard/profile");
}

async function openWebWievPage() {
  await openExternalPage(
    "https://alist.yealqp.cn/mefrp-desktop/ME-Frp%20XL%20%E5%AE%A2%E6%88%B7%E7%AB%AF",
    "https://alist.yealqp.cn/mefrp-desktop/ME-Frp XL客户端",
  );
}

/**
 * 处理Token登录
 * 直接将输入的token存储为usertoken，然后调用用户信息API验证token有效性
 */
async function handleTokenLogin() {
  const config = await buildTokenLoginConfig(loginForm.value.userToken);

  message.destroyAll();
  message.success("Token登录成功");
  finishLogin(config);
}

async function handleAccountLogin() {
  const captchaToken = await verifyWithFeedback({ message });

  loginForm.value.captchaToken = captchaToken;
  message.loading("正在登录中，请稍候...", { duration: 0 });

  const config = await invoke<UnifiedConfig>("api_login", {
    username: loginForm.value.username,
    password: loginForm.value.password,
    captchaToken,
  });

  message.destroyAll();
  message.success("登录成功");
  finishLogin(config);
}

// 处理登录
async function handleLogin() {
  if (isLogging.value) return;

  // 表单验证
  try {
    await formRef.value?.validate();
  } catch (error) {
    console.log("表单验证失败:", error);
    return;
  }

  isLogging.value = true;

  try {
    if (isTokenMode.value) {
      message.loading("正在登录中，请稍候...", { duration: 0 });
      await handleTokenLogin();
    } else {
      await handleAccountLogin();
    }
  } catch (error) {
    message.destroyAll();
    console.error("登录失败:", error);
    const errorMessage = isTokenMode.value
      ? getTokenLoginErrorMessage(error)
      : extractErrorMessage(error, "登录失败，请检查用户名和密码");
    message.error(errorMessage);
  } finally {
    isLogging.value = false;
  }
}

onMounted(async () => {
  console.log("登录组件已加载，准备登录");

  if (!isTokenMode.value) {
    ensureCaptcha();
  }
});

const panelSubtitle = computed(() =>
  isTokenMode.value
    ? "复制官网 Token 后即可直接进入 XL Client。"
    : "使用 ME-Frp 账号继续管理你的节点与隧道。",
);
</script>

<style scoped>
.login-view {
  width: 100%;
}

.login-btn {
  margin-top: 4px;
}

.inline-link-btn {
  padding: 0;
  font-size: 14px;
}

.mode-switch-container {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--auth-divider-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
}

.separator {
  margin: 0 8px;
  color: var(--auth-muted-color);
}

.mode-switch-btn {
  font-size: 13px;
}

:deep(.mode-switch-btn.n-button) {
  padding: 4px 8px;
}

:deep(.mode-switch-btn.n-button .n-button__content) {
  font-size: 13px;
}

@media (max-width: 480px) {
  .mode-switch-container {
    margin-top: 16px;
    padding-top: 14px;
  }

  .separator {
    display: none;
  }

  .mode-switch-btn {
    font-size: 12px;
  }
}
</style>
