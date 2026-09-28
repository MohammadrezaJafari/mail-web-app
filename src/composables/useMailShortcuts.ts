import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useMailStore } from '@/stores/mail';
import { useComposeStore } from '@/stores/compose';
import type { Thread } from '@/types/api';

export interface ShortcutHandlers {
  openThread: (thread: Thread) => Promise<void>;
  openMessage: (uid: number) => Promise<void>;
  remove: () => void;
  archive: () => void;
  focusSearch: () => void;
}

/**
 * Outlook / Gmail style keyboard shortcuts. Ignored while typing in a field
 * or while the compose window is open.
 */
export function useMailShortcuts(handlers: ShortcutHandlers) {
  const mail = useMailStore();
  const compose = useComposeStore();
  const helpOpen = ref(false);

  function isTyping(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
  }

  function currentIndex(): number {
    if (mail.conversationView) return mail.threads.findIndex((t) => t.key === mail.threadKey);
    return mail.messages.findIndex((m) => m.uid === mail.current?.uid);
  }

  async function moveSelection(delta: number) {
    const list = mail.conversationView ? mail.threads : mail.messages;
    if (!list.length) return;
    const next = Math.min(list.length - 1, Math.max(0, currentIndex() + delta));
    if (mail.conversationView) await handlers.openThread(mail.threads[next]!);
    else await handlers.openMessage(mail.messages[next]!.uid);
  }

  async function onKey(e: KeyboardEvent) {
    if (compose.open || isTyping(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;

    if (helpOpen.value) {
      if (e.key === 'Escape' || e.key === '?') helpOpen.value = false;
      return;
    }

    const current = mail.current;
    switch (e.key) {
      case '?':
        helpOpen.value = true;
        break;
      case '/':
        e.preventDefault();
        handlers.focusSearch();
        break;
      case 'c':
      case 'n':
        compose.start({ mode: 'new' });
        break;
      case 'r':
        if (current) compose.start({ mode: 'reply', source: current });
        break;
      case 'a':
        if (current) compose.start({ mode: 'replyAll', source: current });
        break;
      case 'f':
        if (current) compose.start({ mode: 'forward', source: current });
        break;
      case 'Delete':
      case '#':
        if (current) handlers.remove();
        break;
      case 'e':
        if (current) handlers.archive();
        break;
      case 'u':
        if (current) await mail.markSeen([current.uid], !current.seen);
        break;
      case 's':
        if (current) await mail.toggleFlag(current.uid);
        break;
      case 'j':
      case 'ArrowDown':
        e.preventDefault();
        await moveSelection(1);
        break;
      case 'k':
      case 'ArrowUp':
        e.preventDefault();
        await moveSelection(-1);
        break;
      case 'Escape':
        mail.current = null;
        mail.thread = [];
        mail.threadKey = null;
        mail.selectedUids = [];
        break;
      default:
        return;
    }
  }

  const listener = (e: KeyboardEvent) => void onKey(e);
  onMounted(() => document.addEventListener('keydown', listener));
  onBeforeUnmount(() => document.removeEventListener('keydown', listener));

  return { helpOpen };
}
