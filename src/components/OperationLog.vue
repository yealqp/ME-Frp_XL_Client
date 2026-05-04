<template>
  <div class="operation-log">
    <div class="page-header">
      <h2 class="page-title">操作日志</h2>
      <n-button type="primary" @click="refreshLogs" :loading="loading">
        <template #icon>
          <RefreshCw :size="16" />
        </template>
        刷新
      </n-button>
    </div>

    <!-- 筛选器 -->
    <n-card class="filter-card" :bordered="true">
      <n-space vertical :size="16">
        <n-space :size="12">
          <n-select
            v-model:value="filters.category"
            placeholder="操作分类"
            clearable
            style="width: 200px"
            :options="categoryOptions"
            @update:value="onFilterChange"
          />
          <n-select
            v-model:value="filters.status"
            placeholder="操作状态"
            clearable
            style="width: 150px"
            :options="statusOptions"
            @update:value="onFilterChange"
          />
          <n-date-picker
            v-model:value="filters.dateRange"
            type="datetimerange"
            clearable
            style="width: 400px"
            :default-time="['00:00:00', '23:59:59']"
          />
          <n-button type="primary" @click="applyFilters">
            <template #icon>
              <Filter :size="16" />
            </template>
            筛选
          </n-button>
          <n-button @click="resetFilters">
            <template #icon>
              <RotateCcw :size="16" />
            </template>
            重置
          </n-button>
        </n-space>
      </n-space>
    </n-card>

    <!-- 日志表格 -->
    <n-card class="table-card" :bordered="true">
      <n-data-table
        :columns="columns"
        :data="logs"
        :loading="loading"
        :pagination="paginationConfig"
        :bordered="false"
        remote
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted, reactive } from "vue";
import { useMessage, NTag, NDataTable } from "naive-ui";
import type { DataTableColumns } from "naive-ui";
import { RefreshCw, Filter, RotateCcw } from "lucide-vue-next";
import { extractErrorMessage } from "@/utils/errorHandler";
import { getOperationLogs } from "@/api/system";
import { useAuthStore } from "@/stores/auth";

interface OperationLog {
  logId: number;
  category: string;
  details: string;
  ipAddress: string;
  status: string;
  createdAt: string;
}

interface LogPageData {
  data: OperationLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const message = useMessage();
const authStore = useAuthStore();
const loading = ref(false);
const logs = ref<OperationLog[]>([]);

// 筛选器
const filters = reactive({
  category: null as string | null,
  status: null as string | null,
  dateRange: null as [number, number] | null,
});

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  pageCount: 1,
  itemCount: 0,
});

// 分页配置
const paginationConfig = reactive({
  page: pagination.page,
  pageSize: pagination.pageSize,
  pageCount: pagination.pageCount,
  itemCount: pagination.itemCount,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  pageSlot: 5, // 显示5个页码按钮
  prefix: (info: any) => `共 ${info.itemCount} 条`,
  onChange: (page: number) => {
    handlePageChange(page);
  },
  onUpdatePageSize: (pageSize: number) => {
    handlePageSizeChange(pageSize);
  },
});

// 操作分类选项
const categoryOptions = [
  { label: "认证相关", value: "auth" },
  { label: "隧道相关", value: "proxy" },
  { label: "节点相关", value: "node" },
  { label: "用户相关", value: "user" },
  { label: "财务相关", value: "finance" },
];

// 操作状态选项
const statusOptions = [
  { label: "成功", value: "success" },
  { label: "失败", value: "failed" },
];

// 获取分类标签
const getCategoryLabel = (category: string): string => {
  const map: Record<string, string> = {
    auth: "认证相关",
    proxy: "隧道相关",
    node: "节点相关",
    user: "用户相关",
    finance: "财务相关",
  };
  return map[category] || category;
};

// 获取分类标签类型
const getCategoryType = (
  category: string,
): "info" | "success" | "warning" | "error" | "default" => {
  const map: Record<
    string,
    "info" | "success" | "warning" | "error" | "default"
  > = {
    auth: "info",
    proxy: "success",
    node: "warning",
    user: "default",
    finance: "error",
  };
  return map[category] || "default";
};

