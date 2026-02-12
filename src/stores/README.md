# Pinia Stores

This directory contains all Pinia store modules for global state management.

## Structure

```
stores/
├── index.ts              # Export entry for all stores
├── auth.ts              # Authentication state ✅
├── user.ts              # User information state ✅
├── tunnel.ts            # Tunnel management state ✅
├── settings.ts          # Application settings state ✅
├── createTunnel.ts      # Create tunnel flow state ✅
├── ui.ts                # UI state ✅
└── __tests__/           # Store tests
    ├── pinia-integration.test.ts
    ├── auth.test.ts
    ├── auth.properties.test.ts
    ├── user.test.ts
    ├── user.properties.test.ts
    ├── tunnel.test.ts
    ├── tunnel.properties.test.ts
    ├── settings.properties.test.ts
    ├── createTunnel.properties.test.ts
    ├── ui.test.ts
    └── ui.properties.test.ts
```

## Store Architecture

### Auth Store (`auth.ts`)
**职责**: 管理用户认证状态和基本信息

**State**:
- `isLoggedIn`: 登录状态
- `isCheckingAuth`: 正在检查认证状态
- `userToken`: 用户 token
- `username`: 用户名
- `group`: 用户组
- `frpToken`: FRP token

**Actions**:
- `checkAuthStatus()`: 从 UnifiedConfig 加载并验证认证状态（带重试逻辑）
- `login(userInfo)`: 处理登录成功，更新状态
- `logout()`: 清除认证信息，调用其他 stores 清理数据

**Getters**:
- `isAuthenticated`: 返回登录状态

### User Store (`user.ts`)
**职责**: 管理用户详细信息和相关操作

**State**:
- `userInfo`: 用户详细信息对象
- `loading`: 加载状态
- `error`: 错误信息

**Actions**:
- `loadUserInfo()`: 从 Tauri API 加载用户信息
- `refreshUserInfo()`: 刷新用户信息（签到、CDK 兑换后调用）
- `clearUserInfo()`: 清除用户信息（登出时调用）

**Getters**:
- `formattedBandwidth(type)`: 格式化带宽显示（Mbps）
- `formattedTraffic`: 格式化流量显示（GB）
- `formattedRegTime`: 格式化注册时间（YYYY-MM-DD）

### Tunnel Store (`tunnel.ts`)
**职责**: 管理隧道列表和运行状态

**State**:
- `tunnels`: 隧道列表
- `runningTunnels`: 运行中的隧道 ID 集合
- `nodeNameMap`: 节点 ID -> 名称映射
- `nodeHostnameMap`: 节点 ID -> 主机名映射
- `loading`: 加载状态
- `error`: 错误信息
- `actionLoading`: 单个隧道操作加载状态

**Actions**:
- `loadTunnels()`: 加载隧道列表和节点信息
- `refreshTunnels()`: 刷新隧道列表和运行状态
- `startTunnel(proxyId)`: 启动指定隧道
- `stopTunnel(proxyId)`: 停止指定隧道
- `clearTunnels()`: 清除隧道数据（登出时调用）

**Getters**:
- `getTunnelById(id)`: 根据 ID 获取隧道
- `getNodeName(nodeId)`: 根据节点 ID 获取节点名称
- `getNodeHostname(nodeId)`: 根据节点 ID 获取主机名
- `onlineTunnelsCount`: 在线隧道数量
- `totalTunnelsCount`: 总隧道数量

### Settings Store (`settings.ts`)
**职责**: 管理应用设置

**State**:
- `settings`: 应用设置对象（autoStart, alwaysOnTop, autoUpdate, 等）
- `loading`: 加载状态
- `error`: 错误信息

**Actions**:
- `loadSettings()`: 从 UnifiedConfig 加载设置
- `saveSettings()`: 保存设置到 UnifiedConfig
- `updateSetting(key, value)`: 更新单个设置项
- `updateAutoStartTunnels(tunnelIds)`: 更新自启动隧道列表（验证有效性）

**Getters**:
- `isAutoStartEnabled`: 是否启用开机自启动
- `autoStartTunnelsList`: 自启动隧道列表

### CreateTunnel Store (`createTunnel.ts`)
**职责**: 管理创建隧道的多步骤流程状态

**State**:
- `currentPage`: 当前页面（'node-selection' | 'tunnel-config'）
- `selectedNode`: 选中的节点

**Actions**:
- `selectNode(node)`: 选择节点并切换到隧道配置页面
- `goBackToNodeSelection()`: 返回节点选择页面
- `resetCreateFlow()`: 重置创建流程状态

**Getters**:
- `isNodeSelected`: 是否已选择节点
- `currentPageName`: 当前页面名称

### UI Store (`ui.ts`)
**职责**: 管理全局 UI 状态

**State**:
- `theme`: 主题（'light' | 'dark'）
- `customTheme`: 自定义主题配置
- `showAd`: 是否显示广告

**Actions**:
- `toggleTheme()`: 切换主题
- `updateShowAd(show)`: 更新广告显示状态（同步到 eventBus）
- `initTheme()`: 初始化主题配置

**Getters**:
- `currentTheme`: 当前主题对象
- `isDarkMode`: 是否为暗色模式

## Store 间通信

```
Auth Store (核心)
  ├─→ User Store: 登出时清除用户信息
  └─→ Tunnel Store: 登出时清除隧道数据

Settings Store
  └─→ Tunnel Store: 验证自启动隧道 ID

UI Store
  ↔ eventBus: 同步广告显示状态
```

