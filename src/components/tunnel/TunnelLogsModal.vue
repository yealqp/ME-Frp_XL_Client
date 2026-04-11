<template>
  <n-modal
    v-model:show="localShow"
    preset="card"
    title="隧道日志"
    style="width: 80%; max-width: 800px"
    @after-leave="handleAfterLeave"
    :auto-focus="false"
    :trap-focus="false"
  >
    <div class="log-container">
      <div class="log-header">
        <span>隧道 ID: {{ tunnelId }}</span>
        <n-space :size="8">
          <n-tag type="error">如果您截图分享此页面请打码红色字体内容</n-tag>
          <n-button
            size="small"
            @click="handleCopyLogs"
            :autofocus="false"
          >
            <template #icon>
              <Copy :size="14" />
            </template>
            复制日志
          </n-button>
          <n-button
            size="small"
            @click="handleRefresh"
            :loading="loading"
            :autofocus="false"
          >
            刷新日志
          </n-button>
        </n-space>
      </div>
      <div class="log-content">
        <div class="log-lines" ref="logLinesRef">
          <div
            v-for="(log, index) in logs"
            :key="index"
            class="log-line"
            v-html="colorizeLog(log)"
          ></div>
        </div>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useMessage } from 'naive-ui'
import { Copy } from 'lucide-vue-next'
import { formatLogHtml, getSanitizedLogsText } from '@/utils/logSanitizer'

interface TunnelLogsModalProps {
  show: boolean
  tunnelId: number | null
  logs: string[]
  loading: boolean
}

interface TunnelLogsModalEmits {
  (e: 'update:show', value: boolean): void
  (e: 'refresh', tunnelId: number): void
}

const props = defineProps<TunnelLogsModalProps>()
const emit = defineEmits<TunnelLogsModalEmits>()
const message = useMessage()

// Local state
const logLinesRef = ref<HTMLElement | null>(null)
const autoRefreshTimer = ref<number | null>(null)

// Computed v-model
const localShow = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

// 复制日志
const handleCopyLogs = async () => {
  try {
    if (props.logs.length === 0) {
      message.warning('暂无日志内容')
      return
    }
    
    const cleanLogs = getSanitizedLogsText(props.logs)
    
    await navigator.clipboard.writeText(cleanLogs)
    message.success('日志已复制到剪贴板')
  } catch (error) {
    console.error('复制日志失败:', error)
    message.error('复制日志失败')
  }
}

// 刷新日志
const handleRefresh = () => {
  if (props.tunnelId !== null) {
    emit('refresh', props.tunnelId)
  }
}

// 检查是否滚动到底部
const isScrolledToBottom = (): boolean => {
  if (!logLinesRef.value) return true
  const element = logLinesRef.value
  return element.scrollHeight - element.scrollTop - element.clientHeight < 50
}

// 滚动到底部
const scrollToBottom = () => {
  if (logLinesRef.value) {
    logLinesRef.value.scrollTop = logLinesRef.value.scrollHeight
  }
}

const AUTO_REFRESH_INTERVAL = 1000;

const startAutoRefresh = () => {
  stopAutoRefresh()

  if (props.tunnelId !== null && props.show) {
    autoRefreshTimer.value = window.setInterval(() => {
      if (props.tunnelId !== null && props.show) {
        if (props.loading) {
          return
        }

        const wasAtBottom = isScrolledToBottom()

        emit('refresh', props.tunnelId)

        if (wasAtBottom) {
          nextTick(() => {
            scrollToBottom()
          })
        }
      }
    }, AUTO_REFRESH_INTERVAL)
  }
}

// 停止自动刷新日志
const stopAutoRefresh = () => {
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value)
    autoRefreshTimer.value = null
  }
}

// 模态框关闭后的处理
const handleAfterLeave = () => {
  stopAutoRefresh()
}

const colorizeLog = (log: string): string => {
  return formatLogHtml(log, 'line')
}

// 监听 show 变化，启动或停止自动刷新
watch(() => props.show, (newValue) => {
  if (newValue && props.tunnelId !== null) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})

// 监听 logs 变化，智能滚动
watch(() => props.logs, () => {
  const wasAtBottom = isScrolledToBottom()
  if (wasAtBottom) {
    nextTick(() => {
      scrollToBottom()
    })
  }
})

// 组件卸载时清理定时器
onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.log-container {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--n-border-color);
  margin-bottom: 12px;
}

.log-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.log-lines {
  flex: 1;
  overflow-y: auto;
  background: var(--n-color-embedded);
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
}

.log-line {
  margin-bottom: 4px;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.log-line:last-child {
  margin-bottom: 0;
}
</style>
