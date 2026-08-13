import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useMessage, useNotification } from "naive-ui";
import { AlertTriangle, CheckCircle, HelpCircle, XCircle } from "@lucide/vue";
import { useUserStore } from "@/stores/user";
import { useUIStore } from "@/stores/ui";
import { handleApiError } from "@/utils/errorHandler";
import { useCaptchaVerifier } from "@/composables/useCaptchaVerifier";
import { useAuthStore } from "@/stores/auth";
import { getAnnouncements, getSystemStatus, getPopupNotice } from "@/api/system";
import { userSign } from "@/api/auth";

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
  const authStore = useAuthStore();
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
      const res = await getAnnouncements(authStore.userToken);
      const noticeData = res.code === 200 ? res.data : null;
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
      const res = await getSystemStatus(authStore.userToken);
      const responseData = res.data;
      if (!responseData || typeof responseData !== 'object') {
        throw new Error('系统状态数据格式错误');
      }
      const data = responseData as SystemStatus;
      systemStatus.value = {
        status: data.status,
        remark: data.remark,
      };
      systemStatusLoaded.value = true;
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
      const res = await getPopupNotice(authStore.userToken);
      if (res.data) {
        popupNoticeContent.value = res.data;
        showImportantNotice.value = true;
      }
    } catch (error) {
      console.error("获取弹窗公告失败:", error);
    } finally {
      popupNoticeLoading.value = false;
    }
  }

  function closeImportantNotice() {
    showImportantNotice.value = false;
  }

  async function autoSign() {
    if (hasAutoSigned.value) {
      return;
    }

    // 确保用户信息已加载，获取 todaySigned 状态
    if (!userInfo.value) {
      try {
        await userStore.loadUserInfo();
      } catch {
        // 用户信息加载失败，无法判断是否已签到，跳过本次自动签到
        return;
      }
    }

    if (userInfo.value?.todaySigned) {
      hasAutoSigned.value = true;
      message.warning("今日已签到，跳过自动签到");
      return;
    }

    hasAutoSigned.value = true;

    try {
      const token = await verifyCaptcha();
      const result = await userSign(authStore.userToken, token);
      const signData = result.data;
      const extraTraffic = signData && typeof signData === 'object' && 'extraTraffic' in signData
        ? Number((signData as Record<string, unknown>).extraTraffic) || 0
        : 0;

      if (extraTraffic > 0) {
        message.success(`自动签到成功，获得 ${extraTraffic} GB 流量！`);
      } else {
        message.success("自动签到成功");
      }

      await userStore.loadUserInfo(true);
    } catch (error) {
      console.error("自动签到过程出错:", error);
      message.error("自动签到失败，请稍后手动签到");
    }
  }

  async function initializeDashboard() {
    // Fire all independent tasks in parallel (non-blocking)
    fetchSystemStatus().catch(err => console.error("获取系统状态失败:", err));
    fetchAnnouncements().catch(err => console.error("获取公告失败:", err));
    fetchPopupNotice().catch(err => console.error("获取弹窗公告失败:", err));
    // Notification runs independently; errors are logged but do not block
    uiStore.fetchAndShowNotification(notification).catch(err =>
      console.error("Notification error:", err)
    );

    // 先加载用户信息，再自动签到：
    // autoSign 内部依赖 userInfo.todaySigned 判断是否已签到，
    // 串行执行避免两个请求并发重复拉取用户信息
    (async () => {
      await userStore.loadUserInfo().catch(err =>
        console.error("加载用户信息失败:", err),
      );
      await autoSign().catch(err => console.error("Auto sign error:", err));
    })();
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
