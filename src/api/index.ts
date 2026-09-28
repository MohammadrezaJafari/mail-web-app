import { api } from '@/boot/axios';
import type {
  AddressBook,
  AliasSummary,
  Calendar,
  CalendarEvent,
  Contact,
  ContactPayload,
  EventPayload,
  ContactSuggestion,
  ComposeDraft,
  Folder,
  Mailbox,
  MailboxSettingsPayload,
  MailRule,
  ScheduledMessage,
  SearchCriteria,
  SnoozedItem,
  MeResponse,
  MessageDetail,
  MessageFilter,
  MessagePage,
  User,
} from '@/types/api';

export const authApi = {
  login: (email: string, password: string) =>
    api
      .post<{ token: string; user: User }>('/auth/login', { email, password, device: 'web-app' })
      .then((r) => r.data),
  logout: () => api.post('/auth/logout'),
};

export const accountApi = {
  me: () => api.get<MeResponse>('/me').then((r) => r.data),
  mailbox: () => api.get<{ data: Mailbox }>('/me/mailbox').then((r) => r.data.data),
  updateSettings: (payload: Partial<MailboxSettingsPayload>) =>
    api.put<{ data: Mailbox }>('/me/mailbox/settings', payload).then((r) => r.data.data),
  changePassword: (current_password: string, password: string, password_confirmation: string) =>
    api.put('/me/password', { current_password, password, password_confirmation }),
  aliases: () => api.get<{ data: AliasSummary[] }>('/me/aliases').then((r) => r.data.data),
  createAlias: (local_part: string) =>
    api.post<{ data: AliasSummary }>('/me/aliases', { local_part }).then((r) => r.data.data),
  deleteAlias: (id: number) => api.delete(`/me/aliases/${id}`),
  webmail: () => api.get<{ url: string }>('/me/webmail').then((r) => r.data.url),
  rules: () => api.get<{ data: MailRule[] }>('/me/mailbox/rules').then((r) => r.data.data),
  saveRules: (rules: MailRule[]) =>
    api.put<{ data: MailRule[] }>('/me/mailbox/rules', { rules }).then((r) => r.data.data),
};

export const contactsApi = {
  search: (q: string, limit = 8) =>
    api
      .get<{ data: ContactSuggestion[] }>('/contacts', { params: { q: q || undefined, limit } })
      .then((r) => r.data.data),
  sync: (force = false) =>
    api.post<{ synced: boolean }>('/contacts/sync', { force }).then((r) => r.data),
};

export const mailApi = {
  folders: () => api.get<{ data: Folder[] }>('/mail/folders').then((r) => r.data.data),
  createFolder: (name: string, parent?: string | null) =>
    api
      .post<{ data: Folder[] }>('/mail/folders', { name, parent: parent || undefined })
      .then((r) => r.data.data),
  renameFolder: (path: string, name: string) =>
    api.put<{ data: Folder[] }>('/mail/folders', { path, name }).then((r) => r.data.data),
  deleteFolder: (path: string) =>
    api.delete<{ data: Folder[] }>('/mail/folders', { data: { path } }).then((r) => r.data.data),
  messages: (
    folder: string,
    page = 1,
    search = '',
    filter: MessageFilter = null,
    per_page = 25,
    criteria?: Partial<SearchCriteria>,
  ) =>
    api
      .get<MessagePage>('/mail/messages', {
        params: {
          folder,
          page,
          per_page,
          search: search || undefined,
          filter: filter ?? undefined,
          from: criteria?.from || undefined,
          to: criteria?.to || undefined,
          subject: criteria?.subject || undefined,
          since: criteria?.since || undefined,
          before: criteria?.before || undefined,
        },
      })
      .then((r) => r.data),
  messagesSince: (folder: string, sinceUid: number) =>
    api
      .get<MessagePage>('/mail/messages', { params: { folder, since_uid: sinceUid, per_page: 50 } })
      .then((r) => r.data),
  message: (folder: string, uid: number, markSeen = true) =>
    api
      .get<{ data: MessageDetail }>(`/mail/messages/${uid}`, {
        params: { folder, mark_seen: markSeen ? 1 : 0 },
      })
      .then((r) => r.data.data),
  attachmentUrl: (folder: string, uid: number, attachmentId: string) =>
    `${api.defaults.baseURL}/mail/messages/${uid}/attachments/${attachmentId}?folder=${encodeURIComponent(folder)}`,
  downloadAttachment: (folder: string, uid: number, attachmentId: string) =>
    api.get<Blob>(`/mail/messages/${uid}/attachments/${attachmentId}`, {
      params: { folder },
      responseType: 'blob',
    }),
  flags: (folder: string, uids: number[], flags: { seen?: boolean; flagged?: boolean }) =>
    api.post('/mail/messages/flags', { folder, uids, ...flags }),
  move: (folder: string, uids: number[], to: string) =>
    api.post('/mail/messages/move', { folder, uids, to }),
  delete: (folder: string, uids: number[]) => api.post('/mail/messages/delete', { folder, uids }),
  send: (draft: ComposeDraft) => api.post('/mail/send', toFormData(draft)),
  saveDraft: (draft: ComposeDraft) => api.post('/mail/drafts', toFormData(draft)),
  schedule: (draft: ComposeDraft, sendAt: string) => {
    const fd = toFormData(draft);
    fd.append('send_at', sendAt);
    return api.post<{ data: ScheduledMessage }>('/mail/scheduled', fd).then((r) => r.data.data);
  },
  scheduled: () =>
    api.get<{ data: ScheduledMessage[] }>('/mail/scheduled').then((r) => r.data.data),
  cancelScheduled: (id: number) => api.delete(`/mail/scheduled/${id}`),
  snooze: (
    folder: string,
    messages: Array<{ uid: number; message_id?: string; subject?: string }>,
    until: string,
  ) => api.post('/mail/snooze', { folder, messages, until }),
  snoozed: () => api.get<{ data: SnoozedItem[] }>('/mail/snoozed').then((r) => r.data.data),
};

