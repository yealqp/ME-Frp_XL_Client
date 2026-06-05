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
    <n-modal
      v-model:show="showResultModal"
      preset="dialog"
      title="抽奖结果"
      :mask-closable="false"
    >
      <div class="result-body">
        <n-result
          :status="resultModalStatus"
          :title="resultModalTitle"
          :description="resultModalDesc"
        >
          <template #icon>
            <n-icon :size="48" :color="resultModalIconColor">
              <component :is="resultModalIcon" />
            </n-icon>
          </template>
        </n-result>

        <div v-if="resultModalCouponCode" class="coupon-display">
          <n-input-group style="max-width: 340px; margin: 0 auto;">
            <n-input
              :value="resultModalCouponCode"
              readonly
              style="text-align: center; font-weight: 700; font-size: 15px; letter-spacing: 1px;"
            />
            <n-button type="primary" @click="copyText(resultModalCouponCode)">
              复制
            </n-button>
          </n-input-group>
          <p class="coupon-hint">优惠码有效期 7 天，请尽快使用</p>
        </div>
      </div>
      <template #action>
        <n-button type="primary" @click="showResultModal = false">知道了</n-button>
      </template>
    </n-modal>

    <!-- 全部抽奖结果弹窗 -->
    <n-modal
      v-model:show="showBatchModal"
      preset="dialog"
      title="全部抽奖结果"
      :mask-closable="false"
      style="width: 480px;"
    >
      <div class="result-body">
        <n-result status="success" title="抽奖完成">
          <template #icon>
            <n-icon :size="48" color="#18a058">
              <Gift :size="28" />
            </n-icon>
          </template>
        </n-result>

        <div v-if="batchTotalCount > 0" class="batch-summary-cards">
          <n-card size="small" :bordered="true" class="summary-stat-card">
            <n-statistic label="抽奖次数" :value="batchTotalCount" />
          </n-card>
          <n-card v-if="batchTotalTraffic > 0" size="small" :bordered="true" class="summary-stat-card">
            <n-statistic label="获得流量" :value="batchTotalTraffic" suffix="GB" />
          </n-card>
          <n-card v-if="batchVipDays > 0" size="small" :bordered="true" class="summary-stat-card">
            <n-statistic label="会员延长" :value="batchVipDays" suffix="天" />
          </n-card>
        </div>

        <div v-if="batchCoupons.length > 0" class="batch-coupons">
          <p class="batch-section-title">获得的优惠码</p>
          <n-card
            v-for="(code, i) in batchCoupons"
            :key="i"
            size="small"
            :bordered="true"
            class="coupon-card"
          >
            <div class="coupon-card-body">
              <code class="coupon-code-text">{{ code }}</code>
              <n-button size="tiny" @click="copyText(code)">复制</n-button>
            </div>
          </n-card>
        </div>

        <div v-if="batchTotalCount === 0">
          <n-empty description="本次未获得任何奖励" />
        </div>

        <div v-if="batchSkipped > 0" class="batch-skipped">
          因流量不足跳过 {{ batchSkipped }} 次抽奖
        </div>
      </div>
      <template #action>
        <n-button type="primary" @click="showBatchModal = false">知道了</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Gift, Dices, Sparkles } from "lucide-vue-next";
import { NIcon, NStatistic, NDataTable, NInputGroup } from "naive-ui";
import confetti from "canvas-confetti";
import { useAuthStore } from "@/stores/auth";
import { doLuckydraw, getLuckydrawInfo, getUserInfo } from "@/api/auth";
import { formatTraffic } from "@/utils/timeFormatter";

const authStore = useAuthStore();

const isDrawing = ref(false);
const errorMsg = ref("");
const todayDrawCount = ref(0);
const userTraffic = ref<number | null>(null);

const animSlotIndex = ref(0);
let animTimer: ReturnType<typeof setInterval> | null = null;

