<template>
  <div class="luckydraw">
    <div class="page-header">
      <h2 class="page-title">每日抽奖</h2>
    </div>

    <n-alert type="info" title="抽奖规则" style="margin-bottom: 4px;">
      <ol style="margin: 0; padding-left: 20px; line-height: 2;">
        <li>每次抽奖需消耗 <strong>10 GB</strong> 账户可用流量作为抽奖资格，流量不足将无法抽奖</li>
        <li>每次抽奖可能获得的奖励包括：流量包、专属优惠码或会员时长</li>
        <li>流量奖励将直接发放至账户余额，不可转移或提现</li>
        <li>会员奖励将直接延长账户会员有效期，不可折现或转移</li>
        <li>专属优惠码将直接发放给您，有效期 7 天，不可折现或转移给他人使用</li>
        <li>每日抽奖次数上限为 <strong>10</strong> 次，每日 <strong>00:00</strong> 重置 (UTC+8)</li>
      </ol>
    </n-alert>

    <!-- 抽奖主卡片 -->
    <n-card :bordered="false">
      <div class="draw-main">
        <!-- 抽奖按钮 -->
        <div v-if="!isDrawing && !batchDrawing" class="draw-area">
          <div class="draw-buttons">
            <n-button
              :disabled="remainingDraws <= 0"
              type="primary"
              size="large"
              class="draw-button"
              @click="handleDraw"
            >
              <template #icon>
                <Sparkles :size="28" />
              </template>
              开始抽奖
            </n-button>
            <n-button
              :disabled="remainingDraws <= 0"
              :loading="batchDrawing"
              size="large"
              class="draw-button batch-button"
              @click="handleBatchDraw"
            >
              <template #icon>
                <Gift :size="22" />
              </template>
              全部抽奖
            </n-button>
          </div>
        </div>

        <!-- 抽奖动画 -->
        <div v-if="isDrawing || batchDrawing" class="draw-area draw-area-anim">
          <div class="slot-ring" />
          <div class="slot-machine">
            <div class="slot-reels">
              <div
                v-for="i in 5"
                :key="i"
                class="slot-reel"
                :class="{ active: animSlotIndex === i }"
              >
                <div class="reel-inner">
                  <div class="reel-icon">
                    <Dices :size="24" />
                  </div>
                </div>
                <div class="reel-glow" />
              </div>
            </div>
            <div class="reel-connector">
              <span class="connector-dot" v-for="d in 4" :key="d" />
            </div>
          </div>
          <div class="slot-hint">
            <span class="hint-dot" />
            <span>{{ batchDrawing ? (drawProgress || '抽奖中...') : '抽奖中...' }}</span>
          </div>
        </div>

        <n-divider />

        <!-- 状态统计栏 -->
        <div class="draw-stats">
          <div class="stat-item">
            <span class="stat-label">账户流量</span>
            <span class="stat-value">{{ trafficDisplay }}</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <span class="stat-label">每次消耗</span>
            <span class="stat-value">10 <small>GB</small></span>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <span class="stat-label">今日剩余</span>
            <span class="stat-value" :class="remainingDraws > 0 ? 'text-success' : 'text-danger'">
              {{ remainingDraws }} <small>次</small>
            </span>
          </div>
        </div>
      </div>
    </n-card>

    <!-- 错误提示 -->
    <n-alert
      v-if="errorMsg"
      type="error"
      :bordered="false"
      closable
      @close="errorMsg = ''"
    >
      {{ errorMsg }}
    </n-alert>

    <!-- 奖品概率公示 -->
    <n-card title="奖品概率公示" :bordered="false">
      <n-data-table
        :columns="probColumns"
        :data="probData"
        :bordered="false"
        :single-line="false"
        striped
      />
    </n-card>

    <!-- 单抽结果弹窗 -->
    <DrawResultModal
      v-model:show="showResultModal"
      :status="resultModalStatus"
      :title="resultModalTitle"
      :desc="resultModalDesc"
      :icon="resultModalIcon"
      :icon-color="resultModalIconColor"
      :coupon-code="resultModalCouponCode"
      @copy="copyText"
    />

    <!-- 全部抽奖结果弹窗 -->
    <BatchResultModal
      v-model:show="showBatchModal"
      :total-count="batchTotalCount"
      :total-traffic="batchTotalTraffic"
      :vip-days="batchVipDays"
      :coupons="batchCoupons"
      :skipped="batchSkipped"
      @copy="copyText"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type Component } from "vue";
