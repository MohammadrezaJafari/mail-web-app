import { defineStore, acceptHMRUpdate } from 'pinia';
import type { ComposeDraft, MessageDetail } from '@/types/api';

export type ComposeMode = 'new' | 'reply' | 'replyAll' | 'forward';

export interface ComposeRequest {
  mode: ComposeMode;
  source?: MessageDetail | null;
  to?: string[];
  /** Restore a previously composed draft (undo send). */
  restore?: ComposeDraft | null;
}

export const useComposeStore = defineStore('compose', {
  state: () => ({
    open: false,
    minimized: false,
    request: null as ComposeRequest | null,
  }),

  actions: {
    start(request: ComposeRequest) {
      this.request = request;
      this.open = true;
      this.minimized = false;
    },
    close() {
      this.open = false;
      this.minimized = false;
      this.request = null;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useComposeStore, import.meta.hot));
}
