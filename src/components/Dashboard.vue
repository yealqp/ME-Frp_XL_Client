<template>
  <div class="dashboard">
    <!-- 弹窗公告 Modal -->
    <n-modal
      v-model:show="showPopupNotice"
      preset="card"
      title="重要公告"
      :bordered="true"
      size="large"
      :closable="true"
      :mask-closable="false"
      style="max-width: 700px"
      @after-leave="closePopupNotice"
    >
      <div class="popup-notice-content">
        <div v-if="popupNoticeLoading" class="loading-container">
          <n-spin size="large" />
        </div>
        <div v-else class="notice-text" v-html="parseMarkdownContent(popupNoticeContent)"></div>
      </div>
      <template #footer>
        <div style="display: flex; justify-content: flex-end">
          <n-button type="primary" @click="closePopupNotice">
            我已知晓
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- 欢迎信息 -->
    <div class="welcome-header">
      <h2 class="welcome-text">
        欢迎回来，{{ userInfoLoading ? "加载中..." : userInfo.username }}
      </h2>
    </div>

    <div class="dashboard-grid">
      <!-- 左侧列 -->
      <div class="left-column">
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
              <i :class="getStatusIcon()"></i>
            </div>
          </div>
        </div>

        <!-- 用户信息卡片 -->
        <n-card title="用户信息" :bordered="true" class="user-info-card">
          <div class="user-profile">
            <template v-if="userInfoLoading">
              <div class="user-info-grid">
                <div class="user-info-item">
                  <n-skeleton
                    text
                    :repeat="1"
                    style="width: 30%; font-size: 13px"
                  />
                  <div class="user-info-value">
                    <n-skeleton text :repeat="1" style="width: 60%" />
                  </div>
                </div>
                <div class="user-info-item">
                  <n-skeleton
                    text
                    :repeat="1"
                    style="width: 30%; font-size: 13px"
                  />
                  <div class="user-info-value">
                    <n-skeleton text :repeat="1" style="width: 50%" />
                  </div>
                </div>
                <div class="user-info-item">
                  <n-skeleton
                    text
                    :repeat="1"
                    style="width: 30%; font-size: 13px"
                  />
                  <div class="user-info-value">
                    <n-skeleton text :repeat="1" style="width: 40%" />
                  </div>
                </div>
                <div class="user-info-item">
                  <n-skeleton
                    text
                    :repeat="1"
                    style="width: 30%; font-size: 13px"
                  />
                  <div class="user-info-value">
                    <n-skeleton text :repeat="1" style="width: 70%" />
                  </div>
                </div>
                <div class="user-info-item">
                  <n-skeleton
                    text
                    :repeat="1"
                    style="width: 30%; font-size: 13px"
                  />
                  <div class="user-info-value">
                    <n-skeleton text :repeat="1" style="width: 50%" />
                  </div>
                </div>
                <div class="user-info-item">
                  <n-skeleton
                    text
                    :repeat="1"
                    style="width: 30%; font-size: 13px"
                  />
                  <div class="user-info-value">
                    <n-skeleton text :repeat="1" style="width: 45%" />
                  </div>
                </div>
                <div class="user-info-item">
                  <n-skeleton
                    text
                    :repeat="1"
                    style="width: 30%; font-size: 13px"
                  />
                  <div class="user-info-value">
                    <n-skeleton text :repeat="1" style="width: 55%" />
                  </div>
                </div>
                <div class="user-info-item">
                  <n-skeleton
                    text
                    :repeat="1"
                    style="width: 30%; font-size: 13px"
                  />
                  <div class="user-info-value">
                    <n-skeleton text :repeat="1" style="width: 40%" />
                  </div>
                </div>
                <div class="user-info-item">
                  <n-skeleton
                    text
                    :repeat="1"
                    style="width: 30%; font-size: 13px"
                  />
                  <div class="user-info-value">
                    <n-skeleton text :repeat="1" style="width: 45%" />
                  </div>
                </div>
                <div class="user-info-item">
                  <n-skeleton
                    text
                    :repeat="1"
                    style="width: 30%; font-size: 13px"
                  />
                  <div class="user-info-value">
                    <n-skeleton text :repeat="1" style="width: 55%" />
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="user-info-grid">
                <div class="user-info-item">
                  <n-text :style="{ fontSize: '13px' }" depth="3"
                    >用户名</n-text
                  >
                  <div class="user-info-value">{{ userInfo.username }}</div>
                </div>
                <div class="user-info-item">
                  <n-text :style="{ fontSize: '13px' }" depth="3"
                    >用户 ID</n-text
                  >
                  <div class="user-info-value">
                    <n-tag type="warning" :bordered="false" size="small">
                      #{{ userInfo.userId }}
                    </n-tag>
                  </div>
                </div>
                <div class="user-info-item">
                  <n-text :style="{ fontSize: '13px' }" depth="3"
                    >实名认证</n-text
                  >
                  <div class="user-info-value">
                    <n-tag type="success" :bordered="false" size="small">
                      {{ userInfo.isRealname ? "已实名" : "未实名" }}
                    </n-tag>
                  </div>
                </div>
                <div class="user-info-item">
                  <n-text :style="{ fontSize: '13px' }" depth="3"
                    >用户组</n-text
                  >
                  <div class="user-info-value">
                    <n-tag type="info" :bordered="false" size="small">
                      {{ userInfo.friendlyGroup }}
                    </n-tag>
                  </div>
                </div>
                <div class="user-info-item">
                  <n-text :style="{ fontSize: '13px' }" depth="3"
                    >注册时间</n-text
                  >
                  <div class="user-info-value">
                    {{ formatRegTime(userInfo.regTime) }}
                  </div>
                </div>
                <div class="user-info-item">
                  <n-text :style="{ fontSize: '13px' }" depth="3"
                    >注册邮箱</n-text
                  >
                  <div class="user-info-value">{{ userInfo.email }}</div>
                </div>
                <div class="user-info-item">
                  <n-text :style="{ fontSize: '13px' }" depth="3"
                    >隧道数量</n-text
                  >
                  <div class="user-info-value">
                    {{ userInfo.usedProxies }}/{{ userInfo.maxProxies }}
                  </div>
                </div>
                <div class="user-info-item">
                  <n-text :style="{ fontSize: '13px' }" depth="3"
                    >剩余流量</n-text
                  >
                  <div class="user-info-value">
                    {{ (getRemainingTraffic() / 1024).toFixed(2) }} GB
                  </div>
                </div>
                <div class="user-info-item">
                  <n-text :style="{ fontSize: '13px' }" depth="3"
                    >入站带宽</n-text
                  >
                  <div class="user-info-value">
                    {{ formatBandwidth(userInfo.inBound) }}
                  </div>
                </div>
                <div class="user-info-item">
                  <n-text :style="{ fontSize: '13px' }" depth="3"
                    >出站带宽</n-text
                  >
                  <div class="user-info-value">
                    {{ formatBandwidth(userInfo.outBound) }}
                  </div>
                </div>
              </div>
            </template>
          </div>
        </n-card>
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
            <template #header-extra>
              <span class="announcement-date">{{ announcement.date }}</span>
            </template>
            <div v-html="parseMarkdownContent(announcement.content)"></div>
          </n-card>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { invoke } from "@tauri-apps/api/core";
