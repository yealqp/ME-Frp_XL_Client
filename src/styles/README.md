# 统一 Markdown 样式使用说明

## 概述

`markdown.css` 提供了统一的 Markdown 渲染样式，用于系统公告、普通公告、更新日志、系统消息等所有需要渲染 Markdown 内容的地方。

## 使用方法

### 1. 全局导入（已完成）

样式已在 `src/main.ts` 中全局导入：

```typescript
import "@/styles/markdown.css";
```

### 2. 在组件中使用

在需要渲染 Markdown 内容的元素上添加 `markdown-content` 类：

```vue
<template>
  <div class="markdown-content" v-html="parseMarkdown(content)"></div>
</template>
```

### 3. 自定义颜色

如果需要为特定组件自定义文本颜色（如灰色文本），可以在组件的 scoped 样式中覆盖：

```css
/* 自定义颜色示例 */
.my-component .markdown-content {
  color: #a0a0a0;
}

.my-component .markdown-content :deep(p),
.my-component .markdown-content :deep(li) {
  color: #a0a0a0;
}

.my-component .markdown-content :deep(h1),
.my-component .markdown-content :deep(h2),
.my-component .markdown-content :deep(strong) {
  color: #ffffff;
}
```

## 已应用的组件

- `Dashboard.vue` - 系统公告、重要公告
- `About.vue` - 更新日志、更新内容

## 系统通知

系统通知（notification.txt）使用纯文本渲染，不使用 Markdown 样式。

## 样式特性

- 标题层级样式（h1-h6）
- 段落和列表样式
- 行内代码和代码块
- 引用块
- 链接（带下划线动画）
- 强调文本（粗体、斜体、删除线）
- 水平分割线
- 表格样式

## 注意事项

1. 不要在组件中重复定义这些样式
2. 如需自定义，只覆盖必要的属性（如颜色）
3. 保持样式的一致性
