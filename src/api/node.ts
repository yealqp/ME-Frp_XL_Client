/**
 * Node API
 *
 * Node-related API calls to api.mefrp.com.
 */

import { apiGet, apiPost } from "./client";
import type { ApiResponse } from "@/types/api";
import type { Node, NodeStatusData } from "@/types/node";

export interface FreePortRequest {
  nodeId: number;
  protocol: string;
}

// API actually returns the port number directly, not an object
export type FreePortResponse = number;

export interface CreateProxyDataResponse {
  nodes: Node[];
  userGroups: string[];
  currentGroup: string;
}

export async function getNodeList(
  token: string,
): Promise<ApiResponse<Node[]>> {
  return apiGet<Node[]>("/api/auth/node/list", token);
}

export async function getNodeStatus(
  token: string,
): Promise<ApiResponse<NodeStatusData[]>> {
  return apiGet<NodeStatusData[]>("/api/auth/node/status", token);
}

export async function getNodeNameList(
  token: string,
): Promise<ApiResponse<{ nodes: Array<{ nodeId: number; name: string; hostname: string }> }>> {
  return apiGet<{ nodes: Array<{ nodeId: number; name: string; hostname: string }> }>(
    "/api/auth/node/nameList",
    token,
  );
}

export async function getFreePort(
  token: string,
  request: FreePortRequest,
): Promise<ApiResponse<FreePortResponse>> {
  return apiPost<FreePortResponse>("/api/auth/node/freePort", request, token);
}

export async function getCreateProxyData(
  token: string,
): Promise<ApiResponse<CreateProxyDataResponse>> {
  return apiGet<CreateProxyDataResponse>("/api/auth/createProxyData", token);
}
