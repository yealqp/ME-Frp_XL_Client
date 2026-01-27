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
              <n-text :style="{ fontSize: '13px' }" depth="3">用户名</n-text>
              <div class="user-info-value">{{ userInfo?.username }}</div>
            </div>
            <div class="user-info-item">
              <n-text :style="{ fontSize: '13px' }" depth="3">用户 ID</n-text>
              <div class="user-info-value">
                <n-tag type="warning" :bordered="false" size="small">
                  #{{ userInfo?.userId }}
                </n-tag>
              </div>
            </div>
            <div class="user-info-item">
              <n-text :style="{ fontSize: '13px' }" depth="3">实名认证</n-text>
              <div class="user-info-value">
                <n-tag type="success" :bordered="false" size="small">
                  {{ userInfo?.isRealname ? "已实名" : "未实名" }}
                </n-tag>
              </div>
            </div>
            <div class="user-info-item">
              <n-text :style="{ fontSize: '13px' }" depth="3">用户组</n-text>
              <div class="user-info-value">
                <n-tag type="info" :bordered="false" size="small">
                  {{ userInfo?.friendlyGroup }}
                </n-tag>
              </div>
            </div>
            <div class="user-info-item">
              <n-text :style="{ fontSize: '13px' }" depth="3">注册时间</n-text>
              <div class="user-info-value">
                {{ formatRegTime(userInfo?.regTime || 0) }}
              </div>
            </div>
            <div class="user-info-item">
              <n-text :style="{ fontSize: '13px' }" depth="3">注册邮箱</n-text>
              <div class="user-info-value">{{ userInfo?.email }}</div>
            </div>
            <div class="user-info-item">
              <n-text :style="{ fontSize: '13px' }" depth="3">隧道数量</n-text>
              <div class="user-info-value">
                {{ userInfo?.usedProxies }}/{{ userInfo?.maxProxies }}
              </div>
            </div>
            <div class="user-info-item">
              <n-text :style="{ fontSize: '13px' }" depth="3">剩余流量</n-text>
              <div class="user-info-value">
                {{ ((userInfo?.traffic || 0) / 1024).toFixed(2) }} GB
              </div>
            </div>
            <div class="user-info-item">
              <n-text :style="{ fontSize: '13px' }" depth="3">入站带宽</n-text>
              <div class="user-info-value">
                {{ formatBandwidth(userInfo?.inBound || 0) }}
              </div>
            </div>
            <div class="user-info-item">
              <n-text :style="{ fontSize: '13px' }" depth="3">出站带宽</n-text>
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

    <!-- 流量统计卡片 -->
    <n-card :bordered="true" class="traffic-stats-card">
      <template #header>
        <div class="section-header">
          <i class="fas fa-chart-line"></i>
          <span>流量历史记录</span>
        </div>
      </template>
      <template #header-extra>
        <n-space>
          <n-button
            size="small"
            :type="datePeriod === 7 ? 'primary' : 'default'"
            @click="changeDatePeriod(7)"
          >
            7天
          </n-button>
          <n-button
            size="small"
            :type="datePeriod === 14 ? 'primary' : 'default'"
            @click="changeDatePeriod(14)"
          >
            14天
          </n-button>
          <n-button
            size="small"
            :type="datePeriod === 30 ? 'primary' : 'default'"
            @click="changeDatePeriod(30)"
          >
            30天
          </n-button>
        </n-space>
      </template>
      <div class="chart-wrapper">
        <div v-if="trafficStatsLoading" class="chart-loading">
          <n-spin size="large" />
        </div>
        <div
          ref="chartContainer"
          class="chart-container"
          :style="{ opacity: trafficStatsLoading ? 0 : 1 }"
          @mouseenter="handleChartMouseEnter"
          @mousemove="handleChartMouseMove"
          @mouseleave="handleChartMouseLeave"
        ></div>

        <!-- 加载时的遮罩层，阻止鼠标事件 -->
        <div
          v-if="trafficStatsLoading"
          class="chart-loading-mask"
          @mouseenter.stop
          @mousemove.stop
          @mouseleave.stop
          @click.stop
        ></div>

        <!-- 自定义 Tooltip - 使用 NCard -->
        <n-card
          v-if="showCustomTooltip && !trafficStatsLoading"
          class="custom-tooltip"
          :bordered="true"
          size="small"
          :style="{
            left: customTooltipData.x + 'px',
            top: customTooltipData.y + 'px',
          }"
        >
          <div class="tooltip-date">{{ customTooltipData.date }}</div>
          <div class="tooltip-content">
            <div class="tooltip-item">
              <span class="tooltip-label"
                >上传流量: {{ customTooltipData.trafficOut }}
                {{ customTooltipData.unit }}</span
              >
            </div>
            <div class="tooltip-item">
              <span class="tooltip-label"
                >下载流量: {{ customTooltipData.trafficIn }}
                {{ customTooltipData.unit }}</span
              >
            </div>
            <div class="tooltip-item">
              <span class="tooltip-label"
                >总流量: {{ customTooltipData.totalTraffic }}
                {{ customTooltipData.unit }}</span
              >
            </div>
          </div>
        </n-card>
      </div>
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
      <div class="section-header">
        <i class="fas fa-history"></i>
        <span>CDK兑换历史</span>
      </div>

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
                  {{ getCdkValueLabel(log.type) }}:
                  {{ formatCdkValue(log.type, log.value) }}
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
          <div class="pagination-info">共 {{ cdkHistoryTotal }} 条记录</div>
        </div>
      </div>
    </n-card>

    <!-- 账户与安全卡片 -->
    <n-card title="账户与安全" :bordered="true" class="security-card">
      <n-space vertical :size="24">
        <div class="cdk-redeem-item">
          <div class="cdk-info">
            <i class="fas fa-history"></i>
            查看我的操作审计日志
            <p>
              此操作仅用于查阅本账号历史操作记录，不会对当前运行的服务或网络连接造成任何影响。
            </p>
          </div>
          <n-button
            type="primary"
            @click="goToOperationLog"
          >
            立即查看操作日志
          </n-button>
        </div>
        <div class="cdk-redeem-item">
          <div class="cdk-info">
            <i class="fas fa-power-off"></i>
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

    <!-- 签到模态框 -->
    <n-modal
      v-model:show="showSignModal"
      preset="card"
      title="每日签到"
      :style="{ width: '450px', maxWidth: '90vw' }"
      :bordered="true"
      :segmented="{ content: true }"
      :closable="!isSigning"
      :mask-closable="!isSigning"
    >
      <n-space vertical :size="16">
        <div v-if="!isSigning">
          <p
            style="
              margin-bottom: 8px;
              color: #999;
              text-align: center;
              font-size: 13px;
            "
          >
            请完成人机验证后自动签到
          </p>
          <CaptchaVerify @solve="handleSignCaptchaSolve" />
        </div>
        <div v-else style="text-align: center; padding: 20px 0">
          <n-spin size="large" />
          <p style="margin-top: 16px; color: #999; font-size: 14px">
            正在签到中...
          </p>
        </div>
      </n-space>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showSignModal = false" :disabled="isSigning">
            取消
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 下线所有隧道确认对话框 -->
    <n-modal
      v-model:show="showKickAllProxiesModal"
      preset="dialog"
      title="确认下线所有隧道"
      :positive-text="kickingAllProxies ? '下线中...' : '确认下线'"
      negative-text="取消"
      :positive-button-props="{ type: 'error', loading: kickingAllProxies }"
      :closable="!kickingAllProxies"
      :mask-closable="!kickingAllProxies"
      @positive-click="handleKickAllProxies"
    >
      <n-space vertical :size="12">
        <n-alert type="warning" :bordered="false">
          <template #icon>
            <i class="fas fa-exclamation-triangle"></i>
          </template>
          此操作将强制下线您账户下的所有在线隧道
        </n-alert>
        <div style="color: #ffffffd1; font-size: 14px; line-height: 1.6">
          <p style="margin: 8px 0">下线后：</p>
          <ul style="margin: 8px 0; padding-left: 20px">
            <li>执行此操作后，您的所有在线隧道都将被踢出服务器。</li>
            <li>若您仍有正在运行的服务，请提前做好容灾措施。</li>
            <li>确定要继续执行此操作吗？</li>
          </ul>
        </div>
      </n-space>
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
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import {
  useMessage,
  NCard,
  NButton,
  NSpace,
  NTag,
  NInput,
  NModal,
  NSkeleton,
  NText,
  NSpin,
} from "naive-ui";
import { invoke } from "@tauri-apps/api/core";
import * as echarts from "echarts";
import type { ECharts } from "echarts";
import CaptchaVerify from "./CaptchaVerify.vue";

