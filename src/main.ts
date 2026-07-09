import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";

// Naive UI - 按需导入并全局注册
import {
  NConfigProvider,
  NLoadingBarProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  NLayout,
  NLayoutContent,
  NSpin,
  NButton,
  NButtonGroup,
  NCard,
  NInput,
  NForm,
  NFormItem,
  NSpace,
  NSwitch,
  NAlert,
  NModal,
  NResult,
  NEmpty,
  NSkeleton,
  NMenu,
  NIcon,
  NDropdown,
  NPopover,
  NTooltip,
  NTag,
  NDivider,
  NSelect,
  NCheckbox,
  NRadio,
  NRadioGroup,
  NInputNumber,
  NDatePicker,
  NProgress,
  NCollapse,
  NCollapseItem,
  NTabs,
  NTabPane,
} from "naive-ui";

// 全局样式
import "@/styles/markdown.css";
import "@/styles/theme-transitions.css";

const app = createApp(App);
const pinia = createPinia();

// 全局注册 Naive UI 组件
const components = {
  NConfigProvider,
  NLoadingBarProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  NLayout,
  NLayoutContent,
  NSpin,
  NButton,
  NButtonGroup,
  NCard,
  NInput,
  NForm,
  NFormItem,
  NSpace,
  NSwitch,
  NAlert,
  NModal,
  NResult,
  NEmpty,
  NSkeleton,
  NMenu,
  NIcon,
  NDropdown,
  NPopover,
  NTooltip,
  NTag,
  NDivider,
  NSelect,
  NCheckbox,
  NRadio,
  NRadioGroup,
  NInputNumber,
  NDatePicker,
  NProgress,
  NCollapse,
  NCollapseItem,
  NTabs,
  NTabPane,
};

Object.entries(components).forEach(([name, component]) => {
  app.component(name, component);
});

app.use(router);
app.use(pinia);
app.mount("#app");
