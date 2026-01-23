<template>
  <div class="user-center">
    <!-- 用户信息卡片 - 与Dashboard完全相同 -->
    <n-card title="用户信息" :bordered="true" class="user-info-card">
      <div class="user-profile">
        <template v-if="userInfoLoading">
          <div class="user-info-grid">
            <div class="user-info-item">
              <n-skeleton
                text
                :repeat="1"
                style="width: 30%; font-size: 13px"
              />
              <div class="user-info-value">
                <n-skeleton text :repeat="1" style="width: 60%" />
              </div>
            </div>
            <div class="user-info-item">
              <n-skeleton
                text
                :repeat="1"
                style="width: 30%; font-size: 13px"
              />
              <div class="user-info-value">
                <n-skeleton text :repeat="1" style="width: 50%" />
              </div>
            </div>
            <div class="user-info-item">
              <n-skeleton
                text
                :repeat="1"
                style="width: 30%; font-size: 13px"
              />
              <div class="user-info-value">
                <n-skeleton text :repeat="1" style="width: 40%" />
              </div>
            </div>
            <div class="user-info-item">
              <n-skeleton
                text
                :repeat="1"
                style="width: 30%; font-size: 13px"
              />
              <div class="user-info-value">
                <n-skeleton text :repeat="1" style="width: 70%" />
              </div>
            </div>
            <div class="user-info-item">
              <n-skeleton
                text
                :repeat="1"
                style="width: 30%; font-size: 13px"
              />
              <div class="user-info-value">
                <n-skeleton text :repeat="1" style="width: 50%" />
              </div>
            </div>
            <div class="user-info-item">
              <n-skeleton
                text
                :repeat="1"
                style="width: 30%; font-size: 13px"
              />
              <div class="user-info-value">
                <n-skeleton text :repeat="1" style="width: 45%" />
              </div>
            </div>
            <div class="user-info-item">
              <n-skeleton
                text
                :repeat="1"
                style="width: 30%; font-size: 13px"
              />
              <div class="user-info-value">
                <n-skeleton text :repeat="1" style="width: 55%" />
              </div>
            </div>
            <div class="user-info-item">
              <n-skeleton
                text
                :repeat="1"
                style="width: 30%; font-size: 13px"
              />
              <div class="user-info-value">
                <n-skeleton text :repeat="1" style="width: 40%" />
              </div>
            </div>
            <div class="user-info-item">
              <n-skeleton
                text
                :repeat="1"
                style="width: 30%; font-size: 13px"
              />
              <div class="user-info-value">
                <n-skeleton text :repeat="1" style="width: 45%" />
              </div>
            </div>
            <div class="user-info-item">
              <n-skeleton
                text
                :repeat="1"
                style="width: 30%; font-size: 13px"
              />
              <div class="user-info-value">
                <n-skeleton text :repeat="1" style="width: 55%" />
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="user-info-grid">
            <div class="user-info-item">
              <n-text :style="{ fontSize: '13px' }" depth="3"
                >用户名</n-text
              >
              <div class="user-info-value">{{ userInfo?.username }}</div>
            </div>
            <div class="user-info-item">
              <n-text :style="{ fontSize: '13px' }" depth="3"
                >用户 ID</n-text
              >
              <div class="user-info-value">
                <n-tag type="warning" :bordered="false" size="small">
                  #{{ userInfo?.userId }}
                </n-tag>
              </div>
            </div>
            <div class="user-info-item">
              <n-text :style="{ fontSize: '13px' }" depth="3"
                >实名认证</n-text
              >
              <div class="user-info-value">
                <n-tag type="success" :bordered="false" size="small">
                  {{ userInfo?.isRealname ? "已实名" : "未实名" }}
                </n-tag>
              </div>
            </div>
            <div class="user-info-item">
              <n-text :style="{ fontSize: '13px' }" depth="3"
                >用户组</n-text
              >
              <div class="user-info-value">
                <n-tag type="info" :bordered="false" size="small">
                  {{ userInfo?.friendlyGroup }}
                </n-tag>
              </div>
            </div>
            <div class="user-info-item">
              <n-text :style="{ fontSize: '13px' }" depth="3"
                >注册时间</n-text
              >
              <div class="user-info-value">
                {{ formatRegTime(userInfo?.regTime || 0) }}
              </div>
            </div>
            <div class="user-info-item">
              <n-text :style="{ fontSize: '13px' }" depth="3"
                >注册邮箱</n-text
              >
              <div class="user-info-value">{{ userInfo?.email }}</div>
            </div>
            <div class="user-info-item">
              <n-text :style="{ fontSize: '13px' }" depth="3"
                >隧道数量</n-text
              >
              <div class="user-info-value">
                {{ userInfo?.usedProxies }}/{{ userInfo?.maxProxies }}
              </div>
            </div>
            <div class="user-info-item">
              <n-text :style="{ fontSize: '13px' }" depth="3"
                >剩余流量</n-text
              >
              <div class="user-info-value">
                {{ ((userInfo?.traffic || 0) / 1024).toFixed(2) }} GB
              </div>
            </div>
            <div class="user-info-item">
              <n-text :style="{ fontSize: '13px' }" depth="3"
                >入站带宽</n-text
              >
              <div class="user-info-value">
                {{ formatBandwidth(userInfo?.inBound || 0) }}
              </div>
            </div>
            <div class="user-info-item">
              <n-text :style="{ fontSize: '13px' }" depth="3"
                >出站带宽</n-text
              >
              <div class="user-info-value">
                {{ formatBandwidth(userInfo?.outBound || 0) }}
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 签到按钮 -->
      <template #footer>
        <div class="sign-in-section">
          <n-button
            type="primary"
            size="large"
            block
            :loading="isSigning"
            :disabled="userInfo?.todaySigned || userInfoLoading"
            @click="showSignDialog"
          >
            {{ userInfo?.todaySigned ? "今日已签到" : "每日签到" }}
          </n-button>
        </div>
      </template>
    </n-card>

    <!-- CDK兑换卡片 -->
    <n-card :bordered="true" class="cdk-section">
      <template #header>
        <div class="section-header">
          <i class="fas fa-gift"></i>
          <span>CDK兑换</span>
        </div>
      </template>

      <n-space vertical :size="24">
        <div class="cdk-redeem-item">
          <div class="cdk-info">
            <h4>兑换CDK</h4>
            <p>输入CDK兑换码获取隧道数、流量或VIP会员</p>
          </div>
          <n-button type="primary" @click="showCdkDialog">
            <template #icon>
              <i class="fas fa-ticket-alt"></i>
            </template>
            兑换CDK
          </n-button>
        </div>
      </n-space>
    </n-card>

    <!-- CDK兑换历史卡片 -->
    <n-card :bordered="true" class="cdk-section">
      <template #header>
        <div class="section-header">
          <i class="fas fa-history"></i>
          <span>CDK兑换历史</span>
        </div>
      </template>

      <div class="cdk-history-content">
        <div v-if="cdkHistoryLoading" class="loading-text">
          加载兑换历史中...
        </div>
        <div v-else-if="cdkHistory.length === 0" class="empty-text">
          暂无兑换记录
          <n-button
            text
            type="primary"
            @click="loadCdkHistory"
            style="margin-left: 8px"
          >
            点击刷新
          </n-button>
        </div>
        <div v-else class="cdk-history-list">
          <div
            v-for="log in cdkHistory"
            :key="log.logId"
            class="cdk-history-card"
          >
            <div class="cdk-card-left">
              <div class="cdk-type-badge" :class="`badge-${log.type}`">
                {{ getCdkTypeName(log.type) }}
              </div>
              <div class="cdk-card-info">
                <div class="cdk-card-value">
                  {{ getCdkValueLabel(log.type) }}: {{ formatCdkValue(log.type, log.value) }}
                </div>
                <div class="cdk-card-time">
                  {{ formatTimestamp(log.useTime) }}
                </div>
              </div>
            </div>
            <div class="cdk-card-right">
              <div class="cdk-card-code">{{ log.code }}</div>
            </div>
          </div>
        </div>
        
        <div v-if="cdkHistory.length > 0" class="cdk-history-footer">
          <n-button
            size="small"
            @click="loadCdkHistory"
            :loading="cdkHistoryLoading"
          >
            刷新
          </n-button>
          <div class="pagination-info">
            共 {{ cdkHistoryTotal }} 条记录
          </div>
        </div>
      </div>
    </n-card>

    <!-- 签到模态框 -->
    <n-modal
      v-model:show="showSignModal"
      preset="card"
      title="每日签到"
      :style="{ width: '450px', maxWidth: '90vw' }"
      :bordered="true"
      :segmented="{ content: true }"
    >
      <n-space vertical :size="16">
        <div>
          <p style="margin-bottom: 8px; color: #999; text-align: center; font-size: 13px">
            请完成人机验证
          </p>
          <CaptchaVerify @solve="handleSignCaptchaSolve" />
        </div>
      </n-space>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showSignModal = false" :disabled="isSigning">
            取消
          </n-button>
          <n-button
            type="primary"
            @click="performSign"
            :loading="isSigning"
          >
            确认签到
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- CDK兑换模态框 -->
    <n-modal
      v-model:show="showCdkModal"
      preset="card"
      title="CDK兑换"
      :style="{ width: '450px', maxWidth: '90vw' }"
      :bordered="true"
      :segmented="{ content: true }"
    >
      <n-space vertical :size="16">
        <div>
          <p style="margin-bottom: 8px; color: #ffffffd1; font-size: 14px">
            CDK兑换码
          </p>
          <n-input
            v-model:value="cdkCode"
            placeholder="请输入CDK兑换码"
            :disabled="isRedeeming"
          />
        </div>

        <div>
          <p
            style="
              margin-bottom: 8px;
              color: #999;
              text-align: center;
              font-size: 13px;
            "
          >
            请完成人机验证
          </p>
          <CaptchaVerify @solve="handleCdkCaptchaSolve" />
        </div>
      </n-space>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showCdkModal = false" :disabled="isRedeeming">
            取消
          </n-button>
          <n-button
            type="primary"
            @click="performCdkRedeem"
            :loading="isRedeeming"
          >
            确认兑换
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useMessage, NCard, NButton, NSpace, NTag, NInput, NModal, NSkeleton, NText } from "naive-ui";
import { invoke } from "@tauri-apps/api/core";
import CaptchaVerify from "./CaptchaVerify.vue";