import { Gift, Dices, Sparkles } from "@lucide/vue";
import { NIcon, NStatistic, NDataTable, NInputGroup } from "naive-ui";
import confetti from "canvas-confetti";
import { useAuthStore } from "@/stores/auth";
import { doLuckydraw, getLuckydrawInfo, getUserInfo } from "@/api/auth";
import { formatTraffic } from "@/utils/timeFormatter";
import DrawResultModal from "@/components/luckydraw/DrawResultModal.vue";
import BatchResultModal from "@/components/luckydraw/BatchResultModal.vue";

const authStore = useAuthStore();

const isDrawing = ref(false);
const errorMsg = ref("");
const todayDrawCount = ref(0);
const userTraffic = ref<number | null>(null);

const animSlotIndex = ref(0);
let animTimer: ReturnType<typeof setInterval> | null = null;
let resultTimeout: ReturnType<typeof setTimeout> | null = null;
const batchCancelled = ref(false);

const showResultModal = ref(false);
const resultModalStatus = ref<"success" | "warning">("success");
const resultModalTitle = ref("");
const resultModalDesc = ref("");
const resultModalIcon = ref<Component>(Gift);
const resultModalIconColor = ref("");
const resultModalCouponCode = ref("");

const batchDrawing = ref(false);
const showBatchModal = ref(false);
const batchTotalCount = ref(0);
const batchTotalTraffic = ref(0);
const batchVipDays = ref(0);
const batchCoupons = ref<string[]>([]);
const batchSkipped = ref(0);
const drawProgress = ref("");

const remainingDraws = computed(() => Math.max(0, 10 - todayDrawCount.value));

const trafficDisplay = computed(() => {
  if (userTraffic.value === null) return "--";
  return formatTraffic(userTraffic.value);
});

interface ProbRow {
  prize: string;
  probability: string;
}

const probColumns = [
  { title: "奖品", key: "prize" },
  { title: "概率", key: "probability" },
];

const probData = ref<ProbRow[]>([
  { prize: "随机立减优惠码", probability: "15%" },
  { prize: "10 GB 流量", probability: "30%" },
  { prize: "25 GB 流量", probability: "20%" },
  { prize: "40 GB 流量", probability: "15%" },
  { prize: "55 GB 流量", probability: "10%" },
  { prize: "70 GB 流量", probability: "5%" },
  { prize: "85 GB 流量", probability: "3%" },
  { prize: "100 GB 流量", probability: "1%" },
  { prize: "120 GB 流量", probability: "1%" },
  { prize: "特殊奖励", probability: "0%" },
]);

function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function startAnimation() {
  isDrawing.value = true;
  animSlotIndex.value = 0;
  let count = 0;

  animTimer = setInterval(() => {
    count++;
    animSlotIndex.value = (count % 5) + 1;
    if (count >= 15) {
      stopAnimation();
    }
  }, 120);
}

function stopAnimation() {
  if (animTimer) {
    clearInterval(animTimer);
    animTimer = null;
  }
}

function fireConfetti(count = 100) {
  confetti({
    particleCount: count,
    spread: 60,
    origin: { y: 0.7 },
    zIndex: 3000,
  });
}

