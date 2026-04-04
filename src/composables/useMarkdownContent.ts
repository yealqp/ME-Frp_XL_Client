import { ref } from 'vue';
import { useMessage } from 'naive-ui';
import { extractErrorMessage } from '@/utils/errorHandler';
import { parseMarkdown } from '@/utils/markdownParser';
import { invokeTauriText } from '@/utils/tauriResponse';

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
      const markdownText = await invokeTauriText(options.fetchCommand);
      parsedContent.value = parseMarkdown(markdownText);
    } catch (err) {
      console.error(`加载内容失败:`, err);
      error.value = extractErrorMessage(err, '加载失败，请检查网络连接');
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
