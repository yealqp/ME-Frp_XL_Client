<template>
  <div class="tunnel-config-form">
    <!-- 节点信息卡片 -->
    <n-card class="node-info-card" :bordered="true">
      <div class="node-info-content">
        <div class="node-details">
          <div class="node-header">
            <n-tag :bordered="false" type="info" size="medium"
              >#{{ selectedNode.nodeId }}</n-tag
            >
            <span class="node-name">{{ selectedNode.name }}</span>
          </div>
          <p class="node-description">{{ selectedNode.description }}</p>
          <div class="node-tags">
            <div class="protocol-tags">
              <n-tag
                v-for="protocol in selectedNode.allowType.split(';')"
                :key="protocol"
                :bordered="false"
                type="success"
                size="small"
                class="protocol-tag"
              >
                {{ protocol.toUpperCase() }}
              </n-tag>
            </div>
            <n-tag
              :bordered="false"
              type="info"
              size="small"
              class="bandwidth-tag"
            >
              {{ selectedNode.bandwidth }}
            </n-tag>
            <n-tag
              :bordered="false"
              type="warning"
              size="small"
              class="port-range-tag"
            >
              {{ selectedNode.allowPort }}
            </n-tag>
          </div>
        </div>
        <div class="node-actions">
          <n-button type="default" @click="handleGoBack">
            <template #icon><ArrowLeft :size="16" /></template>
            返回选择
          </n-button>
          <n-button
            type="primary"
            @click="handleCreate"
            :loading="creating"
          >
            <template #icon><Plus :size="16" /></template>
            创建隧道
          </n-button>
        </div>
      </div>
    </n-card>

    <!-- 隧道配置表单 -->
    <n-card class="config-form-card" :bordered="true">
      <template #header><h3>隧道配置</h3></template>
      <n-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-placement="left"
        label-width="120px"
        class="tunnel-form"
      >
        <!-- 基础字段 -->
        <n-form-item label="隧道名称" path="name">
          <n-input
            v-model:value="formData.name"
            placeholder="请输入隧道名称"
          />
        </n-form-item>
        
        <n-form-item label="本地地址" path="localIp">
          <n-input
            v-model:value="formData.localIp"
            placeholder="127.0.0.1"
          />
        </n-form-item>
        
        <n-form-item label="本地端口" path="localPort">
          <n-input-number
            v-model:value="formData.localPort"
            :min="1"
            :max="65535"
            placeholder="请输入本地端口"
            style="width: 100%"
          />
        </n-form-item>
        
        <n-form-item label="隧道类型" path="type">
          <n-select
            v-model:value="formData.type"
            :options="tunnelTypeOptions"
            placeholder="请选择隧道类型"
          />
        </n-form-item>

        <!-- TCP/UDP 条件字段：远程端口 -->
        <n-form-item 
          label="远程端口" 
          path="remotePort"
          v-if="formData.type === 'tcp' || formData.type === 'udp'"
        >
          <div style="display: flex; gap: 8px; width: 100%">
            <n-input-number
              v-model:value="formData.remotePort"
              :min="1"
              :max="65535"
              placeholder="请输入远程端口"
              style="flex: 1"
            />
            <n-button
              type="primary"
              @click="handleGetFreePort"
            >
              获取空闲端口
            </n-button>
          </div>
        </n-form-item>

        <!-- HTTP/HTTPS 条件字段：域名 -->
        <n-form-item
          label="域名"
          path="customDomain"
          v-if="formData.type === 'http' || formData.type === 'https'"
        >
          <n-input
            v-model:value="formData.customDomain"
            placeholder="例如: example.com 或多个域名用逗号分隔: www.example.com,hyw.com,why.com"
          />
          <template #feedback>
            <n-text depth="3" style="font-size: 12px;">
              支持多个域名，用逗号分隔
            </n-text>
          </template>
        </n-form-item>

        <!-- HTTP/HTTPS 条件字段：源协议 -->
        <n-form-item
          label="源协议"
          v-if="formData.type === 'http' || formData.type === 'https'"
        >
          <n-radio-group v-model:value="formData.sourceProtocol">
            <n-space>
              <n-radio value="http">HTTP</n-radio>
              <n-radio value="https">HTTPS</n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>

        <!-- HTTPS 条件字段：TLS 证书路径 -->
        <n-form-item 
          label="TLS 证书路径" 
          path="crtPath"
          v-if="formData.type === 'https'"
        >
          <n-input
            v-model:value="formData.crtPath"
            placeholder="例如: /etc/crt/example.com.crt"
          />
          <template #feedback>
            <n-text depth="3" style="font-size: 12px;">
              用于HTTPS隧道的TLS证书
            </n-text>
          </template>
        </n-form-item>

        <!-- HTTPS 条件字段：TLS 私钥路径 -->
        <n-form-item 
          label="TLS 私钥路径" 
          path="keyPath"
          v-if="formData.type === 'https'"
        >
          <n-input
            v-model:value="formData.keyPath"
            placeholder="例如: /etc/crt/example.com.key"
          />
          <template #feedback>
            <n-text depth="3" style="font-size: 12px;">
              用于HTTPS隧道的TLS私钥
            </n-text>
          </template>
        </n-form-item>

        <!-- 高级配置分隔线 -->
        <n-divider title-placement="left">
          高级配置
          <n-text depth="3" style="font-size: 12px; margin-left: 8px;">
            （可选，仅推荐技术用户使用）
          </n-text>
        </n-divider>

        <!-- HTTP 安全选项 -->
        <n-form-item 
          label="安全选项" 
          v-if="formData.type === 'http'"
        >
          <n-radio-group v-model:value="formData.securityMode">
            <n-space>
              <n-radio
                v-for="option in securityModeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>

        <!-- HTTP Basic Auth 用户名 -->
        <n-form-item 
          label="用户名" 
          v-if="formData.type === 'http' && formData.securityMode === 'basic'"
          path="httpUser"
        >
          <n-input
            v-model:value="formData.httpUser"
            placeholder="请输入 HTTP 基础认证用户名"
          />
        </n-form-item>

        <!-- HTTP Basic Auth 密码 -->
        <n-form-item 
          label="密码" 
          v-if="formData.type === 'http' && formData.securityMode === 'basic'"
          path="httpPassword"
        >
          <n-input
            v-model:value="formData.httpPassword"
            placeholder="请输入 HTTP 基础认证密码"
            type="password"
            show-password-on="click"
          />
        </n-form-item>

        <!-- HTTP 访问密钥 -->
        <n-form-item 
          label="访问密钥" 
          v-if="formData.type === 'http' && formData.securityMode === 'accessKey'"
          path="accessKey"
        >
          <n-input
            v-model:value="formData.accessKey"
            placeholder="请输入访问密钥用于身份验证"
            type="password"
            show-password-on="click"
          />
        </n-form-item>

        <!-- 传输协议 (TCP/HTTP/HTTPS) -->
        <n-form-item 
          label="传输协议" 
          v-if="formData.type === 'tcp' || formData.type === 'http' || formData.type === 'https'"
        >
          <n-radio-group v-model:value="formData.transportProtocol">
            <n-space>
              <n-radio
                v-for="option in transportProtocolOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>

        <!-- Proxy Protocol -->
        <n-form-item label="Proxy Protocol">
          <n-select
            v-model:value="formData.proxyProtocolVersion"
            placeholder="请选择 Proxy Protocol 版本"
            :options="proxyProtocolOptions"
            clearable
          />
        </n-form-item>
        
        <!-- 其他选项 -->
        <n-form-item label="其他选项">
          <n-space>
            <n-checkbox v-model:checked="formData.useEncryption"
              >启用加密</n-checkbox
            >
            <n-checkbox v-model:checked="formData.useCompression"
              >启用压缩</n-checkbox
            >
          </n-space>
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ArrowLeft, Plus } from 'lucide-vue-next';
import type { Node, TunnelForm } from './types';
import type { FormInst, FormRules } from 'naive-ui';

