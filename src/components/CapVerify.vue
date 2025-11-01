<template>
  <div :id="containerId" :style="containerStyle" ref="containerRef" class="cap-container">
    <div v-show="isLoading && !error" class="cap-init-main">
      <div class="cap-init-loading">
        <svg xmlns="http://www.w3.org/2000/svg" width="48px" height="60px" viewBox="0 0 24 30"
          style="enable-background: new 0 0 50 50; width: 14px; height: 14px; vertical-align: middle">
          <rect x="0" y="9.22656" width="4" height="12.5469" fill="#CCCCCC">
            <animate attributeName="height" attributeType="XML" values="5;21;5" begin="0s" dur="0.6s"
              repeatCount="indefinite"></animate>
            <animate attributeName="y" attributeType="XML" values="13; 5; 13" begin="0s" dur="0.6s"
              repeatCount="indefinite"></animate>
          </rect>
          <rect x="10" y="5.22656" width="4" height="20.5469" fill="#CCCCCC">
            <animate attributeName="height" attributeType="XML" values="5;21;5" begin="0.15s" dur="0.6s"
              repeatCount="indefinite"></animate>
            <animate attributeName="y" attributeType="XML" values="13; 5; 13" begin="0.15s" dur="0.6s"
              repeatCount="indefinite"></animate>
          </rect>
          <rect x="20" y="8.77344" width="4" height="13.4531" fill="#CCCCCC">
            <animate attributeName="height" attributeType="XML" values="5;21;5" begin="0.3s" dur="0.6s"
              repeatCount="indefinite"></animate>
            <animate attributeName="y" attributeType="XML" values="13; 5; 13" begin="0.3s" dur="0.6s"
              repeatCount="indefinite"></animate>
          </rect>
        </svg>
        <span class="cap-text">验证码加载中...</span>
      </div>
    </div>
    
    <!-- 360浏览器挖矿保护提示 -->
    <div v-show="show360Warning" class="cap-360-warning">
      <div class="warning-content">
        <div class="warning-icon">⚠️</div>
        <div class="warning-text">
          <h4>检测到360浏览器挖矿保护</h4>
          <p>Cap.js验证码使用工作量证明（PoW）技术，可能被360浏览器的挖矿保护功能阻止。</p>
          <p>请按以下步骤操作：</p>
          <ol>
            <li>点击360浏览器地址栏右侧的"盾牌"图标</li>
            <li>选择"关闭挖矿保护"或"允许此网站"</li>
            <li>刷新页面重试验证</li>
          </ol>
        </div>
        <div class="warning-actions">
          <button @click="dismiss360Warning" class="warning-btn">我知道了</button>
          <button @click="retry" class="warning-btn primary">重试验证</button>
        </div>
      </div>
    </div>

    <!-- 错误显示 -->
    <div v-show="error && !show360Warning" class="cap-error">
      <span>验证码加载失败: {{ error }}</span>
      <button @click="retry" class="cap-retry-btn">重试</button>
    </div>
    
    <!-- Cap.js 容器占位 -->
    <div v-show="!isLoading && !error && !show360Warning" class="cap-widget-container"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, computed, watch, nextTick, ref, onErrorCaptured } from 'vue'
import { useCap } from '../types/useCap'

interface Props {
  siteId?: string
  workerCount?: number
  hiddenFieldName?: string
  width?: string
  height?: string
  i18n?: {
    verifyingLabel?: string;
    initialState?: string;
    solvedLabel?: string;
    errorLabel?: string;
    verifyAriaLabel?: string;
    verifyingAriaLabel?: string;
    verifiedAriaLabel?: string;
    errorAriaLabel?: string;
  }
}

interface Emits {
  (e: 'solve', token: string): void
  (e: 'error', error: string): void
  (e: 'ready'): void
}

