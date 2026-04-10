/**
 * Theme Configuration
 * 
 * 定义浅色和深色模式的完整配色方案
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */

import type { ThemeConfig, ContrastValidationResult, ThemePreset } from '@/types/theme';

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

export const themePresets: ThemePreset[] = [
  {
    id: 'default-blue',
    name: '默认蓝调',
    description: '沿用当前默认方案，适合大多数界面。',
    preview: ['#2080f0', '#18a058', '#f8f9fa'],
    customization: {},
  },
  {
    id: 'violet-lab',
    name: '紫雾实验室',
    description: '偏冷紫色调，适合偏科技感的界面风格。',
    preview: ['#7c5cff', '#2d2450', '#f4f1ff'],
    customization: {
      light: {
        bodyColor: '#f4f1ff',
        cardColor: '#ece7ff',
        modalColor: '#f4f1ff',
        popoverColor: '#f4f1ff',
        tableHeaderColor: '#e4ddff',
        primaryColor: '#7c5cff',
        primaryColorHover: '#9074ff',
        primaryColorPressed: '#6848df',
        primaryColorSuppl: '#a18cff',
        infoColor: '#7c5cff',
        successColor: '#2ca87f',
        warningColor: '#d9922e',
        errorColor: '#cf4f73',
        borderColor: '#d8cffd',
        dividerColor: '#d8cffd',
      },
      dark: {
        bodyColor: '#121022',
        cardColor: '#1a1630',
        modalColor: '#1a1630',
        popoverColor: '#1a1630',
        tableHeaderColor: '#211c3d',
        primaryColor: '#9a82ff',
        primaryColorHover: '#ab97ff',
        primaryColorPressed: '#7e63ea',
        primaryColorSuppl: '#c0b1ff',
        infoColor: '#9a82ff',
        successColor: '#4bc59b',
        warningColor: '#e0aa52',
        errorColor: '#d7718d',
        borderColor: '#2f2950',
        dividerColor: '#2f2950',
        inputColor: '#241f43',
        inputColorDisabled: '#211c3d',
      },
    },
  },
  {
    id: 'sunset-coral',
    name: '落日珊瑚',
    description: '暖调橙红配色，更偏品牌展示和强调感。',
    preview: ['#ea6b4a', '#4a2219', '#fff2ee'],
    customization: {
      light: {
        bodyColor: '#fff2ee',
        cardColor: '#ffe7df',
        modalColor: '#fff2ee',
        popoverColor: '#fff2ee',
        tableHeaderColor: '#ffddd0',
        primaryColor: '#ea6b4a',
        primaryColorHover: '#f18062',
        primaryColorPressed: '#cf5535',
        primaryColorSuppl: '#f49a81',
        infoColor: '#ea6b4a',
        successColor: '#2f9d72',
        warningColor: '#dd8d2b',
        errorColor: '#d44747',
        borderColor: '#f1cabb',
        dividerColor: '#f1cabb',
      },
      dark: {
        bodyColor: '#16100e',
        cardColor: '#211613',
        modalColor: '#211613',
        popoverColor: '#211613',
        tableHeaderColor: '#2a1c18',
        primaryColor: '#f28b6e',
        primaryColorHover: '#f59b82',
        primaryColorPressed: '#df7457',
        primaryColorSuppl: '#f8b39f',
        infoColor: '#f28b6e',
        successColor: '#4eb98f',
        warningColor: '#e6a34e',
        errorColor: '#de6a6a',
        borderColor: '#3b2723',
        dividerColor: '#3b2723',
        inputColor: '#2b1d1a',
        inputColorDisabled: '#271916',
      },
    },
  },
  {
    id: 'arctic-frost',
    name: '极地霜蓝',
    description: '清冷的冰蓝色调，适合强调简洁和秩序。',
    preview: ['#4f8cff', '#173055', '#eef5ff'],
    customization: {
      light: {
        bodyColor: '#eef5ff',
        cardColor: '#e6efff',
        modalColor: '#eef5ff',
        popoverColor: '#eef5ff',
        tableHeaderColor: '#dce8ff',
        primaryColor: '#4f8cff',
        primaryColorHover: '#699fff',
        primaryColorPressed: '#3a72e5',
        primaryColorSuppl: '#8bb7ff',
        infoColor: '#4f8cff',
        successColor: '#2f9a84',
        warningColor: '#d59a35',
        errorColor: '#d2506a',
        borderColor: '#c9d9f3',
        dividerColor: '#c9d9f3',
      },
      dark: {
        bodyColor: '#0f1724',
        cardColor: '#162133',
        modalColor: '#162133',
        popoverColor: '#162133',
        tableHeaderColor: '#1b2940',
        primaryColor: '#77a8ff',
        primaryColorHover: '#8bb7ff',
        primaryColorPressed: '#5d90ec',
        primaryColorSuppl: '#aacbff',
        infoColor: '#77a8ff',
        successColor: '#4eb89e',
        warningColor: '#dbac55',
        errorColor: '#db7287',
        borderColor: '#243652',
        dividerColor: '#243652',
        inputColor: '#1d2b43',
        inputColorDisabled: '#1a263a',
      },
    },
  },
  {
    id: 'graphite-mono',
    name: '石墨单色',
    description: '克制的中性灰黑主题，适合长时间工作。',
    preview: ['#7f8a99', '#23262c', '#f2f4f7'],
    customization: {
      light: {
        bodyColor: '#f2f4f7',
        cardColor: '#ebedf0',
        modalColor: '#f2f4f7',
        popoverColor: '#f2f4f7',
        tableHeaderColor: '#e3e6ea',
        textColorBase: '#20242b',
        textColor1: '#2d333c',
        textColor2: '#535b67',
        textColor3: '#737c89',
        primaryColor: '#5e6978',
        primaryColorHover: '#707c8c',
        primaryColorPressed: '#4a5461',
        primaryColorSuppl: '#8b96a4',
        infoColor: '#5e6978',
        successColor: '#3d8a67',
        warningColor: '#b78638',
        errorColor: '#b55463',
        borderColor: '#d2d7de',
        dividerColor: '#d2d7de',
        inputColor: '#f8f9fb',
        inputColorDisabled: '#e7eaee',
      },
      dark: {
        bodyColor: '#111317',
        cardColor: '#191c21',
        modalColor: '#191c21',
        popoverColor: '#191c21',
        tableHeaderColor: '#20242b',
        textColorBase: '#d8dde5',
        textColor1: '#c4c9d1',
        textColor2: '#a1a8b3',
        textColor3: '#7d8591',
        primaryColor: '#8b96a4',
        primaryColorHover: '#9ba5b2',
        primaryColorPressed: '#727d8c',
        primaryColorSuppl: '#b0bac7',
        infoColor: '#8b96a4',
        successColor: '#58a27f',
        warningColor: '#c69a4e',
        errorColor: '#c46c79',
        borderColor: '#2b3038',
        dividerColor: '#2b3038',
        inputColor: '#22262d',
        inputColorDisabled: '#1d2127',
      },
    },
  },
  {
    id: 'rose-noir',
    name: '夜玫瑰',
    description: '深酒红与粉灰的组合，强调品牌感和层次。',
    preview: ['#c95c7b', '#301520', '#fff1f5'],
    customization: {
      light: {
        bodyColor: '#fff1f5',
        cardColor: '#ffe6ed',
        modalColor: '#fff1f5',
        popoverColor: '#fff1f5',
        tableHeaderColor: '#ffdbe6',
        primaryColor: '#c95c7b',
        primaryColorHover: '#d8738f',
        primaryColorPressed: '#ae4664',
        primaryColorSuppl: '#e49db0',
        infoColor: '#b9629b',
        successColor: '#3aa082',
        warningColor: '#dd9b42',
        errorColor: '#c95066',
        borderColor: '#efc8d5',
        dividerColor: '#efc8d5',
      },
      dark: {
        bodyColor: '#161016',
        cardColor: '#22151f',
        modalColor: '#22151f',
        popoverColor: '#22151f',
        tableHeaderColor: '#2b1b27',
        primaryColor: '#d77e9a',
        primaryColorHover: '#e194ad',
        primaryColorPressed: '#c16785',
        primaryColorSuppl: '#eab0c1',
        infoColor: '#bf7ed1',
        successColor: '#53b79a',
        warningColor: '#e2af5c',
        errorColor: '#d96b80',
        borderColor: '#382230',
        dividerColor: '#382230',
        inputColor: '#2a1a25',
        inputColorDisabled: '#25171f',
      },
    },
  },
  {
    id: 'ceramic-sky',
    name: '瓷青天光',
    description: '柔和青蓝与瓷白的组合，更偏轻盈和通透。',
    preview: ['#4f9db2', '#203741', '#eef8fb'],
    customization: {
      light: {
        bodyColor: '#eef8fb',
        cardColor: '#e4f1f5',
        modalColor: '#eef8fb',
        popoverColor: '#eef8fb',
        tableHeaderColor: '#d8eaef',
        primaryColor: '#4f9db2',
        primaryColorHover: '#62aec1',
        primaryColorPressed: '#3f8295',
        primaryColorSuppl: '#86c7d6',
        infoColor: '#4f9db2',
        successColor: '#409d7e',
        warningColor: '#d4a146',
        errorColor: '#cb6275',
        borderColor: '#c7dce2',
        dividerColor: '#c7dce2',
      },
      dark: {
        bodyColor: '#10191d',
        cardColor: '#162229',
        modalColor: '#162229',
        popoverColor: '#162229',
        tableHeaderColor: '#1d2c34',
        primaryColor: '#69b7ca',
        primaryColorHover: '#7fc5d6',
        primaryColorPressed: '#4f9db2',
        primaryColorSuppl: '#9bd8e5',
        infoColor: '#69b7ca',
        successColor: '#58b496',
        warningColor: '#ddb25d',
        errorColor: '#d67b8d',
        borderColor: '#253740',
        dividerColor: '#253740',
        inputColor: '#21313a',
        inputColorDisabled: '#1b2931',
      },
    },
  },
];

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
