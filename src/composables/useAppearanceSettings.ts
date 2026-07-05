import { computed, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useMessage } from "naive-ui";
import { useSettingsStore } from "@/stores/settings";
import { useUIStore } from "@/stores/ui";
import { useSidebarSettingsHandlers } from "@/composables/useSidebarSettingsHandlers";
import { clampAppearanceOpacity, clampAppearanceRange } from "@/utils/appearanceSettings";

export const BACKGROUND_IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "jfif", "webp", "avif", "bmp", "gif", "svg", "ico"];

const IMAGE_FILE_FILTER = [
  {
    name: "Image",
    extensions: BACKGROUND_IMAGE_EXTENSIONS,
  },
];

function isManagedBackgroundPath(filePath?: string): filePath is string {
  return typeof filePath === "string" && filePath.startsWith("temp/");
}

export function useAppearanceSettings() {
  const message = useMessage();
  const settingsStore = useSettingsStore();
  const uiStore = useUIStore();
  const { settings } = storeToRefs(settingsStore);
  const {
    sidebarWidth,
    sidebarCollapsible,
    handleSidebarWidthChange,
    handleSidebarCollapsibleChange,
  } = useSidebarSettingsHandlers(uiStore, {
    success: (content) => message.success(content),
    error: (content) => message.error(content),
  });

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
    const nextValue = clampAppearanceOpacity(value, null);
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
    const nextValue = clampAppearanceRange(value, 0, 30, null);
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
    const nextValue = clampAppearanceOpacity(value, null);
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
    const nextValue = clampAppearanceOpacity(value, null);
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
    const nextValue = clampAppearanceRange(value, 300, 700, null);
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
    const nextValue = clampAppearanceRange(value, 0, 200, null);
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

  async function handleSidebarPositionChange(value: 'left' | 'top') {
    try {
      await settingsStore.updateSetting('sidebarPosition', value);
      message.success(`导航位置已切换为${value === 'left' ? '左侧' : '顶部'}`);
    } catch (error) {
      console.error('保存导航位置失败:', error);
      message.error('保存导航位置失败');
      await settingsStore.loadSettings();
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
    handleSidebarPositionChange,
  };
}
