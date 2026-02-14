<template>
  <n-card :title="title" :bordered="bordered" class="user-info-card">
    <div class="user-profile">
      <template v-if="loading">
        <div class="profile-header">
          <n-skeleton text :repeat="2" style="width: 60%" />
        </div>
        <div class="resource-specs">
          <n-skeleton text :repeat="4" style="width: 100%; height: 60px" />
        </div>
      </template>

      <template v-else>
        <div v-if="userInfo" class="bento-grid">
          <!-- 1. 顶部：个人身份长卡片 -->
          <div class="profile-header">
            <div class="profile-main">
              <div class="username-section">
                <h2 class="username">{{ userInfo.username }}</h2>
                <n-tag
                  :type="getUserGroupType(userInfo.friendlyGroup)"
                  :bordered="false"
                  size="medium"
                  class="user-group-tag"
                >
                  {{ userInfo.friendlyGroup }}
                </n-tag>
                <n-tag :bordered="false" type="info">
                  #{{ userInfo.userId }}
                </n-tag>
                <n-tag
                  :bordered="false"
                  :type="userInfo.isRealname ? 'success' : 'error'"
                >
                  {{ userInfo.isRealname ? "已实名" : "未实名" }}
                </n-tag>
                <n-tag
                  :bordered="false"
                  :type="props.userInfo?.todaySigned ? 'success' : 'primary'"
                  :loading="isSigning"
                  :disabled="props.userInfo?.todaySigned || props.userInfoLoading"
                  @click="showSignDialog"
                  style="cursor: pointer"
                  class="sign-tag"
                >
                  {{ props.userInfo?.todaySigned ? "已签到" : "签到" }}
                </n-tag>
              </div>
            </div>
            <div class="profile-meta">
              <div class="meta-item">
                <n-icon size="16" :component="Mail" />
                <n-text depth="2">注册邮箱 {{ userInfo.email }}</n-text>
              </div>
              <div class="meta-item">
                <n-icon size="16" :component="Clock" />
                <n-text depth="2"
                  >注册时间 {{ formatTimestamp(userInfo.regTime) }}</n-text
                >
              </div>
            </div>
          </div>

          <!-- 2. 底部：资源规格 -->
          <div class="resource-specs">
            <!-- 剩余流量 -->
            <div class="spec-card traffic-card">
              <div class="spec-icon">
                <n-icon size="24" :component="Database" color="#18a058" />
              </div>
              <div class="spec-content">
                <n-text depth="3" class="spec-label">剩余流量</n-text>
                <n-text strong class="spec-value">{{
                  formatTraffic(userInfo.traffic)
                }}</n-text>
              </div>
            </div>
            <!-- 隧道数量 -->
            <div class="spec-card tunnel-card">
              <div class="spec-icon">
                <n-icon size="24" :component="Network" color="#f0a020" />
              </div>
              <div class="spec-content">
                <n-text depth="3" class="spec-label">隧道数量</n-text>
                <div class="tunnel-inline-stats">
                  <n-text strong class="spec-value"
                    >{{ userInfo.usedProxies }}/{{
                      userInfo.maxProxies
                    }}</n-text
                  >
                </div>
              </div>
            </div>

            <!-- 入站带宽 -->
            <div class="spec-card inbound-card">
              <div class="spec-icon">
                <n-icon size="24" :component="ArrowDown" color="#2080f0" />
              </div>
              <div class="spec-content">
                <n-text depth="3" class="spec-label">入站带宽</n-text>
                <n-text strong class="spec-value">{{
                  formatBandwidth(userInfo.inBound)
                }}</n-text>
              </div>
            </div>

            <!-- 出站带宽 -->
            <div class="spec-card outbound-card">
              <div class="spec-icon">
                <n-icon size="24" :component="ArrowUp" color="#9333ea" />
              </div>
              <div class="spec-content">
                <n-text depth="3" class="spec-label">出站带宽</n-text>
                <n-text strong class="spec-value">{{
                  formatBandwidth(userInfo.outBound)
                }}</n-text>
              </div>
            </div>
          </div>

          <!-- Custom slot for additional fields -->
          <slot name="extra-fields" :user-info="userInfo"></slot>
        </div>
      </template>
    </div>

    <!-- Footer slot for actions -->
    <template v-if="$slots.footer" #footer>
      <slot name="footer" :user-info="userInfo"></slot>
    </template>
  </n-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { NCard, NSkeleton, NText, NTag, NIcon, useMessage } from "naive-ui";
