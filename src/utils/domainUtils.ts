/**
 * 域名处理工具函数
 * 统一处理域名解析、显示格式化和保存格式化
 */

/**
 * 解析域名字符串为数组
 * @param domain 域名字符串，可能是 JSON 数组字符串或普通字符串
 * @returns 域名数组
 */
export function parseDomainArray(domain: string): string[] {
  if (!domain || domain.trim() === '') {
    return [];
  }

  try {
    const parsed = JSON.parse(domain);
    if (Array.isArray(parsed)) {
      return parsed.filter((d): d is string => typeof d === 'string' && d.trim() !== '');
    }
    if (typeof parsed === 'string' && parsed.trim() !== '') {
      return [parsed.trim()];
    }
    return [];
  } catch {
    if (typeof domain === 'string' && domain.trim() !== '') {
      return [domain.trim()];
    }
    return [];
  }
}

/**
 * 格式化域名用于显示（逗号分隔）
 * @param domain 域名字符串，可能是 JSON 数组字符串或普通字符串
 * @returns 格式化后的显示字符串
 */
export function formatDomainForDisplay(domain: string): string {
  if (!domain || domain.trim() === '') {
    return '';
  }

  try {
    const parsed = JSON.parse(domain);
    if (Array.isArray(parsed)) {
      const validDomains = parsed.filter((d): d is string => typeof d === 'string' && d.trim() !== '');
      return validDomains.join(', ');
    }
    if (typeof parsed === 'string') {
      return parsed;
    }
    return '';
  } catch {
    return domain;
  }
}

/**
 * 格式化域名用于保存（JSON 数组字符串）
 * @param domain 域名字符串，可能是逗号分隔的字符串或已有的 JSON 数组字符串
 * @returns JSON 数组字符串
 */
export function formatDomainForSave(domain: string): string {
  if (!domain || domain.trim() === '') {
    return '';
  }

  const trimmedDomain = domain.trim();
  
  if (trimmedDomain.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmedDomain);
      if (Array.isArray(parsed)) {
        return JSON.stringify(parsed.filter((d): d is string => typeof d === 'string' && d.trim() !== ''));
      }
    } catch {
      // 如果解析失败，继续处理
    }
  }

  const domains = trimmedDomain
    .split(',')
    .map(d => d.trim())
    .filter(d => d.length > 0);

  if (domains.length === 0) {
    return '';
  }

  return JSON.stringify(domains);
}