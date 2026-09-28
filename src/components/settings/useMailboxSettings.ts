import { ref } from 'vue';
import { accountApi } from '@/api';
import { useAuthStore } from '@/stores/auth';
import type { MailboxSettingsPayload } from '@/types/api';

/**
 * Shared helper for the settings cards: PUT partial settings, refresh the store.
 */
export function useMailboxSettings() {
  const auth = useAuthStore();
  const busy = ref(false);

  async function update(payload: Partial<MailboxSettingsPayload>) {
    busy.value = true;
    try {
      auth.mailbox = await accountApi.updateSettings(payload);
    } finally {
      busy.value = false;
    }
  }

  return { busy, update };
}
