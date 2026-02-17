<template>
  <div class="login-container">
    <n-config-provider :theme="customTheme">
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
            size="small"
            @click="toggleLoginMode"
            class="mode-switch-btn"
          >
            {{ isTokenMode ? "账号登录" : "Token登录" }}
          </n-button>
        </div>
      </n-card>
    </n-config-provider>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { darkTheme, useMessage } from "naive-ui";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useAuthStore } from "../stores/auth";
import { createCaptcha } from "../utils/captcha";
import type { UnifiedConfig } from "../types/config";

// 自定义主题配置
const customTheme = {
  ...darkTheme,
  common: {
    ...darkTheme.common,
    bodyColor: "#101014",
    cardColor: "#18181c",
    modalColor: "#18181c",
    popoverColor: "#18181c",
    tableHeaderColor: "#18181c",
    inputColor: "#303033",
    inputColorDisabled: "#303033",
    primaryColor: "#349ff4",
    primaryColorHover: "#4da8f5",
    primaryColorPressed: "#2891f3",
    borderColor: "#29292c",
    dividerColor: "#29292c",
  },
};

const emit = defineEmits(["login-success"]);
const message = useMessage();
const authStore = useAuthStore();

// 登录表单数据
const loginForm = ref({
  username: "",
  password: "",
  captchaToken: "",
  userToken: "", // 新增：用于存储用户输入的token
});

// Token登录模式状态
const isTokenMode = ref(false);

// 验证码实例
let captchaInstance: ReturnType<typeof createCaptcha> | null = null;

// 表单引用
const formRef = ref<any>(null);

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

/**
 * 切换登录模式（普通登录 <-> Token登录）
 */
function toggleLoginMode() {
  isTokenMode.value = !isTokenMode.value;

  // 清空表单数据
  loginForm.value = {
    username: "",
    password: "",
    captchaToken: "",
    userToken: "",
  };

  // 如果切换到普通登录模式，初始化验证码实例
  if (!isTokenMode.value && !captchaInstance) {
    captchaInstance = createCaptcha({
      onProgress: (progress) => {
        console.log(`验证进度: ${progress}%`);
      },
      onError: (error) => {
        console.error("验证错误:", error);
      },
    });
  }

  console.log("切换登录模式:", isTokenMode.value ? "Token模式" : "普通模式");
}

/**
 * 打开Token获取页面
 * 使用Tauri的opener插件在默认浏览器中打开链接
 */
async function openTokenPage() {
  try {
    await openUrl("https://www.mefrp.com/dashboard/profile");
  } catch (error) {
    console.error("打开链接失败:", error);
    message.error(
      "无法打开链接，请手动访问 https://www.mefrp.com/dashboard/profile",
    );
  }
}

async function openWebWievPage() {
  try {
    await openUrl("https://alist.yealqp.cn/mefrp-desktop/ME-Frp%20XL%20%E5%AE%A2%E6%88%B7%E7%AB%AF");
  } catch (error) {
    console.error("打开链接失败:", error);
    message.error(
      "无法打开链接，请手动访问 https://alist.yealqp.cn/mefrp-desktop/ME-Frp XL客户端",
    );
  }
}

/**
 * 处理Token登录
 * 直接将输入的token存储为usertoken，然后调用用户信息API验证token有效性
 */