import MarkdownIt from "markdown-it";
import { useMessage } from "naive-ui";

// 用户信息数据结构
interface UserInfo {
  email: string;
  friendlyGroup: string;
  group: string;
  inBound: number;
  isRealname: boolean;
  maxProxies: number;
  outBound: number;
  regTime: number;
  status: number;
  todaySigned: boolean;
  traffic: number;
  usedProxies: number;
  userId: number;
  username: string;
}

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

// 用户信息响应式数据
const userInfo = ref<UserInfo>({
  email: "",
  friendlyGroup: "",
  group: "",
  inBound: 0,
  isRealname: false,
  maxProxies: 0,
  outBound: 0,
  regTime: 0,
  status: 0,
  todaySigned: false,
  traffic: 0,
  usedProxies: 0,
  userId: 0,
  username: "加载中...",
});

// 系统公告数据
const announcements = ref<Announcement[]>([]);

// 系统状态数据
const systemStatus = ref<SystemStatus>({
  status: 0,
  remark: "正在获取系统状态...",
});

// 系统状态是否已加载
const systemStatusLoaded = ref(false);

// 弹窗公告相关
const showPopupNotice = ref(false);
const popupNoticeContent = ref("");
const popupNoticeLoading = ref(false);

// 加载状态
const userInfoLoading = ref(true);
const announcementsLoading = ref(true);
const message = useMessage();

