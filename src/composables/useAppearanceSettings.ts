import { computed, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useMessage } from "naive-ui";
import { useSettingsStore } from "@/stores/settings";
import { useUIStore } from "@/stores/ui";

const IMAGE_FILE_FILTER = [
  {
    name: "Image",
    extensions: ["png", "jpg", "jpeg", "webp", "bmp", "gif"],
  },
];

function clampOpacity(value: number | null): number | null {
  if (value === null) {
    return null;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function isManagedBackgroundPath(filePath?: string): filePath is string {
  return typeof filePath === "string" && filePath.startsWith("temp/");
}

export function useAppearanceSettings() {
  const message = useMessage();
  const settingsStore = useSettingsStore();
  const uiStore = useUIStore();
  const { settings } = storeToRefs(settingsStore);
  const { sidebarWidth, sidebarCollapsible } = storeToRefs(uiStore);

  const backgroundImageName = computed(() => {
    const filePath = settings.value.backgroundImagePath;
    if (!filePath) {
      return "未选择图片";
    }

    return filePath.split(/[\\/]/).pop() || filePath;
  });

  let backgroundOpacityDebounceTimer: number | null = null;
  let sidebarOpacityDebounceTimer: number | null = null;
  let contentOpacityDebounceTimer: number | null = null;
  let sidebarWidthDebounceTimer: number | null = null;

  async function removeManagedBackgroundFile(filePath?: string): Promise<void> {
    if (!isManagedBackgroundPath(filePath)) {
      return;
    }

    try {
      await invoke("remove_managed_background_image", {
        relativePath: filePath,
      });
    } catch (error) {
      console.error("清理旧背景图片失败:", error);
    }
  }

  async function handleBackgroundImageSelect() {
    try {
      const filePath = await open({
        multiple: false,
        directory: false,
        filters: IMAGE_FILE_FILTER,
      });

      if (!filePath || Array.isArray(filePath)) {
        return;
      }

      const previousPath = settings.value.backgroundImagePath;
      const managedPath = await invoke<string>("copy_background_image_to_temp", {
        sourcePath: filePath,
      });

      await settingsStore.updateSetting("backgroundImagePath", managedPath);
      await removeManagedBackgroundFile(previousPath);
      message.success("背景图片已更新");
    } catch (error) {
      console.error("选择背景图片失败:", error);
      message.error(`选择背景图片失败: ${error}`);
    }
  }

  async function handleBackgroundImageClear() {
    try {
      const previousPath = settings.value.backgroundImagePath;
      await settingsStore.updateSetting("backgroundImagePath", undefined);
      await removeManagedBackgroundFile(previousPath);
      message.success("背景图片已移除");
    } catch (error) {
      console.error("移除背景图片失败:", error);
      message.error("移除背景图片失败");
    }
  }

  function scheduleOpacitySave(
    timer: number | null,
    nextValue: number,
    key: "backgroundImageOpacity" | "sidebarOpacity" | "contentOpacity",
    successMessage: string,
  ): number {
    if (timer !== null) {
      clearTimeout(timer);
    }

    return window.setTimeout(async () => {
      try {
        await settingsStore.updateSetting(key, nextValue);
        message.success(successMessage);
      } catch (error) {
        console.error(`保存 ${key} 失败:`, error);
        message.error("保存透明度设置失败");
        await settingsStore.loadSettings();
      }
    }, 200);
  }

  function handleBackgroundImageOpacityChange(value: number | null) {
    const nextValue = clampOpacity(value);
    if (nextValue === null) {
      return;
    }

    settings.value.backgroundImageOpacity = nextValue;
    backgroundOpacityDebounceTimer = scheduleOpacitySave(
      backgroundOpacityDebounceTimer,
      nextValue,
      "backgroundImageOpacity",
      `背景图片透明度已设置为 ${nextValue}%`,
    );
  }

  function handleSidebarOpacityChange(value: number | null) {
    const nextValue = clampOpacity(value);
    if (nextValue === null) {
      return;
    }

    settings.value.sidebarOpacity = nextValue;
    sidebarOpacityDebounceTimer = scheduleOpacitySave(
      sidebarOpacityDebounceTimer,
      nextValue,
      "sidebarOpacity",
      `侧栏透明度已设置为 ${nextValue}%`,
    );
  }

  function handleContentOpacityChange(value: number | null) {
    const nextValue = clampOpacity(value);
    if (nextValue === null) {
      return;
    }

    settings.value.contentOpacity = nextValue;
    contentOpacityDebounceTimer = scheduleOpacitySave(
      contentOpacityDebounceTimer,
      nextValue,
      "contentOpacity",
      `内容区透明度已设置为 ${nextValue}%`,
    );
  }

  function handleSidebarWidthChange(value: number | null) {
    if (value === null) {
      return;
    }

    uiStore.setSidebarWidth(value);

    if (sidebarWidthDebounceTimer !== null) {
      clearTimeout(sidebarWidthDebounceTimer);
    }

    sidebarWidthDebounceTimer = window.setTimeout(async () => {
      try {
        await uiStore.saveSidebarSettings();
        message.success(`侧边栏宽度已设置为 ${value}px`);
      } catch (error) {
        console.error("保存侧边栏宽度失败:", error);
        message.error("保存侧边栏宽度失败");
        await uiStore.loadSidebarSettings();
      }
    }, 300);
  }

  async function handleSidebarCollapsibleChange(value: boolean) {
    try {
      await uiStore.updateSidebarCollapsible(value);
      message.success(value ? "已开启侧边栏收缩功能" : "已关闭侧边栏收缩功能");
    } catch (error) {
      console.error("保存侧边栏收缩设置失败:", error);
      message.error("保存侧边栏收缩设置失败");
    }
  }

  onUnmounted(() => {
    for (const timer of [
      backgroundOpacityDebounceTimer,
      sidebarOpacityDebounceTimer,
      contentOpacityDebounceTimer,
      sidebarWidthDebounceTimer,
    ]) {
      if (timer !== null) {
        clearTimeout(timer);
      }
    }
  });

  return {
    settings,
    sidebarWidth,
    sidebarCollapsible,
    backgroundImageName,
    handleBackgroundImageSelect,
    handleBackgroundImageClear,
    handleBackgroundImageOpacityChange,
    handleSidebarOpacityChange,
    handleContentOpacityChange,
    handleSidebarWidthChange,
    handleSidebarCollapsibleChange,
  };
}
