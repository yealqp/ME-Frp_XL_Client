import { ref, onBeforeUnmount } from "vue";
import { useMessage } from "naive-ui";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { createCaptcha } from "@/utils/captcha";
import { handleApiError } from "@/utils/errorHandler";
import { redeemCdk, getCdkHistory } from "@/api/auth";
import { formatTimestamp as formatTimestampUtil } from "@/utils/timeFormatter";
import type { CdkHistoryLog } from "@/types/user";

export function useCdkRedeem() {
  const message = useMessage();
  const authStore = useAuthStore();
  const userStore = useUserStore();

  const cdkCode = ref("");
  const isRedeeming = ref(false);
  const showCdkModal = ref(false);
  const cdkCaptchaToken = ref("");

  const cdkCaptchaInstance = createCaptcha({
    onError: (error) => {
      console.error("CDK 验证错误:", error);
      message.error(`人机验证失败: ${error}`);
    },
  });

  const cdkHistory = ref<CdkHistoryLog[]>([]);
  const cdkHistoryLoading = ref(false);
  const cdkHistoryTotal = ref(0);

  const showCdkDialog = () => {
    cdkCode.value = "";
    cdkCaptchaToken.value = "";
    showCdkModal.value = true;
  };

  const performCdkRedeem = async () => {
    if (!cdkCode.value.trim()) {
      message.error("请输入CDK兑换码");
      return;
    }

    if (isRedeeming.value) {
      return;
    }

    isRedeeming.value = true;

    try {
      message.loading("正在进行人机验证...", { duration: 0 });
      const token = await cdkCaptchaInstance.verify();
      cdkCaptchaToken.value = token;

      message.destroyAll();
      message.loading("正在兑换中...", { duration: 0 });

      const result = await redeemCdk(authStore.userToken, cdkCode.value.trim(), cdkCaptchaToken.value);
      message.destroyAll();

      const { type, value } = result.data as unknown as { type: string; value: number };
      let rewardText = "";

      switch (type) {
        case "proxy":
          rewardText = `隧道数 ${value} 条`;
          break;
        case "traffic":
          rewardText = `流量 ${value} GB`;
          break;
        case "vip":
          rewardText = `高级会员 ${value} 天`;
          break;
        default:
          rewardText = `${type} ${value}`;
      }

      message.success(`兑换成功，获得${rewardText}`);
      showCdkModal.value = false;
      cdkCode.value = "";
      cdkCaptchaToken.value = "";

      loadCdkHistory();
      userStore.refreshUserInfo();
    } catch (error) {
      message.destroyAll();
      const errorMessage = handleApiError(error, "CDK兑换失败", "CDK兑换失败");
      message.error(errorMessage);
    } finally {
      isRedeeming.value = false;
    }
  };

  const loadCdkHistory = async () => {
    cdkHistoryLoading.value = true;
    try {
      const result = await getCdkHistory(authStore.userToken);

      const logs = result.data?.logs || [];
      cdkHistory.value = logs.map(log => ({
        logId: log.logId,
        code: log.code,
        username: log.username || "",
        type: log.type,
        value: log.value,
        useTime: log.useTime * 1000,
        clientIp: log.clientIp || "",
        userAgent: log.userAgent || "",
      } as CdkHistoryLog));
      cdkHistoryTotal.value = logs.length;
    } catch (error) {
      const errorMessage = handleApiError(error, "加载CDK兑换历史失败", "加载CDK兑换历史失败");
      message.error(errorMessage);
      cdkHistory.value = [];
      cdkHistoryTotal.value = 0;
    } finally {
      cdkHistoryLoading.value = false;
    }
  };

  const getCdkTypeName = (type: string): string => {
    const typeMap: Record<string, string> = {
      traffic: "流量",
      proxy: "隧道",
      vip: "会员",
    };
    return typeMap[type] || type;
  };

  const getCdkValueLabel = (type: string): string => {
    const labelMap: Record<string, string> = {
      traffic: "获得流量",
      proxy: "获得隧道",
      vip: "获得会员",
    };
    return labelMap[type] || "获得";
  };

  const formatCdkValue = (type: string, value: number): string => {
    switch (type) {
      case "traffic":
        return `${value} GB`;
      case "proxy":
        return `${value} 条隧道`;
      case "vip":
        return `${value} 天会员`;
      default:
        return `${value}`;
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    return formatTimestampUtil(timestamp, { format: "datetime" });
  };

  onBeforeUnmount(() => {
    cdkCaptchaInstance.destroy();
  });

  return {
    cdkCode,
    isRedeeming,
    showCdkModal,
    cdkCaptchaToken,
    cdkHistory,
    cdkHistoryLoading,
    cdkHistoryTotal,
    showCdkDialog,
    performCdkRedeem,
    loadCdkHistory,
    getCdkTypeName,
    getCdkValueLabel,
    formatCdkValue,
    formatTimestamp,
  };
}