// 缓存相关
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存时间
const userInfoCache = ref<{ data: UserInfo | null; timestamp: number }>({
  data: null,
  timestamp: 0,
});
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
    console.error("获取系统公告失败", error);
    // 显示完整的错误信息
    const errorMessage =
      error && typeof error === "string"
        ? error
        : error && typeof error === "object" && "message" in error
          ? (error as any).message
          : "请检查网络连接";
    message.error(`获取系统公告失败: ${errorMessage}`);

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

// 格式化带宽（单位：Mbps，响应数值/128是显示数值）
const formatBandwidth = (value: number): string => {
  if (value === 0) return "0 Mbps";
  const mbps = value / 128;
  return parseFloat(mbps.toFixed(2)) + " Mbps";
};

// 获取用户信息
const fetchUserInfo = async (forceRefresh: boolean = false) => {
  // 检查缓存是否有效且不强制刷新
  if (
    !forceRefresh &&
    userInfoCache.value.data &&
    isCacheValid(userInfoCache.value.timestamp)
  ) {
    userInfo.value = userInfoCache.value.data;
    userInfoLoading.value = false;
    console.log("使用缓存的用户信息");
    return;
  }

  userInfoLoading.value = true;
  try {
    // 调用后端API命令获取用户信息
    const userDetailInfo: any = await invoke("api_get_user_info");
    userInfo.value = userDetailInfo as UserInfo;

    // 更新缓存
    userInfoCache.value = {
      data: userDetailInfo as UserInfo,
      timestamp: Date.now(),
    };

    console.log("获取用户信息成功");
  } catch (error) {
    console.error("获取用户信息失败", error);
    // 显示完整的错误信息
    const errorMessage =
      error && typeof error === "string"
        ? error
        : error && typeof error === "object" && "message" in error
          ? (error as any).message
          : "请检查网络连接";
    message.error(`获取用户信息失败: ${errorMessage}`);
    // 如果有缓存数据，使用缓存数据
    if (userInfoCache.value.data) {
      userInfo.value = userInfoCache.value.data;
      console.log("API请求失败，使用缓存的用户信息");
    }
  } finally {
    userInfoLoading.value = false;
  }
};

// 格式化注册时间
const formatRegTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
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

// 获取系统状态图标
const getStatusIcon = (): string => {
  switch (systemStatus.value.status) {
    case 0:
      return "fas fa-check-circle";
    case 1:
      return "fas fa-exclamation-triangle";
    case 2:
      return "fas fa-times-circle";
    default:
      return "fas fa-question-circle";
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

// 获取剩余流量（直接使用API返回的traffic字段）
const getRemainingTraffic = (): number => {
  // API响应中的traffic字段就是剩余流量
  return userInfo.value.traffic || 0;
};

// 初始化markdown-it
const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
});

// 自定义链接渲染规则,添加target="_blank"
const defaultRender =
  md.renderer.rules.link_open ||
  function (tokens: any, idx: any, options: any, _env: any, self: any) {
    return self.renderToken(tokens, idx, options);
  };

