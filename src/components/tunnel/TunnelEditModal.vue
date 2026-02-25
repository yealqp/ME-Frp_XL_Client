<template>
  <n-modal
    :show="show"
    @update:show="$emit('update:show', $event)"
    preset="card"
    title="编辑隧道"
    style="width: 80%; max-width: 600px"
  >
    <div v-if="tunnel" class="edit-container">
      <n-form :model="editForm" label-placement="left" label-width="120px">
        <!-- 通用字段 -->
        <n-form-item label="隧道名称" required>
          <n-input
            v-model:value="editForm.proxyName"
            placeholder="请输入隧道名称"
          />
        </n-form-item>

        <n-form-item label="本地地址" required>
          <n-input
            v-model:value="editForm.localIp"
            placeholder="请输入本地地址"
          />
        </n-form-item>

        <n-form-item label="本地端口" required>
          <n-input-number
            v-model:value="editForm.localPort"
            placeholder="请输入本地端口"
            style="width: 100%"
          />
        </n-form-item>

        <!-- TCP/UDP 类型字段 -->
        <n-form-item
          label="远程端口"
          v-if="editForm.proxyType === 'tcp' || editForm.proxyType === 'udp'"
        >
          <div style="display: flex; gap: 8px; width: 100%">
            <n-input-number
              v-model:value="editForm.remotePort"
              :min="1"
              :max="65535"
              placeholder="请输入远程端口"
              style="flex: 1"
            />
            <n-button
              type="primary"
              @click="handleGetFreePort"
              :loading="gettingPort"
            >
              获取空闲端口
            </n-button>
          </div>
        </n-form-item>

        <!-- HTTP/HTTPS 类型字段 -->
        <n-form-item
          label="域名"
          v-if="editForm.proxyType === 'http' || editForm.proxyType === 'https'"
        >
          <n-input
            v-model:value="editForm.domain"
            placeholder="例如: example.com 或 subdomain.example.com"
          />
        </n-form-item>

        <n-form-item
          label="源协议"
          v-if="editForm.proxyType === 'http' || editForm.proxyType === 'https'"
        >
          <n-radio-group v-model:value="editForm.sourceProtocol">
            <n-space>
              <n-radio value="http">HTTP</n-radio>
              <n-radio value="https">HTTPS</n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>

        <!-- HTTPS TLS 字段 -->
        <n-form-item 
          label="TLS 证书路径" 
          v-if="editForm.proxyType === 'https'"
        >
          <n-input
            v-model:value="editForm.crtPath"
            placeholder="例如: /etc/crt/example.com.crt"
          />
        </n-form-item>

        <n-form-item 
          label="TLS 私钥路径" 
          v-if="editForm.proxyType === 'https'"
        >
          <n-input
            v-model:value="editForm.keyPath"
            placeholder="例如: /etc/crt/example.com.key"
          />
        </n-form-item>

        <n-divider>高级配置</n-divider>

        <!-- HTTP 安全选项 -->
        <n-form-item 
          label="安全选项" 
          v-if="editForm.proxyType === 'http'"
        >
          <n-radio-group v-model:value="editForm.securityMode">
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

        <n-form-item 
          label="用户名" 
          v-if="editForm.proxyType === 'http' && editForm.securityMode === 'basic'"
        >
          <n-input
            v-model:value="editForm.httpUser"
            placeholder="请输入 HTTP 基础认证用户名"
          />
        </n-form-item>

        <n-form-item 
          label="密码" 
          v-if="editForm.proxyType === 'http' && editForm.securityMode === 'basic'"
        >
          <n-input
            v-model:value="editForm.httpPassword"
            placeholder="请输入 HTTP 基础认证密码"
            type="password"
            show-password-on="click"
          />
        </n-form-item>

        <n-form-item 
          label="访问密钥" 
          v-if="editForm.proxyType === 'http' && editForm.securityMode === 'accessKey'"
        >
          <n-input
            v-model:value="editForm.accessKey"
            placeholder="请输入访问密钥用于身份验证"
            type="password"
            show-password-on="click"
          />
        </n-form-item>

        <!-- 传输协议 -->
        <n-form-item 
          label="传输协议" 
          v-if="editForm.proxyType === 'tcp' || editForm.proxyType === 'http' || editForm.proxyType === 'https'"
        >
          <n-radio-group v-model:value="editForm.transportProtocol">
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
            v-model:value="editForm.proxyProtocolVersion"
            placeholder="请选择 Proxy Protocol 版本"
            :options="proxyProtocolOptions"
          />
        </n-form-item>

        <!-- 加密和压缩 -->
        <n-form-item label="其他选项">
          <n-space>
            <n-checkbox v-model:checked="editForm.useEncryption"
              >启用加密</n-checkbox
            >
            <n-checkbox v-model:checked="editForm.useCompression"
              >启用压缩</n-checkbox
            >
          </n-space>
        </n-form-item>
      </n-form>

      <div class="edit-actions">
        <n-space>
          <n-button @click="handleCancel">取消</n-button>
          <n-button type="primary" @click="handleSave">确定</n-button>
        </n-space>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { 
  NModal, 
  NForm, 
  NFormItem,
  NInput,
  NInputNumber,
  NButton, 
  NSpace,
  NRadioGroup,
  NRadio,
  NSelect,
  NCheckbox,
  NDivider
} from 'naive-ui'

