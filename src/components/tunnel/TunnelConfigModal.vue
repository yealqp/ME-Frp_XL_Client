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
              @click="$emit('start-edit')"
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
              @click="emitSaveToLocal()"
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
              @click="emitSaveEdit()"
              :disabled="!editableContents[activeType]"
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
          @update:value="handleTypeChange"
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
                  class="code-input"
                />
                <n-code
                  v-else
                  :code="configContents[format]"
                  :language="getLanguageForFormat(format)"
                  show-line-numbers
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
import {
  getTunnelConfigLanguage,
  TUNNEL_CONFIG_FORMATS,
  type TunnelConfigFormat,
} from '@/utils/tunnelConfigFiles'

// Props 接口
interface TunnelConfigModalProps {
  show: boolean                              // 显示状态（v-model）
  tunnelId: number | null                    // 当前隧道 ID
  configContents: Partial<Record<TunnelConfigFormat, string>>     // 配置内容对象
  editableContents: Partial<Record<TunnelConfigFormat, string>>   // 可编辑配置内容
  isEditing: boolean                         // 编辑状态
  activeType: TunnelConfigFormat             // 活动配置类型
}

// Emits 接口
interface TunnelConfigModalEmits {
  (e: 'update:show', value: boolean): void
  (e: 'start-edit'): void
  (e: 'save-to-local', tunnelId: number, format: TunnelConfigFormat, content: string): void
  (e: 'save-edit', tunnelId: number, format: TunnelConfigFormat, content: string): void
  (e: 'cancel-edit'): void
  (e: 'change-type', newType: TunnelConfigFormat): void
}

// 定义 props
const props = defineProps<TunnelConfigModalProps>()

// 定义 emits
const emit = defineEmits<TunnelConfigModalEmits>()

// 配置类型列表
const configTypes = TUNNEL_CONFIG_FORMATS

// 获取配置格式对应的语法高亮语言
function getLanguageForFormat(format: TunnelConfigFormat): string {
  return getTunnelConfigLanguage(format)
}

function emitSaveToLocal() {
  if (!props.tunnelId) {
    return
  }

  const content = props.configContents[props.activeType]
  if (!content) {
    return
  }

  emit('save-to-local', props.tunnelId, props.activeType, content)
}

function emitSaveEdit() {
  if (!props.tunnelId) {
    return
  }

  const content = props.editableContents[props.activeType]
  if (!content) {
    return
  }

  emit('save-edit', props.tunnelId, props.activeType, content)
}

function handleTypeChange(value: string | number) {
  if (typeof value !== 'string') {
    return
  }

  if (!configTypes.includes(value as TunnelConfigFormat)) {
    return
  }

  emit('change-type', value as TunnelConfigFormat)
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

.code-input :deep(textarea) {
  font-family: 'Consolas', Monaco, 'Courier New', monospace !important;
  font-size: 13px !important;
  line-height: 1.6 !important;
  background: #1e1e1e !important;
  color: #d4d4d4 !important;
  caret-color: #ffffff !important;
}
</style>
