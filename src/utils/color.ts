/**
 * 颜色工具函数
 */

export function parseRgbColor(color: string): { r: number; g: number; b: number } | null {
  const c = color.trim();
  if (!c) return null;
  if (c.startsWith("#")) {
    const hex = c.slice(1);
    const fullHex =
      hex.length === 3
        ? hex.split("").map((ch) => ch + ch).join("")
        : hex.length === 8
          ? hex.slice(0, 6)
          : hex;
    if (fullHex.length !== 6) return null;
    const v = Number.parseInt(fullHex, 16);
    return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
  }
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return null;
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
}

export function mixRgbColor(a: string, b: string, weight: number): string {
  const ca = parseRgbColor(a);
  const cb = parseRgbColor(b);
  if (!ca || !cb) return a;
  const blend = (l: number, r: number) => Math.round(l * (1 - weight) + r * weight);
  return `rgb(${blend(ca.r, cb.r)}, ${blend(ca.g, cb.g)}, ${blend(ca.b, cb.b)})`;
}

export function isDarkRgbColor(color: string): boolean {
  const parsed = parseRgbColor(color);
  if (!parsed) return false;
  return (0.299 * parsed.r + 0.587 * parsed.g + 0.114 * parsed.b) / 255 < 0.5;
}
