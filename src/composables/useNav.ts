import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { invoke } from "@tauri-apps/api/core";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings";
import { navItems, pathToNav, navToPath } from "@/config/navigation";

export function useNav() {
  const router = useRouter();
  const route = useRoute();
  const settingsStore = useSettingsStore();
  const { settings } = storeToRefs(settingsStore);

  const activeNav = computed(() => {
    return pathToNav.hasOwnProperty(route.path) ? pathToNav[route.path] : null;
  });

  const filteredNavItems = computed(() => {
    return navItems.filter((item) => {
      if (item.id === "mefrp-webui" && settings.value.hideWebuiEntry) {
        return false;
      }
      return true;
    });
  });

  function handleMenuSelect(key: string): string | null {
    const path = navToPath[key];
    if (path) {
      router.push(path);
    }
    return path ?? null;
  }

  async function handleLogoClick() {
    try {
      await invoke("open_url", {
        url: "https://www.mefrp.com/dashboard/home",
      });
    } catch (error) {
      console.error("打开官网失败:", error);
    }
  }

  return {
    activeNav,
    filteredNavItems,
    handleMenuSelect,
    handleLogoClick,
  };
}