async function handleTokenLogin() {
  try {
    console.log(
      "开始Token登录，Token长度:",
      loginForm.value.userToken?.length || 0,
    );

    // 验证Token输入
    if (!loginForm.value.userToken || loginForm.value.userToken.trim() === "") {
      throw new Error("请输入有效的Token");
    }

    console.log("步骤1: 加载当前配置...");
    // 首先加载当前配置
    const currentConfig = (await invoke(
      "load_unified_config",
    )) as UnifiedConfig;
    console.log("当前配置加载成功:", {
      hasUserToken: !!currentConfig.userToken,
      userTokenLength: currentConfig.userToken?.length || 0,
    });

    console.log("步骤2: 准备更新配置...");
    // 更新配置中的token - 注意字段名要与后端UnifiedConfig结构体匹配
    const updatedConfig: UnifiedConfig = {
      ...currentConfig,
      userToken: loginForm.value.userToken.trim(), // 使用userToken而不是user_token
    };

    console.log("更新后的配置对象:", {
      hasUserToken: !!updatedConfig.userToken,
      userTokenLength: updatedConfig.userToken?.length || 0,
      configKeys: Object.keys(updatedConfig),
    });

    console.log("步骤3: 保存配置到文件...");
    // 保存更新后的配置
    const saveResult = await invoke("save_unified_config", {
      config: updatedConfig,
    });
    console.log("配置保存结果:", saveResult);

    console.log("步骤4: 验证配置是否保存成功...");
    // 添加短暂延迟确保文件写入完成
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 重新加载配置验证是否保存成功
    const verifyConfig = (await invoke("load_unified_config")) as UnifiedConfig;
    console.log("验证配置加载结果:", {
      hasUserToken: !!verifyConfig.userToken,
      userTokenLength: verifyConfig.userToken?.length || 0,
      userTokenValue: verifyConfig.userToken?.substring(0, 10) + "...",
      expectedToken: loginForm.value.userToken.trim().substring(0, 10) + "...",
      configKeys: Object.keys(verifyConfig),
    });

    if (
      !verifyConfig.userToken ||
      verifyConfig.userToken !== loginForm.value.userToken.trim()
    ) {
      throw new Error("配置保存失败，Token未正确写入配置文件");
    }
    console.log("配置验证成功，Token已正确保存");

    console.log("步骤5: 调用用户信息API验证Token...");
    // 现在调用用户信息API进行验证（不需要传递参数，它会从配置中读取token）
    const userInfo = (await invoke("api_get_user_info")) as any;

    console.log("Token验证成功，获取到用户信息:", userInfo);

    console.log("步骤6: 获取 frpToken...");
    // 获取 frpToken
    const frpToken = (await invoke("api_get_frp_token")) as string;
    console.log("frpToken 获取成功，长度:", frpToken?.length || 0);

    console.log("步骤7: 重新加载配置以获取最新的 frpToken...");
    // 重新加载配置以获取最新的 frpToken（api_get_frp_token 已经自动保存了）
    const latestConfig = (await invoke("load_unified_config")) as UnifiedConfig;
    console.log(
      "最新配置加载成功，frpToken 长度:",
      latestConfig.frpToken?.length || 0,
    );

    console.log("步骤8: 使用用户信息更新配置文件...");
    // 使用获取到的用户信息更新配置，保留已保存的 frpToken
    const completeConfig: UnifiedConfig = {
      ...latestConfig, // 使用最新配置，包含已保存的 frpToken
      username: userInfo.username || "",
      group: userInfo.group || "",
    };

    console.log("准备保存完整配置:", {
      username: completeConfig.username,
      group: completeConfig.group,
      hasUserToken: !!completeConfig.userToken,
      hasFrpToken: !!completeConfig.frpToken,
      frpTokenLength: completeConfig.frpToken?.length || 0,
    });

    // 保存完整的配置信息
    await invoke("save_unified_config", { config: completeConfig });
    console.log("完整配置保存成功，包含 frpToken");

    message.success("Token登录成功");

    // Call auth store login action with user info
    authStore.login({
      userToken: completeConfig.userToken,
      username: completeConfig.username,
      group: completeConfig.group,
      frpToken: completeConfig.frpToken,
    });

    // 立即触发登录成功事件
    console.log("触发login-success事件");
    emit("login-success");
  } catch (error) {
    console.error("Token登录失败，详细错误:", error);

    // 详细的错误处理
    let errorMessage = "Token登录失败";

    if (typeof error === "string") {
      errorMessage = error;
    } else if (error && typeof error === "object") {
      if ("message" in error) {
        errorMessage = (error as any).message;
      } else if ("toString" in error) {
        errorMessage = error.toString();
      }
    }

    // 根据错误类型给出更具体的提示
    if (errorMessage.includes("未找到有效的token")) {
      errorMessage = "Token验证失败，请检查Token是否正确或已过期";
    } else if (errorMessage.includes("配置保存失败")) {
      errorMessage = "配置保存失败，请检查应用权限或重试";
    } else if (errorMessage.includes("未找到配置文件")) {
      errorMessage = "配置文件加载失败，请重启应用后重试";
    }

    console.error("最终错误信息:", errorMessage);
    message.error(errorMessage);
  }
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
      // Token登录模式
      message.loading("正在登录中，请稍候...");
      await handleTokenLogin();
    } else {
      // 普通登录模式 - 先进行人机验证
      message.loading("正在进行人机验证...", { duration: 0 });
      
      // 确保验证码实例已创建
      if (!captchaInstance) {
        captchaInstance = createCaptcha({
          onProgress: (progress) => {
            console.log(`验证进度: ${progress}%`);
          },
          onError: (error) => {
            console.error("验证错误:", error);
          },
        });
      }

      // 触发隐式验证
      let captchaToken: string;
      try {
        captchaToken = await captchaInstance.verify();
        console.log("获取到的 captchaToken:", captchaToken, "类型:", typeof captchaToken);
        
        // 确保 token 是字符串
        if (typeof captchaToken !== 'string') {
          throw new Error(`验证 token 类型错误: ${typeof captchaToken}`);
        }
      } catch (captchaError) {
        message.destroyAll();
        console.error("人机验证失败:", captchaError);
        message.error("人机验证失败，请重试");
        isLogging.value = false;
        return;
      }
      
      loginForm.value.captchaToken = captchaToken;
      
      message.destroyAll();
      message.loading("正在登录中，请稍候...");
      
      console.log("开始登录:", loginForm.value.username, "captchaToken:", loginForm.value.captchaToken);

      // 调用后端登录API命令
      const config = await invoke<UnifiedConfig>("api_login", {
        username: loginForm.value.username,
        password: loginForm.value.password,
        captchaToken: loginForm.value.captchaToken,
      });

      console.log("登录成功，配置已保存:", config);
      message.success("登录成功");

      // Call auth store login action with user info
      authStore.login({
        userToken: config.userToken,
        username: config.username,
        group: config.group,
        frpToken: config.frpToken,
      });

      // 立即触发登录成功事件
      console.log("触发login-success事件");
      emit("login-success");
    }
  } catch (error) {
    message.destroyAll(); // 清除所有加载消息
    console.error("登录失败:", error);
    // 显示完整的错误信息
    const errorMessage =
      error && typeof error === "string"
        ? error
        : error && typeof error === "object" && "message" in error
          ? (error as any).message
          : "登录失败，请检查用户名和密码";
    message.error(errorMessage);
  } finally {
    isLogging.value = false;
  }
}

