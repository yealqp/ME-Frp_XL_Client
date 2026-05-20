/**
 * System API
 *
 * System-related API calls to api.mefrp.com (NOT xlc.mefrp.yealqp.cn or other external APIs).
 */

import { apiGet, apiPost, API_BASE_URL } from "./client";
import type { ApiResponse } from "@/types/api";

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

/** GeoIP 响应（经纬度） */
export interface GeoIpData {
  latitude: number;
  longitude: number;
}

/** 获取 IP 地理位置（免费 GeoIP 兜底方案） */
export async function getGeoIp(): Promise<GeoIpData> {
  const res = await fetch(`${API_BASE_URL}/geoip`);
  if (!res.ok) throw new Error(`GeoIP 请求失败: ${res.status}`);
  return res.json();
}
