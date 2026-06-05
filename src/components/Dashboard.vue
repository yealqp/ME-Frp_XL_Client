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
import { onMounted } from "vue";
import { parseMarkdown } from "@/utils/markdownParser";
import { useDashboardState } from "@/composables/useDashboardState";
import UserInfoCard from "./common/UserInfoCard.vue";
import StatisticsCard from "./common/StatisticsCard.vue";
const {
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
} = useDashboardState();

onMounted(async () => {
  await initializeDashboard();
});
</script>

<style scoped>
.dashboard {
  padding: 0;
}

/* 重要公告警告框 — 使用 Naive UI 原生配色 */
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
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
}

/* 状态特定的边框颜色 */
.system-status-card.status-normal {
  border-color: rgba(76, 175, 80, 0.3);
}

.system-status-card.status-degraded {
  border-color: rgba(212, 160, 23, 0.3);
}

.system-status-card.status-offline {
  border-color: rgba(255, 68, 68, 0.3);
}

.system-status-card.status-unknown {
  border-color: var(--app-border-color);
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
  background-color: var(--app-text-color-3);
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
  color: var(--app-text-color-3);
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
  color: var(--app-text-color-3);
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
  border-color: var(--app-text-color-3);
  color: var(--app-text-color-3);
}

/* 欢迎信息样式 */
.welcome-header {
  margin-bottom: 20px;
  padding: 0 4px;
}

.welcome-text {
  font-size: 28px;
  font-weight: 600;
  color: var(--app-text-color-2);
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
  background: var(--app-card-color);
  border-radius: 8px;
}

.user-info-value {
  color: var(--app-text-color);
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
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
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
  color: var(--app-text-color-3);
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
</style>
