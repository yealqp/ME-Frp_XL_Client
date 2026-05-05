/**
 * Tunnel API
 *
 * Tunnel CRUD and management API calls to api.mefrp.com.
 */

import { apiGet, apiPost } from "./client";
import type { ApiResponse } from "@/types/api";
import type { Tunnel } from "@/types/tunnel";

export interface CreateTunnelRequest {
  nodeId: number;
  proxyName: string;
  proxyType: string;
  localIp: string;
  localPort: number;
  remotePort: number;
  domain: string;
  locations: string;
  accessKey: string;
  hostHeaderRewrite: string;
  useEncryption: boolean;
  useCompression: boolean;
  proxyProtocolVersion: string;
  httpPlugin: string;
  crtPath: string;
  keyPath: string;
  requestHeaders: Record<string, unknown>;
  responseHeaders: Record<string, unknown>;
  httpUser: string;
  httpPassword: string;
  transportProtocol: string;
}

export interface UpdateTunnelRequest {
  proxyId: number;
  proxyName: string;
  localIp: string;
  localPort: number;
  remotePort?: number | null;
  domain: string;
  location: string;
  accessKey: string;
  hostHeaderRewrite: string;
  headerXFromWhere: string;
  useEncryption: boolean;
  useCompression: boolean;
  proxyProtocolVersion: string;
  proxyType: string;
  nodeId: number;
}

export interface TunnelListResponse {
  proxies?: Tunnel[];
}

export async function getTunnelList(
  token: string,
): Promise<ApiResponse<TunnelListResponse | Tunnel[]>> {
  return apiGet<TunnelListResponse | Tunnel[]>("/api/auth/proxy/list", token);
}

export async function createTunnel(
  token: string,
  data: CreateTunnelRequest,
): Promise<ApiResponse<unknown>> {
  return apiPost<unknown>("/api/auth/proxy/create", data, token);
}

export async function updateTunnel(
  token: string,
  data: UpdateTunnelRequest,
): Promise<ApiResponse<unknown>> {
  return apiPost<unknown>("/api/auth/proxy/update", data, token);
}

export async function deleteTunnel(
  token: string,
  proxyId: number,
): Promise<ApiResponse<unknown>> {
  return apiPost<unknown>("/api/auth/proxy/delete", { proxyId }, token);
}

export async function kickTunnel(
  token: string,
  proxyId: number,
): Promise<ApiResponse<unknown>> {
  return apiPost<unknown>("/api/auth/proxy/kick", { proxyId }, token);
}

export async function toggleTunnel(
  token: string,
  proxyId: number,
  isDisabled: boolean,
): Promise<ApiResponse<unknown>> {
  return apiPost<unknown>(
    "/api/auth/proxy/toggle",
    { proxyId, isDisabled },
    token,
  );
}

export async function getTunnelConfig(
  token: string,
  proxyId: number,
  format: string,
): Promise<ApiResponse<string>> {
  return apiPost<string>(
    "/api/auth/proxy/config",
    { proxyId, format },
    token,
  );
}