const router = useRouter();

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

interface TrafficStatsResponse {
  code: number;
  data: {
    dates: string[];
    trafficIn: number[];
    trafficOut: number[];
    totalTraffic: number[];
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

// 下线所有隧道相关
const kickingAllProxies = ref(false);
const showKickAllProxiesModal = ref(false);

// CDK兑换相关
const cdkCode = ref("");
const isRedeeming = ref(false);
const showCdkModal = ref(false);
const cdkCaptchaToken = ref("");

// CDK兑换历史相关
const cdkHistory = ref<CdkHistoryLog[]>([]);
const cdkHistoryLoading = ref(false);
const cdkHistoryTotal = ref(0);

// 流量统计相关
const chartContainer = ref<HTMLElement | null>(null);
const chartInstance = ref<ECharts | null>(null);
const trafficStatsLoading = ref(false);
const datePeriod = ref(7);

// 自定义 tooltip 相关
const showCustomTooltip = ref(false);
const customTooltipData = ref({
  date: "",
  trafficIn: 0,
  trafficOut: 0,
  totalTraffic: 0,
  unit: "KB",
  x: 0,
  y: 0,
});

// 存储当前图表数据，用于 tooltip 计算
const currentChartData = ref<{
  dates: string[];
  trafficIn: number[];
  trafficOut: number[];
  totalTraffic: number[];
  unit: string;
} | null>(null);

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
const handleSignCaptchaSolve = async (token: string) => {
  signCaptchaToken.value = token;

  // 自动执行签到
  await performSign();
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
      // API 返回格式: { code: 200, data: { extraTraffic: 7 }, message: "签到成功，获得 7 GB 流量" }
      // extraTraffic 单位是 GB
      const trafficGB = result.data?.extraTraffic || 0;

      let successMessage = "签到成功！";
      if (trafficGB > 0) {
        successMessage = `签到成功，获得 ${trafficGB} GB 流量！`;
      } else if (result.message) {
        // 如果没有 extraTraffic 字段，使用 API 返回的 message
        successMessage = result.message;
      }

      message.success(successMessage, {
        duration: 5000,
      });

      showSignModal.value = false;
      signCaptchaToken.value = "";
      // 刷新用户信息
      await loadUserInfo();
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

// 跳转到操作日志页面
const goToOperationLog = () => {
  router.push('/operation-log');
};

// 显示下线所有隧道对话框
const showKickAllProxiesDialog = () => {
  showKickAllProxiesModal.value = true;
};

// 执行下线所有隧道
const handleKickAllProxies = async () => {
  if (kickingAllProxies.value) {
    return false;
  }

  kickingAllProxies.value = true;

  try {
    const responseText = await invoke("api_kick_all_proxies");
    const result = JSON.parse(responseText as string);

    if (result.code === 200) {
      message.success(result.message || "强制下线隧道成功");
      showKickAllProxiesModal.value = false;
    } else {
      message.error(result.message || "下线隧道失败");
      return false;
    }
  } catch (error) {
    console.error("下线隧道失败:", error);
    message.error(`下线隧道失败: ${error}`);
    return false;
  } finally {
    kickingAllProxies.value = false;
  }

  return true;
};

// 显示CDK兑换对话框
const showCdkDialog = () => {
  cdkCode.value = "";
  cdkCaptchaToken.value = "";
  showCdkModal.value = true;
};

// 处理CDK验证成功
const handleCdkCaptchaSolve = (token: string) => {
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
      cdkHistory.value = Array.isArray(result.data.logs)
        ? result.data.logs
        : [];
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

// 初始化图表
const initChart = () => {
  if (!chartContainer.value) {
    console.error(
      "图表容器未找到，chartContainer.value 为:",
      chartContainer.value,
    );
    return false;
  }

  console.log("图表容器元素:", chartContainer.value);
  console.log("容器尺寸:", {
    width: chartContainer.value.offsetWidth,
    height: chartContainer.value.offsetHeight,
  });

  if (chartInstance.value) {
    console.log("销毁旧的图表实例");
    chartInstance.value.dispose();
  }

  try {
    // 使用 SVG 渲染器，在某些环境下 tooltip 支持更好
    chartInstance.value = echarts.init(chartContainer.value, "dark", {
      renderer: "svg",
    });

    console.log("图表初始化成功，实例:", chartInstance.value);
    return true;
  } catch (error) {
    console.error("图表初始化失败:", error);
    return false;
  }
};

// 加载流量统计数据
const loadTrafficStats = async () => {
  console.log("开始加载流量统计数据");
  trafficStatsLoading.value = true;

  // 清除可能存在的 axisPointer
  if (chartInstance.value) {
    chartInstance.value.dispatchAction({
      type: "hideTip",
    });
  }

  // 隐藏自定义 tooltip
  showCustomTooltip.value = false;

  try {
    const responseText = await invoke("api_get_traffic_stats", {
      datePeriod: datePeriod.value,
    });
    const result: TrafficStatsResponse = JSON.parse(responseText as string);

    if (result.code === 200 && result.data) {
      // 确保图表已初始化
      if (!chartInstance.value) {
        console.log("图表未初始化，尝试初始化");
        await nextTick();
        const success = initChart();
        if (!success) {
          console.error("图表初始化失败，无法更新数据");
          return;
        }
      }
      updateChart(result.data);
    } else {
      console.error("获取流量统计失败:", result.message);
      message.error(result.message || "获取流量统计失败");
    }
  } catch (error) {
    console.error("加载流量统计失败:", error);
    message.error("加载流量统计失败，请检查网络连接");
  } finally {
    trafficStatsLoading.value = false;
    console.log("流量统计加载完成");

    // 加载完成后再次清除 axisPointer，防止残留
    if (chartInstance.value) {
      chartInstance.value.dispatchAction({
        type: "hideTip",
      });
    }
  }
};

// 更新图表
const updateChart = (data: TrafficStatsResponse["data"]) => {
  if (!chartInstance.value) {
    console.error("图表实例未初始化");
    return;
  }

  // 将字节转换为 KB
  const trafficInKB = data.trafficIn.map((v) => Number((v / 1024).toFixed(2)));
  const trafficOutKB = data.trafficOut.map((v) =>
    Number((v / 1024).toFixed(2)),
  );
  const totalTrafficKB = data.totalTraffic.map((v) =>
    Number((v / 1024).toFixed(2)),
  );

  // 判断是否需要使用 MB 单位（如果最大值超过 1024 KB）
  const maxValue = Math.max(...totalTrafficKB);
  const useMB = maxValue > 1024;

  let trafficData, unit;
  if (useMB) {
    // 使用 MB
    trafficData = {
      trafficIn: data.trafficIn.map((v) =>
        Number((v / 1024 / 1024).toFixed(2)),
      ),
      trafficOut: data.trafficOut.map((v) =>
        Number((v / 1024 / 1024).toFixed(2)),
      ),
      totalTraffic: data.totalTraffic.map((v) =>
        Number((v / 1024 / 1024).toFixed(2)),
      ),
    };
    unit = "MB";
  } else {
    // 使用 KB
    trafficData = {
      trafficIn: trafficInKB,
      trafficOut: trafficOutKB,
      totalTraffic: totalTrafficKB,
    };
    unit = "KB";
  }

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      show: false, // 禁用内置 tooltip，使用自定义的
    },
    // 启用 axisPointer 显示垂线
    axisPointer: {
      link: [{ xAxisIndex: "all" }],
      label: {
        show: false,
      },
      triggerOn: "none", // 禁用自动触发，改为手动控制
    },
    legend: {
      data: ["入站流量", "出站流量", "总流量"],
      textStyle: {
        color: "#ffffffd1",
      },
      top: 10,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data.dates,
      axisLine: {
        lineStyle: {
          color: "#3e3e42",
        },
      },
      axisLabel: {
        color: "#a0a0a0",
        formatter: (value: string) => {
          // 格式化日期，只显示月-日
          const date = new Date(value);
          return `${date.getMonth() + 1}-${date.getDate()}`;
        },
      },
      axisPointer: {
        show: true,
        type: "line",
        lineStyle: {
          color: "#349ff4",
          width: 2,
          type: "solid",
        },
        label: {
          show: false,
        },
        triggerOn: "none", // 禁用自动触发
      },
    },
    yAxis: {
      type: "value",
      name: `流量 (${unit})`,
      nameTextStyle: {
        color: "#a0a0a0",
      },
      axisLine: {
        lineStyle: {
          color: "#3e3e42",
        },
      },
      axisLabel: {
        color: "#a0a0a0",
      },
      splitLine: {
        lineStyle: {
          color: "#2a2a2e",
        },
      },
    },
    series: [
      {
        name: "入站流量",
        type: "line",
        smooth: true,
        data: trafficData.trafficIn,
        itemStyle: {
          color: "#349ff4",
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(52, 159, 244, 0.3)" },
            { offset: 1, color: "rgba(52, 159, 244, 0.05)" },
          ]),
        },
      },
      {
        name: "出站流量",
        type: "line",
        smooth: true,
        data: trafficData.trafficOut,
        itemStyle: {
          color: "#63e2b7",
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(99, 226, 183, 0.3)" },
            { offset: 1, color: "rgba(99, 226, 183, 0.05)" },
          ]),
        },
      },
      {
        name: "总流量",
        type: "line",
        smooth: true,
        data: trafficData.totalTraffic,
        itemStyle: {
          color: "#f0a020",
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(240, 160, 32, 0.3)" },
            { offset: 1, color: "rgba(240, 160, 32, 0.05)" },
          ]),
        },
      },
    ],
  };

  chartInstance.value.setOption(option, {
    notMerge: true,
    lazyUpdate: false,
  });

  console.log("图表更新完成，使用单位:", unit);

  // 保存当前图表数据供 tooltip 使用
  currentChartData.value = {
    dates: data.dates,
    trafficIn: trafficData.trafficIn,
    trafficOut: trafficData.trafficOut,
    totalTraffic: trafficData.totalTraffic,
    unit: unit,
  };

  // 立即清除可能存在的 axisPointer
  chartInstance.value.dispatchAction({
    type: "hideTip",
  });
};

