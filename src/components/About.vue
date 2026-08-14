<template>
  <div class="about">
    <div class="about-content">
      <n-card :bordered="true" class="app-info">
        <template #header>
          <img 
            src="../assets/icon.png" 
            alt="logo" 
            class="logo"
          />
        </template>
        <div class="app-logo">ME-Frp XL Client</div>
        <p class="description"></p>
      </n-card>

      <n-card :bordered="true" class="tech-stack">
        <template #header>关于ME-Frp XL Client</template>
        <n-descriptions label-placement="left" bordered :column="2">
          <n-descriptions-item label="版本">
            <n-tag
              type="success"
              @click="openLink('https://mefrp-tpca.yealqp.cn/docs/xl')"
              >v{{ appVersion }}</n-tag
            >
          </n-descriptions-item>
          <n-descriptions-item label="开发者">
            <div class="member-avatar-wrapper">
              <img
                src="https://img.fastmirror.net/s/2025/08/26/68adce35907c1.jpg"
                :alt="`yealqp Avatar`"
                class="member-avatar-img"
              />
              <a>Yealqp/猫羽雫 QQ1592239257</a>
            </div>
          </n-descriptions-item>
          <n-descriptions-item label="特别鸣谢">
            <n-space :size="8" wrap>
              <div class="member-avatar-wrapper">
                <img src="https://img.fastmirror.net/s/2025/08/26/68adcd3ec7122.jpg" class="member-avatar-img" />
                <span class="member-name">落雪无痕</span>
              </div>
              <div class="member-avatar-wrapper">
                <img src="https://img.fastmirror.net/s/2026/03/01/69a3f43ec4b47.jpg" class="member-avatar-img" />
                <span class="member-name">水化</span>
              </div>
              <div class="member-avatar-wrapper">
                <img src="https://img.fastmirror.net/s/2026/01/23/69724c26b78a1.png" class="member-avatar-img" />
                <span class="member-name">liuzhen932</span>
              </div>
            </n-space>
          </n-descriptions-item>
          <n-descriptions-item label="技术栈">
            <n-space>
              <n-tag
                :bordered="false"
                type="success"
                style="cursor: pointer"
                @click="openLink('https://vuejs.org/')"
              >
                Vue3
              </n-tag>
              <n-tag
                :bordered="false"
                type="info"
                style="cursor: pointer"
                @click="openLink('https://www.typescriptlang.org/')"
              >
                TypeScript
              </n-tag>
              <n-tag
                :bordered="false"
                type="warning"
                style="cursor: pointer"
                @click="openLink('https://www.naiveui.com/')"
              >
                Naive UI
              </n-tag>
              <n-tag
                :bordered="false"
                type="warning"
                style="cursor: pointer"
                @click="openLink('https://pinia.vuejs.org/zh/')"
              >
                Pinia
              </n-tag>
              <n-tag
                :bordered="false"
                type="error"
                style="cursor: pointer"
                @click="openLink('https://vite.dev/')"
              >
                Vite
              </n-tag>
              <n-tag
                :bordered="false"
                type="info"
                style="cursor: pointer"
                @click="openLink('https://v2.tauri.app/')"
              >
                Tauri 2
              </n-tag>
              <n-tag
                :bordered="false"
                type="error"
                style="cursor: pointer"
                @click="openLink('https://rust-lang.org/')"
              >
                Rust
              </n-tag>
            </n-space>
          </n-descriptions-item>
        </n-descriptions>
      </n-card>

      <HitokotoCard />

      <!-- 帮助与反馈卡片 -->
      <n-card :bordered="true" class="feedback-card">
        <template #header>
          <SectionHeader :icon="MessageCircle" title="帮助与反馈" />
        </template>
        
        <div class="feedback-content">
          <!-- 反馈区域 -->
          <div class="feedback-section">
            <div class="section-title">
              <MessageSquare :size="16" />
              <span>问题反馈</span>
            </div>
            <p class="section-description">
              发现 BUG 或有改进建议？我们期待您的反馈，帮助我们做得更好。
            </p>
            <n-space :size="12">
              <n-button type="primary" @click="showFeedbackModal = true">
                <template #icon>
                  <Edit :size="16" />
                </template>
                在线反馈
              </n-button>
              <n-button type="primary" @click="sendyEmail">
                <template #icon>
                  <Mail :size="16" />
                </template>
                邮件联系
              </n-button>
            </n-space>
          </div>

          <n-divider style="margin: 20px 0" />

          <!-- 资源区域 -->
          <div class="feedback-section">
            <div class="section-title">
              <BookOpen :size="16" />
              <span>资源与文档</span>
            </div>
            <p class="section-description">
              查看下载页面、隐私政策和更新历史等相关资源。
            </p>
            <n-space :size="12" style="flex-wrap: wrap">
              <n-button type="primary" @click="OpenDownloadpage">
                <template #icon>
                  <Download :size="16" />
                </template>
                下载页面
              </n-button>
              <n-button type="primary" @click="openPrivacyPolicy">
                <template #icon>
                  <Shield :size="16" />
                </template>
                隐私政策
              </n-button>
              <n-button type="primary" @click="viewChangelog" :loading="changelogLoading">
                <template #icon>
                  <FileText :size="16" />
                </template>
                更新历史
              </n-button>
            </n-space>
          </div>

          <n-divider style="margin: 20px 0" />

          <!-- 更新区域 -->
          <div class="feedback-section">
            <div class="section-title">
              <RefreshCw :size="16" />
              <span>版本更新</span>
            </div>
            <p class="section-description">
              当前版本 v{{ appVersion }}，点击检查是否有新版本可用。
            </p>
            <n-button 
              type="primary" 
              @click="() => checkForUpdates()" 
              :loading="updateChecking"
            >
              <template #icon>
                <Download :size="16" />
              </template>
              {{ updateChecking ? "检查中..." : "检查更新" }}
            </n-button>
          </div>
        </div>
      </n-card>
    </div>

    <!-- 更新提示模态框 -->
    <UpdateAvailableModal
      v-model:show="showUpdateModal"
      :current-version="currentVersion"
      :latest-version="latestVersion"
      :update-info="updateInfo"
      :changelog="changelog"
      :sorted-changelog="sortedChangelog"
      @confirm="handleUpdate"
      @cancel="handleCancelUpdate"
    />

    <!-- 更新历史模态框 -->
    <ChangelogModal
      v-model:show="showChangelogModal"
      :update-info="updateInfo"
      :changelog="changelog"
      :sorted-changelog="sortedChangelog"
    />

    <!-- 反馈表单模态框 -->
    <FeedbackModal v-model:show="showFeedbackModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  useMessage,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NSpace,
  NTag,
  NButton,
  NDivider,
} from "naive-ui";
import { invokeTauriText } from "@/utils/tauriResponse";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useAppUpdate } from "@/composables/useAppUpdate";
import UpdateAvailableModal from "@/components/UpdateAvailableModal.vue";
import HitokotoCard from "@/components/about/HitokotoCard.vue";
import ChangelogModal from "@/components/about/ChangelogModal.vue";
import FeedbackModal from "@/components/about/FeedbackModal.vue";
import {
  MessageCircle,
  MessageSquare,
  Edit,
  Mail,
  Download,
  RefreshCw,
  FileText,
  BookOpen,
  Shield,
} from "@lucide/vue";
import SectionHeader from "@/components/common/SectionHeader.vue";

