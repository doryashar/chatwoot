import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';

const SCROLL_THRESHOLD = 150;

export function useAutoScroll(containerRef, { autoListen = true } = {}) {
  const isFollowingLatest = ref(true);
  const newMessagesAvailable = ref(false);

  const isNearBottom = () => {
    const el = containerRef.value;
    if (!el) return true;
    return el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_THRESHOLD;
  };

  const updateFollowState = () => {
    if (isNearBottom()) {
      isFollowingLatest.value = true;
      newMessagesAvailable.value = false;
    } else {
      isFollowingLatest.value = false;
    }
  };

  const scrollToBottom = async () => {
    await nextTick();
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight;
    }
    isFollowingLatest.value = true;
    newMessagesAvailable.value = false;
  };

  const onNewMessage = () => {
    if (isFollowingLatest.value) {
      scrollToBottom();
    } else {
      newMessagesAvailable.value = true;
    }
  };

  if (autoListen) {
    onMounted(() => {
      containerRef.value?.addEventListener('scroll', updateFollowState);
    });

    onBeforeUnmount(() => {
      containerRef.value?.removeEventListener('scroll', updateFollowState);
    });
  }

  return {
    isFollowingLatest,
    newMessagesAvailable,
    scrollToBottom,
    onNewMessage,
    updateFollowState,
  };
}
