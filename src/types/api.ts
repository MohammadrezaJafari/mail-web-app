export interface User {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'organization_owner' | 'mail_admin' | 'user';
  last_login_at: string | null;
}

export interface AliasSummary {
  id: number;
  address: string;
  is_active: boolean;
  created_at?: string;
}

export interface Mailbox {
  id: number;
  address: string;
  name: string;
  domain: string;
  status: 'active' | 'suspended';
  is_shared: boolean;
  quota_mb: number;
  quota_bytes: number;
  used_bytes: number;
  usage_percent: number;
  message_count: number;
  usage_synced_at: string | null;
  aliases: AliasSummary[];
  forwarding_to: string[];
  forwarding_keep_copy: boolean;
  auto_reply_enabled: boolean;
  auto_reply_subject: string | null;
  auto_reply_body: string | null;
  auto_reply_starts_at: string | null;
  auto_reply_ends_at: string | null;
  signature: string | null;
}

export interface SharedMailbox {
  id: number;
  address: string;
  name: string;
  role: string;
}

export interface MeResponse {
  user: User;
  mailbox: Mailbox | null;
  shared_mailboxes: SharedMailbox[];
  webmail_url: string;
}

export type FolderRole = 'inbox' | 'drafts' | 'sent' | 'junk' | 'trash' | 'archive' | null;

export interface Folder {
  path: string;
  name: string;
  role: FolderRole;
  unread: number;
  total: number;
  uidnext: number;
  uidvalidity: number;
  delimiter: string;
}

export interface Address {
  name: string;
  email: string;
}

export interface MessageSummary {
  uid: number;
  folder: string;
  subject: string;
  from: Address | null;
  to: Address[];
  date: string | null;
  preview: string;
  seen: boolean;
  flagged: boolean;
  answered: boolean;
  has_attachments: boolean;
  size: number;
  message_id: string;
  in_reply_to: string;
  references: string[];
}

export interface Attachment {
  id: string;
  name: string;
  content_type: string;
  size: number;
  content_id: string | null;
  inline: boolean;
}

export interface MessageDetail extends MessageSummary {
  cc: Address[];
  bcc: Address[];
  reply_to: Address[];
  html: string | null;
  text: string | null;
  attachments: Attachment[];
}

export interface MessagePage {
  data: MessageSummary[];
  page: number;
  per_page: number;
  total: number;
}

export type MessageFilter = 'unread' | 'flagged' | 'attachments' | null;

export interface MailboxSettingsPayload {
  forwarding_to: string[];
  forwarding_keep_copy: boolean;
  auto_reply_enabled: boolean;
  auto_reply_subject: string | null;
  auto_reply_body: string | null;
  auto_reply_starts_at: string | null;
  auto_reply_ends_at: string | null;
  signature: string | null;
}

export interface ComposeDraft {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  html: string;
  from_alias?: string | null;
  in_reply_to?: string | null;
  references?: string | null;
  reply_folder?: string | null;
  reply_uid?: number | null;
  attachments: File[];
}

export interface Thread {
  key: string;
  subject: string;
  messages: MessageSummary[]; // newest first
  latest: MessageSummary;
  participants: Address[];
  unread: number;
  flagged: boolean;
  has_attachments: boolean;
}

export interface ContactSuggestion {
  email: string;
  name: string | null;
  source: 'personal' | 'directory';
}

export interface FolderNode extends Folder {
  label: string;
  depth: number;
  children: FolderNode[];
}

export interface SearchCriteria {
  from: string;
  to: string;
  subject: string;
  since: string;
  before: string;
}

export type RuleField = 'from' | 'to' | 'subject' | 'body' | 'size_over' | 'has_attachment';
export type RuleOperator = 'contains' | 'not_contains' | 'is' | 'starts' | 'ends';
export type RuleActionType = 'move' | 'flag' | 'mark_read' | 'forward' | 'discard' | 'stop';

export interface RuleCondition {
  field: RuleField;
  operator: RuleOperator;
  value: string;
}

export interface RuleAction {
  type: RuleActionType;
  value: string;
}

export interface MailRule {
  id?: string;
  name: string;
  enabled: boolean;
  match: 'all' | 'any';
  conditions: RuleCondition[];
  actions: RuleAction[];
}
