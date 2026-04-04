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
                @click="openLink('https://www.rust-lang.org/')"
              >
                Rust
              </n-tag>
            </n-space>
          </n-descriptions-item>
        </n-descriptions>
      </n-card>
      <!-- 一言卡片 -->
      <n-card :bordered="true" class="hitokoto-card">
        <div class="hitokoto-content">
          <div class="hitokoto-text">
            <Quote :size="20" class="quote-icon" />
            <span class="hitokoto-sentence">{{ hitokoto.sentence }}</span>
          </div>
          <div class="hitokoto-meta">
            <span v-if="hitokoto.from" class="hitokoto-from">
              —— {{ hitokoto.from }}
              <span v-if="hitokoto.from_who" class="hitokoto-author"
                >「{{ hitokoto.from_who }}」</span
              >
            </span>
          </div>
          <div class="hitokoto-actions">
            <n-button
              text
              @click="refreshHitokoto"
              :loading="hitokotoLoading"
              size="small"
            >
              <template #icon>
                <RefreshCw :size="16" />
              </template>
              换一句
            </n-button>
          </div>
        </div>
      </n-card>

      <!-- 帮助与反馈卡片 -->
      <n-card :bordered="true" class="feedback-card">
        <template #header>
          <div class="section-header">
            <MessageCircle :size="20" />
            <span>帮助与反馈</span>
          </div>
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
              @click="checkForUpdates" 
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
    <n-modal
      v-model:show="showUpdateModal"
      preset="card"
      :style="{ width: '600px', maxHeight: '85vh' }"
      title="发现新版本"
      :segmented="{
        content: true,
        footer: 'soft'
      }"
    >
      <div class="update-modal-content">
        <div class="version-info">
          <n-space align="center" :size="16">
            <n-tag type="info" :bordered="false" size="large">
              v{{ currentVersion }}
            </n-tag>
            <ArrowRight :size="18" />
            <n-tag type="success" :bordered="false" size="large">
              v{{ latestVersion }}
            </n-tag>
          </n-space>
        </div>

        <!-- 显示差异版本的更新日志 -->
        <div v-if="Object.keys(changelog).length > 0" class="update-changelog">
          <p class="update-info-title">更新内容：</p>
          <div class="changelog-info">
            <div v-for="version in sortedChangelog" :key="version" class="changelog-version">
              <div class="version-header">
                <span class="version-badge">v{{ version }}</span>
              </div>
              <ul class="changelog-list">
                <li v-for="(change, index) in changelog[version]" :key="index" class="changelog-item">
                  <span class="changelog-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
                      <path d="M5 8L7 10L11 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                  <span class="changelog-text">{{ change }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <!-- 如果没有 changelog，显示 updateInfo -->
        <div v-else-if="updateInfo.length > 0" class="update-info">
          <p class="update-info-title">更新内容：</p>
          <div class="markdown-content update-content-markdown" v-html="parseUpdateInfo(updateInfo)"></div>
        </div>
      </div>

      <template #footer>
        <n-space justify="end">
          <n-button @click="handleCancelUpdate">稍后提醒</n-button>
          <n-button type="primary" @click="handleUpdate">
            <template #icon>
              <Download :size="16" />
            </template>
            立即更新
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 更新历史模态框 -->
    <n-modal
      v-model:show="showChangelogModal"
      preset="card"
      :style="{ width: '720px', maxHeight: '85vh' }"
      title="更新历史"
      :segmented="{
        content: true,
        footer: 'soft'
      }"
    >
      <div class="changelog-modal-content">
        <div v-if="Object.keys(changelog).length > 0" class="changelog-info">
          <div v-for="version in sortedChangelog" :key="version" class="changelog-version">
            <div class="version-header">
              <span class="version-badge">v{{ version }}</span>
            </div>
            <ul class="changelog-list">
              <li v-for="(change, index) in changelog[version]" :key="index" class="changelog-item">
                <span class="changelog-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M5 8L7 10L11 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <span class="changelog-text">{{ change }}</span>
              </li>
            </ul>
          </div>
        </div>
        <div v-else-if="updateInfo.length > 0" class="changelog-info">
          <div class="markdown-content changelog-content-markdown" v-html="parseUpdateInfo(updateInfo)"></div>
        </div>
        <div v-else class="no-changelog">
          <n-empty description="暂无更新历史信息">
            <template #icon>
              <FileText :size="48" />
            </template>
          </n-empty>
        </div>
      </div>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showChangelogModal = false" size="medium">关闭</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 反馈表单模态框 -->
    <n-modal
      v-model:show="showFeedbackModal"
      preset="card"
      :style="{ width: '500px' }"
      title="表单反馈"
    >
      <n-form ref="feedbackFormRef" :model="feedbackForm" label-placement="top">
        <n-form-item label="反馈内容" path="content" required>
          <n-input
            v-model:value="feedbackForm.content"
            type="textarea"
            placeholder="请详细描述您遇到的问题或建议,请勿骚扰。"
            :rows="6"
            :maxlength="500"
            show-count
          />
        </n-form-item>
      </n-form>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showFeedbackModal = false">取消</n-button>
          <n-button
            type="primary"
            @click="submitFeedback"
            :loading="feedbackSubmitting"
          >
            提交反馈
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import {
  useMessage,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NSpace,
  NTag,
  NButton,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NDivider,
} from "naive-ui";
import { invoke } from "@tauri-apps/api/core";
import { invokeTauriText } from "@/utils/tauriResponse";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  MessageCircle,
  MessageSquare,
  Edit,
  Mail,
  Download,
  ArrowRight,
  RefreshCw,
  Quote,
  FileText,
  BookOpen,
  Shield,
} from "lucide-vue-next";
import { parseMarkdown } from "@/utils/markdownParser";


