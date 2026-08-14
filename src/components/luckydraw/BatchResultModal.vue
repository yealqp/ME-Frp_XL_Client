<template>
  <n-modal
    v-model:show="show"
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

      <div v-if="totalCount > 0" class="batch-summary-cards">
        <n-card size="small" :bordered="true" class="summary-stat-card">
          <n-statistic label="抽奖次数" :value="totalCount" />
        </n-card>
        <n-card v-if="totalTraffic > 0" size="small" :bordered="true" class="summary-stat-card">
          <n-statistic label="获得流量" :value="totalTraffic" suffix="GB" />
        </n-card>
        <n-card v-if="vipDays > 0" size="small" :bordered="true" class="summary-stat-card">
          <n-statistic label="会员延长" :value="vipDays" suffix="天" />
        </n-card>
      </div>

      <div v-if="coupons.length > 0" class="batch-coupons">
        <p class="batch-section-title">获得的优惠码</p>
        <n-card
          v-for="(code, i) in coupons"
          :key="i"
          size="small"
          :bordered="true"
          class="coupon-card"
        >
          <div class="coupon-card-body">
            <code class="coupon-code-text">{{ code }}</code>
            <n-button size="tiny" @click="emit('copy', code)">复制</n-button>
          </div>
        </n-card>
      </div>

      <div v-if="totalCount === 0">
        <n-empty description="本次未获得任何奖励" />
      </div>

      <div v-if="skipped > 0" class="batch-skipped">
        因流量不足跳过 {{ skipped }} 次抽奖
      </div>
    </div>
    <template #action>
      <n-button type="primary" @click="show = false">知道了</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Gift } from "@lucide/vue";

const props = defineProps<{
  show: boolean;
  totalCount: number;
  totalTraffic: number;
  vipDays: number;
  coupons: string[];
  skipped: number;
}>();

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
  (e: "copy", code: string): void;
}>();

const show = computed({
  get: () => props.show,
  set: (value: boolean) => emit("update:show", value),
});
</script>

<style scoped>
.result-body {
  padding: 8px 0;
}

.batch-summary-cards {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 16px;
}

.summary-stat-card {
  min-width: 120px;
  flex: 1;
}

.batch-coupons {
  margin-top: 16px;
}

.batch-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-color-2);
  margin-bottom: 8px;
}

.coupon-card {
  margin-bottom: 8px;
}

.coupon-card-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.coupon-code-text {
  font-family: "Consolas", "Monaco", monospace;
  font-size: 14px;
  color: var(--app-primary-color);
  word-break: break-all;
}

.batch-skipped {
  margin-top: 12px;
  text-align: center;
  font-size: 13px;
  color: var(--app-warning-color);
}
</style>
