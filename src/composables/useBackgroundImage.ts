import { ref, onUnmounted } from "vue";
import { readFile, BaseDirectory } from "@tauri-apps/plugin-fs";

export function useBackgroundImage() {
  const backgroundImageUrl = ref<string | null>(null);
  const backgroundImageLoadToken = ref(0);

  function clampOpacity(value: number | undefined): number {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return 1;
    }

    return Math.min(1, Math.max(0, value / 100));
  }

  function withOpacity(color: string, opacity: number): string {
    const normalized = color.trim().replace("#", "");

    if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
      const r = parseInt(normalized.slice(0, 2), 16);
      const g = parseInt(normalized.slice(2, 4), 16);
      const b = parseInt(normalized.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    if (/^[0-9a-fA-F]{8}$/.test(normalized)) {
      const r = parseInt(normalized.slice(0, 2), 16);
      const g = parseInt(normalized.slice(2, 4), 16);
      const b = parseInt(normalized.slice(4, 6), 16);
      const a = parseInt(normalized.slice(6, 8), 16) / 255;
      return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, opacity * a))})`;
    }

    return color;
  }

  function backgroundImageMime(filePath: string): string {
    const extension = filePath.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "jpg":
      case "jpeg":
      case "jfif":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "webp":
        return "image/webp";
      case "avif":
        return "image/avif";
      case "gif":
        return "image/gif";
      case "bmp":
        return "image/bmp";
      case "svg":
        return "image/svg+xml";
      case "ico":
        return "image/x-icon";
      default:
        return "application/octet-stream";
    }
  }

  function revokeBackgroundImageUrl(): void {
    if (backgroundImageUrl.value?.startsWith("blob:")) {
      URL.revokeObjectURL(backgroundImageUrl.value);
    }

    backgroundImageUrl.value = null;
  }

  async function syncBackgroundImage(path?: string): Promise<void> {
    const loadToken = ++backgroundImageLoadToken.value;
    revokeBackgroundImageUrl();

    if (!path) {
      return;
    }

    const isManagedPath = !/^[a-zA-Z]:[\\/]/.test(path) && !path.startsWith("/") && !path.startsWith("\\");
    if (!isManagedPath) {
      return;
    }

    try {
      const bytes = await readFile(path, {
        baseDir: BaseDirectory.Resource,
      });
      const blob = new Blob([bytes], {
        type: backgroundImageMime(path),
      });

      const objectUrl = URL.createObjectURL(blob);
      if (loadToken !== backgroundImageLoadToken.value) {
        URL.revokeObjectURL(objectUrl);
        return;
      }

      backgroundImageUrl.value = objectUrl;
    } catch (error) {
      console.error("加载背景图片失败:", error);
    }
  }

  onUnmounted(() => {
    backgroundImageLoadToken.value += 1;
    revokeBackgroundImageUrl();
  });

  return {
    backgroundImageUrl,
    syncBackgroundImage,
    revokeBackgroundImageUrl,
    withOpacity,
    clampOpacity,
  };
}
