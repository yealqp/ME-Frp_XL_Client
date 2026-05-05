import { ref } from "vue";

export interface Hitokoto {
  sentence: string;
  from: string;
  from_who: string;
  type: string;
}

export function useHitokoto() {
  const hitokoto = ref<Hitokoto>({
    sentence: "加载中...",
    from: "",
    from_who: "",
    type: "",
  });
  const hitokotoLoading = ref(false);

  const getHitokoto = async () => {
    try {
      const response = await fetch("https://hitokoto.yealqp.cn/?encode=json");
      const data = await response.json();
      hitokoto.value = {
        sentence: data.hitokoto || "获取一言失败",
        from: data.from || "",
        from_who: data.from_who || "",
        type: data.type || "",
      };
    } catch (error) {
      console.error("获取一言失败:", error);
      hitokoto.value = {
        sentence: "获取一言失败",
        from: "获取失败",
        from_who: "",
        type: "",
      };
    }
  };

  const refreshHitokoto = async () => {
    hitokotoLoading.value = true;
    await getHitokoto();
    hitokotoLoading.value = false;
  };

  return {
    hitokoto,
    hitokotoLoading,
    getHitokoto,
    refreshHitokoto,
  };
}
