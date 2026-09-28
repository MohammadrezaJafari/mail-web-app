import { defineStore, acceptHMRUpdate } from 'pinia';
import { accountApi, authApi, contactsApi } from '@/api';
import { getToken, setToken } from '@/boot/axios';
import type { Mailbox, SharedMailbox, User } from '@/types/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getToken(),
    user: null as User | null,
    mailbox: null as Mailbox | null,
    sharedMailboxes: [] as SharedMailbox[],
    webmailUrl: '',
    loaded: false,
  }),

  getters: {
    isAuthenticated: (s) => Boolean(s.token),
    initials: (s) => {
      const parts = (s.user?.name ?? s.user?.email ?? '?').split(/[\s@.]+/).filter(Boolean);
      return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
    },
  },

  actions: {
    async login(email: string, password: string) {
      const { token, user } = await authApi.login(email, password);
      this.token = token;
      this.user = user;
      setToken(token);
      await this.loadMe();
      contactsApi.sync().catch(() => undefined);
    },

    async loadMe() {
      const me = await accountApi.me();
      this.user = me.user;
      this.mailbox = me.mailbox;
      this.sharedMailboxes = me.shared_mailboxes;
      this.webmailUrl = me.webmail_url;
      this.loaded = true;
    },

    async refreshMailbox() {
      this.mailbox = await accountApi.mailbox();
    },

    async logout() {
      try {
        await authApi.logout();
      } catch {
        /* token may already be invalid */
      }
      this.$reset();
      setToken(null);
    },

    clear() {
      this.$reset();
      setToken(null);
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
