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

function clampRange(value: number | null, min: number, max: number): number | null {
  if (value === null) {
    return null;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

function clampOpacity(value: number | null): number | null {
  return clampRange(value, 0, 100);
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
  let backgroundBlurDebounceTimer: number | null = null;
  let sidebarOpacityDebounceTimer: number | null = null;
  let contentOpacityDebounceTimer: number | null = null;
  let fontWeightDebounceTimer: number | null = null;
  let shadowIntensityDebounceTimer: number | null = null;
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

  function scheduleNumericSave(
    timer: number | null,
    nextValue: number,
    key:
      | "backgroundImageOpacity"
      | "backgroundBlur"
      | "sidebarOpacity"
      | "contentOpacity"
      | "fontWeight"
      | "shadowIntensity",
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
        message.error("保存外观设置失败");
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
    backgroundOpacityDebounceTimer = scheduleNumericSave(
      backgroundOpacityDebounceTimer,
      nextValue,
      "backgroundImageOpacity",
      `背景图片透明度已设置为 ${nextValue}%`,
    );
  }

  function handleBackgroundBlurChange(value: number | null) {
    const nextValue = clampRange(value, 0, 30);
    if (nextValue === null) {
      return;
    }

    settings.value.backgroundBlur = nextValue;
    backgroundBlurDebounceTimer = scheduleNumericSave(
      backgroundBlurDebounceTimer,
      nextValue,
      "backgroundBlur",
      `背景图片模糊已设置为 ${nextValue}px`,
    );
  }

  function handleSidebarOpacityChange(value: number | null) {
    const nextValue = clampOpacity(value);
    if (nextValue === null) {
      return;
    }

    settings.value.sidebarOpacity = nextValue;
    sidebarOpacityDebounceTimer = scheduleNumericSave(
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
    contentOpacityDebounceTimer = scheduleNumericSave(
      contentOpacityDebounceTimer,
      nextValue,
      "contentOpacity",
      `内容区透明度已设置为 ${nextValue}%`,
    );
  }

  function handleFontWeightChange(value: number | null) {
    const nextValue = clampRange(value, 300, 700);
    if (nextValue === null) {
      return;
    }

    settings.value.fontWeight = nextValue;
    fontWeightDebounceTimer = scheduleNumericSave(
      fontWeightDebounceTimer,
      nextValue,
      "fontWeight",
      `字体粗细已设置为 ${nextValue}`,
    );
  }

  function handleShadowIntensityChange(value: number | null) {
    const nextValue = clampRange(value, 0, 200);
    if (nextValue === null) {
      return;
    }

    settings.value.shadowIntensity = nextValue;
    shadowIntensityDebounceTimer = scheduleNumericSave(
      shadowIntensityDebounceTimer,
      nextValue,
      "shadowIntensity",
      `阴影强度已设置为 ${nextValue}%`,
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
      backgroundBlurDebounceTimer,
      sidebarOpacityDebounceTimer,
      contentOpacityDebounceTimer,
      fontWeightDebounceTimer,
      shadowIntensityDebounceTimer,
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
    handleBackgroundBlurChange,
    handleSidebarOpacityChange,
    handleContentOpacityChange,
    handleFontWeightChange,
    handleShadowIntensityChange,
    handleSidebarWidthChange,
    handleSidebarCollapsibleChange,
  };
}