// 表格列定义
const columns: DataTableColumns<OperationLog> = [
  {
    title: "日志ID",
    key: "logId",
    width: 100,
    align: "center",
  },
  {
    title: "操作分类",
    key: "category",
    width: 120,
    align: "center",
    render: (row) => {
      return h(
        NTag,
        {
          type: getCategoryType(row.category),
          bordered: false,
          size: "small",
        },
        { default: () => getCategoryLabel(row.category) },
      );
    },
  },
  {
    title: "操作详情",
    key: "details",
    // 移除 ellipsis，让内容自动换行
  },
  {
    title: "请求 IP",
    key: "ipAddress",
    width: 180,
    // 移除 ellipsis，让内容自动换行
  },
  {
    title: "操作状态",
    key: "status",
    width: 100,
    align: "center",
    render: (row) => {
      return h(
        NTag,
        {
          type: row.status === "success" ? "success" : "error",
          bordered: false,
          size: "small",
        },
        { default: () => (row.status === "success" ? "成功" : "失败") },
      );
    },
  },
  {
    title: "操作时间",
    key: "createdAt",
    width: 180,
    render: (row) => {
      return formatDateTime(row.createdAt);
    },
  },
];

// 格式化日期时间
const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// 格式化日期为 API 需要的格式
const formatDateForApi = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 加载日志
const loadLogs = async () => {
  loading.value = true;
  try {
    // 构建查询参数
    const params: {
      page: number;
      pageSize: number;
      category?: string;
      status?: string;
      startTime?: string;
      endTime?: string;
    } = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    };

    // 添加分类筛选
    if (filters.category) {
      params.category = filters.category;
    }

    // 添加状态筛选
    if (filters.status) {
      params.status = filters.status;
    }

    // 添加时间范围筛选
    if (filters.dateRange && filters.dateRange.length === 2) {
      params.startTime = formatDateForApi(filters.dateRange[0]);
      params.endTime = formatDateForApi(filters.dateRange[1]);
    }

    const result = await getOperationLogs(authStore.userToken, params);

    if (result.code === 200) {
      logs.value = result.data.data;
      pagination.itemCount = result.data.total;

      // 设置一个足够大的页数，确保可以一直翻页
      // 如果当前页有数据，设置页数为当前页+10，否则使用计算的页数
      const calculatedPageCount = Math.ceil(
        result.data.total / pagination.pageSize,
      );
      if (result.data.data.length > 0) {
        // 如果当前页有数据，允许继续翻页，设置页数为当前页+10
        pagination.pageCount = Math.max(
          calculatedPageCount,
          pagination.page + 10,
        );
      } else {
        // 如果当前页没有数据，使用计算的页数
        pagination.pageCount = calculatedPageCount;
      }

      // 同步到 paginationConfig
      paginationConfig.page = pagination.page;
      paginationConfig.pageSize = pagination.pageSize;
      paginationConfig.pageCount = pagination.pageCount;
      paginationConfig.itemCount = pagination.itemCount;

      message.success(`成功加载 ${result.data.data.length} 条日志`);
    } else {
      throw new Error(result.message || "获取操作日志失败");
    }
  } catch (err) {
    console.error("加载操作日志失败:", err);
    message.error(extractErrorMessage(err, "加载操作日志失败"));
  } finally {
    loading.value = false;
  }
};

// 刷新日志
const refreshLogs = () => {
  loadLogs();
};

// 下拉选择框变化时自动触发请求
const onFilterChange = () => {
  pagination.page = 1;
  loadLogs();
};

// 应用筛选
const applyFilters = () => {
  pagination.page = 1;
  loadLogs();
};

// 重置筛选
const resetFilters = () => {
  filters.category = null;
  filters.status = null;
  filters.dateRange = null;
  pagination.page = 1;
  loadLogs();
};

// 处理页码变化
const handlePageChange = (page: number) => {
  pagination.page = page;
  loadLogs();
};

// 处理每页条数变化
const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.page = 1;
  loadLogs();
};

// 组件挂载时加载日志
onMounted(() => {
  // 设置默认时间范围为最近7天
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  filters.dateRange = [sevenDaysAgo, now];

  loadLogs();
});
</script>

<style scoped>
.operation-log {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--app-text-color);
}

.filter-card {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
  border-radius: 0px;
}

.table-card {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
  border-radius: 0px;
}

/* 确保表格内容自动换行 */
.table-card :deep(.n-data-table-td) {
  word-wrap: break-word;
  word-break: break-all;
  white-space: normal;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
}
</style>
