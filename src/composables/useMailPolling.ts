import { onBeforeUnmount, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMailStore } from '@/stores/mail';
import { notifyNewMail } from '@/utils/notifications';
import { APP_NAME } from '@/utils/format';

const VISIBLE_INTERVAL = 20_000;
const HIDDEN_INTERVAL = 60_000;

/**
 * Keeps the mailbox fresh without IMAP IDLE: polls folder status on an
 * interval that slows down when the tab is hidden, fires desktop
 * notifications for new mail and mirrors the unread count in the title.
 */
export function useMailPolling() {
  const mail = useMailStore();
  const { t } = useI18n();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  async function tick() {
    if (stopped) return;
    try {
      const arrived = await mail.poll();
      if (arrived.length) {
        notifyNewMail(
          arrived,
          {
            title: APP_NAME,
            summary: (n) => t('notify.newMessages', { n }),
            noSubject: t('mail.noSubject'),
          },
          (uid) => void mail.open(uid),
        );
      }
    } catch {
      /* transient errors are ignored; next tick retries */
    } finally {
      schedule();
    }
  }

  function schedule() {
    if (stopped) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(
      () => void tick(),
      document.visibilityState === 'visible' ? VISIBLE_INTERVAL : HIDDEN_INTERVAL,
    );
  }

  function onVisibility() {
    if (document.visibilityState === 'visible') {
      if (timer) clearTimeout(timer);
      void tick();
    }
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibility);
    schedule();
  });

  onBeforeUnmount(() => {
    stopped = true;
    if (timer) clearTimeout(timer);
    document.removeEventListener('visibilitychange', onVisibility);
    document.title = APP_NAME;
  });

  watch(
    () => mail.unreadInbox,
    (n) => {
      document.title = n > 0 ? `(${n}) ${APP_NAME}` : APP_NAME;
    },
    { immediate: true },
  );
}