function showSingleResult(prize: { type: string; prize: string }) {
  // 先重置弹窗状态，避免未知奖品类型时残留上一次结果
  resultModalTitle.value = "";
  resultModalDesc.value = "";
  resultModalCouponCode.value = "";
  resultModalIcon.value = Gift;
  resultModalIconColor.value = "";
  resultModalStatus.value = "warning";

  if (prize.type === "traffic") {
    fireConfetti(100);
    resultModalStatus.value = "success";
    resultModalTitle.value = `恭喜获得 ${prize.prize}！`;
    resultModalDesc.value = "流量已发放至您的账户";
    resultModalIcon.value = Gift;
    resultModalIconColor.value = "#18a058";
  } else if (prize.type === "coupon") {
    fireConfetti(100);
    const codeMatch = String(prize.prize).match(/[A-Z0-9]{6,}/);
    const code = codeMatch ? codeMatch[0] : String(prize.prize);
    resultModalStatus.value = "success";
    resultModalTitle.value = "恭喜获得专属优惠码！";
    resultModalDesc.value = `优惠码: ${code}`;
    resultModalIcon.value = Gift;
    resultModalIconColor.value = "#d03050";
    resultModalCouponCode.value = code;
  } else if (prize.type === "vip") {
    fireConfetti(100);
    resultModalStatus.value = "success";
    resultModalTitle.value = `恭喜获得 ${prize.prize}！`;
    resultModalDesc.value = "会员时长已延长至您的账户";
    resultModalIcon.value = Gift;
    resultModalIconColor.value = "#f0a020";
  } else {
    // 未知奖品类型：给出兜底文案而非残留旧结果
    resultModalStatus.value = "warning";
    resultModalTitle.value = "抽奖完成";
    resultModalDesc.value = String(prize.prize || "获得奖励，详情请查看账户");
  }
  showResultModal.value = true;
}

async function fetchDrawInfo() {
  try {
    const token = authStore.userToken;
    if (!token) return;
    const res = await getLuckydrawInfo(token);
    if (res.code === 200 && res.data) {
      todayDrawCount.value = res.data.count;
    }
  } catch { /* ignore */ }
}

async function fetchUserTraffic() {
  try {
    const token = authStore.userToken;
    if (!token) return;
    const res = await getUserInfo(token);
    if (res.code === 200 && res.data) {
      userTraffic.value = res.data.traffic;
    }
  } catch { /* ignore */ }
}

async function handleDraw() {
  if (isDrawing.value || remainingDraws.value <= 0) return;
  errorMsg.value = "";

  const token = authStore.userToken;
  if (!token) {
    errorMsg.value = "请先登录";
    return;
  }

  try {
    startAnimation();
    const res = await doLuckydraw(token);
    if (res.code !== 200) throw new Error(res.message || "抽奖失败");

    await new Promise(r => setTimeout(r, 200));

    const prize = res.data;
    todayDrawCount.value++;

    if (userTraffic.value !== null) {
      userTraffic.value = Math.max(0, userTraffic.value - 10240);
      if (prize.type === "traffic") {
        userTraffic.value += prize.value * 1024;
      }
    }

    isDrawing.value = false;
    animSlotIndex.value = 0;

    // 记录句柄，支持卸载时取消
    resultTimeout = setTimeout(() => showSingleResult(prize), 300);
  } catch (e: any) {
    stopAnimation();
    isDrawing.value = false;
    animSlotIndex.value = 0;
    const msg = e?.message || String(e);
    errorMsg.value = msg.includes("流量") || msg.includes("traffic")
      ? `流量不足，无法抽奖。${msg}`
      : msg;
  }
}

async function handleBatchDraw() {
  const remaining = remainingDraws.value;
  if (batchDrawing.value || remaining <= 0) return;
  errorMsg.value = "";

  const token = authStore.userToken;
  if (!token) {
    errorMsg.value = "请先登录";
    return;
  }

  batchDrawing.value = true;
  batchCancelled.value = false; // 每次开始重置取消标志
  batchTotalCount.value = 0;
  batchTotalTraffic.value = 0;
  batchVipDays.value = 0;
  batchCoupons.value = [];
  batchSkipped.value = 0;
  drawProgress.value = "";

  animSlotIndex.value = 0;
  let animCount = 0;
  const batchAnimTimer = setInterval(() => {
    animCount++;
    animSlotIndex.value = (animCount % 5) + 1;
  }, 150);

  try {
    for (let i = 0; i < remaining; i++) {
      if (batchCancelled.value) {
        break;
      }

      if (i > 0) {
        await new Promise(r => setTimeout(r, 1500));
        if (batchCancelled.value) {
          break;
        }
      }

      drawProgress.value = `正在抽奖 (${i + 1}/${remaining})...`;

      try {
        const res = await doLuckydraw(token);
        if (res.code !== 200) throw new Error(res.message);

        const prize = res.data;
        todayDrawCount.value++;

        if (userTraffic.value !== null) {
          userTraffic.value = Math.max(0, userTraffic.value - 10240);
          if (prize.type === "traffic") {
            userTraffic.value += prize.value * 1024;
          }
        }

        batchTotalCount.value++;

        if (prize.type === "traffic") {
          batchTotalTraffic.value += prize.value;
        } else if (prize.type === "coupon") {
          const codeMatch = String(prize.prize).match(/[A-Z0-9]{6,}/);
          batchCoupons.value.push(codeMatch ? codeMatch[0] : String(prize.prize));
        } else if (prize.type === "vip") {
          batchVipDays.value += prize.value;
        }
      } catch {
        batchSkipped.value++;
        continue;
      }
    }

    drawProgress.value = "";

    if (batchTotalCount.value > 0) {
      fireConfetti(150);
    }
    showBatchModal.value = true;
  } catch {
    errorMsg.value = "全部抽奖出现异常";
  } finally {
    clearInterval(batchAnimTimer);
    animSlotIndex.value = 0;
    batchDrawing.value = false;
  }
}

