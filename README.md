# ME-Frp XL Client

基于 [Tauri 2](https://v2.tauri.app/) 的 [ME-Frp](https://www.mefrp.com/) 第三方桌面客户端，支持 Windows 平台。

## 功能

- **隧道管理** — 创建、编辑、删除隧道，支持批量强制下线/删除，配置导出
- **仪表盘** — 流量图表、服务器状态与统计概览
- **节点状态** — 节点负载查看，集成地图展示
- **用户中心** — 个人资料、CDK 兑换、验证码
- **抽奖** — 内置抽奖功能
- **操作日志** — 操作记录查询
- **外观定制** — 自定义背景图、透明度/模糊调节、明暗主题切换、主题编辑器
- **自动启动隧道** — 应用启动时自动运行指定隧道
- **自动更新** — 启动时检查更新
- **内嵌 WebUI** — 应用内直接访问 ME-Frp 官方 WebUI
- **反馈提交** — 客户端内提交反馈

## 技术栈

| 前端 | 桌面端 |
| --- | --- |
| Vue 3 (Composition API) | Tauri 2 (Rust) |
| TypeScript | reqwest (HTTP 代理请求) |
| Naive UI | serde / serde_json / serde_yaml |
| Pinia | tauri-plugin-opener/fs/dialog |
| Vue Router | tauri-plugin-single-instance |
| Vite | tauri-plugin-autostart |
| ECharts | mefrpc.exe (内建 frpc 核心) |
| Lucide / marked / highlight.js | NSIS 安装包构建 |

## 快速开始

### 环境

- Node.js >= 18
- pnpm >= 8
- Rust >= 1.70
- [Tauri CLI](https://v2.tauri.app/start/cli/)

### 运行

```bash
pnpm install
pnpm tauri dev     # 开发模式
pnpm tauri build   # 构建安装包
```

## 项目结构

```
.
├── src/                    # 前端源码
│   ├── api/                # API 客户端（auth, tunnel, node, system）
│   ├── components/         # Vue 组件
│   │   ├── common/         #   通用组件
│   │   ├── create-tunnel/  #   创建隧道
│   │   ├── settings/       #   设置页
│   │   ├── tunnel/         #   隧道管理
│   │   └── appearance/     #   外观定制
│   ├── composables/        # 组合式函数
│   ├── stores/             # Pinia 状态管理
│   ├── utils/              # 工具函数
│   ├── types/              # TypeScript 类型
│   ├── router/             # 路由
│   └── config/             # 配置
├── src-tauri/              # Rust 后端
│   ├── src/                #   Rust 源码
│   ├── bin/                #   mefrpc.exe
│   └── tauri.conf.json     #   Tauri 配置
├── feedbacks.php           # 反馈接收端点
├── apidoc/                 # API 文档
└── docs/                   # 内部文档
```

## 构建

```bash
pnpm tauri build
```

输出路径：`src-tauri/target/release/bundle/nsis/`

## 相关链接

- [ME-Frp](https://www.mefrp.com/)
- [Tauri 2](https://v2.tauri.app/)

## 许可证

[GNU General Public License v3.0 (GPLv3)](LICENSE)

本项目基于 GPLv3 开源：您可以自由使用、修改和分发，但衍生作品必须同样以 GPLv3 协议开源。