interface UpdateCheckResult {
  has_update: boolean;
  latest_version: string;
  current_version: string;
  update_info: string[];
  changelog: Record<string, string[]>;
}

interface Hitokoto {
  sentence: string;
  from: string;
  from_who: string;
  type: string;
}

const router = useRouter();
const message = useMessage();
const updateChecking = ref(false);
const showUpdateModal = ref(false);
const latestVersion = ref("");
const currentVersion = ref("");
const updateInfo = ref<string[]>([]);
const changelog = ref<Record<string, string[]>>({});
const appVersion = ref("加载中...");
const changelogLoading = ref(false);
const showChangelogModal = ref(false);

const sortedChangelog = computed(() => {
  const versions = Object.keys(changelog.value);
  return versions.sort((a, b) => {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const numA = partsA[i] || 0;
      const numB = partsB[i] || 0;
      if (numA !== numB) return numB - numA;
    }
    return 0;
  });
});

// 反馈表单相关
const showFeedbackModal = ref(false);
const feedbackSubmitting = ref(false);
const feedbackForm = ref({
  content: "",
});

// 一言相关
const hitokoto = ref<Hitokoto>({
  sentence: "加载中...",
  from: "",
  from_who: "",
  type: "",
});
const hitokotoLoading = ref(false);

// 获取一言
const getHitokoto = async () => {
  try {
    const response = await fetch("https://hitokoto.yealqp.cn/?encode=json");
    const data = await response.json();
    hitokoto.value = {
      sentence: data.hitokoto || "获取一言失败",
      from: data.from || "",
      from_who: data.from_who || "",
      type: data.type || "",
    };
  } catch (error) {
    console.error("获取一言失败:", error);
    hitokoto.value = {
      sentence: "获取一言失败",
      from: "获取失败",
      from_who: "",
      type: "",
    };
  }
};

// 刷新一言
const refreshHitokoto = async () => {
  hitokotoLoading.value = true;
  await getHitokoto();
  hitokotoLoading.value = false;
};

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

// 组件挂载时获取一言和版本号
onMounted(() => {
  getHitokoto();
  getAppVersion();
});

// 检查更新
const checkForUpdates = async () => {
  updateChecking.value = true;
  try {
    const result = (await invoke("check_for_updates")) as UpdateCheckResult;
    if (result.has_update) {
      latestVersion.value = result.latest_version;
      currentVersion.value = result.current_version;
      updateInfo.value = result.update_info || [];
      changelog.value = result.changelog || {};
      showUpdateModal.value = true;
    } else {
      message.success(`当前已是最新版本 ${result.current_version}`);
    }
  } catch (error) {
    message.error(`检查更新失败: ${error}`);
  } finally {
    updateChecking.value = false;
  }
};

