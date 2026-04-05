<script setup>
import { useI18n } from 'vue-i18n';
import { ref, watch } from 'vue';
import Avatar from 'dashboard/components-next/avatar/Avatar.vue';
import { useMessageFormatter } from 'shared/composables/useMessageFormatter';
import { useAutoScroll } from 'dashboard/composables/useAutoScroll';

const props = defineProps({
  messages: {
    type: Array,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
});

const messageContainer = ref(null);

const { t } = useI18n();
const { formatMessage } = useMessageFormatter();

const {
  isFollowingLatest,
  newMessagesAvailable,
  scrollToBottom,
  onNewMessage,
} = useAutoScroll(messageContainer);

const isUserMessage = sender => sender === 'user';

const getMessageAlignment = sender =>
  isUserMessage(sender) ? 'justify-end' : 'justify-start';

const getMessageDirection = sender =>
  isUserMessage(sender) ? 'flex-row-reverse' : 'flex-row';

const getAvatarName = sender =>
  isUserMessage(sender)
    ? t('CAPTAIN.PLAYGROUND.USER')
    : t('CAPTAIN.PLAYGROUND.ASSISTANT');

const getMessageStyle = sender =>
  isUserMessage(sender)
    ? 'bg-n-solid-blue text-n-slate-12 rounded-br-sm rounded-bl-xl rounded-t-xl'
    : 'bg-n-solid-iris text-n-slate-12 rounded-bl-sm rounded-br-xl rounded-t-xl';

watch(() => props.messages.length, onNewMessage);
</script>

<template>
  <div
    ref="messageContainer"
    class="flex-1 overflow-y-auto mb-4 px-6 space-y-6"
  >
    <div
      v-for="(message, index) in messages"
      :key="index"
      class="flex"
      :class="getMessageAlignment(message.sender)"
    >
      <div
        class="flex items-end gap-1.5 max-w-[90%] md:max-w-[60%]"
        :class="getMessageDirection(message.sender)"
      >
        <Avatar
          :name="getAvatarName(message.sender)"
          rounded-full
          :size="24"
          class="shrink-0"
        />
        <div
          class="px-4 py-3 text-sm [overflow-wrap:break-word]"
          :class="getMessageStyle(message.sender)"
        >
          <div v-html="formatMessage(message.content)" />
        </div>
      </div>
    </div>
    <div v-if="isLoading" class="flex justify-start">
      <div class="flex items-start gap-1.5">
        <Avatar :name="getAvatarName('assistant')" rounded-full :size="24" />
        <div
          class="max-w-sm rounded-lg p-3 text-sm bg-n-solid-iris text-n-slate-12"
        >
          <div class="flex gap-1">
            <div class="w-2 h-2 rounded-full bg-n-iris-10 animate-bounce" />
            <div
              class="w-2 h-2 rounded-full bg-n-iris-10 animate-bounce [animation-delay:0.2s]"
            />
            <div
              class="w-2 h-2 rounded-full bg-n-iris-10 animate-bounce [animation-delay:0.4s]"
            />
          </div>
        </div>
      </div>
    </div>
    <transition name="slide-up">
      <button
        v-if="!isFollowingLatest && newMessagesAvailable"
        class="shadow-lg rounded-full bg-n-brand text-white text-xs font-medium px-3 py-1.5 flex items-center gap-1 hover:bg-n-brand-hover transition-colors mx-auto"
        @click="scrollToBottom"
      >
        <span class="i-lucide-chevron-down text-sm" />
        {{ t('CONVERSATION.SCROLL_TO_BOTTOM') }}
      </button>
    </transition>
  </div>
</template>
