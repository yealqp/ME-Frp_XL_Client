export function clampAppearanceRange(
  value: number | null | undefined,
  min: number,
  max: number,
  fallback: number | null,
): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

export function clampAppearanceOpacity(
  value: number | null | undefined,
  fallback: number | null,
): number | null {
  return clampAppearanceRange(value, 0, 100, fallback);
}