// 将更新信息数组转换为 Markdown 格式并解析
const parseUpdateInfo = (infoArray: string[]): string => {
  if (!infoArray || infoArray.length === 0) {
    return '<p>暂无更新信息</p>';
  }
  
  // 将数组每一项用换行符连接成一个字符串
  const markdownContent = infoArray.join('\n');
  
  // 使用 parseMarkdown 解析为 HTML
  return parseMarkdown(markdownContent);
};

// 查看更新历史
const viewChangelog = async () => {
  changelogLoading.value = true;
  try {
    const result = (await invoke("get_update_history")) as UpdateCheckResult;
    latestVersion.value = result.latest_version;
    currentVersion.value = result.current_version;
    updateInfo.value = result.update_info || [];
    changelog.value = result.changelog || {};
    showChangelogModal.value = true;
  } catch (error) {
    message.error(`获取更新历史失败: ${error}`);
  } finally {
    changelogLoading.value = false;
  }
};

// 处理更新
const handleUpdate = async () => {
  try {
    showUpdateModal.value = false;
    message.loading("正在下载更新...", { duration: 0 });

    await invoke("download_and_install_update", {
      version: latestVersion.value,
    });

    message.destroyAll();
    message.success("安装程序已启动，应用即将关闭");

    // 等待一下让用户看到消息，然后退出应用
    setTimeout(() => {
      invoke("quit_app");
    }, 2000);
  } catch (error) {
    message.destroyAll();
    message.error(`更新失败: ${error}`);
  }
};

// 处理取消更新
const handleCancelUpdate = () => {
  showUpdateModal.value = false;
  message.info("已取消更新，下次启动时会再次检查");
};

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

// 提交反馈表单
const submitFeedback = async () => {
  if (!feedbackForm.value.content.trim()) {
    message.error("请输入反馈内容");
    return;
  }

  feedbackSubmitting.value = true;

  try {
    await invoke("api_send_feedback", {
      content: feedbackForm.value.content,
    });

    message.success("反馈提交成功，感谢您的反馈！");
    showFeedbackModal.value = false;
    // 清空表单
    feedbackForm.value.content = "";
  } catch (error) {
    console.error("提交反馈失败:", error);
    message.error(
      `提交反馈失败: ${error instanceof Error ? error.message : "网络错误"}`,
    );
  } finally {
    feedbackSubmitting.value = false;
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

/* 一言卡片样式 */
.hitokoto-card {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
}

.hitokoto-card :deep(.n-card__content) {
  padding: 24px;
}

.hitokoto-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hitokoto-text {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  position: relative;
}

.quote-icon {
  flex-shrink: 0;
  margin-top: 4px;
  color: var(--app-text-color-3);
}

.hitokoto-sentence {
  font-size: 16px;
  line-height: 1.8;
  color: var(--app-text-color);
  font-weight: 500;
  letter-spacing: 0.5px;
}

.hitokoto-meta {
  display: flex;
  justify-content: flex-end;
  padding-right: 8px;
}

.hitokoto-from {
  font-size: 13px;
  color: var(--app-text-color-2);
  font-style: italic;
}

.hitokoto-author {
  margin-left: 4px;
  color: var(--app-text-color-1);
}

.hitokoto-actions {
  display: flex;
  justify-content: center;
  padding-top: 8px;
  border-top: 1px solid var(--app-divider-color);
}

.hitokoto-actions .n-button {
  color: var(--app-text-color-2);
  transition: all 0.3s ease;
}

.hitokoto-actions .n-button:hover {
  color: var(--app-primary-color);
  transform: scale(1.05);
}

.hitokoto-actions .n-button :deep(.n-button__icon) {
  color: var(--app-text-color-2);
}

.hitokoto-actions .n-button:hover :deep(.n-button__icon) {
  color: var(--app-primary-color);
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
  color: #3498db;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 12px;
}

.description {
  color: #666;
  font-size: 16px;
  line-height: 1.6;
}

/* Card spacing is now handled by flex gap */

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
  color: #3498db;
}

.feature-list {
  list-style: none;
  padding: 0;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  color: #333;
}

.feature-list i {
  color: #2ecc71;
  font-size: 14px;
}

.about-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
  border: 1px solid #3498db;
  border-radius: 6px;
  transition: all 0.3s ease;
  font-size: 14px;
}

