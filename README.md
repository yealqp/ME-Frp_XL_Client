# ME-Frp 第三方 XL客户端

一个基于 Tauri 2 + Vue 3 + TypeScript 的现代化 ME-Frp 桌面客户端。

## 特性

- 🚀 **现代化技术栈**: 使用 Vue 3 Composition API、TypeScript、Pinia 状态管理
- 🎨 **精美 UI**: 基于 Naive UI 组件库，提供流畅的用户体验
- ⚡ **高性能**: 使用 Tauri 2 框架，体积小、启动快
- 🔧 **易于维护**: 代码优化后减少 30-40% 代码行数，消除 80% 重复代码
- 🛠️ **开发友好**: 完整的 TypeScript 类型定义，单元测试和属性测试覆盖
- 📦 **批量操作**: 支持批量强制下线和批量删除隧道，提高管理效率

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **UI 组件库**: Naive UI
- **状态管理**: Pinia
- **类型系统**: TypeScript
- **构建工具**: Vite
- **桌面框架**: Tauri 2
- **后端语言**: Rust

## 项目结构

```
.
├── src/
│   ├── components/          # Vue 组件
│   │   ├── common/         # 可复用组件
│   │   │   ├── UserInfoCard.vue      # 用户信息卡片
│   │   │   └── SkeletonLoader.vue    # 骨架屏组件
│   │   ├── Dashboard.vue
│   │   ├── UserCenter.vue
│   │   ├── TunnelManagement.vue
│   │   └── ...
│   ├── composables/        # Vue Composables
│   │   ├── useApi.ts       # API 调用处理
│   │   └── useLoading.ts   # 加载状态管理
│   ├── stores/             # Pinia Stores
│   │   ├── helpers/
│   │   │   └── asyncAction.ts  # 异步操作辅助
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   └── tunnel.ts
│   ├── utils/              # 工具函数
│   │   ├── timeFormatter.ts    # 时间格式化
│   │   └── markdownParser.ts   # Markdown 解析
│   ├── types/              # TypeScript 类型定义
│   └── App.vue
├── src-tauri/              # Tauri 后端代码
├── docs/                   # 文档
│   ├── MIGRATION_GUIDE.md  # 迁移指南
│   └── COMPONENTS.md       # 组件文档
└── .kiro/                  # 规范文档
    └── specs/
        └── frontend-code-optimization/

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8
- Rust >= 1.70
- Tauri CLI

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm tauri dev
```

### 构建应用

```bash
pnpm tauri build
```

## 开发指南

### 代码优化

本项目经过系统化的代码优化，引入了以下工具和组件：

#### Composables

- **useApi**: 统一的 API 调用处理，自动处理 JSON 解析和错误
- **useLoading**: 统一的加载状态管理

#### 工具函数

- **timeFormatter**: 时间格式化工具（formatTimestamp, formatBandwidth, formatTraffic）
- **markdownParser**: Markdown 解析器，支持自定义渲染规则

#### 可复用组件

- **UserInfoCard**: 用户信息卡片组件，支持自定义字段和插槽
- **SkeletonLoader**: 骨架屏组件，支持多种类型（list, card, table, text）

#### Store 辅助

- **createAsyncAction**: 异步操作辅助函数，支持乐观更新和回滚

### 使用示例

#### API 调用

```typescript
import { useApi } from "@/composables/useApi";

const { data, loading, execute } = useApi({
  command: "api_get_user_info",
  onSuccess: (data) => {
    message.success("加载成功");
  }
});

await execute();
```

#### 用户信息卡片

```vue
<template>
  <UserInfoCard
    :user-info="userInfo"
    :loading="loading"
  >
    <template #footer>
      <n-button @click="handleRefresh">刷新</n-button>
    </template>
  </UserInfoCard>
</template>
```

详细文档请参考：
- [迁移指南](./docs/MIGRATION_GUIDE.md)
- [组件文档](./docs/COMPONENTS.md)
- [批量操作功能](./docs/batch-operations.md)
- [批量操作使用指南](./docs/batch-operations-usage.md)

### 测试

```bash
# 运行所有测试
pnpm vitest

# 运行单元测试
pnpm vitest run

# 运行属性测试
pnpm vitest run --grep "Property"
```

### 代码检查

```bash
# ESLint 检查
pnpm lint

# ESLint 自动修复
pnpm lint --fix

# TypeScript 类型检查
pnpm type-check
```

## 优化成果

- ✅ 代码行数减少 30-40%
- ✅ 重复代码消除 80%
- ✅ TypeScript 类型覆盖率 100%
- ✅ 单元测试覆盖率 >80%（新代码）
- ✅ 所有新工具都有属性测试

## 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 遵循 ESLint 和 Prettier 配置
- 使用 TypeScript 并提供完整类型定义
- 为新功能编写单元测试
- 更新相关文档

## 许可证

本项目采用 MIT 许可证。

## 致谢

- [ME-Frp](https://www.mefrp.com/) - 提供 Frp 服务
- [Tauri](https://tauri.app/) - 跨平台桌面应用框架
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Naive UI](https://www.naiveui.com/) - Vue 3 组件库

## 联系方式

- 开发者: Yealqp/猫羽雫
- QQ: 1592239257
- 邮箱: im@yealqp.cn

