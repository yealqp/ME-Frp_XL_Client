<template>
  <div class="tunnel-config" v-if="selectedNode">
    <h2 class="page-title">创建隧道</h2>

    <!-- 顶部节点信息卡片 -->
    <n-card class="node-info-card" :bordered="true">
      <div class="node-info-content">
        <!-- 左侧节点信息 -->
        <div class="node-details">
          <div class="node-header">
            <n-tag :bordered="false" type="info" size="medium">#{{ selectedNode.nodeId }}</n-tag>
            <span class="node-name">{{ selectedNode.name }}</span>
          </div>
          <p class="node-description">{{ selectedNode.description }}</p>

          <div class="node-tags">
            <div class="protocol-tags">
              <n-tag v-for="protocol in selectedNode.allowType.split(';')" :key="protocol" :bordered="false"
                type="success" size="small" class="protocol-tag">
                {{ protocol.toUpperCase() }}
              </n-tag>
            </div>
            <n-tag :bordered="false" type="info" size="small" class="bandwidth-tag">
              {{ selectedNode.bandwidth }}
            </n-tag>
            <n-tag :bordered="false" type="warning" size="small" class="port-range-tag">
              {{ selectedNode.allowPort }}
            </n-tag>
            <a href="https://www.mefrp.com/dashboard/create-proxy" target="_blank"><n-tag :bordered="false" type="error" size="small" link>仅支持创建TCP/UDP隧道 HTTP/S隧道还请前往官网创建 点击跳转 敬请谅解</n-tag></a>
          </div>
        </div>

        <!-- 右侧操作按钮 -->
        <div class="node-actions">
          <n-button type="default" @click="goBack">
            <template #icon>
              <i class="fas fa-arrow-left"></i>
            </template>
            返回选择
          </n-button>
          <n-button type="primary" @click="createTunnel" :loading="creating">
            <template #icon>
              <i class="fas fa-plus"></i>
            </template>
            创建隧道
          </n-button>
        </div>
      </div>
    </n-card>

    <!-- 隧道配置表单 -->
    <n-card class="config-form-card" :bordered="true">
      <template #header>
        <h3>隧道配置</h3>
      </template>

      <n-form ref="formRef" :model="tunnelForm" :rules="formRules" label-placement="left" label-width="120px"
        class="tunnel-form">
        <n-form-item label="隧道名称" path="name">
          <n-input v-model:value="tunnelForm.name" placeholder="请输入隧道名称"/>

        </n-form-item>

        <n-form-item label="本地地址" path="localIp">
          <n-input v-model:value="tunnelForm.localIp" placeholder="127.0.0.1" />
        </n-form-item>

        <n-form-item label="本地端口" path="localPort">
          <n-input-number v-model:value="tunnelForm.localPort" :min="1" :max="65535" placeholder="请输入本地端口"
            style="width: 100%" />
        </n-form-item>
        <n-form-item label="隧道类型" path="type">
          <n-select v-model:value="tunnelForm.type" :options="tunnelTypeOptions" placeholder="请选择隧道类型" />
        </n-form-item>

        <n-form-item label="远程端口" path="remotePort">
          <div style="display: flex; gap: 8px; width: 100%;">
            <n-input-number v-model:value="tunnelForm.remotePort" :min="1" :max="65535" placeholder="请输入远程端口"
              style="flex: 1;" />
            <n-button type="primary" @click="getFreePort" :loading="gettingPort">
              获取空闲端口
            </n-button>
          </div>
        </n-form-item>

        <n-form-item label="域名" path="customDomain" v-if="tunnelForm.type === 'http' || tunnelForm.type === 'https'">
          <n-input v-model:value="tunnelForm.customDomain" placeholder="域名" />
        </n-form-item>



        <!-- 高级配置 -->
        <n-divider title-placement="left">高级配置</n-divider>

        <n-form-item label="Host Header Rewrite">
          <n-input v-model:value="tunnelForm.hostHeaderRewrite" placeholder="请输入 Host 请求头重写" />
        </n-form-item>

        <n-form-item label="X-From-Where">
          <n-input v-model:value="tunnelForm.headerXFromWhere" placeholder="请输入 X-From-Where 请求头" />
        </n-form-item>

        <n-form-item label="Proxy Protocol">
          <n-select v-model:value="tunnelForm.proxyProtocolVersion" placeholder="请选择 Proxy Protocol 版本"
            :options="proxyProtocolOptions" clearable />
        </n-form-item>

        <n-form-item label="其他选项">
          <n-space>
            <n-checkbox v-model:checked="tunnelForm.useEncryption">
              启用加密
            </n-checkbox>
            <n-checkbox v-model:checked="tunnelForm.useCompression">
              启用压缩
            </n-checkbox>
          </n-space>
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { invoke } from '@tauri-apps/api/core';
import { useMessage } from 'naive-ui';

