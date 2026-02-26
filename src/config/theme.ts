/**
 * Theme Configuration
 * 
 * 定义浅色和深色模式的完整配色方案
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */

import type { ThemeConfig, ContrastValidationResult } from '@/types/theme';

/**
 * 浅色模式主题配置
 * 
 * 使用浅色背景和深色文本，确保所有颜色组合符合 WCAG AA 标准
 */
export const lightThemeConfig: ThemeConfig = {
  common: {
    // 背景颜色
    bodyColor: '#ffffff',
    cardColor: '#f8f9fa',
    modalColor: '#ffffff',
    popoverColor: '#ffffff',
    tableHeaderColor: '#f8f9fa',
    
    // 文本颜色
    textColorBase: '#1a1a1a',
    textColor1: '#2c2c2c',
    textColor2: '#4a4a4a',
    textColor3: '#6a6a6a',
    
    // 主要强调色
    primaryColor: '#2080f0',
    primaryColorHover: '#4098fc',
    primaryColorPressed: '#1060c9',
    primaryColorSuppl: '#4098fc',
    
    // 状态颜色
    infoColor: '#2080f0',
    successColor: '#18a058',
    warningColor: '#f0a020',
    errorColor: '#d03050',
    
    // 边框和分隔线
    borderColor: '#e0e0e6',
    dividerColor: '#e0e0e6',
    
    // 输入框
    inputColor: '#ffffff',
    inputColorDisabled: '#f5f5f5',
    
    // 阴影
    boxShadow1: '0 1px 2px -2px rgba(0, 0, 0, .08), 0 3px 6px 0 rgba(0, 0, 0, .06), 0 5px 12px 4px rgba(0, 0, 0, .04)',
    boxShadow2: '0 3px 6px -4px rgba(0, 0, 0, .12), 0 6px 16px 0 rgba(0, 0, 0, .08), 0 9px 28px 8px rgba(0, 0, 0, .05)',
    boxShadow3: '0 6px 16px -9px rgba(0, 0, 0, .08), 0 9px 28px 0 rgba(0, 0, 0, .05), 0 12px 48px 16px rgba(0, 0, 0, .03)',
  }
};

/**
 * 深色模式主题配置
 * 
 * 保持现有的深色模式配置
 */
export const darkThemeConfig: ThemeConfig = {
  common: {
    // 背景颜色
    bodyColor: '#101014',
    cardColor: '#18181c',
    modalColor: '#18181c',
    popoverColor: '#18181c',
    tableHeaderColor: '#18181c',
    
    // 文本颜色
    textColorBase: '#e0e0e6',
    textColor1: '#d0d0d6',
    textColor2: '#b0b0b6',
    textColor3: '#909096',
    
    // 主要强调色
    primaryColor: '#349ff4',
    primaryColorHover: '#4da8f5',
    primaryColorPressed: '#2891f3',
    primaryColorSuppl: '#4da8f5',
    
    // 状态颜色
    infoColor: '#349ff4',
    successColor: '#18a058',
    warningColor: '#f0a020',
    errorColor: '#d03050',
    
    // 边框和分隔线
    borderColor: '#29292c',
    dividerColor: '#29292c',
    
    // 输入框
    inputColor: '#303033',
    inputColorDisabled: '#303033',
    
    // 阴影
    boxShadow1: '0 1px 2px -2px rgba(0, 0, 0, .24), 0 3px 6px 0 rgba(0, 0, 0, .18), 0 5px 12px 4px rgba(0, 0, 0, .12)',
    boxShadow2: '0 3px 6px -4px rgba(0, 0, 0, .32), 0 6px 16px 0 rgba(0, 0, 0, .24), 0 9px 28px 8px rgba(0, 0, 0, .20)',
    boxShadow3: '0 6px 16px -9px rgba(0, 0, 0, .24), 0 9px 28px 0 rgba(0, 0, 0, .20), 0 12px 48px 16px rgba(0, 0, 0, .12)',
  }
};

/**
 * 将十六进制颜色转换为 RGB 值
 * @param hex - 十六进制颜色值 (如 '#ffffff' 或 'ffffff')
 * @returns RGB 值数组 [r, g, b]
 */
function hexToRgb(hex: string): [number, number, number] | null {
  // 移除 # 符号
  const cleanHex = hex.replace('#', '');
  
  // 验证格式
  if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    return null;
  }
  
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  return [r, g, b];
}

/**
 * 计算相对亮度
 * 根据 WCAG 2.0 规范计算颜色的相对亮度
 * @param rgb - RGB 值数组 [r, g, b]
 * @returns 相对亮度值 (0-1)
 */
function getRelativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(val => {
    const normalized = val / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * 计算两个颜色之间的对比度
 * 根据 WCAG 2.0 规范计算对比度
 * @param color1 - 第一个颜色的 RGB 值
 * @param color2 - 第二个颜色的 RGB 值
 * @returns 对比度值 (1-21)
 */
function calculateContrastRatio(
  color1: [number, number, number],
  color2: [number, number, number]
): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 验证颜色对比度是否符合 WCAG AA 标准
 * 
 * WCAG AA 标准要求：
 * - 正常文本：对比度至少为 4.5:1
 * - 大文本（18pt 或 14pt 粗体）：对比度至少为 3:1
 * 
 * 本函数使用 4.5:1 作为标准
 * 
 * @param foreground - 前景色（文本颜色）的十六进制值
 * @param background - 背景色的十六进制值
 * @returns 验证结果，包含对比度值和是否通过
 * 
 * Requirements: 1.7
 */
export function validateContrast(
  foreground: string,
  background: string
): ContrastValidationResult {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  
  // 如果颜色格式无效，返回失败结果
  if (!fgRgb || !bgRgb) {
    return {
      ratio: 0,
      passes: false
    };
  }
  
  const ratio = calculateContrastRatio(fgRgb, bgRgb);
  const passes = ratio >= 4.5;
  
  return {
    ratio: Math.round(ratio * 100) / 100, // 保留两位小数
    passes
  };
}

/**
 * 验证主题配置中所有文本和背景颜色组合的对比度
 * @param config - 主题配置对象
 * @returns 验证结果数组
 */
export function validateThemeContrast(config: ThemeConfig): Array<{
  combination: string;
  result: ContrastValidationResult;
}> {
  const results: Array<{
    combination: string;
    result: ContrastValidationResult;
  }> = [];
  
  // 定义需要验证的文本和背景颜色组合
  const textColors = [
    { name: 'textColorBase', value: config.common.textColorBase },
    { name: 'textColor1', value: config.common.textColor1 },
    { name: 'textColor2', value: config.common.textColor2 },
    { name: 'textColor3', value: config.common.textColor3 },
  ];
  
  const backgroundColors = [
    { name: 'bodyColor', value: config.common.bodyColor },
    { name: 'cardColor', value: config.common.cardColor },
    { name: 'modalColor', value: config.common.modalColor },
  ];
  
  // 验证所有组合
  for (const text of textColors) {
    for (const bg of backgroundColors) {
      const result = validateContrast(text.value, bg.value);
      results.push({
        combination: `${text.name} on ${bg.name}`,
        result
      });
    }
  }
  
  return results;
}
