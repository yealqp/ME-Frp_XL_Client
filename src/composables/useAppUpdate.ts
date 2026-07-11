import { ref, computed } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { useMessage } from "naive-ui";
import type { UpdateCheckResult } from "@/types/update";
import { parseMarkdown } from "@/utils/markdownParser";

export function useAppUpdate(options?: { silent?: boolean }) {
  const message = useMessage();
  const silent = options?.silent ?? false;

  const updateChecking = ref(false);
  const showUpdateModal = ref(false);
  const latestVersion = ref("");
  const currentVersion = ref("");
  const updateInfo = ref<string[]>([]);
  const changelog = ref<Record<string, string[]>>({});
  const changelogLoading = ref(false);
  const showChangelogModal = ref(false);

  const sortedChangelog = computed(() => {
    const versions = Object.keys(changelog.value);
    return versions.sort((a, b) => {
      const partsA = a.split(".").map(Number);
      const partsB = b.split(".").map(Number);
      for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
        const numA = partsA[i] || 0;
        const numB = partsB[i] || 0;
        if (numA !== numB) return numB - numA;
      }
      return 0;
    });
  });

  const applyUpdateResult = (result: UpdateCheckResult) => {
    latestVersion.value = result.latest_version;
    currentVersion.value = result.current_version;
    updateInfo.value = result.update_info || [];
    changelog.value = result.changelog || {};
  };

  const checkForUpdates = async (opts?: { silent?: boolean }) => {
    const isSilent = opts?.silent ?? silent;
    updateChecking.value = true;
    try {
      const result = (await invoke("check_for_updates")) as UpdateCheckResult;
      applyUpdateResult(result);

      if (result.has_update) {
        showUpdateModal.value = true;
      } else if (!isSilent) {
        message.success(`当前已是最新版本 ${result.current_version}`);
      }
    } catch (error) {
      if (!isSilent) {
        message.error(`检查更新失败: ${error}`);
      } else {
        console.error("检查更新失败:", error);
      }
    } finally {
      updateChecking.value = false;
    }
  };

  const parseUpdateInfo = (infoArray: string[]): string => {
    if (!infoArray || infoArray.length === 0) {
      return "<p>暂无更新信息</p>";
    }

    const markdownContent = infoArray.join("\n");

    return parseMarkdown(markdownContent);
  };

  const viewChangelog = async () => {
    changelogLoading.value = true;
    try {
      const result = (await invoke("get_update_history")) as UpdateCheckResult;
      applyUpdateResult(result);
      showChangelogModal.value = true;
    } catch (error) {
      message.error(`获取更新历史失败: ${error}`);
    } finally {
      changelogLoading.value = false;
    }
  };

  const handleUpdate = async () => {
    try {
      showUpdateModal.value = false;
      message.loading("正在下载更新...", { duration: 0 });

      await invoke("download_and_install_update", {
        version: latestVersion.value,
      });

      message.destroyAll();
      message.success("安装程序已启动，应用即将关闭");

      setTimeout(() => {
        invoke("quit_app");
      }, 2000);
    } catch (error) {
      message.destroyAll();
      message.error(`更新失败: ${error}`);
    }
  };

  const handleCancelUpdate = () => {
    showUpdateModal.value = false;
    if (!silent) {
      message.info("已取消更新，下次启动时会再次检查");
    }
  };

  return {
    updateChecking,
    showUpdateModal,
    latestVersion,
    currentVersion,
    updateInfo,
    changelog,
    changelogLoading,
    showChangelogModal,
    sortedChangelog,
    checkForUpdates,
    parseUpdateInfo,
    viewChangelog,
    handleUpdate,
    handleCancelUpdate,
  };
}