// Props 接口
interface TunnelEditModalProps {
  show: boolean
  tunnel: Tunnel | null
  nodeNameMap: Record<number, string>
  gettingPort: boolean
}

// Emits 接口
interface TunnelEditModalEmits {
  (e: 'update:show', value: boolean): void
  (e: 'save', tunnelId: number, formData: EditFormData): void
  (e: 'cancel'): void
  (e: 'get-free-port', nodeId: number, protocol: string): void
}

// Tunnel 接口
interface Tunnel {
  proxyId: number
  username: string
  proxyName: string
  proxyType: string
  isBanned: boolean
  isDisabled: boolean
  localIp: string
  localPort: number
  remotePort: number
  nodeId: number
  runId: string
  isOnline: boolean
  domain: string
  lastStartTime: number
  lastCloseTime: number
  clientVersion: string
  proxyProtocolVersion: string
  useEncryption: boolean
  useCompression: boolean
  location: string
  accessKey: string
  hostHeaderRewrite: string
  headerXFromWhere: string
  httpUser?: string
  httpPassword?: string
  crtPath?: string
  keyPath?: string
  transportProtocol?: string
}

// EditFormData 接口
interface EditFormData {
  proxyName: string
  localIp: string
  localPort: number
  remotePort: number
  domain: string
  sourceProtocol: string
  securityMode: string
  accessKey: string
  httpUser: string
  httpPassword: string
  crtPath: string
  keyPath: string
  useEncryption: boolean
  useCompression: boolean
  proxyProtocolVersion: string
  transportProtocol: string
  proxyType: string
  nodeId: number
}

const props = defineProps<TunnelEditModalProps>()
const emit = defineEmits<TunnelEditModalEmits>()

// 内部表单状态
const editForm = ref<EditFormData>({
  proxyName: '',
  localIp: '',
  localPort: 0,
  remotePort: 0,
  domain: '',
  sourceProtocol: 'http',
  securityMode: 'none',
  accessKey: '',
  httpUser: '',
  httpPassword: '',
  crtPath: '',
  keyPath: '',
  useEncryption: false,
  useCompression: false,
  proxyProtocolVersion: '',
  transportProtocol: 'tcp',
  proxyType: '',
  nodeId: 0
})

// 选项数据
const proxyProtocolOptions = [
  { label: '不使用', value: '' },
  { label: 'v1', value: 'v1' },
  { label: 'v2', value: 'v2' }
]

const transportProtocolOptions = [
  { label: 'TCP (常规)', value: 'tcp' },
  { label: 'QUIC (部分场景可优化延迟)', value: 'quic' }
]

const securityModeOptions = [
  { label: '禁用', value: 'none' },
  { label: 'Basic Auth', value: 'basic' },
  { label: '访问密钥', value: 'accessKey' }
]

// 处理获取空闲端口
const handleGetFreePort = () => {
  if (!props.tunnel) return
  emit('get-free-port', props.tunnel.nodeId, props.tunnel.proxyType)
}

// 处理保存
const handleSave = () => {
  if (!props.tunnel) return
  emit('save', props.tunnel.proxyId, editForm.value)
}

// 处理取消
const handleCancel = () => {
  emit('cancel')
}

// 监听 tunnel prop 变化,初始化表单数据
watch(
  () => props.tunnel,
  (newTunnel) => {
    if (newTunnel) {
      // 根据 accessKey 和 httpUser 判断安全模式
      let securityMode = 'none'
      if (newTunnel.accessKey) {
        securityMode = 'accessKey'
      } else if (newTunnel.httpUser) {
        securityMode = 'basic'
      }
      
      // 根据隧道类型和域名判断源协议（简化处理，默认 http）
      const sourceProtocol = 'http'
      
      // 初始化表单数据
      editForm.value = {
        proxyName: newTunnel.proxyName,
        localIp: newTunnel.localIp,
        localPort: newTunnel.localPort,
        remotePort: newTunnel.remotePort,
        domain: newTunnel.domain,
        sourceProtocol: sourceProtocol,
        securityMode: securityMode,
        accessKey: newTunnel.accessKey || '',
        httpUser: '',
        httpPassword: '',
        crtPath: '',
        keyPath: '',
        useEncryption: newTunnel.useEncryption,
        useCompression: newTunnel.useCompression,
        proxyProtocolVersion: newTunnel.proxyProtocolVersion || '',
        transportProtocol: 'tcp',
        proxyType: newTunnel.proxyType,
        nodeId: newTunnel.nodeId
      }
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.edit-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--n-border-color);
  margin-top: 16px;
}
</style>
