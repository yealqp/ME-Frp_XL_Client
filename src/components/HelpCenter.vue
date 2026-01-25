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
            <n-button-group>
              <n-button type="primary" @click="joinQQGroup1">
                加入一群
              </n-button>
              <n-button @click="copyQQGroup1"> 复制群号 </n-button>
            </n-button-group>
            <n-button-group>
              <n-button type="primary" @click="joinQQGroup2">
                加入二群
              </n-button>
              <n-button @click="copyQQGroup2"> 复制群号 </n-button>
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
            <n-button type="primary" @click="sendEmail">发送邮件</n-button>
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
            <n-button type="primary" @click="joinFeishu">加入飞书群</n-button>
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
            <n-button type="primary" @click="openDocs">查看文档</n-button>
          </div>
        </template>
      </n-card>
      <n-card title="桌面版反馈" hoverable>
        <template #header-extra>
          <div class="tags">
            <n-tag type="success" size="small">推荐</n-tag>
            <n-tag type="info" size="small">快速响应</n-tag>
          </div>
        </template>
        <p class="card-description">
          如果发现图形化客户端的BUG 或者有任何建议 欢迎去QQ群找@1592239257反馈
        </p>
        <template #footer>
          <div class="card-actions">
            <n-button type="primary" @click="sendyEmail">发送邮件</n-button>
            <n-button type="primary" @click="OpenDownloadpage"
              >查看下载页</n-button
            >
          </div>
        </template>
      </n-card>
      <n-card title="仙林云计算" hoverable>
        <template #header-extra>
          <div class="tags">
            <n-tag type="success" size="small">低价</n-tag>
            <n-tag type="info" size="small">种类多样</n-tag>
          </div>
        </template>
        <p class="card-description">赞助商 低价云服务器 NAT机 挂机宝</p>
        <template #footer>
          <div class="card-actions">
            <n-button type="primary" @click="xlwy">点击前往</n-button>
            <n-button type="primary" @click="xlqq">QQ群</n-button>
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
            <n-button type="success" @click="openPolicy('content')"
              >内容策略</n-button
            >
            <n-button type="success" @click="openPolicy('terms')"
              >服务条款</n-button
            >
            <n-button type="success" @click="openPolicy('privacy')"
              >隐私政策</n-button
            >
          </div>
        </template>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMessage, NCard, NButton, NTag } from "naive-ui";

const message = useMessage();

// QQ群相关
const joinQQGroup1 = () => {
  // 打开QQ群链接
  window.open("https://qm.qq.com/q/XX6tpcvNo4", "_blank");
  message.success("正在跳转到QQ群");
};

const copyQQGroup1 = () => {
  // 复制QQ群号
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
const joinQQGroup2 = () => {
  // 打开QQ群链接
  window.open("https://qm.qq.com/q/fBtW7lJ1Xa", "_blank");
  message.success("正在跳转到QQ群");
};

const copyQQGroup2 = () => {
  // 复制QQ群号
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
const sendEmail = () => {
  // 打开邮件客户端
  window.open("mailto:support@mefrp.com?subject=ME-Frp XL用户支持", "_blank");
  message.success("正在打开邮件客户端");
};
const OpenDownloadpage = () => {
  // 打开下载页面
  window.open("https://alist.yealqp.cn/", "_blank");
  message.success("正在打开下载页面");
};

const xlwy = () => {
  // 打开邮件客户端
  window.open("https://www.idcxl.cn/", "_blank");
  message.success("正在跳转到仙林云计算");
};

const xlqq = () => {
  // 打开邮件客户端
  window.open(
    "https://qm.qq.com/cgi-bin/qm/qr?k=S5tzhFVCoN28LIyPA5BJEZ0EFayLz4zh&jump_from=webapi&authKey=/FxL2ZT41DaqB5gyb8f9jauks1L6b/143XAXv5z0MhYkET0OeVdyT+umItJVlzrL",
    "_blank",
  );
  message.success("正在跳转到仙林云计算QQ群");
};

const sendyEmail = () => {
  // 打开邮件客户端
  window.open("mailto:yealqp@163.com", "_blank");
  message.success("正在打开邮件客户端");
};
// 飞书群
const joinFeishu = () => {
  // 打开飞书群链接
  window.open(
    "https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=874l3500-4e85-4a04-a4b4-cbc02945de90",
    "_blank",
  );
  message.success("正在跳转到飞书群");
};

// 官方文档
const openDocs = () => {
  // 打开官方文档
  window.open("https://www.mefrp.com/docs", "_blank");
  message.success("正在打开官方文档");
};

// 打开政策页面
const openPolicy = (tab: string) => {
  const policyUrls: Record<string, string> = {
    content: "https://www.mefrp.com/policy?tab=content",
    terms: "https://www.mefrp.com/policy?tab=terms",
    privacy: "https://www.mefrp.com/policy?tab=privacy",
  };

  const url = policyUrls[tab];
  if (url) {
    window.open(url, "_blank");
    message.success("正在打开政策页面");
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
  max-width: 1200px;
  margin: 0 auto;
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
}

@media (max-width: 768px) {
  .help-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .help-center {
    padding: 16px;
  }

  .card-actions {
    flex-direction: column;
  }
}
</style>