## Usage

### 基本用法

```typescript
import { useAuthStore, useUserStore } from '@/stores';
import { storeToRefs } from 'pinia';

// In component setup
const authStore = useAuthStore();

// ✅ 使用 storeToRefs 解构 state/getters（保持响应性）
const { isLoggedIn, username } = storeToRefs(authStore);

// ✅ Actions 可以直接解构（已绑定到 store 实例）
const { login, logout } = authStore;

// ❌ 错误：直接解构 state 会失去响应性
const { isLoggedIn } = authStore; // 不会响应变化
```

### 在组件中使用

```vue
<script setup lang="ts">
import { useAuthStore, useUserStore } from '@/stores';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const userStore = useUserStore();

// 解构响应式状态
const { isLoggedIn, username } = storeToRefs(authStore);
const { userInfo, loading } = storeToRefs(userStore);

// 调用 actions
const handleLogin = async () => {
  await authStore.login({ userToken: 'xxx', username: 'user' });
  await userStore.loadUserInfo();
};

const handleLogout = async () => {
  await authStore.logout(); // 会自动清理 User Store 和 Tunnel Store
};
</script>

<template>
  <div v-if="isLoggedIn">
    <p>欢迎, {{ username }}</p>
    <button @click="handleLogout">登出</button>
  </div>
  <div v-else>
    <button @click="handleLogin">登录</button>
  </div>
</template>
```

### Store 间通信示例

```typescript
// Auth Store 中调用其他 stores
async function logout() {
  // 清除本地状态
  isLoggedIn.value = false;
  
  // 动态导入避免循环依赖
  const { useUserStore } = await import('./user');
  const { useTunnelStore } = await import('./tunnel');
  
  const userStore = useUserStore();
  const tunnelStore = useTunnelStore();
  
  userStore.clearUserInfo();
  tunnelStore.clearTunnels();
}
```

## Testing

### 运行测试

```bash
# 运行所有测试
npm run test:run

# 运行测试并查看覆盖率
npm run test:coverage

# 运行测试 UI
npm run test:ui
```

### 测试结构

- **单元测试** (`*.test.ts`): 测试 store 的基本功能和边界情况
- **属性测试** (`*.properties.test.ts`): 使用 fast-check 进行基于属性的测试，每个属性测试 100 次迭代

### 测试覆盖率

```
Test Files: 11 passed (11)
Tests: 93 passed (93)
- Unit Tests: 74 passed
- Property Tests: 19 passed (100 iterations each)
```

## Best Practices

### 1. 使用 storeToRefs 保持响应性

```typescript
// ✅ 正确
const { isLoggedIn } = storeToRefs(authStore);

// ❌ 错误
const { isLoggedIn } = authStore; // 失去响应性
```

### 2. Actions 可以直接解构

```typescript
// ✅ Actions 已绑定到 store 实例
const { login, logout } = authStore;
```

### 3. 避免循环依赖

```typescript
// ✅ 在 action 中动态导入
async function logout() {
  const { useUserStore } = await import('./user');
  const userStore = useUserStore();
  userStore.clearUserInfo();
}

// ❌ 在顶层导入可能导致循环依赖
import { useUserStore } from './user';
```

### 4. 合理使用 Getters

```typescript
// ✅ 复杂计算使用 getters
const onlineTunnelsCount = computed(() => 
  tunnels.value.filter(t => t.isOnline).length
);

// ✅ 简单访问直接使用 state
const isLoggedIn = authStore.isLoggedIn;
```

### 5. 统一的错误处理

```typescript
async function loadData() {
  loading.value = true;
  error.value = '';
  
  try {
    const data = await invoke('api_call');
    state.value = data;
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
    console.error('Failed to load data:', err);
  } finally {
    loading.value = false;
  }
}
```

## Store Implementation Status

- [x] Pinia initialized in main.ts
- [x] Store directory structure created
- [x] Type definitions created
- [x] Auth Store - 完成 ✅
- [x] User Store - 完成 ✅
- [x] Tunnel Store - 完成 ✅
- [x] Settings Store - 完成 ✅
- [x] CreateTunnel Store - 完成 ✅
- [x] UI Store - 完成 ✅
- [x] Component migration - 完成 ✅
- [x] Unit tests - 完成 ✅ (93 tests passed)
- [x] Property-based tests - 完成 ✅ (19 tests, 100 iterations each)

## Performance

### 优化建议

1. **使用 computed 缓存计算结果**
2. **避免在 store 中存储大量冗余数据**
3. **使用 v-memo 优化列表渲染**
4. **并行调用 Tauri API**
5. **使用 debounce 避免频繁调用 actions**

详见: [性能优化建议](.kiro/specs/pinia-state-management/PERFORMANCE_RECOMMENDATIONS.md)

## Manual Testing

完整的手动测试清单: [手动测试清单](.kiro/specs/pinia-state-management/MANUAL_TESTING_CHECKLIST.md)

## References

- [Pinia Documentation](https://pinia.vuejs.org/)
- [Design Document](../../.kiro/specs/pinia-state-management/design.md)
- [Requirements](../../.kiro/specs/pinia-state-management/requirements.md)
- [Tasks](../../.kiro/specs/pinia-state-management/tasks.md)
- [Performance Recommendations](../../.kiro/specs/pinia-state-management/PERFORMANCE_RECOMMENDATIONS.md)
- [Manual Testing Checklist](../../.kiro/specs/pinia-state-management/MANUAL_TESTING_CHECKLIST.md)
