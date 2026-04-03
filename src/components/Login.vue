<template>
  <div class="login-container">
    <n-card class="login-card" :bordered="true">
      <!-- 登录标题 -->
      <h1 class="login-title">登录到ME-Frp XL客户端</h1>

        <!-- 登录表单 -->
        <n-form
          ref="formRef"
          :model="loginForm"
          :rules="rules"
          @submit.prevent="handleLogin"
        >
          <!-- 普通登录模式 -->
          <template v-if="!isTokenMode">
            <n-form-item path="username">
              <n-input
                v-model:value="loginForm.username"
                placeholder="用户名/邮箱"
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

            <!-- 登录提示 -->
            <n-alert type="warning" :show-icon="false">
                如果无法点击/输入 请重装webview运行时(
                  <n-button
                  text
                  type="primary"
                  size="small"
                  @click="openWebWievPage"
                  style="padding: 0; font-size: 14px"
                >
                  Openlist
                </n-button>内有安装包)后重启应用
            </n-alert>
          </template>

          <!-- Token登录模式 -->
          <template v-else>
            <n-form-item path="userToken">
              <n-input
                v-model:value="loginForm.userToken"
                placeholder="请输入您的Token"
                size="large"
                :disabled="isLogging"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 5 }"
              />
            </n-form-item>
               <!-- Token说明提示 -->
            <n-alert type="info" :show-icon="false">
             
                Token即为用户令牌/访问秘钥，请在
                <n-button
                  text
                  type="primary"
                  size="small"
                  @click="openTokenPage"
                  style="padding: 0; font-size: 14px"
                >
                  官网用户中心
                </n-button>
                最底部复制您的token
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
            @click="handleLogin"
            class="login-btn"
          >
            {{ isLogging ? "登录中..." : "登录" }}
          </n-button>
        </n-form>

        <!-- 模式切换按钮 -->
        <div class="mode-switch-container">
          <n-button
            text
            type="primary"
            @click="toggleLoginMode"
            class="mode-switch-btn"
          >
            {{ isTokenMode ? "账号登录" : "Token登录" }}
          </n-button>
          <span class="separator">|</span>
          <n-button
            text
            type="primary"
            @click="goToRegister"
            class="mode-switch-btn"
          >
            注册账号
          </n-button>
        </div>
    </n-card>
  </div>
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
import { mergeUnifiedConfig } from "@/utils/unifiedConfig";

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
  const frpToken = await invoke<string>("api_get_frp_token");

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
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-bg-color);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  animation: slideUp 0.6s ease-out;
  position: relative;
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-title {
  text-align: center;
  color: var(--app-primary-color);
  margin-bottom: 30px;
  font-size: 24px;
  font-weight: 600;
}

.login-btn {
  margin-top: 8px;
}

/* 使用 :deep() 确保样式优先级 */
/* 登录按钮使用反向的颜色：浅色模式用浅蓝，深色模式用深蓝 */
:deep(.login-btn.n-button--primary-type) {
  background-color: var(--login-btn-bg, #349ff4) !important;
  border-color: var(--login-btn-bg, #349ff4) !important;
  color: #ffffff !important;
}

:deep(.login-btn.n-button--primary-type:hover:not(.n-button--disabled)) {
  background-color: var(--login-btn-bg-hover, #4da8f5) !important;
  border-color: var(--login-btn-bg-hover, #4da8f5) !important;
  color: #ffffff !important;
}

:deep(.login-btn.n-button--primary-type:active:not(.n-button--disabled)) {
  background-color: var(--login-btn-bg-pressed, #2891f3) !important;
  border-color: var(--login-btn-bg-pressed, #2891f3) !important;
  color: #ffffff !important;
}

.vaptcha-section {
  margin: 15px 0;
}

/* 模式切换按钮容器 */
.mode-switch-container {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--app-border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.separator {
  margin: 0 8px;
  color: var(--app-text-color-3);
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
  .login-card {
    padding: 30px 20px;
    margin: 10px;
  }

  .login-title {
    font-size: 20px;
    margin-bottom: 20px;
  }

  .mode-switch-container {
    margin-top: 16px;
    padding-top: 16px;
  }

  .mode-switch-btn {
    font-size: 12px;
  }
}
</style>
