import { computed, ref, watch } from "vue";
import { defineStore } from "pinia";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type {
  Theme,
  ThemeCommonConfig,
  ThemeCustomization,
  ThemeFieldKey,
  ThemeMode,
  ThemePreference,
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

const THEME_PREFERENCE_KEY = "theme-preference";

async function setWindowTheme(theme: Theme): Promise<void> {
  try {
    const appWindow = getCurrentWindow();
    await appWindow.setTheme(theme);
  } catch (error) {
    console.error("设置窗口主题失败:", error);
  }
}

function saveThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_PREFERENCE_KEY, JSON.stringify(preference));
  } catch (error) {
    console.error("保存主题偏好失败:", error);
  }
}

function loadThemePreference(): ThemePreference | null {
  try {
    const data = localStorage.getItem(THEME_PREFERENCE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("读取主题偏好失败:", error);
    return null;
  }
}

function createOverlay(currentTheme: Theme, targetTheme: Theme): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.className = "theme-overlay";

  const content = document.createElement("div");
  content.className = "theme-overlay-content";

  const gearContainer = document.createElement("div");
  gearContainer.className = "theme-overlay-gear";

  const gear = document.createElement("div");
  gear.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  `;

  const text = document.createElement("div");
  text.className = "theme-overlay-text";
  text.textContent = `正在切换到${targetTheme === "light" ? "浅色" : "深色"}模式`;

  gearContainer.appendChild(gear);
  content.appendChild(gearContainer);
  content.appendChild(text);
  overlay.appendChild(content);
  overlay.classList.add(currentTheme);

  return overlay;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const useThemeStore = defineStore("theme", () => {
  const mode = ref<ThemeMode>("system");
  const activeTheme = ref<Theme>("dark");
  const systemTheme = ref<Theme | null>(null);
  const editingTarget = ref<ThemeVariant>("dark");
  const savedCustomization = ref<ThemeCustomization>({});
  const draftCustomization = ref<ThemeCustomization>({});
  const validationIssues = ref<ThemeValidationIssue[]>([]);

  const systemThemeListener = useSystemTheme();

  const currentTheme = computed(() => activeTheme.value);
  const isDarkMode = computed(() => activeTheme.value === "dark");
  const isLightMode = computed(() => activeTheme.value === "light");
  const isSystemMode = computed(() => mode.value === "system");
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
      systemTheme.value = systemThemeListener.systemTheme.value;
    }
  }

  function resolveTargetTheme(newMode: ThemeMode): Theme {
    if (newMode !== "system") {
      return newMode;
    }

    syncSystemThemeState();
    return systemTheme.value || "dark";
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
    applyTheme(resolvedActiveThemeConfig.value);
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
        await wait(150);
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

  async function setThemeMode(newMode: ThemeMode): Promise<void> {
    try {
      const current = activeTheme.value;
      const targetTheme = resolveTargetTheme(newMode);

      if (current === targetTheme && mode.value === newMode) {
        return;
      }

      const overlay = createOverlay(current, targetTheme);
      document.body.appendChild(overlay);

      requestAnimationFrame(() => {
        overlay.classList.add("active");
      });

      await wait(500);

      overlay.classList.remove(current);
      overlay.classList.add(targetTheme);

      commitThemeModeChange(newMode);

      await wait(500);

      overlay.classList.remove("active");
      await wait(150);
      document.body.removeChild(overlay);

      await savePreference();
    } catch (error) {
      console.error("设置主题模式失败:", error);
      throw error;
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
    currentTheme,
    isDarkMode,
    isLightMode,
    isSystemMode,
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
  };
});
