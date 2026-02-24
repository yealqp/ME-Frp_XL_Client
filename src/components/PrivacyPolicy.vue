<template>
  <div class="privacy-policy">
    <n-card :bordered="true" class="privacy-card">
      <template #header>
        <div class="header-content">
          <div class="title-section">
            <Shield :size="24" class="header-icon" />
            <h1 class="page-title">隐私政策</h1>
          </div>
          <n-button @click="goBack" quaternary circle>
            <template #icon>
              <ArrowLeft :size="20" />
            </template>
          </n-button>
        </div>
      </template>

      <div v-if="loading" class="loading-container">
        <n-spin size="large" />
        <p class="loading-text">正在加载隐私政策...</p>
      </div>

      <div v-else-if="error" class="error-container">
        <n-result status="error" title="加载失败" :description="error">
          <template #footer>
            <n-button @click="loadPrivacyPolicy" type="primary">
              重新加载
            </n-button>
          </template>
        </n-result>
      </div>

      <div v-else class="markdown-content privacy-content content-fade-in" v-html="parsedContent"></div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { invoke } from '@tauri-apps/api/core';
import { useMessage, NCard, NSpin, NResult, NButton } from 'naive-ui';
import { Shield, ArrowLeft } from 'lucide-vue-next';
import { parseMarkdown } from '@/utils/markdownParser';

const router = useRouter();
const message = useMessage();

const loading = ref(true);
const error = ref('');
const parsedContent = ref('');

const goBack = () => {
  router.back();
};

const loadPrivacyPolicy = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const markdownText = await invoke<string>('fetch_privacy_policy');
    parsedContent.value = parseMarkdown(markdownText);
  } catch (err) {
    console.error('加载隐私政策失败:', err);
    error.value = err instanceof Error ? err.message : typeof err === 'string' ? err : '加载失败，请检查网络连接';
    message.error('加载隐私政策失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadPrivacyPolicy();
});
</script>

<style scoped>
.privacy-policy {
  padding: 0;
  max-width: 1000px;
  margin: 0 auto;
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.privacy-card {
  background: #18181c;
  border: 1px solid #29292c;
  min-height: calc(100vh - 60px);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  color: #349ff4;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 20px;
}

.loading-text {
  color: #a0a0a0;
  font-size: 14px;
  margin: 0;
}

.error-container {
  padding: 40px 20px;
}

.privacy-content {
  padding: 20px 0;
  line-height: 1.8;
  font-size: 15px;
  color: #d0d0d0;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.content-fade-in {
  animation: contentFadeIn 0.5s ease-out;
}

@keyframes contentFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Markdown 样式 - 复用 About.vue 的样式 */
.privacy-content :deep(h1),
.privacy-content :deep(h2),
.privacy-content :deep(h3),
.privacy-content :deep(h4),
.privacy-content :deep(h5),
.privacy-content :deep(h6) {
  margin: 24px 0 16px 0;
  font-weight: 600;
  line-height: 1.4;
  color: #ffffff;
}

.privacy-content :deep(h1) {
  font-size: 28px;
  border-bottom: 2px solid rgba(52, 159, 244, 0.3);
  padding-bottom: 12px;
  margin-top: 0;
}

.privacy-content :deep(h2) {
  font-size: 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 8px;
}

.privacy-content :deep(h3) {
  font-size: 18px;
}

.privacy-content :deep(h4) {
  font-size: 16px;
}

.privacy-content :deep(p) {
  margin: 12px 0;
  line-height: 1.8;
  color: #d0d0d0;
}

.privacy-content :deep(ul),
.privacy-content :deep(ol) {
  margin: 16px 0;
  padding-left: 28px;
}

.privacy-content :deep(li) {
  margin: 8px 0;
  line-height: 1.8;
  padding-left: 8px;
  color: #d0d0d0;
}

.privacy-content :deep(ul li) {
  list-style-type: disc;
}

.privacy-content :deep(ul li::marker) {
  color: #4da8f5;
}

.privacy-content :deep(ol li) {
  list-style-type: decimal;
}

.privacy-content :deep(ol li::marker) {
  font-weight: 600;
  color: #4da8f5;
}

.privacy-content :deep(code.inline-code) {
  background: rgba(0, 0, 0, 0.3);
  color: #ff6b6b;
  padding: 3px 8px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.privacy-content :deep(pre) {
  background: rgba(0, 0, 0, 0.3);
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 16px 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.privacy-content :deep(pre code) {
  background: transparent;
  padding: 0;
  border: none;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #d0d0d0;
}

.privacy-content :deep(blockquote.custom-blockquote) {
  border-left: 4px solid #4da8f5;
  margin: 16px 0;
  padding: 12px 16px;
  background: rgba(52, 159, 244, 0.1);
  border-radius: 0 4px 4px 0;
}

.privacy-content :deep(blockquote.custom-blockquote p) {
  margin: 4px 0;
  color: #e0e0e0;
}

.privacy-content :deep(a) {
  color: #4da8f5;
  text-decoration: none;
  transition: color 0.2s;
  font-weight: 500;
  position: relative;
}

.privacy-content :deep(a::after) {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 0;
  height: 1px;
  background-color: #6bb8f7;
  transition: width 0.3s ease;
}

.privacy-content :deep(a:hover) {
  color: #6bb8f7;
}

.privacy-content :deep(a:hover::after) {
  width: 100%;
}

.privacy-content :deep(strong) {
  font-weight: 600;
  color: #ffffff;
}

.privacy-content :deep(em) {
  font-style: italic;
}

.privacy-content :deep(del) {
  text-decoration: line-through;
  opacity: 0.7;
}

.privacy-content :deep(hr) {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin: 24px 0;
}

.privacy-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.privacy-content :deep(th),
.privacy-content :deep(td) {
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: left;
}

.privacy-content :deep(th) {
  background: rgba(52, 159, 244, 0.1);
  font-weight: 600;
  color: #ffffff;
}

.privacy-content :deep(td) {
  color: #d0d0d0;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 20px;
  }

  .privacy-content {
    font-size: 14px;
  }

  .privacy-content :deep(h1) {
    font-size: 24px;
  }

  .privacy-content :deep(h2) {
    font-size: 20px;
  }

  .privacy-content :deep(h3) {
    font-size: 16px;
  }
}
</style>
