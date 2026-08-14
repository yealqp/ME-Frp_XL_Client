<template>
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
  </n-card>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { Gift, Ticket, History } from "@lucide/vue";
import SectionHeader from "@/components/common/SectionHeader.vue";
import { useCdkRedeem } from "@/composables/useCdkRedeem";

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

onMounted(() => {
  loadCdkHistory();
});
</script>

<style scoped>
.cdk-section {
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

.cdk-history-content {
  margin-top: 8px;
}

.loading-text,
.empty-text {
  padding: 24px 0;
  text-align: center;
  color: var(--app-text-color-3);
  font-size: 14px;
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
  padding: 16px;
  border: 1px solid var(--app-border-color);
  border-radius: 12px;
  background: var(--app-card-color);
  gap: 12px;
}

.cdk-card-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.cdk-type-badge {
  flex-shrink: 0;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.badge-traffic {
  color: var(--app-success-color);
  background: color-mix(in srgb, var(--app-success-color) 12%, transparent);
}

.badge-proxy {
  color: var(--app-info-color);
  background: color-mix(in srgb, var(--app-info-color) 12%, transparent);
}

.badge-vip {
  color: var(--app-warning-color);
  background: color-mix(in srgb, var(--app-warning-color) 12%, transparent);
}

.cdk-card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.cdk-card-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text-color);
}

.cdk-card-time {
  font-size: 12px;
  color: var(--app-text-color-3);
}

.cdk-card-right {
  flex-shrink: 0;
}

.cdk-card-code {
  font-family: "Consolas", "Monaco", monospace;
  font-size: 13px;
  color: var(--app-text-color-1);
  background: color-mix(in srgb, var(--app-primary-color) 6%, transparent);
  padding: 6px 12px;
  border-radius: 6px;
}

.cdk-history-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
}

.pagination-info {
  font-size: 12px;
  color: var(--app-text-color-3);
}
</style>
