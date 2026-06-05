/**
 * Lottery Types
 *
 * Types for the daily lottery/draw system (api.mefrp.com /auth/user/luckydraw).
 */

/** 单次抽奖结果（POST /auth/user/luckydraw） */
export interface LuckydrawResult {
  prize: string;   // 奖励描述，如 "55 GB 流量" / "专属优惠码: LUCKY98GLXSV9RPDA00"
  type: string;    // "traffic" | "coupon" | "vip"
  value: number;   // 奖励数值（流量GB数 / 会员天数）
}

/** 抽奖次数信息（GET /auth/user/luckydraw） */
export interface LuckydrawInfo {
  count: number;   // 今日已抽次数，剩余 = 10 - count
}

/** 前端抽奖记录 */
export interface DrawRecord {
  prize: string;
  type: string;
  value: number;
  time: number; // timestamp
}