const router = useRouter();
const message = useMessage();

const {
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
  viewChangelog,
  handleUpdate,
  handleCancelUpdate,
} = useAppUpdate();

const appVersion = ref("加载中...");

// 反馈表单相关
const showFeedbackModal = ref(false);

// 获取应用版本号
const getAppVersion = async () => {
  try {
    const version = await invokeTauriText("get_app_version");
    appVersion.value = version;
  } catch (error) {
    console.error("获取版本号失败:", error);
    appVersion.value = "未知";
  }
};

// 组件挂载时获取版本号
onMounted(() => {
  getAppVersion();
});

// 桌面版反馈相关
const sendyEmail = async () => {
  try {
    await openUrl("mailto:im@yealqp.cn?subject=ME-Frp XL用户支持");
    message.success("正在打开邮件客户端");
  } catch (error) {
    message.error("打开邮件客户端失败");
  }
};

const openPrivacyPolicy = () => {
  router.push('/privacy-policy');
};

const OpenDownloadpage = async () => {
  try {
    await openUrl(
      "https://alist.yealqp.cn/ME-Frp%20XL%20Client",
    );
    message.success("正在打开下载页面");
  } catch (error) {
    message.error("打开链接失败");
  }
};

// 打开外部链接
const openLink = async (url: string) => {
  try {
    await openUrl(url);
  } catch (error) {
    message.error("打开链接失败");
  }
};
</script>
<style scoped>
.about {
  padding: 0;
}

.about-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.app-info {
  text-align: center;
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
}

.tech-stack {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
}

/* 技术栈标签悬停效果 */
.tech-stack :deep(.n-tag) {
  transition: all 0.3s ease;
}

.tech-stack :deep(.n-tag:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 159, 244, 0.3);
}

.app-logo {
  font-size: 25px;
}

.app-logo i {
  font-size: 20px;
  color: white;
}

.app-info :deep(.n-card-header) {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: 600;
}

.version {
  color: var(--app-primary-color);
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 12px;
}

.description {
  color: var(--app-text-color-2);
  font-size: 16px;
  line-height: 1.6;
}

.tech-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.tech-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--app-card-color);
  border-radius: 6px;
  font-size: 14px;
}

.tech-item i {
  font-size: 16px;
  color: var(--app-primary-color);
}

.logo {
  width: 50px;
}

/* 头像样式 */
.member-avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-avatar-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

.member-name {
  font-size: 14px;
  color: var(--app-text-color-2);
  white-space: nowrap;
}

/* 帮助与反馈卡片样式 */
.feedback-card {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
}

.feedback-content {
  padding: 8px 0;
}

.feedback-section {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text-color);
  margin-bottom: 8px;
}

.section-title :deep(svg) {
  color: var(--app-primary-color);
  flex-shrink: 0;
}

.section-description {
  color: var(--app-text-color-2);
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.feedback-card :deep(.n-divider) {
  background-color: color-mix(in srgb, var(--app-divider-color) 70%, transparent);
}

/* 按钮样式优化 */
.feedback-card :deep(.n-button) {
  transition: all 0.3s ease;
}

.feedback-card :deep(.n-button:not(.n-button--disabled):hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--app-primary-color) 30%, transparent);
}
</style>
