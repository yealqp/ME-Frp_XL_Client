/**
 * Time formatting utilities
 * Provides unified time formatting functions for the application
 */

export interface TimeFormatOptions {
  format?: 'relative' | 'absolute' | 'datetime';
  locale?: string;
}

/**
 * Format a Unix timestamp to a human-readable string
 * @param timestamp - Unix timestamp in seconds
 * @param options - Formatting options
 * @returns Formatted time string
 */
export function formatTimestamp(
  timestamp: number,
  options: TimeFormatOptions = {}
): string {
  const { format = 'absolute', locale = 'zh-CN' } = options;

  // Handle invalid timestamps
  if (!timestamp || timestamp <= 0) {
    return '未知时间';
  }

  const date = new Date(timestamp * 1000);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return '无效时间';
  }

  switch (format) {
    case 'relative':
      return formatRelativeTime(date);
    case 'datetime':
      return formatDateTime(date, locale);
    case 'absolute':
    default:
      return formatAbsoluteDate(date, locale);
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  if (diffHour < 24) return `${diffHour} 小时前`;
  if (diffDay < 7) return `${diffDay} 天前`;
  
  return formatAbsoluteDate(date);
}

function formatAbsoluteDate(date: Date, locale: string = 'zh-CN'): string {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatDateTime(date: Date, locale: string = 'zh-CN'): string {
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Format bandwidth value to Mbps
 * @param value - Bandwidth value in KB/s
 * @returns Formatted bandwidth string
 */
export function formatBandwidth(value: number): string {
  if (value === 0) return '0 Mbps';
  const mbps = value / 128;
  return `${parseFloat(mbps.toFixed(2))} Mbps`;
}

/**
 * Format traffic value to MB or GB
 * @param value - Traffic value in MB
 * @param unit - Target unit (MB or GB)
 * @returns Formatted traffic string
 */
export function formatTraffic(value: number, unit: 'MB' | 'GB' = 'GB'): string {
  if (unit === 'GB') {
    return `${(value / 1024).toFixed(2)} GB`;
  }
  return `${value.toFixed(2)} MB`;
}