const props = withDefaults(defineProps<Props>(), {
  siteId: '2bf50e050d',
  workerCount: 2,
  hiddenFieldName: 'cap-token',
  width: '230px',
  height: '60px',
  i18n: () => ({
    verifyingLabel: '正在验证...',
    initialState: '请完成验证',
    solvedLabel: '验证通过',
    errorLabel: '验证失败',
    verifyAriaLabel: '验证中',
    verifyingAriaLabel: '正在验证',
    verifiedAriaLabel: '验证通过',
    errorAriaLabel: '验证失败'
  })
})

const emit = defineEmits<Emits>()

// 添加容器引用和状态管理
const containerRef = ref<HTMLElement | null>(null)
const isComponentMounted = ref(false)
const isInitializing = ref(false)
const initializationAttempts = ref(0)
const maxInitializationAttempts = 3

// 360浏览器挖矿保护检测
const show360Warning = ref(false)
const has360Browser = ref(false)

// 检测360浏览器
const detect360Browser = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase()
  // 检测360浏览器特征
  return userAgent.includes('360') || 
         userAgent.includes('qihu') || 
         userAgent.includes('360se') ||
         userAgent.includes('360ee') ||
         // 检测360浏览器的特殊标识
         !!(window as any).chrome && !!(window as any).chrome.webstore && 
         userAgent.includes('chrome') && !userAgent.includes('edge') && !userAgent.includes('opr')
}

// 初始化360浏览器检测
const init360Detection = () => {
  has360Browser.value = detect360Browser()
  if (has360Browser.value) {
    console.log('检测到360浏览器，可能需要关闭挖矿保护')
  }
}

// 关闭360浏览器警告
const dismiss360Warning = () => {
  show360Warning.value = false
}

// 生成唯一的容器ID
const containerId = `cap-container-${Math.random().toString(36).substr(2, 9)}`

const containerStyle = computed(() => ({
  width: props.width || '100%',
  height: props.height,
  maxWidth: '100%'
}))

const capConfig = computed(() => ({
  apiEndpoint: `https://captcha.mefrp.com/${props.siteId}/`,
  siteId: props.siteId,
  workerCount: props.workerCount,
  hiddenFieldName: props.hiddenFieldName,
  i18n: props.i18n,
  // 添加主题样式配置
  theme: {
    primaryColor: 'var(--n-color-primary, #18a058)',
    backgroundColor: 'var(--n-color, var(--n-card-color, #ffffff))',
    borderColor: 'var(--n-border-color, #e0e0e6)',
    textColor: 'var(--n-text-color, #333639)',
    borderRadius: 'var(--n-border-radius, 6px)',
    fontFamily: 'var(--n-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)'
  }
}))

const { isLoading, isVerified, token, error, initCap, reset } = useCap(capConfig.value)

// 错误捕获
onErrorCaptured((err, _instance, info) => {
  console.error('CapVerify: Component error captured:', err, info)
  return false // 阻止错误继续传播
})

// 监听验证状态变化
let timers = {
  solve: null as number | null,
  error: null as number | null,
  ready: null as number | null
}

// 清理所有定时器的函数
const clearAllTimers = () => {
  Object.values(timers).forEach(timer => {
    if (timer) clearTimeout(timer)
  })
  timers = {
    solve: null,
    error: null,
    ready: null
  }
}

// 使用单个 watch 来处理所有状态变化
watch([isVerified, error, isLoading], ([verified, err, loading]) => {
  if (!isComponentMounted.value) return
  
  // 清理之前的定时器
  clearAllTimers()
  
  // 处理验证通过
  if (verified && token.value) {
    // 如果验证成功，隐藏360警告
    show360Warning.value = false
    timers.solve = setTimeout(() => {
      emit('solve', token.value!)
    }, 50) as unknown as number
  }
  
  // 处理错误
  if (err) {
    // 检测是否为360浏览器相关的挖矿保护错误
    const is360PoWError = has360Browser.value && (
      err.includes('failed') || 
      err.includes('timeout') || 
      err.includes('network') ||
      err.includes('blocked') ||
      err.includes('script')
    )
    
    if (is360PoWError) {
      show360Warning.value = true
    }
    
    timers.error = setTimeout(() => {
      emit('error', err)
    }, 50) as unknown as number
  }
  
  // 处理就绪状态
  if (!loading && !err && !verified) {
    timers.ready = setTimeout(() => {
      emit('ready')
    }, 50) as unknown as number
  }
}, { immediate: false, flush: 'post' })