// 处理图表鼠标进入事件
const handleChartMouseEnter = () => {
  // 如果正在加载，清除任何残留的 axisPointer
  if (trafficStatsLoading.value && chartInstance.value) {
    chartInstance.value.dispatchAction({
      type: "hideTip",
    });
    showCustomTooltip.value = false;
  }
};

// 处理图表鼠标移动事件
const handleChartMouseMove = (event: MouseEvent) => {
  // 如果图表正在加载，不显示悬停提示
  if (trafficStatsLoading.value) {
    showCustomTooltip.value = false;
    // 清除 axisPointer
    if (chartInstance.value) {
      chartInstance.value.dispatchAction({
        type: "hideTip",
      });
    }
    return;
  }

  if (
    !chartInstance.value ||
    !currentChartData.value ||
    !chartContainer.value
  ) {
    return;
  }

  // 获取图表的网格区域（实际绘图区域）
  const option = chartInstance.value.getOption() as any;
  const grid = option.grid?.[0] || {};

  // 获取容器的位置和尺寸
  const rect = chartContainer.value.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // 计算网格区域的实际像素位置
  const containerWidth = rect.width;
  const containerHeight = rect.height;

  // grid 的 left/right/top/bottom 可能是百分比或像素值
  const parseValue = (value: any, total: number) => {
    if (typeof value === "string" && value.includes("%")) {
      return (parseFloat(value) / 100) * total;
    }
    return parseFloat(value) || 0;
  };

  const gridLeft = parseValue(grid.left || "3%", containerWidth);
  const gridRight = parseValue(grid.right || "4%", containerWidth);
  const gridTop = parseValue(grid.top || "15%", containerHeight);
  const gridBottom = parseValue(grid.bottom || "3%", containerHeight);

  const gridWidth = containerWidth - gridLeft - gridRight;
  // const gridHeight = containerHeight - gridTop - gridBottom;

  // 检查鼠标是否在网格区域内
  if (
    mouseX < gridLeft ||
    mouseX > containerWidth - gridRight ||
    mouseY < gridTop ||
    mouseY > containerHeight - gridBottom
  ) {
    showCustomTooltip.value = false;
    // 清除 axisPointer
    if (chartInstance.value) {
      chartInstance.value.dispatchAction({
        type: "updateAxisPointer",
        currTrigger: "leave",
      });
    }
    return;
  }

  // 计算鼠标在网格中的相对位置（0-1）
  const relativeX = (mouseX - gridLeft) / gridWidth;

  // 根据相对位置计算最近的数据点索引
  const dataLength = currentChartData.value.dates.length;
  const dataIndex = Math.round(relativeX * (dataLength - 1));

  // 确保索引在有效范围内
  if (dataIndex < 0 || dataIndex >= dataLength) {
    showCustomTooltip.value = false;
    // 清除 axisPointer
    if (chartInstance.value) {
      chartInstance.value.dispatchAction({
        type: "updateAxisPointer",
        currTrigger: "leave",
      });
    }
    return;
  }

  // 格式化日期
  const dateObj = new Date(currentChartData.value.dates[dataIndex]);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");

  // 计算 tooltip 位置，防止超出窗口
  const tooltipWidth = 200; // 预估 tooltip 宽度
  const tooltipHeight = 150; // 预估 tooltip 高度
  const offset = 15;

  let tooltipX = event.clientX + offset;
  let tooltipY = event.clientY + offset;

  // 检查右边界
  if (tooltipX + tooltipWidth > window.innerWidth) {
    tooltipX = event.clientX - tooltipWidth - offset;
  }

  // 检查底部边界
  if (tooltipY + tooltipHeight > window.innerHeight) {
    tooltipY = event.clientY - tooltipHeight - offset;
  }

  // 确保不超出左边界
  if (tooltipX < 0) {
    tooltipX = offset;
  }

  // 确保不超出顶部边界
  if (tooltipY < 0) {
    tooltipY = offset;
  }

  // 更新 tooltip 数据
  customTooltipData.value = {
    date: `${year}-${month}-${day}`,
    trafficIn: currentChartData.value.trafficIn[dataIndex] || 0,
    trafficOut: currentChartData.value.trafficOut[dataIndex] || 0,
    totalTraffic: currentChartData.value.totalTraffic[dataIndex] || 0,
    unit: currentChartData.value.unit,
    x: tooltipX,
    y: tooltipY,
  };

  // 手动触发 axisPointer 显示
  if (chartInstance.value) {
    chartInstance.value.dispatchAction({
      type: "updateAxisPointer",
      currTrigger: "mousemove",
      x: mouseX,
      y: mouseY,
    });
  }

  showCustomTooltip.value = true;
};

