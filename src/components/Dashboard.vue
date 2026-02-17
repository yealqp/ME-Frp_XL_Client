<template>
  <div class="dashboard">
    <!-- 欢迎信息 -->
    <div class="welcome-header">
      <h2 class="welcome-text">
        欢迎回来，{{ userInfoLoading ? "加载中..." : (userInfo?.username || "用户") }}
      </h2>
    </div>

    <div class="dashboard-grid">
      <!-- 左侧列 -->
      <div class="left-column">
        <!-- 重要公告警告框 -->
        <n-alert
          v-if="showImportantNotice && popupNoticeContent"
          type="warning"
          closable
          @close="closeImportantNotice"
          class="important-notice-alert"
        >
          <template #header>
            <span class="alert-title">重要公告</span>
          </template>
          <div class="markdown-content" v-html="parseMarkdown(popupNoticeContent)"></div>
        </n-alert>

        <!-- 系统状态卡片 -->
        <div
          v-if="systemStatusLoaded"
          class="system-status-card"
          :class="getStatusClass()"
        >
          <div class="status-content">
            <div class="status-dot"></div>
            <div class="status-text">
              <div class="status-title">{{ getStatusLabel() }}</div>
              <div class="status-description">
                {{ systemStatus.remark || "正在获取系统状态..." }}
              </div>
            </div>
            <div class="status-check-icon">
              <component :is="getStatusIcon()" :size="18" />
            </div>
          </div>
        </div>

        <!-- 用户信息卡片 -->
        <UserInfoCard
          :user-info="userInfo"
          :loading="userInfoLoading"
          :user-info-loading="userInfoLoading"
          title="用户信息"
          @refresh="userStore.loadUserInfo"
        />

        <!-- 统计信息卡片 -->
        <StatisticsCard />
      </div>

      <!-- 右侧系统公告卡片 -->
      <div class="announcements-container">
        <template v-if="announcementsLoading">
          <n-card title="系统公告" :bordered="true" class="announcement-card">
            <template #header-extra>
              <n-skeleton text style="width: 80px" />
            </template>
            <n-skeleton text :repeat="3" />
            <n-skeleton text style="width: 60%" />
          </n-card>
        </template>
        <template v-else>
          <n-card
            v-for="announcement in announcements"
            :key="announcement.id"
            :title="announcement.title"
            :bordered="true"
            class="announcement-card"
            :class="getAnnouncementCardClass(announcement)"
          >
            <div class="markdown-content" v-html="parseMarkdown(announcement.content)"></div>
          </n-card>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { useMessage, useNotification } from "naive-ui";
import { storeToRefs } from "pinia";
import { useUserStore } from "../stores/user";
import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from "lucide-vue-next";
import { parseMarkdown } from "@/utils/markdownParser";
import { handleApiError } from "@/utils/errorHandler";
import { createCaptcha } from "@/utils/captcha";
import UserInfoCard from "./common/UserInfoCard.vue";
import StatisticsCard from "./common/StatisticsCard.vue";

// Initialize User Store
const userStore = useUserStore();
const { userInfo, loading: userInfoLoading } = storeToRefs(userStore);

// Initialize notification
const notification = useNotification();

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

// 系统公告数据
const announcements = ref<Announcement[]>([]);

// 系统状态数据
const systemStatus = ref<SystemStatus>({
  status: 0,
  remark: "正在获取系统状态...",
});

// 系统状态是否已加载
const systemStatusLoaded = ref(false);

// 重要公告相关
const showImportantNotice = ref(false); // 控制重要公告警告框显示
const popupNoticeContent = ref("");
const popupNoticeLoading = ref(false);

// 加载状态
const announcementsLoading = ref(true);
const message = useMessage();

// 缓存相关
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存时间
const announcementsCache = ref<{ data: Announcement[]; timestamp: number }>({
  data: [],
  timestamp: 0,
});

// 检查缓存是否有效
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION;
};

