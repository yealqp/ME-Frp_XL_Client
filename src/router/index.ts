import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { startLoading, finishLoading, errorLoading } from "../composables/useLoadingBar";
import { useAuthStore } from "@/stores/auth";

// 使用动态导入进行代码分割
const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("../components/Login.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: () => import("../components/Dashboard.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/create-tunnel",
    name: "CreateTunnel",
    component: () => import("../components/CreateTunnel.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/tunnel-management",
    name: "TunnelManagement",
    component: () => import("../components/TunnelManagement.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/node-status",
    name: "NodeStatus",
    component: () => import("../components/NodeStatus.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/mefrp-webui",
    name: "MEFrpWebUI",
    component: () => import("../components/MEFrpWebUI.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/user-center",
    name: "UserCenter",
    component: () => import("../components/UserCenter.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/operation-log",
    name: "OperationLog",
    component: () => import("../components/OperationLog.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/settings",
    name: "Settings",
    component: () => import("../components/Settings.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/theme-editor",
    name: "ThemeEditor",
    component: () => import("../components/ThemeEditorPage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/help-center",
    name: "HelpCenter",
    component: () => import("../components/HelpCenter.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/about",
    name: "About",
    component: () => import("../components/About.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/privacy-policy",
    name: "PrivacyPolicy",
    component: () => import("../components/PrivacyPolicy.vue"),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫 - 检查登录状态
router.beforeEach(async (to, _from) => {
  // Start loading bar (will be handled gracefully even if instance is not ready)
  startLoading();

  // 根路径重定向到 dashboard
  if (to.path === "/") {
    return "/dashboard";
  }

  // 登录页面直接放行
  if (to.path === "/login") {
    return true;
  }

  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    const authStore = useAuthStore();
    if (authStore.isLoggedIn) {
      return true;
    }
    return "/login";
  } else {
    return true;
  }
});

// Finish loading bar after navigation
router.afterEach(() => {
  // Use a small delay to ensure the loading bar instance is ready
  setTimeout(() => {
    finishLoading();
  }, 50);
});

// Handle navigation errors
router.onError(() => {
  errorLoading();
});

export default router;
