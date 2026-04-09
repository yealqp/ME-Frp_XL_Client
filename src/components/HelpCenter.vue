<template>
  <div class="help-center">
    <div class="help-grid">
      <!-- 官方QQ群 -->
      <n-card title="官方 QQ 群" hoverable>
        <template #header-extra>
          <div class="tags">
            <n-tag type="success" size="small">推荐</n-tag>
            <n-tag type="info" size="small">快速响应</n-tag>
          </div>
        </template>
        <p class="card-description">
          加入用户交流群获取帮助，与其他用户交流使用经验，快速解决问题
        </p>
        <template #footer>
          <div class="card-actions">
            <n-button-group style="width: 100%">
              <n-button type="primary" @click="joinQQGroup1" style="flex: 1">
                加入一群
              </n-button>
              <n-button @click="copyQQGroup1" style="flex: 1">
                复制群号
              </n-button>
              <n-button type="primary" @click="joinQQGroup2" style="flex: 1">
                加入二群
              </n-button>
              <n-button @click="copyQQGroup2" style="flex: 1">
                复制群号
              </n-button>
            </n-button-group>
          </div>
        </template>
      </n-card>

      <!-- 用户支持邮箱 -->
      <n-card title="用户支持邮箱" hoverable>
        <template #header-extra>
          <div class="tags">
            <n-tag type="warning" size="small">慢速</n-tag>
            <n-tag type="warning" size="small">24-48 小时回复</n-tag>
          </div>
        </template>
        <p class="card-description">
          适合需要详细描述的问题和建议，我们会认真处理每一封邮件
        </p>
        <template #footer>
          <div class="card-actions">
            <n-button type="primary" @click="sendEmail" style="width: 100%"
              >发送邮件</n-button
            >
          </div>
        </template>
      </n-card>

      <!-- 飞书群 -->
      <n-card title="飞书群" hoverable>
        <template #header-extra>
          <div class="tags">
            <n-tag type="success" size="small">推荐</n-tag>
            <n-tag type="info" size="small">快速响应</n-tag>
          </div>
        </template>
        <p class="card-description">加入用户交流群获取帮助</p>
        <template #footer>
          <div class="card-actions">
            <n-button type="primary" @click="joinFeishu" style="width: 100%"
              >加入飞书群</n-button
            >
          </div>
        </template>
      </n-card>

      <!-- 企业微信群 -->
      <n-card title="企业微信群" hoverable>
        <template #header-extra>
          <div class="tags">
            <n-tag type="error" size="small">不推荐</n-tag>
            <n-tag type="info" size="small">快速响应</n-tag>
          </div>
        </template>
        <p class="card-description">由于腾讯钱没圈够，我们用不了了</p>
        <template #footer>
          <div class="card-actions">
            <n-button type="primary" disabled style="flex: 1">
              一年要吃我们三百块，跟狼一样
            </n-button>
          </div>
        </template>
      </n-card>

      <!-- 官方文档 -->
      <n-card title="官方文档" hoverable>
        <template #header-extra>
          <div class="tags">
            <n-tag type="success" size="small">推荐</n-tag>
            <n-tag type="primary" size="small">全面</n-tag>
          </div>
        </template>
        <p class="card-description">
          文档详尽，覆盖全面，包含详细的使用说明和常见问题解答
        </p>
        <template #footer>
          <div class="card-actions">
            <n-button type="primary" @click="openDocs" style="width: 100%"
              >查看文档</n-button
            >
          </div>
        </template>
      </n-card>

      <!-- 政策与条款 -->
      <n-card title="政策与条款" hoverable>
        <template #header-extra>
          <div class="tags">
            <n-tag type="error" size="small">重要</n-tag>
          </div>
        </template>
        <p class="card-description">
          查看 ME Frp 的内容策略、服务条款和隐私政策
        </p>
        <template #footer>
          <div class="card-actions">
            <n-button-group style="width: 100%">
              <n-button
                type="primary"
                @click="openPolicy('content')"
                style="flex: 1"
                >内容策略</n-button
              >
              <n-button
                type="primary"
                @click="openPolicy('terms')"
                style="flex: 1"
                >服务条款</n-button
              >
              <n-button
                type="primary"
                @click="openPolicy('privacy')"
                style="flex: 1"
                >隐私政策</n-button
              >
            </n-button-group>
          </div>
        </template>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMessage, NCard, NButton, NTag, NButtonGroup } from "naive-ui";
import { openUrl } from "@tauri-apps/plugin-opener";

const message = useMessage();

// QQ群相关
const joinQQGroup1 = async () => {
  try {
    await openUrl("https://qm.qq.com/q/XX6tpcvNo4");
    message.success("正在跳转到QQ群");
  } catch (error) {
    message.error("打开链接失败");
  }
};

const copyQQGroup1 = () => {
  navigator.clipboard
    .writeText("1019501085")
    .then(() => {
      message.success("QQ群号已复制到剪贴板");
    })
    .catch(() => {
      message.error("复制失败，请手动复制群号：1019501085");
    });
};

// QQ群相关
const joinQQGroup2 = async () => {
  try {
    await openUrl("https://qm.qq.com/q/fBtW7lJ1Xa");
    message.success("正在跳转到QQ群");
  } catch (error) {
    message.error("打开链接失败");
  }
};

const copyQQGroup2 = () => {
  navigator.clipboard
    .writeText("708797546")
    .then(() => {
      message.success("QQ群号已复制到剪贴板");
    })
    .catch(() => {
      message.error("复制失败，请手动复制群号：708797546");
    });
};

// 邮箱支持
const sendEmail = async () => {
  try {
    await openUrl("mailto:support@mefrp.com");
    message.success("正在打开邮件客户端");
  } catch (error) {
    message.error("打开邮件客户端失败");
  }
};

// 飞书群
const joinFeishu = async () => {
  try {
    await openUrl(
      "https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=874l3500-4e85-4a04-a4b4-cbc02945de90",
    );
    message.success("正在跳转到飞书群");
  } catch (error) {
    message.error("打开链接失败");
  }
};

// 官方文档
const openDocs = async () => {
  try {
    await openUrl("https://www.mefrp.com/docs");
    message.success("正在打开官方文档");
  } catch (error) {
    message.error("打开链接失败");
  }
};

// 打开政策页面
const openPolicy = async (tab: string) => {
  const policyUrls: Record<string, string> = {
    content: "https://www.mefrp.com/policy?tab=content",
    terms: "https://www.mefrp.com/policy?tab=terms",
    privacy: "https://www.mefrp.com/policy?tab=privacy",
  };

  const url = policyUrls[tab];
  if (url) {
    try {
      await openUrl(url);
      message.success("正在打开政策页面");
    } catch (error) {
      message.error("打开链接失败");
    }
  }
};
</script>

<style scoped>
.help-center {
  padding: 24px;
  min-height: 100vh;
}

.help-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  width: 100%;
}

/* 帮助中心卡片样式 */
.help-grid :deep(.n-card) {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.card-description {
  line-height: 1.6;
  margin: 0;
  font-size: 14px;
  color: var(--n-text-color);
}

.card-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
}

@media (max-width: 768px) {
  .help-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .help-center {
    padding: 16px;
  }
}
</style>
