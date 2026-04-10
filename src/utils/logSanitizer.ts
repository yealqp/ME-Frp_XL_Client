const ANSI_ESCAPE_SEQUENCE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

export function sanitizeLogText(log: string): string {
  return log.replace(ANSI_ESCAPE_SEQUENCE, "").replace(/▣/g, "");
}