.link:hover {
  background-color: #3498db;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
}

.link i {
  font-size: 14px;
}

.logo {
  width: 50px;
}

.copyright {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.copyright p {
  color: #666;
  font-size: 14px;
  margin: 4px 0;
}

.build-info {
  font-size: 12px !important;
  color: #999 !important;
}

/* 团队信息样式 */
.team-info {
  margin-bottom: 16px;
}

/* 公司信息样式 */
.company-info {
  margin-bottom: 16px;
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

/* 检查更新卡片样式 */
.update-card {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text-color);
}

.section-header :deep(svg) {
  color: #349ff4;
}

.update-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.update-description {
  color: #a0a0a0;
  font-size: 14px;
  margin: 0;
  text-align: center;
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
  color: #349ff4;
  flex-shrink: 0;
}

.section-description {
  color: var(--app-text-color-2);
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.feedback-card :deep(.n-divider) {
  background-color: rgba(255, 255, 255, 0.08);
}

/* 按钮样式优化 */
.feedback-card :deep(.n-button) {
  transition: all 0.3s ease;
}

.feedback-card :deep(.n-button:not(.n-button--disabled):hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 159, 244, 0.3);
}

/* 仙林云计算卡片样式 */
.sponsor-card {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
}

.sponsor-card .card-description {
  color: #a0a0a0;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
}

.sponsor-card .card-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.card-description {
  color: var(--app-text-color-2);
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.card-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 更新模态框样式 */
.update-modal-content {
  padding: 0;
  max-height: 65vh;
  overflow-y: auto;
}

.update-modal-content .version-info {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: var(--app-card-color);
  border-radius: 8px;
  margin-bottom: 20px;
}

.update-modal-content .version-info :deep(svg) {
  color: #349ff4;
}

.update-changelog {
  margin-top: 0;
}

.update-changelog .update-info-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text-color-1);
  margin-bottom: 12px;
  padding: 0 4px;
}

.update-changelog .changelog-info {
  margin-top: 0;
  padding: 0 4px;
}

.update-info {
  margin-top: 20px;
}

.update-info-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text-color-1);
  margin-bottom: 12px;
}

.update-content-markdown {
  padding: 12px 0;
  line-height: 1.8;
  font-size: 14px;
  color: var(--app-text-color-2);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Markdown 标题样式 */
.update-content-markdown :deep(h1),
.update-content-markdown :deep(h2),
.update-content-markdown :deep(h3),
.update-content-markdown :deep(h4),
.update-content-markdown :deep(h5),
.update-content-markdown :deep(h6) {
  margin: 16px 0 10px 0;
  font-weight: 600;
  line-height: 1.4;
  color: var(--app-text-color);
}

.update-content-markdown :deep(h1) {
  font-size: 20px;
  border-bottom: 1px solid var(--app-divider-color);
  padding-bottom: 8px;
}

.update-content-markdown :deep(h2) {
  font-size: 18px;
  margin-bottom: 4px;
}

.update-content-markdown :deep(h3) {
  font-size: 16px;
}

.update-content-markdown :deep(h4) {
  font-size: 15px;
}

/* h2下的分割线 */
.update-content-markdown :deep(.h2-divider) {
  border: none;
  border-top: 1px solid var(--app-divider-color);
  margin: 0 0 12px 0;
}

/* 段落样式 */
.update-content-markdown :deep(p) {
  margin: 10px 0;
  line-height: 1.8;
  color: var(--app-text-color-2);
}

/* 列表样式 */
.update-content-markdown :deep(ul),
.update-content-markdown :deep(ol) {
  margin: 12px 0;
  padding-left: 24px;
}

.update-content-markdown :deep(li) {
  margin: 0;
  line-height: 1.8;
  padding-left: 8px;
  color: var(--app-text-color-2);
}

.update-content-markdown :deep(ul li) {
  list-style-type: disc;
}

.update-content-markdown :deep(ul li::marker) {
  font-size: 0.8em;
  color: #4da8f5;
}

.update-content-markdown :deep(ol li) {
  list-style-type: decimal;
}

.update-content-markdown :deep(ol li::marker) {
  font-weight: 600;
  color: #4da8f5;
}

.update-content-markdown :deep(ul ul),
.update-content-markdown :deep(ol ol),
.update-content-markdown :deep(ul ol),
.update-content-markdown :deep(ol ul) {
  margin: 0;
  padding-left: 24px;
}

.update-content-markdown :deep(li p) {
  margin: 2px 0;
}

/* 行内代码样式 */
.update-content-markdown :deep(code.inline-code) {
  background: var(--app-card-color);
  color: #ff6b6b;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 13px;
  border: 1px solid var(--app-border-color);
}

/* 代码块样式 */
.update-content-markdown :deep(pre) {
  background: var(--app-card-color);
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 12px 0;
  border: 1px solid var(--app-border-color);
}

.update-content-markdown :deep(pre code) {
  background: transparent;
  padding: 0;
  border: none;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--app-text-color-2);
}

