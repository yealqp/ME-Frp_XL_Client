<script setup lang="ts">
import { NSpin } from "naive-ui";
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <transition :name="(route.meta.transition as string) || 'fade-slide'" mode="out-in">
      <div v-if="Component" :key="route.path" class="route-container">
        <Suspense>
          <template #default>
            <component :is="Component" />
          </template>
          <template #fallback>
            <div class="route-loading">
              <n-spin size="medium" />
            </div>
          </template>
        </Suspense>
      </div>
      <div v-else :key="'empty-' + route.path" class="route-container">
        <div class="route-loading">
          <n-spin size="medium" />
        </div>
      </div>
    </transition>
  </router-view>
</template>
