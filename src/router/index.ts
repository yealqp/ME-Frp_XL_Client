import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { invoke } from "@tauri-apps/api/core";
import type { UnifiedConfig } from "../types/config";

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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫 - 检查登录状态
router.beforeEach(async (to, _from, next) => {
  // 登录页面直接放行
  if (to.path === "/login") {
    next();
    return;
  }

  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    try {
      const config = await invoke<UnifiedConfig>("load_unified_config");
      const isLoggedIn = config && config.userToken;

      if (isLoggedIn) {
        next();
      } else {
        next("/login");
      }
    } catch (error) {
      console.error("路由守卫检查登录状态失败:", error);
      next("/login");
    }
  } else {
    next();
  }
});

export default router;