// Props
interface Props {
  modelValue: TunnelForm;
  selectedNode: Node;
  creating: boolean;
}

const props = defineProps<Props>();

// Emits
interface Emits {
  (e: 'update:modelValue', value: TunnelForm): void;
  (e: 'create'): void;
  (e: 'get-free-port'): void;
  (e: 'go-back'): void;
}

const emit = defineEmits<Emits>();

// Form ref
const formRef = ref<FormInst>();

// Local form data (synced with v-model)
const formData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Tunnel type options (based on selected node's supported protocols)
const tunnelTypeOptions = computed(() => {
  const allowedTypes = props.selectedNode.allowType.toLowerCase().split(';');
  const allTypes = [
    { label: 'TCP', value: 'tcp' },
    { label: 'UDP', value: 'udp' },
    { label: 'HTTP', value: 'http' },
    { label: 'HTTPS', value: 'https' },
  ];
  return allTypes.filter((type) => allowedTypes.includes(type.value));
});

// Proxy Protocol options
const proxyProtocolOptions = [
  { label: '不使用', value: '' },
  { label: 'v1', value: 'v1' },
  { label: 'v2', value: 'v2' },
];

// Security mode options (for HTTP tunnels)
const securityModeOptions = [
  { label: '禁用', value: 'none' },
  { label: 'Basic Auth', value: 'basic' },
  { label: '访问密钥', value: 'accessKey' },
];

// Transport protocol options
const transportProtocolOptions = [
  { label: 'TCP (常规)', value: 'tcp' },
  { label: 'QUIC (部分场景可优化延迟)', value: 'quic' },
];

// Dynamic form validation rules
const formRules = computed<FormRules>(() => {
  const rules: FormRules = {
    name: { required: true, message: '请输入隧道名称', trigger: 'blur' },
    type: { required: true, message: '请选择隧道类型', trigger: 'change' },
    localIp: { required: true, message: '请输入本地地址', trigger: 'blur' },
    localPort: {
      required: true,
      type: 'number',
      message: '请输入本地端口',
      trigger: 'blur',
    },
  };
  
  // HTTP/HTTPS 隧道需要域名
  if (formData.value.type === 'http' || formData.value.type === 'https') {
    rules.customDomain = {
      required: true,
      message: '请输入域名',
      trigger: 'blur',
    };
  }
  
  // HTTPS 隧道需要证书和私钥
  if (formData.value.type === 'https') {
    rules.crtPath = {
      required: true,
      message: '请输入 TLS 证书路径',
      trigger: 'blur',
    };
    rules.keyPath = {
      required: true,
      message: '请输入 TLS 私钥路径',
      trigger: 'blur',
    };
  }
  
  // HTTP 隧道的安全选项验证
  if (formData.value.type === 'http') {
    // Basic Auth 模式需要用户名和密码
    if (formData.value.securityMode === 'basic') {
      rules.httpUser = {
        required: true,
        message: '请输入 HTTP 基础认证用户名',
        trigger: 'blur',
      };
      rules.httpPassword = {
        required: true,
        message: '请输入 HTTP 基础认证密码',
        trigger: 'blur',
      };
    }
    
    // 访问密钥模式需要密钥
    if (formData.value.securityMode === 'accessKey') {
      rules.accessKey = {
        required: true,
        message: '请输入访问密钥',
        trigger: 'blur',
      };
    }
  }
  
  return rules;
});

// Event handlers
const handleGoBack = () => {
  emit('go-back');
};

const handleCreate = async () => {
  try {
    await formRef.value?.validate();
    emit('create');
  } catch (error) {
    // Validation failed, do nothing (naive-ui will show error messages)
  }
};

const handleGetFreePort = () => {
  emit('get-free-port');
};

// Expose validate method
defineExpose({
  validate: () => formRef.value?.validate()
});
</script>

<style scoped>
.tunnel-config-form {
  width: 100%;
}

.node-info-card {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
  border-radius: 0px;
  margin-bottom: 20px;
}

.node-info-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.node-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.node-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--app-text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-description {
  margin: 0;
  color: #666;
  font-size: 12px;
  line-height: 1.4;
}

.node-tags {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 4px;
}

.protocol-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.protocol-tag {
  font-size: 10px;
}

.bandwidth-tag {
  font-size: 10px;
}

.port-range-tag {
  font-size: 10px;
  font-weight: 500;
}

.node-actions {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.config-form-card {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
  border-radius: 0px;
}

.tunnel-form {
  width: 100%;
}

@media (max-width: 768px) {
  .node-info-content {
    flex-direction: column;
    align-items: stretch;
  }
  .node-actions {
    justify-content: flex-end;
  }
}
</style>
