import type { TagProps } from "naive-ui";

export type TunnelProtocolTagType = NonNullable<TagProps["type"]>;

const protocolTagTypes: Record<string, TunnelProtocolTagType> = {
  tcp: "info",
  udp: "warning",
  http: "success",
  https: "success",
};

export function getTunnelProtocolTagType(proxyType: string): TunnelProtocolTagType {
  return protocolTagTypes[proxyType] ?? "default";
}