interface Node {
  nodeId: number;
  name: string;
  hostname: string;
  description: string;
  token: string;
  servicePort: number;
  adminPort: number;
  adminPass: string;
  allowGroup: string;
  allowPort: string;
  allowType: string;
  region: string;
  bandwidth: string;
  isOnline: boolean;
  isDisabled: boolean;
  totalTrafficIn: number;
  totalTrafficOut: number;
  upTime: number;
  version: string;
}

interface NodeStatus {
  nodeId: number;
  name: string;
  totalTrafficIn: number;
  totalTrafficOut: number;
  onlineClient: number;
  onlineProxy: number;
  isOnline: boolean;
  version: string;
  uptime: number;
  curConns: number;
  loadPercent: number;
}

interface TunnelForm {
  name: string;
  type: string;
  localIp: string;
  localPort: number | null;
  remotePort: number | null;
  customDomain: string;
  hostHeaderRewrite: string;
  headerXFromWhere: string;
  proxyProtocolVersion: string;
  useEncryption: boolean;
  useCompression: boolean;
}

// 从路由获取选中的节点
const router = useRouter();
const route = useRoute();

// 尝试从路由获取节点数据
const selectedNode = ref<Node | null>(null);

// Props（保持兼容性）
const props = defineProps<{
  selectedNode?: Node;
}>();

// 获取节点列表（用于根据 nodeId 查找节点）
async function fetchNodeById(nodeId: number): Promise<Node | null> {
  try {
    const responseText = await invoke<string>('api_get_node_list');
    const response = JSON.parse(responseText);
    
    if (response.code === 200) {
      const nodes: Node[] = response.data;
      return nodes.find(n => n.nodeId === nodeId) || null;
    }
  } catch (error) {
    console.error('获取节点列表失败:', error);
  }
  return null;
}

// 初始化
onMounted(async () => {
  // 优先从路由 query 获取 nodeId
  if (route.query.nodeId) {
    const nodeId = parseInt(route.query.nodeId as string);
    console.log('从路由 query 获取节点 ID:', nodeId);
    selectedNode.value = await fetchNodeById(nodeId);
    if (selectedNode.value) {
      console.log('成功获取节点:', selectedNode.value);
    }
  }
  // 其次从路由 state 获取
  else if (history.state.selectedNode) {
    selectedNode.value = history.state.selectedNode;
    console.log('从路由 state 获取节点:', selectedNode.value);
  } 
  // 最后从 props 获取
  else if (props.selectedNode) {
    selectedNode.value = props.selectedNode;
    console.log('从 props 获取节点:', selectedNode.value);
  }
  
  // 如果都没有，返回节点选择页面
  if (!selectedNode.value) {
    console.warn('未找到选中的节点，返回节点选择页面');
    message.warning('请先选择一个节点');
    router.push('/create-tunnel');
    return;
  }
  
  // 获取节点状态
  fetchNodeStatus();
  
  // 设置协议类型默认值为第一个选项
  if (tunnelTypeOptions.value.length > 0) {
    tunnelForm.value.type = tunnelTypeOptions.value[0].value;
  }
});

// Emits
const emit = defineEmits<{
  'go-back': [];
  'tunnel-created': [tunnel: TunnelForm];
}>();

// 表单数据
const tunnelForm = ref<TunnelForm>({
  name: '',
  type: '',
  localIp: '127.0.0.1',
  localPort: null,
  remotePort: null,
  customDomain: '',
  hostHeaderRewrite: '',
  headerXFromWhere: '',
  proxyProtocolVersion: '',
  useEncryption: true,
  useCompression: true
});

// 表单验证规则
const formRules = {
  name: {
    required: true,
    message: '请输入隧道名称',
    trigger: 'blur'
  },
  type: {
    required: true,
    message: '请选择隧道类型',
    trigger: 'change'
  },
  localIp: {
    required: true,
    message: '请输入本地地址',
    trigger: 'blur'
  },
  localPort: {
    required: true,
    type: 'number',
    message: '请输入本地端口',
    trigger: 'blur'
  }
};

// 隧道类型选项
const tunnelTypeOptions = computed(() => {
  if (!selectedNode.value) return [];
  const allowedTypes = selectedNode.value.allowType.toLowerCase().split(';');
  const allTypes = [
    { label: 'TCP', value: 'tcp' },
    { label: 'UDP', value: 'udp' }
  ];

  return allTypes.filter(type => allowedTypes.includes(type.value));
});

