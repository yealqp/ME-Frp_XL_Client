import { onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useUIStore } from "@/stores/ui";

interface SidebarSettingsFeedback {
  success: (message: string) => void;
  error: (message: string) => void;
}

export function useSidebarSettingsHandlers(
  uiStore: ReturnType<typeof useUIStore>,
  feedback: SidebarSettingsFeedback,
) {
  const { sidebarWidth, sidebarCollapsible } = storeToRefs(uiStore);

  let sidebarWidthDebounceTimer: number | null = null;

  function clearSidebarWidthTimer() {
    if (sidebarWidthDebounceTimer !== null) {
      clearTimeout(sidebarWidthDebounceTimer);
      sidebarWidthDebounceTimer = null;
    }
  }

  function handleSidebarWidthChange(value: number | null) {
    if (value === null) {
      return;
    }

    uiStore.setSidebarWidth(value);
    clearSidebarWidthTimer();

    sidebarWidthDebounceTimer = window.setTimeout(async () => {
      try {
        await uiStore.saveSidebarSettings();
        feedback.success(`侧边栏宽度已设置为 ${value}px`);
      } catch (error) {
        console.error("保存侧边栏宽度失败:", error);
        feedback.error("保存侧边栏宽度失败");
        await uiStore.loadSidebarSettings();
      }
    }, 300);
  }

  async function handleSidebarCollapsibleChange(value: boolean) {
    try {
      await uiStore.updateSidebarCollapsible(value);
      feedback.success(value ? "已开启侧边栏收缩功能" : "已关闭侧边栏收缩功能");
    } catch (error) {
      console.error("保存侧边栏收缩设置失败:", error);
      feedback.error("保存侧边栏收缩设置失败");
    }
  }

  onUnmounted(() => {
    clearSidebarWidthTimer();
  });

  return {
    sidebarWidth,
    sidebarCollapsible,
    handleSidebarWidthChange,
    handleSidebarCollapsibleChange,
  };
}
