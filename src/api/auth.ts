/**
 * Auth API
 *
 * Authentication and user-related API calls to api.mefrp.com.
 */

import { apiGet, apiPost } from "./client";
import type { ApiResponse } from "@/types/api";

export interface LoginResponse {
  token: string;
  username: string;
  group: string;
}

export interface FrpTokenData {
  token: string;
}

export interface UserDetailInfo {
  email: string;
  friendlyGroup: string;
  group: string;
  inBound: number;
  isRealname: boolean;
  maxProxies: number;
  outBound: number;
  regTime: number;
  status: number;
  todaySigned: boolean;
  traffic: number;
  usedProxies: number;
  userId: number;
  username: string;
}

// 实际 API 返回结构: { logs: [...] }
export interface CdkHistoryLogItem {
  logId: number;
  code: string;
  username: string;
  type: string;      // "traffic" | "proxy" | "vip"
  value: number;
  useTime: number;   // 秒级时间戳
  clientIp: string;
  userAgent: string;
}

export interface CdkHistoryResponse {
  logs: CdkHistoryLogItem[];
}

export async function login(
  username: string,
  password: string,
  captchaToken?: string,
): Promise<ApiResponse<LoginResponse>> {
  return apiPost<LoginResponse>("/api/public/login", {
    username,
    password,
    ...(captchaToken ? { captchaToken } : {}),
  });
}

export async function getUserInfo(
  token: string,
): Promise<ApiResponse<UserDetailInfo>> {
  return apiGet<UserDetailInfo>("/api/auth/user/info", token);
}

export async function userSign(
  token: string,
  captchaToken: string,
): Promise<ApiResponse<string>> {
  return apiPost<string>(
    "/api/auth/user/sign",
    { captchaToken },
    token,
  );
}

export async function redeemCdk(
  token: string,
  code: string,
  captchaToken: string,
): Promise<ApiResponse<string>> {
  return apiPost<string>(
    "/api/auth/cdk/redeem",
    { code, captchaToken },
    token,
  );
}

export async function getFrpToken(
  token: string,
): Promise<ApiResponse<FrpTokenData>> {
  return apiGet<FrpTokenData>("/api/auth/user/frpToken", token);
}

export async function getCdkHistory(
  token: string,
): Promise<ApiResponse<CdkHistoryResponse>> {
  return apiGet<CdkHistoryResponse>("/api/auth/cdk/usage", token);
}

export async function resetToken(
  token: string,
  captchaToken: string,
): Promise<ApiResponse<{ newToken: string }>> {
  return apiPost<{ newToken: string }>(
    "/api/auth/user/tokenReset",
    { captchaToken },
    token,
  );
}
