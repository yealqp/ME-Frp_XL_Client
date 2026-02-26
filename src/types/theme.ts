/**
 * Theme Type Definitions
 * 
 * 定义主题系统的 TypeScript 类型
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

/**
 * 主题模式类型
 * - 'light': 浅色模式
 * - 'dark': 深色模式
 * - 'system': 跟随系统主题
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * 主题类型（实际应用的主题）
 * - 'light': 浅色主题
 * - 'dark': 深色主题
 */
export type Theme = 'light' | 'dark';

/**
 * 主题配置接口
 * 定义完整的颜色配置方案
 */
export interface ThemeConfig {
  common: {
    // 背景颜色
    bodyColor: string;
    cardColor: string;
    modalColor: string;
    popoverColor: string;
    tableHeaderColor: string;
    
    // 文本颜色
    textColorBase: string;
    textColor1: string;
    textColor2: string;
    textColor3: string;
    
    // 主要强调色
    primaryColor: string;
    primaryColorHover: string;
    primaryColorPressed: string;
    primaryColorSuppl: string;
    
    // 状态颜色
    infoColor: string;
    successColor: string;
    warningColor: string;
    errorColor: string;
    
    // 边框和分隔线
    borderColor: string;
    dividerColor: string;
    
    // 输入框
    inputColor: string;
    inputColorDisabled: string;
    
    // 阴影
    boxShadow1: string;
    boxShadow2: string;
    boxShadow3: string;
  };
}

/**
 * 主题偏好接口
 * 用于持久化用户的主题选择
 */
export interface ThemePreference {
  mode: ThemeMode;
  enableTransitions: boolean;
}

/**
 * 颜色对比度验证结果
 */
export interface ContrastValidationResult {
  ratio: number;
  passes: boolean;
}
