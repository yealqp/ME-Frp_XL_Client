import { invoke } from "@tauri-apps/api/core";

export const TUNNEL_CONFIG_FORMATS = ["toml", "json", "yml", "ini"] as const;

export type TunnelConfigFormat = (typeof TUNNEL_CONFIG_FORMATS)[number];

const CONFIG_LANGUAGE_MAP: Record<TunnelConfigFormat, string> = {
  toml: "toml",
  json: "json",
  yml: "yaml",
  ini: "ini",
};

export function getTunnelConfigFileName(tunnelId: number, format: TunnelConfigFormat): string {
  return `${tunnelId}.${format}`;
}

export function getTunnelConfigLanguage(format: TunnelConfigFormat): string {
  return CONFIG_LANGUAGE_MAP[format] || "text";
}

export function validateTunnelConfigContent(content: string, format: TunnelConfigFormat): boolean {
  if (!content || content.trim() === "") {
    return false;
  }

  try {
    switch (format) {
      case "json":
        JSON.parse(content);
        break;
      case "toml":
      case "ini":
        if (!content.includes("=") && !content.includes("[")) {
          return false;
        }
        break;
      case "yml":
        if (!content.includes(":") && !content.includes("-")) {
          return false;
        }
        break;
    }

    return true;
  } catch {
    return false;
  }
}

export async function checkTunnelConfigFiles(): Promise<number[]> {
  return invoke<number[]>("check_tunnel_config_files");
}

export async function saveTunnelConfigFile(fileName: string, content: string): Promise<void> {
  await invoke("save_config_file", {
    fileName,
    content,
  });
}

export async function deleteTunnelConfigFile(fileName: string): Promise<void> {
  await invoke("delete_config_file", { fileName });
}
