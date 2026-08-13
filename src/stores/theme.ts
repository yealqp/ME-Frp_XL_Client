import { computed, ref, watch } from "vue";
import { defineStore } from "pinia";
import type {
  Theme,
  ThemeCommonConfig,
  ThemeCustomization,
  ThemeFieldKey,
  ThemeMode,
  ThemePreset,
  ThemeValidationIssue,
  ThemeVariant,
} from "@/types/theme";
import { useSystemTheme } from "@/composables/useSystemTheme";
import {
  applyTheme,
  buildNaiveThemeOverrides,
  getNaiveTheme,
} from "@/utils/themeApplier";
import { loadUnifiedConfig, mergeUnifiedConfig } from "@/utils/unifiedConfig";
import {
  buildThemeCustomizationDiff,
  cloneThemeCustomization,
  getDefaultThemeConfig,
  parseThemeCustomization,
  resolveThemeConfig,
  sanitizeThemeCustomization,
  serializeThemeCustomization,
  validateThemeCustomization,
} from "@/utils/themeConfig";
import {
  playThemeSwitchAnimation,
  setWindowTheme,
} from "@/utils/themeWindow";
import { loadThemePreference, saveThemePreference } from "@/utils/themePreference";

export const useThemeStore = defineStore("theme", () => {
  const mode = ref<ThemeMode>("system");
  const activeTheme = ref<Theme>("dark");
  const systemTheme = ref<Theme | null>(null);
  const editingTarget = ref<ThemeVariant>("dark");
  const savedCustomization = ref<ThemeCustomization>({});
  const draftCustomization = ref<ThemeCustomization>({});
  const validationIssues = ref<ThemeValidationIssue[]>([]);

  const systemThemeListener = useSystemTheme();

  const isDarkMode = computed(() => activeTheme.value === "dark");
  const isLightMode = computed(() => activeTheme.value === "light");
  const naiveTheme = computed(() => getNaiveTheme(activeTheme.value));
  const resolvedLightThemeConfig = computed(() =>
    resolveThemeConfig("light", draftCustomization.value),
  );
  const resolvedDarkThemeConfig = computed(() =>
    resolveThemeConfig("dark", draftCustomization.value),
  );
  const resolvedActiveThemeConfig = computed(() =>
    activeTheme.value === "light"
      ? resolvedLightThemeConfig.value
      : resolvedDarkThemeConfig.value,
  );
  const currentEditingThemeConfig = computed(() =>
    editingTarget.value === "light"
      ? resolvedLightThemeConfig.value
      : resolvedDarkThemeConfig.value,
  );
  const currentEditingDefaults = computed(() =>
    getDefaultThemeConfig(editingTarget.value),
  );
  const naiveThemeOverrides = computed(() =>
    buildNaiveThemeOverrides(resolvedActiveThemeConfig.value),
  );
  const hasDraftChanges = computed(
    () =>
      serializeThemeCustomization(draftCustomization.value) !==
      serializeThemeCustomization(savedCustomization.value),
  );
  const hasBlockingValidationIssues = computed(() =>
    validationIssues.value.some((issue) => issue.severity === "error"),
  );

  function updateActiveTheme(): void {
    activeTheme.value = mode.value === "system" ? systemTheme.value || "light" : mode.value;
  }

  function syncSystemThemeState(): void {
    if (systemThemeListener.isSupported.value) {
      systemThemeListener.startListening();
      // System theme synced reactively via watch below — no manual .value read needed
    }
  }

  /**
   * 解析目标主题
   *
   * "system" 模式：等待系统主题检测完成后再返回，避免读取到过期的
   * systemTheme 缓存（此前是同步返回旧值，导致从浅色切到跟随系统时
   * 动画错误显示"切换到浅色"，且切完后短暂停留在错误主题）。
   */
  async function resolveTargetTheme(newMode: ThemeMode): Promise<Theme> {
    if (newMode !== "system") {
      return newMode;
    }

    syncSystemThemeState();
    const latestSystemTheme = await systemThemeListener.refreshSystemTheme();
    return latestSystemTheme || "dark";
  }

  function commitThemeModeChange(newMode: ThemeMode): void {
    mode.value = newMode;
    if (newMode === "system") {
      syncSystemThemeState();
    }
    updateActiveTheme();
    applyResolvedTheme();
  }

  function replaceDraftCustomization(nextDraft: ThemeCustomization): void {
    draftCustomization.value = nextDraft;
    refreshValidationIssues();
    applyResolvedTheme();
  }

  function applyResolvedTheme(): void {
    applyTheme(resolvedActiveThemeConfig.value, activeTheme.value);
    void setWindowTheme(activeTheme.value);
  }

  function refreshValidationIssues(): void {
    validationIssues.value = validateThemeCustomization(draftCustomization.value);
  }

  async function syncToUnifiedConfig(
    customization: ThemeCustomization = savedCustomization.value,
  ): Promise<void> {
    try {
      const themeCustomization = buildThemeCustomizationDiff(customization);
      await mergeUnifiedConfig({
        themeMode: mode.value,
        themeCustomization:
          Object.keys(themeCustomization).length > 0 ? themeCustomization : undefined,
      });
    } catch (error) {
      console.error("同步主题到 UnifiedConfig 失败:", error);
    }
  }

  async function savePreference(): Promise<void> {
    saveThemePreference({
      mode: mode.value,
      enableTransitions: true,
    });

    await syncToUnifiedConfig(savedCustomization.value);
  }

  function resetDraftFromSaved(): void {
    draftCustomization.value = cloneThemeCustomization(savedCustomization.value);
    refreshValidationIssues();
  }

  async function initTheme(): Promise<void> {
    try {
      const preference = loadThemePreference();
      const config = await loadUnifiedConfig().catch(() => null);

      mode.value = config?.themeMode || preference?.mode || "dark";
      savedCustomization.value = sanitizeThemeCustomization(config?.themeCustomization ?? {});
      resetDraftFromSaved();

      if (mode.value === "system" && systemThemeListener.isSupported.value) {
        syncSystemThemeState();
        // 等待系统主题检测完成（替代固定 150ms 延时，保证首次加载即为准确主题）
        await systemThemeListener.refreshSystemTheme();
      }

      updateActiveTheme();
      applyResolvedTheme();
    } catch (error) {
      console.error("初始化主题系统失败:", error);
      mode.value = "dark";
      activeTheme.value = "dark";
      savedCustomization.value = {};
      resetDraftFromSaved();
      applyResolvedTheme();
    }
  }

  // 主题切换互斥标志：切换动画进行中忽略并发请求，避免多个 overlay 叠加到 body
  let switchingTheme = false;

  async function setThemeMode(newMode: ThemeMode): Promise<void> {
    if (switchingTheme) {
      return;
    }

    switchingTheme = true;
    try {
      const current = activeTheme.value;
      const targetTheme = await resolveTargetTheme(newMode);

      if (current === targetTheme && mode.value === newMode) {
        return;
      }

      await playThemeSwitchAnimation(current, targetTheme, () => {
        commitThemeModeChange(newMode);
      });

      await savePreference();
    } catch (error) {
      console.error("设置主题模式失败:", error);
      throw error;
    } finally {
      switchingTheme = false;
    }
  }

  async function setLightMode(): Promise<void> {
    await setThemeMode("light");
  }

  async function setDarkMode(): Promise<void> {
    await setThemeMode("dark");
  }

  async function setSystemMode(): Promise<void> {
    await setThemeMode("system");
  }

  async function toggleTheme(): Promise<void> {
    if (mode.value === "system") {
      await setThemeMode(activeTheme.value === "light" ? "dark" : "light");
      return;
    }

    await setThemeMode(mode.value === "light" ? "dark" : "light");
  }

  function updateSystemTheme(theme: Theme): void {
    systemTheme.value = theme;

    if (mode.value === "system") {
      updateActiveTheme();
      applyResolvedTheme();
    }
  }

  function setEditingTarget(theme: ThemeVariant): void {
    editingTarget.value = theme;
  }

  function updateThemeDraft(theme: ThemeVariant, partial: Partial<ThemeCommonConfig>): void {
    replaceDraftCustomization({
      ...draftCustomization.value,
      [theme]: {
        ...draftCustomization.value[theme],
        ...partial,
      },
    });
  }

  function updateThemeDraftField(
    theme: ThemeVariant,
    field: ThemeFieldKey,
    value: string,
  ): void {
    updateThemeDraft(theme, { [field]: value } as Partial<ThemeCommonConfig>);
  }

  function resetThemeDraft(theme: ThemeVariant): void {
    const nextDraft = cloneThemeCustomization(draftCustomization.value);
    delete nextDraft[theme];
    replaceDraftCustomization(nextDraft);
  }

  function resetAllThemeDrafts(): void {
    replaceDraftCustomization({});
  }

  function discardThemeDraft(): void {
    resetDraftFromSaved();
    applyResolvedTheme();
  }

  async function saveThemeCustomization(force = false): Promise<void> {
    refreshValidationIssues();
    if (hasBlockingValidationIssues.value && !force) {
      throw new Error("当前主题配置存在必须修复的对比度问题");
    }

    const normalized = buildThemeCustomizationDiff(draftCustomization.value);
    savedCustomization.value = cloneThemeCustomization(normalized);
    replaceDraftCustomization(cloneThemeCustomization(normalized));
    await syncToUnifiedConfig(savedCustomization.value);
  }

  function exportThemeDraft(): string {
    return serializeThemeCustomization(draftCustomization.value);
  }

  function importThemeDraft(serialized: string): void {
    const parsed = parseThemeCustomization(serialized);
    replaceDraftCustomization(cloneThemeCustomization(parsed));
  }

  function applyThemePreset(preset: ThemePreset): void {
    replaceDraftCustomization(cloneThemeCustomization(sanitizeThemeCustomization(preset.customization)));
  }

  function applyThemePresetToTarget(preset: ThemePreset, target: ThemeVariant): void {
    const sanitizedPreset = sanitizeThemeCustomization(preset.customization);
    const nextDraft = cloneThemeCustomization(draftCustomization.value);

    if (sanitizedPreset[target]) {
      nextDraft[target] = { ...sanitizedPreset[target] };
    } else {
      delete nextDraft[target];
    }

    replaceDraftCustomization(nextDraft);
  }

  watch(
    () => systemThemeListener.systemTheme.value,
    (newSystemTheme) => {
      if (newSystemTheme) {
        updateSystemTheme(newSystemTheme);
      }
    },
  );

  return {
    mode,
    activeTheme,
    systemTheme,
    editingTarget,
    savedCustomization,
    draftCustomization,
    validationIssues,
    isDarkMode,
    isLightMode,
    naiveTheme,
    naiveThemeOverrides,
    resolvedLightThemeConfig,
    resolvedDarkThemeConfig,
    resolvedActiveThemeConfig,
    currentEditingThemeConfig,
    currentEditingDefaults,
    hasDraftChanges,
    hasBlockingValidationIssues,
    initTheme,
    setThemeMode,
    setLightMode,
    setDarkMode,
    setSystemMode,
    toggleTheme,
    updateSystemTheme,
    setEditingTarget,
    updateThemeDraft,
    updateThemeDraftField,
    resetThemeDraft,
    resetAllThemeDrafts,
    discardThemeDraft,
    saveThemeCustomization,
    exportThemeDraft,
    importThemeDraft,
    applyThemePreset,
    applyThemePresetToTarget,
  };
});