// 获取系统公告
const fetchAnnouncements = async (forceRefresh: boolean = false) => {
  // 检查缓存是否有效且不强制刷新
  if (
    !forceRefresh &&
    announcementsCache.value.data.length > 0 &&
    isCacheValid(announcementsCache.value.timestamp)
  ) {
    announcements.value = announcementsCache.value.data;
    announcementsLoading.value = false;
    console.log("使用缓存的系统公告");
    return;
  }

  announcementsLoading.value = true;
  try {
    // 调用后端API命令获取系统公告
    const noticeData: any = await invoke("api_get_announcements");

    console.log("获取系统公告成功");

    // 处理公告数据
    if (noticeData) {
      // 如果返回的是字符串，将其作为单个公告处理
      if (typeof noticeData === "string") {
        announcements.value = [
          {
            id: 1,
            title: "系统公告",
            content: noticeData,
            date: new Date().toISOString().split("T")[0],
          },
        ];
      } else if (Array.isArray(noticeData) && noticeData.length > 0) {
        // 如果返回的是数组格式
        announcements.value = noticeData.map((item: any, index: number) => ({
          id: index + 1,
          title: item.title || item.subject || "系统公告",
          content: item.content || item.message || item.body || "暂无内容",
          date:
            item.date ||
            item.created_at ||
            item.time ||
            new Date().toISOString().split("T")[0],
        }));
      } else if ((noticeData as any).data) {
        // 如果返回的是对象格式
        const noticesArray = Array.isArray((noticeData as any).data)
          ? (noticeData as any).data
          : [(noticeData as any).data];

        announcements.value = noticesArray.map(
          (notice: any, index: number) => ({
            id: notice.id || index + 1,
            title: notice.title || notice.name || notice.subject || "系统公告",
            content: notice.content || notice.message || notice.text || "",
            date:
              notice.date ||
              notice.created_at ||
              notice.time ||
              new Date().toISOString().split("T")[0],
          }),
        );
      } else {
        // 如果是其他格式，尝试直接处理
        announcements.value = [
          {
            id: 1,
            title: "系统公告",
            content: String(noticeData),
            date: new Date().toISOString().split("T")[0],
          },
        ];
      }
    } else {
      // 如果没有公告数据，显示提示信息
      announcements.value = [
        {
          id: 1,
          title: "暂无公告",
          content: "当前没有系统公告。",
          date: new Date().toISOString().split("T")[0],
        },
      ];
    }

    // 更新缓存
    announcementsCache.value = {
      data: announcements.value,
      timestamp: Date.now(),
    };
  } catch (error) {
    const errorMessage = handleApiError(error, "获取系统公告失败", "获取系统公告失败");
    message.error(errorMessage);

    // 如果有缓存数据，使用缓存数据
    if (announcementsCache.value.data.length > 0) {
      announcements.value = announcementsCache.value.data;
      console.log("API请求失败，使用缓存的系统公告");
    } else {
      // 如果没有缓存，显示错误信息
      announcements.value = [
        {
          id: 1,
          title: "获取公告失败",
          content: "无法从服务器获取最新公告，请检查网络连接或稍后重试。",
          date: new Date().toISOString().split("T")[0],
        },
      ];
    }
  } finally {
    announcementsLoading.value = false;
  }
};

// 获取系统状态类名
const getStatusClass = (): string => {
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
};

// 获取系统状态图标组件
const getStatusIcon = () => {
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
};

// 获取系统状态标签
const getStatusLabel = (): string => {
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
};

// 获取系统状态
const fetchSystemStatus = async () => {
  try {
    const responseText = await invoke("api_get_system_status");
    const result = JSON.parse(responseText as string);

    if (result.code === 200) {
      systemStatus.value = {
        status: result.data.status,
        remark: result.data.remark,
      };
      systemStatusLoaded.value = true;
      console.log("获取系统状态成功:", systemStatus.value);
    } else {
      console.error("获取系统状态失败:", result.message);
      systemStatusLoaded.value = false;
    }
  } catch (error) {
    console.error("获取系统状态失败:", error);
    systemStatusLoaded.value = false;
  }
};

// 初始化markdown-it已移除，使用 parseMarkdown 工具函数

// 根据内容长度计算公告卡片的CSS类
const getAnnouncementCardClass = (announcement: any): string => {
  const contentLength = announcement.content?.length || 0;

  if (contentLength > 200) {
    return "announcement-large";
  } else if (contentLength > 100) {
    return "announcement-medium";
  } else {
    return "announcement-small";
  }
};

// 获取弹窗公告（改为获取重要公告）
const fetchPopupNotice = async () => {
  popupNoticeLoading.value = true;

  try {
    const responseText = await invoke("api_get_popup_notice");

    // 尝试解析 JSON
    try {
      const result: PopupNoticeResponse = JSON.parse(responseText as string);

      if (result.code === 200 && result.data) {
        popupNoticeContent.value = result.data;
        showImportantNotice.value = true; // 显示警告框
      } else {
        console.log("重要公告:", result.message || "无公告内容");
      }
    } catch (parseError) {
      // 如果解析失败，可能是纯文本响应
      console.log("重要公告响应格式异常，跳过显示");
    }
  } catch (error) {
    // 静默处理错误，不影响用户体验
    console.log("获取重要公告:", error);
  } finally {
    popupNoticeLoading.value = false;
  }
};

// 关闭重要公告警告框
const closeImportantNotice = () => {
  showImportantNotice.value = false;
  // 不再记录到 localStorage，每次进入页面都会显示
};

// 自动签到标志（确保只执行一次）
const hasAutoSigned = ref(false);