interface UserDetailInfo {
  email: string;
  friendlyGroup: string;
  group: string;
  inBound: number;
  isRealname: boolean;
  maxProxies: number;
  outBound: number;
  regTime: number;
  status: number;
  todaySigned: boolean;
  traffic: number;
  usedProxies: number;
  userId: number;
  username: string;
}

interface CdkHistoryLog {
  logId: number;
  code: string;
  username: string;
  type: string;
  value: number;
  useTime: number;
  clientIp: string;
  userAgent: string;
}

interface CdkHistoryResponse {
  code: number;
  data: {
    logs: CdkHistoryLog[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  message: string;
}

const message = useMessage();

// 用户信息
const userInfo = ref<UserDetailInfo | null>(null);
const userInfoLoading = ref(true);

// 签到相关
const isSigning = ref(false);
const showSignModal = ref(false);
const signCaptchaToken = ref("");

// CDK兑换相关
const cdkCode = ref("");
const isRedeeming = ref(false);
const showCdkModal = ref(false);
const cdkCaptchaToken = ref("");

// CDK兑换历史相关
const cdkHistory = ref<CdkHistoryLog[]>([]);
const cdkHistoryLoading = ref(false);
const cdkHistoryTotal = ref(0);

// 加载用户信息
const loadUserInfo = async () => {
  userInfoLoading.value = true;
  try {
    const result = await invoke<UserDetailInfo>("api_get_user_info");
    userInfo.value = result;
  } catch (error) {
    console.error("加载用户信息失败:", error);
    message.error("加载用户信息失败");
  } finally {
    userInfoLoading.value = false;
  }
};

// 格式化带宽（单位：Mbps，响应数值/128是显示数值）
const formatBandwidth = (value: number): string => {
  if (value === 0) return "0 Mbps";
  const mbps = value / 128;
  return parseFloat(mbps.toFixed(2)) + " Mbps";
};

// 格式化注册时间
const formatRegTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// 显示签到对话框
const showSignDialog = () => {
  signCaptchaToken.value = "";
  showSignModal.value = true;
};

// 处理签到验证成功
const handleSignCaptchaSolve = (token: string) => {
  console.log("签到验证成功");
  signCaptchaToken.value = token;
};

// 执行签到
const performSign = async () => {
  if (!signCaptchaToken.value) {
    message.error("请先完成人机验证");
    return;
  }

  if (isSigning.value) {
    return;
  }

  isSigning.value = true;

  try {
    const responseText = await invoke("api_user_sign", {
      captchaToken: signCaptchaToken.value,
    });

    const result = JSON.parse(responseText as string);

    if (result.code === 200) {
      message.success("签到成功！");
      showSignModal.value = false;
      signCaptchaToken.value = "";
      // 刷新用户信息
      loadUserInfo();
    } else {
      message.error(result.message || "签到失败");
    }
  } catch (error) {
    console.error("签到失败:", error);
    message.error(`签到失败: ${error}`);
  } finally {
    isSigning.value = false;
  }
};

// 显示CDK兑换对话框
const showCdkDialog = () => {
  cdkCode.value = "";
  cdkCaptchaToken.value = "";
  showCdkModal.value = true;
};

// 处理CDK验证成功
const handleCdkCaptchaSolve = (token: string) => {
  console.log("CDK兑换验证成功");
  cdkCaptchaToken.value = token;
};

// 执行CDK兑换
const performCdkRedeem = async () => {
  if (!cdkCode.value.trim()) {
    message.error("请输入CDK兑换码");
    return;
  }

  if (!cdkCaptchaToken.value) {
    message.error("请先完成人机验证");
    return;
  }

  if (isRedeeming.value) {
    return;
  }

  isRedeeming.value = true;

  try {
    const responseText = await invoke("api_redeem_cdk", {
      code: cdkCode.value.trim(),
      captchaToken: cdkCaptchaToken.value,
    });

    const result = JSON.parse(responseText as string);

    if (result.code === 200) {
      const { type, value } = result.data;
      let rewardText = "";

      switch (type) {
        case "proxy":
          rewardText = `隧道数 ${value} 条`;
          break;
        case "traffic":
          rewardText = `流量 ${value} GB`;
          break;
        case "vip":
          rewardText = `高级会员 ${value} 天`;
          break;
        default:
          rewardText = `${type} ${value}`;
      }

      message.success(`兑换成功，获得${rewardText}`);
      showCdkModal.value = false;
      cdkCode.value = "";
      cdkCaptchaToken.value = "";
      
      // 兑换成功后刷新历史记录和用户信息
      loadCdkHistory();
      loadUserInfo();
    } else {
      message.error(result.message || "CDK兑换失败");
    }
  } catch (error) {
    console.error("CDK兑换失败:", error);
    message.error(`CDK兑换失败: ${error}`);
  } finally {
    isRedeeming.value = false;
  }
};

// 加载CDK兑换历史
const loadCdkHistory = async () => {
  cdkHistoryLoading.value = true;
  try {
    const responseText = await invoke("api_get_cdk_history");
    const result: CdkHistoryResponse = JSON.parse(responseText as string);

    if (result.code === 200 && result.data) {
      cdkHistory.value = Array.isArray(result.data.logs) ? result.data.logs : [];
      cdkHistoryTotal.value = result.data.total || 0;
      console.log(`成功加载 ${cdkHistory.value.length} 条CDK兑换记录`);
    } else {
      console.error("获取CDK兑换历史失败:", result.message);
      message.error(result.message || "获取CDK兑换历史失败");
      cdkHistory.value = [];
      cdkHistoryTotal.value = 0;
    }
  } catch (error) {
    console.error("加载CDK兑换历史失败:", error);
    message.error("加载CDK兑换历史失败，请检查网络连接");
    cdkHistory.value = [];
    cdkHistoryTotal.value = 0;
  } finally {
    cdkHistoryLoading.value = false;
  }
};

// 获取CDK类型名称
const getCdkTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    traffic: "流量",
    proxy: "隧道",
    vip: "会员",
  };
  return typeMap[type] || type;
};

