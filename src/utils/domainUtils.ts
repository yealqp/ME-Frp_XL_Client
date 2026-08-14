/**
 * 域名处理工具函数
 * 统一处理域名解析、显示格式化和保存格式化
 */

/**
 * 校验单个域名或子域的基本合法性
 * 允许字母/数字/连字符/点，各段字母数字开头结尾且不含协议/端口/空格
 */
export function isValidHostname(hostname: string): boolean {
  const trimmed = hostname.trim();
  if (!trimmed || trimmed.length > 253) {
    return false;
  }
  // 拒绝协议、路径、端口、通配符以外的非法字符
  if (
    trimmed.includes("://") ||
    trimmed.includes("/") ||
    trimmed.includes(":") ||
    trimmed.includes(" ") ||
    trimmed.includes("*")
  ) {
    return false;
  }
  // 每段：字母数字-组合，不能以 - 开头或结尾，不能全数字（避免误认成 IP，但允许数字）
  const labels = trimmed.split(".");
  if (labels.some((label) => !label || label.length > 63 || !/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(label))) {
    return false;
  }
  return true;
}

/**
 * 校验并过滤域名列表，仅保留合法项
 */
export function filterValidDomains(domains: string[]): string[] {
  return domains.filter((d) => isValidHostname(d));
}

/**
 * 解析域名字符串为数组
 * @param domain 域名字符串，可能是 JSON 数组字符串或普通字符串
 * @returns 域名数组（自动过滤非法项）
 */
export function parseDomainArray(domain: string): string[] {
  if (!domain || domain.trim() === '') {
    return [];
  }

  try {
    const parsed = JSON.parse(domain);
    if (Array.isArray(parsed)) {
      return filterValidDomains(
        parsed.filter((d): d is string => typeof d === 'string' && d.trim() !== ''),
      );
    }
    if (typeof parsed === 'string' && parsed.trim() !== '') {
      return isValidHostname(parsed) ? [parsed.trim()] : [];
    }
    return [];
  } catch {
    if (typeof domain === 'string' && domain.trim() !== '') {
      return isValidHostname(domain) ? [domain.trim()] : [];
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
      const validDomains = filterValidDomains(
        parsed.filter((d): d is string => typeof d === 'string' && d.trim() !== ''),
      );
      return validDomains.join(', ');
    }
    if (typeof parsed === 'string' && isValidHostname(parsed)) {
      return parsed;
    }
    return '';
  } catch {
    return isValidHostname(domain) ? domain : '';
  }
}

/**
 * 格式化域名用于保存（JSON 数组字符串，自动过滤非法项）
 * @param domain 域名字符串，可能是逗号分隔的字符串或已有的 JSON 数组字符串
 * @returns JSON 数组字符串
 */
export function formatDomainForSave(domain: string): string {
  if (!domain || domain.trim() === '') {
    return '';
  }

  const trimmedDomain = domain.trim();
  
  let candidates: string[];

  if (trimmedDomain.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmedDomain);
      if (Array.isArray(parsed)) {
        candidates = parsed.filter((d): d is string => typeof d === 'string' && d.trim() !== '');
      } else {
        candidates = [trimmedDomain];
      }
    } catch {
      candidates = [trimmedDomain];
    }
  } else {
    candidates = trimmedDomain.split(',').map(d => d.trim()).filter(d => d.length > 0);
  }

  const validDomains = filterValidDomains(candidates);

  if (validDomains.length === 0) {
    return '';
  }

  return JSON.stringify(validDomains);
}