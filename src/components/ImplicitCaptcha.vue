<template>
  <!-- 隐式验证不需要任何 DOM 元素 -->
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import Cap from "@cap.js/widget";

interface Props {
  siteId?: string;
  workerCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  siteId: "2bf50e050d",
  workerCount: 2,
});

const emit = defineEmits<{
  solve: [token: string];
  error: [error: string];
  progress: [progress: number];
}>();

// Cap 实例
let capInstance: any = null;
const isInitialized = ref(false);
const currentToken = ref<string | null>(null);

// 初始化 Cap 实例
const initCap = async () => {
  try {
    // 创建 Cap 实例
    capInstance = new Cap({
      apiEndpoint: `https://captcha.mefrp.com/${props.siteId}/`,
      workerCount: props.workerCount,
    } as any);
    
    // 监听进度事件
    capInstance.addEventListener("progress", (event: any) => {
      const progress = event.detail?.progress || 0;
      console.log(`Cap.js 隐式验证进度: ${progress}%`);
      emit("progress", progress);
    });
    
    // 监听错误事件
    capInstance.addEventListener("error", (event: any) => {
      const error = event.detail?.error || "验证失败";
      console.error("Cap.js 隐式验证错误:", error);
      emit("error", error);
    });
    
    isInitialized.value = true;
    console.log("Cap.js 隐式验证实例初始化成功");
  } catch (error) {
    console.error("Cap.js 隐式验证初始化失败:", error);
    emit("error", "验证组件初始化失败");
  }
};

// 触发验证
const verify = async (): Promise<string> => {
  try {
    // 等待初始化完成
    let waitCount = 0;
    while (!isInitialized.value && waitCount < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      waitCount++;
    }
    
    if (!isInitialized.value || !capInstance) {
      throw new Error("验证组件未初始化");
    }
    
    console.log("开始 Cap.js 隐式验证...");
    
    // 调用 solve() 方法
    const result = await capInstance.solve();
    
    // 处理不同的返回类型
    let token: string;
    if (typeof result === 'string') {
      token = result;
    } else if (result && typeof result === 'object' && 'token' in result) {
      token = result.token;
    } else {
      console.error("Cap.js 返回了意外的格式:", result);
      throw new Error("验证失败：返回格式错误");
    }
    
    if (!token || typeof token !== 'string') {
      throw new Error("验证失败：token 格式错误");
    }
    
    currentToken.value = token;
    console.log("Cap.js 隐式验证成功");
    emit("solve", token);
    
    return token;
  } catch (error) {
    console.error("Cap.js 隐式验证失败:", error);
    const errorMessage = error instanceof Error ? error.message : "验证失败";
    emit("error", errorMessage);
    throw error;
  }
};

// 重置
const reset = () => {
  if (capInstance && typeof capInstance.reset === "function") {
    capInstance.reset();
    currentToken.value = null;
    console.log("Cap.js 隐式验证已重置");
  }
};

// 获取当前 token
const getToken = () => {
  return currentToken.value || (capInstance ? capInstance.token : null);
};

onMounted(() => {
  initCap();
});

onBeforeUnmount(() => {
  // 清理资源
  if (capInstance) {
    capInstance = null;
  }
});

// 暴露方法
defineExpose({
  verify,
  reset,
  getToken,
  isInitialized,
});
</script>

<style scoped>
/* 隐式验证不需要样式 */
</style>
