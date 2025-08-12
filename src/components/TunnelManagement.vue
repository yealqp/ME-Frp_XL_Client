<template>
  <div class="tunnel-management">
    <div class="page-header">
      <h2 class="page-title">隧道管理</h2>
      <n-button type="primary" @click="refreshTunnels" :loading="loading">
        <template #icon>
          <i class="fas fa-sync-alt"></i>
        </template>
        刷新
      </n-button>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="error-container">
      <n-alert type="error" :title="error" />
      <n-button type="primary" @click="() => { error = ''; loadTunnels(); }" style="margin-top: 16px;">
        重新加载
      </n-button>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="tunnels-container">
      <div class="tunnels-grid">
        <n-card v-for="i in 6" :key="i" :bordered="true" size="small" class="tunnel-card">
          <template #header>
            <div class="tunnel-header">
              <n-skeleton text width="120" />
              <n-skeleton text width="60" />
            </div>
          </template>

          <div class="tunnel-content">
            <n-skeleton text :repeat="4" />
          </div>

          <template #action>
            <div class="tunnel-actions">
              <n-skeleton text width="60" style="margin-right: 8px;" />
              <n-skeleton text width="60" style="margin-right: 8px;" />
              <n-skeleton text width="60" />
            </div>
          </template>
        </n-card>
      </div>
    </div>

    <!-- 隧道卡片网格 -->
    <div v-else-if="tunnels.length > 0" class="tunnels-container">
      <div class="tunnels-grid">
        <n-card 
          v-for="tunnel in tunnels" 
          :key="tunnel.proxyId" 
          :bordered="true" 
          class="tunnel-card"
          hoverable
        >
          <!-- 卡片头部 -->
          <template #header>
            <div class="tunnel-header">
              <div class="tunnel-title">
                <h3 class="tunnel-name">{{ tunnel.proxyName }}</h3>
                <div class="status-tags">
                  <n-tag 
                    v-if="tunnel.isDisabled" 
                    type="warning" 
                    :bordered="false" 
                    size="small"
                    class="disabled-tag"
                  >
                    已禁用
                  </n-tag>
                  <n-tag 
                    :type="tunnel.isOnline ? 'success' : 'default'" 
                    :bordered="false" 
                    size="small"
                    class="status-tag"
                  >
                    {{ tunnel.isOnline ? '在线' : '离线' }}
                  </n-tag>
                </div>
              </div>
            </div>
          </template>

          <!-- 卡片内容 -->
          <div class="tunnel-content">
            <div class="tunnel-info">
              <div class="info-row">
                <span class="info-label">ID:</span>
                <n-tag type="info" :bordered="false" size="small">
                  # {{ tunnel.proxyId }}
                </n-tag>
              </div>
              <div class="info-row">
                <span class="info-label">协议:</span>
                <span class="info-value">{{ tunnel.proxyType.toUpperCase() }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">远程端口:</span>
                <span class="info-value">{{ tunnel.remotePort }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">节点:</span>
                <span class="info-value">
                  #{{ tunnel.nodeId }} - {{ nodeNameMap[tunnel.nodeId] || '未知节点' }}
                </span>
              </div>
              <div class="info-row" v-if="tunnel.domain">
                <span class="info-label">域名:</span>
                <span class="info-value">{{ tunnel.domain }}</span>
              </div>
            </div>
          </div>

          <!-- 卡片底部操作 -->
          <template #action>
            <div class="tunnel-actions">
              <n-button 
                v-if="!runningTunnels.has(tunnel.proxyId)" 
                type="primary" 
                size="small" 
                @click="startTunnel(tunnel.proxyId)"
                :loading="actionLoading[tunnel.proxyId]"
              >
                <template #icon>
                  <i class="fas fa-play"></i>
                </template>
                启动
              </n-button>
              <n-button 
                v-else 
                type="warning" 
                size="small" 
                @click="stopTunnel(tunnel.proxyId)"
                :loading="actionLoading[tunnel.proxyId]"
              >
                <template #icon>
                  <i class="fas fa-stop"></i>
                </template>
                停止
              </n-button>
              
              <n-button 
                v-if="runningTunnels.has(tunnel.proxyId)"
                type="info" 
                size="small" 
                @click="viewLogs(tunnel.proxyId)"
              >
                <template #icon>
                  <i class="fas fa-file-alt"></i>
                </template>
                日志
              </n-button>
              
              <n-button 
                type="default" 
                size="small" 
                @click="editTunnel(tunnel.proxyId)"
              >
                <template #icon>
                  <i class="fas fa-edit"></i>
                </template>
                编辑
              </n-button>
              
              <n-dropdown 
                trigger="click" 
                :options="getMoreOptions(tunnel.proxyId)"
                @select="(key: string) => handleMoreAction(key, tunnel.proxyId)"
              >
                <n-button type="default" size="small">
                  <template #icon>
                    <i class="fas fa-cog"></i>
                  </template>
                  更多
                </n-button>
              </n-dropdown>
            </div>
          </template>
        </n-card>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <n-empty description="暂无隧道数据">
        <template #icon>
          <i class="fas fa-inbox"></i>
        </template>
        <template #extra>
          <n-button type="primary" @click="goToCreateTunnel">
            创建隧道
          </n-button>
        </template>
      </n-empty>
    </div>
  </div>

  <!-- 日志模态框 -->
  <n-modal v-model:show="showLogs" preset="card" title="隧道日志" style="width: 80%; max-width: 800px;">
    <div class="log-container">
      <div class="log-header">
        <span>隧道 ID: {{ currentTunnelId }}</span>
        <n-button size="small" @click="viewLogs(currentTunnelId!)" :loading="loading">
          刷新日志
        </n-button>
      </div>
      <div class="log-content">
        <div v-if="currentLogs.length === 0" class="no-logs">
          暂无日志
        </div>
        <div v-else class="log-lines">
          <div v-for="(log, index) in currentLogs" :key="index" class="log-line">
            {{ log }}
          </div>
        </div>
      </div>
    </div>
  </n-modal>

  <!-- 隧道详情模态框 -->
  <n-modal v-model:show="showDetails" preset="card" title="隧道详情" style="width: 80%; max-width: 600px;">
    <div v-if="currentTunnelDetails" class="details-container">
      <div class="detail-item">
        <span class="detail-label">状态：</span>
        <n-tag :type="currentTunnelDetails.isOnline ? 'success' : 'default'" size="small">
          {{ currentTunnelDetails.isOnline ? '在线' : '离线' }}
        </n-tag>
      </div>
      <div class="detail-item">
        <span class="detail-label">隧道名称：</span>
        <span class="detail-value">{{ currentTunnelDetails.proxyName }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">协议类型：</span>
        <span class="detail-value">{{ currentTunnelDetails.proxyType.toUpperCase() }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">本地端口：</span>
        <span class="detail-value">{{ currentTunnelDetails.localPort }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">本地地址：</span>
        <span class="detail-value">{{ currentTunnelDetails.localIp }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">节点名称：</span>
        <span class="detail-value">#{{ currentTunnelDetails.nodeId }} - {{ nodeNameMap[currentTunnelDetails.nodeId] || '未知节点' }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">链接地址：</span>
        <span class="detail-value">{{ getNodeAddress(currentTunnelDetails.proxyId) }}:{{ currentTunnelDetails.remotePort || '未分配' }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">上次启动时间：</span>
        <span class="detail-value">{{ formatTimestamp(currentTunnelDetails.lastStartTime) }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">上次关闭时间：</span>
        <span class="detail-value">{{ formatTimestamp(currentTunnelDetails.lastCloseTime) }}</span>
      </div>
    </div>
   </n-modal>

  <!-- 编辑隧道模态框 -->
  <n-modal v-model:show="showEditModal" preset="card" title="编辑隧道" style="width: 80%; max-width: 600px;">
    <div v-if="editingTunnel" class="edit-container">
      <n-form :model="editForm" label-placement="left" label-width="120px">
        <n-form-item label="隧道名称" required>
          <n-input v-model:value="editForm.proxyName" placeholder="请输入隧道名称" />
        </n-form-item>
        
        <n-form-item label="本地地址" required>
          <n-input v-model:value="editForm.localIp" placeholder="请输入本地地址" />
        </n-form-item>
        
        <n-form-item label="本地端口" required>
          <n-input-number v-model:value="editForm.localPort" placeholder="请输入本地端口" style="width: 100%" />
        </n-form-item>
        
        <n-form-item label="远程端口">
           <div style="display: flex; gap: 8px; width: 100%;">
             <n-input-number v-model:value="editForm.remotePort" :min="1" :max="65535" placeholder="请输入远程端口" style="flex: 1;" />
             <n-button type="primary" @click="getFreePortForEdit" :loading="gettingPortForEdit">
               获取空闲端口
             </n-button>
           </div>
         </n-form-item>
        
        <n-divider>高级配置</n-divider>
        
        <n-form-item label="访问密钥">
          <n-input v-model:value="editForm.accessKey" placeholder="请输入访问密钥" />
        </n-form-item>
        
        <n-form-item label="Host Header Rewrite">
          <n-input v-model:value="editForm.hostHeaderRewrite" placeholder="请输入 Host 请求头重写值" />
        </n-form-item>
        
        <n-form-item label="X-From-Where">
          <n-input v-model:value="editForm.headerXFromWhere" placeholder="请输入 X-From-Where 请求头值" />
        </n-form-item>
        
        <n-form-item label="Proxy Protocol">
          <n-select v-model:value="editForm.proxyProtocolVersion" placeholder="请选择 Proxy Protocol 版本">
            <n-option value="" label="不启用" />
            <n-option value="v1" label="v1" />
            <n-option value="v2" label="v2" />
          </n-select>
        </n-form-item>
        
        <n-form-item label="其他选项">
          <n-space>
            <n-switch v-model:value="editForm.useEncryption">
              <template #checked>启用加密</template>
              <template #unchecked>启用加密</template>
            </n-switch>
            <n-switch v-model:value="editForm.useCompression">
              <template #checked>启用压缩</template>
              <template #unchecked>启用压缩</template>
            </n-switch>
          </n-space>
        </n-form-item>
      </n-form>
      
      <div class="edit-actions">
        <n-space>
          <n-button @click="cancelEdit">取消</n-button>
          <n-button type="primary" @click="saveEdit">确定</n-button>
        </n-space>
      </div>
    </div>
  </n-modal>

  <!-- 配置文件模态框 -->
  <n-modal v-model:show="showConfigModal" preset="card" title="隧道配置文件" style="width: 80%; max-width: 800px; height: 80vh;">
    <div v-if="currentConfigTunnelId" class="config-container">
      <div class="config-header">
          <span class="config-title">隧道 ID: {{ currentConfigTunnelId }}</span>
          <n-space>
            <template v-if="!isEditingConfig">
              <n-button 
                type="primary" 
                size="small" 
                @click="startEditConfig"
                :disabled="!configContents[activeConfigType]"
              >
                <template #icon>
                  <i class="fas fa-edit"></i>
                </template>
                编辑配置
              </n-button>
              <n-button 
                type="success" 
                size="small" 
                @click="saveConfigFile(currentConfigTunnelId!, activeConfigType, configContents[activeConfigType])"
                :disabled="!configContents[activeConfigType]"
              >
                <template #icon>
                  <i class="fas fa-save"></i>
                </template>
                保存到本地
              </n-button>
            </template>
            
            <template v-else>
              <n-button 
                type="success" 
                size="small" 
                @click="saveEditedConfig"
              >
                <template #icon>
                  <i class="fas fa-check"></i>
                </template>
                保存修改
              </n-button>
              <n-button 
                type="default" 
                size="small" 
                @click="cancelEditConfig"
              >
                <template #icon>
                  <i class="fas fa-times"></i>
                </template>
                取消
              </n-button>
            </template>
          </n-space>
        </div>
      
      <div class="config-content">
        <n-tabs 
           :value="activeConfigType" 
           @update:value="handleConfigTypeChange"
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
                   v-if="isEditingConfig"
                   v-model:value="editableConfigContents[format]"
                   type="textarea"
                   :rows="20"
                   :autosize="{ minRows: 20, maxRows: 30 }"
                   placeholder="请输入配置内容"
                   style="font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 12px;"
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
import { h, ref, onMounted } from 'vue';
import { useMessage } from 'naive-ui';
import { invoke } from '@tauri-apps/api/core';

interface Tunnel {
  proxyId: number;
  username: string;
  proxyName: string;
  proxyType: string;
  isBanned: boolean;
  isDisabled: boolean;
  localIp: string;
  localPort: number;
  remotePort: number;
  nodeId: number;
  runId: string;
  isOnline: boolean;
  domain: string;
  lastStartTime: number;
  lastCloseTime: number;
  clientVersion: string;
  proxyProtocolVersion: string;
  useEncryption: boolean;
  useCompression: boolean;
  location: string;
  accessKey: string;
  hostHeaderRewrite: string;
  headerXFromWhere: string;
}

interface ApiResponse {
  code: number;
  data: Tunnel[];
  message: string;
}

interface Emits {
  (e: 'tunnel-start', id: number): void;
  (e: 'tunnel-stop', id: number): void;
  (e: 'tunnel-edit', id: number): void;
  (e: 'tunnel-delete', id: number): void;
  (e: 'go-to-create'): void;
}

const emit = defineEmits<Emits>();
const message = useMessage();

// 响应式数据
const tunnels = ref<Tunnel[]>([]);
const loading = ref(false);
const error = ref('');
const actionLoading = ref<Record<number, boolean>>({});
const nodeNameMap = ref<Record<number, string>>({});
const nodeHostnameMap = ref<Record<number, string>>({});

// 加载节点名称列表
async function loadNodeNames() {
  try {
    const responseText = await invoke('api_get_node_name_list');
    const result = JSON.parse(responseText as string);
    
    if (result.code === 200 && Array.isArray(result.data)) {
      const nameMap: Record<number, string> = {};
      const hostnameMap: Record<number, string> = {};
      result.data.forEach((node: any) => {
        nameMap[node.nodeId] = node.name;
        hostnameMap[node.nodeId] = node.hostname;
      });
      nodeNameMap.value = nameMap;
      nodeHostnameMap.value = hostnameMap;
    }
  } catch (err) {
    console.error('加载节点名称失败:', err);
  }
}

// 加载配置文件状态
async function loadConfigFileStatus() {
  try {
    const tunnelsWithConfig = await invoke('check_tunnel_config_files');
    usingConfigFile.value = new Set(tunnelsWithConfig as number[]);
  } catch (err) {
    console.error('加载配置文件状态失败:', err);
  }
}

// 加载隧道列表
async function loadTunnels() {
  loading.value = true;
  error.value = '';
  
  try {
    // 同时加载隧道列表、节点名称和配置文件状态
    await Promise.all([
      loadNodeNames(),
      loadConfigFileStatus(),
      (async () => {
        const responseText = await invoke('api_get_tunnel_list');
        const result: ApiResponse = JSON.parse(responseText as string);
        
        if (result.code === 200) {
          tunnels.value = result.data;
          message.success(`成功加载 ${result.data.length} 个隧道`);
        } else {
          throw new Error(result.message || '获取隧道列表失败');
        }
      })()
    ]);
  } catch (err) {
    console.error('加载隧道列表失败:', err);
    error.value = err instanceof Error ? err.message : '加载隧道列表失败';
    message.error(error.value);
  } finally {
    loading.value = false;
  }
}

// 获取运行中的隧道
const runningTunnels = ref(new Set());

const loadRunningTunnels = async () => {
  try {
    const running = await invoke('api_get_running_tunnels');
    runningTunnels.value = new Set(running as number[]);
  } catch (error) {
    console.error('获取运行状态失败:', error);
  }
};

// 启动隧道
async function startTunnel(id: number) {
  actionLoading.value[id] = true;
  try {
    const responseText = await invoke('api_start_tunnel', { proxyId: id });
    const result = JSON.parse(responseText as string);
    
    if (result.code === 200) {
      message.success('隧道启动成功');
      // 更新运行状态
      await loadRunningTunnels();
    } else {
      throw new Error(result.message || '启动隧道失败');
    }
    
    emit('tunnel-start', id);
  } catch (err) {
    console.error('启动隧道失败:', err);
    message.error(err instanceof Error ? err.message : '启动隧道失败');
  } finally {
    actionLoading.value[id] = false;
  }
}

// 停止隧道
async function stopTunnel(id: number) {
  actionLoading.value[id] = true;
  try {
    const responseText = await invoke('api_stop_tunnel', { proxyId: id });
    const result = JSON.parse(responseText as string);
    
    if (result.code === 200) {
      message.success('隧道停止成功');
      // 更新运行状态
      await loadRunningTunnels();
    } else {
      throw new Error(result.message || '停止隧道失败');
    }
    
    emit('tunnel-stop', id);
  } catch (err) {
    console.error('停止隧道失败:', err);
    message.error(err instanceof Error ? err.message : '停止隧道失败');
  } finally {
    actionLoading.value[id] = false;
  }
}

// 查看隧道日志
const showLogs = ref(false);
const currentLogs = ref<string[]>([]);
const currentTunnelId = ref<number | null>(null);

// 查看隧道详情
const showDetails = ref(false);
const currentTunnelDetails = ref<Tunnel | null>(null);

// 编辑隧道
const showEditModal = ref(false);
const editingTunnel = ref<Tunnel | null>(null);
const gettingPortForEdit = ref(false);
const editForm = ref({
  proxyName: '',
  localIp: '',
  localPort: 0,
  remotePort: 0,
  domain: '',
  accessKey: '',
  hostHeaderRewrite: '',
  headerXFromWhere: '',
  useEncryption: false,
  useCompression: false,
  proxyProtocolVersion: '',
  location: '',
  proxyType: '',
  nodeId: 0
});

const viewLogs = async (tunnelId: number) => {
  try {
    currentTunnelId.value = tunnelId;
    const logs = await invoke('api_get_tunnel_logs', { proxyId: tunnelId });
    currentLogs.value = logs as string[];
    showLogs.value = true;
  } catch (error) {
    message.error(`获取日志失败: ${error}`);
  }
};

// 查看隧道详情
const viewTunnelDetails = async (tunnelId: number) => {
  const tunnel = tunnels.value.find(t => t.proxyId === tunnelId);
  if (tunnel) {
    currentTunnelDetails.value = tunnel;
    showDetails.value = true;
  }
};

// 格式化时间戳
const formatTimestamp = (timestamp: number) => {
  if (!timestamp) return '未知';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 获取节点名称
const getNodeName = (): string => {
  // 这里需要根据proxyId从节点简要信息中匹配
  // 暂时返回未知，后续需要实现节点信息获取逻辑
  return '未知';
};

// 获取节点地址
const getNodeAddress = (proxyId: number): string => {
  // 根据proxyId找到对应的隧道，然后获取其nodeId
  const tunnel = tunnels.value.find(t => t.proxyId === proxyId);
  if (tunnel && nodeHostnameMap.value[tunnel.nodeId]) {
    return nodeHostnameMap.value[tunnel.nodeId];
  }
  return '未知';
};

function editTunnel(id: number) {
  const tunnel = tunnels.value.find(t => t.proxyId === id);
  if (tunnel) {
    // 检查隧道是否在线
    if (runningTunnels.value.has(id)) {
      message.warning('隧道当前在线，请先关闭隧道');
      return;
    }
    
    editingTunnel.value = tunnel;
    editForm.value = {
      proxyName: tunnel.proxyName,
      localIp: tunnel.localIp,
      localPort: tunnel.localPort,
      remotePort: tunnel.remotePort,
      domain: tunnel.domain,
      accessKey: tunnel.accessKey,
      hostHeaderRewrite: tunnel.hostHeaderRewrite,
      headerXFromWhere: tunnel.headerXFromWhere,
      useEncryption: tunnel.useEncryption,
      useCompression: tunnel.useCompression,
      proxyProtocolVersion: tunnel.proxyProtocolVersion,
      location: tunnel.location,
      proxyType: tunnel.proxyType,
      nodeId: tunnel.nodeId
    };
    showEditModal.value = true;
  }
}

// 更新隧道配置
async function updateTunnel(tunnelId: number, updateData: any) {
  try {
    actionLoading.value[tunnelId] = true;
    const requestData = {
      proxyId: tunnelId,
      ...updateData
    };
    const responseText = await invoke('api_update_tunnel', {
      data: JSON.stringify(requestData)
    });
    const result = JSON.parse(responseText as string);
    
    if (result.code === 200) {
      message.success('隧道配置更新成功');
      await loadTunnels();
    } else {
      throw new Error(result.message || '更新隧道配置失败');
    }
  } catch (err) {
    console.error('更新隧道配置失败:', err);
    message.error(err instanceof Error ? err.message : '更新隧道配置失败');
  } finally {
    actionLoading.value[tunnelId] = false;
  }
}

// 保存编辑
const saveEdit = async () => {
  if (!editingTunnel.value) return;
  
  try {
    await updateTunnel(editingTunnel.value.proxyId, editForm.value);
    showEditModal.value = false;
    editingTunnel.value = null;
  } catch (err) {
    // 错误已在updateTunnel中处理
  }
};

// 取消编辑
const cancelEdit = () => {
  showEditModal.value = false;
  editingTunnel.value = null;
};

// 获取空闲端口（编辑时）
const getFreePortForEdit = async () => {
  if (!editingTunnel.value) return;
  
  // 检查隧道类型是否支持获取端口
  if (!editingTunnel.value.proxyType || (editingTunnel.value.proxyType !== 'tcp' && editingTunnel.value.proxyType !== 'udp')) {
    message.warning('只有TCP和UDP隧道支持获取空闲端口');
    return;
  }
  
  gettingPortForEdit.value = true;
  try {
    const requestData = {
      nodeId: editingTunnel.value.nodeId,
      protocol: editingTunnel.value.proxyType
    };
    
    const responseText = await invoke<string>('api_get_free_port', {
      data: JSON.stringify(requestData)
    });
    const result = JSON.parse(responseText);
    
    if (result.code === 200 && result.data) {
      editForm.value.remotePort = result.data;
      message.success(`获取到空闲端口: ${result.data}`);
    } else {
      throw new Error(result.message || '获取空闲端口失败');
    }
  } catch (err) {
    console.error('获取空闲端口失败:', err);
    message.error(err instanceof Error ? err.message : '获取空闲端口失败');
  } finally {
    gettingPortForEdit.value = false;
  }
};

// 配置文件相关
const showConfigModal = ref(false);
const currentConfigTunnelId = ref<number | null>(null);
const configTypes = ['toml', 'json', 'yml', 'ini'];
const activeConfigType = ref('toml');
const configContents = ref<Record<string, string>>({});
const editableConfigContents = ref<Record<string, string>>({});
const loadingConfig = ref(false);
const usingConfigFile = ref<Set<number>>(new Set());
const isEditingConfig = ref(false);

// 获取隧道配置文件
async function getTunnelConfig(tunnelId: number, format: string) {
  try {
    loadingConfig.value = true;
    const requestData = {
      proxyId: tunnelId,
      format: format
    };
    
    const responseText = await invoke('api_request', {
      method: 'POST',
      url: 'https://api.mefrp.com/api/auth/proxy/config',
      data: JSON.stringify(requestData)
    });
    
    const result = JSON.parse(responseText as string);
    
    if (result.code === 200 && result.data && result.data.config) {
      return result.data.config;
    } else {
      throw new Error(result.message || '获取配置文件失败');
    }
  } catch (err) {
    console.error('获取配置文件失败:', err);
    message.error(err instanceof Error ? err.message : '获取配置文件失败');
    return null;
  } finally {
    loadingConfig.value = false;
  }
}

// 保存配置文件到本地
async function saveConfigFile(tunnelId: number, format: string, content: string) {
  try {
    const fileName = `${tunnelId}.${format}`;
    await invoke('save_config_file', {
      fileName: fileName,
      content: content
    });
    message.success(`配置文件已保存: ${fileName}，下次启动将使用配置文件模式`);
    usingConfigFile.value.add(tunnelId);
    
    // 关闭模态框
    showConfigModal.value = false;
  } catch (err) {
    console.error('保存配置文件失败:', err);
    message.error(err instanceof Error ? err.message : '保存配置文件失败');
  }
}

// 改用配置文件
async function useConfigFile(tunnelId: number) {
  currentConfigTunnelId.value = tunnelId;
  configContents.value = {};
  editableConfigContents.value = {};
  isEditingConfig.value = false;
  
  // 获取所有格式的配置文件
  for (const format of configTypes) {
    const config = await getTunnelConfig(tunnelId, format);
    if (config) {
      configContents.value[format] = config;
      editableConfigContents.value[format] = config;
    }
  }
  
  if (Object.keys(configContents.value).length > 0) {
    showConfigModal.value = true;
  } else {
    message.error('无法获取配置文件');
  }
}

// 开始编辑配置
function startEditConfig() {
  isEditingConfig.value = true;
}

// 取消编辑配置
function cancelEditConfig() {
  isEditingConfig.value = false;
  // 恢复原始内容
  editableConfigContents.value = { ...configContents.value };
}

// 保存编辑的配置
async function saveEditedConfig() {
  if (!currentConfigTunnelId.value) return;
  
  try {
    const tunnelId = currentConfigTunnelId.value;
    const format = activeConfigType.value;
    const content = editableConfigContents.value[format];
    
    if (!content) {
      message.error('配置内容不能为空');
      return;
    }
    
    await saveConfigFile(tunnelId, format, content);
    
    // 更新原始内容
    configContents.value[format] = content;
    isEditingConfig.value = false;
    
    message.success('配置文件修改成功');
  } catch (err) {
    console.error('保存配置失败:', err);
    message.error(err instanceof Error ? err.message : '保存配置失败');
  }
}

// 处理配置文件类型切换
async function handleConfigTypeChange(newType: string) {
  if (!currentConfigTunnelId.value) return;
  
  const oldType = activeConfigType.value;
  if (oldType === newType) return;
  
  try {
    // 删除旧的配置文件
    const tunnelId = currentConfigTunnelId.value;
    const oldFileName = `${tunnelId}.${oldType}`;
    
    await invoke('delete_config_file', { fileName: oldFileName }).catch(() => {
      // 忽略文件不存在的错误
    });
    
    // 更新活动类型
    activeConfigType.value = newType;
    
    message.success(`已切换到 ${newType.toUpperCase()} 格式`);
  } catch (err) {
    console.error('切换配置文件类型失败:', err);
    message.error(err instanceof Error ? err.message : '切换配置文件类型失败');
  }
}

// 查看配置文件
async function viewConfigFile(tunnelId: number) {
  await useConfigFile(tunnelId);
}

// 切换到快速启动模式
async function switchToQuickStart(tunnelId: number) {
  try {
    // 删除所有格式的配置文件
    const configFormats = ['toml', 'json', 'yml', 'ini'];
    const deletePromises = configFormats.map(format => {
      const fileName = `${tunnelId}.${format}`;
      return invoke('delete_config_file', { fileName }).catch(() => {
        // 忽略文件不存在的错误
      });
    });
    
    await Promise.all(deletePromises);
    
    // 更新状态
    usingConfigFile.value.delete(tunnelId);
    message.success('已切换到快速启动模式');
  } catch (err) {
    console.error('切换到快速启动失败:', err);
    message.error(err instanceof Error ? err.message : '切换到快速启动失败');
  }
}

// 获取代码高亮语言
function getLanguageForFormat(format: string): string {
  const languageMap: Record<string, string> = {
    'toml': 'toml',
    'json': 'json',
    'yml': 'yaml',
    'ini': 'ini'
  };
  return languageMap[format] || 'text';
}

// 强制隧道下线
async function kickTunnel(tunnelId: number) {
  try {
    actionLoading.value[tunnelId] = true;
    const responseText = await invoke('api_kick_tunnel', { proxyId: tunnelId });
    const result = JSON.parse(responseText as string);
    
    if (result.code === 200) {
      message.success('隧道已强制下线');
      await loadRunningTunnels();
    } else {
      throw new Error(result.message || '强制下线失败');
    }
  } catch (err) {
    console.error('强制下线失败:', err);
    message.error(err instanceof Error ? err.message : '强制下线失败');
  } finally {
    actionLoading.value[tunnelId] = false;
  }
}

// 启用/禁用隧道
async function toggleTunnel(tunnelId: number, enable: boolean) {
  try {
    actionLoading.value[tunnelId] = true;
    const responseText = await invoke('api_toggle_tunnel', { 
      proxyId: tunnelId,
      isDisabled: !enable 
    });
    const result = JSON.parse(responseText as string);
    
    if (result.code === 200) {
      message.success(enable ? '隧道已启用' : '隧道已禁用');
      await loadTunnels();
    } else {
      throw new Error(result.message || (enable ? '启用隧道失败' : '禁用隧道失败'));
    }
  } catch (err) {
    console.error('切换隧道状态失败:', err);
    message.error(err instanceof Error ? err.message : '切换隧道状态失败');
  } finally {
    actionLoading.value[tunnelId] = false;
  }
}



function refreshTunnels() {
  loadTunnels();
}

function goToCreateTunnel() {
  emit('go-to-create');
}

function getMoreOptions(tunnelId: number) {
  const tunnel = tunnels.value.find(t => t.proxyId === tunnelId);
  const isUsingConfig = usingConfigFile.value.has(tunnelId);
  
  const options = [
    {
      label: '查看详情',
      key: 'details',
      icon: () => h('i', { class: 'fas fa-info-circle' })
    },
    {
      type: 'divider',
      key: 'd1'
    }
  ];
  
  // 根据是否使用配置文件显示不同选项
  if (isUsingConfig) {
    options.push(
      {
        label: '配置文件',
        key: 'view-config',
        icon: () => h('i', { class: 'fas fa-file-code' })
      },
      {
        label: '改用快速启动',
        key: 'use-quick-start',
        icon: () => h('i', { class: 'fas fa-rocket' })
      }
    );
  } else {
    options.push({
      label: '改用配置文件',
      key: 'use-config',
      icon: () => h('i', { class: 'fas fa-file-export' })
    });
  }
  
  options.push(
    {
      type: 'divider',
      key: 'd2'
    },
    {
      label: tunnel?.isDisabled ? '启用隧道' : '禁用隧道',
      key: tunnel?.isDisabled ? 'enable' : 'disable',
      icon: () => h('i', { class: tunnel?.isDisabled ? 'fas fa-play-circle' : 'fas fa-pause-circle' })
    },
    {
      label: '强制下线',
      key: 'kick',
      icon: () => h('i', { class: 'fas fa-sign-out-alt' })
    },
    {
      type: 'divider',
      key: 'd3'
    },
    {
      label: '删除隧道',
      key: 'delete',
      icon: () => h('i', { class: 'fas fa-trash', style: 'color: #d03050;' })
    }
  );
  
  return options;
}

async function handleMoreAction(action: string, tunnelId: number) {
  switch (action) {
    case 'details':
      await viewTunnelDetails(tunnelId);
      break;
    case 'use-config':
      await useConfigFile(tunnelId);
      break;
    case 'view-config':
      await viewConfigFile(tunnelId);
      break;
    case 'use-quick-start':
      await switchToQuickStart(tunnelId);
      break;
    case 'enable':
      await toggleTunnel(tunnelId, true);
      break;
    case 'disable':
      await toggleTunnel(tunnelId, false);
      break;
    case 'kick':
      await kickTunnel(tunnelId);
      break;
    case 'delete':
      try {
        const responseText = await invoke('api_delete_tunnel', { proxyId: tunnelId });
        const result = JSON.parse(responseText as string);
        
        if (result.code === 200) {
          message.success('隧道删除成功');
          // 重新加载隧道列表
          await loadTunnels();
          emit('tunnel-delete', tunnelId);
        } else {
          throw new Error(result.message || '删除隧道失败');
        }
      } catch (err) {
        console.error('删除隧道失败:', err);
        message.error(err instanceof Error ? err.message : '删除隧道失败');
      }
      break;
  }
}

// 初始化时加载隧道列表和运行状态
onMounted(() => {
  loadTunnels();
  loadRunningTunnels();
});

// 定期更新运行状态
setInterval(() => {
  loadRunningTunnels();
}, 5000); // 每5秒更新一次

// 暴露给模板的变量和方法
defineExpose({
  tunnels,
  loading,
  runningTunnels,
  showLogs,
  currentLogs,
  currentTunnelId,
  showDetails,
  currentTunnelDetails,
  showEditModal,
  editingTunnel,
  editForm,
  gettingPortForEdit,
  showConfigModal,
  currentConfigTunnelId,
  configTypes,
  activeConfigType,
  configContents,
  editableConfigContents,
  loadingConfig,
  usingConfigFile,
  isEditingConfig,
  refreshTunnels: loadTunnels,
  startTunnel,
  stopTunnel,
  editTunnel,
  updateTunnel,
  kickTunnel,
  toggleTunnel,
  handleMoreAction,
  viewLogs,
  viewTunnelDetails,
  saveEdit,
  cancelEdit,
  formatTimestamp,
  getNodeName,
  getNodeAddress,
  getFreePortForEdit,
  getTunnelConfig,
  saveConfigFile,
  useConfigFile,
  viewConfigFile,
  getLanguageForFormat,
  loadConfigFileStatus,
  switchToQuickStart,
  startEditConfig,
  cancelEditConfig,
  saveEditedConfig,
  handleConfigTypeChange
});
</script>

<style scoped>
.tunnel-management {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.tunnels-container {
  width: 100%;
}

.tunnels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.error-container {
  margin-bottom: 24px;
}

.tunnel-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tunnel-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.status-tags {
  display: flex;
  gap: 8px;
  align-items: center;
}

.disabled-tag {
  background-color: #faad14 !important;
  color: white !important;
}

.status-tag {
  margin-left: 0;
}

.tunnel-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.info-label {
  font-size: 13px;
  min-width: 80px;
}

.info-value {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: flex-end;
}

.tunnel-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tunnel-actions .n-button {
  flex: 1;
  min-width: 80px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 60px 20px;
  text-align: center;
  color: var(--n-text-color-depth-3);
}

.empty-state h3 {
  margin: 16px 0 8px;
  color: var(--n-text-color-depth-2);
  font-size: 16px;
  font-weight: 500;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--n-text-color-depth-3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tunnels-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    padding: 0 16px;
  }
  
  .tunnel-actions {
    flex-direction: column;
  }
  
  .tunnel-actions .n-button {
    flex: none;
  }
  
  .tunnel-card {
    margin: 0 16px;
  }
}

@media (max-width: 480px) {
  .tunnels-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .tunnel-card {
    margin: 0 12px;
  }
  
  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .info-value {
    justify-content: flex-start;
  }
}

@media (max-width: 1200px) {
  .tunnels-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}

/* 日志模态框样式 */
.log-container {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--n-border-color);
  margin-bottom: 12px;
}

.log-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.no-logs {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--n-text-color-disabled);
  font-size: 14px;
}

.log-lines {
  flex: 1;
  overflow-y: auto;
  background: var(--n-color-embedded);
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
}

.log-line {
  margin-bottom: 4px;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.log-line:last-child {
  margin-bottom: 0;
}

/* 详情模态框样式 */
.details-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--n-border-color);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 600;
  min-width: 120px;
  color: var(--n-text-color-depth-2);
}

.detail-value {
  flex: 1;
  color: var(--n-text-color);
}

/* 编辑模态框样式 */
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
.config-content .n-tabs {
  height: 100%;
}

.config-content .n-tabs .n-tabs-pane-wrapper {
  height: calc(100% - 40px);
  overflow: auto;
}

.config-content .n-code {
  height: 100%;
  max-height: none;
}
</style>