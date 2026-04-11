import { onUnmounted, ref, shallowRef } from "vue";
import { useMessage } from "naive-ui";
import { invokeTauriResponse } from "@/utils/tauriResponse";
import { extractErrorMessage } from "@/utils/errorHandler";
import {
  checkTunnelConfigFiles,
  deleteTunnelConfigFile,
  getTunnelConfigFileName,
  getTunnelConfigLanguage,
  TUNNEL_CONFIG_FORMATS,
  type TunnelConfigFormat,
  saveTunnelConfigFile,
  validateTunnelConfigContent,
} from "@/utils/tunnelConfigFiles";

export function useTunnelConfigFiles() {
  const message = useMessage();

  const showConfigModal = ref(false);
  const currentConfigTunnelId = ref<number | null>(null);
  const configTypes = TUNNEL_CONFIG_FORMATS;
  const activeConfigType = ref<TunnelConfigFormat>(TUNNEL_CONFIG_FORMATS[0]);
  const configContents = ref<Partial<Record<TunnelConfigFormat, string>>>({});
  const editableConfigContents = ref<Partial<Record<TunnelConfigFormat, string>>>({});
  const loadingConfig = ref(false);
  const usingConfigFile = shallowRef<number[]>([]);
  const isEditingConfig = ref(false);

  let configFileStatusTimer: number | null = null;

  async function loadConfigFileStatus() {
    if (configFileStatusTimer) {
      clearTimeout(configFileStatusTimer);
    }

    configFileStatusTimer = window.setTimeout(async () => {
      try {
        const tunnelsWithConfig = await checkTunnelConfigFiles();
        usingConfigFile.value = tunnelsWithConfig;
      } catch (err) {
        console.error("加载配置文件状态失败:", err);
      }
    }, 100);
  }

  async function getTunnelConfig(tunnelId: number, format: TunnelConfigFormat) {
    try {
      loadingConfig.value = true;
      const result = await invokeTauriResponse<{ config?: string }>("api_get_tunnel_config", {
        proxyId: tunnelId,
        format,
      });

      if (result.code === 200 && result.data && result.data.config) {
        return result.data.config;
      }

      throw new Error(result.message || "获取配置文件失败");
    } catch (err) {
      console.error("获取配置文件失败:", err);
      message.error(extractErrorMessage(err, "获取配置文件失败"));
      return null;
    } finally {
      loadingConfig.value = false;
    }
  }

  async function saveConfigFile(tunnelId: number, format: TunnelConfigFormat, content: string) {
    try {
      const fileName = getTunnelConfigFileName(tunnelId, format);

      await Promise.all(
        configTypes
          .filter((configFormat) => configFormat !== format)
          .map((configFormat) =>
            deleteTunnelConfigFile(getTunnelConfigFileName(tunnelId, configFormat)).catch(() => {}),
          ),
      );

      await saveTunnelConfigFile(fileName, content);
      message.success(`配置文件已保存: ${fileName}，下次启动将使用配置文件模式`);

      await new Promise((resolve) => setTimeout(resolve, 100));
      await loadConfigFileStatus();

      showConfigModal.value = false;
    } catch (err) {
      console.error("保存配置文件失败:", err);
      message.error(extractErrorMessage(err, "保存配置文件失败"));
      await loadConfigFileStatus();
    }
  }

  async function useConfigFile(tunnelId: number) {
    currentConfigTunnelId.value = tunnelId;
    configContents.value = {};
    editableConfigContents.value = {};
    isEditingConfig.value = false;
    message.success("正在尝试获取配置文件内容,请等待", { duration: 8000 });

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
      message.error("无法获取配置文件");
    }
  }

  function startEditConfig() {
    isEditingConfig.value = true;
  }

  function cancelEditConfig() {
    isEditingConfig.value = false;
    editableConfigContents.value = { ...configContents.value };
  }

  async function saveEditedConfig() {
    if (!currentConfigTunnelId.value) {
      return;
    }

    try {
      const tunnelId = currentConfigTunnelId.value;
      const format = activeConfigType.value;
      const content = editableConfigContents.value[format];

      if (!content) {
        message.error("配置内容不能为空");
        return;
      }

      if (!validateTunnelConfigContent(content, format)) {
        message.error(`配置内容格式无效，请检查 ${format.toUpperCase()} 格式是否正确`);
        return;
      }

      await saveConfigFile(tunnelId, format, content);
      configContents.value[format] = content;
      isEditingConfig.value = false;
      message.success("配置文件修改成功");
    } catch (err) {
      console.error("保存配置失败:", err);
      message.error(extractErrorMessage(err, "保存配置失败"));
    }
  }

  async function handleConfigTypeChange(newType: TunnelConfigFormat) {
    if (!currentConfigTunnelId.value) {
      return;
    }

    const oldType = activeConfigType.value;
    if (oldType === newType) {
      return;
    }

    activeConfigType.value = newType;
    message.success(`已切换到 ${newType.toUpperCase()} 格式`);
  }

  async function viewConfigFile(tunnelId: number) {
    await useConfigFile(tunnelId);
  }

  async function switchToQuickStart(tunnelId: number) {
    try {
      await Promise.all(
        configTypes.map((format) => {
          const fileName = getTunnelConfigFileName(tunnelId, format);
          return deleteTunnelConfigFile(fileName).catch(() => {});
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 100));
      await loadConfigFileStatus();
      message.success("已切换到快速启动模式");
    } catch (err) {
      console.error("切换到快速启动失败:", err);
      message.error(extractErrorMessage(err, "切换到快速启动失败"));
      await loadConfigFileStatus();
    }
  }

  function getLanguageForFormat(format: TunnelConfigFormat): string {
    return getTunnelConfigLanguage(format);
  }

  onUnmounted(() => {
    if (configFileStatusTimer) {
      clearTimeout(configFileStatusTimer);
      configFileStatusTimer = null;
    }
  });

  return {
    showConfigModal,
    currentConfigTunnelId,
    configTypes,
    activeConfigType,
    configContents,
    editableConfigContents,
    loadingConfig,
    usingConfigFile,
    isEditingConfig,
    loadConfigFileStatus,
    getTunnelConfig,
    saveConfigFile,
    useConfigFile,
    startEditConfig,
    cancelEditConfig,
    saveEditedConfig,
    handleConfigTypeChange,
    viewConfigFile,
    switchToQuickStart,
    getLanguageForFormat,
  };
}
