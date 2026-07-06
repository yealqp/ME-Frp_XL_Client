import { ref, type Ref } from 'vue'
import type { MessageApiInjection } from 'naive-ui/es/message/src/MessageProvider'
import { invoke } from '@tauri-apps/api/core'

export function useAIAnalysis(
  logsSource: Ref<string[]> | { value: string[] },
  message: MessageApiInjection,
  tunnelName?: Ref<string | undefined> | string,
  tunnelType?: Ref<string | undefined> | string,
) {
  const aiAnalyzing = ref(false)
  const analysisResult = ref('')
  const showAnalysisModal = ref(false)

  function resolveRef<T>(source: Ref<T> | T | undefined): T | undefined {
    if (source === undefined) return undefined;
    return (source as Ref<T>).value !== undefined ? (source as Ref<T>).value : source as T;
  }

  async function handleAIAnalyze() {
    const logs = logsSource.value
    if (!logs || logs.length === 0) {
      message.warning('暂无日志内容，无法分析')
      return
    }

    aiAnalyzing.value = true
    try {
      message.info('正在分析日志，请稍候...', { duration: 5000 })
      const logText = logs.join('\n')
      const name = resolveRef(tunnelName) || null
      const tp = resolveRef(tunnelType) || null
      const result = await invoke<string>('api_analyze_log', {
        logContent: logText,
        customPrompt: null,
        tunnelName: name,
        tunnelType: tp,
      })
      analysisResult.value = result
      showAnalysisModal.value = true
    } catch (error) {
      console.error('AI 分析失败:', error)
      message.error(error instanceof Error ? error.message : 'AI 分析失败')
    } finally {
      aiAnalyzing.value = false
    }
  }

  return {
    aiAnalyzing,
    analysisResult,
    showAnalysisModal,
    handleAIAnalyze,
  }
}
