/**
 * System API
 *
 * System-related API calls to api.mefrp.com (NOT xlc.mefrp.yealqp.cn or other external APIs).
 */

import { apiGet, apiPost } from "./client";
import type { ApiResponse } from "@/types/api";

export interface TrafficStatsResponse {
  date: string;
  inTraffic: number;
  outTraffic: number;
}

export interface OperationLogResponse {
  data: Array<{
    logId: number;
    category: string;
    details: string;
    ipAddress: string;
    status: string;
    createdAt: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
}

export interface StatisticsResponse {
  users: number;
  nodes: number;
  proxies: number;
  traffic: number;
}

export async function getAnnouncements(
  token: string,
): Promise<ApiResponse<string>> {
  return apiGet<string>("/api/auth/notice", token);
}

export async function getSystemStatus(
  token: string,
): Promise<ApiResponse<string>> {
  return apiGet<string>("/api/auth/system/status", token);
}

export async function getPopupNotice(
  token: string,
): Promise<ApiResponse<string>> {
  return apiGet<string>("/api/auth/popupNotice", token);
}

export async function getTrafficStats(
  token: string,
  datePeriod: number,
): Promise<ApiResponse<TrafficStatsResponse[]>> {
  return apiPost<TrafficStatsResponse[]>(
    "/api/auth/user/trafficStats",
    { datePeriod },
    token,
  );
}

export async function getOperationLogs(
  token: string,
  params: {
    page: number;
    pageSize: number;
    category?: string;
    status?: string;
    startTime?: string;
    endTime?: string;
  },
): Promise<ApiResponse<OperationLogResponse>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("pageSize", String(params.pageSize));
  if (params.category) query.set("category", params.category);
  if (params.status) query.set("status", params.status);
  if (params.startTime) query.set("startTime", params.startTime);
  if (params.endTime) query.set("endTime", params.endTime);

  return apiGet<OperationLogResponse>(
    `/api/auth/operationLog/list?${query.toString()}`,
    token,
  );
}

export async function getStatistics(
  token?: string,
): Promise<ApiResponse<StatisticsResponse>> {
  return apiGet<StatisticsResponse>("/api/public/statistics", token);
}