// 安全的初始化函数
const safeInitCap = async () => {
  if (isInitializing.value || !isComponentMounted.value || initializationAttempts.value >= maxInitializationAttempts) {
    return
  }
  
  try {
    isInitializing.value = true
    initializationAttempts.value++
    
    // 多次等待确保DOM完全准备好
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const container = containerRef.value || document.getElementById(containerId)
    if (!container) {
      throw new Error('容器元素不存在')
    }
    
    // 确保容器在DOM中且可见
    if (!container.isConnected) {
      throw new Error('容器元素未连接到DOM')
    }
    
    await initCap(`#${containerId}`)
    
    // 初始化成功，重置尝试次数
    initializationAttempts.value = 0
  } catch (err) {
    console.error('CapVerify: Initialization failed:', err)
    
    // 如果达到最大尝试次数，等待更长时间再重试
    if (initializationAttempts.value >= maxInitializationAttempts) {
      setTimeout(() => {
        initializationAttempts.value = 0
      }, 5000)
    }
  } finally {
    isInitializing.value = false
  }
}

onMounted(async () => {
  isComponentMounted.value = true
  
  // 初始化360浏览器检测
  init360Detection()
  
  // 延迟初始化，确保父组件完全渲染
  setTimeout(async () => {
    if (isComponentMounted.value) {
      await safeInitCap()
    }
  }, 200)
})

onBeforeUnmount(() => {
  isComponentMounted.value = false
  
  // 清理所有定时器
  clearAllTimers()
  
  // 重置状态
  try {
    reset(true)
  } catch (err) {
    console.error('Error during reset:', err)
  }
})

const retry = async () => {
  if (!isComponentMounted.value) return
  
  console.log('Retrying Cap.js initialization...')
  // 隐藏360警告
  show360Warning.value = false
  // 重置尝试次数
  initializationAttempts.value = 0
  await safeInitCap()
}

// 软重置（保留验证结果）
const softReset = () => {
  reset(false)
}

// 强制重置（清除所有状态）
const forceReset = () => {
  reset(true)
}

// 暴露重置方法和调试方法
defineExpose({
  reset: softReset,
  forceReset,
  retry,
  // 调试方法
  getComponentState: () => ({
    isComponentMounted: isComponentMounted.value,
    isInitializing: isInitializing.value,
    initializationAttempts: initializationAttempts.value,
    containerId,
    containerExists: !!containerRef.value
  })
})
</script>

