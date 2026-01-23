<template>
  <div class="simple-captcha-wrapper">
    <!-- 加载状态 -->
    <div v-show="isLoading && !error" class="captcha-loading">
      <div class="loading-spinner">
        <svg xmlns="http://www.w3.org/2000/svg" width="48px" height="60px" viewBox="0 0 24 30">
          <rect x="0" y="9.22656" width="4" height="12.5469" fill="#349ff4">
            <animate attributeName="height" attributeType="XML" values="5;21;5" begin="0s" dur="0.6s"
              repeatCount="indefinite"></animate>
            <animate attributeName="y" attributeType="XML" values="13; 5; 13" begin="0s" dur="0.6s"
              repeatCount="indefinite"></animate>
          </rect>
          <rect x="10" y="5.22656" width="4" height="20.5469" fill="#349ff4">
            <animate attributeName="height" attributeType="XML" values="5;21;5" begin="0.15s" dur="0.6s"
              repeatCount="indefinite"></animate>
            <animate attributeName="y" attributeType="XML" values="13; 5; 13" begin="0.15s" dur="0.6s"
              repeatCount="indefinite"></animate>
          </rect>
          <rect x="20" y="8.77344" width="4" height="13.4531" fill="#349ff4">
            <animate attributeName="height" attributeType="XML" values="5;21;5" begin="0.3s" dur="0.6s"
              repeatCount="indefinite"></animate>
            <animate attributeName="y" attributeType="XML" values="13; 5; 13" begin="0.3s" dur="0.6s"
              repeatCount="indefinite"></animate>
          </rect>
        </svg>
        <span class="loading-text">验证码加载中...</span>
      </div>
    </div>

    <!-- 错误显示 -->
    <div v-show="error" class="captcha-error">
      <span>{{ error }}</span>
      <button @click="retry" class="retry-btn">重试</button>
    </div>

    <!-- Cap.js 容器 -->
    <div v-show="!isLoading && !error" :id="containerId" class="captcha-container"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useCap } from '../types/useCap'

interface Props {
  siteId?: string
  workerCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  siteId: '2bf50e050d',
  workerCount: 2
})

const emit = defineEmits<{
  solve: [token: string]
  error: [error: string]
  ready: []
}>()

const containerId = `captcha-${Math.random().toString(36).substring(2, 9)}`

const capConfig = computed(() => ({
  apiEndpoint: `https://captcha.mefrp.com/${props.siteId}/`,
  siteId: props.siteId,
  workerCount: props.workerCount,
  hiddenFieldName: 'cap-token',
  i18n: {
    verifyingLabel: '正在验证...',
    initialState: '请完成验证',
    solvedLabel: '验证通过',
    errorLabel: '验证失败'
  }
}))

const { isLoading, isVerified, token, error, initCap, reset } = useCap(capConfig.value)

// 注入暗色主题样式到 shadow DOM
const injectShadowStyles = () => {
  const capWidget = document.querySelector(`#${containerId} cap-widget`)
  if (capWidget && capWidget.shadowRoot) {
    // 检查是否已经注入过样式
    const existingStyle = capWidget.shadowRoot.querySelector('style[data-custom-theme]')
    if (existingStyle) {
      return // 已经注入过，不重复注入
    }
    
    const style = document.createElement('style')
    style.setAttribute('data-custom-theme', 'dark')
    style.textContent = `
      /* 全局样式 - 移除圆角 */
      * {
        border-radius: 0 !important;
      }
      
      /* 容器背景和边框 - 降低黑度 */
      div {
        background-color: #242428 !important;
        color: #ffffffd1 !important;
        border-color: #3e3e42 !important;
      }
      
      /* 按钮样式 */
      button {
        background-color: #349ff4 !important;
        color: #ffffff !important;
        border: none !important;
        border-radius: 0 !important;
      }
      
      button:hover {
        background-color: #4da8f5 !important;
      }
      
      button:active {
        background-color: #2891f3 !important;
      }
      
      /* 复选框样式 */
      input[type="checkbox"] {
        background-color: #38383c !important;
        border: 1px solid #3e3e42 !important;
        border-radius: 0 !important;
      }
      
      input[type="checkbox"]:checked {
        background-color: #349ff4 !important;
        border-color: #349ff4 !important;
      }
      
      /* 文本颜色 */
      label, span, p {
        color: #ffffffd1 !important;
      }
      
      /* Cap.js 特定类 */
      .cap-container, .cap-wrapper, .cap-main, .captcha {
        background-color: #242428 !important;
        border: 1px solid #3e3e42 !important;
        border-radius: 0 !important;
      }
      
      .cap-checkbox, .checkbox {
        background-color: #38383c !important;
        border: 1px solid #3e3e42 !important;
        border-radius: 0 !important;
      }
      
      /* 验证中状态 - 隐藏方框背景 */
      .captcha[data-state="verifying"] .checkbox {
        background-color: transparent !important;
        border: none !important;
      }
      
      .cap-checkbox:checked {
        background-color: #349ff4 !important;
        border-color: #349ff4 !important;
      }
      
      .cap-button {
        background-color: #349ff4 !important;
        color: #ffffff !important;
        border: none !important;
        border-radius: 0 !important;
      }
      
      .cap-button:hover {
        background-color: #4da8f5 !important;
      }
      
      .cap-text, .cap-label {
        color: #ffffffd1 !important;
      }
      
      .cap-loading {
        color: #349ff4 !important;
      }
      
      /* SVG 进度环样式 - 已加载绿色，未加载暗色 */
      .progress-ring-bg {
        stroke: #2a2a2e !important;
      }
      
      .progress-ring-circle {
        stroke: #4caf50 !important;
      }
      
      /* 加载动画/旋转器 */
      .spinner, .loader, [class*="spin"], [class*="load"] {
        border-color: #3e3e42 !important;
        border-top-color: #349ff4 !important;
      }
      
      /* SVG 图标颜色 */
      svg {
        fill: #ffffffd1 !important;
      }
      
      svg path {
        fill: #ffffffd1 !important;
      }
      
      /* 边框统一 */
      [class*="border"], [style*="border"] {
        border-color: #3e3e42 !important;
      }
      
      /* 确保所有 cap 相关类都应用暗色主题 */
      [class*="cap-"] {
        border-radius: 0 !important;
        border-color: #3e3e42 !important;
      }
      
      /* 输入框样式 */
      input, textarea {
        background-color: #38383c !important;
        color: #ffffffd1 !important;
        border: 1px solid #3e3e42 !important;
        border-radius: 0 !important;
      }
      
      input:focus, textarea:focus {
        border-color: #349ff4 !important;
        outline: none !important;
      }
      
      /* 禁用状态 */
      *:disabled {
        opacity: 0.5 !important;
        cursor: not-allowed !important;
      }
    `
    capWidget.shadowRoot.appendChild(style)
    console.log('暗色主题样式已注入到 shadow DOM')
  }
}