// 处理鼠标离开图表
const handleChartMouseLeave = () => {
  showCustomTooltip.value = false;

  // 清除 ECharts 的 axisPointer - 使用 updateAxisPointer 并传入空坐标
  if (chartInstance.value) {
    chartInstance.value.dispatchAction({
      type: "updateAxisPointer",
      currTrigger: "leave",
    });
  }
};

// 切换日期周期
const changeDatePeriod = async (period: number) => {
  datePeriod.value = period;
  await loadTrafficStats();
};

// 监听加载状态变化，确保图表在加载完成后正确显示
watch(trafficStatsLoading, (newVal, oldVal) => {
  console.log("trafficStatsLoading 变化:", oldVal, "->", newVal);

  // 当加载完成时，清除可能残留的 axisPointer
  if (oldVal === true && newVal === false && chartInstance.value) {
    // 使用 nextTick 和 setTimeout 确保在渲染完成后清除
    nextTick(() => {
      setTimeout(() => {
        if (chartInstance.value) {
          chartInstance.value.dispatchAction({
            type: "hideTip",
          });
          console.log("加载完成后清除 axisPointer");
        }
      }, 100);
    });
  }
});

onMounted(() => {
  console.log("UserCenter 组件已挂载");
  loadUserInfo();
  loadCdkHistory();

  // 初始化图表 - 确保 DOM 完全渲染后再初始化
  nextTick(() => {
    console.log("nextTick 执行");
    console.log("chartContainer.value:", chartContainer.value);

    setTimeout(() => {
      console.log("setTimeout 执行，准备初始化图表");
      if (chartContainer.value) {
        console.log("容器存在，开始初始化");
        initChart();
        loadTrafficStats();
      } else {
        console.error("容器不存在！");
      }
    }, 200);
  });

  // 监听窗口大小变化
  const resizeHandler = () => {
    chartInstance.value?.resize();
  };
  window.addEventListener("resize", resizeHandler);
});