// 自动签到的函数
const autoSign = async () => {
  // 如果已经执行过自动签到，跳过
  if (hasAutoSigned.value) {
    return;
  }

  // 如果用户信息还没加载，跳过
  if (!userInfo.value) {
    return;
  }

  // 如果今天已经签到过，跳过
  if (userInfo.value.todaySigned) {
    message.success("已签到，跳过自动签到");
    console.log("今天已经签到过了，跳过自动签到");
    hasAutoSigned.value = true;
    return;
  }
  message.success("正在尝试自动签到", {duration: 8000});
  console.log("开始自动签到...");
  hasAutoSigned.value = true;

  try {
    // 创建签到验证码实例
    const signCaptchaInstance = createCaptcha({
      onProgress: (progress) => console.log(`自动签到验证进度: ${progress}%`),
      onError: (error) => {
        console.error("自动签到验证错误:", error);
        // 错误不弹出 message
      },
    });

    // 执行人机验证
    const token = await signCaptchaInstance.verify();
    
    // 使用 token 进行签到
    try {
      const responseText = await invoke("api_user_sign", {
        captchaToken: token,
      });

      const result = JSON.parse(responseText as string);

      if (result.code === 200) {
        const trafficGB = result.data?.extraTraffic || 0;
        let successMessage = "自动签到成功！";
        if (trafficGB > 0) {
          successMessage = `自动签到成功，获得 ${trafficGB} GB 流量！`;
        } else if (result.message) {
          successMessage = result.message;
        }

        console.log(successMessage);
        // 只在成功时显示消息
        message.success(successMessage);
        
        // 刷新用户信息
        await userStore.loadUserInfo();
      } else {
        console.log("自动签到失败:", result.message);
        // 失败不弹出 message
      }
    } catch (error) {
      console.error("自动签到失败:", error);
      // 错误不弹出 message
    }
  } catch (error) {
    console.error("自动签到过程出错:", error);
    // 错误不弹出 message
  }
};

// 获取并显示通知
const fetchAndShowNotification = async () => {
  try {
    // 使用 Tauri 的 HTTP 客户端获取通知内容
    const response = await invoke("api_request", {
      url: "https://check.yealqp.cn/notification.md",
      method: "GET",
    }) as string;

    if (response && response.trim()) {
      // 解析 Markdown 内容
      const htmlContent = parseMarkdown(response);
      
      // 显示通知
      notification.create({
        title: "系统通知",
        content: () => {
          const div = document.createElement('div');
          div.innerHTML = htmlContent;
          div.className = 'notification-content';
          return div;
        },
        duration: 10000, // 10秒后自动关闭
        closable: true,
        keepAliveOnHover: true,
      });
      
      console.log("通知已显示");
    }
  } catch (error) {
    console.error("获取通知失败:", error);
    // 静默失败，不影响用户体验
  }
};

// 组件挂载时获取用户信息和系统公告
onMounted(async () => {
  fetchSystemStatus();
  await userStore.loadUserInfo();
  
  // 用户信息加载完成后，尝试自动签到
  autoSign();
  
  fetchAnnouncements();
  fetchPopupNotice(); // 获取重要公告
  
  // 获取并显示通知
  fetchAndShowNotification();
});
</script>

<style scoped>
.dashboard {
  padding: 0;
}

/* 重要公告警告框样式 */
.important-notice-alert {
  border-radius: 0;
}

.important-notice-alert .alert-title {
  font-size: 16px;
  font-weight: 600;
}