// 获取CDK值标签
const getCdkValueLabel = (type: string): string => {
  const labelMap: Record<string, string> = {
    traffic: "获得流量",
    proxy: "获得隧道",
    vip: "获得会员",
  };
  return labelMap[type] || "获得";
};

// 格式化CDK值
const formatCdkValue = (type: string, value: number): string => {
  switch (type) {
    case "traffic":
      return `${value} GB`;
    case "proxy":
      return `${value} 条隧道`;
    case "vip":
      return `${value} 天会员`;
    default:
      return `${value}`;
  }
};

// 格式化时间戳
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

onMounted(() => {
  loadUserInfo();
  loadCdkHistory();
});
</script>

<style scoped>
.user-center {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

/* 用户信息卡片样式 - 与Dashboard完全相同 */
.user-info-card {
  background: #18181c;
  border: 1px solid #29292c;
}

.user-info-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 30px;
  row-gap: 10px;
  column-gap: 60px;
}

.user-info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #18181c;
  border-radius: 8px;
}

.user-info-value {
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
  margin-top: 4px;
}

/* 签到按钮区域样式 */
.sign-in-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #29292c;
}

.sign-in-section .n-button {
  height: 44px;
  font-size: 15px;
  font-weight: 600;
}

/* CDK相关样式 */
.cdk-section {
  background: #18181c;
  border: 1px solid #29292c;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}

.section-header i {
  color: #349ff4;
}

.cdk-redeem-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.cdk-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
}