<style scoped>
.cap-container {
  position: relative;
  overflow: hidden;
  width: 100%;
  min-width: 200px;
  max-width: 100%;
  border: 1px solid var(--n-border-color, #e0e0e6);
  background-color: var(--n-color, var(--n-card-color, #ffffff));
  border-radius: var(--n-border-radius, 6px);
  transition: border-color 0.3s var(--n-bezier), background-color 0.3s var(--n-bezier);
  box-sizing: border-box;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .cap-container {
    min-width: 100%;
    font-size: 12px;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .cap-container {
    min-width: 280px;
  }
}

@media (min-width: 769px) {
  .cap-container {
    min-width: 230px;
  }
}

.cap-container:hover {
  border-color: var(--n-border-color-hover, #c2c2c4);
}

.cap-init-main {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: table;
  width: 100%;
  height: 100%;
  border-radius: var(--n-border-radius, 6px);
  align-items: center;
  justify-content: center;
  z-index: 1;
  background-color: var(--n-color, var(--n-card-color, #ffffff));
}

.cap-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background-color: var(--n-color-error-light, #fdf2f2);
  border: 1px solid var(--n-color-error, #d03050);
  border-radius: var(--n-border-radius, 6px);
  color: var(--n-color-error, #d03050);
  font-size: var(--n-font-size-small, 12px);
  font-family: var(--n-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  z-index: 2;
  transition: all 0.3s var(--n-bezier);
  box-sizing: border-box;
  flex-wrap: wrap;
  gap: 4px;
}

/* 响应式错误显示 */
@media (max-width: 480px) {
  .cap-error {
    padding: 6px;
    font-size: 11px;
    flex-direction: column;
    text-align: center;
  }
}

/* 360浏览器挖矿保护警告样式 */
.cap-360-warning {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background-color: var(--n-color-warning-light, #fefce8);
  border: 2px solid var(--n-color-warning, #f59e0b);
  border-radius: var(--n-border-radius, 6px);
  z-index: 3;
  overflow-y: auto;
  box-sizing: border-box;
}

.warning-content {
  max-width: 400px;
  width: 100%;
  text-align: left;
  font-family: var(--n-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
}

.warning-icon {
  font-size: 24px;
  text-align: center;
  margin-bottom: 8px;
}

.warning-text h4 {
  color: var(--n-color-warning, #f59e0b);
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  text-align: center;
}

.warning-text p {
  color: var(--n-text-color, #333639);
  font-size: 14px;
  line-height: 1.5;
  margin: 8px 0;
}

.warning-text ol {
  color: var(--n-text-color, #333639);
  font-size: 14px;
  line-height: 1.6;
  margin: 8px 0;
  padding-left: 20px;
}

.warning-text li {
  margin: 4px 0;
}

.warning-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.warning-btn {
  padding: 8px 16px;
  border: 1px solid var(--n-border-color, #e0e0e6);
  border-radius: var(--n-border-radius-small, 3px);
  background-color: var(--n-color, #ffffff);
  color: var(--n-text-color, #333639);
  font-size: 14px;
  font-family: var(--n-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  cursor: pointer;
  transition: all 0.3s var(--n-bezier);
}

.warning-btn:hover {
  background-color: var(--n-color-hover, #f5f5f5);
  border-color: var(--n-color-primary, #18a058);
}

.warning-btn.primary {
  background-color: var(--n-color-primary, #18a058);
  color: var(--n-text-color-primary, #ffffff);
  border-color: var(--n-color-primary, #18a058);
}

.warning-btn.primary:hover {
  background-color: var(--n-color-primary-hover, #36ad6a);
}

/* 360警告响应式设计 */
@media (max-width: 480px) {
  .cap-360-warning {
    padding: 8px;
  }
  
  .warning-content {
    max-width: 100%;
  }
  
  .warning-text h4 {
    font-size: 14px;
  }
  
  .warning-text p,
  .warning-text ol {
    font-size: 12px;
  }
  
  .warning-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .warning-btn {
    width: 100%;
    padding: 10px;
  }
}

.cap-widget-container {
  z-index: 0;
  width: 100%;
  height: 100%;
}

.cap-init-loading {
  display: table-cell;
  vertical-align: middle;
  text-align: center;
  width: 100%;
}

.cap-init-loading > svg {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: none;
  color: var(--n-loading-color, var(--n-color-primary, #18a058));
  animation: spin 1s linear infinite;
}

/* 响应式 loading 样式 */
@media (max-width: 480px) {
  .cap-init-loading > svg {
    width: 16px;
    height: 16px;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cap-text {
  font-family: var(--n-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  font-size: var(--n-font-size-small, 12px);
  color: var(--n-text-color-disabled, #c2c2c4);
  vertical-align: middle;
  margin-left: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 响应式文本样式 */
@media (max-width: 480px) {
  .cap-text {
    font-size: 11px;
    margin-left: 6px;
  }
}

.cap-retry-btn {
  margin-left: 8px;
  padding: 4px 12px;
  background-color: var(--n-color-primary, #18a058);
  color: var(--n-text-color-primary, #ffffff);
  border: none;
  border-radius: var(--n-border-radius-small, 3px);
  cursor: pointer;
  font-size: var(--n-font-size-tiny, 11px);
  font-family: var(--n-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  transition: background-color 0.3s var(--n-bezier);
  font-weight: var(--n-font-weight-strong, 500);
  white-space: nowrap;
}

/* 响应式按钮样式 */
@media (max-width: 480px) {
  .cap-retry-btn {
    margin-left: 6px;
    padding: 3px 8px;
    font-size: 10px;
  }
}

.cap-retry-btn:hover {
  background-color: var(--n-color-primary-hover, #36ad6a);
}

.cap-retry-btn:active {
  background-color: var(--n-color-primary-pressed, #0c7a43);
}

.cap-retry-btn:focus {
  outline: 2px solid var(--n-color-primary-suppl, #36ad6a);
  outline-offset: 2px;
}

/* Cap.js Widget 主题样式 */
:deep(.cap-widget) {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 200px !important;
  border: 1px solid var(--n-border-color, #e0e0e6) !important;
  border-radius: var(--n-border-radius, 6px) !important;
  background-color: var(--n-color, var(--n-card-color, #ffffff)) !important;
  font-family: var(--n-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif) !important;
  transition: border-color 0.3s var(--n-bezier) !important;
  box-sizing: border-box !important;
}

/* Cap.js Widget 内部元素 100% 宽度 */
:deep(.cap-widget *) {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

:deep(.cap-widget > *) {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

:deep(.cap-widget .cap-container) {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

:deep(.cap-widget .cap-content) {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

:deep(.cap-widget .cap-form) {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

:deep(.cap-widget .cap-input) {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

:deep(.cap-widget .cap-challenge-container) {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

/* 确保所有可能的内部元素都具有 100% 宽度 */
:deep(.cap-widget input),
:deep(.cap-widget div),
:deep(.cap-widget span),
:deep(.cap-widget p),
:deep(.cap-widget form),
:deep(.cap-widget section),
:deep(.cap-widget article),
:deep(.cap-widget .cap-wrapper),
:deep(.cap-widget .cap-body),
:deep(.cap-widget .cap-main),
:deep(.cap-widget .cap-inner),
:deep(.cap-widget .cap-canvas),
:deep(.cap-widget .cap-image) {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

/* 特殊处理可能的图片和画布元素 */
:deep(.cap-widget img),
:deep(.cap-widget canvas) {
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  box-sizing: border-box !important;
}

/* 处理可能的列表和表格元素 */
:deep(.cap-widget ul),
:deep(.cap-widget ol),
:deep(.cap-widget li),
:deep(.cap-widget table),
:deep(.cap-widget tr),
:deep(.cap-widget td),
:deep(.cap-widget th) {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

/* Cap.js Widget 响应式设计 */
@media (max-width: 480px) {
  :deep(.cap-widget) {
    min-width: 100% !important;
    font-size: 12px !important;
  }
  
  :deep(.cap-widget .cap-text) {
    font-size: 12px !important;
  }
  
  :deep(.cap-widget .cap-button) {
    padding: 6px 12px !important;
    font-size: 12px !important;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  :deep(.cap-widget) {
    min-width: 280px !important;
  }
  
  :deep(.cap-widget .cap-text) {
    font-size: 13px !important;
  }
}

@media (min-width: 769px) {
  :deep(.cap-widget) {
    min-width: 230px !important;
  }
}

:deep(.cap-widget:hover) {
  border-color: var(--n-border-color-hover, #c2c2c4) !important;
}

:deep(.cap-widget .cap-checkbox) {
  background-color: var(--n-color, #ffffff) !important;
  border: 2px solid var(--n-border-color, #e0e0e6) !important;
  border-radius: var(--n-border-radius-small, 3px) !important;
}

:deep(.cap-widget .cap-checkbox:checked) {
  background-color: var(--n-color-primary, #18a058) !important;
  border-color: var(--n-color-primary, #18a058) !important;
}

:deep(.cap-widget .cap-text) {
  color: var(--n-text-color, #333639) !important;
  font-size: var(--n-font-size, 14px) !important;
  font-family: var(--n-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif) !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

:deep(.cap-widget .cap-logo) {
  filter: var(--n-logo-filter, none);
}

:deep(.cap-widget .cap-button) {
  background-color: var(--n-color-primary, #18a058) !important;
  color: var(--n-text-color-primary, #ffffff) !important;
  border: none !important;
  border-radius: var(--n-border-radius-small, 3px) !important;
  font-family: var(--n-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif) !important;
  font-weight: var(--n-font-weight-strong, 500) !important;
  transition: background-color 0.3s var(--n-bezier) !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

:deep(.cap-widget .cap-button:hover) {
  background-color: var(--n-color-primary-hover, #36ad6a) !important;
}

:deep(.cap-widget .cap-button:active) {
  background-color: var(--n-color-primary-pressed, #0c7a43) !important;
}

:deep(.cap-widget .cap-loading) {
  color: var(--n-color-primary, #18a058) !important;
}

:deep(.cap-widget .cap-error-text) {
  color: var(--n-color-error, #d03050) !important;
  font-size: var(--n-font-size-small, 12px) !important;
  font-family: var(--n-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif) !important;
}

:deep(.cap-widget .cap-success-text) {
  color: var(--n-color-success, #18a058) !important;
  font-size: var(--n-font-size-small, 12px) !important;
  font-family: var(--n-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif) !important;
}

/* 暗色主题适配 */
:deep(.cap-widget[data-theme="dark"]) {
  background-color: var(--n-color-modal, var(--n-card-color-modal, #232326)) !important;
  border-color: var(--n-border-color, #3e3e42) !important;
}

:deep(.cap-widget[data-theme="dark"] .cap-text) {
  color: var(--n-text-color, #ffffffd1) !important;
}

:deep(.cap-widget[data-theme="dark"] .cap-checkbox) {
  background-color: var(--n-color-modal, var(--n-card-color-modal, #232326)) !important;
  border-color: var(--n-border-color, #3e3e42) !important;
}

/* 自动适应系统主题 */
@media (prefers-color-scheme: dark) {
  .cap-container {
    background-color: var(--n-color, var(--n-card-color, var(--n-body-color, #101014))) !important;
    border-color: var(--n-border-color, #3e3e42) !important;
  }

  .cap-init-main {
    background-color: var(--n-color, var(--n-card-color, var(--n-body-color, #101014))) !important;
  }

  :deep(.cap-widget) {
    background-color: var(--n-color, var(--n-card-color, var(--n-body-color, #101014))) !important;
    border-color: var(--n-border-color, #3e3e42) !important;
  }
}

/* Cap.js 内部可能的 captcha 相关元素自适应 */
:deep(.captcha),
:deep(.cap-captcha),
:deep(.cap-challenge),
:deep([class*="captcha"]) {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

:deep(.captcha > *),
:deep(.cap-captcha > *),
:deep(.cap-challenge > *),
:deep([class*="captcha"] > *) {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

/* 针对可能的 iframe 或嵌入式内容 */
:deep(.cap-widget iframe),
:deep(.captcha iframe),
:deep([class*="captcha"] iframe) {
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  border: none !important;
}

/* 针对可能的画布元素 */
:deep(.cap-widget canvas),
:deep(.captcha canvas),
:deep([class*="captcha"] canvas) {
  max-width: 100% !important;
  height: auto !important;
}
</style>
