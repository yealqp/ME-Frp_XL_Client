import { ref } from "vue";

export interface Hitokoto {
  sentence: string;
  from: string;
  from_who: string;
  type: string;
}

const HITOKOTO_TIMEOUT_MS = 10_000;

const fallbackHitokoto: Hitokoto = {
  sentence: "获取一言失败",
  from: "获取失败",
  from_who: "",
  type: "",
};

export function useHitokoto() {
  const hitokoto = ref<Hitokoto>({
    sentence: "加载中...",
    from: "",
    from_who: "",
    type: "",
  });
  const hitokotoLoading = ref(false);

  async function fetchHitokoto(): Promise<Hitokoto> {
    // 超时控制 + 中止，避免弱网下请求永久 pending
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HITOKOTO_TIMEOUT_MS);
    try {
      const response = await fetch("https://hitokoto.yealqp.cn/?encode=json", {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return {
        sentence: data.hitokoto || "获取一言失败",
        from: data.from || "",
        from_who: data.from_who || "",
        type: data.type || "",
      };
    } finally {
      clearTimeout(timer);
    }
  }

  const getHitokoto = async () => {
    try {
      hitokoto.value = await fetchHitokoto();
    } catch (error) {
      console.error("获取一言失败:", error);
      hitokoto.value = fallbackHitokoto;
    }
  };

  const refreshHitokoto = async () => {
    hitokotoLoading.value = true;
    try {
      await getHitokoto();
    } finally {
      hitokotoLoading.value = false;
    }
  };

  return {
    hitokoto,
    hitokotoLoading,
    getHitokoto,
    refreshHitokoto,
  };
}
