import DOMPurify from "dompurify";

const ANSI_ESCAPE_SEQUENCE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeLogText(log: string): string {
  return log.replace(ANSI_ESCAPE_SEQUENCE, "").replace(/▣/g, "");
}

export function getSanitizedLogsText(logs: string[]): string {
  return logs.map((log) => sanitizeLogText(log)).join("\n");
}

export function formatLogHtml(log: string, mode: "token" | "line" = "token"): string {
  let cleanLog = escapeHtml(sanitizeLogText(log));

  cleanLog = cleanLog.replace(
    /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?)/g,
    '<span style="color: var(--app-log-timestamp-color);">$1</span>',
  );

  cleanLog = cleanLog.replace(
    /(\[[^\]]+\.go:\d+\])/g,
    '<span style="color: var(--app-log-path-color);">$1</span>',
  );

  cleanLog = cleanLog.replace(
    /\b(https?:\/\/[a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)+(?::\d+)?(?:\/[^\s\]]*)?)\b/g,
    '<span style="color: var(--app-log-highlight-color); font-weight: 600;">$1</span>',
  );

  cleanLog = cleanLog.replace(
    /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+)\b/g,
    '<span style="color: var(--app-log-highlight-color); font-weight: 600;">$1</span>',
  );

  cleanLog = cleanLog.replace(
    /\b([a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)+:\d+)\b(?!\.go)/g,
    (match) => {
      if (/\.go:\d+$/.test(match)) {
        return match;
      }

      return `<span style="color: var(--app-log-highlight-color); font-weight: 600;">${match}</span>`;
    },
  );

  cleanLog = cleanLog.replace(
    /\b([0-9a-f]{32})\b/gi,
    '<span style="color: var(--app-log-highlight-color); font-weight: 600;">$1</span>',
  );

  const severityMatch = cleanLog.match(/\[(I|W|E)\]/);
  const severityColorMap = {
    I: "var(--app-log-info-color)",
    W: "var(--app-log-warning-color)",
    E: "var(--app-log-error-color)",
  } as const;

  if (mode === "line" && severityMatch) {
    const severity = severityMatch[1] as keyof typeof severityColorMap;
    cleanLog = `<span style="color: ${severityColorMap[severity]};">${cleanLog}</span>`;
  } else {
    cleanLog = cleanLog
      .replace(/\[I\]/g, '<span style="color: var(--app-log-info-color);">[I]</span>')
      .replace(/\[W\]/g, '<span style="color: var(--app-log-warning-color);">[W]</span>')
      .replace(/\[E\]/g, '<span style="color: var(--app-log-error-color);">[E]</span>');
  }

  return DOMPurify.sanitize(cleanLog);
}
