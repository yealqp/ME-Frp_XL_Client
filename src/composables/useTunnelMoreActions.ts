import { useDialog, useMessage } from "naive-ui";
import type { Ref } from "vue";
import type { Tunnel } from "@/types/tunnel";
import { useTunnelStore } from "@/stores/tunnel";
import { extractErrorMessage } from "@/utils/errorHandler";
import { parseDomainArray } from "@/utils/domainUtils";
import { copyToClipboard } from "@/utils/clipboard";

interface UseTunnelMoreActionsOptions {
  tunnels: Ref<Tunnel[]>;
  nodeHostnameMap: Ref<Record<number, string>>;
  onViewDetails: (tunnelId: number) => void;
  onEditTunnel: (tunnelId: number) => void;
  onUseConfigFile: (tunnelId: number) => Promise<void>;
  onViewConfigFile: (tunnelId: number) => Promise<void>;
  onSwitchToQuickStart: (tunnelId: number) => Promise<void>;
  onDeleteSuccess?: (tunnelId: number) => void;
}

export function useTunnelMoreActions({
  tunnels,
  nodeHostnameMap,
  onViewDetails,
  onEditTunnel,
  onUseConfigFile,
  onViewConfigFile,
  onSwitchToQuickStart,
  onDeleteSuccess,
}: UseTunnelMoreActionsOptions) {
  const message = useMessage();
  const dialog = useDialog();
  const tunnelStore = useTunnelStore();

  /**
   * 获取节点主机名地址
   *
   * 注意：找不到隧道或节点映射缺失时返回 `null`（而非占位字符串），
   * 便于调用方用 `if (!nodeAddress)` 正确拦截，避免复制出 "未知:端口"
   */
  function getNodeAddress(proxyId: number): string | null {
    const tunnel = tunnels.value.find((item) => item.proxyId === proxyId);
    if (!tunnel) {
      return null;
    }

    return nodeHostnameMap.value?.[tunnel.nodeId] || null;
  }

  async function kickTunnel(tunnelId: number) {
    try {
      await tunnelStore.kickTunnel(tunnelId, { reEnableAfterKick: true });
      message.success("隧道已强制下线");
    } catch (err) {
      console.error("强制下线失败:", err);
      message.error(extractErrorMessage(err, "强制下线失败"));
    }
  }

  async function toggleTunnel(tunnelId: number, enable: boolean) {
    try {
      await tunnelStore.toggleTunnel(tunnelId, enable);
      message.success(enable ? "隧道已启用" : "隧道已禁用");
    } catch (err) {
      console.error("切换隧道状态失败:", err);
      message.error(extractErrorMessage(err, enable ? "启用隧道失败" : "禁用隧道失败"));
    }
  }

  async function copyRemoteAddress(tunnelId: number, selectedDomain?: string) {
    try {
      const tunnel = tunnels.value.find((item) => item.proxyId === tunnelId);
      if (!tunnel) {
        message.error("未找到隧道信息");
        return;
      }

      let remoteAddress: string;

      const parseDomain = (domain: string): string => {
        if (!domain) return "";
        if (selectedDomain) return selectedDomain;
        const domains = parseDomainArray(domain);
        return domains.length > 0 ? domains[0] : domain;
      };

      if (tunnel.proxyType === "http") {
        if (!tunnel.domain) {
          message.error("该隧道未配置域名");
          return;
        }
        remoteAddress = `http://${parseDomain(tunnel.domain)}`;
      } else if (tunnel.proxyType === "https") {
        if (!tunnel.domain) {
          message.error("该隧道未配置域名");
          return;
        }
        remoteAddress = `https://${parseDomain(tunnel.domain)}`;
      } else {
        const nodeAddress = getNodeAddress(tunnelId);
        if (!nodeAddress) {
          message.error("无法获取节点地址，请刷新隧道列表后重试");
          return;
        }
        remoteAddress = `${nodeAddress}:${tunnel.remotePort}`;
      }

      await copyToClipboard(remoteAddress);

      message.success(`远程地址已复制: ${remoteAddress}`);
    } catch (err) {
      console.error("复制远程地址失败:", err);
      message.error("复制远程地址失败");
    }
  }

  async function handleMoreAction(action: string, tunnelId: number) {
    const tunnel = tunnels.value.find((item) => item.proxyId === tunnelId);

    switch (action) {
      case "view-details":
        onViewDetails(tunnelId);
        break;
      case "edit":
        onEditTunnel(tunnelId);
        break;
      case "use-config":
        await onUseConfigFile(tunnelId);
        break;
      case "view-config":
        await onViewConfigFile(tunnelId);
        break;
      case "use-quick-start":
        await onSwitchToQuickStart(tunnelId);
        break;
      case "enable":
        if (tunnel) {
          dialog.info({
            title: "确认启用",
            content: `确定要启用隧道 "${tunnel.proxyName}" 吗？`,
            positiveText: "确认启用",
            negativeText: "取消",
            onPositiveClick: async () => {
              await toggleTunnel(tunnelId, true);
            },
          });
        }
        break;
      case "disable":
        if (tunnel) {
          dialog.warning({
            title: "确认禁用",
            content: `确定要禁用隧道 "${tunnel.proxyName}" 吗？禁用后将无法启动此隧道。`,
            positiveText: "确认禁用",
            negativeText: "取消",
            onPositiveClick: async () => {
              await toggleTunnel(tunnelId, false);
            },
          });
        }
        break;
      case "kick":
        if (tunnel) {
          dialog.error({
            title: "确认强制下线",
            content: `确定要强制下线隧道 "${tunnel.proxyName}" 吗？这将立即断开所隧道连接。`,
            positiveText: "确认下线",
            negativeText: "取消",
            onPositiveClick: async () => {
              await kickTunnel(tunnelId);
            },
          });
        }
        break;
      case "delete":
        if (tunnel) {
          dialog.error({
            title: "确认删除",
            content: `确定要删除隧道 "${tunnel.proxyName}" 吗？删除后将无法恢复。`,
            positiveText: "确认删除",
            negativeText: "取消",
            onPositiveClick: async () => {
              try {
                await tunnelStore.deleteTunnel(tunnelId);
                message.success("隧道删除成功");
                onDeleteSuccess?.(tunnelId);
              } catch (err) {
                console.error("删除隧道失败:", err);
                message.error(extractErrorMessage(err, "删除隧道失败"));
              }
            },
          });
        }
        break;
    }
  }

  return {
    getNodeAddress,
    kickTunnel,
    toggleTunnel,
    copyRemoteAddress,
    handleMoreAction,
  };
}
