<template>
  <div class="user-center">
    <!-- 用户信息卡片 - 使用 UserInfoCard 组件 -->
    <UserInfoCard
      :user-info="userInfo"
      :loading="userInfoLoading"
      :user-info-loading="userInfoLoading"
      title="用户信息"
      :bordered="true"
      @refresh="userStore.refreshUserInfo"
    >
    </UserInfoCard>

    <!-- 流量历史图表 -->
    <TrafficChartCard />

    <!-- CDK 兑换 -->
    <CdkCard />

    <!-- 账户与安全卡片 -->
    <n-card title="账户与安全" :bordered="true" class="security-card">
      <n-space vertical :size="24">
        <div class="cdk-redeem-item">
          <div class="cdk-info">
            <History :size="18" />
            查看我的操作审计日志
            <p>
              此操作仅用于查阅本账号历史操作记录，不会对当前运行的服务或网络连接造成任何影响。
            </p>
          </div>
          <n-button type="primary" @click="goToOperationLog">
            立即查看操作日志
          </n-button>
        </div>
        <div class="cdk-redeem-item">
          <div class="cdk-info">
            <Shield :size="18" />
            重置访问密钥
            <p>
              访问密钥用于验证您的身份，请妥善保管，一经泄露请及时重置。
            </p>
          </div>
          <n-button
            type="warning"
            :loading="resettingToken"
            @click="showResetTokenDialog"
          >
            重置访问密钥
          </n-button>
        </div>
        <div class="cdk-redeem-item">
          <div class="cdk-info">
            <Power :size="18" />
            下线所有隧道
            <p>
              执行此操作后，您的在线隧道都将被踢出服务器，若您仍有正在运行的服务，请提前做好容灾措施。
            </p>
          </div>
          <n-button
            type="error"
            :loading="kickingAllProxies"
            @click="showKickAllProxiesDialog"
          >
            下线所有隧道
          </n-button>
        </div>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useMessage, useDialog, NCard, NButton, NSpace } from "naive-ui";
import { storeToRefs } from "pinia";
import { useUserStore } from "../stores/user";
import { useAuthStore } from "../stores/auth";
import { createCaptcha } from "@/utils/captcha";
import { handleApiError } from "@/utils/errorHandler";
import { resetToken, kickAllProxies } from '@/api/auth';
import UserInfoCard from "./common/UserInfoCard.vue";
import TrafficChartCard from "./user-center/TrafficChartCard.vue";
import CdkCard from "./user-center/CdkCard.vue";
import { History, Power, Shield } from "@lucide/vue";

const router = useRouter();
const message = useMessage();
const dialog = useDialog();

// Initialize User Store
const userStore = useUserStore();
const authStore = useAuthStore();
const { userInfo, loading: userInfoLoading } = storeToRefs(userStore);

// 下线所有隧道相关
const kickingAllProxies = ref(false);

// 重置访问密钥相关
const resettingToken = ref(false);

// 重置访问密钥验证码实例
const tokenResetCaptchaInstance = createCaptcha({
  onError: (error) => {
    console.error("重置密钥验证错误:", error);
    message.error(`人机验证失败: ${error}`);
  },
});

// 跳转到操作日志页面
const goToOperationLog = () => {
  router.push("/operation-log");
};

// 显示下线所有隧道对话框
const showKickAllProxiesDialog = () => {
  dialog.error({
    title: "确认下线所有隧道",
    content: "此操作将强制下线您账户下的所有在线隧道。确定要继续执行此操作？",
    positiveText: "确认下线",
    negativeText: "取消",
    onPositiveClick: async () => {
      await handleKickAllProxies();
    },
  });
};

// 显示重置访问密钥对话框
const showResetTokenDialog = () => {
  dialog.warning({
    title: "重置访问密钥验证",
    content: "重置后原有密钥将失效，请及时更新配置。此外，所有隧道都将被强制下线！",
    positiveText: "确认重置",
    negativeText: "取消",
    onPositiveClick: async () => {
      await handleResetToken();
    },
  });
};

// 执行下线所有隧道
const handleKickAllProxies = async () => {
  if (kickingAllProxies.value) {
    return false;
  }

  kickingAllProxies.value = true;

  try {
    const result = await kickAllProxies(authStore.userToken);

    if (result.code === 200) {
      message.success(result.message || "强制下线隧道成功");
    } else {
      message.error(result.message || "下线隧道失败");
      return false;
    }
  } catch (error) {
    const errorMessage = handleApiError(error, "下线隧道失败", "下线隧道失败");
    message.error(errorMessage);
    return false;
  } finally {
    kickingAllProxies.value = false;
  }

  return true;
};

// 执行重置访问密钥
const handleResetToken = async () => {
  if (resettingToken.value) {
    return false;
  }

  resettingToken.value = true;

  try {
    message.loading("正在进行人机验证...", { duration: 0 });
    const captchaToken = await tokenResetCaptchaInstance.verify();

    message.destroyAll();
    message.loading("正在重置访问密钥...", { duration: 0 });

    const result = await resetToken(authStore.userToken, captchaToken);

    message.destroyAll();

    const newToken = result.data?.newToken;

    if (newToken) {
      await userStore.refreshUserInfo();
      message.success("访问密钥重置成功，所有隧道已下线");
    } else {
      message.warning("访问密钥重置成功，但未获取到新密钥");
    }
  } catch (error) {
    message.destroyAll();
    const errorMessage = handleApiError(error, "重置访问密钥失败", "重置访问密钥失败");
    message.error(errorMessage);
    return false;
  } finally {
    resettingToken.value = false;
  }

  return true;
};

onMounted(() => {
  userStore.loadUserInfo();
});
</script>

<style scoped>
.user-center {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

/* 账户与安全卡片样式 */
.security-card {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
}

.cdk-redeem-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.cdk-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--app-text-color-1);
}

.cdk-info svg {
  color: var(--app-primary-color);
  flex-shrink: 0;
}

.cdk-info p {
  margin: 0;
  font-size: 12px;
  color: var(--app-text-color-3);
  line-height: 1.4;
  font-weight: 400;
}
</style>
