<template>
  <UpdateAvailableModal
    v-model:show="showUpdateModal"
    :current-version="currentVersion"
    :latest-version="latestVersion"
    :update-info="updateInfo"
    :changelog="changelog"
    :sorted-changelog="sortedChangelog"
    @confirm="handleUpdate"
    @cancel="handleCancelUpdate"
  />
</template>

<script setup lang="ts">
import { onUnmounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";
import { useAppUpdate } from "@/composables/useAppUpdate";
import { useAutoUpdate } from "@/composables/useAutoUpdate";
import UpdateAvailableModal from "@/components/UpdateAvailableModal.vue";

const authStore = useAuthStore();
const { isLoggedIn, isCheckingAuth } = storeToRefs(authStore);
const {
  showUpdateModal,
  latestVersion,
  currentVersion,
  updateInfo,
  changelog,
  sortedChangelog,
  checkForUpdates,
  handleUpdate,
  handleCancelUpdate,
} = useAppUpdate({ silent: true });
const { checkForUpdatesOnStart } = useAutoUpdate();

let checkTimer: number | null = null;
let hasScheduledCheck = false;

function scheduleStartupCheck() {
  if (hasScheduledCheck) {
    return;
  }

  hasScheduledCheck = true;
  checkTimer = window.setTimeout(() => {
    void checkForUpdatesOnStart(() => checkForUpdates({ silent: true }));
  }, 3000);
}

watch(
  () => isLoggedIn.value && !isCheckingAuth.value,
  (ready) => {
    if (ready) {
      scheduleStartupCheck();
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  if (checkTimer !== null) {
    clearTimeout(checkTimer);
    checkTimer = null;
  }
});
</script>
