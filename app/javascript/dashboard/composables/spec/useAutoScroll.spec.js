import { ref } from 'vue';
import { useAutoScroll } from 'dashboard/composables/useAutoScroll';

const createContainerRef = (opts = {}) => {
  const el = document.createElement('div');
  el.scrollTop = opts.scrollTop ?? 0;

  Object.defineProperty(el, 'clientHeight', {
    get() {
      return opts.clientHeight ?? 400;
    },
    configurable: true,
  });
  Object.defineProperty(el, 'scrollHeight', {
    get() {
      return opts.scrollHeight ?? 800;
    },
    configurable: true,
  });

  return ref(el);
};

describe('useAutoScroll', () => {
  let containerRef;

  beforeEach(() => {
    containerRef = createContainerRef();
    document.body.appendChild(containerRef.value);
  });

  afterEach(() => {
    if (containerRef?.value && containerRef.value.parentNode) {
      document.body.removeChild(containerRef.value);
    }
  });

  it('should initialize with isFollowingLatest true and newMessagesAvailable false', () => {
    const { isFollowingLatest, newMessagesAvailable } = useAutoScroll(
      containerRef,
      { autoListen: false }
    );

    expect(isFollowingLatest.value).toBe(true);
    expect(newMessagesAvailable.value).toBe(false);
  });

  it('should scroll to bottom and reset flags when scrollToBottom is called', async () => {
    const { isFollowingLatest, newMessagesAvailable, scrollToBottom } =
      useAutoScroll(containerRef, { autoListen: false });

    newMessagesAvailable.value = true;
    isFollowingLatest.value = false;

    await scrollToBottom();

    expect(containerRef.value.scrollTop).toBe(800);
    expect(isFollowingLatest.value).toBe(true);
    expect(newMessagesAvailable.value).toBe(false);
  });

  it('should auto-scroll when onNewMessage is called and following', async () => {
    const { isFollowingLatest, newMessagesAvailable, onNewMessage } =
      useAutoScroll(containerRef, { autoListen: false });

    await onNewMessage();

    expect(containerRef.value.scrollTop).toBe(800);
    expect(isFollowingLatest.value).toBe(true);
    expect(newMessagesAvailable.value).toBe(false);
  });

  it('should not auto-scroll but set newMessagesAvailable when onNewMessage is called while not following', async () => {
    const { isFollowingLatest, newMessagesAvailable, onNewMessage } =
      useAutoScroll(containerRef, { autoListen: false });

    isFollowingLatest.value = false;

    await onNewMessage();

    expect(containerRef.value.scrollTop).toBe(0);
    expect(newMessagesAvailable.value).toBe(true);
  });

  it('should set isFollowingLatest to false when scrolled up via updateFollowState', () => {
    const { isFollowingLatest, updateFollowState } = useAutoScroll(
      containerRef,
      { autoListen: false }
    );

    containerRef.value.scrollTop = 0;

    updateFollowState();

    expect(isFollowingLatest.value).toBe(false);
  });

  it('should set isFollowingLatest to true when near bottom via updateFollowState', () => {
    const { isFollowingLatest, newMessagesAvailable, updateFollowState } =
      useAutoScroll(containerRef, { autoListen: false });

    newMessagesAvailable.value = true;
    isFollowingLatest.value = false;

    containerRef.value.scrollTop =
      containerRef.value.scrollHeight - containerRef.value.clientHeight;

    updateFollowState();

    expect(isFollowingLatest.value).toBe(true);
    expect(newMessagesAvailable.value).toBe(false);
  });

  it('should consider within threshold as following', () => {
    const { updateFollowState, isFollowingLatest } = useAutoScroll(
      containerRef,
      { autoListen: false }
    );

    containerRef.value.scrollTop =
      containerRef.value.scrollHeight - containerRef.value.clientHeight - 100;

    updateFollowState();

    expect(isFollowingLatest.value).toBe(true);
  });

  it('should consider beyond threshold as not following', () => {
    const { updateFollowState, isFollowingLatest } = useAutoScroll(
      containerRef,
      { autoListen: false }
    );

    containerRef.value.scrollTop = 0;

    updateFollowState();

    expect(isFollowingLatest.value).toBe(false);
  });

  it('should handle null containerRef gracefully', async () => {
    const nullRef = ref(null);
    const {
      isFollowingLatest,
      newMessagesAvailable,
      onNewMessage,
      updateFollowState,
    } = useAutoScroll(nullRef, { autoListen: false });

    updateFollowState();
    expect(isFollowingLatest.value).toBe(true);

    await onNewMessage();
    expect(isFollowingLatest.value).toBe(true);
    expect(newMessagesAvailable.value).toBe(false);
  });

  it('should resume following and clear newMessagesAvailable on scrollToBottom after messages arrived', async () => {
    const {
      isFollowingLatest,
      newMessagesAvailable,
      onNewMessage,
      scrollToBottom,
      updateFollowState,
    } = useAutoScroll(containerRef, { autoListen: false });

    containerRef.value.scrollTop = 0;
    updateFollowState();

    expect(isFollowingLatest.value).toBe(false);

    await onNewMessage();
    expect(newMessagesAvailable.value).toBe(true);
    expect(isFollowingLatest.value).toBe(false);

    await scrollToBottom();
    expect(isFollowingLatest.value).toBe(true);
    expect(newMessagesAvailable.value).toBe(false);
  });
});
