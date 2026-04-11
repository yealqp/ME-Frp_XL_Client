import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { storeToRefs } from "pinia";
import { useMessage, useNotification } from "naive-ui";
import { AlertTriangle, CheckCircle, HelpCircle, XCircle } from "lucide-vue-next";
import { useUserStore } from "@/stores/user";
import { useUIStore } from "@/stores/ui";
import { handleApiError } from "@/utils/errorHandler";
import { useCaptchaVerifier } from "@/composables/useCaptchaVerifier";

interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
}

interface SystemStatus {
  status: number;
  remark: string;
}

interface PopupNoticeResponse {
  code: number;
  data: string;
  message: string;
}

let dashboardInitializedOnce = false;
let dashboardInitPromise: Promise<void> | null = null;

const CACHE_DURATION = 5 * 60 * 1000;

function getDefaultAnnouncement(title: string, content: string): Announcement {
  return {
    id: 1,
    title,
    content,
    date: new Date().toISOString().split("T")[0],
  };
}

function normalizeAnnouncements(noticeData: unknown): Announcement[] {
  if (!noticeData) {
    return [getDefaultAnnouncement("暂无公告", "当前没有系统公告。")];
  }

  if (typeof noticeData === "string") {
    return [getDefaultAnnouncement("系统公告", noticeData)];
  }

  if (Array.isArray(noticeData) && noticeData.length > 0) {
    return noticeData.map((item: any, index: number) => ({
      id: index + 1,
      title: item.title || item.subject || "系统公告",
      content: item.content || item.message || item.body || "暂无内容",
      date: item.date || item.created_at || item.time || new Date().toISOString().split("T")[0],
    }));
  }

  if (typeof noticeData === "object" && noticeData !== null && "data" in noticeData) {
    const data = (noticeData as { data?: unknown }).data;
    const noticesArray = Array.isArray(data) ? data : [data];

    return noticesArray.map((notice: any, index: number) => ({
      id: notice?.id || index + 1,
      title: notice?.title || notice?.name || notice?.subject || "系统公告",
      content: notice?.content || notice?.message || notice?.text || "",
      date:
        notice?.date ||
        notice?.created_at ||
        notice?.time ||
        new Date().toISOString().split("T")[0],
    }));
  }

  return [getDefaultAnnouncement("系统公告", String(noticeData))];
}

