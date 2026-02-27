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

      <div v-if="error" class="error-container">
        <n-result status="error" title="加载失败" :description="error">
          <template #footer>
            <n-button @click="loadContent" type="primary">
              重新加载
            </n-button>
          </template>
        </n-result>
      </div>

      <div v-else class="markdown-content content-fade-in" v-html="parsedContent"></div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NCard, NResult, NButton } from 'naive-ui';
import { Shield, ArrowLeft } from 'lucide-vue-next';
import { useMarkdownContent } from '@/composables/useMarkdownContent';

const router = useRouter();

const { error, parsedContent, loadContent } = useMarkdownContent({
  fetchCommand: 'fetch_privacy_policy',
  errorMessage: '加载隐私政策失败',
});

const goBack = () => {
  router.back();
};

onMounted(() => {
  loadContent();
});
</script>

<style scoped>
@import '@/styles/markdown.css';

.privacy-policy {
  padding: 0;
  width: 100%;
}

.privacy-card {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
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
  color: var(--app-primary-color);
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--app-text-color);
}

.error-container {
  padding: 60px 20px;
}

.content-fade-in {
  animation: contentFadeIn 0.3s ease-out 0.1s both;
}

@keyframes contentFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 20px;
  }
}
</style>