// 节点状态数据
const nodeStatus = ref<NodeStatus[]>([]);
const nodeStatusLoading = ref(true);
const creating = ref(false);
const gettingPort = ref(false);
const formRef = ref();

// 初始化message
const message = useMessage();

// Proxy Protocol选项
const proxyProtocolOptions = [
  { label: '不使用', value: '' },
  { label: 'v1', value: 'v1' },
  { label: 'v2', value: 'v2' }
];



// 返回节点选择页面
function goBack() {
  emit('go-back');
}

// 获取空闲端口
async function getFreePort() {
  if (!tunnelForm.value.type || (tunnelForm.value.type !== 'tcp' && tunnelForm.value.type !== 'udp')) {
    message.warning('请先选择隧道类型');
    return;
  }

  try {
    gettingPort.value = true;

    const requestData = {
      nodeId: selectedNode.value?.nodeId,
      protocol: tunnelForm.value.type
    };

    const responseText = await invoke<string>('api_get_free_port', {
      data: JSON.stringify(requestData)
    });

    const response = JSON.parse(responseText);
    if (response.code === 200) {
      tunnelForm.value.remotePort = response.data;
      message.success(`获取到空闲端口: ${response.data}`);
    } else {
      message.error(response.message || '获取空闲端口失败');
    }
  } catch (error) {
    console.error('获取空闲端口失败:', error);
    // 显示完整的错误信息
    const errorMessage = error && typeof error === 'string' ? error :
      error && typeof error === 'object' && 'message' in error ?
        (error as any).message : '获取空闲端口失败';
    message.error(`获取空闲端口失败: ${errorMessage}`);
  } finally {
    gettingPort.value = false;
  }
}

// 创建隧道
async function createTunnel() {
  try {
    await formRef.value?.validate();
    creating.value = true;

    const requestData = {
      nodeId: selectedNode.value?.nodeId,
      proxyName: tunnelForm.value.name,
      proxyType: tunnelForm.value.type,
      localIp: tunnelForm.value.localIp,
      localPort: tunnelForm.value.localPort,
      remotePort: tunnelForm.value.remotePort,
      domain: tunnelForm.value.customDomain,
      accessKey: '',
      hostHeaderRewrite: tunnelForm.value.hostHeaderRewrite,
      headerXFromWhere: tunnelForm.value.headerXFromWhere,
      proxyProtocolVersion: tunnelForm.value.proxyProtocolVersion,
      useEncryption: tunnelForm.value.useEncryption,
      useCompression: tunnelForm.value.useCompression
    };

    const responseText = await invoke<string>('api_create_tunnel', {
      data: JSON.stringify(requestData)
    });

    const response = JSON.parse(responseText);

    if (response.code === 200) {
      message.success('隧道创建成功');
      emit('tunnel-created', tunnelForm.value);

      // 重置表单
      tunnelForm.value = {
        name: '',
        type: '',
        localIp: '127.0.0.1',
        localPort: null,
        remotePort: null,
        customDomain: '',
        hostHeaderRewrite: '',
        headerXFromWhere: '',
        proxyProtocolVersion: '',
        useEncryption: true,
        useCompression: true
      };
    } else {
      message.error(response.message || '创建隧道失败');
    }

  } catch (error) {
    console.error('创建隧道失败:', error);
    // 显示完整的错误信息
    const errorMessage = error && typeof error === 'string' ? error :
      error && typeof error === 'object' && 'message' in error ?
        (error as any).message : '创建隧道失败';
    message.error(`创建隧道失败: ${errorMessage}`);
  } finally {
    creating.value = false;
  }
}

// 获取节点状态
async function fetchNodeStatus() {
  try {
    nodeStatusLoading.value = true;
    const responseText = await invoke<string>('api_get_node_status');
    const response = JSON.parse(responseText);

    if (response.code === 200) {
      nodeStatus.value = response.data;
    }
  } catch (err) {
    console.error('获取节点状态失败:', err);
  } finally {
    nodeStatusLoading.value = false;
  }
}


</script>

<style scoped>
.tunnel-config {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-title {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 600;
  color: #fff;
}

/* 节点信息卡片 */
.node-info-card {
  border-radius: 0px;
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
  gap: 8px;
}

.node-name {
  font-weight: 600;
  font-size: 16px;
  color: #fff;
}

.node-description {
  margin: 0;
  color: #999;
  font-size: 14px;
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

/* 配置表单卡片 */
.config-form-card {
  border-radius: 0px;
}

.tunnel-form {
  max-width: 600px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .node-info-content {
    flex-direction: column;
    align-items: stretch;
  }

  .node-actions {
    justify-content: flex-end;
  }

  .load-progress {
    width: 100%;
  }
}
</style>