/**
 * 取消进行中的批量抽奖
 *
 * 批量抽奖每次消耗流量，用户离开页面或主动取消时应停止后续请求。
 * 正在进行的单次请求无法中断，但会跳过剩余轮次。
 */
function cancelBatchDraw() {
  batchCancelled.value = true;
}

onMounted(() => {
  fetchDrawInfo();
  fetchUserTraffic();
});

onUnmounted(() => {
  // 清理所有定时器，避免卸载后动画/弹窗继续触发
  stopAnimation();
  if (resultTimeout !== null) {
    clearTimeout(resultTimeout);
    resultTimeout = null;
  }
  // 取消进行中的批量抽奖（防止卸载后继续消耗流量的请求）
  batchCancelled.value = true;
});
</script>

<style scoped>
.luckydraw {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
}

.draw-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
}

.draw-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
}

.draw-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.draw-button {
  min-width: 240px;
  font-size: 20px;
  padding: 16px 48px;
  border-radius: 12px;
}

.batch-button {
  min-width: 200px;
  font-size: 16px;
  padding: 10px 32px;
}

/* ===== 抽奖动画 ===== */
.draw-area-anim {
  position: relative;
  overflow: visible;
}

/* 光环 */
.slot-ring {
  position: absolute;
  inset: -40px;
  border-radius: 50%;
  border: 2px solid var(--app-primary-color);
  opacity: 0;
  animation: ringPulse 1.2s ease-out infinite;
  pointer-events: none;
}

@keyframes ringPulse {
  0%   { transform: scale(0.6); opacity: 0.5; }
  100% { transform: scale(1.4); opacity: 0; }
}

/* 主体 */
.slot-machine {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  position: relative;
}

.slot-reels {
  display: flex;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.slot-reel {
  position: relative;
  width: 58px;
  height: 58px;
}

.reel-inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: color-mix(in srgb, var(--app-primary-color) 8%, transparent);
  border: 2px solid var(--app-border-color);
  transition: all 0.15s ease;
  position: relative;
  z-index: 2;
}

.slot-reel.active .reel-inner {
  border-color: var(--app-primary-color);
  box-shadow: 0 0 16px color-mix(in srgb, var(--app-primary-color) 50%, transparent);
  transform: scale(1.1);
}

.reel-icon {
  color: var(--app-primary-color);
}

.reel-glow {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: var(--app-primary-color);
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 1;
}

.slot-reel.active .reel-glow {
  opacity: 0.15;
}

.reel-connector {
  display: flex;
  gap: 14px;
  margin-top: 12px;
}

.connector-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--app-border-color);
}

.connector-dot:nth-child(odd) {
  background: var(--app-primary-color);
}

.slot-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  color: var(--app-text-color-2);
  font-size: 14px;
}

.hint-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--app-primary-color);
  animation: hintBlink 0.8s ease-in-out infinite;
}

@keyframes hintBlink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.2; }
}

/* ===== 状态统计栏 ===== */
.draw-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 8px 0;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 13px;
  color: var(--app-text-color-3);
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--app-text-color);
}

.text-success {
  color: var(--app-success-color);
}

.text-danger {
  color: var(--app-error-color);
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: var(--app-divider-color);
}
</style>
