<template>
  <div class="about">
    <div class="about-content">
      <n-card :bordered="true" class="app-info">
        <template #header>
          <img src="../assets/icon.png" alt="logo" class="logo">
        </template>
        <div class="app-logo">ME-Frp 非官方客户端</div>
        <p class="description"></p>
      </n-card>

      <n-card :bordered="true" class="tech-stack">
        <template #header>关于面板</template>
        <n-descriptions label-placement="left" bordered :column="2">
          <n-descriptions-item label="版本">
            v1.5
          </n-descriptions-item>
          <n-descriptions-item label="开发者">
            <a href="https://github.com/Yealqp">Yealqp</a>
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
    </div>
  </div>
</template>

<script setup lang="ts">


// 应用信息
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
</style>