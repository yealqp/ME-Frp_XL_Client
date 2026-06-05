/**
 * Lottery API
 *
 * Daily draw API calls to api.mefrp.com.
 * - GET  /api/auth/user/luckydraw → 剩余抽奖次数
 * - POST /api/auth/user/luckydraw → 执行一次抽奖
 */

import { apiGet, apiPost } from "./client";
import type { ApiResponse } from "@/types/api";
import type { LuckydrawResult, LuckydrawInfo } from "@/types/lottery";

/** 执行一次抽奖 */
export async function doLuckydraw(
  token: string,
): Promise<ApiResponse<LuckydrawResult>> {
  return apiPost<LuckydrawResult>("/api/auth/user/luckydraw", undefined, token);
}

/** 获取今日抽奖次数信息 */
export async function getLuckydrawInfo(
  token: string,
): Promise<ApiResponse<LuckydrawInfo>> {
  return apiGet<LuckydrawInfo>("/api/auth/user/luckydraw", token);
}
