<template>
  <n-modal
    :show="show"
    @update:show="$emit('update:show', $event)"
    preset="card"
    title="隧道配置文件"
    style="width: 80%; max-width: 800px; height: 80vh"
  >
    <div v-if="tunnelId" class="config-container">
      <div class="config-header">
        <span class="config-title">隧道 ID: {{ tunnelId }}</span>
        <n-space>
          <template v-if="!isEditing">
            <n-tag :bordered="false" type="success">推荐使用TOML格式</n-tag>
            <n-button
              type="primary"
              size="small"
              @click="$emit(                                               'start-edit')"` 
              :disabled="!configContents[activeType]"
            >
              <template #icon>
                <Edit :size="14" />
              </template>
              编辑配置
            </n-button>
            <n-button
              type="success"
              size="small"
              @click="$emit('save-to-local', tunnelId, activeType, configContents[activeType])"
              :disabled="!configContents[activeType]"
            >
              <template #icon>
                <Save :size="14" />
              </template>
              保存到本地
            </n-button>
          </template>

          <template v-else>
            <n-button 
              type="success" 
              size="small" 
              @click="$emit('save-edit', tunnelId, activeType, editableContents[activeType])"
            >
              <template #icon>
                <Check :size="14" />
              </template>
              保存修改
            </n-button>
            <n-button type="default" size="small" @click="$emit('cancel-edit')">
              <template #icon>
                <X :size="14" />
              </template>
              取消
            </n-button>
          </template>
        </n-space>
      </div>

      <div class="config-content">
        <n-tabs
          :value="activeType"
          @update:value="$emit('change-type', $event)"
          type="line"
          placement="left"
          tab-style="min-width: 80px;"
        >
          <n-tab-pane
            v-for="format in configTypes"
            :key="format"
            :name="format"
            :tab="format.toUpperCase()"
            :disabled="!configContents[format]"
          >
            <div class="config-code-container">
              <template v-if="configContents[format]">
                <n-input
                  v-if="isEditing"
                  v-model:value="editableContents[format]"
                  type="textarea"
                  :rows="20"
                  :autosize="{ minRows: 20, maxRows: 30 }"
                  placeholder="请输入配置内容"
                  :style="{
                    fontFamily: 'Consolas, Monaco, Courier New, monospace',
                    fontSize: '12px'
                  }"
                />
                <n-code
                  v-else
                  :code="configContents[format]"
                  :language="getLanguageForFormat(format)"
                  show-line-numbers
                  word-wrap
                />
              </template>
              <div v-else class="no-config">
                <n-empty description="该格式配置文件不可用" />
              </div>
            </div>
          </n-tab-pane>
        </n-tabs>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { NModal, NButton, NSpace, NTabs, NTabPane, NInput, NCode, NEmpty } from 'naive-ui'
import { Edit, Save, Check, X } from 'lucide-vue-next'

// Props 接口
interface TunnelConfigModalProps {
  show: boolean                              // 显示状态（v-model）
  tunnelId: number | null                    // 当前隧道 ID
  configContents: Record<string, string>     // 配置内容对象
  editableContents: Record<string, string>   // 可编辑配置内容
  isEditing: boolean                         // 编辑状态
  activeType: string                         // 活动配置类型
}

// Emits 接口
interface TunnelConfigModalEmits {
  (e: 'update:show', value: boolean): void
  (e: 'start-edit'): void
  (e: 'save-to-local', tunnelId: number, format: string, content: string): void
  (e: 'save-edit', tunnelId: number, format: string, content: string): void
  (e: 'cancel-edit'): void
  (e: 'change-type', newType: string): void
}

// 定义 props
const props = defineProps<TunnelConfigModalProps>()

// 定义 emits
const emit = defineEmits<TunnelConfigModalEmits>()

// 配置类型列表
const configTypes = ['toml', 'json', 'yml', 'ini']

// 获取配置格式对应的语法高亮语言
function getLanguageForFormat(format: string): string {
  const languageMap: Record<string, string> = {
    toml: 'toml',
    json: 'json',
    yml: 'yaml',
    ini: 'ini',
  }
  return languageMap[format] || 'text'
}
</script>

<style scoped>
/* 配置文件模态框样式 */
.config-container {
  display: flex;
  flex-direction: column;
  height: 70vh;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--n-border-color);
  margin-bottom: 16px;
}

.config-title {
  font-weight: 600;
  font-size: 16px;
  color: var(--n-text-color);
}

.config-content {
  flex: 1;
  overflow: hidden;
}

.config-code-container {
  height: 100%;
  overflow: auto;
}

.no-config {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--n-text-color-disabled);
}

/* 配置文件标签页样式 */
.config-content :deep(.n-tabs) {
  height: 100%;
}

.config-content :deep(.n-tabs .n-tabs-pane-wrapper) {
  height: calc(100% - 40px);
  overflow: auto;
}

.config-content :deep(.n-code) {
  height: 100%;
  max-height: none;
}
</style>