onBeforeUnmount(() => {
  // 清理图表实例
  if (chartInstance.value) {
    chartInstance.value.dispose();
    chartInstance.value = null;
  }

  // 移除事件监听
  window.removeEventListener("resize", () => {
    chartInstance.value?.resize();
  });
});
</script>

<style scoped>
.user-center {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}
/* 流量统计卡片样式 */
.traffic-stats-card {
  background: #18181c;
  border: 1px solid #29292c;
  position: relative;
  z-index: 1;
}

.chart-wrapper {
  position: relative;
  width: 100%;
  height: 400px;
  min-height: 400px;
  z-index: 1;
}

.chart-container {
  width: 100%;
  height: 100%;
  transition: opacity 0.3s ease;
  position: relative;
  z-index: 1;
}

.chart-loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  cursor: default;
  pointer-events: all;
}

.chart-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(24, 24, 28, 0.8);
  z-index: 10;
  pointer-events: none; /* 加载层不阻止鼠标事件 */
}

.chart-loading p {
  color: #a0a0a0;
  font-size: 14px;
  margin: 0;
}

/* 自定义 Tooltip 样式 - 使用 NCard */
.custom-tooltip {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  min-width: 140px;
  max-width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
  background: #18181c !important;
  border-color: #29292c !important;
}

.custom-tooltip :deep(.n-card__content) {
  padding: 8px 12px !important;
}

.tooltip-date {
  font-size: 15px;
  font-weight: 600;
  color: #ffffff !important;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #29292c;
}

.tooltip-content {
  font-size: 13px;
  line-height: 2;
}

.tooltip-item {
  margin-bottom: 4px;
}

.tooltip-item:last-child {
  margin-bottom: 0;
}

.tooltip-label {
  color: #ffffff !important;
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

  .chart-container {
    height: 300px;
    min-height: 300px;
  }

  .chart-wrapper {
    height: 300px;
    min-height: 300px;
  }
}
</style>
