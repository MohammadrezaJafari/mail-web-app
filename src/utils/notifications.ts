import { LocalStorage } from 'quasar';
import type { MessageSummary } from '@/types/api';
import { displayName } from '@/utils/format';

const KEY = 'mail.notifications';

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationsEnabled(): boolean {
  return (
    notificationsSupported() &&
    Notification.permission === 'granted' &&
    (LocalStorage.getItem<boolean>(KEY) ?? false)
  );
}

export async function setNotificationsEnabled(enabled: boolean): Promise<boolean> {
  if (!enabled) {
    LocalStorage.set(KEY, false);
    return false;
  }
  if (!notificationsSupported()) return false;
  const permission =
    Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  const ok = permission === 'granted';
  LocalStorage.set(KEY, ok);
  return ok;
}

/** Show one notification per message (max 3), or a summary when more arrived. */
export function notifyNewMail(
  messages: MessageSummary[],
  texts: { title: string; summary: (n: number) => string; noSubject: string },
  onClick?: (uid: number) => void,
): void {
  if (!notificationsEnabled() || !messages.length || document.visibilityState === 'visible') return;

  const show = (title: string, body: string, uid?: number) => {
    try {
      const n = new Notification(title, {
        body,
        icon: '/icons/favicon-128x128.png',
        tag: uid ? `mail-${uid}` : 'mail-summary',
      });
      n.onclick = () => {
        window.focus();
        if (uid && onClick) onClick(uid);
        n.close();
      };
    } catch {
      /* notifications blocked at OS level */
    }
  };

  if (messages.length > 3) {
    show(texts.title, texts.summary(messages.length));
    return;
  }
  for (const m of messages)
    show(displayName(m.from) || texts.title, m.subject || texts.noSubject, m.uid);
}
