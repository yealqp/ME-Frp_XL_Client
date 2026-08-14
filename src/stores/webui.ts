import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { extractErrorMessage } from '@/utils/errorHandler';
import { invokeTauriResponse } from '@/utils/tauriResponse';
import { loadUnifiedConfig, mergeUnifiedConfig } from '@/utils/unifiedConfig';

interface WebuiSettings {
  addr: string;
  port: number;
  pass: string;
}

interface ActionResult {
  success: boolean;
  message: string;
}

// 仅允许合法主机名（避免脏值污染 URL / 注入请求）
function sanitizeAddr(addr: string): string {
  const trimmed = addr.trim();
  if (!trimmed) {
    return 'localhost';
  }
  // 拒绝协议、路径、端口、空白、通配符
  if (
    trimmed.includes('://') ||
    trimmed.includes('/') ||
    trimmed.includes(':') ||
    trimmed.includes(' ') ||
    trimmed.includes('*')
  ) {
    return 'localhost';
  }
  return trimmed;
}

// 端口校验：1~65535 整数
function sanitizePort(port: number): number {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return 1201;
  }
  return port;
}

export const useWebuiStore = defineStore('webui', () => {

  // 状态
  const settings = ref<WebuiSettings>({
    addr: 'localhost',
    port: 1201,
    pass: 'admin',
  });

  const isRunning = ref(false);
  const isStarting = ref(false);
  const isStopping = ref(false);
  const showEmbedded = ref(false);

  // 计算属性（基于校验后的 addr/port）
  const webuiUrl = computed(() => {
    const addr = sanitizeAddr(settings.value.addr);
    const port = sanitizePort(settings.value.port);
    return `http://${addr}:${port}`;
  });

  // 加载 WebUI 设置
  const loadSettings = async () => {
    try {
      const config = await loadUnifiedConfig();

      if (config.webuiAddr) settings.value.addr = sanitizeAddr(config.webuiAddr);
      if (config.webuiPort) settings.value.port = sanitizePort(config.webuiPort);
      if (config.webuiPass) settings.value.pass = config.webuiPass;
    } catch (error) {
      console.error('加载 WebUI 设置失败:', error);
    }
  };

  // 保存 WebUI 设置（密码仅在输入过时落盘，避免心跳保存明文）
  const saveSettings = async (persistPass = false): Promise<ActionResult> => {
    try {
      const patch: Record<string, unknown> = {
        webuiAddr: sanitizeAddr(settings.value.addr),
        webuiPort: sanitizePort(settings.value.port),
      };
      if (persistPass) {
        patch.webuiPass = settings.value.pass;
      }
      await mergeUnifiedConfig(patch);
      return { success: true, message: 'WebUI 设置已保存' };
    } catch (error) {
      console.error('保存 WebUI 设置失败:', error);
      return { success: false, message: extractErrorMessage(error, '保存 WebUI 设置失败') };
    }
  };

  const runWebuiCommand = async (
    command: 'start_webui' | 'stop_webui',
    successMessage: string,
    failureMessage: string,
    params?: Record<string, unknown>,
  ): Promise<ActionResult> => {
    try {
      const response = await invokeTauriResponse<null>(command, params);
      if (response.code !== 200) {
        throw new Error(response.message || failureMessage);
      }

      await checkStatus();
      return { success: true, message: successMessage };
    } catch (error) {
      console.error(`${failureMessage}:`, error);
      return {
        success: false,
        message: extractErrorMessage(error, failureMessage),
      };
    }
  };

  // 检查 WebUI 运行状态
  const checkStatus = async () => {
    try {
      const running = await invoke<boolean>('is_webui_running');
      const wasRunning = isRunning.value;
      isRunning.value = running;

      // 如果从未运行变为运行，自动显示 iframe
      if (!wasRunning && running) {
        showEmbedded.value = true;
      }
      // 如果从运行变为未运行，隐藏 iframe
      else if (wasRunning && !running) {
        showEmbedded.value = false;
      }

      return running;
    } catch (error) {
      console.error('检查 WebUI 状态失败:', error);
      return false;
    }
  };

  // 启动 WebUI
  const start = async () => {
    isStarting.value = true;
    try {
      // 使用校验后的地址/端口（防止脏值传入后端命令）
      settings.value.addr = sanitizeAddr(settings.value.addr);
      settings.value.port = sanitizePort(settings.value.port);
      return await runWebuiCommand('start_webui', 'WebUI 启动成功', '启动 WebUI 失败', {
        addr: settings.value.addr,
        port: settings.value.port,
        pass: settings.value.pass,
      });
    } finally {
      isStarting.value = false;
    }
  };

  // 停止 WebUI
  const stop = async () => {
    isStopping.value = true;
    try {
      return await runWebuiCommand('stop_webui', 'WebUI 已停止', '停止 WebUI 失败');
    } finally {
      isStopping.value = false;
    }
  };

  // 在浏览器中打开 WebUI
  const openInBrowser = async () => {
    try {
      await invoke('open_url', { url: webuiUrl.value });
      return { success: true };
    } catch (error) {
      console.error('打开 WebUI 失败:', error);
      return { success: false, message: '打开 WebUI 失败' };
    }
  };

  // 在新窗口中打开 WebUI
  const openInWindow = async () => {
    try {
      await invoke('open_webview_window', { 
        url: webuiUrl.value,
        windowId: 'webui',
        title: 'MEFrp WebUI'
      });
      return { success: true };
    } catch (error) {
      console.error('打开 WebUI 窗口失败:', error);
      return { success: false, message: '打开 WebUI 窗口失败' };
    }
  };

  // 关闭 WebUI 窗口
  const closeWindow = async () => {
    try {
      await invoke('close_webview_window', { windowId: 'webui' });
      return { success: true };
    } catch (error) {
      console.error('关闭 WebUI 窗口失败:', error);
      return { success: false, message: '关闭 WebUI 窗口失败' };
    }
  };

  // 切换 iframe 显示
  const toggleEmbedded = () => {
    showEmbedded.value = !showEmbedded.value;
  };

  return {
    // 状态
    settings,
    isRunning,
    isStarting,
    isStopping,
    showEmbedded,

    // 计算属性
    webuiUrl,

    // 方法
    loadSettings,
    saveSettings,
    checkStatus,
    start,
    stop,
    openInBrowser,
    openInWindow,
    closeWindow,
    toggleEmbedded,
  };
});