/* 引用块样式 */
.update-content-markdown :deep(blockquote.custom-blockquote) {
  border-left: 4px solid #4da8f5;
  margin: 12px 0;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0 4px 4px 0;
}

.update-content-markdown :deep(blockquote.custom-blockquote p) {
  margin: 4px 0;
}

/* 链接样式 */
.update-content-markdown :deep(a) {
  color: #4da8f5;
  text-decoration: none;
  transition: color 0.2s;
  font-weight: 500;
  position: relative;
}

.update-content-markdown :deep(a::after) {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 0;
  height: 1px;
  background-color: #6bb8f7;
  transition: width 0.3s ease;
}

.update-content-markdown :deep(a:hover) {
  color: #6bb8f7;
}

.update-content-markdown :deep(a:hover::after) {
  width: 100%;
}

/* 强调文本 */
.update-content-markdown :deep(strong) {
  font-weight: 600;
  color: var(--app-text-color);
}

.update-content-markdown :deep(em) {
  font-style: italic;
}

/* 删除线 */
.update-content-markdown :deep(del) {
  text-decoration: line-through;
}

/* 水平分割线 */
.update-content-markdown :deep(hr) {
  border: none;
  border-top: 1px solid var(--app-divider-color);
  margin: 16px 0;
}

.update-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.update-list li {
  padding: 8px 0;
  color: var(--app-text-color-2);
  font-size: 14px;
  line-height: 1.6;
  border-bottom: 1px solid var(--app-divider-color);
}

.update-list li:last-child {
  border-bottom: none;
}

/* 更新历史模态框样式 */
.changelog-modal-content {
  padding: 0;
  max-height: 65vh;
  overflow-y: auto;
}

.changelog-info {
  margin-top: 0;
  padding: 0 4px;
}

.changelog-content-markdown {
  padding: 16px;
  line-height: 1.8;
  font-size: 14px;
  color: var(--app-text-color-2);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* 复用 update-content-markdown 的所有样式 */
.changelog-content-markdown :deep(h1),
.changelog-content-markdown :deep(h2),
.changelog-content-markdown :deep(h3),
.changelog-content-markdown :deep(h4),
.changelog-content-markdown :deep(h5),
.changelog-content-markdown :deep(h6) {
  margin: 20px 0 12px 0;
  font-weight: 600;
  line-height: 1.4;
  color: var(--app-text-color);
}

.changelog-content-markdown :deep(h1) {
  font-size: 22px;
  border-bottom: 2px solid var(--app-divider-color);
  padding-bottom: 10px;
}

.changelog-content-markdown :deep(h2) {
  font-size: 19px;
  margin-bottom: 8px;
}

.changelog-content-markdown :deep(h3) {
  font-size: 16px;
}

.changelog-content-markdown :deep(h4) {
  font-size: 15px;
}

.changelog-content-markdown :deep(.h2-divider) {
  border: none;
  border-top: 1px solid var(--app-divider-color);
  margin: 0 0 12px 0;
}

.changelog-content-markdown :deep(p) {
  margin: 12px 0;
  line-height: 1.8;
  color: var(--app-text-color-2);
}

.changelog-content-markdown :deep(ul),
.changelog-content-markdown :deep(ol) {
  margin: 12px 0;
  padding-left: 28px;
}

.changelog-content-markdown :deep(li) {
  margin: 6px 0;
  line-height: 1.8;
  padding-left: 8px;
  color: var(--app-text-color-2);
}

.changelog-content-markdown :deep(ul li) {
  list-style-type: disc;
}

.changelog-content-markdown :deep(ul li::marker) {
  font-size: 0.9em;
  color: var(--primary-color);
}

.changelog-content-markdown :deep(ol li) {
  list-style-type: decimal;
}

.changelog-content-markdown :deep(ol li::marker) {
  font-weight: 600;
  color: var(--primary-color);
}

.changelog-content-markdown :deep(ul ul),
.changelog-content-markdown :deep(ol ol),
.changelog-content-markdown :deep(ul ol),
.changelog-content-markdown :deep(ol ul) {
  margin: 4px 0;
  padding-left: 24px;
}

.changelog-content-markdown :deep(li p) {
  margin: 4px 0;
}

.changelog-content-markdown :deep(code.inline-code) {
  background: var(--app-card-color);
  color: #ff6b6b;
  padding: 3px 8px;
  border-radius: 4px;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 13px;
  border: 1px solid var(--app-border-color);
  font-weight: 500;
}

.changelog-content-markdown :deep(pre) {
  background: var(--app-card-color);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
  border: 1px solid var(--app-border-color);
}

.changelog-content-markdown :deep(pre code) {
  background: transparent;
  padding: 0;
  border: none;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--app-text-color-2);
}