.cdk-info p {
  margin: 0;
  font-size: 12px;
  color: #a0a0a0;
  line-height: 1.4;
}

/* CDK兑换历史样式 */
.cdk-history-content {
  padding: 16px 0;
}

.loading-text,
.empty-text {
  color: #a0a0a0;
  font-size: 14px;
  padding: 20px;
  text-align: center;
}

.cdk-history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cdk-history-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #1a1a1e;
  border: 1px solid #29292c;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.cdk-history-card:hover {
  background: #1e1e22;
  border-color: #3a3a3e;
}

.cdk-card-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.cdk-type-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.badge-traffic {
  background: rgba(52, 159, 244, 0.15);
  color: #349ff4;
}

.badge-proxy {
  background: rgba(99, 226, 183, 0.15);
  color: #63e2b7;
}

.badge-vip {
  background: rgba(240, 138, 0, 0.15);
  color: #f08a00;
}

.cdk-card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cdk-card-value {
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
}

.cdk-card-time {
  color: #a0a0a0;
  font-size: 12px;
}

.cdk-card-right {
  display: flex;
  align-items: center;
}

.cdk-card-code {
  color: #a0a0a0;
  font-size: 12px;
  font-family: "Courier New", monospace;
  padding: 4px 8px;
  background: #0f0f12;
  border-radius: 4px;
  border: 1px solid #29292c;
}

.cdk-history-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #29292c;
}

.pagination-info {
  color: #a0a0a0;
  font-size: 13px;
}

@media (max-width: 768px) {
  .user-center {
    padding: 10px;
  }

  .user-info-grid {
    grid-template-columns: 1fr;
  }

  .cdk-redeem-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .cdk-history-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .cdk-card-left {
    width: 100%;
  }

  .cdk-card-right {
    width: 100%;
  }

  .cdk-card-code {
    width: 100%;
    text-align: center;
  }
}
</style>
