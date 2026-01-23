<template>
  <div class="about">
    <div class="about-content">
      <n-card :bordered="true" class="app-info">
        <template #header>
          <img src="../assets/icon.png" alt="logo" class="logo">
        </template>
        <div class="app-logo">ME-Frp XL客户端</div>
        <p class="description"></p>
      </n-card>

      <n-card :bordered="true" class="tech-stack">
        <template #header>关于ME-Frp XL客户端</template>
        <n-descriptions label-placement="left" bordered :column="2">
          <n-descriptions-item label="版本">
            v1.5.7
          </n-descriptions-item>
          <n-descriptions-item label="开发者">
            <div class="member-avatar-wrapper">
              <img src="https://img.fastmirror.net/s/2025/08/26/68adce35907c1.jpg" :alt="`yealqp Avatar`"
                class="member-avatar-img">
              <a>Yealqp/猫羽雫 @1592239257</a>
            </div>
          </n-descriptions-item>
          <n-descriptions-item label="技术栈">
            <n-space>
              <n-tag :bordered="false" type="success">
                Vue3
              </n-tag>
              <n-tag :bordered="false" type="info">
                TypeScript
              </n-tag>
              <n-tag :bordered="false" type="warning">
                Naive UI
              </n-tag>
              <n-tag :bordered="false" type="error">
                Vite
              </n-tag>
              <n-tag :bordered="false" type="info">
                Tauri 2
              </n-tag>
              <n-tag :bordered="false" type="error">
                Rust
              </n-tag>
            </n-space>
          </n-descriptions-item>

        </n-descriptions>
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
      preset="dialog"
      type="warning"
      title="发现新版本"
      :positive-text="'立即更新'"
      :negative-text="'稍后提醒'"
      @positive-click="handleUpdate"
      @negative-click="handleCancelUpdate"
    >
      <p>发现新版本 {{ latestVersion }}，当前版本 {{ currentVersion }}，是否要立即更新？</p>
      <p style="color: #f0a020; margin-top: 8px;">
        <i class="fas fa-exclamation-triangle"></i>
        注意: 更新前请关闭进程或所有正在运行的隧道。
      </p>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useMessage, NCard, NDescriptions, NDescriptionsItem, NSpace, NTag, NButton, NModal } from "naive-ui";
import { invoke } from "@tauri-apps/api/core";

interface UpdateCheckResult {
  has_update: boolean;
  latest_version: string;
  current_version: string;
}

const message = useMessage();
const updateChecking = ref(false);
const showUpdateModal = ref(false);
const latestVersion = ref("");
const currentVersion = ref("");

// 检查更新
const checkForUpdates = async () => {
  updateChecking.value = true;
  try {
    const result = (await invoke("check_for_updates")) as UpdateCheckResult;
    if (result.has_update) {
      latestVersion.value = result.latest_version;
      currentVersion.value = result.current_version;
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
const handleUpdate = () => {
  message.info("正在准备更新...");
  window.open(
    "https://alist.yealqp.cn/ME-Frp%20XL%20%E5%AE%A2%E6%88%B7%E7%AB%AF",
    "_blank",
  );
};

// 处理取消更新
const handleCancelUpdate = () => {
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
</style>