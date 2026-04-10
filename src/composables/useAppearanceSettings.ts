import { computed, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { open } from "@tauri-apps/plugin-dialog";
import { useMessage } from "naive-ui";
import { useSettingsStore } from "@/stores/settings";

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

export function useAppearanceSettings() {
  const message = useMessage();
  const settingsStore = useSettingsStore();
  const { settings } = storeToRefs(settingsStore);

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

      await settingsStore.updateSetting("backgroundImagePath", filePath);
      message.success("背景图片已更新");
    } catch (error) {
      console.error("选择背景图片失败:", error);
      message.error("选择背景图片失败");
    }
  }

  async function handleBackgroundImageClear() {
    try {
      await settingsStore.updateSetting("backgroundImagePath", undefined);
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

  onUnmounted(() => {
    for (const timer of [
      backgroundOpacityDebounceTimer,
      sidebarOpacityDebounceTimer,
      contentOpacityDebounceTimer,
    ]) {
      if (timer !== null) {
        clearTimeout(timer);
      }
    }
  });

  return {
    settings,
    backgroundImageName,
    handleBackgroundImageSelect,
    handleBackgroundImageClear,
    handleBackgroundImageOpacityChange,
    handleSidebarOpacityChange,
    handleContentOpacityChange,
  };
}
