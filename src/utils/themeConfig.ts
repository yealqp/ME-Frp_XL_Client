import {
  darkThemeConfig,
  lightThemeConfig,
  validateContrast,
} from "@/config/theme";
import type {
  ThemeCommonConfig,
  ThemeConfig,
  ThemeCustomization,
  ThemeFieldGroup,
  ThemeFieldKey,
  ThemeValidationIssue,
  ThemeVariant,
} from "@/types/theme";

export const THEME_FIELD_GROUPS: ThemeFieldGroup[] = [
  {
    key: "background",
    label: "背景",
    description: "页面、卡片和浮层背景色。",
    fields: [
      { key: "bodyColor", label: "页面背景", description: "应用主背景色" },
      { key: "cardColor", label: "卡片背景", description: "卡片和面板背景色" },
      { key: "modalColor", label: "弹窗背景", description: "模态框背景色" },
      { key: "popoverColor", label: "浮层背景", description: "下拉和浮层背景色" },
      { key: "tableHeaderColor", label: "表头背景", description: "表格表头背景色" },
    ],
  },
  {
    key: "text",
    label: "文本",
    description: "不同层级的文本颜色。",
    fields: [
      { key: "textColorBase", label: "主文本", description: "默认正文颜色" },
      { key: "textColor1", label: "强调文本", description: "较高层级文本颜色" },
      { key: "textColor2", label: "次级文本", description: "辅助说明文本颜色" },
      { key: "textColor3", label: "弱化文本", description: "提示和弱化信息颜色" },
    ],
  },
  {
    key: "primary",
    label: "主色",
    description: "按钮、链接和高亮主色。",
    fields: [
      { key: "primaryColor", label: "主色", description: "默认主强调色" },
      { key: "primaryColorHover", label: "悬停主色", description: "悬停状态颜色" },
      { key: "primaryColorPressed", label: "按下主色", description: "按下状态颜色" },
      { key: "primaryColorSuppl", label: "补充主色", description: "补充使用的主色" },
    ],
  },
  {
    key: "status",
    label: "状态色",
    description: "信息、成功、警告和错误颜色。",
    fields: [
      { key: "infoColor", label: "信息色", description: "普通信息提示颜色" },
      { key: "successColor", label: "成功色", description: "成功状态颜色" },
      { key: "warningColor", label: "警告色", description: "警告状态颜色" },
      { key: "errorColor", label: "错误色", description: "错误状态颜色" },
    ],
  },
  {
    key: "surface",
    label: "边框与输入",
    description: "边框、分隔线和输入框表面。",
    fields: [
      { key: "borderColor", label: "边框", description: "普通边框颜色" },
      { key: "dividerColor", label: "分隔线", description: "列表和面板分隔线颜色" },
      { key: "inputColor", label: "输入框背景", description: "输入控件背景色" },
      { key: "inputColorDisabled", label: "禁用输入框", description: "禁用状态输入框背景色" },
    ],
  },
];

const DEFAULT_THEME_CONFIGS: Record<ThemeVariant, ThemeConfig> = {
  light: lightThemeConfig,
  dark: darkThemeConfig,
};

const THEME_FIELD_KEYS = THEME_FIELD_GROUPS.flatMap((group) =>
  group.fields.map((field) => field.key),
) as ThemeFieldKey[];

const CONTRAST_RULES: Array<{
  id: string;
  severity: "error" | "warning";
  foreground: ThemeFieldKey;
  background: ThemeFieldKey;
  minRatio: number;
  message: string;
}> = [
  {
    id: "body-text",
    severity: "error",
    foreground: "textColorBase",
    background: "bodyColor",
    minRatio: 4.5,
    message: "页面主文本与背景对比度不足。",
  },
  {
    id: "card-text",
    severity: "error",
    foreground: "textColor1",
    background: "cardColor",
    minRatio: 4.5,
    message: "卡片主要文本与背景对比度不足。",
  },
  {
    id: "secondary-card-text",
    severity: "warning",
    foreground: "textColor2",
    background: "cardColor",
    minRatio: 3.5,
    message: "卡片次级文本可读性偏低。",
  },
  {
    id: "modal-text",
    severity: "error",
    foreground: "textColorBase",
    background: "modalColor",
    minRatio: 4.5,
    message: "弹窗主文本与背景对比度不足。",
  },
  {
    id: "input-text",
    severity: "warning",
    foreground: "textColorBase",
    background: "inputColor",
    minRatio: 4.5,
    message: "输入框文字与背景对比度不足。",
  },
];

export function getDefaultThemeConfig(theme: ThemeVariant): ThemeConfig {
  return {
    common: {
      ...DEFAULT_THEME_CONFIGS[theme].common,
    },
  };
}