function toFormData(draft: ComposeDraft): FormData {
  const fd = new FormData();
  draft.to.forEach((a) => fd.append('to[]', a));
  draft.cc.forEach((a) => fd.append('cc[]', a));
  draft.bcc.forEach((a) => fd.append('bcc[]', a));
  fd.append('subject', draft.subject);
  fd.append('html', draft.html);
  if (draft.from_alias) fd.append('from_alias', draft.from_alias);
  if (draft.in_reply_to) fd.append('in_reply_to', draft.in_reply_to);
  if (draft.references) fd.append('references', draft.references);
  if (draft.reply_folder) fd.append('reply_folder', draft.reply_folder);
  if (draft.reply_uid) fd.append('reply_uid', String(draft.reply_uid));
  draft.attachments.forEach((f) => fd.append('attachments[]', f, f.name));
  return fd;
}

export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const e = error as {
    response?: { data?: { message?: string; errors?: Record<string, string[]> } };
  };
  const errors = e?.response?.data?.errors;
  if (errors) {
    const first = Object.values(errors)[0];
    if (first?.[0]) return first[0];
  }
  return e?.response?.data?.message ?? fallback;
}

export const calendarApi = {
  calendars: () => api.get<{ data: Calendar[] }>('/calendar/calendars').then((r) => r.data.data),
  events: (start: string, end: string, calendar?: string | null) =>
    api
      .get<{ data: CalendarEvent[]; calendars: Calendar[] }>('/calendar/events', {
        params: { start, end, calendar: calendar || undefined },
      })
      .then((r) => r.data),
  create: (payload: EventPayload) =>
    api.post<{ data: CalendarEvent }>('/calendar/events', payload).then((r) => r.data.data),
  update: (id: string, payload: EventPayload) =>
    api.put<{ data: CalendarEvent }>(`/calendar/events/${id}`, payload).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/calendar/events/${id}`),
};

export const addressBookApi = {
  books: () => api.get<{ data: AddressBook[] }>('/addressbook/books').then((r) => r.data.data),
  contacts: (q = '', book?: string | null) =>
    api
      .get<{ data: Contact[]; books: AddressBook[] }>('/addressbook/contacts', {
        params: { q: q || undefined, book: book || undefined },
      })
      .then((r) => r.data),
  create: (payload: ContactPayload) =>
    api.post<{ data: Contact }>('/addressbook/contacts', payload).then((r) => r.data.data),
  update: (id: string, payload: ContactPayload) =>
    api.put<{ data: Contact }>(`/addressbook/contacts/${id}`, payload).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/addressbook/contacts/${id}`),
};