.changelog-content-markdown :deep(blockquote.custom-blockquote) {
  border-left: 4px solid var(--primary-color);
  margin: 16px 0;
  padding: 12px 16px;
  background: rgba(24, 144, 255, 0.05);
  border-radius: 0 6px 6px 0;
}

.changelog-content-markdown :deep(blockquote.custom-blockquote p) {
  margin: 6px 0;
}

.changelog-content-markdown :deep(a) {
  color: var(--primary-color);
  text-decoration: none;
  transition: all 0.2s;
  font-weight: 500;
  position: relative;
  border-bottom: 1px solid transparent;
}

.changelog-content-markdown :deep(a:hover) {
  color: var(--primary-color-hover);
  border-bottom-color: var(--primary-color-hover);
}

.changelog-content-markdown :deep(strong) {
  font-weight: 600;
  color: var(--app-text-color);
}

.changelog-content-markdown :deep(em) {
  font-style: italic;
  color: var(--app-text-color-2);
}

.changelog-content-markdown :deep(del) {
  text-decoration: line-through;
  opacity: 0.7;
}

.changelog-content-markdown :deep(hr) {
  border: none;
  border-top: 1px solid var(--app-divider-color);
  margin: 20px 0;
}

.no-changelog {
  text-align: center;
  padding: 60px 20px;
  color: var(--app-text-color-3);
}

.changelog-version {
  margin-bottom: 24px;
  padding: 20px;
  background: var(--app-card-color);
  border-radius: 12px;
  border: 1px solid var(--app-border-color);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.changelog-version::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, var(--primary-color) 0%, var(--primary-color-hover) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.changelog-version:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.1);
  transform: translateY(-2px);
}

.changelog-version:hover::before {
  opacity: 1;
}

.changelog-version:last-child {
  margin-bottom: 0;
}

.version-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--app-divider-color);
}

.version-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text-color);
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
  border-radius: 6px;
}

.version-date {
  font-size: 13px;
  color: var(--app-text-color-3);
  font-weight: 500;
}

.changelog-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.changelog-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 8px;
  color: var(--app-text-color-2);
  font-size: 14px;
  line-height: 1.7;
  border-radius: 8px;
  transition: all 0.2s ease;
  position: relative;
}

.changelog-item:last-child {
  padding-bottom: 0;
}

.changelog-item:hover {
  background: rgba(24, 144, 255, 0.05);
  padding-left: 12px;
  padding-right: 12px;
}

.changelog-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  margin-top: 2px;
}

.changelog-icon svg {
  width: 16px;
  height: 16px;
}

.changelog-text {
  flex: 1;
  word-break: break-word;
}

/* 滚动条样式 */
.changelog-modal-content::-webkit-scrollbar {
  width: 8px;
}

.changelog-modal-content::-webkit-scrollbar-track {
  background: transparent;
}

.changelog-modal-content::-webkit-scrollbar-thumb {
  background: var(--app-border-color);
  border-radius: 4px;
}

.changelog-modal-content::-webkit-scrollbar-thumb:hover {
  background: var(--app-text-color-3);
}
</style>
