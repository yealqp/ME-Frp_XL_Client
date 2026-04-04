<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useThemeStore } from "@/stores/theme";

const themeStore = useThemeStore();
const { isDarkMode } = storeToRefs(themeStore);

const themeClass = computed(() =>
  isDarkMode.value ? "auth-shell--dark" : "auth-shell--light",
);
</script>

<template>
  <section class="auth-shell" :class="themeClass">
    <div class="auth-shell__veil"></div>

    <div class="auth-shell__content">
      <div class="auth-shell__hero">
        <p class="auth-shell__eyebrow">ME-Frp XL Client</p>
        <h2 class="auth-shell__headline">在桌面端继续管理你的隧道。</h2>
        <p class="auth-shell__description">
          登录或注册后即可在 XL Client 中完成隧道创建与隧道启停。
        </p>
      </div>

      <div class="auth-shell__panel">
        <div class="auth-shell__panel-card">
          <slot />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.auth-shell {
  --auth-overlay: linear-gradient(110deg, rgba(8, 14, 26, 0.78) 0%, rgba(8, 14, 26, 0.54) 42%, rgba(8, 14, 26, 0.7) 100%);
  --auth-veil-bg: linear-gradient(90deg, rgba(5, 10, 20, 0.22), rgba(5, 10, 20, 0.08));
  --auth-hero-text: #f2f7ff;
  --auth-hero-muted: rgba(230, 240, 252, 0.76);
  --auth-eyebrow-bg: rgba(255, 255, 255, 0.08);
  --auth-eyebrow-border: rgba(255, 255, 255, 0.14);
  --auth-eyebrow-text: rgba(239, 246, 255, 0.86);
  --auth-panel-bg: rgba(10, 18, 30, 0.42);
  --auth-panel-border: rgba(255, 255, 255, 0.16);
  --auth-panel-shadow: 0 18px 48px rgba(4, 10, 22, 0.32);
  --auth-panel-text: #eff6ff;
  --auth-panel-kicker: rgba(208, 226, 248, 0.72);
  --auth-panel-subtitle: rgba(226, 236, 248, 0.68);
  --auth-divider-color: rgba(255, 255, 255, 0.1);
  --auth-muted-color: rgba(226, 236, 248, 0.38);
  --auth-link-color: #d8ecff;
  --auth-link-hover: #ffffff;
  --auth-form-error: #ffd7df;
  --auth-input-bg: rgba(255, 255, 255, 0.08);
  --auth-input-bg-focus: rgba(255, 255, 255, 0.12);
  --auth-input-bg-disabled: rgba(255, 255, 255, 0.08);
  --auth-input-border: rgba(255, 255, 255, 0.12);
  --auth-input-border-hover: rgba(255, 255, 255, 0.22);
  --auth-input-border-focus: rgba(157, 216, 255, 0.54);
  --auth-input-shadow-focus: 0 0 0 3px rgba(141, 211, 255, 0.14);
  --auth-input-text: #f8fbff;
  --auth-input-text-disabled: rgba(248, 251, 255, 0.48);
  --auth-input-placeholder: rgba(225, 236, 248, 0.56);
  --auth-input-caret: #ffffff;
  --auth-submit-start: rgba(150, 222, 255, 0.96);
  --auth-submit-end: rgba(110, 178, 255, 0.92);
  --auth-submit-start-hover: rgba(164, 228, 255, 0.98);
  --auth-submit-end-hover: rgba(121, 188, 255, 0.94);
  --auth-submit-start-active: rgba(142, 214, 255, 0.96);
  --auth-submit-end-active: rgba(100, 170, 250, 0.9);
  --auth-submit-text: #061321;
  --auth-submit-shadow: 0 10px 24px rgba(75, 142, 255, 0.18);
  --auth-submit-shadow-hover: 0 12px 28px rgba(75, 142, 255, 0.2);
  --auth-send-btn-bg: rgba(255, 255, 255, 0.12);
  --auth-send-btn-bg-hover: rgba(255, 255, 255, 0.2);
  --auth-send-btn-bg-pressed: rgba(255, 255, 255, 0.14);
  --auth-send-btn-bg-disabled: rgba(255, 255, 255, 0.08);
  --auth-send-btn-border: rgba(255, 255, 255, 0.16);
  --auth-send-btn-border-hover: rgba(150, 220, 255, 0.52);
  --auth-send-btn-text: #f7fbff;
  --auth-send-btn-text-hover: #ffffff;
  --auth-send-btn-text-disabled: rgba(247, 251, 255, 0.46);
  --auth-alert-base-bg: rgba(255, 255, 255, 0.06);
  --auth-alert-base-border: rgba(255, 255, 255, 0.1);
  --auth-alert-base-text: rgba(236, 244, 255, 0.88);
  --auth-alert-base-title: #f8fbff;
  --auth-alert-link-hover: #ffffff;
  --auth-alert-info-bg: rgba(98, 180, 255, 0.12);
  --auth-alert-info-border: rgba(144, 211, 255, 0.22);
  --auth-alert-info-text: rgba(233, 245, 255, 0.92);
  --auth-alert-info-title: #f4fbff;
  --auth-alert-warning-bg: rgba(255, 183, 94, 0.12);
  --auth-alert-warning-border: rgba(255, 208, 145, 0.22);
  --auth-alert-warning-text: rgba(255, 240, 214, 0.94);
  --auth-alert-warning-title: #fff7e8;
  --auth-alert-success-bg: rgba(89, 204, 147, 0.12);
  --auth-alert-success-border: rgba(124, 228, 176, 0.22);
  --auth-alert-success-text: rgba(229, 255, 240, 0.94);
  --auth-alert-success-title: #f1fff6;
  --auth-alert-error-bg: rgba(255, 112, 112, 0.12);
  --auth-alert-error-border: rgba(255, 150, 150, 0.24);
  --auth-alert-error-text: rgba(255, 228, 228, 0.94);
  --auth-alert-error-title: #fff3f3;
  position: relative;
  min-height: 100vh;
  height: 100%;
  overflow: auto;
  background-image:
    var(--auth-overlay),
    url("https://t.alcy.cc/pc");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  isolation: isolate;
}

