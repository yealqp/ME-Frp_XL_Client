/**
 * Theme Window Utils — 窗口主题设置与主题切换动画
 *
 * 将主题相关的窗口操作和全屏切换动画从 theme store 中提取，
 * 保持 store 聚焦于状态与动作编排。
 */

import { getCurrentWindow } from "@tauri-apps/api/window";
import type { Theme } from "@/types/theme";

/** 设置 Tauri 窗口主题（跟随应用主题） */
export async function setWindowTheme(theme: Theme): Promise<void> {
  try {
    const appWindow = getCurrentWindow();
    await appWindow.setTheme(theme);
  } catch (error) {
    console.error("设置窗口主题失败:", error);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 创建主题切换蒙层元素 */
function createThemeOverlay(currentTheme: Theme, targetTheme: Theme): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.className = "theme-overlay";

  const content = document.createElement("div");
  content.className = "theme-overlay-content";

  const gearContainer = document.createElement("div");
  gearContainer.className = "theme-overlay-gear";

  const gear = document.createElement("div");
  gear.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  `;

  const text = document.createElement("div");
  text.className = "theme-overlay-text";
  text.textContent = `正在切换到${targetTheme === "light" ? "浅色" : "深色"}模式`;

  gearContainer.appendChild(gear);
  content.appendChild(gearContainer);
  content.appendChild(text);
  overlay.appendChild(content);
  overlay.classList.add(currentTheme);

  return overlay;
}

/**
 * 播放主题切换动画
 *
 * 前 0.5s 显示当前色调，后 0.5s 显示目标色调，动画结束自动移除蒙层。
 * 蒙层切换为目标色调时调用 `onTargetReached`，调用方应在此刻实际应用主题，
 * 以保证背景与蒙层色调同步切换。
 * 仅在浏览器环境（document 可用）时执行。
 */
export async function playThemeSwitchAnimation(
  currentTheme: Theme,
  targetTheme: Theme,
  onTargetReached?: () => void,
): Promise<void> {
  if (typeof document === "undefined") {
    onTargetReached?.();
    return;
  }

  const overlay = createThemeOverlay(currentTheme, targetTheme);
  document.body.appendChild(overlay);

  try {
    requestAnimationFrame(() => {
      overlay.classList.add("active");
    });

    await wait(500);

    overlay.classList.remove(currentTheme);
    overlay.classList.add(targetTheme);

    onTargetReached?.();

    await wait(500);

    overlay.classList.remove("active");
    await wait(150);
  } finally {
    // 无论动画是否异常中断，都确保蒙层从 DOM 中移除，避免残留遮罩
    if (overlay.parentNode === document.body) {
      document.body.removeChild(overlay);
    }
  }
}
