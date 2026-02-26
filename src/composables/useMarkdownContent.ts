import { ref } from 'vue';
import { useMessage } from 'naive-ui';
import { invoke } from '@tauri-apps/api/core';
import { parseMarkdown } from '@/utils/markdownParser';

export interface MarkdownContentOptions {
  fetchCommand: string;
  errorMessage?: string;
}

export function useMarkdownContent(options: MarkdownContentOptions) {
  const message = useMessage();
  const loading = ref(true);
  const error = ref('');
  const parsedContent = ref('');

  const loadContent = async () => {
    loading.value = true;
    error.value = '';
    
    try {
      const markdownText = await invoke<string>(options.fetchCommand);
      parsedContent.value = parseMarkdown(markdownText);
    } catch (err) {
      console.error(`加载内容失败:`, err);
      error.value = err instanceof Error 
        ? err.message 
        : typeof err === 'string' 
        ? err 
        : '加载失败，请检查网络连接';
      message.error(options.errorMessage || '加载内容失败');
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    parsedContent,
    loadContent,
  };
}
