<template>
  <div class="nav-logo" :class="`nav-logo--${size}`" @click="$emit('click')">
    <img
      src="../../assets/icon.png"
      alt="logo"
      class="nav-logo-img"
    />
    <span v-show="!hideText" class="nav-logo-text">XL Client</span>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: "sm" | "md";
  hideText?: boolean;
}>(), {
  size: "md",
  hideText: false,
});

defineEmits<{
  click: [];
}>();
</script>

<style scoped>
.nav-logo {
  display: flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
}

.nav-logo--md {
  gap: 10px;
}

.nav-logo--md .nav-logo-img {
  width: 28px;
  height: 28px;
}

.nav-logo--md .nav-logo-text {
  font-size: 20px;
}

.nav-logo--sm {
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color .2s ease;
}

.nav-logo--sm:hover {
  background-color: color-mix(in srgb, var(--app-primary-color) 6%, transparent);
}

.nav-logo--sm .nav-logo-img {
  width: 24px;
  height: 24px;
}

.nav-logo--sm .nav-logo-text {
  font-size: 16px;
}

.nav-logo-img {
  object-fit: contain;
  flex-shrink: 0;
}

.nav-logo-text {
  font-weight: 600;
  color: var(--app-primary-color);
  white-space: nowrap;
}
</style>
