<template>
  <n-modal
    v-model:show="show"
    preset="card"
    :style="{ width: '500px' }"
    title="表单反馈"
  >
    <n-form :model="feedbackForm" label-placement="top">
      <n-form-item label="反馈内容" path="content" required>
        <n-input
          v-model:value="feedbackForm.content"
          type="textarea"
          placeholder="请详细描述您遇到的问题或建议,请勿骚扰。"
          :rows="6"
          :maxlength="500"
          show-count
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <n-space justify="end">
        <n-button @click="show = false">取消</n-button>
        <n-button
          type="primary"
          @click="submitFeedback"
          :loading="feedbackSubmitting"
        >
          提交反馈
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useMessage } from "naive-ui";
import { invoke } from "@tauri-apps/api/core";

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
}>();

const show = computed({
  get: () => props.show,
  set: (value: boolean) => emit("update:show", value),
});

const message = useMessage();
const feedbackSubmitting = ref(false);
const feedbackForm = ref({
  content: "",
});

// 提交反馈表单
const submitFeedback = async () => {
  if (!feedbackForm.value.content.trim()) {
    message.error("请输入反馈内容");
    return;
  }

  feedbackSubmitting.value = true;

  try {
    const { getUserInfo } = await import('@/api/auth');
    const { useAuthStore } = await import('@/stores/auth');
    const userRes = await getUserInfo(useAuthStore().userToken);
    const userId = userRes.data?.userId ?? 0;

    await invoke("api_send_feedback", {
      content: feedbackForm.value.content,
      userId,
    });

    message.success("反馈提交成功，感谢您的反馈！");
    show.value = false;
    // 清空表单
    feedbackForm.value.content = "";
  } catch (error) {
    console.error("提交反馈失败:", error);
    message.error(
      `提交反馈失败: ${error instanceof Error ? error.message : "网络错误"}`,
    );
  } finally {
    feedbackSubmitting.value = false;
  }
};
</script>