.auth-shell--light {
  --auth-overlay: linear-gradient(110deg, rgba(247, 250, 255, 0.86) 0%, rgba(241, 246, 255, 0.62) 42%, rgba(246, 249, 255, 0.78) 100%);
  --auth-veil-bg: linear-gradient(90deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.08));
  --auth-hero-text: #102033;
  --auth-hero-muted: rgba(24, 38, 57, 0.72);
  --auth-eyebrow-bg: rgba(255, 255, 255, 0.7);
  --auth-eyebrow-border: rgba(255, 255, 255, 0.84);
  --auth-eyebrow-text: color-mix(in srgb, var(--app-primary-color) 70%, #13243b);
  --auth-panel-bg: rgba(255, 255, 255, 0.62);
  --auth-panel-border: rgba(255, 255, 255, 0.82);
  --auth-panel-shadow: 0 18px 48px rgba(20, 34, 52, 0.14);
  --auth-panel-text: #152030;
  --auth-panel-kicker: rgba(28, 45, 67, 0.68);
  --auth-panel-subtitle: rgba(28, 45, 67, 0.72);
  --auth-divider-color: color-mix(in srgb, var(--app-border-color) 88%, white);
  --auth-muted-color: color-mix(in srgb, var(--app-text-color-3) 82%, #ffffff);
  --auth-link-color: color-mix(in srgb, var(--app-primary-color) 76%, #13243b);
  --auth-link-hover: color-mix(in srgb, var(--app-primary-color) 88%, #102033);
  --auth-form-error: color-mix(in srgb, var(--app-error-color) 70%, #223041);
  --auth-input-bg: rgba(255, 255, 255, 0.72);
  --auth-input-bg-focus: rgba(255, 255, 255, 0.92);
  --auth-input-bg-disabled: rgba(244, 246, 249, 0.84);
  --auth-input-border: color-mix(in srgb, var(--app-border-color) 88%, white);
  --auth-input-border-hover: color-mix(in srgb, var(--app-primary-color) 28%, var(--app-border-color));
  --auth-input-border-focus: color-mix(in srgb, var(--app-primary-color) 54%, white);
  --auth-input-shadow-focus: 0 0 0 3px color-mix(in srgb, var(--app-primary-color) 14%, transparent);
  --auth-input-text: #152030;
  --auth-input-text-disabled: rgba(21, 32, 48, 0.42);
  --auth-input-placeholder: rgba(52, 70, 94, 0.52);
  --auth-input-caret: var(--app-primary-color);
  --auth-submit-start: color-mix(in srgb, var(--app-primary-color) 82%, #ffffff);
  --auth-submit-end: var(--app-primary-color);
  --auth-submit-start-hover: color-mix(in srgb, var(--app-primary-color-hover) 80%, #ffffff);
  --auth-submit-end-hover: var(--app-primary-color-hover);
  --auth-submit-start-active: color-mix(in srgb, var(--app-primary-color-pressed) 82%, #ffffff);
  --auth-submit-end-active: var(--app-primary-color-pressed);
  --auth-submit-text: #ffffff;
  --auth-submit-shadow: 0 10px 24px color-mix(in srgb, var(--app-primary-color) 18%, transparent);
  --auth-submit-shadow-hover: 0 12px 28px color-mix(in srgb, var(--app-primary-color) 22%, transparent);
  --auth-send-btn-bg: rgba(255, 255, 255, 0.82);
  --auth-send-btn-bg-hover: rgba(255, 255, 255, 0.96);
  --auth-send-btn-bg-pressed: rgba(246, 249, 255, 0.92);
  --auth-send-btn-bg-disabled: rgba(242, 244, 247, 0.8);
  --auth-send-btn-border: color-mix(in srgb, var(--app-primary-color) 18%, var(--app-border-color));
  --auth-send-btn-border-hover: color-mix(in srgb, var(--app-primary-color) 34%, var(--app-border-color));
  --auth-send-btn-text: color-mix(in srgb, var(--app-primary-color) 76%, #152030);
  --auth-send-btn-text-hover: color-mix(in srgb, var(--app-primary-color) 88%, #152030);
  --auth-send-btn-text-disabled: rgba(52, 70, 94, 0.42);
  --auth-alert-base-bg: rgba(255, 255, 255, 0.72);
  --auth-alert-base-border: rgba(255, 255, 255, 0.84);
  --auth-alert-base-text: #223041;
  --auth-alert-base-title: #152030;
  --auth-alert-link-hover: #152030;
  --auth-alert-info-bg: color-mix(in srgb, var(--app-info-color) 10%, rgba(255, 255, 255, 0.94));
  --auth-alert-info-border: color-mix(in srgb, var(--app-info-color) 24%, rgba(255, 255, 255, 0.96));
  --auth-alert-info-text: color-mix(in srgb, var(--app-info-color) 64%, #152030);
  --auth-alert-info-title: color-mix(in srgb, var(--app-info-color) 76%, #152030);
  --auth-alert-warning-bg: color-mix(in srgb, var(--app-warning-color) 12%, rgba(255, 255, 255, 0.94));
  --auth-alert-warning-border: color-mix(in srgb, var(--app-warning-color) 28%, rgba(255, 255, 255, 0.96));
  --auth-alert-warning-text: color-mix(in srgb, var(--app-warning-color) 70%, #152030);
  --auth-alert-warning-title: color-mix(in srgb, var(--app-warning-color) 82%, #152030);
  --auth-alert-success-bg: color-mix(in srgb, var(--app-success-color) 10%, rgba(255, 255, 255, 0.94));
  --auth-alert-success-border: color-mix(in srgb, var(--app-success-color) 24%, rgba(255, 255, 255, 0.96));
  --auth-alert-success-text: color-mix(in srgb, var(--app-success-color) 68%, #152030);
  --auth-alert-success-title: color-mix(in srgb, var(--app-success-color) 80%, #152030);
  --auth-alert-error-bg: color-mix(in srgb, var(--app-error-color) 10%, rgba(255, 255, 255, 0.94));
  --auth-alert-error-border: color-mix(in srgb, var(--app-error-color) 24%, rgba(255, 255, 255, 0.96));
  --auth-alert-error-text: color-mix(in srgb, var(--app-error-color) 66%, #152030);
  --auth-alert-error-title: color-mix(in srgb, var(--app-error-color) 78%, #152030);
}

.auth-shell--dark {
  --auth-overlay: linear-gradient(110deg, rgba(8, 14, 26, 0.78) 0%, rgba(8, 14, 26, 0.54) 42%, rgba(8, 14, 26, 0.7) 100%);
  --auth-veil-bg: linear-gradient(90deg, rgba(5, 10, 20, 0.22), rgba(5, 10, 20, 0.08));
  --auth-alert-base-bg: rgba(255, 255, 255, 0.06);
  --auth-alert-base-border: rgba(255, 255, 255, 0.1);
  --auth-alert-base-text: rgba(236, 244, 255, 0.88);
  --auth-alert-base-title: #f8fbff;
  --auth-alert-link-hover: #ffffff;
  --auth-alert-info-bg: color-mix(in srgb, var(--app-info-color) 14%, rgba(255, 255, 255, 0));
  --auth-alert-info-border: color-mix(in srgb, var(--app-info-color) 28%, rgba(255, 255, 255, 0.08));
  --auth-alert-info-text: color-mix(in srgb, var(--app-info-color) 18%, #ffffff);
  --auth-alert-info-title: color-mix(in srgb, var(--app-info-color) 10%, #ffffff);
  --auth-alert-warning-bg: color-mix(in srgb, var(--app-warning-color) 14%, rgba(255, 255, 255, 0));
  --auth-alert-warning-border: color-mix(in srgb, var(--app-warning-color) 28%, rgba(255, 255, 255, 0.08));
  --auth-alert-warning-text: color-mix(in srgb, var(--app-warning-color) 22%, #ffffff);
  --auth-alert-warning-title: color-mix(in srgb, var(--app-warning-color) 14%, #ffffff);
  --auth-alert-success-bg: color-mix(in srgb, var(--app-success-color) 14%, rgba(255, 255, 255, 0));
  --auth-alert-success-border: color-mix(in srgb, var(--app-success-color) 28%, rgba(255, 255, 255, 0.08));
  --auth-alert-success-text: color-mix(in srgb, var(--app-success-color) 20%, #ffffff);
  --auth-alert-success-title: color-mix(in srgb, var(--app-success-color) 12%, #ffffff);
  --auth-alert-error-bg: color-mix(in srgb, var(--app-error-color) 14%, rgba(255, 255, 255, 0));
  --auth-alert-error-border: color-mix(in srgb, var(--app-error-color) 28%, rgba(255, 255, 255, 0.08));
  --auth-alert-error-text: color-mix(in srgb, var(--app-error-color) 20%, #ffffff);
  --auth-alert-error-title: color-mix(in srgb, var(--app-error-color) 12%, #ffffff);
}

.auth-shell__veil {
  position: absolute;
  inset: 0;
  background: var(--auth-veil-bg);
  backdrop-filter: blur(2px);
}

.auth-shell__content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 440px);
  align-items: center;
  gap: clamp(28px, 5vw, 72px);
  padding: clamp(24px, 4vw, 48px);
}

.auth-shell__hero {
  max-width: 520px;
  padding-right: clamp(0px, 3vw, 32px);
  color: var(--auth-hero-text);
}

.auth-shell__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-radius: 999px;
  margin-bottom: 18px;
  background: var(--auth-eyebrow-bg);
  border: 1px solid var(--auth-eyebrow-border);
  color: var(--auth-eyebrow-text);
  font-size: 12px;
  letter-spacing: 0.14em;
  backdrop-filter: blur(10px);
}

.auth-shell__headline {
  margin: 0;
  font-size: clamp(34px, 4.6vw, 54px);
  line-height: 1.08;
  font-weight: 650;
  letter-spacing: -0.03em;
  text-wrap: balance;
}

.auth-shell__description {
  max-width: 480px;
  margin: 18px 0 0;
  font-size: clamp(15px, 1.5vw, 17px);
  line-height: 1.7;
  color: var(--auth-hero-muted);
}

.auth-shell__panel {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.auth-shell__panel-card {
  width: min(100%, 460px);
  padding: clamp(24px, 3vw, 32px);
  border-radius: 24px;
  border: 1px solid var(--auth-panel-border);
  background: var(--auth-panel-bg);
  box-shadow: var(--auth-panel-shadow);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
}

:deep(.auth-panel-view) {
  position: relative;
  z-index: 1;
  color: var(--auth-panel-text);
}

:deep(.auth-panel-header) {
  margin-bottom: 24px;
}

:deep(.auth-panel-kicker) {
  margin: 0 0 10px;
  color: var(--auth-panel-kicker);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

:deep(.auth-panel-title) {
  margin: 0;
  color: var(--auth-panel-text);
  font-size: clamp(26px, 2.8vw, 32px);
  font-weight: 650;
  letter-spacing: -0.03em;
}

:deep(.auth-panel-subtitle) {
  margin: 10px 0 0;
  color: var(--auth-panel-subtitle);
  font-size: 14px;
  line-height: 1.65;
}

:deep(.auth-form) {
  position: relative;
  z-index: 1;
}

:deep(.auth-form .n-form-item) {
  margin-bottom: 16px;
}

:deep(.auth-form .n-form-item-feedback__line) {
  color: var(--auth-form-error);
}

:deep(.auth-form .n-input),
:deep(.auth-form .n-input-number),
:deep(.auth-form .n-base-selection) {
  --n-color: var(--auth-input-bg) !important;
  --n-color-focus: var(--auth-input-bg-focus) !important;
  --n-color-disabled: var(--auth-input-bg-disabled) !important;
  --n-border: 1px solid var(--auth-input-border) !important;
  --n-border-hover: 1px solid var(--auth-input-border-hover) !important;
  --n-border-focus: 1px solid var(--auth-input-border-focus) !important;
  --n-box-shadow-focus: var(--auth-input-shadow-focus) !important;
  --n-text-color: var(--auth-input-text) !important;
  --n-text-color-disabled: var(--auth-input-text-disabled) !important;
  --n-placeholder-color: var(--auth-input-placeholder) !important;
  --n-caret-color: var(--auth-input-caret) !important;
  backdrop-filter: blur(10px);
}

:deep(.auth-form .n-input .n-input-wrapper),
:deep(.auth-form .n-input-number),
:deep(.auth-form .n-base-selection) {
  border-radius: 14px;
}

:deep(.auth-form .n-input .n-input__input-el),
:deep(.auth-form .n-input .n-input__textarea-el) {
  color: var(--auth-input-text);
}

:deep(.auth-form .n-input .n-input__placeholder) {
  color: var(--auth-input-placeholder);
}

:deep(.auth-inline-alert.n-alert) {
  --n-color: var(--auth-alert-base-bg) !important;
  --n-border: 1px solid var(--auth-alert-base-border) !important;
  --n-text-color: var(--auth-alert-base-text) !important;
  --n-title-text-color: var(--auth-alert-base-title) !important;
  --n-icon-color: currentColor !important;
  border-radius: 14px;
  backdrop-filter: blur(10px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

:deep(.auth-inline-alert.n-alert.n-alert--info-type) {
  --n-color: var(--auth-alert-info-bg) !important;
  --n-border: 1px solid var(--auth-alert-info-border) !important;
  --n-text-color: var(--auth-alert-info-text) !important;
  --n-title-text-color: var(--auth-alert-info-title) !important;
}

:deep(.auth-inline-alert.n-alert.n-alert--warning-type) {
  --n-color: var(--auth-alert-warning-bg) !important;
  --n-border: 1px solid var(--auth-alert-warning-border) !important;
  --n-text-color: var(--auth-alert-warning-text) !important;
  --n-title-text-color: var(--auth-alert-warning-title) !important;
}

:deep(.auth-inline-alert.n-alert.n-alert--success-type) {
  --n-color: var(--auth-alert-success-bg) !important;
  --n-border: 1px solid var(--auth-alert-success-border) !important;
  --n-text-color: var(--auth-alert-success-text) !important;
  --n-title-text-color: var(--auth-alert-success-title) !important;
}

:deep(.auth-inline-alert.n-alert.n-alert--error-type) {
  --n-color: var(--auth-alert-error-bg) !important;
  --n-border: 1px solid var(--auth-alert-error-border) !important;
  --n-text-color: var(--auth-alert-error-text) !important;
  --n-title-text-color: var(--auth-alert-error-title) !important;
}

:deep(.auth-submit-btn.n-button) {
  height: 46px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

:deep(.auth-submit-btn.n-button--primary-type) {
  background: linear-gradient(135deg, var(--auth-submit-start), var(--auth-submit-end)) !important;
  border-color: transparent !important;
  color: var(--auth-submit-text) !important;
  box-shadow: var(--auth-submit-shadow);
}

:deep(.auth-submit-btn.n-button--primary-type:hover:not(.n-button--disabled)) {
  background: linear-gradient(135deg, var(--auth-submit-start-hover), var(--auth-submit-end-hover)) !important;
  border-color: transparent !important;
  box-shadow: var(--auth-submit-shadow-hover);
}

:deep(.auth-submit-btn.n-button--primary-type:active:not(.n-button--disabled)) {
  background: linear-gradient(135deg, var(--auth-submit-start-active), var(--auth-submit-end-active)) !important;
  border-color: transparent !important;
}

:deep(.auth-submit-btn.n-button--disabled) {
  opacity: 0.58;
}

:deep(.auth-link-btn.n-button) {
  --n-text-color: var(--auth-link-color) !important;
  --n-text-color-hover: var(--auth-link-hover) !important;
  --n-text-color-pressed: var(--auth-link-hover) !important;
}

:deep(.auth-link-btn.n-button:hover) {
  color: var(--auth-link-hover);
}

:deep(.auth-inline-link.n-button) {
  --n-text-color: currentColor !important;
  --n-text-color-hover: var(--auth-alert-link-hover) !important;
  --n-text-color-pressed: var(--auth-alert-link-hover) !important;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

@media (max-width: 1080px) {
  .auth-shell__content {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .auth-shell__hero {
    max-width: none;
    padding-right: 0;
  }

  .auth-shell__panel {
    justify-content: center;
  }

  .auth-shell__panel-card {
    width: min(100%, 520px);
  }
}

@media (max-width: 720px) {
  .auth-shell__content {
    padding: 20px 16px 24px;
  }

  .auth-shell__hero {
    padding-top: 12px;
  }

  .auth-shell__headline {
    font-size: 32px;
  }

  .auth-shell__description {
    font-size: 14px;
  }

  .auth-shell__panel-card {
    width: 100%;
    padding: 22px 18px;
    border-radius: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-shell,
  .auth-shell * {
    scroll-behavior: auto;
    animation: none !important;
    transition: none !important;
  }
}
</style>
