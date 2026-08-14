<template>
  <n-card :bordered="true" class="webui-section">
    <template #header>
      <SectionHeader :icon="Settings" title="MEFrpc WebUI 设置" />
    </template>

    <div class="settings-row">
      <div class="setting-item-inline">
        <span class="setting-label">地址</span>
        <n-input
          :value="addr"
          placeholder="localhost"
          @update:value="(value: string) => { emit('update:addr', value); emit('save'); }"
          size="small"
          style="width: 120px"
        />
      </div>

      <div class="setting-item-inline">
        <span class="setting-label">端口</span>
        <n-input-number
          :value="port"
          :min="1"
          :max="65535"
          :step="1"
          placeholder="1201"
          @update:value="(value: number | null) => { emit('update:port', value); emit('save'); }"
          size="small"
          style="width: 100px"
        />
      </div>

      <div class="setting-item-inline">
        <span class="setting-label">密码</span>
        <n-input
          :value="pass"
          type="password"
          show-password-on="click"
          placeholder="admin"
          @update:value="(value: string) => { emit('update:pass', value); emit('save'); }"
          size="small"
          style="width: 100px"
        />
      </div>

      <n-space :size="8" style="margin-left: auto">
        <n-tooltip v-if="!isRunning">
          <template #trigger>
            <n-button
              type="primary"
              @click="emit('start')"
              :loading="isStarting"
              size="small"
            >
              <template #icon>
                <Play :size="14" />
              </template>
              启动
            </n-button>
          </template>
          启动 WebUI
        </n-tooltip>
        <n-tooltip v-else>
          <template #trigger>
            <n-button
              type="warning"
              @click="emit('stop')"
              :loading="isStopping"
              size="small"
            >
              <template #icon>
                <Square :size="14" />
              </template>
              停止
            </n-button>
          </template>
          停止 WebUI
        </n-tooltip>

        <n-tooltip>
          <template #trigger>
            <n-button
              type="primary"
              @click="emit('open-window')"
              :disabled="!isRunning"
              size="small"
            >
              <template #icon>
                <ExternalLink :size="14" />
              </template>
              新窗口
            </n-button>
          </template>
          在新窗口中打开 WebUI
        </n-tooltip>

        <n-tooltip>
          <template #trigger>
            <n-button
              type="info"
              @click="emit('open-browser')"
              :disabled="!isRunning"
              size="small"
            >
              <template #icon>
                <ExternalLink :size="14" />
              </template>
              浏览器
            </n-button>
          </template>
          在浏览器中打开 WebUI
        </n-tooltip>
      </n-space>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { Settings, Play, Square, ExternalLink } from "@lucide/vue";
import SectionHeader from "@/components/common/SectionHeader.vue";

defineProps<{
  addr: string;
  port: number;
  pass: string;
  isRunning: boolean;
  isStarting: boolean;
  isStopping: boolean;
}>();

const emit = defineEmits<{
  (e: "update:addr", value: string): void;
  (e: "update:port", value: number | null): void;
  (e: "update:pass", value: string): void;
  (e: "save"): void;
  (e: "start"): void;
  (e: "stop"): void;
  (e: "open-window"): void;
  (e: "open-browser"): void;
}>();
</script>

<style scoped>
.webui-section {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
}

.settings-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.setting-item-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-label {
  font-size: 13px;
  color: var(--app-text-color-2);
  white-space: nowrap;
}
</style>
