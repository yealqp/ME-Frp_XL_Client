import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';

export const useWebuiStore = defineStore('webui', () => {

  // 状态
  const settings = ref({
    addr: 'localhost',
    port: 1201,
    pass: 'admin',
  });

  const isRunning = ref(false);
  const isStarting = ref(false);
  const isStopping = ref(false);
  const showEmbedded = ref(false);

  // 计算属性
  const webuiUrl = computed(() => {
    return `http://${settings.value.addr}:${settings.value.port}`;
  });

  // 加载 WebUI 设置
  const loadSettings = async () => {
    try {
      const config = await invoke<any>('load_unified_config');

      if (config.webuiAddr) settings.value.addr = config.webuiAddr;
      if (config.webuiPort) settings.value.port = config.webuiPort;
      if (config.webuiPass) settings.value.pass = config.webuiPass;
    } catch (error) {
      console.error('加载 WebUI 设置失败:', error);
    }
  };

  // 保存 WebUI 设置
  const saveSettings = async () => {
    try {
      const config = await invoke<any>('load_unified_config');

      config.webuiAddr = settings.value.addr;
      config.webuiPort = settings.value.port;
      config.webuiPass = settings.value.pass;

      await invoke('save_unified_config', { config });
      return { success: true, message: 'WebUI 设置已保存' };
    } catch (error) {
      console.error('保存 WebUI 设置失败:', error);
      return { success: false, message: '保存 WebUI 设置失败' };
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
      const responseText = await invoke<string>('start_webui', {
        addr: settings.value.addr,
        port: settings.value.port,
        pass: settings.value.pass,
      });

      const response = JSON.parse(responseText);
      if (response.code === 200) {
        await checkStatus();
        return { success: true, message: 'WebUI 启动成功' };
      } else {
        throw new Error(response.message || '启动 WebUI 失败');
      }
    } catch (error) {
      console.error('启动 WebUI 失败:', error);
      return { success: false, message: `启动 WebUI 失败: ${error}` };
    } finally {
      isStarting.value = false;
    }
  };

  // 停止 WebUI
  const stop = async () => {
    isStopping.value = true;
    try {
      const responseText = await invoke<string>('stop_webui');
      const response = JSON.parse(responseText);

      if (response.code === 200) {
        await checkStatus();
        return { success: true, message: 'WebUI 已停止' };
      } else {
        throw new Error(response.message || '停止 WebUI 失败');
      }
    } catch (error) {
      console.error('停止 WebUI 失败:', error);
      return { success: false, message: `停止 WebUI 失败: ${error}` };
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