import { invoke } from "@tauri-apps/api/core";
import {
  Mail,
  Clock,
  Database,
  ArrowDown,
  ArrowUp,
  Network,
} from "lucide-vue-next";
import {
  formatTimestamp,
  formatBandwidth,
  formatTraffic,
} from "@/utils/timeFormatter";
import { createCaptcha } from "@/utils/captcha";

interface UserInfo {
  username: string;
  userId: number;
  isRealname: boolean;
  friendlyGroup: string;
  regTime: number;
  email: string;
  usedProxies: number;
  maxProxies: number;
  traffic: number;
  inBound: number;
  outBound: number;
  todaySigned?: boolean;
  [key: string]: any;
}

interface Props {
  userInfo: UserInfo | null;
  loading?: boolean;
  title?: string;
  bordered?: boolean;
  userInfoLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  title: "用户信息",
  bordered: true,
  userInfoLoading: false,
});

// 定义 emits - 用于通知父组件刷新用户信息
const emit = defineEmits<{
  (e: "refresh"): void;
}>();

const message = useMessage();

// 签到状态
const isSigning = ref(false);

// 签到处理函数
const showSignDialog = async () => {
  if (isSigning.value) {
    return;
  }

  if (props.userInfo?.todaySigned) {
    message.warning("今天已经签到过了");
    return;
  }

  isSigning.value = true;
  message.loading("正在进行人机验证...", { duration: 0, key: "signing" });

  try {
    // 创建签到验证码实例
    const signCaptchaInstance = createCaptcha({
      onProgress: (progress) => console.log(`签到验证进度: ${progress}%`),
      onError: (error) => {
        console.error("签到验证错误:", error);
        message.destroyAll();
        message.error("人机验证失败，请重试");
      },
    });

    // 执行人机验证
    const token = await signCaptchaInstance.verify();
    message.destroyAll();
    message.loading("正在签到...", { duration: 0, key: "signing" });

    // 使用 token 进行签到
    const responseText = await invoke("api_user_sign", {
      captchaToken: token,
    });

    const result = JSON.parse(responseText as string);

    if (result.code === 200) {
      const trafficGB = result.data?.extraTraffic || 0;
      let successMessage = "签到成功！";
      if (trafficGB > 0) {
        successMessage = `签到成功，获得 ${trafficGB} GB 流量！`;
      } else if (result.message) {
        successMessage = result.message;
      }

      message.destroyAll();
      message.success(successMessage, { duration: 5000 });

      // 通知父组件刷新用户信息
      emit("refresh");
    } else {
      message.destroyAll();
      message.error(result.message || "签到失败");
    }
  } catch (error) {
    console.error("签到失败:", error);
    message.destroyAll();
    message.error("签到失败，请重试");
  } finally {
    isSigning.value = false;
  }
};

// 根据用户组返回标签类型
const getUserGroupType = (
  group: string,
): "default" | "success" | "warning" | "error" | "info" => {
  const groupLower = group.toLowerCase();
  if (groupLower.includes("管理员") || groupLower.includes("高级"))
    return "warning";
  if (groupLower.includes("正式") || groupLower.includes("贡献"))
    return "success";
  if (groupLower.includes("未实名")) return "error";
  return "info";
};
</script>

<style scoped>
.user-info-card {
  width: 100%;
}

.bento-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 1. 顶部：个人身份长卡片 */
.profile-header {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.profile-header:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.profile-main {
  flex: 1;
}

.username-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.username {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: var(--n-text-color);
}

.user-group-tag {
  font-weight: 500;
}

.sign-tag {
  cursor: pointer;
  transition: all 0.2s ease;
}

.sign-tag:not([disabled]):hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(52, 159, 244, 0.3);
}

.sign-tag[disabled] {
  cursor: not-allowed;
  opacity: 0.6;
}

.user-id {
  font-size: 13px;
  opacity: 0.6;
}

.realname-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.05);
}

.profile-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

/* 2. 底部：资源规格 */
.resource-specs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.spec-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.3s ease;
}

.spec-card:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.spec-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
}

.spec-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.spec-label {
  font-size: 12px;
  opacity: 0.7;
}

.spec-value {
  font-size: 16px;
  font-weight: 600;
}

.tunnel-inline-stats {
  display: flex;
  align-items: center;
}

.tunnel-mini-progress {
  margin-top: 4px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .resource-specs {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .profile-meta {
    align-items: flex-start;
    width: 100%;
  }

  .resource-specs {
    grid-template-columns: repeat(2, 1fr);
  }

  .username {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .username-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .resource-specs {
    grid-template-columns: 1fr;
  }
}
</style>