export function useDashboardState() {
  const userStore = useUserStore();
  const uiStore = useUIStore();
  const message = useMessage();
  const notification = useNotification();
  const { userInfo, loading: userInfoLoading } = storeToRefs(userStore);

  const announcements = ref<Announcement[]>([]);
  const systemStatus = ref<SystemStatus>({
    status: 0,
    remark: "正在获取系统状态...",
  });
  const systemStatusLoaded = ref(false);
  const showImportantNotice = ref(false);
  const popupNoticeContent = ref("");
  const popupNoticeLoading = ref(false);
  const announcementsLoading = ref(true);
  const hasAutoSigned = ref(false);
  const announcementsCache = ref<{ data: Announcement[]; timestamp: number }>({
    data: [],
    timestamp: 0,
  });

  const { verifyCaptcha } = useCaptchaVerifier({
    onError: (error) => {
      console.error("自动签到验证错误:", error);
    },
  });

  function isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_DURATION;
  }

  async function fetchAnnouncements(forceRefresh = false) {
    if (
      !forceRefresh &&
      announcementsCache.value.data.length > 0 &&
      isCacheValid(announcementsCache.value.timestamp)
    ) {
      announcements.value = announcementsCache.value.data;
      announcementsLoading.value = false;
      return;
    }

    announcementsLoading.value = true;

    try {
      const noticeData = await invoke<unknown>("api_get_announcements");
      announcements.value = normalizeAnnouncements(noticeData);
      announcementsCache.value = {
        data: announcements.value,
        timestamp: Date.now(),
      };
    } catch (error) {
      const errorMessage = handleApiError(error, "获取系统公告失败", "获取系统公告失败");
      message.error(errorMessage);

      if (announcementsCache.value.data.length > 0) {
        announcements.value = announcementsCache.value.data;
      } else {
        announcements.value = [
          getDefaultAnnouncement("获取公告失败", "无法从服务器获取最新公告，请检查网络连接或稍后重试。"),
        ];
      }
    } finally {
      announcementsLoading.value = false;
    }
  }

  function getStatusClass(): string {
    switch (systemStatus.value.status) {
      case 0:
        return "status-normal";
      case 1:
        return "status-degraded";
      case 2:
        return "status-offline";
      default:
        return "status-unknown";
    }
  }

  function getStatusIcon() {
    switch (systemStatus.value.status) {
      case 0:
        return CheckCircle;
      case 1:
        return AlertTriangle;
      case 2:
        return XCircle;
      default:
        return HelpCircle;
    }
  }

  function getStatusLabel(): string {
    switch (systemStatus.value.status) {
      case 0:
        return "服务运行正常";
      case 1:
        return "服务降级";
      case 2:
        return "服务离线";
      default:
        return "状态未知";
    }
  }

  async function fetchSystemStatus() {
    try {
      const responseText = await invoke<string>("api_get_system_status");
      const result = JSON.parse(responseText) as { code: number; message?: string; data?: SystemStatus };

      if (result.code === 200 && result.data) {
        systemStatus.value = {
          status: result.data.status,
          remark: result.data.remark,
        };
        systemStatusLoaded.value = true;
        return;
      }

      console.error("获取系统状态失败:", result.message);
      systemStatusLoaded.value = false;
    } catch (error) {
      console.error("获取系统状态失败:", error);
      systemStatusLoaded.value = false;
    }
  }

  function getAnnouncementCardClass(announcement: { content?: string }): string {
    const contentLength = announcement.content?.length || 0;

    if (contentLength > 200) {
      return "announcement-large";
    }

    if (contentLength > 100) {
      return "announcement-medium";
    }

    return "announcement-small";
  }

  async function fetchPopupNotice() {
    popupNoticeLoading.value = true;

    try {
      const responseText = await invoke<string>("api_get_popup_notice");

      try {
        const result = JSON.parse(responseText) as PopupNoticeResponse;
        if (result.code === 200 && result.data) {
          popupNoticeContent.value = result.data;
          showImportantNotice.value = true;
        }
      } catch {
        // 解析失败时静默忽略，保持原行为
      }
    } catch {
      // 静默处理错误，不影响用户体验
    } finally {
      popupNoticeLoading.value = false;
    }
  }

  function closeImportantNotice() {
    showImportantNotice.value = false;
  }

  async function autoSign() {
    if (hasAutoSigned.value || !userInfo.value) {
      return;
    }

    if (userInfo.value.todaySigned) {
      hasAutoSigned.value = true;
      return;
    }

    message.success("正在尝试自动签到", { duration: 8000 });
    hasAutoSigned.value = true;

    try {
      const token = await verifyCaptcha();
      const responseText = await invoke<string>("api_user_sign", {
        captchaToken: token,
      });
      const result = JSON.parse(responseText) as {
        code: number;
        message?: string;
        data?: { extraTraffic?: number };
      };

      if (result.code === 200) {
        const trafficGB = result.data?.extraTraffic || 0;
        let successMessage = "自动签到成功！";

        if (trafficGB > 0) {
          successMessage = `自动签到成功，获得 ${trafficGB} GB 流量！`;
        } else if (result.message) {
          successMessage = result.message;
        }

        message.success(successMessage);
        await userStore.loadUserInfo(true);
      }
    } catch (error) {
      console.error("自动签到过程出错:", error);
    }
  }

  async function initializeDashboard() {
    if (dashboardInitializedOnce) {
      return;
    }

    if (!dashboardInitPromise) {
      dashboardInitPromise = (async () => {
        fetchSystemStatus();
        await userStore.loadUserInfo();
        await autoSign();
        fetchAnnouncements();
        fetchPopupNotice();
        await uiStore.fetchAndShowNotification(notification);
        dashboardInitializedOnce = true;
      })().finally(() => {
        dashboardInitPromise = null;
      });
    }

    await dashboardInitPromise;
  }

  return {
    userStore,
    userInfo,
    userInfoLoading,
    announcements,
    announcementsLoading,
    systemStatus,
    systemStatusLoaded,
    showImportantNotice,
    popupNoticeContent,
    getStatusClass,
    getStatusIcon,
    getStatusLabel,
    getAnnouncementCardClass,
    closeImportantNotice,
    initializeDashboard,
  };
}