// 使用 MutationObserver 监听 shadow DOM 的变化，立即注入样式
const observeShadowDOM = () => {
  const container = document.querySelector(`#${containerId}`)
  if (!container) return
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement && node.tagName === 'CAP-WIDGET') {
          // 发现 cap-widget 元素，立即注入样式
          setTimeout(() => injectShadowStyles(), 50)
          setTimeout(() => injectShadowStyles(), 200)
        }
      })
    })
  })
  
  observer.observe(container, {
    childList: true,
    subtree: true
  })
  
  return observer
}

// 监听验证状态变化
let lastToken = ''
let shadowObserver: MutationObserver | null | undefined = null

const checkVerification = setInterval(() => {
  if (isVerified.value && token.value && token.value !== lastToken) {
    lastToken = token.value
    emit('solve', token.value)
  }
  
  if (error.value) {
    emit('error', error.value)
  }
  
  if (!isLoading.value && !error.value && !isVerified.value) {
    emit('ready')
    // 尝试注入样式
    injectShadowStyles()
  }
}, 100)

onMounted(async () => {
  // 立即开始监听 shadow DOM
  shadowObserver = observeShadowDOM()
  
  // 延迟初始化，确保 DOM 准备好
  setTimeout(async () => {
    await initCap(`#${containerId}`)
    // 初始化后立即尝试注入样式
    setTimeout(() => injectShadowStyles(), 100)
    setTimeout(() => injectShadowStyles(), 300)
    setTimeout(() => injectShadowStyles(), 600)
  }, 200)
})

// 重试
const retry = async () => {
  await initCap(`#${containerId}`)
  // 重试后也注入样式
  setTimeout(() => injectShadowStyles(), 100)
  setTimeout(() => injectShadowStyles(), 300)
  setTimeout(() => injectShadowStyles(), 600)
}

// 清理定时器和观察器
import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => {
  clearInterval(checkVerification)
  if (shadowObserver) {
    shadowObserver.disconnect()
  }
})

// 暴露方法
defineExpose({
  reset
})
</script>

<style scoped>
.simple-captcha-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px 0;
  min-height: 80px;
}

.captcha-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 20px;
}

.loading-spinner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.loading-spinner svg {
  width: 18px;
  height: 18px;
}

.loading-text {
  font-size: 14px;
  color: #999;
}

.captcha-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: rgba(208, 48, 80, 0.1);
  border: 1px solid #d03050;
  border-radius: 0;
  color: #d03050;
  font-size: 14px;
}

.retry-btn {
  padding: 4px 12px;
  background-color: #349ff4;
  color: #ffffff;
  border: none;
  border-radius: 0;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.retry-btn:hover {
  background-color: #4da8f5;
}

.retry-btn:active {
  background-color: #2891f3;
}

.captcha-container {
  width: fit-content;
  max-width: 320px;
  margin: 0 auto;
}
</style>