export function isHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value);
}

export function cloneThemeCustomization(customization: ThemeCustomization): ThemeCustomization {
  return {
    light: customization.light ? { ...customization.light } : undefined,
    dark: customization.dark ? { ...customization.dark } : undefined,
  };
}

export function sanitizeThemeCustomization(customization: unknown): ThemeCustomization {
  const normalized: ThemeCustomization = {};

  if (!customization || typeof customization !== "object") {
    return normalized;
  }

  for (const theme of ["light", "dark"] as const) {
    const themeValues = (customization as Record<string, unknown>)[theme];
    if (!themeValues || typeof themeValues !== "object") {
      continue;
    }

    const partial: Partial<ThemeCommonConfig> = {};
    for (const key of THEME_FIELD_KEYS) {
      const value = (themeValues as Record<string, unknown>)[key];
      if (typeof value === "string" && isHexColor(value)) {
        partial[key] = value;
      }
    }

    if (Object.keys(partial).length > 0) {
      normalized[theme] = partial;
    }
  }

  return normalized;
}

export function resolveThemeConfig(
  theme: ThemeVariant,
  customization: ThemeCustomization = {},
): ThemeConfig {
  const baseConfig = getDefaultThemeConfig(theme);

  return {
    common: {
      ...baseConfig.common,
      ...sanitizeThemeCustomization(customization)[theme],
    },
  };
}

export function buildThemeCustomizationDiff(
  customization: ThemeCustomization = {},
): ThemeCustomization {
  const normalized = sanitizeThemeCustomization(customization);
  const diff: ThemeCustomization = {};

  for (const theme of ["light", "dark"] as const) {
    const defaults = DEFAULT_THEME_CONFIGS[theme].common;
    const current = normalized[theme];
    if (!current) {
      continue;
    }

    const partial: Partial<ThemeCommonConfig> = {};
    for (const key of THEME_FIELD_KEYS) {
      const value = current[key];
      if (value && value !== defaults[key]) {
        partial[key] = value;
      }
    }

    if (Object.keys(partial).length > 0) {
      diff[theme] = partial;
    }
  }

  return diff;
}

export function validateThemeCustomization(
  customization: ThemeCustomization = {},
): ThemeValidationIssue[] {
  const issues: ThemeValidationIssue[] = [];
  const normalized = sanitizeThemeCustomization(customization);

  for (const theme of ["light", "dark"] as const) {
    const themeValues = normalized[theme] ?? {};

    for (const key of Object.keys(themeValues) as ThemeFieldKey[]) {
      const value = themeValues[key];
      if (value && !isHexColor(value)) {
        issues.push({
          id: `${theme}-${key}-format`,
          severity: "error",
          message: `${theme === "light" ? "浅色" : "深色"}主题的${key}颜色格式无效。`,
        });
      }
    }

    const resolved = resolveThemeConfig(theme, normalized).common;
    for (const rule of CONTRAST_RULES) {
      const result = validateContrast(resolved[rule.foreground], resolved[rule.background]);
      if (result.ratio < rule.minRatio) {
        issues.push({
          id: `${theme}-${rule.id}`,
          severity: rule.severity,
          message: `${theme === "light" ? "浅色" : "深色"}主题：${rule.message}`,
          ratio: result.ratio,
        });
      }
    }
  }

  return issues;
}

export function serializeThemeCustomization(customization: ThemeCustomization = {}): string {
  return JSON.stringify(buildThemeCustomizationDiff(customization), null, 2);
}

export function parseThemeCustomization(json: string): ThemeCustomization {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new Error("JSON 格式无效，请检查逗号、引号和括号是否完整。");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("导入内容必须是对象，格式示例见下方模板。");
  }

  const sanitized = sanitizeThemeCustomization(parsed);
  if (Object.keys(sanitized).length === 0) {
    throw new Error("未识别到有效主题字段，请确认使用的是 light/dark + 十六进制颜色格式。");
  }

  return sanitized;
}

export function getThemeFieldValue(
  theme: ThemeVariant,
  key: ThemeFieldKey,
  customization: ThemeCustomization = {},
): string {
  return resolveThemeConfig(theme, customization).common[key];
}

export function getThemeCustomizationTemplate(): string {
  return JSON.stringify(
    {
      light: {
        bodyColor: "#FFFFFF",
        cardColor: "#F8F9FA",
        textColorBase: "#1A1A1A",
        primaryColor: "#2080F0",
      },
      dark: {
        bodyColor: "#101014",
        cardColor: "#18181C",
        textColorBase: "#E0E0E6",
        primaryColor: "#349FF4",
      },
    },
    null,
    2,
  );
}
