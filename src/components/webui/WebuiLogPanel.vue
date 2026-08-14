<template>
  <n-card :bordered="true" class="webui-logs-section">
    <template #header>
      <SectionHeader :icon="FileText">
        <span>Mefrpc 运行日志</span>
        <n-tag type="error" size="medium" style="margin-left: 8px">
          如果您截图分享此页面请打码红色字体内容
        </n-tag>
        <n-space :size="8" style="margin-left: auto">
          <n-button
            text
            type="info"
            @click="emit('copy')"
            :disabled="!logs || logs.length === 0"
          >
            <template #icon>
              <Copy :size="18" />
            </template>
            复制
          </n-button>
          <n-button
            v-if="enableAi"
            text
            type="info"
            @click="emit('analyze')"
            :loading="aiAnalyzing"
            :disabled="!logs || logs.length === 0"
          >
            <template #icon>
              <Brain :size="18" />
            </template>
            AI 分析
          </n-button>
        </n-space>
      </SectionHeader>
    </template>

    <div class="logs-content">
      <div v-if="logsLoading && (!logs || logs.length === 0)" class="logs-loading">
        <n-spin size="large" />
        <p>加载日志中...</p>
      </div>
      <div v-else-if="logsError" class="logs-error">
        <n-alert type="error" :title="logsError" />
      </div>
      <div v-else-if="logs && logs.length > 0" class="logs-text" ref="logsTextRef">
        <div
          v-for="(log, index) in logs"
          :key="index"
          class="log-line"
          v-html="colorizeLog(log)"
        ></div>
      </div>
      <div v-else class="logs-empty">
        <n-empty description="暂无日志数据" />
      </div>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { FileText, Copy, Brain } from "@lucide/vue";
import SectionHeader from "@/components/common/SectionHeader.vue";
import { formatLogHtml } from "@/utils/logSanitizer";

const props = defineProps<{
  logs: string[];
  logsLoading: boolean;
  logsError: string;
  enableAi: boolean;
  aiAnalyzing: boolean;
}>();

const emit = defineEmits<{
  (e: "copy"): void;
  (e: "analyze"): void;
}>();

const logsTextRef = ref<HTMLDivElement | null>(null);

const colorizeLog = (log: string): string => {
  return formatLogHtml(log, "line");
};

// 日志更新时自动滚动到底部
watch(
  () => props.logs,
  () => {
    nextTick(() => {
      if (logsTextRef.value) {
        logsTextRef.value.scrollTop = logsTextRef.value.scrollHeight;
      }
    });
  },
);
</script>

<style scoped>
.webui-logs-section {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
}

.logs-content {
  max-height: 400px;
  overflow-y: auto;
}

.logs-loading,
.logs-error,
.logs-empty {
  padding: 32px 0;
  text-align: center;
}

.logs-loading p {
  margin-top: 12px;
  color: var(--app-text-color-2);
  font-size: 14px;
}

.logs-text {
  font-family: "Consolas", "Monaco", monospace;
  font-size: 12px;
  line-height: 1.7;
  background: var(--app-card-color);
  border-radius: 8px;
  padding: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-line {
  padding: 2px 0;
  color: var(--app-text-color-2);
}

.log-line:hover {
  background: color-mix(in srgb, var(--app-primary-color) 6%, transparent);
}
</style>
