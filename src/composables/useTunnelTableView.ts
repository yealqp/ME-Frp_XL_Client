import { computed, h, type Ref } from "vue";
import { NButton, NIcon, NSkeleton, NSpace, NTag } from "naive-ui";
import { Copy, FileText, Play, Square } from "@lucide/vue";
import type { Tunnel } from "@/types/tunnel";
import TunnelMoreMenu from "@/components/tunnel/TunnelMoreMenu.vue";
import { parseDomainArray } from "@/utils/domainUtils";

interface UseTunnelTableViewOptions {
  batchMode: Ref<boolean>;
  selectedTunnels: Ref<Set<number>>;
  nodeNameMap: Ref<Record<number, string>>;
  runningTunnels: Ref<Set<number>>;
  actionLoading: Ref<Record<number, boolean>>;
  usingConfigFile: Ref<number[]>;
  onToggleSelection: (tunnelId: number) => void;
  onStart: (tunnelId: number) => void | Promise<void>;
  onStop: (tunnelId: number) => void | Promise<void>;
  onViewLogs: (tunnelId: number) => void | Promise<void>;
  onCopyAddress: (tunnelId: number) => void | Promise<void>;
  onMoreAction: (action: string, tunnelId: number) => void | Promise<void>;
}

export function useTunnelTableView({
  batchMode,
  selectedTunnels,
  nodeNameMap,
  runningTunnels,
  actionLoading,
  usingConfigFile,
  onToggleSelection,
  onStart,
  onStop,
  onViewLogs,
  onCopyAddress,
  onMoreAction,
}: UseTunnelTableViewOptions) {
  const skeletonTableColumns = [
    { title: "ID", key: "id", width: 80 },
    { title: "隧道名称", key: "name", width: 150 },
    { title: "状态", key: "status", width: 120 },
    { title: "协议", key: "protocol", width: 80 },
    { title: "节点", key: "node", width: 150 },
    { title: "本地地址", key: "local", width: 150 },
    { title: "远程端口/域名", key: "remote", width: 200 },
    { title: "操作", key: "actions", width: 280, fixed: "right" as const },
  ];

  const skeletonTableData = computed(() =>
    Array.from({ length: 8 }, () => ({
      id: h(NSkeleton, { text: true, width: "50px", height: "22px" }),
      name: h(NSkeleton, { text: true, width: "110px", height: "14px" }),
      status: h(NSpace, { size: 4 }, () => [
        h(NSkeleton, { text: true, width: "45px", height: "22px" }),
        h(NSkeleton, { text: true, width: "45px", height: "22px" }),
      ]),
      protocol: h(NSkeleton, { text: true, width: "50px", height: "22px" }),
      node: h(NSkeleton, { text: true, width: "130px", height: "14px" }),
      local: h(NSkeleton, { text: true, width: "120px", height: "14px" }),
      remote: h(NSkeleton, { text: true, width: "100px", height: "14px" }),
      actions: h(NSpace, { size: 4 }, () => [
        h(NSkeleton, { text: true, width: "60px", height: "28px" }),
        h(NSkeleton, { text: true, width: "60px", height: "28px" }),
        h(NSkeleton, { text: true, width: "40px", height: "28px" }),
      ]),
    })),
  );

  function getRowClassName(row: Tunnel) {
    if (!batchMode.value) {
      return "";
    }
    return selectedTunnels.value.has(row.proxyId) ? "selected-row" : "";
  }

  function getRowProps(row: Tunnel) {
    if (!batchMode.value) {
      return {};
    }

    return {
      style: "cursor: pointer;",
      onClick: () => onToggleSelection(row.proxyId),
    };
  }

  const tableColumns = computed(() => [
    {
      title: "ID",
      key: "proxyId",
      width: 80,
      render: (row: Tunnel) =>
        h(NTag, { type: "info", bordered: false, size: "small" }, { default: () => `#${row.proxyId}` }),
    },
    {
      title: "隧道名称",
      key: "proxyName",
      width: 150,
      ellipsis: { tooltip: true },
    },
    {
      title: "状态",
      key: "status",
      width: 120,
      render: (row: Tunnel) =>
        h(NSpace, { size: 4 }, () => [
          row.isDisabled
            ? h(NTag, { type: "warning", bordered: false, size: "small" }, { default: () => "已禁用" })
            : null,
          h(
            NTag,
            {
              type: row.isOnline ? "success" : "default",
              bordered: false,
              size: "small",
            },
            { default: () => (row.isOnline ? "在线" : "离线") },
          ),
        ]),
    },
    {
      title: "协议",
      key: "proxyType",
      width: 80,
      render: (row: Tunnel) =>
        h(NTag, { bordered: false, size: "small" }, { default: () => row.proxyType.toUpperCase() }),
    },
    {
      title: "节点",
      key: "nodeId",
      width: 150,
      ellipsis: { tooltip: true },
      render: (row: Tunnel) => `#${row.nodeId} - ${nodeNameMap.value[row.nodeId] || "未知节点"}`,
    },
    {
      title: "本地地址",
      key: "local",
      width: 150,
      render: (row: Tunnel) => `${row.localIp}:${row.localPort}`,
    },
    {
      title: "远程端口/域名",
      key: "remote",
      width: 200,
      render: (row: Tunnel) => {
        if (row.proxyType === "tcp" || row.proxyType === "udp") {
          return String(row.remotePort);
        }

        if (row.domain) {
          const domains = parseDomainArray(row.domain);
          return h(NSpace, { size: 4, vertical: true }, () =>
            domains.map((domain) =>
              h(NTag, { type: "info", bordered: false, size: "small" }, { default: () => domain }),
            ),
          );
        }

        return "-";
      },
    },
    {
      title: "操作",
      key: "actions",
      width: 280,
      fixed: "right" as const,
      render: (row: Tunnel) => {
        const isRunning = runningTunnels.value.has(row.proxyId);
        const isLoading = actionLoading.value[row.proxyId] || false;

        return h(NSpace, { size: 4 }, () => [
          isRunning
            ? h(
                NButton,
                {
                  type: "warning",
                  size: "small",
                  loading: isLoading,
                  onClick: () => onStop(row.proxyId),
                },
                {
                  icon: () => h(NIcon, null, { default: () => h(Square, { size: 14 }) }),
                  default: () => "停止",
                },
              )
            : h(
                NButton,
                {
                  type: "primary",
                  size: "small",
                  loading: isLoading,
                  onClick: () => onStart(row.proxyId),
                },
                {
                  icon: () => h(NIcon, null, { default: () => h(Play, { size: 14 }) }),
                  default: () => "启动",
                },
              ),
          isRunning
            ? h(
                NButton,
                {
                  type: "info",
                  size: "small",
                  onClick: () => onViewLogs(row.proxyId),
                },
                {
                  icon: () => h(NIcon, null, { default: () => h(FileText, { size: 14 }) }),
                  default: () => "日志",
                },
              )
            : null,
          h(
            NButton,
            {
              size: "small",
              onClick: () => onCopyAddress(row.proxyId),
            },
            {
              icon: () => h(NIcon, null, { default: () => h(Copy, { size: 14 }) }),
              default: () => "复制地址",
            },
          ),
          h(TunnelMoreMenu, {
            tunnel: row,
            usingConfigFile: usingConfigFile.value.includes(row.proxyId),
            onSelect: (action: string, tunnelId: number) => onMoreAction(action, tunnelId),
          }),
        ]);
      },
    },
  ]);

  return {
    skeletonTableColumns,
    skeletonTableData,
    getRowClassName,
    getRowProps,
    tableColumns,
  };
}
