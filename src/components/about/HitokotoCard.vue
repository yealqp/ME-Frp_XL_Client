<template>
  <n-card :bordered="true" class="hitokoto-card">
    <div class="hitokoto-content">
      <div class="hitokoto-text">
        <Quote :size="20" class="quote-icon" />
        <span class="hitokoto-sentence">{{ hitokoto.sentence }}</span>
      </div>
      <div class="hitokoto-meta">
        <span v-if="hitokoto.from" class="hitokoto-from">
          —— {{ hitokoto.from }}
          <span v-if="hitokoto.from_who" class="hitokoto-author"
            >「{{ hitokoto.from_who }}」</span
          >
        </span>
      </div>
      <div class="hitokoto-actions">
        <n-button
          text
          @click="refreshHitokoto"
          :loading="hitokotoLoading"
          size="small"
        >
          <template #icon>
            <RefreshCw :size="16" />
          </template>
          换一句
        </n-button>
      </div>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { RefreshCw, Quote } from "@lucide/vue";
import { useHitokoto } from "@/composables/useHitokoto";

const { hitokoto, hitokotoLoading, getHitokoto, refreshHitokoto } = useHitokoto();

onMounted(() => {
  getHitokoto();
});
</script>

<style scoped>
.hitokoto-card {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
}

.hitokoto-card :deep(.n-card__content) {
  padding: 24px;
}

.hitokoto-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hitokoto-text {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  position: relative;
}

.quote-icon {
  flex-shrink: 0;
  margin-top: 4px;
  color: var(--app-text-color-3);
}

.hitokoto-sentence {
  font-size: 16px;
  line-height: 1.8;
  color: var(--app-text-color);
  font-weight: 500;
  letter-spacing: 0.5px;
}

.hitokoto-meta {
  display: flex;
  justify-content: flex-end;
  padding-right: 8px;
}

.hitokoto-from {
  font-size: 13px;
  color: var(--app-text-color-2);
  font-style: italic;
}

.hitokoto-author {
  margin-left: 4px;
  color: var(--app-text-color-1);
}

.hitokoto-actions {
  display: flex;
  justify-content: center;
  padding-top: 8px;
  border-top: 1px solid var(--app-divider-color);
}

.hitokoto-actions .n-button {
  color: var(--app-text-color-2);
  transition: all 0.3s ease;
}

.hitokoto-actions .n-button:hover {
  color: var(--app-primary-color);
  transform: scale(1.05);
}

.hitokoto-actions .n-button :deep(.n-button__icon) {
  color: var(--app-text-color-2);
}

.hitokoto-actions .n-button:hover :deep(.n-button__icon) {
  color: var(--app-primary-color);
}
</style>