md.renderer.rules.link_open = function (
  tokens: any,
  idx: any,
  options: any,
  _env: any,
  self: any,
) {
  const aIndex = tokens[idx].attrIndex("target");
  if (aIndex < 0) {
    tokens[idx].attrPush(["target", "_blank"]);
    tokens[idx].attrPush(["rel", "noopener noreferrer"]);
  }
  return defaultRender(tokens, idx, options, _env, self);
};

// 解析Markdown内容并处理转义字符
const parseMarkdownContent = (content: string): string => {
  if (!content) return "";

  // 处理转义字符
  const unescapedContent = content
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r")
    .replace(/\\\\/g, "\\")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\&/g, "&")
    .replace(/\\</g, "<")
    .replace(/\\>/g, ">");

  // 解析Markdown
  try {
    // 使用markdown-it解析
    let html = md.render(unescapedContent);

    // 后处理：在h2标签后添加分割线
    html = html.replace(
      /<h2>(.*?)<\/h2>/g,
      '<h2>$1</h2><hr class="h2-divider">',
    );

    // 为行内代码添加class
    html = html.replace(/<code>(?!<\/code>)/g, '<code class="inline-code">');

    // 为引用块添加class
    html = html.replace(
      /<blockquote>/g,
      '<blockquote class="custom-blockquote">',
    );

    return html;
  } catch (error) {
    console.error("Markdown解析失败:", error);
    return unescapedContent.replace(/\n/g, "<br>");
  }
};

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

// 获取弹窗公告
const fetchPopupNotice = async () => {
  // 检查是否已经显示过（使用 localStorage 记录）
  const lastShownTime = localStorage.getItem("popup_notice_last_shown");
  const now = Date.now();

  // 如果距离上次显示不到 24 小时，则不再显示
  if (lastShownTime && now - parseInt(lastShownTime) < 24 * 60 * 60 * 1000) {
    console.log("弹窗公告今日已显示过，跳过");
    return;
  }

  popupNoticeLoading.value = true;

  try {
    const responseText = await invoke("api_get_popup_notice");

    // 尝试解析 JSON
    try {
      const result: PopupNoticeResponse = JSON.parse(responseText as string);

      if (result.code === 200 && result.data) {
        popupNoticeContent.value = result.data;
        showPopupNotice.value = true;

        // 记录显示时间
        localStorage.setItem("popup_notice_last_shown", now.toString());
      } else {
        console.log("弹窗公告:", result.message || "无公告内容");
      }
    } catch (parseError) {
      // 如果解析失败，可能是纯文本响应
      console.log("弹窗公告响应格式异常，跳过显示");
    }
  } catch (error) {
    // 静默处理错误，不影响用户体验
    console.log("获取弹窗公告:", error);
  } finally {
    popupNoticeLoading.value = false;
  }
};

// 关闭弹窗公告
const closePopupNotice = () => {
  showPopupNotice.value = false;
};

// 组件挂载时获取用户信息和系统公告
onMounted(() => {
  fetchSystemStatus();
  fetchUserInfo();
  fetchAnnouncements();
  fetchPopupNotice();
});
</script>