/* 系统状态卡片 */
.system-status-card {
  border-radius: 0;
  padding: 18px 28px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

/* 使用伪元素创建渐变边框 */
.system-status-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 1px;
  border-radius: 0;
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.system-status-card.status-normal {
  background: linear-gradient(to right, #1e2a1e, #151515);
}

.system-status-card.status-normal::before {
  background: linear-gradient(to right, #2d5a2d, #1a3a1a);
}

.system-status-card.status-degraded {
  background: linear-gradient(to right, #2a2618, #151515);
}

.system-status-card.status-degraded::before {
  background: linear-gradient(to right, #5a4d1a, #3a3010);
}

.system-status-card.status-offline {
  background: linear-gradient(to right, #2a1818, #151515);
}

.system-status-card.status-offline::before {
  background: linear-gradient(to right, #5a2020, #3a1010);
}

.system-status-card.status-unknown {
  background: linear-gradient(to right, #1a1a1a, #151515);
}

.system-status-card.status-unknown::before {
  background: linear-gradient(to right, #333, #1a1a1a);
}

.status-content {
  display: flex;
  align-items: center;
  gap: 24px;
}

/* 左侧状态圆点 */
.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-normal .status-dot {
  background-color: #4caf50;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.6);
}

.status-degraded .status-dot {
  background-color: #d4a017;
  box-shadow: 0 0 10px rgba(212, 160, 23, 0.6);
}

.status-offline .status-dot {
  background-color: #ff4444;
  box-shadow: 0 0 10px rgba(255, 68, 68, 0.6);
}

.status-unknown .status-dot {
  background-color: #666;
}

/* 中间文字内容 */
.status-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-title {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
}

.status-normal .status-title {
  color: #4caf50;
}

.status-degraded .status-title {
  color: #d4a017;
}

.status-offline .status-title {
  color: #ff4444;
}

.status-unknown .status-title {
  color: #666;
}

.status-description {
  font-size: 15px;
  line-height: 1.4;
}

.status-normal .status-description {
  color: #5cb85c;
}

.status-degraded .status-description {
  color: #c9a959;
}

.status-offline .status-description {
  color: #ff6666;
}

.status-unknown .status-description {
  color: #999;
}

/* 右侧勾选图标 */
.status-check-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid;
}

.status-normal .status-check-icon {
  background-color: transparent;
  border-color: #4caf50;
  color: #4caf50;
}

.status-degraded .status-check-icon {
  background-color: transparent;
  border-color: #d4a017;
  color: #d4a017;
}

.status-offline .status-check-icon {
  background-color: transparent;
  border-color: #ff4444;
  color: #ff4444;
}

.status-unknown .status-check-icon {
  background-color: transparent;
  border-color: #666;
  color: #666;
}

/* 欢迎信息样式 */
.welcome-header {
  margin-bottom: 20px;
  padding: 0 4px;
}

.welcome-text {
  font-size: 28px;
  font-weight: 600;
  color: #4b4949;
  margin: 0;
  text-align: left;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

/* 用户信息卡片样式 */
.user-profile {
  display: flex;
  flex-direction: column;
}

.user-info-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 30px;
  row-gap: 10px;
  column-gap: 60px;
}

.user-info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #18181c;
  border-radius: 8px;
}

.user-info-value {
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .user-info-grid {
    grid-template-columns: 1fr;
  }
}

/* 系统公告容器样式 */
.announcements-container {
  padding-right: 8px;
}

/* 系统公告卡片样式 */
.announcement-card {
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.announcement-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.announcement-card:last-child {
  margin-bottom: 0;
}

/* 动态卡片大小 */
.announcement-small {
  min-height: 120px;
}

.announcement-medium {
  min-height: 160px;
}

.announcement-large {
  min-height: 200px;
}

/* 卡片头部额外内容样式 */
.announcement-card .n-card-header__extra {
  display: flex;
  align-items: center;
  gap: 12px;
}

.announcement-date {
  color: #999;
  font-size: 12px;
  white-space: nowrap;
}

.announcement-card .n-card__content {
  line-height: 1.6;
  font-size: 14px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* 对话框中的验证组件样式 */
:deep(.n-dialog .captcha-verify-wrapper) {
  width: 100% !important;
}

:deep(.n-dialog cap-widget) {
  width: 100% !important;
  display: block !important;
}

:deep(.n-dialog cap-widget > div) {
  width: 100% !important;
  max-width: 100% !important;
}

:deep(.n-dialog cap-widget div) {
  max-width: 100% !important;
}

/* 通知内容样式 */
:deep(.notification-content) {
  line-height: 1.8;
  font-size: 14px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-height: 400px;
  overflow-y: auto;
}

:deep(.notification-content h1),
:deep(.notification-content h2),
:deep(.notification-content h3),
:deep(.notification-content h4),
:deep(.notification-content h5),
:deep(.notification-content h6) {
  margin: 12px 0 8px 0;
  font-weight: 600;
  line-height: 1.4;
}

:deep(.notification-content h1) {
  font-size: 18px;
}

:deep(.notification-content h2) {
  font-size: 16px;
}

:deep(.notification-content h3) {
  font-size: 15px;
}

:deep(.notification-content p) {
  margin: 8px 0;
  line-height: 1.8;
}

:deep(.notification-content ul),
:deep(.notification-content ol) {
  margin: 10px 0;
  padding-left: 20px;
}

:deep(.notification-content li) {
  margin: 4px 0;
  line-height: 1.6;
}

:deep(.notification-content code.inline-code) {
  background: rgba(0, 0, 0, 0.3);
  color: #ff6b6b;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 13px;
}

:deep(.notification-content pre) {
  background: rgba(0, 0, 0, 0.3);
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 10px 0;
}

:deep(.notification-content a) {
  color: #4da8f5;
  text-decoration: none;
  transition: color 0.2s;
}

:deep(.notification-content a:hover) {
  color: #6bb8f7;
  text-decoration: underline;
}

:deep(.notification-content strong) {
  font-weight: 600;
}

:deep(.notification-content blockquote.custom-blockquote) {
  border-left: 4px solid #4da8f5;
  margin: 10px 0;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0 4px 4px 0;
}
</style>
