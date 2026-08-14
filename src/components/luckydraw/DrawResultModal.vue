<template>
  <n-modal
    v-model:show="show"
    preset="dialog"
    title="抽奖结果"
    :mask-closable="false"
  >
    <div class="result-body">
      <n-result
        :status="status"
        :title="title"
        :description="desc"
      >
        <template #icon>
          <n-icon :size="48" :color="iconColor">
            <component :is="icon" />
          </n-icon>
        </template>
      </n-result>

      <div v-if="couponCode" class="coupon-display">
        <n-input-group style="max-width: 340px; margin: 0 auto;">
          <n-input
            :value="couponCode"
            readonly
            style="text-align: center; font-weight: 700; font-size: 15px; letter-spacing: 1px;"
          />
          <n-button type="primary" @click="emit('copy', couponCode)">
            复制
          </n-button>
        </n-input-group>
        <p class="coupon-hint">优惠码有效期 7 天，请尽快使用</p>
      </div>
    </div>
    <template #action>
      <n-button type="primary" @click="show = false">知道了</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { computed, type Component } from "vue";

const props = defineProps<{
  show: boolean;
  status: "success" | "warning";
  title: string;
  desc: string;
  icon: Component;
  iconColor: string;
  couponCode: string;
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

.coupon-display {
  margin-top: 16px;
}

.coupon-hint {
  margin-top: 8px;
  text-align: center;
  font-size: 12px;
  color: var(--app-text-color-3);
}
</style>
