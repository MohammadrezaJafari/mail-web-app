import { defineStore, acceptHMRUpdate } from 'pinia';
import { LocalStorage } from 'quasar';
import { mailApi } from '@/api';
import { buildThreads } from '@/utils/threads';
import type {
  Folder,
  FolderRole,
  MessageDetail,
  MessageFilter,
  MessageSummary,
  Thread,
} from '@/types/api';

const PER_PAGE = 25;
const CONVERSATION_KEY = 'mail.conversationView';

function emptyUidMap(): Record<string, number> {
  return {};
}

export const useMailStore = defineStore('mail', {
  state: () => ({
    folders: [] as Folder[],
    foldersLoading: false,
    currentFolder: '',
    messages: [] as MessageSummary[],
    total: 0,
    page: 1,
    listLoading: false,
    search: '',
    filter: null as MessageFilter,
    selectedUids: [] as number[],
    current: null as MessageDetail | null,
    /** Other messages of the open conversation (oldest→newest), excluding `current`. */
    thread: [] as MessageDetail[],
    threadKey: null as string | null,
    currentLoading: false,
    conversationView: LocalStorage.getItem<boolean>(CONVERSATION_KEY) ?? true,
    /** Last seen UIDNEXT per folder, used to detect new mail cheaply. */
    uidNext: emptyUidMap(),
    /** Messages that arrived since the last poll (consumed by the notifier). */
    arrived: [] as MessageSummary[],
    polling: false,
    error: null as string | null,
  }),

  getters: {
    folderByRole: (s) => (role: FolderRole) => s.folders.find((f) => f.role === role),
    folder: (s) => s.folders.find((f) => f.path === s.currentFolder),
    hasMore: (s) => s.messages.length < s.total,
    unreadInbox: (s) => s.folders.find((f) => f.role === 'inbox')?.unread ?? 0,
    threads: (s): Thread[] => (s.conversationView ? buildThreads(s.messages) : []),
  },

  actions: {
    setConversationView(value: boolean) {
      this.conversationView = value;
      LocalStorage.set(CONVERSATION_KEY, value);
      this.current = null;
      this.thread = [];
      this.threadKey = null;
    },

    async loadFolders() {
      this.foldersLoading = true;
      try {
        this.folders = await mailApi.folders();
        for (const f of this.folders) this.uidNext[f.path] = f.uidnext;
        if (!this.currentFolder) {
          this.currentFolder = this.folderByRole('inbox')?.path ?? this.folders[0]?.path ?? 'INBOX';
        }
      } finally {
        this.foldersLoading = false;
      }
    },

    async openFolder(path: string) {
      if (this.currentFolder !== path) {
        this.current = null;
        this.thread = [];
        this.threadKey = null;
        this.selectedUids = [];
      }
      this.currentFolder = path;
      await this.loadMessages(true);
    },

    async loadMessages(reset = false) {
      if (!this.currentFolder) return;
      if (reset) {
        this.page = 1;
        this.messages = [];
        this.total = 0;
      }
      this.listLoading = true;
      try {
        const result = await mailApi.messages(
          this.currentFolder,
          this.page,
          this.search,
          this.filter,
          PER_PAGE,
        );
        this.messages = reset || this.page === 1 ? result.data : [...this.messages, ...result.data];
        this.total = result.total;
      } finally {
        this.listLoading = false;
      }
    },

    async loadMore() {
      if (this.listLoading || !this.hasMore) return;
      this.page += 1;
      await this.loadMessages(false);
    },

    async setSearch(search: string) {
      this.search = search;
      await this.loadMessages(true);
    },

    async setFilter(filter: MessageFilter) {
      this.filter = filter;
      await this.loadMessages(true);
    },

    async open(uid: number) {
      this.currentLoading = true;
      this.selectedUids = [uid];
      this.thread = [];
      this.threadKey = null;
      try {
        const wasUnread = !this.messages.find((m) => m.uid === uid)?.seen;
        this.current = await mailApi.message(this.currentFolder, uid, true);
        this.patch(uid, { seen: true });
        if (wasUnread) this.adjustUnread(this.currentFolder, -1);
      } finally {
        this.currentLoading = false;
      }
    },

    /** Open a conversation: the newest message is `current`, older ones are loaded for the stack. */
    async openThread(thread: Thread, maxOlder = 12) {
      this.currentLoading = true;
      this.threadKey = thread.key;
      this.selectedUids = thread.messages.map((m) => m.uid);
      this.thread = [];
      try {
        const latest = thread.latest;
        const wasUnread = !latest.seen;
        this.current = await mailApi.message(this.currentFolder, latest.uid, true);
        this.patch(latest.uid, { seen: true });
        if (wasUnread) this.adjustUnread(this.currentFolder, -1);

        const older = thread.messages.slice(1, 1 + maxOlder);
        const details = await Promise.all(
          older.map((m) => mailApi.message(this.currentFolder, m.uid, false)),
        );
        this.thread = details.reverse(); // oldest first
      } finally {
        this.currentLoading = false;
      }
    },

    patch(uid: number, changes: Partial<MessageSummary>) {
      const item = this.messages.find((m) => m.uid === uid);
      if (item) Object.assign(item, changes);
      if (this.current?.uid === uid) Object.assign(this.current, changes);
      const inThread = this.thread.find((m) => m.uid === uid);
      if (inThread) Object.assign(inThread, changes);
    },

    adjustUnread(path: string, delta: number) {
      const folder = this.folders.find((f) => f.path === path);
      if (folder) folder.unread = Math.max(0, folder.unread + delta);
    },

    async markSeen(uids: number[], seen: boolean) {
      await mailApi.flags(this.currentFolder, uids, { seen });
      let delta = 0;
      uids.forEach((uid) => {
        const item = this.messages.find((m) => m.uid === uid);
        if (item && item.seen !== seen) delta += seen ? -1 : 1;
        this.patch(uid, { seen });
      });
      this.adjustUnread(this.currentFolder, delta);
    },

    async toggleFlag(uid: number) {
      const item = this.messages.find((m) => m.uid === uid) ?? this.current;
      const flagged = !item?.flagged;
      await mailApi.flags(this.currentFolder, [uid], { flagged });
      this.patch(uid, { flagged });
    },

    async remove(uids: number[]) {
      await mailApi.delete(this.currentFolder, uids);
      this.dropLocal(uids);
      await this.loadFolders();
    },

    async move(uids: number[], to: string) {
      await mailApi.move(this.currentFolder, uids, to);
      this.dropLocal(uids);
      await this.loadFolders();
    },

    dropLocal(uids: number[]) {
      const unread = this.messages.filter((m) => uids.includes(m.uid) && !m.seen).length;
      this.messages = this.messages.filter((m) => !uids.includes(m.uid));
      this.total = Math.max(0, this.total - uids.length);
      this.selectedUids = this.selectedUids.filter((u) => !uids.includes(u));
      this.thread = this.thread.filter((m) => !uids.includes(m.uid));
      if (this.current && uids.includes(this.current.uid)) {
        this.current = this.thread.pop() ?? null;
      }
      this.adjustUnread(this.currentFolder, -unread);
    },

    async refresh() {
      await Promise.all([this.loadFolders(), this.loadMessages(true)]);
    },

    /**
     * Lightweight poll: one STATUS per folder. When the open folder gained
     * messages, fetch just those (UID range) and prepend them to the list.
     * Returns the newly arrived messages of the current folder.
     */
    async poll(): Promise<MessageSummary[]> {
      if (this.polling || !this.currentFolder) return [];
      this.polling = true;
      try {
        const folders = await mailApi.folders();
        const previous = { ...this.uidNext };
        this.folders = folders;
        for (const f of folders) this.uidNext[f.path] = f.uidnext;

        const current = folders.find((f) => f.path === this.currentFolder);
        const since = previous[this.currentFolder];
        if (!current || !since || current.uidnext <= since) return [];

        const fresh = await mailApi.messagesSince(this.currentFolder, since);
        const known = new Set(this.messages.map((m) => m.uid));
        const added = fresh.data.filter((m) => !known.has(m.uid));
        if (added.length && !this.search && !this.filter) {
          this.messages = [...added, ...this.messages];
          this.total += added.length;
        }
        this.arrived = added;
        return added;
      } finally {
        this.polling = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMailStore, import.meta.hot));
}
