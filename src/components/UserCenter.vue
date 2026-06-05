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

    <!-- 流量统计卡片 -->
    <n-card :bordered="true" class="traffic-stats-card">
      <template #header>
        <SectionHeader :icon="TrendingUp" title="流量历史记录" />
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
        >
          <svg
            v-if="chartModel"
            class="traffic-chart"
            :viewBox="`0 0 ${chartModel.chartWidth} ${chartModel.chartHeight}`"
          >
            <defs>
              <linearGradient id="trafficInGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--app-primary-color)" stop-opacity="0.3" />
                <stop offset="100%" stop-color="var(--app-primary-color)" stop-opacity="0.05" />
              </linearGradient>
              <linearGradient id="trafficOutGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--app-success-color)" stop-opacity="0.3" />
                <stop offset="100%" stop-color="var(--app-success-color)" stop-opacity="0.05" />
              </linearGradient>
              <linearGradient id="totalTrafficGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--app-warning-color)" stop-opacity="0.3" />
                <stop offset="100%" stop-color="var(--app-warning-color)" stop-opacity="0.05" />
              </linearGradient>
            </defs>

            <g class="chart-grid">
              <line
                v-for="tick in chartModel.yTicks"
                :key="tick.y"
                :x1="CHART_PADDING.left"
                :x2="chartModel.chartWidth - CHART_PADDING.right"
                :y1="tick.y"
                :y2="tick.y"
                class="chart-grid-line"
              />
              <text
                v-for="tick in chartModel.yTicks"
                :key="`${tick.y}-label`"
                :x="CHART_PADDING.left - 12"
                :y="tick.y + 4"
                class="chart-axis-text chart-axis-text-y"
              >
                {{ tick.value }}
              </text>
              <text
                v-for="label in chartModel.xLabels"
                :key="label.x"
                :x="label.x"
                :y="chartModel.chartHeight - 12"
                class="chart-axis-text chart-axis-text-x"
              >
                {{ label.label }}
              </text>
            </g>

            <g class="chart-areas">
              <path :d="chartModel.areaPaths.trafficIn" fill="url(#trafficInGradient)" />
              <path :d="chartModel.areaPaths.trafficOut" fill="url(#trafficOutGradient)" />
              <path :d="chartModel.areaPaths.totalTraffic" fill="url(#totalTrafficGradient)" />
            </g>

            <g class="chart-lines">
              <path :d="chartModel.linePaths.trafficIn" class="chart-line chart-line-primary" />
              <path :d="chartModel.linePaths.trafficOut" class="chart-line chart-line-success" />
              <path :d="chartModel.linePaths.totalTraffic" class="chart-line chart-line-warning" />
            </g>

            <g v-if="activePoint" class="chart-active-marker">
              <line
                :x1="activePoint.x"
                :x2="activePoint.x"
                :y1="CHART_PADDING.top"
                :y2="chartModel.chartHeight - CHART_PADDING.bottom"
                class="chart-active-line"
              />
              <circle :cx="activePoint.x" :cy="activePoint.trafficInY" r="4" class="chart-dot chart-dot-primary" />
              <circle :cx="activePoint.x" :cy="activePoint.trafficOutY" r="4" class="chart-dot chart-dot-success" />
              <circle :cx="activePoint.x" :cy="activePoint.totalTrafficY" r="4" class="chart-dot chart-dot-warning" />
            </g>
          </svg>
        </div>

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
                >下载流量: {{ customTooltipData.trafficOut }}
                {{ customTooltipData.unit }}</span
              >
            </div>
            <div class="tooltip-item">
              <span class="tooltip-label"
                >上传流量: {{ customTooltipData.trafficIn }}
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
        <SectionHeader :icon="Gift" title="CDK兑换" />
      </template>

      <n-space vertical :size="24">
        <div class="cdk-redeem-item">
          <div class="cdk-info">
            <h4>兑换CDK</h4>
            <p>输入CDK兑换码获取隧道数、流量或VIP会员</p>
          </div>
          <n-button type="primary" @click="showCdkDialog">
            <template #icon>
              <Ticket :size="16" />
            </template>
            兑换CDK
          </n-button>
        </div>
      </n-space>
      <SectionHeader :icon="History" title="CDK兑换历史" />

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

    <!-- CDK兑换模态框 -->
    <n-modal
      v-model:show="showCdkModal"
      preset="card"
      title="CDK兑换"
      :style="{ width: '450px', maxWidth: '90vw' }"
      :bordered="true"
      :segmented="{ content: true }"
      :closable="!isRedeeming"
      :mask-closable="!isRedeeming"
    >
      <n-space vertical :size="16">
        <div>
          <p style="margin-bottom: 8px; font-size: 14px">
            CDK兑换码
          </p>
          <n-input
            v-model:value="cdkCode"
            placeholder="请输入CDK兑换码"
            :disabled="isRedeeming"
          />
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
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  useMessage,
  useDialog,
  NCard,
  NButton,
  NSpace,
  NInput,
  NSpin,
  NModal,
} from "naive-ui";
import { storeToRefs } from "pinia";
import { useUserStore } from "../stores/user";
import { useAuthStore } from "../stores/auth";
import { createCaptcha } from "@/utils/captcha";
import { handleApiError } from "@/utils/errorHandler";
import { resetToken } from '@/api/auth';
import UserInfoCard from "./common/UserInfoCard.vue";
import { TrendingUp, Gift, Ticket, History, Power, Shield } from "@lucide/vue";
import SectionHeader from "@/components/common/SectionHeader.vue";
import { useTrafficChart } from "@/composables/useTrafficChart";
import { useCdkRedeem } from "@/composables/useCdkRedeem";

const router = useRouter();
const message = useMessage();
const dialog = useDialog();