<style scoped>
.dashboard {
  padding: 0;
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
  font-size: 18px;
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
  color: #666;
  line-height: 1.6;
  font-size: 14px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Markdown内容样式 */
.announcement-card .n-card__content h1,
.announcement-card .n-card__content h2,
.announcement-card .n-card__content h3,
.announcement-card .n-card__content h4,
.announcement-card .n-card__content h5,
.announcement-card .n-card__content h6 {
  margin: 16px 0 8px 0;
  color: #ffffffd1;
  font-weight: 600;
  line-height: 1.4;
}

.announcement-card .n-card__content h1 {
  font-size: 24px;
  border-bottom: 2px solid #3e3e42;
  padding-bottom: 8px;
}

.announcement-card .n-card__content h2 {
  font-size: 20px;
  margin-bottom: 4px;
}

.announcement-card .n-card__content h3 {
  font-size: 18px;
}

.announcement-card .n-card__content h4 {
  font-size: 16px;
}

/* h2下的分割线 */
.announcement-card .n-card__content .h2-divider {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin: 8px 0 16px 0;
}

.announcement-card .n-card__content p {
  margin: 8px 0;
  color: #a0a0a0;
  line-height: 1.7;
}

/* 行内代码 */
.announcement-card .n-card__content code.inline-code {
  background: #303033;
  color: #e8e8ea;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 13px;
  border: 1px solid #3e3e42;
}

/* 代码块 */
.announcement-card .n-card__content pre {
  background: #1a1a1e;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 12px 0;
  border: 1px solid #3e3e42;
}

.announcement-card .n-card__content pre code {
  background: transparent;
  color: #e8e8ea;
  padding: 0;
  border: none;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.6;
}

/* 引用块 */
.announcement-card .n-card__content blockquote.custom-blockquote {
  border-left: 4px solid #349ff4;
  margin: 12px 0;
  padding: 8px 12px;
  background: #242428;
  color: #a0a0a0;
  border-radius: 0 4px 4px 0;
}

.announcement-card .n-card__content blockquote.custom-blockquote p {
  margin: 4px 0;
}

/* 列表样式 */
.announcement-card .n-card__content ul,
.announcement-card .n-card__content ol {
  margin: 12px 0;
  padding-left: 28px;
  color: #a0a0a0;
}

.announcement-card .n-card__content li {
  margin: 6px 0;
  line-height: 1.7;
  padding-left: 8px;
}

.announcement-card .n-card__content ul li {
  list-style-type: disc;
}

.announcement-card .n-card__content ul li::marker {
  color: #349ff4;
  font-size: 0.8em;
}

.announcement-card .n-card__content ol li {
  list-style-type: decimal;
}

.announcement-card .n-card__content ol li::marker {
  color: #349ff4;
  font-weight: 600;
}

/* 嵌套列表 */
.announcement-card .n-card__content ul ul,
.announcement-card .n-card__content ol ol,
.announcement-card .n-card__content ul ol,
.announcement-card .n-card__content ol ul {
  margin: 4px 0;
  padding-left: 24px;
}

/* 列表中的段落 */
.announcement-card .n-card__content li p {
  margin: 2px 0;
}

/* 链接样式 */
.announcement-card .n-card__content a {
  color: #349ff4;
  text-decoration: none;
  transition: color 0.2s;
}

.announcement-card .n-card__content a:hover {
  color: #4da8f5;
  text-decoration: underline;
}

/* 水平分割线 */
.announcement-card .n-card__content hr {
  border: none;
  border-top: 1px solid #3e3e42;
  margin: 16px 0;
}

/* 表格样式 */
.announcement-card .n-card__content table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  background: #1a1a1e;
  border: 1px solid #3e3e42;
}

.announcement-card .n-card__content table th,
.announcement-card .n-card__content table td {
  padding: 8px 12px;
  border: 1px solid #3e3e42;
  text-align: left;
}

.announcement-card .n-card__content table th {
  background: #242428;
  color: #ffffffd1;
  font-weight: 600;
}

.announcement-card .n-card__content table td {
  color: #a0a0a0;
}

.announcement-card .n-card__content table tr:hover {
  background: #242428;
}

/* 强调文本 */
.announcement-card .n-card__content strong {
  color: #ffffffd1;
  font-weight: 600;
}

.announcement-card .n-card__content em {
  color: #b0b0b0;
  font-style: italic;
}

