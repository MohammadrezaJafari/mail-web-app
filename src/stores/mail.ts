import { defineStore, acceptHMRUpdate } from 'pinia';
import { mailApi } from '@/api';
import type { Folder, FolderRole, MessageDetail, MessageFilter, MessageSummary } from '@/types/api';

const PER_PAGE = 25;

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
    currentLoading: false,
    error: null as string | null,
  }),

  getters: {
    folderByRole: (s) => (role: FolderRole) => s.folders.find((f) => f.role === role),
    folder: (s) => s.folders.find((f) => f.path === s.currentFolder),
    hasMore: (s) => s.messages.length < s.total,
    unreadInbox: (s) => s.folders.find((f) => f.role === 'inbox')?.unread ?? 0,
  },

  actions: {
    async loadFolders() {
      this.foldersLoading = true;
      try {
        this.folders = await mailApi.folders();
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
      try {
        const wasUnread = !this.messages.find((m) => m.uid === uid)?.seen;
        this.current = await mailApi.message(this.currentFolder, uid, true);
        this.patch(uid, { seen: true });
        if (wasUnread) this.adjustUnread(this.currentFolder, -1);
      } finally {
        this.currentLoading = false;
      }
    },

    patch(uid: number, changes: Partial<MessageSummary>) {
      const item = this.messages.find((m) => m.uid === uid);
      if (item) Object.assign(item, changes);
      if (this.current?.uid === uid) Object.assign(this.current, changes);
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
      if (this.current && uids.includes(this.current.uid)) this.current = null;
      this.adjustUnread(this.currentFolder, -unread);
    },

    async refresh() {
      await Promise.all([this.loadFolders(), this.loadMessages(true)]);
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMailStore, import.meta.hot));
}