onMounted(async () => {
  console.log("登录组件已加载，准备登录");
  
  // 预初始化验证码实例
  if (!isTokenMode.value) {
    captchaInstance = createCaptcha({
      onProgress: (progress) => {
        console.log(`验证进度: ${progress}%`);
      },
      onError: (error) => {
        console.error("验证错误:", error);
      },
    });
  }
});

onUnmounted(() => {
  // 组件卸载时的清理工作
  console.log("登录组件卸载");
  
  // 销毁验证码实例
  if (captchaInstance) {
    captchaInstance.destroy();
    captchaInstance = null;
  }
});
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #101014;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  animation: slideUp 0.6s ease-out;
  position: relative; /* 添加相对定位以支持绝对定位的子元素 */
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
  color: #349ff4;
  margin-bottom: 30px;
  font-size: 24px;
  font-weight: 600;
}

.login-btn {
  background-color: #101014 !important;
  color: #349ff4 !important;
  border: none !important;
}

.login-btn:hover {
  background-color: #1a1a1e !important;
  color: #4da8f5 !important;
}

.login-btn:focus {
  background-color: #101014 !important;
  color: #349ff4 !important;
}

.vaptcha-section {
  margin: 15px 0;
}

/* 模式切换按钮容器 */
.mode-switch-container {
  position: absolute;
  bottom: 20px;
  right: 20px;
}

.mode-switch-btn {
  color: #349ff4 !important;
  font-size: 12px;
  padding: 4px 8px;
  transition: all 0.3s ease;
}

.mode-switch-btn:hover {
  color: #4da8f5 !important;
  background-color: rgba(52, 159, 244, 0.1) !important;
}

@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
    margin: 10px;
    position: relative; /* 确保移动端也有相对定位 */
  }

  .login-title {
    font-size: 20px;
    margin-bottom: 20px;
  }

  .vaptcha-hint-btn {
    font-size: 11px;
  }

  .mode-switch-container {
    bottom: 15px;
    right: 15px;
  }

  .mode-switch-btn {
    font-size: 11px;
  }
}
</style>
