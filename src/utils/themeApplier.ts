/**
 * Theme Applier — Naive UI 原生主题系统
 *
 * 通过 NConfigProvider theme + themeOverrides 实现主题，CSS 变量仅保留
 * 非 Naive UI 组件所需的颜色（lucide 图标、自定义元素、日志渲染等）。
 */

import { darkTheme, type GlobalTheme, type GlobalThemeOverrides } from "naive-ui";
import type { Theme, ThemeConfig } from "@/types/theme";

/** Naive UI 亮色 = null（默认），暗色 = darkTheme */
export function getNaiveTheme(theme: Theme): GlobalTheme | null {
  return theme === "dark" ? darkTheme : null;
}

/** 构建 Naive UI themeOverrides，覆盖 common + 组件级变量 */
export function buildNaiveThemeOverrides(config: ThemeConfig): GlobalThemeOverrides {
  const c = config.common;
  return {
    common: {
      primaryColor: c.primaryColor,
      primaryColorHover: c.primaryColorHover,
      primaryColorPressed: c.primaryColorPressed,
      primaryColorSuppl: c.primaryColorSuppl,
      infoColor: c.infoColor,
      successColor: c.successColor,
      warningColor: c.warningColor,
      errorColor: c.errorColor,
      bodyColor: c.bodyColor,
      cardColor: c.cardColor,
      modalColor: c.modalColor,
      popoverColor: c.popoverColor,
      tableHeaderColor: c.tableHeaderColor,
      textColorBase: c.textColorBase,
      textColor1: c.textColor1,
      textColor2: c.textColor2,
      textColor3: c.textColor3,
      borderColor: c.borderColor,
      dividerColor: c.dividerColor,
      inputColor: c.inputColor,
      inputColorDisabled: c.inputColorDisabled,
      boxShadow1: c.boxShadow1,
      boxShadow2: c.boxShadow2,
      boxShadow3: c.boxShadow3,
    },
    Button: {
      textColorPrimary: "#ffffff",
      colorPrimary: c.primaryColor,
      colorHoverPrimary: c.primaryColorHover,
      colorPressedPrimary: c.primaryColorPressed,
    },
    Input: {
      color: c.inputColor,
      colorFocus: c.inputColor,
      border: `1px solid ${c.borderColor}`,
      borderHover: `1px solid ${c.primaryColorHover}`,
      borderFocus: `1px solid ${c.primaryColor}`,
      boxShadowFocus: `0 0 0 2px ${c.primaryColor}1a`,
    },
    Card: {
      color: c.cardColor,
      borderColor: c.borderColor,
    },
    Menu: {
      itemTextColorActive: c.primaryColor,
      itemColorActive: "transparent",
      itemColorActiveHover: c.primaryColorHover,
      itemIconColorActive: c.primaryColor,
      itemTextColorActiveInverted: c.primaryColor,
      itemColorActiveInverted: "transparent",
      itemColorActiveHoverInverted: c.primaryColorHover,
      itemIconColorActiveInverted: c.primaryColor,
    },
    DataTable: {
      tdColor: c.cardColor,
      thColor: c.tableHeaderColor,
      tdColorStriped: c.tableHeaderColor,
    },
    Layout: {
      color: c.bodyColor,
      siderColor: c.cardColor,
      siderBorderColor: c.borderColor,
    },
    Alert: {
      color: c.cardColor,
    },
    Drawer: {
      color: c.modalColor,
    },
    Modal: {
      color: c.modalColor,
    },
    Popover: {
      color: c.popoverColor,
    },
    Dropdown: {
      color: c.popoverColor,
      optionColorActive: c.primaryColor,
    },
  };
}

/**
 * 设置 CSS 变量 — 仅用于非 Naive UI 元素
 * 保留：primary/success/warning/error/info/log/login/ad 相关变量
 * 删除：body/card/text/border/divider/boxShadow（由 Naive UI 接管）
 */
export function applyCSSVariables(config: ThemeConfig, theme: Theme = "light"): void {
  try {
    const root = document.documentElement;
    const c = config.common;

    root.setAttribute("data-theme", theme);

    // 基础表面色（非 Naive UI 自定义元素使用：背景层、侧栏切换按钮、滚动条等）
    root.style.setProperty("--app-bg-color", c.bodyColor);
    root.style.setProperty("--app-card-color", c.cardColor);
    root.style.setProperty("--app-border-color", c.borderColor);
    root.style.setProperty("--app-divider-color", c.dividerColor);

    // 文本色（自定义非 Naive 元素使用）
    root.style.setProperty("--app-text-color", c.textColorBase);
    root.style.setProperty("--app-text-color-1", c.textColor1);
    root.style.setProperty("--app-text-color-2", c.textColor2);
    root.style.setProperty("--app-text-color-3", c.textColor3);

    // 阴影（自定义元素使用）
    root.style.setProperty("--app-box-shadow-1", c.boxShadow1);
    root.style.setProperty("--app-box-shadow-2", c.boxShadow2);

    // 主题色系（lucide 图标、自定义元素使用）
    root.style.setProperty("--app-primary-color", c.primaryColor);
    root.style.setProperty("--app-primary-color-hover", c.primaryColorHover);
    root.style.setProperty("--app-primary-color-pressed", c.primaryColorPressed);

    // 状态色系
    root.style.setProperty("--app-info-color", c.infoColor);
    root.style.setProperty("--app-success-color", c.successColor);
    root.style.setProperty("--app-warning-color", c.warningColor);
    root.style.setProperty("--app-error-color", c.errorColor);

    // 日志颜色
    root.style.setProperty("--app-log-timestamp-color", c.textColor3);
    root.style.setProperty("--app-log-info-color", c.infoColor);
    root.style.setProperty("--app-log-warning-color", c.warningColor);
    root.style.setProperty("--app-log-error-color", c.errorColor);
    root.style.setProperty("--app-log-path-color", c.successColor);
    root.style.setProperty("--app-log-highlight-color", c.errorColor);

  } catch (error) {
    console.error("应用 CSS 变量失败:", error);
  }
}

export function applyTheme(config: ThemeConfig, theme: Theme = "light"): void {
  applyCSSVariables(config, theme);
}
