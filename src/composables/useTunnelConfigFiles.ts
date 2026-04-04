import { onUnmounted, ref, shallowRef } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { useMessage } from "naive-ui";
import { invokeTauriResponse } from "@/utils/tauriResponse";
import { extractErrorMessage } from "@/utils/errorHandler";

export function useTunnelConfigFiles() {
  const message = useMessage();

  const showConfigModal = ref(false);
  const currentConfigTunnelId = ref<number | null>(null);
  const configTypes = ["toml", "json", "yml", "ini"];
  const activeConfigType = ref("toml");
  const configContents = ref<Record<string, string>>({});
  const editableConfigContents = ref<Record<string, string>>({});
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
        const tunnelsWithConfig = await invoke<number[]>("check_tunnel_config_files");
        usingConfigFile.value = tunnelsWithConfig;
      } catch (err) {
        console.error("加载配置文件状态失败:", err);
      }
    }, 100);
  }

  async function getTunnelConfig(tunnelId: number, format: string) {
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

  async function saveConfigFile(
    tunnelId: number,
    format: string,
    content: string,
  ) {
    try {
      const fileName = `${tunnelId}.${format}`;
      await invoke("save_config_file", {
        fileName,
        content,
      });
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

  function validateConfigContent(content: string, format: string): boolean {
    if (!content || content.trim() === "") {
      return false;
    }

    try {
      switch (format) {
        case "json":
          JSON.parse(content);
          break;
        case "toml":
        case "ini":
          if (!content.includes("=") && !content.includes("[")) {
            return false;
          }
          break;
        case "yml":
        case "yaml":
          if (!content.includes(":") && !content.includes("-")) {
            return false;
          }
          break;
      }
      return true;
    } catch {
      return false;
    }
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

      if (!validateConfigContent(content, format)) {
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

  async function handleConfigTypeChange(newType: string) {
    if (!currentConfigTunnelId.value) {
      return;
    }

    const oldType = activeConfigType.value;
    if (oldType === newType) {
      return;
    }

    try {
      const oldFileName = `${currentConfigTunnelId.value}.${oldType}`;
      await invoke("delete_config_file", { fileName: oldFileName }).catch(() => {});

      activeConfigType.value = newType;
      message.success(`已切换到 ${newType.toUpperCase()} 格式`);
    } catch (err) {
      console.error("切换配置文件类型失败:", err);
      message.error(extractErrorMessage(err, "切换配置文件类型失败"));
    }
  }

  async function viewConfigFile(tunnelId: number) {
    await useConfigFile(tunnelId);
  }

  async function switchToQuickStart(tunnelId: number) {
    try {
      await Promise.all(
        configTypes.map((format) => {
          const fileName = `${tunnelId}.${format}`;
          return invoke("delete_config_file", { fileName }).catch(() => {});
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

  function getLanguageForFormat(format: string): string {
    const languageMap: Record<string, string> = {
      toml: "toml",
      json: "json",
      yml: "yaml",
      ini: "ini",
    };
    return languageMap[format] || "text";
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
