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
          <!-- 启动提示 - 永久显示在日志内容顶部 -->
          <div>
            <span>正在尝试启动隧道...</span>
          </div>
          <!-- 日志内容 -->
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
    
    // 清理日志中的 ANSI 转义序列和特殊字符
    const cleanLogs = props.logs.map(log => 
      log.replace(/\x1b\[[0-9;]*m/g, '').replace(/▣/g, '')
    ).join('\n')
    
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

// 启动自动刷新日志
const startAutoRefresh = () => {
  // 清除已存在的定时器
  stopAutoRefresh()

  if (props.tunnelId !== null && props.show) {
    autoRefreshTimer.value = window.setInterval(() => {
      if (props.tunnelId !== null && props.show) {
        // 检查是否在底部
        const wasAtBottom = isScrolledToBottom()

        // 发出刷新事件
        emit('refresh', props.tunnelId)

        // 如果之前在底部，自动滚动到底部
        if (wasAtBottom) {
          nextTick(() => {
            scrollToBottom()
          })
        }
      }
    }, 300) // 每300ms刷新一次
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

// 为日志添加颜色
const colorizeLog = (log: string): string => {
  // 清理 ANSI 转义序列
  let cleanLog = log.replace(/\x1b\[[0-9;]*m/g, '').replace(/▣/g, '')

  // 时间戳 - 灰色
  cleanLog = cleanLog.replace(
    /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?)/g,
    '<span style="color: #888;">$1</span>'
  )

  // 日志级别 [I] - 蓝色
  cleanLog = cleanLog.replace(
    /\[I\]/g,
    '<span style="color: #42a5f5;">[I]</span>'
  )

  // 日志级别 [W] - 黄色
  cleanLog = cleanLog.replace(
    /\[W\]/g,
    '<span style="color: #ffc107;">[W]</span>'
  )

  // 日志级别 [E] - 红色
  cleanLog = cleanLog.replace(
    /\[E\]/g,
    '<span style="color: #ff6b6b;">[E]</span>'
  )

  // 文件路径 [xxx.go:123] - 绿色（先处理，避免被后续规则匹配）
  cleanLog = cleanLog.replace(
    /(\[[^\]]+\.go:\d+\])/g,
    '<span style="color: #7cb342;">$1</span>'
  )

  // HTTP/HTTPS URL - 红色加粗（在处理 IP 和域名之前）
  cleanLog = cleanLog.replace(
    /\b(https?:\/\/[a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)+(?::\d+)?(?:\/[^\s\]]*)?)\b/g,
    '<span style="color: #ff6b6b; font-weight: 600;">$1</span>'
  )

  // IP地址:端口 - 红色加粗
  cleanLog = cleanLog.replace(
    /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+)\b/g,
    '<span style="color: #ff6b6b; font-weight: 600;">$1</span>'
  )

  // 域名:端口 - 红色加粗（排除 .go: 文件路径）
  cleanLog = cleanLog.replace(
    /\b([a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)+:\d+)\b(?!\.go)/g,
    (match) => {
      // 额外检查：如果匹配项以 .go: 结尾，则不高亮
      if (/\.go:\d+$/.test(match)) {
        return match
      }
      return `<span style="color: #ff6b6b; font-weight: 600;">${match}</span>`
    }
  )

  // 访问密钥（32位十六进制字符串）- 红色加粗
  cleanLog = cleanLog.replace(
    /\b([0-9a-f]{32})\b/gi,
    '<span style="color: #ff6b6b; font-weight: 600;">$1</span>'
  )

  return cleanLog
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
}, { deep: true })

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
