<template>
  <div class="about">
    <div class="about-content">
      <n-card :bordered="true" class="app-info">
        <template #header>
          <img src="../assets/icon.png" alt="logo" class="logo" />
        </template>
        <div class="app-logo">ME-Frp XL客户端</div>
        <p class="description"></p>
      </n-card>

      <n-card :bordered="true" class="tech-stack">
        <template #header>关于ME-Frp XL客户端</template>
        <n-descriptions label-placement="left" bordered :column="2">
          <n-descriptions-item label="版本"> v{{ appVersion }} </n-descriptions-item>
          <n-descriptions-item label="开发者">
            <div class="member-avatar-wrapper">
              <img
                src="https://img.fastmirror.net/s/2025/08/26/68adce35907c1.jpg"
                :alt="`yealqp Avatar`"
                class="member-avatar-img"
              />
              <a>Yealqp/猫羽雫 @1592239257</a>
            </div>
          </n-descriptions-item>
          <n-descriptions-item label="技术栈">
            <n-space>
              <n-tag :bordered="false" type="success"> Vue3 </n-tag>
              <n-tag :bordered="false" type="info"> TypeScript </n-tag>
              <n-tag :bordered="false" type="warning"> Naive UI </n-tag>
              <n-tag :bordered="false" type="error"> Vite </n-tag>
              <n-tag :bordered="false" type="info"> Tauri 2 </n-tag>
              <n-tag :bordered="false" type="error"> Rust </n-tag>
            </n-space>
          </n-descriptions-item>
        </n-descriptions>
      </n-card>
      <!-- 一言卡片 -->
      <n-card :bordered="true" class="hitokoto-card">
        <div class="hitokoto-content">
          <div class="hitokoto-text">
            <i class="fas fa-quote-left quote-icon"></i>
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
                <i class="fas fa-sync-alt"></i>
              </template>
              换一句
            </n-button>
          </div>
        </div>
      </n-card>

      <!-- 检查更新卡片 -->
      <n-card :bordered="true" class="update-card">
        <template #header>
          <div class="section-header">
            <i class="fas fa-sync-alt"></i>
            <span>检查更新</span>
          </div>
        </template>
        <div class="update-content">
          <n-button
            type="primary"
            size="large"
            @click="checkForUpdates"
            :loading="updateChecking"
            block
          >
            <template #icon>
              <i class="fas fa-download"></i>
            </template>
            {{ updateChecking ? "检查中..." : "检查更新" }}
          </n-button>
        </div>
      </n-card>
    </div>

    <!-- 更新提示模态框 -->
    <n-modal
      v-model:show="showUpdateModal"
      preset="card"
      :style="{ width: '500px' }"
      title="发现新版本"
    >
      <div class="update-modal-content">
        <div class="version-info">
          <n-space align="center" :size="16">
            <n-tag type="info" :bordered="false" size="large">
              v{{ currentVersion }}
            </n-tag>
            <i class="fas fa-arrow-right"></i>
            <n-tag type="success" :bordered="false" size="large">
              v{{ latestVersion }}
            </n-tag>
          </n-space>
        </div>

        <div v-if="updateInfo.length > 0" class="update-info">
          <p class="update-info-title">更新内容：</p>
          <ul class="update-list">
            <li v-for="(info, index) in updateInfo" :key="index">
              {{ info }}
            </li>
          </ul>
        </div>
      </div>

      <template #footer>
        <n-space justify="end">
          <n-button @click="handleCancelUpdate">稍后提醒</n-button>
          <n-button type="primary" @click="handleUpdate">
            <template #icon>
              <i class="fas fa-download"></i>
            </template>
            立即更新
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  useMessage,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NSpace,
  NTag,
  NButton,
  NModal,
} from "naive-ui";
import { invoke } from "@tauri-apps/api/core";

interface UpdateCheckResult {
  has_update: boolean;
  latest_version: string;
  current_version: string;
  update_info: string[];
}

interface Hitokoto {
  sentence: string;
  from: string;
  from_who: string;
  type: string;
}

const message = useMessage();
const updateChecking = ref(false);
const showUpdateModal = ref(false);
const latestVersion = ref("");
const currentVersion = ref("");
const updateInfo = ref<string[]>([]);
const appVersion = ref("加载中...");

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
    const version = await invoke<string>("get_app_version");
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

// 处理更新
const handleUpdate = async () => {
  try {
    showUpdateModal.value = false;
    message.loading("正在下载更新...", { duration: 0 });
    
    await invoke("download_and_install_update", { 
      version: latestVersion.value 
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
</script>
<style scoped>
.about {
  padding: 0;
}

.about-content {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 一言卡片样式 */
.hitokoto-card {
  border: none;
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
  font-size: 20px;
  color: rgba(255, 255, 255, 0.6);
  flex-shrink: 0;
  margin-top: 4px;
}

.hitokoto-sentence {
  font-size: 16px;
  line-height: 1.8;
  color: #ffffff;
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
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
}

.hitokoto-author {
  margin-left: 4px;
  color: rgba(255, 255, 255, 0.9);
}

.hitokoto-actions {
  display: flex;
  justify-content: center;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.hitokoto-actions .n-button {
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
}

.hitokoto-actions .n-button:hover {
  color: #ffffff;
  transform: scale(1.05);
}

.hitokoto-actions .n-button :deep(.n-button__icon) {
  color: rgba(255, 255, 255, 0.9);
}

.app-info {
  text-align: center;
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
  background-color: #18181c;
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
}

/* 检查更新卡片样式 */
.update-card {
  background: #18181c;
  border: 1px solid #29292c;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}

.section-header i {
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

/* 更新模态框样式 */
.update-modal-content {
  padding: 16px 0;
}

.version-info {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: #18181c;
  border-radius: 8px;
}

.version-info i {
  color: #349ff4;
  font-size: 18px;
}

.update-info {
  margin-top: 20px;
}

.update-info-title {
  font-size: 14px;
  font-weight: 600;
  color: #ffffffd1;
  margin-bottom: 12px;
}

.update-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.update-list li {
  padding: 8px 0;
  color: #a0a0a0;
  font-size: 14px;
  line-height: 1.6;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.update-list li:last-child {
  border-bottom: none;
}
</style>
