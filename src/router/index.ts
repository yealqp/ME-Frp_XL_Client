import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Dashboard from "../components/Dashboard.vue";
import CreateTunnel from "../components/CreateTunnel.vue";
import TunnelManagement from "../components/TunnelManagement.vue";
import UserCenter from "../components/UserCenter.vue";
import Settings from "../components/Settings.vue";
import HelpCenter from "../components/HelpCenter.vue";
import About from "../components/About.vue";
import Login from "../components/Login.vue";
import OperationLog from "../components/OperationLog.vue";
import { invoke } from "@tauri-apps/api/core";
import type { UnifiedConfig } from "../types/config";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { requiresAuth: false },
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  {
    path: "/create-tunnel",
    name: "CreateTunnel",
    component: CreateTunnel,
    meta: { requiresAuth: true },
  },
  {
    path: "/tunnel-management",
    name: "TunnelManagement",
    component: TunnelManagement,
    meta: { requiresAuth: true },
  },
  {
    path: "/user-center",
    name: "UserCenter",
    component: UserCenter,
    meta: { requiresAuth: true },
  },
  {
    path: "/operation-log",
    name: "OperationLog",
    component: OperationLog,
    meta: { requiresAuth: true },
  },
  {
    path: "/settings",
    name: "Settings",
    component: Settings,
    meta: { requiresAuth: true },
  },
  {
    path: "/help-center",
    name: "HelpCenter",
    component: HelpCenter,
    meta: { requiresAuth: true },
  },
  {
    path: "/about",
    name: "About",
    component: About,
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
      const isLoggedIn =
        config && (config.apiStatus === "connected" || config.userToken);

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
