import { invoke } from "@tauri-apps/api/core";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";

let hasReportedDashboardAnalysis = false;
let reportingDashboardAnalysis: Promise<void> | null = null;

export async function reportDashboardAnalysis() {
  if (hasReportedDashboardAnalysis || reportingDashboardAnalysis) {
    return;
  }

  const authStore = useAuthStore();
  if (!authStore.isLoggedIn) {
    return;
  }

  reportingDashboardAnalysis = (async () => {
    try {
      const userStore = useUserStore();
      await userStore.loadUserInfo();

      const userInfo = userStore.userInfo;
      if (!userInfo) {
        return;
      }

      await invoke<string>("api_report_analysis", {
        meFrpId: userInfo.userId,
        username: userInfo.username,
        email: userInfo.email,
      });

      hasReportedDashboardAnalysis = true;
    } catch (error) {
      console.error("Dashboard analysis report failed:", error);
    } finally {
      reportingDashboardAnalysis = null;
    }
  })();

  return reportingDashboardAnalysis;
}