// Initialize User Store
const userStore = useUserStore();
const authStore = useAuthStore();
const { userInfo, loading: userInfoLoading } = storeToRefs(userStore);
const { formattedBandwidth, formattedTraffic, formattedRegTime } = userStore;

// Traffic chart composable
const {
  chartContainer,
  trafficStatsLoading,
  datePeriod,
  showCustomTooltip,
  customTooltipData,
  chartModel,
  activePoint,
  CHART_PADDING,
  loadTrafficStats,
  handleChartMouseEnter,
  handleChartMouseMove,
  handleChartMouseLeave,
  changeDatePeriod,
} = useTrafficChart();

// CDK redeem composable
const {
  cdkCode,
  isRedeeming,
  showCdkModal,
  cdkHistory,
  cdkHistoryLoading,
  cdkHistoryTotal,
  showCdkDialog,
  performCdkRedeem,
  loadCdkHistory,
  getCdkTypeName,
  getCdkValueLabel,
  formatCdkValue,
  formatTimestamp,
} = useCdkRedeem();

// 下线所有隧道相关
const kickingAllProxies = ref(false);

// 重置访问密钥相关
const resettingToken = ref(false);

// 重置访问密钥验证码实例 (separate from CDK captcha)
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

// 执行下线所有隧道（改为前端直连 API）
const handleKickAllProxies = async () => {
  if (kickingAllProxies.value) {
    return false;
  }

  kickingAllProxies.value = true;

  try {
    const response = await fetch("https://api.mefrp.com/api/auth/user/kickAllProxies", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authStore.userToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

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
  loadCdkHistory();
  void loadTrafficStats();
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
/* 流量统计卡片样式 */
.traffic-stats-card {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
  position: relative;
  z-index: 1;
}

.chart-wrapper {
  position: relative;
  width: 100%;
  height: 460px;
  min-height: 460px;
  z-index: 1;
}

.chart-container {
  width: 100%;
  height: 100%;
  transition: opacity 0.3s ease;
  position: relative;
  z-index: 1;
}

.traffic-chart {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.chart-grid-line {
  stroke: var(--app-divider-color);
  stroke-width: 1;
}

.chart-axis-text {
  fill: var(--app-text-color-3);
  font-size: 13px;
  font-weight: 500;
  text-rendering: geometricPrecision;
}

.chart-axis-text-x {
  text-anchor: middle;
}

.chart-axis-text-y {
  text-anchor: end;
}

.chart-line {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.chart-line-primary {
  stroke: var(--app-primary-color);
}

.chart-line-success {
  stroke: var(--app-success-color);
}

.chart-line-warning {
  stroke: var(--app-warning-color);
}

.chart-active-line {
  stroke: var(--app-primary-color);
  stroke-width: 2;
  stroke-dasharray: 4 4;
  opacity: 0.8;
}

.chart-dot {
  stroke-width: 2;
  fill: var(--app-card-color);
}

.chart-dot-primary {
  stroke: var(--app-primary-color);
}

.chart-dot-success {
  stroke: var(--app-success-color);
}

.chart-dot-warning {
  stroke: var(--app-warning-color);
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
  background: var(--app-card-color);
  opacity: 0.9;
  z-index: 10;
  pointer-events: none; /* 加载层不阻止鼠标事件 */
}

.chart-loading p {
  color: var(--app-text-color-3);
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
  box-shadow: var(--app-box-shadow-2) !important;
  background: var(--app-card-color) !important;
  border-color: var(--app-border-color) !important;
}

.custom-tooltip :deep(.n-card__content) {
  padding: 8px 12px !important;
}

.tooltip-date {
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text-color-1) !important;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--app-divider-color);
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
  color: var(--app-text-color) !important;
}

/* 签到按钮区域样式 */
.sign-in-section {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.sign-in-section .n-button {
  height: 44px;
  font-size: 15px;
  font-weight: 600;
}

/* CDK相关样式 */
.cdk-section {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
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

.cdk-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--app-text-color-1);
}

.cdk-info p {
  margin: 0;
  font-size: 12px;
  color: var(--app-text-color-3);
  line-height: 1.4;
}

/* CDK兑换历史样式 */
.cdk-history-content {
  padding: 16px 0;
}

.loading-text,
.empty-text {
  color: var(--app-text-color-3);
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
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.cdk-history-card:hover {
  background: var(--app-card-color);
  border-color: var(--app-primary-color);
  filter: brightness(1.05);
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
  background: color-mix(in srgb, var(--app-primary-color) 15%, transparent);
  color: var(--app-primary-color);
}

.badge-proxy {
  background: color-mix(in srgb, var(--app-success-color) 15%, transparent);
  color: var(--app-success-color);
}

.badge-vip {
  background: color-mix(in srgb, var(--app-warning-color) 15%, transparent);
  color: var(--app-warning-color);
}

.cdk-card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cdk-card-value {
  color: var(--app-text-color-1);
  font-size: 14px;
  font-weight: 500;
}

.cdk-card-time {
  color: var(--app-text-color-3);
  font-size: 12px;
}

.cdk-card-right {
  display: flex;
  align-items: center;
}

.cdk-card-code {
  color: var(--app-text-color-3);
  font-size: 12px;
  font-family: "Courier New", monospace;
  padding: 4px 8px;
  background: var(--app-card-color);
  border-radius: 4px;
  border: 1px solid var(--app-border-color);
}

.cdk-history-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--app-divider-color);
}

.pagination-info {
  color: var(--app-text-color-3);
  font-size: 13px;
}

@media (max-width: 768px) {
  .user-center {
    padding: 10px;
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
    height: 340px;
    min-height: 340px;
  }

  .chart-wrapper {
    height: 340px;
    min-height: 340px;
  }
}
</style>