const showResultModal = ref(false);
const resultModalStatus = ref<"success" | "warning">("success");
const resultModalTitle = ref("");
const resultModalDesc = ref("");
const resultModalIcon = ref<any>(Gift);
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
  if (prize.type === "traffic") {
    fireConfetti(100);
    resultModalStatus.value = "success";
    resultModalTitle.value = `恭喜获得 ${prize.prize}！`;
    resultModalDesc.value = "流量已发放至您的账户";
    resultModalIcon.value = Gift;
    resultModalIconColor.value = "#18a058";
    resultModalCouponCode.value = "";
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
    resultModalCouponCode.value = "";
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

    setTimeout(() => showSingleResult(prize), 300);
  } catch (e: any) {
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
      if (i > 0) {
        await new Promise(r => setTimeout(r, 1500));
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

onMounted(() => {
  fetchDrawInfo();
  fetchUserTraffic();
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
  border: 1.5px solid color-mix(in srgb, var(--app-primary-color) 15%, transparent);
  transition: all 0.12s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  z-index: 1;
}

.slot-reel.active .reel-inner {
  background: var(--app-primary-color);
  border-color: var(--app-primary-color);
  transform: scale(1.18) translateY(-2px);
  box-shadow:
    0 8px 24px color-mix(in srgb, var(--app-primary-color) 45%, transparent),
    0 0 0 4px color-mix(in srgb, var(--app-primary-color) 15%, transparent);
}

.slot-reel.active .reel-icon {
  animation: reelBounce 0.12s ease;
  color: #fff;
}

@keyframes reelBounce {
  0%   { transform: rotate(-15deg) scale(1.1); }
  50%  { transform: rotate(10deg) scale(1.3); }
  100% { transform: rotate(0deg) scale(1); }
}

/* 光晕 */
.reel-glow {
  position: absolute;
  inset: -6px;
  border-radius: 20px;
  opacity: 0;
  transition: opacity 0.15s ease;
  pointer-events: none;
}

.slot-reel.active .reel-glow {
  opacity: 1;
  background: radial-gradient(circle, color-mix(in srgb, var(--app-primary-color) 25%, transparent) 0%, transparent 70%);
  animation: glowPulse 0.6s ease-in-out infinite alternate;
}

@keyframes glowPulse {
  0%   { transform: scale(1); opacity: 0.4; }
  100% { transform: scale(1.3); opacity: 0.8; }
}

/* reel 之间的连接点 */
.reel-connector {
  display: flex;
  gap: 42px;
  margin-top: 8px;
}

.connector-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--app-primary-color);
  opacity: 0.25;
  animation: dotPulse 0.8s ease-in-out infinite alternate;
}

.connector-dot:nth-child(2) { animation-delay: 0.2s; }
.connector-dot:nth-child(3) { animation-delay: 0.4s; }
.connector-dot:nth-child(4) { animation-delay: 0.6s; }

@keyframes dotPulse {
  0%   { opacity: 0.15; transform: scale(1); }
  100% { opacity: 0.6; transform: scale(1.5); }
}

/* 底部提示 */
.slot-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
  font-size: 14px;
}

.hint-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--app-primary-color);
  animation: hintBlink 1s ease-in-out infinite;
}

@keyframes hintBlink {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.2; transform: scale(0.6); }
}

.draw-stats {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 500px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 13px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
}

.stat-value small {
  font-size: 13px;
  font-weight: 400;
}

.text-success { color: #18a058; }
.text-danger { color: #d03050; }

.stat-divider {
  width: 1px;
  height: 36px;
  background-color: var(--app-border-color);
}

.result-body {
  padding: 8px 0;
}

.coupon-display {
  margin-top: 12px;
  text-align: center;
}

.coupon-hint {
  margin-top: 8px;
  font-size: 13px;
}

.batch-summary-cards {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.summary-stat-card {
  flex: 1;
  min-width: 100px;
  text-align: center;
}

.batch-section-title {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 8px;
}

.batch-coupons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.coupon-card-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.coupon-code-text {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  word-break: break-all;
}

.batch-skipped {
  margin-top: 12px;
  font-size: 13px;
  text-align: center;
}
</style>
