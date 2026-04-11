import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
function getNaiveUiFallbackChunk(id: string): string {
  const match = id.match(/node_modules\/naive-ui\/(?:es|lib)\/([^/]+)/);
  const segment = match?.[1];

  if (!segment) {
    return "naive-ui-other";
  }

  const normalized = segment.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  return `naive-ui-${normalized}`;
}

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  // Handle font assets properly
  assetsInclude: ['**/*.woff', '**/*.woff2', '**/*.eot', '**/*.ttf', '**/*.otf'],
  // 优化依赖预构建
  optimizeDeps: {
    include: ['@cap.js/widget'],
  },
  build: {
    // 启用代码分割
    rollupOptions: {
      output: {
        // 手动分割代码块
        manualChunks(id) {
          // 将 Vue 相关库分离
          if (id.includes('node_modules/vue/') || id.includes('node_modules/vue-router/') || id.includes('node_modules/pinia/')) {
            return 'vue-vendor';
          }
          
          // 将 Naive UI 按功能模块细分
          if (id.includes('node_modules/naive-ui/')) {
            // 基础组件（按钮、卡片、输入框等）
            if (id.includes('/button/') || id.includes('/card/') || id.includes('/input/') || 
                id.includes('/space/') || id.includes('/form/')) {
              return 'naive-ui-basic';
            }
            // 选择与输入扩展组件
            if (id.includes('/input-number/') || id.includes('/radio/') ||
                id.includes('/checkbox/') || id.includes('/switch/') ||
                id.includes('/slider/') || id.includes('/select/')) {
              return 'naive-ui-selection';
            }
            // 反馈组件（消息、通知、对话框等）
            if (id.includes('/message/') || id.includes('/notification/') || 
                id.includes('/dialog/') || id.includes('/modal/') || 
                id.includes('/alert/') || id.includes('/result/')) {
              return 'naive-ui-feedback';
            }
            // 数据展示组件（表格、骨架屏、空状态等）
            if (id.includes('/table/') || id.includes('/skeleton/') || 
                id.includes('/empty/') || id.includes('/spin/') ||
                id.includes('/descriptions/')) {
              return 'naive-ui-data';
            }
            // 浮层与菜单组件
            if (id.includes('/dropdown/') || id.includes('/popover/') ||
                id.includes('/tooltip/') || id.includes('/popconfirm/')) {
              return 'naive-ui-overlay';
            }
            // 布局与展示组件
            if (id.includes('/tabs/') || id.includes('/divider/') ||
                id.includes('/tag/') || id.includes('/text/')) {
              return 'naive-ui-layout';
            }

            return getNaiveUiFallbackChunk(id);
          }
          
          // 将 ECharts 分离到单独的块
          if (id.includes('node_modules/echarts/')) {
            return 'echarts';
          }
          // 将 Tauri API 分离
          if (id.includes('node_modules/@tauri-apps/')) {
            return 'tauri';
          }
          // 将图标库分离
          if (id.includes('node_modules/lucide-vue-next/')) {
            return 'icons';
          }
          // 将 markdown-it 分离
          if (id.includes('node_modules/markdown-it/')) {
            return 'markdown';
          }
        },
        // 资源文件命名
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && /\.(woff|woff2|eot|ttf|otf)$/.test(assetInfo.name)) {
            return 'webfonts/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        // 代码块命名
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
      },
      external: [],
    },
    // 确保 cap.js 依赖被正确包含
    commonjsOptions: {
      include: [/node_modules/],
    },
    // 启用压缩（rolldown 自带压缩）
    minify: true,
    // 设置代码块大小警告限制
    chunkSizeWarningLimit: 600,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 设置目标环境以优化输出
    target: 'esnext',
  },
});