/* 删除线 */
.announcement-card .n-card__content del {
  color: #707070;
  text-decoration: line-through;
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

/* 弹窗公告样式 */
.popup-notice-content {
  min-height: 200px;
  max-height: 500px;
  overflow-y: auto;
}

.popup-notice-content .loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.popup-notice-content .notice-text {
  line-height: 1.8;
  color: #ffffffd1;
  font-size: 14px;
  padding: 10px 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* 弹窗公告 Markdown 样式 */
.popup-notice-content .notice-text h1,
.popup-notice-content .notice-text h2,
.popup-notice-content .notice-text h3,
.popup-notice-content .notice-text h4,
.popup-notice-content .notice-text h5,
.popup-notice-content .notice-text h6 {
  margin: 16px 0 8px 0;
  color: #ffffffd1;
  font-weight: 600;
  line-height: 1.4;
}

.popup-notice-content .notice-text h1 {
  font-size: 24px;
  border-bottom: 2px solid #3e3e42;
  padding-bottom: 8px;
}

.popup-notice-content .notice-text h2 {
  font-size: 20px;
  margin-bottom: 4px;
}

.popup-notice-content .notice-text h3 {
  font-size: 18px;
}

.popup-notice-content .notice-text h4 {
  font-size: 16px;
}

.popup-notice-content .notice-text .h2-divider {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin: 8px 0 16px 0;
}

.popup-notice-content .notice-text p {
  margin: 8px 0;
  color: #a0a0a0;
  line-height: 1.7;
}

.popup-notice-content .notice-text code.inline-code {
  background: #303033;
  color: #e8e8ea;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 13px;
  border: 1px solid #3e3e42;
}

.popup-notice-content .notice-text pre {
  background: #1a1a1e;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 12px 0;
  border: 1px solid #3e3e42;
}

.popup-notice-content .notice-text pre code {
  background: transparent;
  color: #e8e8ea;
  padding: 0;
  border: none;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.6;
}

.popup-notice-content .notice-text blockquote.custom-blockquote {
  border-left: 4px solid #349ff4;
  margin: 12px 0;
  padding: 8px 12px;
  background: #242428;
  color: #a0a0a0;
  border-radius: 0 4px 4px 0;
}

.popup-notice-content .notice-text blockquote.custom-blockquote p {
  margin: 4px 0;
}

.popup-notice-content .notice-text ul,
.popup-notice-content .notice-text ol {
  margin: 12px 0;
  padding-left: 28px;
  color: #a0a0a0;
}

.popup-notice-content .notice-text li {
  margin: 6px 0;
  line-height: 1.7;
  padding-left: 8px;
}

.popup-notice-content .notice-text ul li {
  list-style-type: disc;
}

.popup-notice-content .notice-text ul li::marker {
  color: #349ff4;
  font-size: 0.8em;
}

.popup-notice-content .notice-text ol li {
  list-style-type: decimal;
}

.popup-notice-content .notice-text ol li::marker {
  color: #349ff4;
  font-weight: 600;
}

.popup-notice-content .notice-text ul ul,
.popup-notice-content .notice-text ol ol,
.popup-notice-content .notice-text ul ol,
.popup-notice-content .notice-text ol ul {
  margin: 4px 0;
  padding-left: 24px;
}

.popup-notice-content .notice-text li p {
  margin: 2px 0;
}

.popup-notice-content .notice-text a {
  color: #349ff4;
  text-decoration: none;
  transition: color 0.2s;
}

.popup-notice-content .notice-text a:hover {
  color: #4da8f5;
  text-decoration: underline;
}

.popup-notice-content .notice-text hr {
  border: none;
  border-top: 1px solid #3e3e42;
  margin: 16px 0;
}

.popup-notice-content .notice-text table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  background: #1a1a1e;
  border: 1px solid #3e3e42;
}

.popup-notice-content .notice-text table th,
.popup-notice-content .notice-text table td {
  padding: 8px 12px;
  border: 1px solid #3e3e42;
  text-align: left;
}

.popup-notice-content .notice-text table th {
  background: #242428;
  color: #ffffffd1;
  font-weight: 600;
}

.popup-notice-content .notice-text table td {
  color: #a0a0a0;
}

.popup-notice-content .notice-text table tr:hover {
  background: #242428;
}

.popup-notice-content .notice-text strong {
  color: #ffffffd1;
  font-weight: 600;
}

.popup-notice-content .notice-text em {
  color: #b0b0b0;
  font-style: italic;
}

.popup-notice-content .notice-text del {
  color: #707070;
  text-decoration: line-through;
}
</style>
